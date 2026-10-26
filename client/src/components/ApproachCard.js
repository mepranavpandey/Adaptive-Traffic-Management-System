import React from 'react';
import TrafficLight from './TrafficLight';
import './ApproachCard.css';

function ApproachCard({
  approach,
  label,
  signal,
  traffic,
  inputHealth,
  onSignalClick
}) {
  const getDensityColor = (density) => {
    switch (density) {
      case 'low': return '#4ade80';
      case 'medium': return '#fbbf24';
      case 'high': return '#f97316';
      case 'congested': return '#ef4444';
      default: return '#888';
    }
  };

  const getDensityLabel = (density) => {
    switch (density) {
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'high': return 'High';
      case 'congested': return 'Congested';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok': return '#4ade80';
      case 'stale': return '#fbbf24';
      case 'degraded': return '#f97316';
      case 'disconnected': return '#ef4444';
      default: return '#888';
    }
  };

  const formatWaitTime = (ms) => {
    if (!ms) return '0s';
    const s = Math.round(ms / 1000);
    if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${s}s`;
  };

  const handleSignalClick = (targetSignal) => {
    if (onSignalClick) {
      onSignalClick(approach, targetSignal);
    }
  };

  return (
    <div className={`approach-card ${signal}`}>
      <div className="approach-header">
        <div className="approach-title">
          <span className="approach-direction">{label}</span>
          <div className="approach-badges">
            <span className={`control-indicator control-manual`}>
              Direct Control
            </span>
          </div>
        </div>
        <div className="input-status">
          <span className="input-item">
            <span className="input-dot" style={{ background: getStatusColor(inputHealth.camera) }} />
            Camera: LIVE
          </span>
          <span className="input-item">
            <span className="input-dot" style={{ background: getStatusColor(inputHealth.sensor) }} />
            Sensor: LIVE
          </span>
        </div>
      </div>

      <div className="approach-body">
        <div className="traffic-light-section">
          <TrafficLight
            signal={signal}
            approach={approach}
          />

          <div className="signal-info">
            <div className="signal-state">
              <span className={`signal-badge signal-${signal}`}>
                {signal.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="traffic-metrics">
          <div className="metrics-row">
            <div className="metric-item">
              <span className="metric-label">Vehicles</span>
              <span className="metric-value">{traffic.count}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Density</span>
              <span className="metric-value" style={{ color: getDensityColor(traffic.density) }}>
                {getDensityLabel(traffic.density)}
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Queue</span>
              <span className="metric-value">{traffic.queueLength}</span>
            </div>
          </div>

          <div className="metrics-row">
            <div className="metric-item">
              <span className="metric-label">Wait</span>
              <span className="metric-value">{formatWaitTime(traffic.waitTime)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Moving</span>
              <span className="metric-value">{traffic.moving}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Speed</span>
              <span className="metric-value">{traffic.speed} km/h</span>
            </div>
          </div>

          <div className="congestion-bar">
            <div className="congestion-label-row">
              <span>Congestion</span>
              <span style={{ color: getDensityColor(traffic.density) }}>
                {getDensityLabel(traffic.density)}
              </span>
            </div>
            <div className="congestion-track">
              <div
                className="congestion-fill"
                style={{
                  width: `${Math.min(100, (traffic.count / 15) * 100)}%`,
                  background: getDensityColor(traffic.density)
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="approach-controls">
        <div className="manual-controls">
          <span className="controls-label">Click to Control Traffic Light</span>
          <div className="signal-buttons">
            <button
              className="signal-btn green-btn"
              onClick={() => handleSignalClick('green')}
              disabled={signal === 'green'}
            >
              Set to GREEN
            </button>
            <button
              className="signal-btn yellow-btn"
              onClick={() => handleSignalClick('yellow')}
              disabled={signal === 'yellow' || signal === 'red'}
            >
              Set to YELLOW
            </button>
            <button
              className="signal-btn red-btn"
              onClick={() => handleSignalClick('red')}
              disabled={signal === 'red'}
            >
              Set to RED
            </button>
          </div>
          <div className="traffic-info-note">
            <span className="traffic-note-text">
              Traffic simulation active: {traffic.count} vehicles detected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApproachCard;