import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { installDevToolsBlockers } from './disableDevTools.js';
import { checkForUpdate } from './checkForUpdate.js';
import './styles.css';

installDevToolsBlockers();
checkForUpdate();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
