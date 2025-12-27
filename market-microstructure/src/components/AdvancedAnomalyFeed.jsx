import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { GiWaterDrop } from "react-icons/gi";

export default function AdvancedAnomalyFeed({ data , isModal = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Extract anomalies from snapshot history
  const anomalies = useMemo(() => {
    if (!data) return [];
    
    const allAnomalies = [];
    
    data.forEach(snap => {
      if (snap.anomalies && snap.anomalies.length > 0) {
        snap.anomalies.forEach(anomaly => {
          allAnomalies.push({
            timestamp: snap.timestamp,
            ...anomaly
          });
        });
      }
    });
    
    return allAnomalies.reverse().slice(0, 100); // Newest first, limit 100
  }, [data]);

  if (anomalies.length === 0) {
    return (
      <div className="panel-content empty-state">
        <div className="empty-text">No anomalies detected</div>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#ef4444'; // Red
      case 'high': return '#f97316'; // Orange
      case 'medium': return '#eab308'; // Yellow
      default: return '#3b82f6'; // Blue
    }
  };

  const getAnomalyIcon = (type) => {
    switch (type) {
      case 'QUOTE_STUFFING': return '⚡';
      case 'LAYERING': return '📚';
      case 'MOMENTUM_IGNITION': return '🚀';
      case 'WASH_TRADING': return '🔄';
      case 'ICEBERG_ORDER': return '🧊';
      case 'UNUSUAL_TRADE_SIZE': return '🐋';
      case 'RAPID_TRADING': return '🎯';
      case 'LIQUIDITY_GAP': return <GiWaterDrop />;
      default: return '⚠️';
    }
  };

  const renderAnomalyCard = (anomaly, i) => (
    <div 
      key={`${anomaly.timestamp}-${i}`} 
      className="anomaly-card"
      style={{ borderLeftColor: getSeverityColor(anomaly.severity) }}
    >
      <div className="anomaly-header">
        <span className="anomaly-icon">{getAnomalyIcon(anomaly.type)}</span>
        <span className="anomaly-type">{anomaly.type.replace(/_/g, ' ')}</span>
        <span className="anomaly-time">
          {new Date(anomaly.timestamp).toLocaleTimeString([], { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })}
        </span>
      </div>
      <div className="anomaly-message">{anomaly.message}</div>
      {anomaly.details && (
        <div className="anomaly-details">
          {Object.entries(anomaly.details).map(([k, v]) => (
            <div key={k} className="detail-item">
              <span className="detail-key">{k}:</span>
              <span className="detail-val">{typeof v === 'number' ? v.toFixed(2) : v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Show only first 2 in small view
const displayedAnomalies = isModal ? anomalies : anomalies.slice(0, 2);

  const modalContent = isModalOpen && createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '40px'
      }}
      onClick={() => setIsModalOpen(false)}
    >
      <div 
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          border: '2px solid #334155',
          width: '900px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#e2e8f0'
          }}>
            🔍 All Advanced Anomalies ({anomalies.length})
          </h2>
          <button 
            onClick={() => setIsModalOpen(false)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ef4444',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            × Close
          </button>
        </div>

        {/* Modal Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}>
          <div className="anomaly-list-modal">
            {anomalies.map((anomaly, i) => renderAnomalyCard(anomaly, i))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="anomaly-feed-container">
      {/* Header with View All button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid #374151'
      }}>
        <h4 style={{ 
          margin: 0, 
          fontSize: '0.875rem', 
          fontWeight: 600, 
          color: '#e5e7eb',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Recent Anomalies
        </h4>
        {!isModal && anomalies.length > 2 && (
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '2px 8px',
              fontSize: '0.7rem',
              backgroundColor: '#334155',
              color: '#3b82f6',
              border: '1px solid #475569',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#475569';
              e.currentTarget.style.color = '#60a5fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#334155';
              e.currentTarget.style.color = '#3b82f6';
            }}
          >
            View All ({anomalies.length})
          </button>
        )}
      </div>

      <div className="anomaly-list">
        {displayedAnomalies.map((anomaly, i) => renderAnomalyCard(anomaly, i))}
      </div>

      {/* Render modal via portal */}
      {modalContent}

      <style jsx>{`
        .anomaly-feed-container {
          height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .anomaly-list, .anomaly-list-modal {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .anomaly-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          scrollbar-width: thin;
          scrollbar-color: #4b5563 #1f2937;
        }

        .anomaly-list-modal {
          padding: 0;
        }
        
        .anomaly-card {
          background-color: #1f2937;
          border-radius: 4px;
          padding: 8px;
          border-left: 4px solid #3b82f6;
          font-size: 0.8rem;
        }
        
        .anomaly-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }
        
        .anomaly-icon {
          font-size: 1rem;
        }
        
        .anomaly-type {
          font-weight: 700;
          color: #e5e7eb;
          font-size: 0.75rem;
        }
        
        .anomaly-time {
          margin-left: auto;
          color: #6b7280;
          font-size: 0.7rem;
        }
        
        .anomaly-message {
          color: #d1d5db;
          margin-bottom: 4px;
        }
        
        .anomaly-details {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px solid #374151;
        }
        
        .detail-item {
          font-size: 0.7rem;
          color: #9ca3af;
        }
        
        .detail-key {
          margin-right: 4px;
          color: #6b7280;
        }
        
        .panel-content.empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}