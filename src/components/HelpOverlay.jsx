import React from 'react';

export default function HelpOverlay({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div id="helpOverlay" className="help-overlay" style={{ display: 'block' }}>
      <div className="help-overlay-header">
        <span>Guía de Interacción</span>
        <button className="help-close-btn" id="helpCloseBtn" onClick={onClose}>
          &times;
        </button>
      </div>
      <div className="help-item">
        <strong>Alimentar</strong> -- Haz clic en el lienzo para colocar comida. La mosca la buscará y comerá cuando tenga hambre.
      </div>
      <div className="help-item">
        <strong>Tocar</strong> -- Haz clic cerca de la mosca para tocarla y asustarla o hacer que se acicale. Si tocas rápidamente 3 o más veces, reaccionará con un sobresalto de dolor.
      </div>
      <div className="help-item">
        <strong>Aire</strong> -- Haz clic y arrastra en el lienzo para soplar viento. La distancia del arrastre controla la fuerza del aire.
      </div>
      <div className="help-item">
        <strong>Luz</strong> -- Cambia entre Luz Brillante, Tenue u Oscura. La mosca muestra fototaxis dirigiéndose hacia la luz.
      </div>
      <div className="help-item">
        <strong>Temp</strong> -- Cambia entre Temperatura Neutra, Cálida y Fría. El calor aumenta la actividad y evitación, mientras que el frío promueve la exploración.
      </div>
    </div>
  );
}
