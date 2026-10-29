import React, { useState, useEffect, useRef } from 'react';

export default function RightPanel({ drives, nodeActivations, lightState, tempState }) {
  const [spikeCount, setSpikeCount] = useState(0);
  const [firingRate, setFiringRate] = useState(0);
  const flyCanvasRef = useRef(null);

  // Calculate live firing rate and total spikes
  useEffect(() => {
    const values = Object.values(nodeActivations);
    const activeNeurons = values.filter((v) => v > 5);
    const currentRate = activeNeurons.length;
    setFiringRate(currentRate);

    if (currentRate > 0) {
      setSpikeCount((prev) => prev + currentRate * 3);
    }
  }, [nodeActivations]);

  // Render Rotating 3D Bio-Spectrum Fly Hologram
  useEffect(() => {
    if (!flyCanvasRef.current) return;
    const canvas = flyCanvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let rotationAngle = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2 - 5;

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Cyberpunk background grid & circle
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 65, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 78, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
      ctx.stroke();

      // Hologram wireframe fly rotating in pseudo-3D
      ctx.save();
      ctx.translate(cx, cy);

      rotationAngle += 0.02;
      const cosA = Math.cos(rotationAngle);
      const sinA = Math.sin(rotationAngle);

      // Define 3D wireframe nodes of Drosophila fly
      const nodes3D = [
        // Head
        { x: 0, y: -26, z: 0, color: '#00f2fe' },
        { x: -7, y: -27, z: 4, color: '#ef4444' }, // Left eye
        { x: 7, y: -27, z: 4, color: '#ef4444' },  // Right eye
        { x: -5, y: -34, z: 2, color: '#38bdf8' }, // Left antenna
        { x: 5, y: -34, z: 2, color: '#38bdf8' },  // Right antenna
        // Thorax
        { x: 0, y: -10, z: 6, color: '#38bdf8' },
        { x: -9, y: -10, z: 0, color: '#38bdf8' },
        { x: 9, y: -10, z: 0, color: '#38bdf8' },
        // Abdomen
        { x: 0, y: 12, z: 4, color: '#38bdf8' },
        { x: -10, y: 15, z: -2, color: '#818cf8' },
        { x: 10, y: 15, z: -2, color: '#818cf8' },
        { x: 0, y: 26, z: 0, color: '#c084fc' },
        // Wings
        { x: -22 * Math.abs(cosA), y: -5, z: 12 * Math.sin(rotationAngle * 3), color: 'rgba(56, 189, 248, 0.8)' },
        { x: 22 * Math.abs(cosA), y: -5, z: -12 * Math.sin(rotationAngle * 3), color: 'rgba(56, 189, 248, 0.8)' },
      ];

      // Rotate nodes around Y-axis & project to 2D
      const projected = nodes3D.map((n) => {
        const rx = n.x * cosA - n.z * sinA;
        const rz = n.x * sinA + n.z * cosA;
        const scale = 1.6 + rz * 0.015;
        return {
          x: rx * scale,
          y: n.y * scale,
          z: rz,
          color: n.color,
        };
      });

      // Draw wireframe connecting lines
      const connections = [
        [0, 1], [0, 2], [0, 3], [0, 4], // Head & Eyes
        [0, 5], [5, 6], [5, 7], [5, 8], // Thorax
        [8, 9], [8, 10], [9, 11], [10, 11], // Abdomen
        [5, 12], [5, 13], // Wings
      ];

      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#00f2fe';

      connections.forEach(([p1, p2]) => {
        const pt1 = projected[p1];
        const pt2 = projected[p2];
        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.strokeStyle = pt1.color || 'rgba(56, 189, 248, 0.6)';
        ctx.stroke();
      });

      // Draw glowing node vertices
      projected.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.z > 0 ? 2.5 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.fill();
      });

      ctx.shadowBlur = 0;
      ctx.restore();

      // Spectrum label text
      ctx.font = '10px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('3D BIO-SPECTRUM HOLOGRAM', 10, h - 10);
      ctx.fillStyle = '#10b981';
      ctx.fillText('ROTATION: 360°', w - 95, h - 10);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Compute top firing neural circuits
  const activeCircuits = Object.entries(nodeActivations)
    .filter(([_, val]) => val > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const metabolism = Math.min(
    100,
    Math.round((1 - (drives.fatigue || 0) * 0.5 + (drives.hunger || 0) * 0.2) * 100)
  );

  return (
    <div className="right-panel">
      {/* Header bar flush with toolbar */}
      <div className="rp-header">
        <div className="rp-title-group">
          <span className="rp-badge">LAB TELEMETRY v2.4</span>
          <h3 className="rp-title">Métricas Neuronal</h3>
        </div>
        <div className="rp-status-indicator">
          <span className="status-dot pulsing"></span>
          <span className="status-text">ONLINE</span>
        </div>
      </div>

      <div className="right-panel-content">
        {/* METRICS & DRIVE ANALYTICS ONLY */}
        <div className="rp-tab-body">
          <div className="rp-metric-grid">
            <div className="rp-card">
              <div className="rp-card-label">Tasa Firing (Neuronas Active)</div>
              <div className="rp-card-value highlight">{firingRate} <span className="unit">Hz</span></div>
              <div className="rp-progress-bar">
                <div
                  className="rp-progress-fill cyan"
                  style={{ width: `${Math.min(100, (firingRate / 25) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="rp-card">
              <div className="rp-card-label">Potenciales Acción Totales</div>
              <div className="rp-card-value">{spikeCount.toLocaleString()} <span className="unit">spikes</span></div>
            </div>

            <div className="rp-card">
              <div className="rp-card-label">Índice Metabólico Estimado</div>
              <div className="rp-card-value green">{metabolism}%</div>
              <div className="rp-progress-bar">
                <div className="rp-progress-fill green" style={{ width: `${metabolism}%` }}></div>
              </div>
            </div>
          </div>

          {/* Dynamic Neural Signal Section */}
          <div className="rp-section">
            <div className="rp-section-header">Top Circuitos en Disparo</div>
            <div className="rp-circuit-list">
              {activeCircuits.length === 0 ? (
                <div className="rp-empty">Sin señales de disparo detectadas en el umbral.</div>
              ) : (
                activeCircuits.map(([name, val]) => (
                  <div key={name} className="rp-circuit-item">
                    <span className="circuit-name">{name.replace('_', ' ')}</span>
                    <div className="circuit-meter">
                      <div
                        className="circuit-fill"
                        style={{ width: `${Math.min(100, (val / 50) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="circuit-val">{Math.round(val)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Environmental Telemetry */}
          <div className="rp-section">
            <div className="rp-section-header">Monitoreo Ambiental</div>
            <div className="rp-env-grid">
              <div className="env-box">
                <span className="env-label">ILUMINACIÓN</span>
                <span className="env-val">{lightState.toUpperCase()}</span>
              </div>
              <div className="env-box">
                <span className="env-label">TEMPERATURA</span>
                <span className="env-val">{tempState.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* 3D Hologram Spectrum Section */}
          <div className="rp-section" style={{ marginTop: '0.4rem' }}>
            <div className="rp-section-header">Espectro Bio-3D de la Mosca</div>
            <div className="canvas-wrapper">
              <canvas ref={flyCanvasRef} width={260} height={170} className="osc-canvas" />
            </div>
          </div>

          {/* Neuro-Transmitter Matrix & Synaptic Density Monitor */}
          <div className="rp-section" style={{ marginTop: '0.4rem' }}>
            <div className="rp-section-header">Matriz de Neurotransmisores</div>
            <div className="rp-env-grid">
              <div className="env-box">
                <span className="env-label">DOPAMINA (DAN)</span>
                <span className="env-val" style={{ color: '#00f2fe' }}>
                  {Math.round((drives.hunger || 0.1) * 85 + 15)} pg/nL
                </span>
              </div>
              <div className="env-box">
                <span className="env-label">OCTOPAMINA (OA)</span>
                <span className="env-val" style={{ color: '#f59e0b' }}>
                  {Math.round((drives.fear || 0) * 120 + 20)} pg/nL
                </span>
              </div>
              <div className="env-box">
                <span className="env-label">ACETILCOLINA</span>
                <span className="env-val" style={{ color: '#4ade80' }}>
                  94.2 % (ACh)
                </span>
              </div>
              <div className="env-box">
                <span className="env-label">SEROTONINA (5-HT)</span>
                <span className="env-val" style={{ color: '#c084fc' }}>
                  {Math.round((1 - (drives.fatigue || 0)) * 60 + 30)} pg/nL
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Log Console */}
          <div className="rp-section" style={{ marginTop: '0.4rem' }}>
            <div className="rp-section-header">Consola de Diagnóstico Bio-Lógica</div>
            <div className="rp-card" style={{ fontFamily: 'monospace', fontSize: '0.68rem', gap: '0.25rem', background: '#070a12' }}>
              <div style={{ color: '#10b981' }}>[OK] FAFB v783 Synaptic Buffer Connected</div>
              <div style={{ color: '#38bdf8' }}>[SYS] Central Complex (CX) EPG Delta Active</div>
              <div style={{ color: '#c084fc' }}>[MEM] Mushroom Body KC Reinforcement Nominal</div>
              <div style={{ color: '#64748b' }}>[LOG] Worker Latency: 1.2ms | Memory: 14.8MB</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
