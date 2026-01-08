import { useState } from "react";
import { Menu, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import ControlsBar from "../components/ControlsBar";
import CanvasPriceChart from "../components/CanvasPriceChart";
import CanvasHeatmap from "../components/CanvasHeatmap";
import FeaturePanel from "../components/FeaturePanel";
import SnapshotInspector from "../components/SnapshotInspector";
import PriceLadder from "../components/PriceLadder";
import SignalMonitor from "../components/SignalMonitor";
import LiquidityGapMonitor from "../components/LiquidityGapMonitor";
import SpoofingDetector from "../components/SpoofingDetector";
import LiquidityGapChart from "../components/LiquidityGapChart";
import SpoofingRiskChart from "../components/SpoofingRiskChart";
import Sidebar from "../components/Sidebar";
import TradeFeed from "../components/TradeFeed";
import VPINChart from "../components/VPINChart";
import AdvancedAnomalyFeed from "../components/AdvancedAnomalyFeed";

import React from 'react';

const DashboardLayout = React.memo(function DashboardLayout({
  data,
  latestSnapshot,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSpeed,
  onGoBack,
  replayState = "STOPPED",
  currentSpeed = 1,
  currentMode = "REPLAY",
  showToast,
  children
}) {
  const [hoveredSnapshot, setHoveredSnapshot] = useState(null);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const activeSnapshot = hoveredSnapshot || latestSnapshot;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Feature definitions
  const features = [
    {
      id: "obi",
      title: "ORDER BOOK IMBALANCE",
      component: (
        <FeaturePanel
          data={data}
          dataKey="obi"
          color="#38bdf8"
          threshold={0.5}
        />
      ),
      modalComponent: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            height: "100%",
          }}
        >
          <div style={{ flex: 1, overflow: "hidden" }}>
            <FeaturePanel
              title="Order Book Imbalance"
              data={data}
              dataKey="obi"
              color="#38bdf8"
              threshold={0.5}
            />
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <FeaturePanel
              title="Spread"
              data={data}
              dataKey="spread"
              color="#f472b6"
              isSpread
            />
          </div>
        </div>
      ),
    },
    {
      id: "spread",
      title: "SPREAD",
      component: (
        <FeaturePanel data={data} dataKey="spread" color="#f472b6" isSpread />
      ),
      modalComponent: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            height: "100%",
          }}
        >
          <div style={{ flex: 1, overflow: "hidden" }}>
            <FeaturePanel
              title="Spread"
              data={data}
              dataKey="spread"
              color="#f472b6"
              isSpread
            />
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <FeaturePanel
              title="Order Book Imbalance"
              data={data}
              dataKey="obi"
              color="#38bdf8"
              threshold={0.5}
            />
          </div>
        </div>
      ),
    },
    {
      id: "liquidity",
      title: "LIQUIDITY GAP MONITOR",
      component: <LiquidityGapMonitor snapshot={latestSnapshot} data={data} />,
      modalComponent: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            height: "100%",
          }}
        >
          <div style={{ flex: 1, overflow: "hidden" }}>
            <LiquidityGapMonitor snapshot={latestSnapshot} data={data} />
          </div>
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              transform: "scale(0.9)",
              transformOrigin: "top left",
            }}
          >
            <LiquidityGapChart data={data} />
          </div>
        </div>
      ),
    },
    {
      id: "spoofing",
      title: "SPOOFING DETECTOR",
      component: <SpoofingDetector snapshot={latestSnapshot} data={data} />,
      modalComponent: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            height: "100%",
          }}
        >
          <div style={{ flex: 1, overflow: "hidden" }}>
            <SpoofingDetector snapshot={latestSnapshot} data={data} />
          </div>
          <div
            style={{
              flex: 1,
              overflow: "hidden",
            }}
          >
            <SpoofingRiskChart data={data} />
          </div>
        </div>
      ),
    },
    {
      id: "trades",
      title: "TRADE FEED",
      component: <TradeFeed data={data} />,
      modalComponent: <TradeFeed data={data} />,
    },
    {
      id: "vpin",
      title: "V-PIN MONITOR",
      component: <VPINChart data={data} />, // Small view (default)
      modalComponent: <VPINChart data={data} isModal={true} />, // Modal view (detailed),
    },
    {
      id: "anomalies",
      title: "ADVANCED ANOMALIES",
      component: <AdvancedAnomalyFeed data={data} />,
      modalComponent: <AdvancedAnomalyFeed data={data} isModal={true} />,
    },
  ];

  const handlePrevFeature = () => {
    setCurrentFeatureIndex((prev) =>
      prev === 0 ? features.length - 1 : prev - 1
    );
  };

  const handleNextFeature = () => {
    setCurrentFeatureIndex((prev) =>
      prev === features.length - 1 ? 0 : prev + 1
    );
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const currentFeature = features[currentFeatureIndex];

  // Custom container styles based on children/props
  const containerStyle = children ? {
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "#0a0f0a",
    display: "flex",
    flexDirection: "column",
    padding: 0,
    margin: 0,
    boxSizing: "border-box",
  } : {
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "#0a0f0a",
    display: "flex",
    padding: "16px 96px",
    gap: "12px",
    boxSizing: "border-box",
    alignItems: "center",
  };

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        style={{
          position: "fixed",
          top: "50%",
          left: "0",
          transform: "translateY(-50%)",
          padding: "16px 8px",
          background: "rgba(0, 255, 127, 0.1)",
          border: "1px solid rgba(0, 255, 127, 0.3)",
          borderLeft: "none",
          borderTopRightRadius: "0",
          borderBottomRightRadius: "0",
          color: "#00ff7f",
          cursor: "pointer",
          fontSize: "18px",
          zIndex: 998,
          transition: "all 0.3s",
          fontFamily: "'Orbitron', monospace",
          backdropFilter: "blur(8px)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(0, 255, 127, 0.2)";
          e.currentTarget.style.boxShadow = "0 0 15px rgba(0, 255, 127, 0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(0, 255, 127, 0.1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <Menu size={18} />
      </button>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} activePage="dashboard" />

      <div style={containerStyle}>
        {children ? (
          children
        ) : (
          <>
            {/* Left Column */}
            <div
              style={{
                flex: "1",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                minWidth: 0,
              }}
            >
              {/* Price Action */}
              <div
                style={{
                  height: "145px",
                  background: "rgba(0, 20, 0, 0.4)",
                  border: "1px solid rgba(0, 255, 127, 0.2)",
                  borderRadius: "0",
                  overflow: "hidden",
                  padding: "6px",
                  backdropFilter: "blur(8px)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "linear-gradient(90deg, transparent, #00ff7f, transparent)",
                    opacity: 0.3,
                  }}
                />
                <div
                  style={{
                    width: "125%",
                    transform: "scale(0.8)",
                    transformOrigin: "top left",
                  }}
                >
                  <CanvasPriceChart data={data} height={150} scale={0.8} />
                </div>
              </div>

              {/* Market Depth */}
              <div
                style={{
                  height: "145px",
                  background: "rgba(0, 20, 0, 0.4)",
                  border: "1px solid rgba(0, 255, 127, 0.2)",
                  borderRadius: "0",
                  overflow: "hidden",
                  padding: "6px",
                  backdropFilter: "blur(8px)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "linear-gradient(90deg, transparent, #00ff7f, transparent)",
                    opacity: 0.3,
                  }}
                />
                <div
                  style={{
                    height: "calc(100% - 12px)",
                    transform: "scale(0.8)",
                    transformOrigin: "top left",
                    width: "125%",
                  }}
                >
                  <CanvasHeatmap
                    data={data}
                    height={150}
                    onHover={setHoveredSnapshot}
                    scale={0.8}
                  />
                </div>
              </div>

              {/* Active Signals */}
              <div
                style={{
                  height: "116px",
                  background: "rgba(0, 20, 0, 0.4)",
                  border: "1px solid rgba(0, 255, 127, 0.2)",
                  borderRadius: "0",
                  overflow: "hidden",
                  padding: "6px",
                  fontSize: "0.75rem",
                  backdropFilter: "blur(8px)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "linear-gradient(90deg, transparent, #00ff7f, transparent)",
                    opacity: 0.3,
                  }}
                />
                <div
                  style={{
                    transform: "scale(0.8)",
                    transformOrigin: "top left",
                    width: "125%",
                    height: "125%",
                  }}
                >
                  <SignalMonitor snapshot={latestSnapshot} />
                </div>
              </div>

              {/* Features/Anomalies */}
              <div
                style={{
                  height: "273px",
                  background: "rgba(0, 20, 0, 0.4)",
                  border: "1px solid rgba(0, 255, 127, 0.2)",
                  borderRadius: "0",
                  overflow: "hidden",
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  backdropFilter: "blur(8px)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "linear-gradient(90deg, transparent, #00ff7f, transparent)",
                    opacity: 0.3,
                  }}
                />
                <div
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid rgba(0, 255, 127, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: "700",
                      fontFamily: "'Orbitron', monospace",
                      color: "#00ff7f",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      textShadow: "0 0 10px rgba(0, 255, 127, 0.3)",
                    }}
                  >
                    {currentFeature.title}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                    }}
                  >
                    <button
                      onClick={handlePrevFeature}
                      style={{
                        padding: "3px 10px",
                        background: "rgba(0, 255, 127, 0.1)",
                        border: "1px solid rgba(0, 255, 127, 0.3)",
                        borderRadius: "0",
                        color: "#00ff7f",
                        cursor: "pointer",
                        fontSize: "12px",
                        transition: "all 0.3s",
                        fontFamily: "'Orbitron', monospace",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(0, 255, 127, 0.2)";
                        e.currentTarget.style.boxShadow = "0 0 10px rgba(0, 255, 127, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(0, 255, 127, 0.1)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      onClick={handleNextFeature}
                      style={{
                        padding: "3px 10px",
                        background: "rgba(0, 255, 127, 0.1)",
                        border: "1px solid rgba(0, 255, 127, 0.3)",
                        borderRadius: "0",
                        color: "#00ff7f",
                        cursor: "pointer",
                        fontSize: "12px",
                        transition: "all 0.3s",
                        fontFamily: "'Orbitron', monospace",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(0, 255, 127, 0.2)";
                        e.currentTarget.style.boxShadow = "0 0 10px rgba(0, 255, 127, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(0, 255, 127, 0.1)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <ChevronRight size={12} />
                    </button>
                    <button
                      onClick={handleOpenModal}
                      style={{
                        padding: "3px 10px",
                        background: "rgba(0, 255, 127, 0.1)",
                        border: "1px solid rgba(0, 255, 127, 0.3)",
                        borderRadius: "0",
                        color: "#00ff7f",
                        cursor: "pointer",
                        fontSize: "11px",
                        transition: "all 0.3s",
                        fontFamily: "'Orbitron', monospace",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(0, 255, 127, 0.2)";
                        e.currentTarget.style.boxShadow = "0 0 10px rgba(0, 255, 127, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(0, 255, 127, 0.1)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <Maximize2 size={11} />
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    padding: "10px",
                    minHeight: 0,
                    display: "flex",
                    alignItems: "center",
                    // justifyContent: "center",
                  }}
                >
                  <div style={{ width: "100%" }}>{currentFeature.component}</div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div
              style={{
                width: "380px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* Control Bar */}
              <div
                style={{
                  flexShrink: 0,
                }}
              >
                <ControlsBar
                  onPlay={onPlay}
                  onPause={onPause}
                  onResume={onResume}
                  onStop={onStop}
                  onSpeed={onSpeed}
                  onGoBack={onGoBack}
                  isPlaying={replayState === "PLAYING"}
                  isPaused={replayState === "PAUSED"}
                  currentSpeed={currentSpeed}
                  currentTimestamp={latestSnapshot?.timestamp}
                  currentMode={currentMode}
                  showToast={showToast}
                  data={data}
                />
              </div>

              {/* Snapshot Inspector */}
              <div
                style={{
                  height: "193px",
                  background: "rgba(0, 20, 0, 0.4)",
                  border: "1px solid rgba(0, 255, 127, 0.2)",
                  borderRadius: "0",
                  overflow: "hidden",
                  padding: "8px",
                  fontSize: "0.8rem",
                  backdropFilter: "blur(8px)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "linear-gradient(90deg, transparent, #00ff7f, transparent)",
                    opacity: 0.3,
                  }}
                />
                <div
                  style={{
                    transform: "scale(0.80)",
                    transformOrigin: "top left",
                    width: "117.65%",
                    height: "117.65%",
                  }}
                >
                  <SnapshotInspector snapshot={activeSnapshot} />
                </div>
              </div>

              {/* Price Ladder */}
              <div
                style={{
                  height: "450px",
                  background: "rgba(0, 20, 0, 0.4)",
                  border: "1px solid rgba(0, 255, 127, 0.2)",
                  borderRadius: "0",
                  overflow: "hidden",
                  minHeight: 0,
                  padding: "6px",
                  fontSize: "0.65rem",
                  backdropFilter: "blur(8px)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "linear-gradient(90deg, transparent, #00ff7f, transparent)",
                    opacity: 0.3,
                  }}
                />
                <div
                  style={{
                    transform: "scale(0.695)",
                    transformOrigin: "top left",
                    width: "117.65%",
                    height: "117.65%",
                  }}
                >
                  <PriceLadder snapshot={activeSnapshot} />
                </div>
              </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                  padding: "40px",
                }}
                onClick={handleCloseModal}
              >
                <div
                  style={{
                    background: "rgba(0, 20, 0, 0.9)",
                    borderRadius: "0",
                    border: "2px solid rgba(0, 255, 127, 0.4)",
                    width: "90%",
                    height: "90%",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    backdropFilter: "blur(12px)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid rgba(0, 255, 127, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexShrink: 0,
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: "700",
                        fontFamily: "'Orbitron', monospace",
                        color: "#00ff7f",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        textShadow: "0 0 10px rgba(0, 255, 127, 0.3)",
                      }}
                    >
                      {currentFeature.title} - Detailed View
                    </h2>
                    <button
                      onClick={handleCloseModal}
                      style={{
                        padding: "6px 12px",
                        background: "rgba(255, 50, 50, 0.2)",
                        border: "1px solid #ff3232",
                        borderRadius: "0",
                        color: "#ff3232",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "700",
                        fontFamily: "'Orbitron', monospace",
                        transition: "all 0.3s",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 50, 50, 0.3)";
                        e.currentTarget.style.boxShadow = "0 0 15px rgba(255, 50, 50, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255, 50, 50, 0.2)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <X size={14} /> Close
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      padding: "20px",
                    }}
                  >
                    {currentFeature.modalComponent}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
});

export default DashboardLayout;
