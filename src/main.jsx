import React from 'react';
import ReactDOM from 'react-dom/client';
import './services/brainWorkerBridge'; // Connectome LIF Worker Bridge
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
