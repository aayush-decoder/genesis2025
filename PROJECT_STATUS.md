# Genesis 2025: Market Microstructure Simulator

## Project Overview
Genesis 2025 is a high-frequency market simulator designed to model, analyze, and visualize complex market microstructure phenomena. It simulates a Limit Order Book (LOB) in real-time, calculates institutional-grade metrics (OFI, V-PIN), and allows for interactive trading to test price impact models.

---

## 📜 Comprehensive Development Log (Start to Present)

### Phase 1: Foundation & Infrastructure
**Goal:** Establish the communication backbone and basic simulation.
1.  **Backend Setup (FastAPI):**
    *   Created `main.py` with a WebSocket endpoint (`/ws`) to stream data.
    *   Implemented a threaded `simulation_loop` to decouple data generation from API handling.
2.  **Frontend Setup (React + Vite):**
    *   Initialized the project structure.
    *   Built a `Dashboard` component to consume WebSocket data.
3.  **Basic Simulation:**
    *   Created `MarketSimulator` class in `analytics.py`.
    *   Implemented a "Random Walk" price model.
    *   Generated synthetic L2 Depth (Bids and Asks) using Gaussian distributions.

### Phase 2: Quantitative Analytics (The "Brain")
**Goal:** Implement advanced financial metrics to analyze the simulation.
1.  **OFI (Order Flow Imbalance):**
    *   Implemented logic to track changes in Best Bid/Ask and their quantities.
    *   Formula: Calculates net buying/selling pressure at the top of the book.
2.  **Microprice & OBI:**
    *   Added **Microprice** (Volume-Weighted Mid Price) to detect subtle price pressure.
    *   Added **OBI (Order Book Imbalance)** to measure depth asymmetry.
3.  **Regime Detection (Machine Learning):**
    *   Integrated `scikit-learn` KMeans clustering.
    *   The system now classifies market states into "Calm", "Stressed", or "Manipulation" based on volatility and spread.

### Phase 3: Optimization & Visualization Overhaul
**Goal:** Fix performance bottlenecks and improve visual quality.
1.  **The Plotly Problem:**
    *   Initial charts using `react-plotly.js` were too slow (laggy) for high-frequency updates (10 ticks/sec).
2.  **The Canvas Solution:**
    *   **CanvasPriceChart.jsx:** Built a custom HTML5 Canvas chart from scratch.
    *   **CanvasHeatmap.jsx:** Built a custom L2 Depth Heatmap.
    *   **Result:** Achieved smooth 60fps rendering with zero DOM overhead.
    *   **Polish:** Added DPI scaling (Retina support) and precise crosshair interactions.

### Phase 4: Advanced Features & Realism
**Goal:** Make the simulation "real" and interactive.
1.  **Feature I: Endogenous Price Impact:**
    *   **Major Physics Change:** Abandoned the "Random Walk".
    *   **New Logic:** Price now moves *because* of the Order Flow Imbalance (OFI).
    *   Formula: `Price_Change = Impact_Coeff * OFI + Noise`.
2.  **System Hardening:**
    *   Added **Pydantic** validation to prevent bad data from crashing the server.
    *   Added **Error Handling** to the simulation thread to auto-recover from crashes.

### Phase 5: Real Data & HFT Surveillance (Current State)
**Goal:** Transition from simulation to real-world data replay and professional surveillance.
1.  **Real Data Integration:**
    *   **TimescaleDB:** Deployed Dockerized PostgreSQL + TimescaleDB for high-performance time-series storage.
    *   **Data Loader:** Built robust ETL pipeline (`load_l2_data.py`) to handle interleaved CSV L2 data (~1.1GB).
    *   **Hybrid Replay Engine:** Backend now supports 3 modes: `DB_REPLAY` (Primary), `CSV_REPLAY` (Fallback), and `SIMULATION` (Failsafe).
2.  **HFT Analytics Engine Upgrade:**
    *   **Dynamic Baselines:** Replaced hardcoded thresholds with **EWMA (Exponentially Weighted Moving Averages)** for Spread and Volume.
    *   **Weighted OBI:** Implemented exponential decay weighting for Order Book Imbalance (L1 has higher weight than L5).
    *   **New Signals:**
        *   **Liquidity Gaps:** Detects zero/tiny liquidity at top levels.
        *   **Spoofing:** Detects large L1 orders (>2x avg) that vanish (<0.2x avg) without execution.
        *   **Depth Shocks:** Monitors sudden >30% drops in total book depth.
3.  **Visualization Overhaul:**
    *   **Signal Monitor:** New dedicated panel for real-time anomaly alerts (Critical/High/Medium severity).
    *   **Price Ladder:** Full L2 Depth visualization with relative volume bars and spread indicator.
    *   **Cleanup:** Removed non-functional "Interactive Trading" buttons and V-PIN metrics (unsupported by current dataset).

---

## 🛠️ Technical Stack

### Backend (Python)
- **Framework:** FastAPI (High-performance Async API)
- **Database:** TimescaleDB (Docker)
- **Data Processing:** NumPy, Pandas (Vectorized math)
- **Machine Learning:** Scikit-Learn (KMeans Clustering)

### Frontend (JavaScript)
- **Framework:** React 19 + Vite
- **Visualization:** HTML5 Canvas API (Charts/Heatmaps)
- **Styling:** CSS Modules

---

## 🚀 How to Run

### 1. Start the Database (Docker)
```bash
cd backend
docker compose up -d
```

### 2. Start the Backend
```bash
# Ensure virtual environment is active
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Start the Frontend
```bash
cd market-microstructure
npm run dev
```

### 4. Interact
- Open `http://localhost:5173`.
- Watch the **Real-Time Replay** of L2 Market Data.
- Monitor the **Signal Panel** for HFT anomalies (Spoofing, Gaps).
- Inspect the **Price Ladder** for depth distribution.
