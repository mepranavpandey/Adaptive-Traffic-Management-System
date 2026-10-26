import React from 'react';
import './Header.css';

function Header({
  mode,
  connected,
  decisionExplanation
}) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">Direct Traffic Light Control</h1>
        <span className={`connection-badge ${connected ? 'connected' : 'disconnected'}`}>
          <span className="connection-dot" />
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="header-center">
        <div className="mode-info">
          <span className="active-phase-label">
            Mode: <strong>DIRECT MANUAL CONTROL</strong>
          </span>
          <span className="simulation-instruction">
            Click traffic light buttons in each approach box to control lights directly
          </span>
        </div>
      </div>

      <div className="header-right">
        <div className="status-indicators">
          <span className={`status-badge mode-badge-manual`}>
            Manual Control
          </span>
          <span className="simulation-badge">
            Live Traffic Simulation
          </span>
          <span className="simulation-badge simulation-warning">
            {decisionExplanation || 'Control each light individually'}
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;