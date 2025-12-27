import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

export default function VPINChart({ data, isModal = false }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    // Filter for snapshots that have V-PIN data
    const vpinData = data.filter(d => d.vpin !== undefined);
    
    if (vpinData.length === 0) return null;
    
    // For small view, only show last 50 data points for stability
    // For modal, show all data
    const maxPoints = isModal ? vpinData.length : 50;
    const recentData = vpinData.slice(-maxPoints);
    
    const timestamps = recentData.map(d => d.timestamp);
    const values = recentData.map(d => d.vpin);
    
    // Color based on toxicity threshold
    // < 0.3: Low (Green)
    // 0.3 - 0.6: Medium (Yellow)
    // > 0.6: High (Red)
    const colors = values.map(v => {
      if (v >= 0.6) return '#ef4444';
      if (v >= 0.3) return '#eab308';
      return '#22c55e';
    });

    return {
      x: timestamps,
      y: values,
      marker: { color: colors }
    };
  }, [data, isModal]);

  if (!chartData) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        Waiting for V-PIN data...
      </div>
    );
  }

  // Different styling for modal vs small view
  const containerStyle = isModal ? {
    width: '100%',
    height: '100%',
    position: 'relative'
  } : {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const chartContainerStyle = isModal ? {
    width: '100%',
    height: '100%',
    position: 'relative'
  } : {
    width: '100%',
    height: '230px',
    position: 'relative'
  };

  return (
    <div style={containerStyle}>
      <div style={chartContainerStyle}>
        <Plot
          data={[
            {
              x: chartData.x,
              y: chartData.y,
              type: 'bar',
              marker: {
                color: chartData.marker.color
              },
              name: 'V-PIN',
              hovertemplate: '<b>%{y:.3f}</b><br>%{x}<extra></extra>'
            }
          ]}
          layout={{
            autosize: true,
            margin: { 
              l: isModal ? 50 : 35, 
              r: 10, 
              t: isModal ? 30 : 20, 
              b: isModal ? 40 : 30 
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            xaxis: {
              showgrid: false,
              color: '#6b7280',
              tickformat: isModal ? '%H:%M:%S' : '%H:%M',
              tickangle: -45,
              nticks: isModal ? 10 : 6,
              tickfont: {
                size: isModal ? 11 : 9
              }
            },
            yaxis: {
              showgrid: true,
              gridcolor: '#374151',
              color: '#6b7280',
              range: [0, 1],
              title: {
                text: isModal ? 'V-PIN Probability' : 'V-PIN',
                font: {
                  size: isModal ? 12 : 10
                }
              },
              tickfont: {
                size: isModal ? 11 : 9
              },
              dtick: 0.2
            },
            shapes: [
              {
                type: 'line',
                y0: 0.6,
                y1: 0.6,
                x0: chartData.x[0],
                x1: chartData.x[chartData.x.length - 1],
                line: {
                  color: '#ef4444',
                  width: isModal ? 2 : 1,
                  dash: 'dot'
                }
              }
            ],
            annotations: isModal ? [
              {
                x: chartData.x[Math.floor(chartData.x.length / 2)],
                y: 0.6,
                text: 'High Risk Threshold (0.6)',
                showarrow: false,
                yshift: 10,
                font: {
                  size: 10,
                  color: '#ef4444'
                }
              }
            ] : [],
            showlegend: false,
            bargap: 0.2
          }}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%' }}
          config={{ 
            displayModeBar: isModal,
            responsive: true
          }}
        />
        
        <div style={{
          position: 'absolute',
          top: isModal ? '35px' : '5px',
          right: '10px',
          background: 'rgba(17, 24, 39, 0.9)',
          padding: isModal ? '6px 10px' : '4px 8px',
          borderRadius: '4px',
          fontSize: isModal ? '0.75rem' : '0.65rem',
          display: 'flex',
          gap: isModal ? '12px' : '8px',
          pointerEvents: 'none',
          border: '1px solid #374151'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            color: '#9ca3af',
            whiteSpace: 'nowrap'
          }}>
            <span style={{
              width: isModal ? '8px' : '6px',
              height: isModal ? '8px' : '6px',
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              display: 'inline-block'
            }}></span>
            <span>{isModal ? 'Low Risk' : 'Low'}</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            color: '#9ca3af',
            whiteSpace: 'nowrap'
          }}>
            <span style={{
              width: isModal ? '8px' : '6px',
              height: isModal ? '8px' : '6px',
              borderRadius: '50%',
              backgroundColor: '#eab308',
              display: 'inline-block'
            }}></span>
            <span>{isModal ? 'Medium' : 'Med'}</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            color: '#9ca3af',
            whiteSpace: 'nowrap'
          }}>
            <span style={{
              width: isModal ? '8px' : '6px',
              height: isModal ? '8px' : '6px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              display: 'inline-block'
            }}></span>
            <span>{isModal ? 'High Risk' : 'High'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}