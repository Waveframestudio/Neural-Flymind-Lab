import React from 'react';

export default function ResearchModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const PAPERS = [
    {
      title: "Complete connectome of an adult Drosophila melanogaster brain",
      authors: "Dorkenwald et al. (FlyWire Consortium / Princeton / HHMI / Cambridge)",
      journal: "Nature (2024)",
      doi: "https://doi.org/10.1038/s41586-024-07558-y",
      summary: "El primer mapa sináptico completo del cerebro de una mosca del vinagre adulta. Identifica ~139,255 neuronas y más de 50 millones de conexiones sinápticas, permitiendo trazar los circuitos de visión, olfato, navegación y memoria a resolución de nanómetros.",
      highlights: [
        "Reconstrucción 3D mediante microscopía electrónica de transmisión en serie (sTEM).",
        "Clasificación computacional de más de 8,400 tipos de neuronas.",
        "Mapeo de neurotransmisores predicho por modelos de aprendizaje profundo."
      ]
    },
    {
      title: "Neuronal wiring diagram of an adult Drosophila brain",
      authors: "Schlegel et al. (FlyWire Consortium / MRC LMB)",
      journal: "Nature (2024)",
      doi: "https://doi.org/10.1038/s41586-024-07968-d",
      summary: "Análisis exhaustivo del diagrama de conexiones celulares y jerarquía del flujo de información en el cerebro de Drosophila. Muestra la integración sensorial-motora desde los receptores antenales y ópticos hasta los descendientes del cordón nervioso central.",
      highlights: [
        "Anotación consensuada por más de 200 científicos globales.",
        "Identificación de circuitos de retroalimentación en cuerpos pedunculados.",
        "Disponibilidad pública de la matriz conectómica completa."
      ]
    },
    {
      title: "Google Research & Janelia Hemibrain Connectome Data Release",
      authors: "Google Research (Connectomics team) & HHMI Janelia Research Campus",
      journal: "biorXiv / FlyEM Project (2020 - 2024)",
      doi: "https://research.google/blog/releasing-the-hemibrain-connectome/",
      summary: "Proyecto colaborativo pionero de Google e HHMI para procesar terabytes de datos de microscopía electrónica empleando redes neuronales convolucionales 3D de alta precisión (Flood-Filling Networks) para segmentación automática y reconstrucción de sinapsis.",
      highlights: [
        "Alineación y renderizado de volumen volumétrico tridimensional a escala petabyte.",
        "Modelos de IA de Google para predicción automática de tipos sinápticos.",
        "Publicación abierta en la plataforma Neuroglancer y repositorios de datos de Google Cloud."
      ]
    }
  ];

  const RESOURCES = [
    { name: "FlyWire Brain Explorer", url: "https://flywire.ai", desc: "Plataforma colaborativa 3D de exploración del conectoma completo de la mosca." },
    { name: "Codex (FlyWire Data Portal)", url: "https://codex.flywire.ai", desc: "Base de datos interactiva para buscar tipos neuronales y matrices de conectividad." },
    { name: "Google Research Connectomics", url: "https://research.google/teams/brain/connectomics/", desc: "Publicaciones e investigación de IA aplicada a la reconstrucción del conectoma." },
    { name: "NeuPrint HHMI Janelia", url: "https://neuprint.janelia.org", desc: "Herramientas de consulta analítica del proyecto Hemibrain de Janelia." }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content research-modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '820px', maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '0.8rem' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              🔬 Investigación & Copia Digital del Cerebro
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Base científica y repositorios del primer mapa del conectoma completo de Drosophila melanogaster
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', paddingRight: '0.4rem', flex: 1, marginTop: '0.8rem' }}>
          
          {/* Banner Resumen */}
          <div style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(168, 85, 247, 0.12))', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '1.2rem' }}>
            <h3 style={{ margin: '0 0 0.4rem 0', color: '#38bdf8', fontSize: '1rem' }}>
              🧬 El Hito Histórico de la Neurociencia (Nature, 2024)
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
              En 2024, el consorcio internacional <strong>FlyWire</strong> en colaboración con <strong>Google Research</strong> y <strong>Princeton University</strong> logró completar el primer diagrama de conexiones sinápticas (conectoma) de un cerebro de un animal adulto complejo. Esta copia digital alberga <strong>~139,255 neuronas</strong> y más de <strong>50 millones de conexiones</strong>, sirviendo como la base del modelo computacional interactivo simulado en esta aplicación.
            </p>
          </div>

          {/* Sección de Papers y Estudios */}
          <h3 style={{ color: '#f8fafc', fontSize: '0.95rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📄 Estudios Científicos & Papers Clave
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {PAPERS.map((paper, idx) => (
              <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '0.9rem' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '0.2rem' }}>
                  {paper.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: '600', marginBottom: '0.4rem' }}>
                  {paper.authors} — <span style={{ color: '#94a3b8' }}>{paper.journal}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 0.6rem 0', lineHeight: '1.4' }}>
                  {paper.summary}
                </p>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', borderRadius: '6px', padding: '0.5rem 0.7rem', marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 'bold', marginBottom: '0.2rem' }}>ASPECTOS DESTACADOS:</div>
                  <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                    {paper.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
                <a 
                  href={paper.doi} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.75rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  🔗 Leer Estudio Completo (DOI / Publication) &rarr;
                </a>
              </div>
            ))}
          </div>

          {/* Sección de Repositorios y Links Oficiales */}
          <h3 style={{ color: '#f8fafc', fontSize: '0.95rem', marginBottom: '0.8rem' }}>
            🌐 Repositorios Oficiales & Portales de Datos
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
            {RESOURCES.map((res, idx) => (
              <a 
                key={idx}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', padding: '0.8rem', textDecoration: 'none', transition: 'border-color 0.2s' }}
              >
                <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                  {res.name} ↗
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: '1.3' }}>
                  {res.desc}
                </div>
              </a>
            ))}
          </div>

        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.8rem', marginTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Simulación Neuro-computacional desarrollada por Waveframe Studio
          </span>
          <button className="tool-btn active" onClick={onClose} style={{ padding: '0.35rem 1rem' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
