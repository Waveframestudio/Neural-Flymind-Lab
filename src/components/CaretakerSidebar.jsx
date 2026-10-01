import React, { useState, useEffect, useRef } from 'react';
import * as storage from '../services/caretakerStorage';
import { caretakerBridge } from '../services/caretakerBridge';

export default function CaretakerSidebar({ isOpen, onClose }) {
  const [activities, setActivities] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [showCalendar, setShowCalendar] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Load initial storage items
    const initialIncidents = storage.getIncidents(30);
    const initialChat = storage.getChatHistory(30);
    setActivities(initialIncidents);
    setChatMessages(initialChat);

    const unsubscribe = caretakerBridge.subscribe((evt) => {
      if (evt.type === 'activity_action' || evt.type === 'activity_incident') {
        setActivities((prev) => [evt, ...prev.slice(0, 49)]);
      } else if (evt.type === 'chat_message') {
        setChatMessages((prev) => [...prev, evt.message]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;
    caretakerBridge.sendChatMessage(chatInputText);
    setChatInputText('');
  };

  const dailySummaries = storage.getDailySummaries();

  return (
    <>
      <div
        id="caretaker-sidebar"
        className={`caretaker-sidebar ${isOpen ? 'open' : ''}`}
      >
        <div className="caretaker-sidebar-header">
          <span className="caretaker-sidebar-title">Historial de Actividad</span>
          <button
            className="caretaker-sidebar-close"
            id="caretaker-sidebar-close"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="activity-feed" id="activity-feed-list">
          {activities.length === 0 ? (
            <div className="activity-empty">Sin incidentes registrados aún.</div>
          ) : (
            activities.map((act, i) => (
              <div
                key={act.id || i}
                className={`activity-item ${act.severity ? `severity-${act.severity}` : ''}`}
              >
                <div className="activity-time">
                  {new Date(act.timestamp).toLocaleTimeString()}
                </div>
                <div className="activity-desc">
                  {act.description || act.action || act.incidentType}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="chat-section" id="chat-section">
          <div className="chat-history" id="chat-history">
            {chatMessages.map((msg, i) => (
              <div
                key={msg.id || i}
                className={`chat-msg chat-msg-${msg.sender === 'user' ? 'user' : 'assistant'}`}
              >
                {msg.message}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form className="chat-input-row" onSubmit={handleSendChat}>
            <input
              type="text"
              className="chat-input"
              id="chat-input"
              placeholder="Consulta sobre la mosca..."
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
              autoComplete="off"
            />
            <button type="submit" className="chat-send-btn" id="chat-send-btn">
              Enviar
            </button>
          </form>
        </div>

        <div className="analytics-section" id="analytics-section">
          <div className="analytics-section-header">
            <span className="analytics-section-title">Estadísticas</span>
            <button
              className="analytics-toggle-btn"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              {showAnalytics ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {showAnalytics && (
            <div className="analytics-content" id="analytics-content">
              <div>Incidentes Registrados: {activities.length}</div>
              <div>Estado de Cuidado: Activo</div>
            </div>
          )}
        </div>

        <div className="calendar-section" id="calendar-section">
          <div className="calendar-section-header">
            <span className="calendar-section-title">Calendario</span>
            <button
              className="calendar-toggle-btn"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              {showCalendar ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {showCalendar && (
            <div className="calendar-content" id="calendar-content">
              {dailySummaries.length === 0 ? (
                <div>Sin historial diario</div>
              ) : (
                dailySummaries.map((day) => (
                  <div key={day.date} className="calendar-day-row">
                    <span>{day.date}</span>
                    <span>{day.incident_count} incidentes</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      {isOpen && (
        <div
          id="drawer-backdrop"
          className="drawer-backdrop active"
          onClick={onClose}
        ></div>
      )}
    </>
  );
}
