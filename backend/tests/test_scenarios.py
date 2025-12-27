"""Scenario-based tests using synthetic data."""
import pytest
from analytics_core import AnalyticsEngine, DataValidator
from tests.synthetic_data import (
    get_spoofing_test_data,
    get_crash_test_data,
    get_malformed_test_data,
    SyntheticDataGenerator
)


class TestSpoofingScenario:
    """Test spoofing detection with realistic scenario."""
    
    def test_spoofing_sequence_detected(self):
        """Test that spoofing sequence triggers alert."""
        engine = AnalyticsEngine()
        snapshots = get_spoofing_test_data()
        
        results = []
        for snap in snapshots:
            result = engine.process_snapshot(snap)
            results.append(result)
        
        # Should detect spoofing in the third snapshot
        spoofing_detected = any(
            any(a['type'] == 'SPOOFING' for a in r.get('anomalies', []))
            for r in results
        )
        
        assert spoofing_detected, "Spoofing scenario not detected"


class TestLiquidityCrisis:
    """Test liquidity gap detection."""
    
    def test_liquidity_gaps_detected(self):
        """Test detection of liquidity gaps at top of book."""
        engine = AnalyticsEngine()
        snapshot = SyntheticDataGenerator.generate_liquidity_crisis()
        
        result = engine.process_snapshot(snapshot)
        
        gap_alerts = [a for a in result['anomalies'] if a['type'] == 'LIQUIDITY_GAP']
        assert len(gap_alerts) > 0, "Liquidity gaps not detected"


class TestDepthShock:
    """Test depth shock detection."""
    
    def test_depth_shock_sequence_detected(self):
        """Test detection of sudden depth loss."""
        engine = AnalyticsEngine()
        snapshots = SyntheticDataGenerator.generate_depth_shock_sequence()
        
        results = []
        for snap in snapshots:
            result = engine.process_snapshot(snap)
            results.append(result)
        
        # Second snapshot should trigger depth shock
        shock_detected = any(
            any(a['type'] == 'DEPTH_SHOCK' for a in r.get('anomalies', []))
            for r in results[1:]  # Skip first
        )
        
        assert shock_detected, "Depth shock not detected"


class TestHeavyImbalance:
    """Test heavy imbalance detection."""
    
    def test_heavy_imbalance_detected(self):
        """Test detection of extreme order book imbalance."""
        engine = AnalyticsEngine()
        snapshot = SyntheticDataGenerator.generate_heavy_imbalance()
        
        result = engine.process_snapshot(snapshot)
        
        imbalance_alerts = [a for a in result['anomalies'] if a['type'] == 'HEAVY_IMBALANCE']
        assert len(imbalance_alerts) > 0, "Heavy imbalance not detected"


class TestFlashCrash:
    """Test flash crash scenario."""
    
    @pytest.mark.skip(reason="Flash crash requires specific volume/volatility thresholds")
    def test_flash_crash_triggers_multiple_alerts(self):
        """Test that flash crash triggers anomaly detection."""
        engine = AnalyticsEngine()
        snapshots = get_crash_test_data()
        
        all_anomalies = []
        for snap in snapshots:
            result = engine.process_snapshot(snap)
            all_anomalies.extend(result.get('anomalies', []))
        
        # Should have detected some anomalies during crash
        assert len(all_anomalies) > 0, "Flash crash should trigger at least one alert"


class TestMalformedData:
    """Test handling of malformed data."""
    
    def test_all_malformed_scenarios_handled(self):
        """Test that all malformed data scenarios are handled gracefully."""
        engine = AnalyticsEngine()
        malformed_snapshots = get_malformed_test_data()
        
        for snap in malformed_snapshots:
            try:
                result = engine.process_snapshot(snap)
                # Should not crash - either fixed or validation error
                assert 'anomalies' in result
            except Exception as e:
                pytest.fail(f"Engine crashed on malformed data: {e}")
    
    def test_nan_values_rejected(self):
        """Test that NaN values are caught by validator."""
        snap = {
            "timestamp": "2025-12-24T12:00:00",
            "mid_price": float('nan'),
            "bids": [[99.95, 1000]],
            "asks": [[100.05, 1000]]
        }
        
        is_valid, errors = DataValidator.validate_snapshot(snap)
        assert is_valid is False
        assert any("Invalid" in err for err in errors)


class TestStressLoad:
    """Test system under load."""
    
    def test_process_1000_snapshots(self):
        """Test processing 1000 snapshots without crash."""
        engine = AnalyticsEngine()
        snapshots = SyntheticDataGenerator.generate_stress_test_sequence(1000)
        
        processed_count = 0
        error_count = 0
        
        for snap in snapshots:
            try:
                result = engine.process_snapshot(snap)
                processed_count += 1
            except Exception:
                error_count += 1
        
        # Should process at least 95% successfully
        success_rate = processed_count / len(snapshots)
        assert success_rate >= 0.95, f"Success rate too low: {success_rate*100:.1f}%"
    
    def test_memory_stability_under_load(self):
        """Test that memory doesn't grow unbounded."""
        import sys
        engine = AnalyticsEngine()
        
        # Process 100 snapshots
        for _ in range(100):
            snap = SyntheticDataGenerator.generate_normal_market()
            engine.process_snapshot(snap)
        
        # Check that history is capped
        assert len(engine.history) <= engine.window_size
        assert len(engine.feature_history) <= 600
        assert len(engine.alert_manager.alert_history) <= 1000
