import React from 'react';

export default function Toolbar({
  activeTool,
  setActiveTool,
  lightState,
  onToggleLight,
  tempState,
  onToggleTemp,
  onOpenBrain3D,
  onOpenReport,
  onOpenResearch,
  onToggleSidebar,
  onOpenEducation,
  onOpenHelp,
  isLiteMode,
  onToggleLite,
  isAudioEnabled,
  onToggleAudio,
  onCenter,
  onClear,
}) {
  const getLightText = (state) => {
    if (state === 'bright') return 'Luz: Brillante';
    if (state === 'dim') return 'Luz: Tenue';
    return 'Luz: Oscura';
  };

  const getTempText = (state) => {
    if (state === 'warm') return 'Temp: Cálida';
    if (state === 'cool') return 'Temp: Fría';
    return 'Temp: Neutra';
  };

  return (
    <div id="toolbar">
      <div className="toolbar-left">
        <button
          className="tool-btn sidebar-toggle"
          id="sidebarToggle"
          aria-label="Abrir panel"
          onClick={onToggleSidebar}
        >
          &#9776;
        </button>

        <button
          className={`tool-btn ${activeTool === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTool('feed')}
        >
          Alimentar
        </button>
        <button
          className={`tool-btn ${activeTool === 'touch' ? 'active' : ''}`}
          onClick={() => setActiveTool('touch')}
        >
          Tocar
        </button>
        <button
          className={`tool-btn ${activeTool === 'air' ? 'active' : ''}`}
          onClick={() => setActiveTool('air')}
        >
          Aire
        </button>

        <button className="tool-btn" id="lightBtn" onClick={onToggleLight}>
          {getLightText(lightState)}
        </button>

        <button className="tool-btn" id="tempBtn" onClick={onToggleTemp}>
          {getTempText(tempState)}
        </button>

        <button className="tool-btn" id="brain3dBtn" onClick={onOpenBrain3D}>
          Cerebro 3D
        </button>

        <button className="tool-btn" id="researchBtn" onClick={onOpenResearch} title="Estudios Científicos y Copia Digital del Cerebro">
          🔬 Investigación
        </button>

        <button className="tool-btn" id="learnBtn" onClick={onOpenEducation}>
          Aprender
        </button>

        <button className="tool-btn" id="helpBtn" onClick={onOpenHelp}>
          ?
        </button>

        <button
          className={`tool-btn ${isLiteMode ? 'active' : ''}`}
          id="liteBtn"
          onClick={onToggleLite}
        >
          {isLiteMode ? 'Completo' : 'Básico'}
        </button>
      </div>

      <div className="toolbar-right">
        <span id="claudeStatus" className="claude-status" style={{ display: 'none' }}>
          <span className="claude-dot"></span>
          <span className="claude-status-text">AI</span>
        </span>
        <a
          href="https://waveframe.com.ar"
          target="_blank"
          rel="noopener noreferrer"
          className="toolbar-brand-link"
        >
          <span className="toolbar-title">Experimento desarrollado por Waveframe Studio</span>
          <img
            src="/logo/icon.png"
            height="26"
            className="noselect waveframe-logo-icon"
            alt="Waveframe Studio Logo 2D"
          />
        </a>
      </div>
    </div>
  );
}
