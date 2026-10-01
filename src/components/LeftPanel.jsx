import React, { useState, useEffect } from 'react';
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

const STATE_TRANSLATIONS = {
  idle: 'REPOSO',
  walk: 'CAMINANDO',
  explore: 'EXPLORANDO',
  feed: 'ALIMENTÁNDOSE',
  groom: 'ACICALÁNDOSE',
  startle: 'SOBRESALTO',
  fly: 'VOLANDO',
  brace: 'RESISTIENDO VIENTO',
  rest: 'DESCANSANDO',
  phototaxis: 'FOTOTAXIS',
};

export default function LeftPanel({
  drives = { behaviorState: 'idle', hunger: 0.1, fear: 0, fatigue: 0.1, curiosity: 0.5, groom: 0 },
  nodeActivations = {},
  subtitleText = '139,255 neuronas / 2.7M conexiones -- FlyWire FAFB v783',
  tooltip,
  setTooltip,
}) {
  const [panelVisible, setPanelVisible] = useState(true);
  const [viewMode, setViewMode] = useState('heatmap'); // 'heatmap' or 'groups'

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

  const stateText = STATE_TRANSLATIONS[drives.behaviorState] || (drives.behaviorState ? drives.behaviorState.toUpperCase() : 'REPOSO');

  return (
    <div id="left-panel" className="left-panel-container" style={{ display: panelVisible ? 'flex' : 'none' }}>
      <div id="connectome-panel" className="connectome-panel">
        <div className="connectome-header">
          <span className="connectome-label">Conectoma</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="connectome-toggle-btn"
              onClick={() => setViewMode(viewMode === 'heatmap' ? 'groups' : 'heatmap')}
            >
              {viewMode === 'heatmap' ? 'Grupos' : 'Mapa de calor (139K)'}
            </button>
            <button
              className="connectome-toggle-btn"
              onClick={() => setPanelVisible(!panelVisible)}
            >
              {panelVisible ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>
        <div className="connectome-subtitle" id="connectomeSubtitle">
          {subtitleText}
        </div>

        {/* Original horizontal column groups view */}
        <div id="nodeHolder" className="connectome-grid-groups" style={{ display: viewMode === 'groups' ? 'grid' : 'none' }}>
          {Object.entries(CATEGORY_GROUPS).map(([catName, category]) => (
            <div key={catName} className="cg-column">
              <div className="cg-nodes-list">
                {category.nodes.map((nodeName) => {
                  const val = nodeActivations[nodeName] || 0;
                  const isFiring = val > 5;
                  const dotCount = Math.min(18, Math.floor(val / 8));
                  const badgeLetter = category.badge;
                  return (
                    <div
                      key={nodeName}
                      className={`cg-row-item ${isFiring ? 'cg-active' : ''}`}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          visible: true,
                          name: nodeName,
                          val: Math.round(val),
                          x: rect.right + 10,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setTooltip({ visible: false })}
                    >
                      <span className="cg-badge" style={{ color: category.color, borderColor: category.color }}>
                        {badgeLetter}
                      </span>
                      <span className="cg-row-name" style={{ color: isFiring ? '#ffffff' : category.color }}>
                        {nodeName.toLowerCase().replace('_', ' ')}
                      </span>
                      {dotCount > 0 && (
                        <span className="cg-dots-container">
                          {Array.from({ length: dotCount }).map((_, di) => (
                            <span
                              key={di}
                              className="cg-active-dot"
                              style={{ backgroundColor: category.color }}
                            ></span>
                          ))}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {tooltip?.visible && (
          <div
            className="neuron-tooltip"
            style={{
              display: 'block',
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
            }}
          >
            <strong>{tooltip.name}</strong>
            <div>Actividad: {tooltip.val}</div>
          </div>
        )}
      </div>

      <div id="drive-meters">
        <div className="drive-row">
          <span className="drive-label">Estado</span>
          <span id="behaviorState" className="behavior-state">
            {stateText}
          </span>
        </div>
        <div className="drive-row">
          <span className="drive-label">Hambre</span>
          <div className="drive-bar-bg">
            <div
              className="drive-bar"
              id="driveHunger"
              style={{ width: `${Math.min(100, (drives.hunger || 0) * 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="drive-row">
          <span className="drive-label">Miedo</span>
          <div className="drive-bar-bg">
            <div
              className="drive-bar"
              id="driveFear"
              style={{ width: `${Math.min(100, (drives.fear || 0) * 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="drive-row">
          <span className="drive-label">Fatiga</span>
          <div className="drive-bar-bg">
            <div
              className="drive-bar"
              id="driveFatigue"
              style={{ width: `${Math.min(100, (drives.fatigue || 0) * 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="drive-row">
          <span className="drive-label">Curiosidad</span>
          <div className="drive-bar-bg">
            <div
              className="drive-bar"
              id="driveCuriosity"
              style={{ width: `${Math.min(100, (drives.curiosity || 0) * 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="drive-row">
          <span className="drive-label">Acicalado</span>
          <div className="drive-bar-bg">
            <div
              className="drive-bar"
              id="driveGroom"
              style={{ width: `${Math.min(100, (drives.groom || 0) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
