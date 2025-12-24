import React from 'react';

export default function LiquidityGapMonitor({ snapshot, data = [] }) {
  // Get recent liquidity gap events
  const recentGaps = data
    .filter(d => d.anomalies?.some(a => a.type === 'LIQUIDITY_GAP'))
    .slice(-10);

  const currentGaps = snapshot?.anomalies?.filter(a => a.type === 'LIQUIDITY_GAP') || [];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#3b82f6';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      default: return '🔵';
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '0.875rem', 
        fontWeight: 600, 
        color: '#e5e7eb', 
        textTransform: 'uppercase', 
        letterSpacing: '0.5px',
        borderBottom: '1px solid #374151',
        paddingBottom: '8px'
      }}>
        💧 Liquidity Gap Monitor
      </h4>

      {/* Current Status */}
      <div style={{ marginBottom: '12px' }}>
        {currentGaps.length > 0 ? (
          currentGaps.map((gap, idx) => (
            <div 
              key={idx}
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${getSeverityColor(gap.severity)}`,
                borderRadius: '6px',
                marginBottom: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: getSeverityColor(gap.severity), fontWeight: 'bold', fontSize: '0.8rem' }}>
                  {getSeverityIcon(gap.severity)} ACTIVE GAP
                </span>
                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                  {gap.gap_count} levels affected
                </span>
              </div>
              <div style={{ color: '#d1d5db', fontSize: '0.85rem', marginTop: '4px' }}>
                {gap.message}
              </div>
              {gap.total_gap_volume !== undefined && (
                <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '2px' }}>
                  Total gap volume: {gap.total_gap_volume.toFixed(0)}
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ 
            padding: '12px', 
            textAlign: 'center', 
            color: '#4b5563',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '6px'
          }}>
            ✅ No liquidity gaps detected
          </div>
        )}
      </div>

      {/* Recent History */}
      {recentGaps.length > 0 && (
        <div>
          <h5 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '0.75rem', 
            color: '#9ca3af',
            textTransform: 'uppercase'
          }}>
            Recent Events ({recentGaps.length})
          </h5>
          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
            {recentGaps.reverse().map((event, idx) => {
              const gap = event.anomalies.find(a => a.type === 'LIQUIDITY_GAP');
              return (
                <div 
                  key={idx}
                  style={{
                    padding: '6px 8px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderLeft: `3px solid ${getSeverityColor(gap.severity)}`,
                    marginBottom: '4px',
                    fontSize: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: getSeverityColor(gap.severity) }}>
                      {gap.gap_count} gaps
                    </span>
                    <span style={{ color: '#6b7280' }}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}