import React, { useState } from 'react';
import './SidePanel.css';

function SidePanel({ events, systemState }) {
  const [activeTab, setActiveTab] = useState('overview');

  const speedViolations = events.filter(e => e.type === 'SPEED_VIOLATION');
  const redLightViolations = events.filter(e => e.type === 'RED_LIGHT_VIOLATION');
  const numberPlates = events.filter(e => e.type === 'NUMBER_PLATE_RECOGNIZED' || e.details?.numberPlate);
  const detectedActions = events.filter(e => e.category === 'action');
  const systemNotifications = events.filter(e => e.category === 'system' || e.category === 'incident');

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString();
  };

  return (
    <aside className="side-panel">
      <div className="panel-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          Actions
        </button>
        <button
          className={`tab-btn ${activeTab === 'speed' ? 'active' : ''}`}
          onClick={() => setActiveTab('speed')}
        >
          Speed ({speedViolations.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'redlight' ? 'active' : ''}`}
          onClick={() => setActiveTab('redlight')}
        >
          Red Light ({redLightViolations.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'plates' ? 'active' : ''}`}
          onClick={() => setActiveTab('plates')}
        >
          Plates ({numberPlates.length})
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'overview' && (
          <div className="panel-section">
            <h3 className="section-title">System Overview</h3>

            <div className="overview-card">
              <div className="overview-row">
                <span className="overview-label">Operating Mode</span>
                <span className="overview-val">{systemState.mode}</span>
              </div>
              <div className="overview-row">
                <span className="overview-label">AI Controller</span>
                <span className="overview-val">{systemState.aiActive ? 'Active' : 'Stopped'}</span>
              </div>
              <div className="overview-row">
                <span className="overview-label">Active Phase</span>
                <span className="overview-val">{systemState.activePhase === 'north-south' ? 'North / South' : 'East / West'}</span>
              </div>
              <div className="overview-row">
                <span className="overview-label">Phase Timer</span>
                <span className="overview-val">{Math.round((systemState.phaseTimer || 0) / 1000)}s</span>
              </div>
            </div>

            <h3 className="section-title" style={{ marginTop: '16px' }}>Input Connectivity</h3>
            <div className="overview-card">
              {['north', 'south', 'east', 'west'].map(app => (
                <div key={app} className="overview-row">
                  <span className="overview-label capitalize">{app} Approach</span>
                  <span className="overview-val">
                    Cam: {systemState.inputHealth?.cameras?.[app] || 'ok'} |
                    Sens: {systemState.inputHealth?.sensors?.[app] || 'ok'}
                  </span>
                </div>
              ))}
            </div>

            <h3 className="section-title" style={{ marginTop: '16px' }}>Recent System Notifications</h3>
            <div className="event-list">
              {systemNotifications.length === 0 ? (
                <div className="empty-events">No system notifications</div>
              ) : (
                systemNotifications.slice(0, 5).map(event => (
                  <div key={event.id} className="event-item system-event">
                    <span className="event-time">{formatTimestamp(event.timestamp)}</span>
                    <span className="event-desc">{event.description}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="panel-section">
            <h3 className="section-title">Detected Actions & Events</h3>
            <div className="event-list">
              {detectedActions.length === 0 ? (
                <div className="empty-events">No events detected</div>
              ) : (
                detectedActions.map(event => (
                  <div key={event.id} className="event-item">
                    <span className="event-time">{formatTimestamp(event.timestamp)}</span>
                    <span className="event-desc">{event.description}</span>
                    {event.details?.approach && (
                      <span className="event-tag">{event.details.approach}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'speed' && (
          <div className="panel-section">
            <h3 className="section-title">Speed Violations</h3>
            <div className="event-list">
              {speedViolations.length === 0 ? (
                <div className="empty-events">No speed violations detected</div>
              ) : (
                speedViolations.map(event => (
                  <div key={event.id} className="event-item violation-item">
                    <div className="violation-header">
                      <span className="event-time">{formatTimestamp(event.timestamp)}</span>
                      <span className="violation-badge">Overspeed</span>
                    </div>
                    <span className="event-desc">{event.description}</span>
                    {event.details?.numberPlate && (
                      <div className="plate-tag">Plate: {event.details.numberPlate}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'redlight' && (
          <div className="panel-section">
            <h3 className="section-title">Red Light Violations</h3>
            <div className="event-list">
              {redLightViolations.length === 0 ? (
                <div className="empty-events">No red light violations detected</div>
              ) : (
                redLightViolations.map(event => (
                  <div key={event.id} className="event-item violation-item">
                    <div className="violation-header">
                      <span className="event-time">{formatTimestamp(event.timestamp)}</span>
                      <span className="violation-badge red-badge">Red Jump</span>
                    </div>
                    <span className="event-desc">{event.description}</span>
                    {event.details?.numberPlate && (
                      <div className="plate-tag">Plate: {event.details.numberPlate}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'plates' && (
          <div className="panel-section">
            <h3 className="section-title">Vehicle Number Plates</h3>
            <div className="event-list">
              {numberPlates.length === 0 ? (
                <div className="empty-events">No number plates recognized</div>
              ) : (
                numberPlates.map(event => (
                  <div key={event.id} className="event-item plate-event">
                    <span className="event-time">{formatTimestamp(event.timestamp)}</span>
                    <span className="plate-number-display">
                      {event.details?.numberPlate || event.details?.plateText}
                    </span>
                    {event.details?.approach && (
                      <span className="event-tag">{event.details.approach}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default SidePanel;