import { useState } from "react";
import { 
  Download, 
  SkipBack, 
  FastForward, 
  Pause, 
  Settings, 
  Clock, 
  FileText, 
  FileJson,
  Play
} from 'lucide-react';

export default function ControlsBar({ 
  onPlay, 
  onPause, 
  onResume, 
  onStop, 
  onSpeed,
  onGoBack,
  isPlaying = false,
  isPaused = false,
  currentSpeed = 1,
  currentTimestamp = null,
  currentMode = "REPLAY",
  showToast,
  data = [] // Add data prop for downloads
}) {
  const [speed, setSpeed] = useState(currentSpeed);
  const [speedUpValue, setSpeedUpValue] = useState(2);
  const [goBackSeconds, setGoBackSeconds] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [tempSpeedUp, setTempSpeedUp] = useState(2);
  const [tempGoBack, setTempGoBack] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const handlePlayPause = async () => {
    setIsLoading(true);
    try {
      if (isPlaying) {
        if (onPause) await onPause();
        if (showToast) showToast('Replay paused', 'info');
      } else if (isPaused) {
        if (onResume) await onResume();
        if (showToast) showToast('Replay resumed', 'success');
      } else {
        if (onPlay) await onPlay();
        if (showToast) showToast('Replay started', 'success');
      }
    } catch (error) {
      if (showToast) showToast('Control action failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeedToggle = async () => {
    const newSpeed = speed === 1 ? speedUpValue : 1;
    setIsLoading(true);
    try {
      setSpeed(newSpeed);
      if (onSpeed) await onSpeed(newSpeed);
      if (showToast) showToast(`Speed set to ${newSpeed}x`, 'info');
    } catch (error) {
      if (showToast) showToast('Speed change failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = async () => {
    setIsLoading(true);
    try {
      if (onGoBack) await onGoBack(goBackSeconds);
      if (showToast) showToast(`Rewound ${goBackSeconds}s`, 'success');
    } catch (error) {
      if (showToast) showToast('Rewind failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySettings = () => {
    setSpeedUpValue(tempSpeedUp);
    setGoBackSeconds(tempGoBack);
    setShowModal(false);
  };

  const handleDownloadCSV = () => {
    if (!data || data.length === 0) {
      if (showToast) showToast("No data available to download", "error");
      return;
    }

    try {
      // Get all unique keys from all snapshots
      const allKeys = new Set();
      data.forEach(snapshot => {
        Object.keys(snapshot).forEach(key => {
          if (typeof snapshot[key] !== 'object' || snapshot[key] === null) {
            allKeys.add(key);
          }
        });
      });

      const headers = Array.from(allKeys).sort();
      
      // Create CSV content
      let csv = headers.join(",") + "\n";
      
      data.forEach(snapshot => {
        const row = headers.map(header => {
          const value = snapshot[header];
          if (value === null || value === undefined) return "";
          if (typeof value === "string" && value.includes(",")) return `"${value}"`;
          return value;
        });
        csv += row.join(",") + "\n";
      });

      // Download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `market_data_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      if (showToast) showToast("CSV downloaded successfully", "success");
      setShowDownloadMenu(false);
    } catch (error) {
      if (showToast) showToast("Failed to download CSV", "error");
      console.error("CSV download error:", error);
    }
  };

  const handleDownloadJSON = () => {
    if (!data || data.length === 0) {
      if (showToast) showToast("No data available to download", "error");
      return;
    }

    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `market_data_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      if (showToast) showToast("JSON downloaded successfully", "success");
      setShowDownloadMenu(false);
    } catch (error) {
      if (showToast) showToast("Failed to download JSON", "error");
      console.error("JSON download error:", error);
    }
  };

  const buttonStyle = {
    padding: '8px',
    fontSize: '16px',
    backgroundColor: 'rgba(0, 255, 127, 0.1)',
    color: '#00ff7f',
    border: '1px solid rgba(0, 255, 127, 0.3)',
    borderRadius: '0',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    boxShadow: '0 0 10px rgba(0, 255, 127, 0.2)',
    fontFamily: "'Orbitron', monospace",
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    position: 'relative',
    overflow: 'hidden'
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'No data';
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  return (
    <>
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '8px',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 20, 0, 0.6)',
        borderRadius: '0',
        border: '1px solid rgba(0, 255, 127, 0.3)',
        opacity: isLoading ? 0.6 : 1,
        pointerEvents: isLoading ? 'none' : 'auto',
        backdropFilter: 'blur(8px)',
        fontFamily: "'Orbitron', monospace"
      }}>
        {/* Current Timestamp Display */}
        {currentTimestamp && (
          <div style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(0, 20, 0, 0.8)',
            borderRadius: '0',
            fontSize: '12px',
            color: '#00ff7f',
            fontFamily: "'Orbitron', monospace",
            fontWeight: '600',
            marginRight: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            border: '1px solid rgba(0, 255, 127, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <Clock size={14} /> {formatTimestamp(currentTimestamp)}
          </div>
        )}
        
        {/* Replay Controls - Only show in REPLAY mode */}
        {currentMode === "REPLAY" && (
          <>
            {/* Play/Pause Button */}
            <button 
              onClick={handlePlayPause}
              style={{
                ...buttonStyle,
                backgroundColor: isPlaying ? 'rgba(255, 50, 50, 0.2)' : 'rgba(0, 255, 127, 0.2)',
                borderColor: isPlaying ? '#ff3232' : '#00ff7f',
                color: isPlaying ? '#ff3232' : '#00ff7f',
                boxShadow: isPlaying ? '0 0 15px rgba(255, 50, 50, 0.3)' : '0 0 15px rgba(0, 255, 127, 0.3)'
              }}
              title={isPlaying ? 'Pause' : (isPaused ? 'Resume' : 'Play')}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            {/* Speed Toggle Button */}
            <button 
              onClick={handleSpeedToggle}
              style={{
                ...buttonStyle,
                backgroundColor: speed > 1 ? 'rgba(0, 255, 127, 0.3)' : 'rgba(0, 255, 127, 0.1)',
                borderColor: speed > 1 ? '#00ff7f' : 'rgba(0, 255, 127, 0.3)',
                boxShadow: speed > 1 ? '0 0 20px rgba(0, 255, 127, 0.4)' : '0 0 10px rgba(0, 255, 127, 0.2)'
              }}
              title={`Speed: ${speed}x (Toggle to ${speed === 1 ? speedUpValue : 1}x)`}
            >
              <FastForward size={16} />
            </button>

            {/* Go Back Button */}
            <button 
              onClick={handleGoBack}
              style={buttonStyle}
              title={`Go back ${goBackSeconds}s`}
            >
              <SkipBack size={16} />
            </button>
          </>
        )}

        {/* LIVE Mode Indicator */}
        {currentMode === "LIVE" && (
          <div style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(255, 50, 50, 0.1)',
            borderRadius: '0',
            fontSize: '12px',
            color: '#ff3232',
            fontWeight: '700',
            fontFamily: "'Orbitron', monospace",
            marginRight: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid rgba(255, 50, 50, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              backgroundColor: '#ff3232',
              borderRadius: '50%',
              animation: 'cyber-pulse-dot 2s infinite'
            }} />
            LIVE STREAMING
          </div>
        )}

        {/* Download Button with Dropdown */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            style={{
              ...buttonStyle,
              backgroundColor: showDownloadMenu ? 'rgba(0, 255, 127, 0.3)' : 'rgba(0, 255, 127, 0.1)',
              borderColor: showDownloadMenu ? '#00ff7f' : 'rgba(0, 255, 127, 0.3)',
              boxShadow: showDownloadMenu ? '0 0 20px rgba(0, 255, 127, 0.4)' : '0 0 10px rgba(0, 255, 127, 0.2)'
            }}
            title="Download data"
          >
            <Download size={16} />
          </button>

          {/* Download Dropdown Menu */}
          {showDownloadMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginBottom: '4px',
              backgroundColor: 'rgba(0, 20, 0, 0.95)',
              border: '1px solid rgba(0, 255, 127, 0.4)',
              borderRadius: '0',
              overflow: 'hidden',
              zIndex: 1000,
              boxShadow: '0 -4px 12px rgba(0, 255, 127, 0.2)',
              minWidth: '120px',
              backdropFilter: 'blur(12px)'
            }}>
              <button
                onClick={handleDownloadCSV}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#00ff7f',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  fontFamily: "'Orbitron', monospace",
                  textAlign: 'left',
                  transition: 'background-color 0.3s',
                  borderBottom: '1px solid rgba(0, 255, 127, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 255, 127, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FileText size={14} /> CSV
              </button>
              <button
                onClick={handleDownloadJSON}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#00ff7f',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  fontFamily: "'Orbitron', monospace",
                  textAlign: 'left',
                  transition: 'background-color 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 255, 127, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FileJson size={14} /> JSON
              </button>
            </div>
          )}
        </div>

        {/* Settings Button - Only show in REPLAY mode */}
        {currentMode === "REPLAY" && (
          <button 
            onClick={() => setShowModal(true)}
            style={buttonStyle}
            title="Settings"
          >
            <Settings size={16} />
          </button>
        )}
      </div>

      {/* Click outside to close download menu */}
      {showDownloadMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowDownloadMenu(false)}
        />
      )}

      {/* Settings Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowModal(false)}>
          <div style={{
            backgroundColor: 'rgba(0, 20, 0, 0.95)',
            padding: '20px',
            borderRadius: '0',
            border: '1px solid rgba(0, 255, 127, 0.4)',
            minWidth: '280px',
            boxShadow: '0 8px 16px rgba(0, 255, 127, 0.2)',
            backdropFilter: 'blur(12px)',
            fontFamily: "'Orbitron', monospace"
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', color: '#00ff7f', fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Settings</h3>
            
            {/* Speed Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#00ff7f', fontSize: '12px', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Speed Up Value
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[0.5, 1, 2, 3, 5, 10].map(val => (
                  <button
                    key={val}
                    onClick={() => setTempSpeedUp(val)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: tempSpeedUp === val ? 'rgba(0, 255, 127, 0.3)' : 'rgba(0, 255, 127, 0.1)',
                      color: tempSpeedUp === val ? '#000000' : '#00ff7f',
                      border: tempSpeedUp === val ? '1px solid #00ff7f' : '1px solid rgba(0, 255, 127, 0.3)',
                      borderRadius: '0',
                      cursor: 'pointer',
                      fontFamily: "'Orbitron', monospace",
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: tempSpeedUp === val ? '0 0 15px rgba(0, 255, 127, 0.3)' : 'none'
                    }}
                  >
                    {val}x
                  </button>
                ))}
              </div>
            </div>

            {/* Go Back Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#00ff7f', fontSize: '12px', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Go Back (seconds)
              </label>
              <input
                type="number"
                min="0.25"
                max="100"
                step="0.25"
                value={tempGoBack}
                onChange={(e) => setTempGoBack(Math.min(100, Math.max(0.25, parseFloat(e.target.value) || 0.25)))}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'rgba(0, 20, 0, 0.8)',
                  color: '#00ff7f',
                  border: '1px solid rgba(0, 255, 127, 0.3)',
                  borderRadius: '0',
                  fontSize: '13px',
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: '600'
                }}
              />
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApplySettings}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '13px',
                fontWeight: '700',
                fontFamily: "'Orbitron', monospace",
                backgroundColor: 'rgba(0, 255, 127, 0.2)',
                color: '#00ff7f',
                border: '1px solid #00ff7f',
                borderRadius: '0',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 15px rgba(0, 255, 127, 0.3)'
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </>
  );
}