from datetime import datetime, timedelta
import threading

class ReplayController:
    def __init__(self):
        self.state = "STOPPED"   # STOPPED | PLAYING | PAUSED
        self.speed = 1           # 1x, 5x, 10x
        self.cursor_ts = None    # current timestamp
        self.lock = threading.Lock()  # Thread-safe state updates
        self.replay_start_time = None
        self.paused_at = None
        self.total_paused_duration = timedelta(0)
    
    def start(self):
        """Start replay from beginning or current position."""
        with self.lock:
            self.state = "PLAYING"
            self.replay_start_time = datetime.now()
            self.paused_at = None
            self.total_paused_duration = timedelta(0)
    
    def pause(self):
        """Pause replay at current position."""
        with self.lock:
            if self.state == "PLAYING":
                self.state = "PAUSED"
                self.paused_at = datetime.now()
    
    def resume(self):
        """Resume replay from paused position."""
        with self.lock:
            if self.state == "PAUSED" and self.paused_at:
                self.total_paused_duration += (datetime.now() - self.paused_at)
                self.paused_at = None
                self.state = "PLAYING"
    
    def stop(self):
        """Stop replay and reset position."""
        with self.lock:
            self.state = "STOPPED"
            self.cursor_ts = None
            self.replay_start_time = None
            self.paused_at = None
            self.total_paused_duration = timedelta(0)
    
    def set_speed(self, speed: int):
        """Set replay speed multiplier (1x, 5x, 10x, etc.)."""
        with self.lock:
            self.speed = max(1, min(speed, 100))  # Clamp between 1 and 100
    
    def jump_to_timestamp(self, target_ts):
        """Jump replay to a specific timestamp."""
        with self.lock:
            self.cursor_ts = target_ts
    
    def go_back(self, seconds: float):
        """Rewind replay by specified seconds."""
        with self.lock:
            if self.cursor_ts:
                self.cursor_ts = self.cursor_ts - timedelta(seconds=seconds)
                return True
            return False
    
    def get_state(self) -> dict:
        """Get current replay state as dict."""
        with self.lock:
            return {
                "state": self.state,
                "speed": self.speed,
                "cursor_ts": self.cursor_ts.isoformat() if self.cursor_ts else None,
                "is_playing": self.state == "PLAYING",
                "is_paused": self.state == "PAUSED"
            }
