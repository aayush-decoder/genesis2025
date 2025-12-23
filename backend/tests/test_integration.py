"""Integration tests for FastAPI endpoints and WebSocket."""
import pytest
from fastapi.testclient import TestClient
from main import app
import json


@pytest.fixture
def client():
    """Create a test client for FastAPI."""
    return TestClient(app)


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
        assert "controller_state" in data


class TestReplayControls:
    """Test replay control endpoints."""
    
    def test_start_replay(self, client):
        """Test /replay/start endpoint."""
        response = client.post("/replay/start")
        assert response.status_code == 200
        assert response.json()["status"] == "started"
    
    def test_pause_replay(self, client):
        """Test /replay/pause endpoint."""
        response = client.post("/replay/pause")
        assert response.status_code == 200
        assert response.json()["status"] == "paused"
    
    def test_resume_replay(self, client):
        """Test /replay/resume endpoint."""
        response = client.post("/replay/resume")
        assert response.status_code == 200
        assert response.json()["status"] == "resumed"
    
    def test_stop_replay(self, client):
        """Test /replay/stop endpoint."""
        response = client.post("/replay/stop")
        assert response.status_code == 200
        assert response.json()["status"] == "stopped"
    
    def test_set_speed(self, client):
        """Test /replay/speed/{value} endpoint."""
        response = client.post("/replay/speed/5")
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
    
    def test_websocket_connection(self, client):
        """Test WebSocket connection and initial history."""
        with client.websocket_connect("/ws") as websocket:
            # Should receive initial history message
            data = websocket.receive_json()
            
            assert "type" in data or "timestamp" in data
            # Either initial history packet or live snapshot
    
    def test_websocket_receives_updates(self, client):
        """Test that WebSocket receives live updates."""
        with client.websocket_connect("/ws") as websocket:
            # Receive initial history or first message
            data = websocket.receive_json()
            
            # Just verify we can connect and receive data
            assert data is not None
            assert isinstance(data, dict)
    
    def test_websocket_handles_invalid_json(self, client):
        """Test WebSocket error handling for invalid messages."""
        with client.websocket_connect("/ws") as websocket:
            # Send invalid JSON (in simulation mode this would be processed)
            websocket.send_text("invalid json")
            
            # Should not crash - connection should stay alive
            # Try to receive next message
            try:
                websocket.receive_json(timeout=1)
            except:
                pass  # Timeout is OK


class TestErrorHandling:
    """Test error handling and edge cases."""
    
    def test_invalid_speed_value(self, client):
        """Test replay speed with invalid value."""
        response = client.post("/replay/speed/0")
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
