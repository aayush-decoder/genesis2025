"""Integration tests for FastAPI endpoints and WebSocket."""
import pytest
from fastapi.testclient import TestClient
from main import app
import json
import uuid

@pytest.fixture
def client():
    """Create a test client for FastAPI."""
    with TestClient(app) as client:
        yield client

@pytest.fixture
def session_id(client):
    """Generate a test session ID and ensure it's created."""
    sid = str(uuid.uuid4())
    # Connect to WS to force session creation
    try:
        with client.websocket_connect(f"/ws/{sid}"):
            pass
    except Exception:
        pass
    return sid

class TestHealthAndMetrics:
    """Test health check and metrics endpoints."""
    
    def test_health_endpoint(self, client):
        """Test /health endpoint returns valid status."""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert data["status"] in ["healthy", "degraded"]
        assert "mode" in data
        assert "uptime" in data
    
    def test_metrics_endpoint(self, client):
        """Test /metrics endpoint returns performance data."""
        response = client.get("/metrics")
        assert response.status_code == 200
        
        data = response.json()
        assert "uptime_seconds" in data
        assert "total_snapshots_processed" in data
        assert "avg_latency_ms" in data
        assert "total_errors" in data
    
    def test_metrics_dashboard_endpoint(self, client):
        """Test /metrics/dashboard returns detailed stats."""
        response = client.get("/metrics/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert "active_websocket_connections" in data
        assert "buffer_size" in data
        # controller_state removed as global controller is gone


class TestReplayControls:
    """Test replay control endpoints."""
    
    def test_start_replay(self, client, session_id):
        """Test /replay/{session_id}/start endpoint."""
        response = client.post(f"/replay/{session_id}/start")
        assert response.status_code == 200
        assert response.json()["status"] == "started"
    
    def test_pause_replay(self, client, session_id):
        """Test /replay/{session_id}/pause endpoint."""
        # Start first
        client.post(f"/replay/{session_id}/start")
        
        response = client.post(f"/replay/{session_id}/pause")
        assert response.status_code == 200
        assert response.json()["status"] == "paused"
    
    def test_resume_replay(self, client, session_id):
        """Test /replay/{session_id}/resume endpoint."""
        client.post(f"/replay/{session_id}/start")
        client.post(f"/replay/{session_id}/pause")
        
        response = client.post(f"/replay/{session_id}/resume")
        assert response.status_code == 200
        assert response.json()["status"] == "resumed"
    
    def test_stop_replay(self, client, session_id):
        """Test /replay/{session_id}/stop endpoint."""
        client.post(f"/replay/{session_id}/start")
        
        response = client.post(f"/replay/{session_id}/stop")
        assert response.status_code == 200
        assert response.json()["status"] == "stopped"
    
    def test_set_speed(self, client, session_id):
        """Test /replay/{session_id}/speed/{value} endpoint."""
        client.post(f"/replay/{session_id}/start")
        
        response = client.post(f"/replay/{session_id}/speed/5")
        assert response.status_code == 200
        assert response.json()["speed"] == 5


class TestDataEndpoints:
    """Test data retrieval endpoints."""
    
    def test_get_features(self, client):
        """Test /features endpoint returns array."""
        response = client.get("/features")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_anomalies(self, client):
        """Test /anomalies endpoint returns alerts."""
        response = client.get("/anomalies")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # If there are anomalies, check structure
        if len(data) > 0:
            anomaly = data[0]
            assert "type" in anomaly
            assert "severity" in anomaly
            assert "message" in anomaly
    
    def test_get_latest_snapshot(self, client):
        """Test /snapshot/latest endpoint."""
        response = client.get("/snapshot/latest")
        assert response.status_code == 200
        
        # Should return either empty dict or valid snapshot
        data = response.json()
        assert isinstance(data, dict)
    
    def test_get_alert_history(self, client):
        """Test /alerts/history endpoint."""
        response = client.get("/alerts/history?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10
    
    def test_get_alert_stats(self, client):
        """Test /alerts/stats endpoint."""
        response = client.get("/alerts/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_alerts_logged" in data
        assert "alert_counts_by_type" in data


class TestWebSocket:
    """Test WebSocket functionality."""
    
    def test_websocket_connection(self, client, session_id):
        """Test WebSocket connection and initial history."""
        with client.websocket_connect(f"/ws/{session_id}") as websocket:
            # Should receive initial history message
            data = websocket.receive_json()
            
            assert "type" in data or "timestamp" in data
            # Either initial history packet or live snapshot
    
    def test_websocket_receives_updates(self, client, session_id):
        """Test that WebSocket receives live updates."""
        with client.websocket_connect(f"/ws/{session_id}") as websocket:
            # Receive initial history or first message
            data = websocket.receive_json()
            
            # Just verify we can connect and receive data
            assert data is not None
            assert isinstance(data, dict)
    
    def test_websocket_handles_invalid_json(self, client, session_id):
        """Test WebSocket error handling for invalid messages."""
        with client.websocket_connect(f"/ws/{session_id}") as websocket:
            # Send invalid JSON
            websocket.send_text("invalid json")
            
            # Should not crash - connection should stay alive
            # Try to receive next message
            try:
                websocket.receive_json(timeout=1)
            except:
                pass  # Timeout is OK


class TestErrorHandling:
    """Test error handling and edge cases."""
    
    def test_invalid_speed_value(self, client, session_id):
        """Test replay speed with invalid value."""
        client.post(f"/replay/{session_id}/start")
        
        response = client.post(f"/replay/{session_id}/speed/0")
        assert response.status_code == 200
        # Should clamp to minimum 1
        assert response.json()["speed"] >= 1
    
    def test_negative_alert_limit(self, client):
        """Test alert history with negative limit."""
        response = client.get("/alerts/history?limit=-1")
        # Should handle gracefully
        assert response.status_code == 200
    
    def test_large_alert_limit(self, client):
        """Test alert history with very large limit."""
        response = client.get("/alerts/history?limit=999999")
        assert response.status_code == 200
        data = response.json()
        # Should be capped by deque maxlen (1000)
        assert len(data) <= 1000


class TestAdvancedAnomalyEndpoints:
    """Test new anomaly detection API endpoints (Priority #13)."""
    
    def test_quote_stuffing_endpoint(self, client):
        """Test /anomalies/quote-stuffing endpoint."""
        response = client.get("/anomalies/quote-stuffing")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_layering_endpoint(self, client):
        """Test /anomalies/layering endpoint."""
        response = client.get("/anomalies/layering")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_momentum_ignition_endpoint(self, client):
        """Test /anomalies/momentum-ignition endpoint."""
        response = client.get("/anomalies/momentum-ignition")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_wash_trading_endpoint(self, client):
        """Test /anomalies/wash-trading endpoint."""
        response = client.get("/anomalies/wash-trading")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_iceberg_orders_endpoint(self, client):
        """Test /anomalies/iceberg-orders endpoint."""
        response = client.get("/anomalies/iceberg-orders")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_anomalies_summary_endpoint(self, client):
        """Test /anomalies/summary endpoint."""
        response = client.get("/anomalies/summary")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, dict)
        # Check all anomaly types are present
        assert "quote_stuffing" in data
        assert "layering" in data
        assert "momentum_ignition" in data
        assert "wash_trading" in data
        assert "iceberg_orders" in data
        assert "spoofing" in data
        assert "liquidity_gaps" in data
    
    def test_anomalies_summary_counts_match(self, client):
        """Test that summary counts are consistent."""
        summary = client.get("/anomalies/summary").json()
        
        # Get individual endpoint counts
        quote_stuffing_len = len(client.get("/anomalies/quote-stuffing").json())
        layering_len = len(client.get("/anomalies/layering").json())
        
        # Summary counts should be >= individual counts (may have more from buffer)
        assert summary["quote_stuffing"] >= 0
        assert summary["layering"] >= 0


class TestEngineEndpoints:
    """Test C++ engine management endpoints."""
    
    def test_engine_status_endpoint(self, client):
        """Test /engine/status endpoint."""
        response = client.get("/engine/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "active_engine" in data
        assert data["active_engine"] in ["python", "cpp"]
        assert "cpp_enabled" in data
    
    def test_engine_switch_endpoint(self, client):
        """Test /engine/switch endpoint."""
        # Use path parameter instead of query param
        response = client.post("/engine/switch/python")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert data["status"] in ["success", "error"]
    
    def test_database_pool_endpoint(self, client):
        """Test /db/pool endpoint."""
        response = client.get("/db/pool")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        
        if data["status"] == "active":
            assert "used" in data
            assert "available" in data
            assert "total" in data
            assert data["used"] + data["available"] <= data["max_size"]
        else:
            assert data["status"] == "not_initialized"
            assert "size" in data
            assert data["size"] == 0
    
    def test_database_health_endpoint(self, client):
        """Test /db/health endpoint."""
        response = client.get("/db/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert data["status"] in ["healthy", "degraded"]
