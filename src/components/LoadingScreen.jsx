import React, { useState, useEffect, useRef } from 'react';

const LOADING_STEPS = [
  'Iniciando arquitectura sináptica Drosophila...',
  'Compilando conectoma FlyWire FAFB v783 (139.255 neuronas)...',
  'Mapeando 54.5M sinapsis químicas y circuitos neuropilos...',
  'Calibrando osciloscopio eEEG y matriz de neurotransmisores...',
  'Sincronizando modelo biofísico y entorno sensorial...',
  'Bio-simulación neural en línea.'
];

export default function LoadingScreen({ onLoaded }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(12);
  const [fadeOut, setFadeOut] = useState(false);

  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2200; // 2.2 seconds total duration
    let animId;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      
      // Easing for scientific progress bar: fast start, smooth middle, quick finish
      const eased = Math.min(100, Math.round(12 + (100 - 12) * Math.sin((t * Math.PI) / 2)));
      setProgress(eased);

      // Determine step based on progress
      const currentStep = Math.min(
        LOADING_STEPS.length - 1,
        Math.floor(t * LOADING_STEPS.length)
      );
      setStepIndex(currentStep);

      if (t < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setStepIndex(LOADING_STEPS.length - 1);
        setFadeOut(true);
        setTimeout(() => {
          if (onLoadedRef.current) {
            onLoadedRef.current();
          }
        }, 550);
      }
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []); // Run once on mount!

  return (
    <div className={`sci-loader-container ${fadeOut ? 'sci-fade-out' : ''}`}>
      <div className="sci-loader-backdrop" />
      
      <div className="sci-loader-content">
        {/* Holographic Synaptic Ring & Neuron Icon */}
        <div className="sci-spinner-wrapper">
          <div className="sci-spinner-ring outer" />
          <div className="sci-spinner-ring middle" />
          <div className="sci-spinner-ring inner" />
          
          <div className="sci-spinner-center">
            <svg viewBox="0 0 48 48" className="sci-dna-icon">
              {/* Central Drosophila neuron cluster icon */}
              <circle cx="24" cy="24" r="5" fill="#38bdf8" />
              <line x1="24" y1="24" x2="12" y2="12" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.8" />
              <circle cx="12" cy="12" r="3" fill="#00f2fe" />
              <line x1="24" y1="24" x2="36" y2="12" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.8" />
              <circle cx="36" cy="12" r="3" fill="#00f2fe" />
              <line x1="24" y1="24" x2="10" y2="34" stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.8" />
              <circle cx="10" cy="34" r="2.5" fill="#a78bfa" />
              <line x1="24" y1="24" x2="38" y2="34" stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.8" />
              <circle cx="38" cy="34" r="2.5" fill="#a78bfa" />
              <line x1="24" y1="24" x2="24" y2="40" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.8" />
              <circle cx="24" cy="40" r="2" fill="#38bdf8" />
            </svg>
          </div>
        </div>

        {/* Scientific Header & System Designation */}
        <div className="sci-brand-group">
          <div className="sci-badge-tag">
            <span className="sci-status-pulse"></span>
            NEURO-COMPUTATIONAL PIPELINE v2.4
          </div>
          <h1 className="sci-title">FLYBRAIN</h1>
          <p className="sci-subtitle">IN SILICO DROSOPHILA CONNECTOME EMULATION</p>
        </div>

        {/* Progress Bar & Telemetry Status */}
        <div className="sci-bar-card">
          <div className="sci-bar-header">
            <span className="sci-log-text">{LOADING_STEPS[stepIndex]}</span>
            <span className="sci-percent-text">{progress}%</span>
          </div>

          <div className="sci-progress-track">
            <div 
              className="sci-progress-indicator" 
              style={{ width: `${progress}%` }} 
            />
          </div>

          <div className="sci-meta-row">
            <span>MEM: 139K NODES</span>
            <span>SYN: 54.5M ACTIVE</span>
            <span>PRECISION: FP32</span>
          </div>
        </div>
      </div>
    </div>
  );
}
