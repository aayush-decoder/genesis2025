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

  const handlePlayPause = () => {
    if (isPlaying) {
      // Currently playing, so pause it
      if (onPause) {
        onPause();
      }
    } else if (isPaused) {
      // Currently paused, so resume
      if (onResume) {
        onResume();
      }
    } else {
      // Stopped, so play
      if (onPlay) {
        onPlay();
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px',
      backgroundColor: '#1e293b',
      borderRadius: '8px',
      border: '1px solid #334155'
    }}>
      {/* Play/Pause Button */}
      <button 
        onClick={handlePlayPause}
        style={{
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: '600',
          backgroundColor: isPlaying ? '#f59e0b' : '#3b82f6',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          minWidth: '90px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        }}
      >
        <span style={{ fontSize: '14px' }}>
          {isPlaying ? '⏸' : '▶'}
        </span>
        {isPlaying ? 'Pause' : (isPaused ? 'Resume' : 'Play')}
      </button>

      {/* Speed Control */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flex: 1
      }}>
        <label style={{
          fontSize: '12px',
          color: '#94a3b8',
          fontWeight: '500',
          minWidth: '60px'
        }}>
          Speed: {speed}x
        </label>
        <input 
          type="range" 
          min="1"
          max="10"
          value={speed}
          onChange={handleSpeedChange}
          style={{
            flex: 1,
            accentColor: '#3b82f6',
            cursor: 'pointer',
            height: '4px'
          }}
        />
      </div>
    </div>
  );
}