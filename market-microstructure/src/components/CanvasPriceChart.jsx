import React, { useRef, useEffect, useState } from "react";

export default function CanvasPriceChart({
  data,
  width = "100%",
  height = 250,
  scale = 1,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState(null);
  const [dimensions, setDimensions] = useState({ w: 600, h: 250 });

  // Constants for layout - reduced padding for full width
  const PADDING = { top: 20, right: 50, bottom: 20, left: 10 };

  // Helper to format price
  const formatPrice = (p) => p.toFixed(2);
  const formatTime = (iso) => {
    const d = new Date(iso);
    return `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
  };

  // Handle Resize with ResizeObserver for better responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        setDimensions({ w: clientWidth, h: height });
      }
    };

    // Use ResizeObserver for more efficient resizing
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    handleResize(); // Init

    return () => {
      resizeObserver.disconnect();
    };
  }, [height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { w, h } = dimensions;

    // DPI Scaling for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas (using logical coords)
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#0a0f0a";
    ctx.fillRect(0, 0, w, h);

    if (!data || data.length < 2) {
      ctx.fillStyle = "#00ff7f";
      ctx.font = "12px 'Orbitron', monospace";
      ctx.textAlign = "center";
      ctx.fillText("Waiting for data...", w / 2, h / 2);
      return;
    }

    const CHART_WIDTH = w - PADDING.left - PADDING.right;
    const CHART_HEIGHT = h - PADDING.top - PADDING.bottom;

    // Calculate scales
    const prices = data.map((d) => d.mid_price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const yMin = minPrice - priceRange * 0.1;
    const yMax = maxPrice + priceRange * 0.1;
    const yRange = yMax - yMin;

    const getX = (index) =>
      PADDING.left + (index / (data.length - 1)) * CHART_WIDTH;
    const getY = (price) =>
      PADDING.top + CHART_HEIGHT - ((price - yMin) / yRange) * CHART_HEIGHT;

    // --- Draw Grid with Axis Labels ---
    ctx.strokeStyle = "rgba(0, 255, 127, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const y = PADDING.top + (CHART_HEIGHT * i) / 4;
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(w - PADDING.right, y);

      // Y-Axis Price Labels on right side
      const priceLabel = yMax - i * (yRange / 4);
      ctx.fillStyle = "#00ff7f";
      ctx.font = "10px 'Orbitron', monospace";
      ctx.textAlign = "left";
      ctx.fillText(formatPrice(priceLabel), w - PADDING.right + 5, y + 3);
    }
    ctx.stroke();

    // X-Axis Time Labels
    ctx.fillStyle = "#00ff7f";
    ctx.font = "9px 'Orbitron', monospace";
    ctx.textAlign = "center";
    const timeLabels = [0, Math.floor(data.length / 2), data.length - 1];
    timeLabels.forEach(idx => {
      if (idx >= 0 && idx < data.length) {
        const x = getX(idx);
        const time = formatTime(data[idx].timestamp);
        ctx.fillText(time, x, h - 5);
      }
    });

    // --- Draw Area Gradient ---
    const gradient = ctx.createLinearGradient(
      0,
      PADDING.top,
      0,
      h - PADDING.bottom
    );
    gradient.addColorStop(0, "rgba(0, 255, 127, 0.15)"); // Cyber green low opacity
    gradient.addColorStop(1, "rgba(0, 255, 127, 0.0)");

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(prices[0]));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(getX(i), getY(prices[i]));
    }
    ctx.lineTo(getX(data.length - 1), h - PADDING.bottom);
    ctx.lineTo(getX(0), h - PADDING.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // --- Draw Mid Price Line ---
    ctx.beginPath();
    ctx.strokeStyle = "#00ff7f"; // Cyber green
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(0, 255, 127, 0.3)";
    ctx.shadowBlur = 4;
    ctx.moveTo(getX(0), getY(prices[0]));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(getX(i), getY(prices[i]));
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // --- Draw Microprice ---
    ctx.beginPath();
    ctx.strokeStyle = "#ff3232"; // Red for microprice
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    const microprices = data.map((d) => d.microprice);
    ctx.moveTo(getX(0), getY(microprices[0]));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(getX(i), getY(microprices[i]));
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Draw Trade Markers ---
    data.forEach((d, i) => {
      if (d.trade_volume > 0) {
        const x = getX(i);
        const y = getY(d.last_trade_price || d.mid_price);
        // Scale radius by volume
        const radius = Math.min(Math.max(Math.log10(d.trade_volume || 10), 2), 6); 
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        
        let color = '#00ff7f'; // Cyber green default
        if (d.trade_side === 'buy') color = '#00ff7f';
        else if (d.trade_side === 'sell') color = '#ff3232';
        
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#0a0f0a';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // --- Draw Crosshair & Tooltip ---
    if (mousePos) {
      const { x } = mousePos;

      if (x >= PADDING.left && x <= w - PADDING.right) {
        const ratio = (x - PADDING.left) / CHART_WIDTH;
        const index = Math.round(ratio * (data.length - 1));
        const safeIndex = Math.max(0, Math.min(index, data.length - 1));
        const point = data[safeIndex];

        const pointX = getX(safeIndex);
        const pointY = getY(point.mid_price);

        // Vertical Line
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0, 255, 127, 0.6)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.moveTo(pointX, PADDING.top);
        ctx.lineTo(pointX, h - PADDING.bottom);
        ctx.stroke();

        // Dot
        ctx.beginPath();
        ctx.fillStyle = "#00ff7f";
        ctx.shadowColor = "rgba(0, 255, 127, 0.5)";
        ctx.shadowBlur = 6;
        ctx.arc(pointX, pointY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Compact Tooltip
        const tooltipW = 100;
        const tooltipH = 45;
        let tooltipX = pointX + 10;
        let tooltipY = pointY - 50;

        if (tooltipX + tooltipW > w) tooltipX = pointX - tooltipW - 10;
        if (tooltipY < 0) tooltipY = pointY + 10;

        ctx.fillStyle = "rgba(0, 20, 0, 0.95)";
        ctx.strokeStyle = "rgba(0, 255, 127, 0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.fillRect(tooltipX, tooltipY, tooltipW, tooltipH);
        ctx.strokeRect(tooltipX, tooltipY, tooltipW, tooltipH);

        ctx.fillStyle = "#00ff7f";
        ctx.font = "11px 'Orbitron', monospace";
        ctx.textAlign = "left";
        ctx.fillText(
          `${point.mid_price.toFixed(2)}`,
          tooltipX + 8,
          tooltipY + 16
        );
        ctx.fillStyle = "rgba(0, 255, 127, 0.7)";
        ctx.font = "10px 'Orbitron', monospace";
        ctx.fillText(formatTime(point.timestamp), tooltipX + 8, tooltipY + 32);
      }
    }
  }, [data, dimensions, mousePos]);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    // Account for scale transform
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', overflow: 'hidden', width: '100%' }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', fontWeight: 700, color: '#00ff7f', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'Orbitron', monospace", textShadow: '0 0 10px rgba(0, 255, 127, 0.3)' }}>Price Action</h4>
      <canvas 
        ref={canvasRef} 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block', cursor: 'crosshair', width: '100%' }}
      />
    </div>
  );
}