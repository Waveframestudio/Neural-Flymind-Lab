import React from 'react';
import { caretakerBridge } from '../services/caretakerBridge';
import * as storage from '../services/caretakerStorage';
import { BRAIN } from '../connectome';

export default function ReportModal({ isOpen, onClose, lightState, tempState }) {
  if (!isOpen) return null;

  const incidents = storage.getIncidents(100);
  const actionLogs = caretakerBridge.actionLogs || [];
  const telemetryHistory = caretakerBridge.telemetryHistory || [];
  const currentState = caretakerBridge.lastState || {};

  const handleExportJSON = () => {
    const reportData = {
      project: 'FlyBrain Bio-Lab Connectome',
      exportedAt: new Date().toISOString(),
      environment: {
        lightState,
        tempState,
        lightLevel: BRAIN.stimulate ? BRAIN.stimulate.lightLevel : 1.0,
        temperature: BRAIN.stimulate ? BRAIN.stimulate.temperature : 0.5,
      },
      currentDrives: currentState.drives || {},
      currentBehavior: currentState.behaviorState || 'idle',
      totalStimulusActions: actionLogs.length,
      actionHistory: actionLogs,
      incidentsLogged: incidents,
      telemetryTimeline: telemetryHistory,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `FlyBrain_Experiment_Report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FlyBrain Technical Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #1e293b; line-height: 1.5; }
          h1 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 4px; }
          .subtitle { color: #64748b; font-size: 14px; margin-bottom: 20px; }
          .summary-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .metric { font-size: 13px; }
          .metric-val { font-weight: bold; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th { background: #0f172a; color: #fff; text-align: left; padding: 8px; }
          td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; background: #e2e8f0; color: #334155; }
          .badge-high { background: #fecdd3; color: #9f1239; }
          .badge-medium { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>FlyBrain - Reporte Técnico de Experimento</h1>
        <div class="subtitle">Desarrollado por Waveframe Studio | Generado: ${new Date().toLocaleString()}</div>

        <div class="summary-box">
          <div class="metric">Mosca Drosophila: <span class="metric-val">Drosophila melanogaster</span></div>
          <div class="metric">Estado de Comportamiento: <span class="metric-val">${(currentState.behaviorState || 'idle').toUpperCase()}</span></div>
          <div class="metric">Iluminación Ambiental: <span class="metric-val">${lightState.toUpperCase()}</span></div>
          <div class="metric">Temperatura Ambiental: <span class="metric-val">${tempState.toUpperCase()}</span></div>
          <div class="metric">Hambre Acumulada: <span class="metric-val">${((currentState.drives?.hunger || 0) * 100).toFixed(1)}%</span></div>
          <div class="metric">Nivel de Miedo: <span class="metric-val">${((currentState.drives?.fear || 0) * 100).toFixed(1)}%</span></div>
        </div>

        <h3>Historial de Estímulos y Acciones de Laboratorio (${actionLogs.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Estímulo / Acción Aplicada</th>
              <th>Miedo Posterior</th>
              <th>Hambre</th>
            </tr>
          </thead>
          <tbody>
            ${actionLogs.slice(-15).reverse().map(log => `
              <tr>
                <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
                <td><strong>${log.action.toUpperCase()}</strong></td>
                <td>${log.drives ? (log.drives.fear * 100).toFixed(0) + '%' : 'N/A'}</td>
                <td>${log.drives ? (log.drives.hunger * 100).toFixed(0) + '%' : 'N/A'}</td>
              </tr>
            `).join('') || '<tr><td colspan="4">Sin acciones registradas en esta sesión.</td></tr>'}
          </tbody>
        </table>

        <h3>Incidentes y Diagnósticos Registrados (${incidents.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Severidad</th>
              <th>Tipo de Incidente</th>
              <th>Descripción Técnica</th>
            </tr>
          </thead>
          <tbody>
            ${incidents.slice(0, 10).map(inc => `
              <tr>
                <td>${new Date(inc.timestamp).toLocaleString()}</td>
                <td><span class="badge ${inc.severity === 'high' ? 'badge-high' : inc.severity === 'medium' ? 'badge-medium' : ''}">${inc.severity.toUpperCase()}</span></td>
                <td>${inc.incident_type}</td>
                <td>${inc.description}</td>
              </tr>
            `).join('') || '<tr><td colspan="4">No hay incidentes registrados.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Experimento desarrollado por Waveframe Studio - Sistema Bio-Computacional FlyBrain v1.0
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <h2>📊 Consola de Registro de Experimentos</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <p className="modal-description" style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Descargue el informe técnico completo con el historial de estímulos (alimento, viento, toques, luz, temperatura) y los registros de telemetría metabólica durante la sesión actual.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold' }}>ACCIONES REGISTRADAS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#f8fafc' }}>{actionLogs.length}</div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold' }}>INCIDENTES DETECTADOS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#f8fafc' }}>{incidents.length}</div>
            </div>
          </div>

          <h4 style={{ color: '#38bdf8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>ÚLTIMOS ESTÍMULOS APLICADOS:</h4>
          <div style={{ background: '#090d16', borderRadius: '6px', padding: '0.6rem', maxHeight: '160px', overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.8rem' }}>
            {actionLogs.length === 0 ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: '0.5rem' }}>Aún no se han aplicado estímulos en esta sesión.</div>
            ) : (
              actionLogs.slice(-10).reverse().map((log, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: '4px 0' }}>
                  <span style={{ color: '#cbd5e1' }}>{log.action.toUpperCase()}</span>
                  <span style={{ color: '#64748b' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="tool-btn" onClick={handleExportJSON} style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8', color: '#38bdf8' }}>
            📥 Exportar JSON
          </button>
          <button className="tool-btn active" onClick={handleExportPDF} style={{ background: '#0284c7', borderColor: '#38bdf8', color: '#fff' }}>
            📄 Exportar PDF / Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
