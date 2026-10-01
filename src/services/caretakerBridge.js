import * as storage from './caretakerStorage';

class CaretakerBridge {
  constructor() {
    this.listeners = new Set();
    this.lastState = null;
    this.lastActionTime = 0;
    this.lastActionType = null;
    this.preFearLevel = 0;
    this.actionLogs = [];
    this.telemetryHistory = [];
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  emit(data) {
    this.listeners.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('CaretakerBridge listener error', e);
      }
    });
  }

  logAction(actionType, currentState) {
    this.lastActionTime = Date.now();
    this.lastActionType = actionType;
    if (currentState && currentState.drives) {
      this.preFearLevel = currentState.drives.fear || 0;
    }
    const logItem = {
      timestamp: new Date().toISOString(),
      action: actionType,
      drives: currentState?.drives ? { ...currentState.drives } : null,
    };
    this.actionLogs.push(logItem);
    if (this.actionLogs.length > 500) this.actionLogs.shift();

    this.emit({
      type: 'activity_action',
      ...logItem,
    });
  }

  updateState(state) {
    if (!state || !state.drives) return;
    this.lastState = state;
    const now = new Date().toISOString();
    const fear = state.drives.fear || 0;
    const hunger = state.drives.hunger || 0;
    const foodCount = (state.food || []).length;

    // Periodically record telemetry samples for technical export report (every ~2 sec)
    if (!this._lastSampleTime || Date.now() - this._lastSampleTime > 2000) {
      this._lastSampleTime = Date.now();
      this.telemetryHistory.push({
        time: new Date().toLocaleTimeString(),
        behavior: state.behaviorState || 'idle',
        hunger: +(state.drives.hunger || 0).toFixed(2),
        fear: +(state.drives.fear || 0).toFixed(2),
        fatigue: +(state.drives.fatigue || 0).toFixed(2),
        curiosity: +(state.drives.curiosity || 0).toFixed(2),
      });
      if (this.telemetryHistory.length > 300) this.telemetryHistory.shift();
    }

    // Detect fear spike incident
    if (this.lastActionTime > 0 && Date.now() - this.lastActionTime < 5000 && fear - this.preFearLevel > 0.2) {
      const desc = `Fear spiked from ${this.preFearLevel.toFixed(2)} to ${fear.toFixed(2)} after ${this.lastActionType}`;
      const inc = storage.insertIncident(now, 'scared_the_fly', 'high', desc, state);
      this.emit({
        type: 'activity_incident',
        timestamp: now,
        incidentType: 'scared_the_fly',
        severity: 'high',
        description: desc,
      });
      this.lastActionTime = 0;
    }

    // Detect forgot to feed
    if (hunger > 0.9 && foodCount === 0) {
      const lastForgot = storage.getLastIncidentTime('forgot_to_feed');
      let shouldLog = true;
      if (lastForgot) {
        const elapsed = Date.now() - new Date(lastForgot).getTime();
        if (elapsed < 60000) shouldLog = false;
      }
      if (shouldLog) {
        const desc = `Hunger reached ${hunger.toFixed(2)} with no food present`;
        const inc = storage.insertIncident(now, 'forgot_to_feed', 'medium', desc, state);
        this.emit({
          type: 'activity_incident',
          timestamp: now,
          incidentType: 'forgot_to_feed',
          severity: 'medium',
          description: desc,
        });
      }
    }
  }

  async sendChatMessage(userText) {
    if (!userText.trim()) return;

    // Save user message
    const userMsg = storage.insertChatMessage('user', userText);
    this.emit({ type: 'chat_message', message: userMsg });

    // Generate response locally
    setTimeout(() => {
      let reply = '';
      const lower = userText.toLowerCase();
      const state = this.lastState;

      if (lower.includes('state') || lower.includes('doing') || lower.includes('haciendo')) {
        const curState = state ? state.behaviorState : 'exploring';
        reply = `The fly is currently ${curState}. Drives: Hunger ${(state?.drives?.hunger * 100 || 0).toFixed(0)}%, Fear ${(state?.drives?.fear * 100 || 0).toFixed(0)}%.`;
      } else if (lower.includes('hungry') || lower.includes('hambre') || lower.includes('feed') || lower.includes('comida')) {
        const hunger = state?.drives?.hunger || 0;
        reply = hunger > 0.6 ? `The fly is hungry (${(hunger * 100).toFixed(0)}%). You should feed it using the Feed tool!` : `The fly is currently sated (Hunger: ${(hunger * 100).toFixed(0)}%).`;
      } else if (lower.includes('scared') || lower.includes('miedo') || lower.includes('fear')) {
        const fear = state?.drives?.fear || 0;
        reply = `Current fear level is ${(fear * 100).toFixed(0)}%. ${fear > 0.5 ? 'The fly was recently startled!' : 'The fly feels safe.'}`;
      } else {
        reply = `FlyBrain Caretaker: Observing Drosophila connectome (~139k neurons firing). Current behavior: ${state?.behaviorState || 'active'}.`;
      }

      const botMsg = storage.insertChatMessage('assistant', reply);
      this.emit({ type: 'chat_message', message: botMsg });
    }, 400);
  }
}

export const caretakerBridge = new CaretakerBridge();
