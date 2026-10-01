import React, { useState } from 'react';

const EDUCATION_REGIONS = [
  {
    id: 'optic-lobes',
    name: 'Lóbulos Ópticos',
    neurons: ['VIS_R1R6', 'VIS_R7R8', 'VIS_ME', 'VIS_LO', 'VIS_LC', 'VIS_LPTC'],
    type: 'sensory',
    explanation: 'Los lóbulos ópticos son los centros de procesamiento visual de la mosca, uno a cada lado del cerebro. Detectan movimiento, color, bordes y objetos en acercamiento. Casi la mitad del cerebro de la mosca está dedicada a la visión.',
    analogy: 'Como tu corteza visual, pero optimizada para detectar movimientos ultrarrápidos y esquivar matamoscas.',
    interaction: 'Cambia la configuración de Luz entre Brillante, Tenue u Oscura y observa la respuesta de los lóbulos ópticos.',
    populationEstimate: '~60,000 neuronas en la mosca real',
  },
  {
    id: 'antennal-lobes',
    name: 'Lóbulos Antenales',
    neurons: ['OLF_ORN_FOOD', 'OLF_ORN_DANGER', 'OLF_LN', 'OLF_PN'],
    type: 'sensory',
    explanation: 'Los lóbulos antenales procesan los olores detectados por las antenas. Diferentes olores activan distintos glomérulos, permitiendo a la mosca distinguir entre alimento y peligro.',
    analogy: 'Como tu bulbo olfatorio: la primera parada de la información del olor antes de llegar a regiones superiores.',
    interaction: 'Coloca comida en el lienzo y observa cómo se activan las neuronas olfativas cuando la mosca la detecta.',
    populationEstimate: '~2,600 neuronas distribuidas en ~50 glomérulos',
  },
  {
    id: 'mushroom-bodies',
    name: 'Cuerpos Pedunculados',
    neurons: ['MB_KC', 'MB_APL', 'MB_MBON_APP', 'MB_MBON_AV', 'MB_DAN_REW', 'MB_DAN_PUN'],
    type: 'central',
    explanation: 'Los cuerpos pedunculados (Mushroom Bodies) son el centro de aprendizaje y memoria de la mosca. Asocian olores con recompensas o castigos, permitiéndole aprender qué aromas representan comida.',
    analogy: 'Como el hipocampo de la mosca: forman y recuerdan memorias olfativas.',
    interaction: 'Alimenta a la mosca repetidamente y observa la activación de las neuronas dopaminérgicas (DAN) junto a las células de Kenyon.',
    populationEstimate: '~2,000 células de Kenyon + ~400 neuronas de salida/dopamina',
  },
  {
    id: 'central-complex',
    name: 'Complejo Central',
    neurons: ['CX_EPG', 'CX_PFN', 'CX_FC', 'CX_HDELTA', 'CLOCK_DN'],
    type: 'central',
    explanation: 'El complejo central es el centro de navegación de la mosca. Mantiene una brújula interna, rastrea la orientación de la mosca y coordina sus patrones de locomoción.',
    analogy: 'Como un GPS y sistema de dirección combinado: sabe hacia dónde apunta la mosca y planifica el rumbo.',
    interaction: 'Observa las neuronas brújula (EPG) a medida que la mosca camina y cambia de dirección.',
    populationEstimate: '~3,000 neuronas en la mosca real',
  },
];

export default function EducationModal({ isOpen, onClose }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  if (!isOpen) return null;

  const current = EDUCATION_REGIONS[selectedIdx];

  return (
    <div className="education-modal-backdrop" onClick={onClose}>
      <div id="education-panel" className="education-panel" onClick={(e) => e.stopPropagation()}>
        <div className="education-header">
          <span>Guía de Regiones Cerebrales y Conectoma</span>
          <button className="education-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="education-body">
          <div className="education-nav">
            {EDUCATION_REGIONS.map((r, i) => (
              <button
                key={r.id}
                className={`education-nav-btn ${i === selectedIdx ? 'active' : ''}`}
                onClick={() => setSelectedIdx(i)}
              >
                {r.name}
              </button>
            ))}
          </div>

          <div className="education-content">
            <h3>{current.name}</h3>
            <p className="education-pop">{current.populationEstimate}</p>
            <p className="education-text">{current.explanation}</p>
            <div className="education-box">
              <strong>Analogía:</strong> {current.analogy}
            </div>
            <div className="education-box">
              <strong>Pruébalo:</strong> {current.interaction}
            </div>
            <div className="education-neurons">
              <strong>Neuronas en esta región:</strong>
              <div className="neuron-tags">
                {current.neurons.map((n) => (
                  <span key={n} className="neuron-tag">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
