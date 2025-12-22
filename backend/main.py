from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError
from analytics import MarketSimulator, AnalyticsEngine
import asyncio
from typing import List, Optional
import uvicorn
import json
import threading
import queue
import time
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

# Input Validation Models
class OrderModel(BaseModel):
    type: str = Field(..., pattern="^ORDER$")
    side: str = Field(..., pattern="^(buy|sell)$")
    quantity: int = Field(..., gt=0, le=10000) # Max order size 10k to prevent overflow

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Handle potential disconnection during broadcast
                pass

manager = ConnectionManager()

simulator = MarketSimulator()
engine = AnalyticsEngine()

# In-memory buffer for the dashboard
data_buffer = []
MAX_BUFFER = 100

# Thread-safe queue for decoupling simulation from asyncio loop
simulation_queue = queue.Queue()
simulation_running = True

def simulation_loop():
    """Runs in a separate thread to prevent blocking the asyncio loop."""
    global simulation_running
    logger.info("Simulation thread started.")
    
    consecutive_errors = 0
    
    while simulation_running:
        try:
            raw_snapshot = simulator.generate_snapshot()
            processed_snapshot = engine.process_snapshot(raw_snapshot)
            
            # Feature I: Feedback Loop
            # Feed the calculated OFI back into the simulator to drive price changes
            if 'ofi' in processed_snapshot:
                simulator.update_ofi(processed_snapshot['ofi'])
                
            simulation_queue.put(processed_snapshot)
            consecutive_errors = 0 # Reset error count on success
            
            # Simulate processing time without blocking asyncio
            time.sleep(0.1) 
            
        except Exception as e:
            consecutive_errors += 1
            logger.error(f"Simulation Error: {e}")
            
            if consecutive_errors > 10:
                logger.critical("Too many consecutive errors. Simulation thread pausing for 5 seconds.")
                time.sleep(5)
                consecutive_errors = 0 # Try to recover
            else:
                time.sleep(0.1) # Brief pause before retry

@app.on_event("startup")
async def start_generator():
    # Start the simulation thread
    sim_thread = threading.Thread(target=simulation_loop, daemon=True)
    sim_thread.start()
    
    # Start the broadcaster task
    asyncio.create_task(broadcast_loop())

@app.on_event("shutdown")
def stop_generator():
    global simulation_running
    simulation_running = False
    logger.info("Shutting down simulation...")

async def broadcast_loop():
    """Reads from the queue and broadcasts to WebSockets."""
    while True:
        try:
            # Non-blocking get from queue
            while not simulation_queue.empty():
                snapshot = simulation_queue.get_nowait()
                
                data_buffer.append(snapshot)
                if len(data_buffer) > MAX_BUFFER:
                    data_buffer.pop(0)
                
                await manager.broadcast(snapshot)
            
            await asyncio.sleep(0.01) # Check queue frequently
        except Exception as e:
            logger.error(f"Broadcast error: {e}")
            await asyncio.sleep(0.1)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial buffer so client has history immediately
        await websocket.send_json({"type": "history", "data": data_buffer})
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            
            # Feature J: Handle incoming orders
            try:
                # Parse JSON
                try:
                    message_dict = json.loads(data)
                except json.JSONDecodeError:
                    logger.warning("Received invalid JSON from client")
                    continue

                # Validate with Pydantic
                if message_dict.get("type") == "ORDER":
                    try:
                        order = OrderModel(**message_dict)
                        simulator.place_order(order.side, order.quantity)
                        logger.info(f"Order placed: {order.side} {order.quantity}")
                    except ValidationError as ve:
                        logger.warning(f"Invalid order format: {ve}")
                        # Optional: Send error back to client
                        # await websocket.send_json({"type": "error", "message": str(ve)})
                        
            except Exception as e:
                logger.error(f"Unexpected error processing message: {e}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/features")
async def get_features():
    """Returns the latest buffer of time-series data."""
    return data_buffer

@app.get("/anomalies")
async def get_anomalies():
    """Returns a list of timestamps and types for the 'Anomaly Timeline' markers."""
    anomalies_list = []
    for snapshot in data_buffer:
        if snapshot.get("anomalies"):
            for anomaly in snapshot["anomalies"]:
                anomalies_list.append({
                    "timestamp": snapshot["timestamp"],
                    "type": anomaly["type"],
                    "severity": anomaly["severity"],
                    "message": anomaly["message"]
                })
    return anomalies_list

@app.get("/snapshot/latest")
async def get_latest_snapshot():
    """Returns the single latest snapshot for the inspector."""
    if not data_buffer:
        return {}
    return data_buffer[-1]
    """Returns the single latest snapshot for the inspector."""
    if not data_buffer:
        return {}
    return data_buffer[-1]

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
