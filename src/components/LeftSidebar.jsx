import React, { useState, useEffect, useRef } from 'react';
import { BRAIN } from '../connectome';
import { NeuroRenderer } from '../services/neuroRenderer';

const CATEGORY_GROUPS = {
  Sensorial: {
    badge: 'S',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.4)',
    nodes: ['VIS_R1R6', 'VIS_R7R8', 'VIS_ME', 'VIS_LO', 'VIS_LC', 'VIS_LPTC', 'OLF_ORN_FOOD', 'OLF_ORN_DANGER', 'OLF_LN', 'OLF_PN', 'GUS_GR', 'MECH_BRISTLE', 'MECH_JO', 'MECH_CHORD', 'THERMO'],
  },
  Central: {
    badge: 'C',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.15)',
    border: 'rgba(139, 92, 246, 0.4)',
    nodes: ['MB_KC', 'MB_APL', 'MB_MBON_APP', 'MB_MBON_AV', 'MB_DAN_REW', 'MB_DAN_PUN', 'LH_APP', 'LH_AV', 'CX_EPG', 'CX_PFN', 'CX_FC', 'CX_HDELTA', 'SEZ_FEED', 'SEZ_GROOM', 'DN_STARTLE', 'DN_FLIGHT', 'DN_WALK', 'DN_TURN', 'DN_STOP', 'GNG_DESC', 'CLOCK_DN', 'ANTENNAL_LAL'],
  },
  Motivaciones: {
    badge: 'D',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    nodes: ['DRIVE_HUNGER', 'DRIVE_FEAR', 'DRIVE_FATIGUE', 'DRIVE_CURIOSITY', 'DRIVE_GROOM'],
  },
  Motor: {
    badge: 'M',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
    nodes: ['MN_LEG_L1', 'MN_LEG_R1', 'MN_LEG_L2', 'MN_LEG_R2', 'MN_LEG_L3', 'MN_LEG_R3', 'MN_WING_L', 'MN_WING_R', 'MN_PROBOSCIS', 'MN_HEAD', 'MN_ABDOMEN'],
  },
};

export default function LeftSidebar({ nodeActivations, tooltip, setTooltip }) {
  const [activeNeuronsCount, setActiveNeuronsCount] = useState(0);
  const [viewMode, setViewMode] = useState('groups'); // 'groups' | 'heatmap'

  const canvasRef = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => {
    const values = Object.values(nodeActivations);
    const active = values.filter((v) => v > 5).length;
    setActiveNeuronsCount(active);

    historyRef.current.push(active);
    if (historyRef.current.length > 40) {
      historyRef.current.shift();
    }
  }, [nodeActivations]);

  // Heatmap renderer effect
  useEffect(() => {
    let timer;
    if (viewMode === 'heatmap') {
      timer = setInterval(() => {
        if (BRAIN.workerReady && NeuroRenderer && !NeuroRenderer.isActive()) {
          NeuroRenderer.init();
        }
      }, 200);
    } else {
      if (NeuroRenderer && NeuroRenderer.isActive()) {
        NeuroRenderer.destroy();
      }
    }
    return () => clearInterval(timer);
  }, [viewMode]);

  // Render Oscilloscope
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = 'rgba(10, 15, 26, 0.5)';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const data = historyRef.current;
      if (data.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 8;

        const step = w / (data.length - 1);
        data.forEach((val, idx) => {
          const x = idx * step;
          const normalized = Math.min(1, val / 20);
          const y = h - 10 - normalized * (h - 20);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="left-panel-dock">
      {/* Header bar flush with toolbar */}
      <div className="rp-header">
        <div className="rp-title-group">
          <span className="rp-badge">NEURAL MONITOR</span>
          <h3 className="rp-title">Osciloscopio eEEG</h3>
        </div>
        <div className="rp-status-indicator">
          <span className="status-dot pulsing"></span>
          <span className="status-text">ACTIVE</span>
        </div>
      </div>

      <div className="lp-content">
        <div className="rp-tab-body">
          <div className="rp-section">
            <div className="rp-section-header">Señal Neuronal en Tiempo Real</div>
            <div className="canvas-wrapper">
              <canvas ref={canvasRef} width={260} height={120} className="osc-canvas" />
            </div>
          </div>

          <div className="rp-card">
            <div className="rp-card-label">Frecuencia Dominante</div>
            <div className="rp-card-value purple">
              {activeNeuronsCount > 12 ? '42.5 Hz (Gamma)' : activeNeuronsCount > 4 ? '8.2 Hz (Theta)' : '1.5 Hz (Delta)'}
            </div>
          </div>

          <div className="rp-section">
            <div className="rp-section-header">FlyWire FAFB Specs</div>
            <ul className="rp-spec-list">
              <li>
                <span className="spec-key">Neuronas Mapeadas:</span>
                <span className="spec-val">139,255</span>
              </li>
              <li>
                <span className="spec-key">Sinapsis Químicas:</span>
                <span className="spec-val">54.5M</span>
              </li>
            </ul>
          </div>

          {/* Integrated Connectome Section */}
          <div className="rp-section">
            <div className="connectome-header" style={{ justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <div className="rp-section-header" style={{ margin: 0 }}>Red Conectoma</div>
              <button
                className="connectome-toggle-btn"
                onClick={() => setViewMode(viewMode === 'heatmap' ? 'groups' : 'heatmap')}
              >
                {viewMode === 'heatmap' ? 'Grupos' : 'Mapa 139K'}
              </button>
            </div>

            {viewMode === 'groups' && (
              <div className="lp-groups-list">
                {Object.entries(CATEGORY_GROUPS).map(([catName, category]) => (
                  <div key={catName} className="lp-group-block">
                    <div className="lp-group-title" style={{ color: category.color }}>
                      <span>{category.badge}</span> {catName}
                    </div>
                    <div className="lp-node-tags">
                      {category.nodes.map((nodeName) => {
                        const val = nodeActivations[nodeName] || 0;
                        const isFiring = val > 5;
                        return (
                          <span
                            key={nodeName}
                            className={`lp-node-chip ${isFiring ? 'firing' : ''}`}
                            style={{
                              borderColor: isFiring ? category.color : 'rgba(255,255,255,0.08)',
                              color: isFiring ? '#ffffff' : category.color,
                              backgroundColor: isFiring ? category.bg : 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              if (!setTooltip) return;
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltip({
                                visible: true,
                                name: nodeName,
                                val: Math.round(val),
                                x: rect.right + 10,
                                y: rect.top,
                              });
                            }}
                            onMouseLeave={() => setTooltip && setTooltip({ visible: false })}
                          >
                            {nodeName.toLowerCase().replace('_', ' ')}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
