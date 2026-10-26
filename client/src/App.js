import React, { useState, useEffect, useCallback, useRef } from 'react';
import ApproachCard from './components/ApproachCard';
import SidePanel from './components/SidePanel';
import './App.css';

function App() {
  const [systemState, setSystemState] = useState({
    signalState: { north: 'green', south: 'green', east: 'red', west: 'red' },
    trafficState: {
      north: { count: 3, density: 'low', waitTime: 0, queueLength: 1, speed: 45, moving: 2 },
      south: { count: 2, density: 'low', waitTime: 0, queueLength: 1, speed: 40, moving: 1 },
      east: { count: 4, density: 'medium', waitTime: 5000, queueLength: 2, speed: 50, moving: 2 },
      west: { count: 5, density: 'medium', waitTime: 7000, queueLength: 3, speed: 55, moving: 2 }
    },
    inputHealth: {
      cameras: { north: 'ok', south: 'ok', east: 'ok', west: 'ok' },
      sensors: { north: 'ok', south: 'ok', east: 'ok', west: 'ok' }
    }
  });

  const [events, setEvents] = useState([]);
  const wsRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to traffic control server');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'STATE_UPDATE':
            setSystemState(data.payload);
            break;
          case 'EVENTS_UPDATE':
            setEvents(data.payload);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from server');
      // Reconnect after 2 seconds
      setTimeout(connectWebSocket, 2000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, []);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Direct traffic light control - send signal change to server
  const handleManualSignal = useCallback((approach, signal) => {
    sendMessage({ type: 'MANUAL_SIGNAL_REQUEST', approach, signal });
  }, [sendMessage]);

  // Also handle local state immediately for instant feedback
  const handleSignalClick = useCallback((approach, signal) => {
    // Update local state immediately
    setSystemState(prev => ({
      ...prev,
      signalState: {
        ...prev.signalState,
        [approach]: signal
      }
    }));

    // Send to server
    handleManualSignal(approach, signal);
  }, [handleManualSignal]);

  return (
    <div className="app">
      {/* NO HEADER - Just the grid */}
      <div className="main-content">
        <div className="approach-grid">
          <ApproachCard
            approach="north"
            label="North Approach"
            signal={systemState.signalState.north}
            traffic={systemState.trafficState.north}
            inputHealth={{
              camera: systemState.inputHealth.cameras.north,
              sensor: systemState.inputHealth.sensors.north
            }}
            onSignalClick={handleSignalClick}
          />
          <ApproachCard
            approach="south"
            label="South Approach"
            signal={systemState.signalState.south}
            traffic={systemState.trafficState.south}
            inputHealth={{
              camera: systemState.inputHealth.cameras.south,
              sensor: systemState.inputHealth.sensors.south
            }}
            onSignalClick={handleSignalClick}
          />
          <ApproachCard
            approach="east"
            label="East Approach"
            signal={systemState.signalState.east}
            traffic={systemState.trafficState.east}
            inputHealth={{
              camera: systemState.inputHealth.cameras.east,
              sensor: systemState.inputHealth.sensors.east
            }}
            onSignalClick={handleSignalClick}
          />
          <ApproachCard
            approach="west"
            label="West Approach"
            signal={systemState.signalState.west}
            traffic={systemState.trafficState.west}
            inputHealth={{
              camera: systemState.inputHealth.cameras.west,
              sensor: systemState.inputHealth.sensors.west
            }}
            onSignalClick={handleSignalClick}
          />
        </div>

        <SidePanel
          events={events}
          systemState={systemState}
        />
      </div>
    </div>
  );
}

export default App;