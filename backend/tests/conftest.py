"""Pytest configuration and shared fixtures."""
import pytest
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

@pytest.fixture
def sample_snapshot():
    """Generate a valid market snapshot for testing."""
    return {
        "timestamp": "2025-12-24T12:00:00",
        "mid_price": 100.0,
        "bids": [
            [99.95, 1000],
            [99.90, 1500],
            [99.85, 2000],
            [99.80, 2500],
            [99.75, 3000],
            [99.70, 1000],
            [99.65, 1500],
            [99.60, 2000],
            [99.55, 2500],
            [99.50, 3000]
        ],
        "asks": [
            [100.05, 1000],
            [100.10, 1500],
            [100.15, 2000],
            [100.20, 2500],
            [100.25, 3000],
            [100.30, 1000],
            [100.35, 1500],
            [100.40, 2000],
            [100.45, 2500],
            [100.50, 3000]
        ]
    }

@pytest.fixture
def invalid_snapshot():
    """Generate an invalid snapshot with NaN values."""
    return {
        "timestamp": "2025-12-24T12:00:00",
        "mid_price": float('nan'),
        "bids": [[99.95, float('inf')], [99.90, -100]],
        "asks": [[100.05, 0], [100.10, float('nan')]]
    }

@pytest.fixture
def wide_spread_snapshot():
    """Snapshot with abnormally wide spread (10%)."""
    return {
        "timestamp": "2025-12-24T12:00:00",
        "mid_price": 100.0,
        "bids": [[95.0, 1000]],
        "asks": [[105.0, 1000]]
    }

@pytest.fixture
def crossed_book_snapshot():
    """Invalid snapshot where bid > ask."""
    return {
        "timestamp": "2025-12-24T12:00:00",
        "mid_price": 100.0,
        "bids": [[100.10, 1000]],
        "asks": [[99.90, 1000]]
    }
