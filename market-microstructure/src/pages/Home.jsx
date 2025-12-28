import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Menu } from "lucide-react";
import "../styles/home.css";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="home-shell">
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '10px 14px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: 100,
          }}
        >
          <Menu size={18} />
          Menu
        </button>

        <div className="home-card">
          <h1 className="home-title">Market Microstructure Analyzer</h1>
          <p className="home-subtitle">
            L2 Order Book · Liquidity · Anomaly Detection
          </p>

          <Link to="/dashboard">
            <button className="home-cta">Open Dashboard</button>
          </Link>
        </div>
      </div>
    </>
  );
}