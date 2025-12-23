"""Synthetic data generators for stress testing and edge cases."""
import random
from datetime import datetime, timedelta
from typing import List, Dict
import numpy as np


class SyntheticDataGenerator:
    """Generate synthetic market data for testing various scenarios."""
    
    @staticmethod
    def generate_normal_market(base_price=100.0, num_levels=10) -> Dict:
        """Generate a normal, healthy market snapshot."""
        spread = random.uniform(0.01, 0.05)
        mid_price = base_price
        
        bids = []
        asks = []
        
        for i in range(num_levels):
            bid_price = mid_price - (spread / 2) - (i * 0.01)
            ask_price = mid_price + (spread / 2) + (i * 0.01)
            
            bid_vol = random.randint(500, 2000) * np.exp(-0.1 * i)
            ask_vol = random.randint(500, 2000) * np.exp(-0.1 * i)
            
            bids.append([round(bid_price, 2), int(bid_vol)])
            asks.append([round(ask_price, 2), int(ask_vol)])
        
        return {
            "timestamp": datetime.now().isoformat(),
            "mid_price": round(mid_price, 2),
            "bids": bids,
            "asks": asks
        }
    
    @staticmethod
    def generate_spoofing_scenario() -> List[Dict]:
        """Generate a sequence showing spoofing behavior."""
        snapshots = []
        
        # Normal market
        snap1 = SyntheticDataGenerator.generate_normal_market()
        snapshots.append(snap1)
        
        # Large order appears at top of book
        snap2 = snap1.copy()
        snap2['bids'] = snap1['bids'].copy()
        snap2['bids'][0] = [snap1['bids'][0][0], 10000]  # Huge bid
        snap2['timestamp'] = (datetime.now() + timedelta(milliseconds=100)).isoformat()
        snapshots.append(snap2)
        
        # Order disappears without execution
        snap3 = snap1.copy()
        snap3['bids'] = snap1['bids'].copy()
        snap3['bids'][0] = [snap1['bids'][0][0], 50]  # Tiny bid
        snap3['timestamp'] = (datetime.now() + timedelta(milliseconds=200)).isoformat()
        snapshots.append(snap3)
        
        return snapshots
    
    @staticmethod
    def generate_liquidity_crisis() -> Dict:
        """Generate snapshot with severe liquidity gaps."""
        return {
            "timestamp": datetime.now().isoformat(),
            "mid_price": 100.0,
            "bids": [
                [99.95, 10],      # Tiny liquidity
                [99.90, 5],
                [99.85, 0.1],     # Nearly empty
                [99.80, 2],
                [99.75, 1000],    # Normal below
                [99.70, 1500],
                [99.65, 2000],
                [99.60, 2500],
                [99.55, 3000],
                [99.50, 3500]
            ],
            "asks": [
                [100.05, 5],
                [100.10, 0.2],
                [100.15, 10],
                [100.20, 1000],
                [100.25, 1500],
                [100.30, 2000],
                [100.35, 2500],
                [100.40, 3000],
                [100.45, 3500],
                [100.50, 4000]
            ]
        }
    
    @staticmethod
    def generate_depth_shock_sequence() -> List[Dict]:
        """Generate sequence showing sudden depth disappearance."""
        snapshots = []
        
        # Healthy deep book
        snap1 = {
            "timestamp": datetime.now().isoformat(),
            "mid_price": 100.0,
            "bids": [[99.95 - i*0.01, 5000] for i in range(10)],
            "asks": [[100.05 + i*0.01, 5000] for i in range(10)]
        }
        snapshots.append(snap1)
        
        # Sudden depth loss (>30%)
        snap2 = {
            "timestamp": (datetime.now() + timedelta(milliseconds=100)).isoformat(),
            "mid_price": 100.0,
            "bids": [[99.95 - i*0.01, 1000] for i in range(10)],  # 80% reduction
            "asks": [[100.05 + i*0.01, 1200] for i in range(10)]  # 76% reduction
        }
        snapshots.append(snap2)
        
        return snapshots
    
    @staticmethod
    def generate_heavy_imbalance() -> Dict:
        """Generate snapshot with extreme order book imbalance."""
        return {
            "timestamp": datetime.now().isoformat(),
            "mid_price": 100.0,
            "bids": [[99.95 - i*0.01, 10000] for i in range(10)],  # Heavy bids
            "asks": [[100.05 + i*0.01, 100] for i in range(10)]    # Weak asks
        }
    
    @staticmethod
    def generate_flash_crash() -> List[Dict]:
        """Generate sequence simulating flash crash."""
        snapshots = []
        base_price = 100.0
        
        # 10 snapshots with rapid price decay
        for i in range(10):
            price_drop = i * 0.5  # 5% total drop
            current_price = base_price - price_drop
            
            # Widening spread
            spread = 0.05 * (1 + i * 0.2)
            
            snap = {
                "timestamp": (datetime.now() + timedelta(milliseconds=i*50)).isoformat(),
                "mid_price": round(current_price, 2),
                "bids": [[current_price - spread/2 - j*0.01, max(100, 2000 - i*150)] for j in range(10)],
                "asks": [[current_price + spread/2 + j*0.01, max(100, 2000 - i*150)] for j in range(10)]
            }
            snapshots.append(snap)
        
        return snapshots
    
    @staticmethod
    def generate_malformed_data() -> List[Dict]:
        """Generate various types of malformed data for validation testing."""
        return [
            # NaN prices
            {
                "timestamp": datetime.now().isoformat(),
                "mid_price": float('nan'),
                "bids": [[float('nan'), 1000]],
                "asks": [[100.0, 1000]]
            },
            # Infinite volumes
            {
                "timestamp": datetime.now().isoformat(),
                "mid_price": 100.0,
                "bids": [[99.95, float('inf')]],
                "asks": [[100.05, 1000]]
            },
            # Negative volumes
            {
                "timestamp": datetime.now().isoformat(),
                "mid_price": 100.0,
                "bids": [[99.95, -1000]],
                "asks": [[100.05, 1000]]
            },
            # Crossed book
            {
                "timestamp": datetime.now().isoformat(),
                "mid_price": 100.0,
                "bids": [[100.10, 1000]],  # Bid > Ask
                "asks": [[99.90, 1000]]
            },
            # Empty book
            {
                "timestamp": datetime.now().isoformat(),
                "mid_price": 100.0,
                "bids": [],
                "asks": []
            },
            # Missing fields
            {
                "timestamp": datetime.now().isoformat()
                # Missing bids, asks, mid_price
            }
        ]
    
    @staticmethod
    def generate_stress_test_sequence(num_snapshots=1000) -> List[Dict]:
        """Generate large sequence for stress testing."""
        snapshots = []
        price = 100.0
        
        for i in range(num_snapshots):
            # Random walk
            price += random.gauss(0, 0.1)
            price = max(90, min(110, price))  # Clamp
            
            # Occasionally inject anomalies
            if random.random() < 0.05:  # 5% chance
                if random.random() < 0.5:
                    snap = SyntheticDataGenerator.generate_liquidity_crisis()
                else:
                    snap = SyntheticDataGenerator.generate_heavy_imbalance()
            else:
                snap = SyntheticDataGenerator.generate_normal_market(base_price=price)
            
            snap['timestamp'] = (datetime.now() + timedelta(milliseconds=i*100)).isoformat()
            snapshots.append(snap)
        
        return snapshots


# Convenience functions
def get_spoofing_test_data():
    """Get spoofing test scenario."""
    return SyntheticDataGenerator.generate_spoofing_scenario()

def get_crash_test_data():
    """Get flash crash test scenario."""
    return SyntheticDataGenerator.generate_flash_crash()

def get_malformed_test_data():
    """Get malformed data for validation testing."""
    return SyntheticDataGenerator.generate_malformed_data()

def get_stress_test_data(n=1000):
    """Get stress test data."""
    return SyntheticDataGenerator.generate_stress_test_sequence(n)
