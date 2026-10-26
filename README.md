# Input-Adaptive Traffic Light Control System

A professional, functional traffic management application that intelligently controls a four-way intersection using adaptive timing algorithms, real-time violation detection, and a safety-first approach.

![System Status](https://img.shields.io/badge/tests-10%2F10%20passing-brightgreen)
![Mode](https://img.shields.io/badge/mode-AI%20%7C%20Manual%20%7C%20Fault-blue)
![Build](https://img.shields.io/badge/build-ready-success)

## Features

### Core Traffic Management
- **Four-Approach Intersection Control**: Independent North, South, East, and West approach monitoring and control
- **Adaptive Phase Selection**: AI-driven timing that responds to real-time traffic conditions, congestion, and waiting times
- **Safety-First Conflict Matrix**: Prevents conflicting green signals through explicit movement validation
- **Fairness Enforcement**: Ensures no approach waits beyond configured thresholds

### Intelligent Detection
- **Speed Violation Detection**: Identifies vehicles exceeding configured speed limits
- **Red-Light Violation Detection**: Tracks stop-line crossing during prohibited signal states
- **Accident Suspicion Detection**: Identifies unusual congestion patterns indicating possible incidents
- **Number Plate Recognition**: OCR-based vehicle identification with confidence scoring

### Operating Modes
- **AI Mode**: Fully automated adaptive traffic control with congestion-responsive timing
- **Manual Mode**: Operator-controlled signal changes with safety validation
- **Fault Mode**: Configured safe state for system failures

### Professional UI
- **Dark Glassmorphism Design**: Clean, minimal interface with subtle translucent surfaces
- **Four-Quadrant Layout**: Dedicated sections for each approach with synchronized data
- **Persistent Event Panel**: Real-time feed of violations, detections, and system events
- **Responsive Design**: Adapts to different screen sizes while maintaining functionality

## Architecture

```
├── src/
│   ├── controller/
│   │   └── TrafficController.js    # Core adaptive traffic engine
│   ├── input/
│   │   ├── CameraSimulator.js      # Simulated camera feeds
│   │   └── SensorSimulator.js      # Simulated loop detectors
│   ├── detection/
│   │   ├── ViolationDetector.js    # Speed & red-light violations
│   │   └── NumberPlateRecognizer.js # OCR plate recognition
│   ├── events/
│   │   └── EventManager.js         # Centralized event tracking
│   ├── tests/
│   │   └── runTests.js             # Automated acceptance tests
│   └── index.js                    # Express + WebSocket server
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js           # System header with mode controls
│   │   │   ├── ApproachCard.js     # Individual approach display
│   │   │   ├── TrafficLight.js     # Visual signal indicator
│   │   │   └── SidePanel.js        # Event feed panel
│   │   ├── App.js                  # Main React application
│   │   └── App.css                 # Responsive layout styles
│   └── public/
│       └── index.html
└── package.json
```

## Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup

1. **Clone and install backend dependencies**:
```bash
npm install
```

2. **Install client dependencies**:
```bash
cd client
npm install
cd ..
```

## Usage

### Start the System

**Terminal 1 - Backend Server**:
```bash
npm start
```
Server runs on `http://localhost:3001`

**Terminal 2 - React Frontend**:
```bash
cd client
npm start
```
Client runs on `http://localhost:3000`

### Run Tests

```bash
npm test
```

All 10 acceptance tests verify:
- System initialization and four-approach structure
- Movement conflict matrix validation
- Manual signal request processing
- Operating mode transitions
- Adaptive phase selection based on traffic
- Fairness limit enforcement
- Speed violation detection
- Number plate recognition
- AI start/stop controls
- Input health monitoring

## Configuration

Key timing parameters in `TrafficController.js`:

```javascript
config: {
  minGreenDuration: 5000,      // Minimum green time (ms)
  maxGreenDuration: 30000,     // Maximum green time (ms)
  yellowDuration: 3000,        // Yellow clearance (ms)
  allRedDuration: 2000,        // All-red clearance (ms)
  maxWaitTime: 90000,          // Max acceptable wait (ms)
  speedLimit: 60,              // Speed limit (km/h)
  lowCongestionThreshold: 3,   // Low traffic vehicle count
  mediumCongestionThreshold: 8,
  highCongestionThreshold: 15
}
```

## How It Works

### Adaptive Timing Algorithm

1. **Traffic State Analysis**: Camera and sensor inputs provide vehicle counts, queue lengths, speeds, and waiting times for each approach
2. **Phase Scoring**: Each phase (North/South or East/West) receives a weighted score based on:
   - Maximum wait time (40% weight)
   - Total waiting vehicles (30% weight)
   - Time since last service (30% weight)
3. **Phase Selection**: Highest-scoring phase receives green, subject to minimum green durations and fairness constraints
4. **Dynamic Extension**: Green phases can extend beyond minimum when traffic warrants it, up to maximum duration
5. **Fairness Override**: If any approach exceeds maximum wait time, system immediately services that phase

### Signal Safety

- **Conflict Matrix**: Enforces safe movement combinations (North/South cannot be green with East/West)
- **Transition Sequence**: Green → Yellow (3s) → Red → All-Red (2s) → New Green
- **Manual Validation**: All operator requests validated against active signal states
- **Minimum Service**: Every phase receives minimum green duration before switching

### Violation Detection

**Speed Violations**:
- Compares measured vehicle speed against configured limit
- Records timestamp, approach, estimated speed, and number plate
- Applies cooldown to prevent duplicate alerts

**Red-Light Violations**:
- Detects movement when signal is red and wait time is minimal
- Records stop-line crossing events with signal state
- Associates recognized number plates with violations

**Accident Suspicion**:
- Identifies stationary queues with extended wait times
- Flags unusual congestion patterns
- Suggests potential incidents requiring human review

## User Interface Guide

### Header
- **Operating Mode Selector**: Switch between AI, Manual, and Fault modes
- **AI Controls**: Start/Stop adaptive control
- **Connection Status**: Real-time server connection indicator
- **Active Phase**: Current green phase and decision explanation

### Approach Cards (4 Quadrants)
Each section displays:
- **Signal Light**: Visual red/yellow/green indicator with active lamp
- **Traffic Metrics**: Vehicle count, density, queue length, wait time, moving vehicles, speed
- **Congestion Bar**: Visual representation of traffic density
- **Input Status**: Camera and sensor health (Simulated/OK/Stale/Disconnected)
- **Phase Timer**: Remaining green time for active phase
- **Manual Controls** (Manual Mode): Signal change buttons and duration slider

### Side Panel (5 Tabs)
- **Overview**: System status, mode, phase, input connectivity, recent notifications
- **Actions**: Detected vehicles and traffic events
- **Speed**: Speed violation events with plates and timestamps
- **Red Light**: Red-light jumping events with approach and details
- **Plates**: Recognized vehicle number plates with confidence scores

## Technical Implementation Notes

### Input Simulation
The system uses simulated camera and sensor inputs for demonstration purposes. Labels clearly indicate "SIMULATED" status. In production deployment, these would be replaced with:
- Actual camera feed processing with computer vision models
- Physical loop detector and sensor integrations
- Calibrated speed measurement systems
- Production-grade OCR for plate recognition

### Real-Time Communication
- WebSocket connection broadcasts state updates at 10 Hz
- Event feed updates at 2 Hz
- Automatic reconnection on connection loss
- Synchronized state across all connected clients

### Safety Considerations
This is a demonstration system for educational and prototyping purposes. Real-world deployment requires:
- Certified traffic control hardware with independent safety mechanisms
- Compliance with local traffic control standards and regulations
- Professional validation and testing in controlled environments
- Redundant safety systems and fail-safe mechanisms
- Legal authorization for physical signal control

## Limitations & Future Work

**Current Limitations**:
- Simulated inputs only (no real camera/sensor integration)
- Through-traffic only (no turn movements configured)
- Single intersection (no network coordination)
- Demo-quality number plate recognition

**Potential Enhancements**:
- Real camera feed integration with YOLO/Faster R-CNN vehicle detection
- Protected/permitted turn phase support
- Multi-intersection coordination and green wave optimization
- Emergency vehicle preemption
- Pedestrian crossing integration
- Historical analytics and reporting dashboard
- Cloud deployment with remote monitoring

## Testing

The system includes comprehensive automated acceptance tests covering:
- System initialization and architecture
- Safety and conflict validation
- Adaptive timing decisions
- Violation detection accuracy
- Manual control functionality
- Input health monitoring
- Mode transitions

Run `npm test` to execute all acceptance tests.

## License

This project is provided as-is for educational and demonstration purposes.

## Project Completion Status

✅ All 20 acceptance criteria from project specifications verified
✅ Four-quadrant dashboard layout implemented
✅ Persistent side panel with event categorization
✅ Traffic-priority zone concept completely removed
✅ Adaptive timing using measurable traffic conditions
✅ Movement conflict matrix enforced
✅ Speed and red-light violation detection
✅ Number plate recognition pipeline
✅ Manual controls with safety validation
✅ AI start/stop notifications
✅ 10/10 automated acceptance tests passing
✅ Dark glassmorphism design aesthetic
✅ Comprehensive documentation

---

**Built with Node.js, Express, WebSocket, React, and a safety-first approach to traffic control.**