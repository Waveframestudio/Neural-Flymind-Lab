import React, { useState } from 'react';
import Toolbar from './components/Toolbar';
import LeftPanel from './components/LeftPanel';
import LeftSidebar from './components/LeftSidebar';
import RightPanel from './components/RightPanel';
import FlyCanvas from './components/FlyCanvas';
import CaretakerSidebar from './components/CaretakerSidebar';
import Brain3DModal from './components/Brain3DModal';
import HelpOverlay from './components/HelpOverlay';
import EducationModal from './components/EducationModal';
import ReportModal from './components/ReportModal';
import ResearchModal from './components/ResearchModal';
import LoadingScreen from './components/LoadingScreen';
import { BRAIN } from './connectome';
import { caretakerBridge } from './services/caretakerBridge';
import { bioAudio } from './services/bioAudio';
import './App.css';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTool, setActiveTool] = useState('feed');
  const [lightState, setLightState] = useState('bright');
  const [tempState, setTempState] = useState('neutral');
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBrain3DOpen, setIsBrain3DOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isResearchOpen, setIsResearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isEducationOpen, setIsEducationOpen] = useState(false);
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false });

  const handleToggleAudio = () => {
    const enabled = bioAudio.toggleAudio();
    setIsAudioEnabled(enabled);
  };

  const [drives, setDrives] = useState({
    behaviorState: 'idle',
    hunger: 0.1,
    fear: 0.0,
    fatigue: 0.1,
    curiosity: 0.5,
    groom: 0.0,
  });
  const [nodeActivations, setNodeActivations] = useState({});

  const handleToggleLight = () => {
    const states = ['bright', 'dim', 'dark'];
    const idx = (states.indexOf(lightState) + 1) % states.length;
    const next = states[idx];
    setLightState(next);

    const val = next === 'bright' ? 1.0 : next === 'dim' ? 0.5 : 0.0;
    if (BRAIN.stimulate) BRAIN.stimulate.lightLevel = val;
    caretakerBridge.logAction(`set_light_${next}`, { drives });
  };

  const handleToggleTemp = () => {
    const states = ['neutral', 'warm', 'cool'];
    const idx = (states.indexOf(tempState) + 1) % states.length;
    const next = states[idx];
    setTempState(next);

    const val = next === 'neutral' ? 0.5 : next === 'warm' ? 0.75 : 0.25;
    if (BRAIN.stimulate) BRAIN.stimulate.temperature = val;
    caretakerBridge.logAction(`set_temp_${next}`, { drives });
  };

  const handleLogAction = (actionName) => {
    caretakerBridge.logAction(actionName, { drives });
  };

  const handleUpdateCaretakerState = (stateData) => {
    caretakerBridge.updateState(stateData);
  };

  return (
    <div className="flybrain-app">
      <Toolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        lightState={lightState}
        onToggleLight={handleToggleLight}
        tempState={tempState}
        onToggleTemp={handleToggleTemp}
        onOpenBrain3D={() => setIsBrain3DOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenResearch={() => setIsResearchOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenEducation={() => setIsEducationOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        isLiteMode={isLiteMode}
        onToggleLite={() => setIsLiteMode(!isLiteMode)}
        isAudioEnabled={isAudioEnabled}
        onToggleAudio={handleToggleAudio}
        onCenter={() => {}}
        onClear={() => {}}
      />

      <LeftSidebar
        nodeActivations={nodeActivations}
        tooltip={tooltip}
        setTooltip={setTooltip}
      />

      <LeftPanel
        drives={drives}
        nodeActivations={nodeActivations}
        tooltip={tooltip}
        setTooltip={setTooltip}
      />

      <RightPanel
        drives={drives}
        nodeActivations={nodeActivations}
        lightState={lightState}
        tempState={tempState}
      />

      <CaretakerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <FlyCanvas
        activeTool={activeTool}
        lightState={lightState}
        tempState={tempState}
        setDrives={setDrives}
        setNodeActivations={setNodeActivations}
        onLogAction={handleLogAction}
        onUpdateCaretakerState={handleUpdateCaretakerState}
      />

      <Brain3DModal isOpen={isBrain3DOpen} onClose={() => setIsBrain3DOpen(false)} />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        lightState={lightState}
        tempState={tempState}
      />

      <ResearchModal
        isOpen={isResearchOpen}
        onClose={() => setIsResearchOpen(false)}
      />

      <HelpOverlay isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <EducationModal isOpen={isEducationOpen} onClose={() => setIsEducationOpen(false)} />

      {/* Scientific subtle Loading Screen */}
      {isLoading && <LoadingScreen onLoaded={() => setIsLoading(false)} />}

      {/* Fullscreen Mobile Portrait Orientation Lock Overlay */}
      <div className="rotate-overlay">
        <div className="rotate-icon-wrapper">
          <span className="rotate-icon">📱</span>
        </div>
        <div className="rotate-title">Gira tu dispositivo</div>
        <div className="rotate-desc">
          Para una experiencia de laboratorio bio-computacional óptima, coloca tu pantalla en posición horizontal.
        </div>
      </div>
    </div>
  );
}

