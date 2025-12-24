import React from 'react';

export default function SignalMonitor({ snapshot }) {
  if (!snapshot || !snapshot.anomalies || snapshot.anomalies.length === 0) {
    return (
      <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
        <span style={{ color: '#4b5563' }}>No Active Signals</span>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444'; // Red
      case 'high': return '#f97316'; // Orange
      case 'medium': return '#eab308'; // Yellow
      default: return '#3b82f6'; // Blue
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'LIQUIDITY_GAP': return '💧';
      case 'SPOOFING': return '🎭';
      case 'DEPTH_SHOCK': return '💥';
      case 'HEAVY_IMBALANCE': return '⚖️';
      case 'REGIME_STRESS': return '📊';
      case 'REGIME_CRISIS': return '🚨';
      default: return '⚠️';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'LIQUIDITY_GAP': return '#06b6d4';
      case 'SPOOFING': return '#ef4444';
      case 'DEPTH_SHOCK': return '#f97316';
      case 'HEAVY_IMBALANCE': return '#8b5cf6';
      case 'REGIME_STRESS': return '#eab308';
      case 'REGIME_CRISIS': return '#dc2626';
      default: return '#6b7280';
    }
  };

  // Sort anomalies by severity (critical first)
  const sortedAnomalies = [...snapshot.anomalies].sort((a, b) => {
    const severityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <div style={{ height: '150px', overflowY: 'auto', marginBottom: '16px' }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', fontWeight: 600, color: '#e5e7eb', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #374151', paddingBottom: '8px' }}>
        🚨 Market Signals ({snapshot.anomalies.length})
      </h4>
      <div className="signals-list">
        {sortedAnomalies.map((anomaly, idx) => (
          <div 
            key={idx} 
            style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              marginBottom: '8px',
              padding: '10px',
              backgroundColor: anomaly.severity === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
              borderRadius: '6px',
              borderLeft: `4px solid ${getSeverityColor(anomaly.severity)}`,
              border: anomaly.severity === 'critical' ? `1px solid ${getSeverityColor(anomaly.severity)}` : 'none'
            }}
          >
            <div style={{ marginRight: '8px', fontSize: '1rem' }}>
              {getTypeIcon(anomaly.type)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: getTypeColor(anomaly.type),
                  marginRight: '8px',
                  fontSize: '0.75rem'
                }}>
                  {anomaly.type.replace('_', ' ')}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  backgroundColor: getSeverityColor(anomaly.severity),
                  color: 'white',
                  textTransform: 'uppercase'
                }}>
                  {anomaly.severity}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: '1.3' }}>
                {anomaly.message}
              </div>
              {/* Additional details for specific anomaly types */}
              {anomaly.type === 'LIQUIDITY_GAP' && anomaly.gap_count && (
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                  {anomaly.gap_count} levels affected
                </div>
              )}
              {anomaly.type === 'SPOOFING' && anomaly.volume_ratio && (
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                  Volume dropped {anomaly.volume_ratio.toFixed(1)}x at ${anomaly.price_level?.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}