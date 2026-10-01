// Client-side Caretaker Storage Service (IndexedDB / LocalStorage fallback)

const INCIDENTS_KEY = 'flybrain_incidents';
const CHAT_KEY = 'flybrain_chat';

function getStoredJSON(key, defaultValue) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('Failed to read from localStorage', e);
    return defaultValue;
  }
}

function setStoredJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to write to localStorage', e);
  }
}

export function getIncidents(limit = 50) {
  const incidents = getStoredJSON(INCIDENTS_KEY, []);
  return incidents.slice(0, limit);
}

export function insertIncident(timestamp, incidentType, severity, description, flyState) {
  const incidents = getStoredJSON(INCIDENTS_KEY, []);
  const newIncident = {
    id: Date.now() + Math.random(),
    timestamp: timestamp || new Date().toISOString(),
    incident_type: incidentType,
    severity: severity || 'low',
    description: description || '',
    fly_state: typeof flyState === 'string' ? flyState : JSON.stringify(flyState || {}),
  };
  incidents.unshift(newIncident);
  // keep max 500 incidents
  if (incidents.length > 500) incidents.pop();
  setStoredJSON(INCIDENTS_KEY, incidents);
  return newIncident;
}

export function getLastIncidentTime(incidentType) {
  const incidents = getStoredJSON(INCIDENTS_KEY, []);
  const match = incidents.find((i) => i.incident_type === incidentType);
  return match ? match.timestamp : null;
}

export function getChatHistory(limit = 50) {
  const history = getStoredJSON(CHAT_KEY, []);
  return history.slice(0, limit);
}

export function insertChatMessage(sender, message) {
  const history = getStoredJSON(CHAT_KEY, []);
  const msgObj = {
    id: Date.now() + Math.random(),
    sender,
    message,
    timestamp: new Date().toISOString(),
  };
  history.push(msgObj);
  if (history.length > 200) history.shift();
  setStoredJSON(CHAT_KEY, history);
  return msgObj;
}

export function getDailySummaries() {
  const incidents = getStoredJSON(INCIDENTS_KEY, []);
  const byDate = {};
  incidents.forEach((inc) => {
    const date = (inc.timestamp || '').substring(0, 10) || new Date().toISOString().substring(0, 10);
    if (!byDate[date]) {
      byDate[date] = { date, incident_count: 0, highest_severity: 'low' };
    }
    byDate[date].incident_count++;
    if (inc.severity === 'high') byDate[date].highest_severity = 'high';
    else if (inc.severity === 'medium' && byDate[date].highest_severity !== 'high') {
      byDate[date].highest_severity = 'medium';
    }
  });
  return Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
}
