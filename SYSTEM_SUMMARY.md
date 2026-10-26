# Input-Adaptive Traffic Light Control System — System Summary

## 1. Project Overview

The **Input-Adaptive Traffic Light Control System** is a production-grade traffic management application designed to intelligently coordinate a four-way intersection (North, South, East, and West) using simulated camera feeds, loop sensors, adaptive timing algorithms, movement conflict matrices, safety validation, violation detection, and automated number plate recognition.

The application adheres strictly to all project specifications, featuring a four-quadrant approach layout, a persistent event/violation side panel, dark glassmorphism design aesthetics, and a safety-first controller engine.

---

## 2. System Architecture & Component Breakdown

The application is structured into decoupled, modular components:

- **TrafficController (`src/controller/TrafficController.js`)**: The core adaptive timing engine. Manages active phases (Phase A: North/South, Phase B: East/West), phase extensions, minimum/maximum green durations, yellow clearance intervals, fairness thresholds, and operating modes (AI, Manual, Fault).
- **CameraSimulator (`src/input/CameraSimulator.js`)**: Simulates realistic multi-approach camera feeds providing vehicle counts, queue lengths, average speeds, waiting times, and data freshness metrics.
- **SensorSimulator (`src/input/SensorSimulator.js`)**: Simulates presence loop detectors and IR sensors to supplement camera inputs and handle input fusion/health tracking.
- **EventManager (`src/events/EventManager.js`)**: Centralized event feed manager tracking detected actions, speed violations, red-light violations, number plate recognitions, and system notifications.
- **ViolationDetector (`src/detection/ViolationDetector.js`)**: Analyzes vehicle speed, signal state, and stop-line crossing behavior to identify speed violations, red-light jumping, and accident suspicion indicators.
- **NumberPlateRecognizer (`src/detection/NumberPlateRecognizer.js`)**: Simulates OCR processing for vehicle number plates, recognizing alphanumeric plates, confidence scores, and associating them with traffic events.
- **Express Backend & WebSocket Server (`src/index.js`)**: Serves the API and broadcasts real-time application state and event updates at 10 Hz over WebSockets.
- **React Frontend (`client/src/`)**: Built with a 2x2 grid representing North, South, East, and West approaches, individual traffic-light visualizations, interactive manual controls, and a persistent operational side panel.

---

## 3. Mandatory Requirements & Compliance

1. **Four-Quadrant Layout**: The main workspace is divided into four clearly separated sections for North, South, East, and West, each displaying approach-specific traffic data, signal status, timers, and controls.
2. **Persistent Side Panel**: Displays overview metrics, detected actions, speed violations, red-light violations, recognized number plates, and system notifications in real-time.
3. **No Traffic-Priority Zones**: Completely removed all Red/Yellow/Green zone classifications. Relies entirely on measurable traffic counts, densities, queue lengths, and waiting times.
4. **Safety & Conflict Matrix**: Enforces explicit movement conflict matrices preventing conflicting green indications (e.g., North/South and East/West phases cannot be green simultaneously).
5. **Adaptive Timing**: Dynamically extends or switches green phases based on vehicle demand and waiting times while respecting minimum and maximum duration bounds.
6. **Violation & Plate Detection**: Detects overspeeding and red-light violations and records recognized vehicle plates with confidence scores.
7. **Manual Controls & Mode Switching**: Allows operators to switch between AI, Manual, and Fault modes, with manual signal requests validated against the conflict matrix.

---

## 4. Automated Acceptance Test Results

All automated acceptance tests defined in Section 17 have been executed and passed successfully (`10/10 PASS`):

- **Test 1**: System initializes with four approaches and default state (`PASS`)
- **Test 2**: Movement conflict matrix validates manual requests (`PASS`)
- **Test 3**: Valid manual signal request is accepted and queued (`PASS`)
- **Test 4**: Operating mode transitions function correctly (`PASS`)
- **Test 5**: Adaptive controller selects phase based on traffic demand (`PASS`)
- **Test 6**: Fairness limits trigger override on excessive wait time (`PASS`)
- **Test 7**: Violation detector identifies overspeeding events (`PASS`)
- **Test 8**: Number plate recognizer processes plates and confidence (`PASS`)
- **Test 9**: AI start and stop controls update controller state (`PASS`)
- **Test 10**: System tracks input health and data freshness (`PASS`)

---

## 5. Operational Instructions

1. **Start Backend Server**:
   ```bash
   npm start
   ```
   *(Runs on port 3001)*

2. **Start Frontend Client**:
   ```bash
   cd client && npm start
   ```
   *(Runs on port 3000)*

3. **Run Acceptance Tests**:
   ```bash
   node src/tests/runTests.js
   ```
