const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');

// Import our traffic control modules
const TrafficController = require('./controller/TrafficController');
const CameraSimulator = require('./input/CameraSimulator');
const SensorSimulator = require('./input/SensorSimulator');
const EventManager = require('./events/EventManager');
const ViolationDetector = require('./detection/ViolationDetector');
const NumberPlateRecognizer = require('./detection/NumberPlateRecognizer');

const app = express();
const server = http.createServer(app);

// Serve static files from client build
app.use(express.static(path.join(__dirname, '../client/build')));

// Serve the main page for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server });

// Initialize the traffic management system components
const eventManager = new EventManager();
const cameraSimulator = new CameraSimulator();
const sensorSimulator = new SensorSimulator();
const numberPlateRecognizer = new NumberPlateRecognizer();
const violationDetector = new ViolationDetector(eventManager);
const trafficController = new TrafficController({
  cameraSimulator,
  sensorSimulator,
  violationDetector,
  numberPlateRecognizer,
  eventManager
});

// Store WebSocket clients
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected. Total clients:', clients.size);

  // Send initial state
  ws.send(JSON.stringify({
    type: 'STATE_UPDATE',
    payload: trafficController.getFullState()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleClientMessage(data, ws);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total clients:', clients.size);
  });
});

function handleClientMessage(data, ws) {
  switch (data.type) {
    case 'MANUAL_SIGNAL_REQUEST':
      trafficController.manualSignalRequest(data.approach, data.signal, data.duration);
      break;
    case 'SET_MODE':
      trafficController.setMode(data.mode);
      break;
    case 'START_AI':
      trafficController.startAI();
      break;
    case 'STOP_AI':
      trafficController.stopAI();
      break;
    case 'REQUEST_PHASE':
      trafficController.requestPhase(data.phase);
      break;
    case 'SET_CONFIG':
      trafficController.updateConfig(data.config);
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
}

function broadcastState() {
  const state = trafficController.getFullState();
  const message = JSON.stringify({
    type: 'STATE_UPDATE',
    payload: state
  });

  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

function broadcastEvents() {
  const events = eventManager.getRecentEvents(20);
  const message = JSON.stringify({
    type: 'EVENTS_UPDATE',
    payload: events
  });

  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

// Run the traffic control loop at 10 Hz
setInterval(() => {
  trafficController.update();
  broadcastState();
}, 100);

// Broadcast events at 2 Hz
setInterval(() => {
  broadcastEvents();
}, 500);

// Generate simulated camera/sensor data at 5 Hz
setInterval(() => {
  cameraSimulator.update();
  sensorSimulator.update();
}, 200);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Traffic Control System running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});

module.exports = { app, server, trafficController };