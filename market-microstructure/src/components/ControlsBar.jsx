import { useState } from "react";

export default function ControlsBar({ 
  onPlay, 
  onPause, 
  onResume, 
  onStop, 
  onSpeed,
  isPlaying = false,
  isPaused = false,
  currentSpeed = 1
}) {
  const [speed, setSpeed] = useState(currentSpeed);

  const handleSpeedChange = (e) => {
    const newSpeed = parseInt(e.target.value);
    setSpeed(newSpeed);
    if (onSpeed) {
      onSpeed(newSpeed);
    }
  };

  const handlePlay = () => {
    if (isPaused) {
      if (onResume) {
        onResume();
      }
    } else {
      if (onPlay) {
        onPlay();
      }
    }
  };

  const handlePause = () => {
    if (onPause) {
      onPause();
    }
  };

  const handleStop = () => {
    if (onStop) {
      onStop();
    }
  };

  return (
    <div className="controls-bar">
      <div className="controls-left">
        <label>Speed: {speed}x</label>
        <input 
          type="range" 
          className="speed-slider"
          min="1"
          max="10"
          value={speed}
          onChange={handleSpeedChange}
        />
      </div>

      <div className="controls-right">
        <button 
          className="btn" 
          onClick={handlePlay}
          disabled={isPlaying && !isPaused}
        >
          {isPaused ? "▶ Resume" : "▶ Play"}
        </button>
        
        <button 
          className="btn" 
          onClick={handlePause}
          disabled={!isPlaying || isPaused}
        >
          ⏸ Pause
        </button>
        
        <button 
          className="btn" 
          onClick={handleStop}
          disabled={!isPlaying && !isPaused}
        >
          ⏹ Stop
        </button>
      </div>
    </div>
  );
}