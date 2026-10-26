/**
 * TrafficController - Core adaptive traffic light control engine
 *
 * Manages signal timing, phase selection, and traffic-responsive decisions
 * for a four-way intersection (North, South, East, West).
 *
 * Safety-first approach with explicit conflict matrix validation.
 */

const { v4: uuidv4 } = require('uuid');

class TrafficController {
  constructor(options = {}) {
    // Input sources
    this.cameraSimulator = options.cameraSimulator;
    this.sensorSimulator = options.sensorSimulator;
    this.violationDetector = options.violationDetector;
    this.numberPlateRecognizer = options.numberPlateRecognizer;
    this.eventManager = options.eventManager;

    // Configuration
    this.config = {
      // Timing parameters (in milliseconds)
      minGreenDuration: 5000,
      maxGreenDuration: 30000,
      yellowDuration: 3000,
      allRedDuration: 2000,

      // Congestion thresholds
      lowCongestionThreshold: 3,
      mediumCongestionThreshold: 8,
      highCongestionThreshold: 15,

      // Fairness limits
      maxWaitTime: 90000, // Max time any approach can wait
      minServiceInterval: 10000, // Min time between services to same approach

      // Speed limits (km/h)
      speedLimit: 60,

      // Phase timing
      phaseExtensionThreshold: 3, // Vehicles waiting to extend green

      ...options.config
    };

    // Movement conflict matrix - defines which movements can be green together
    // true = safe to have green simultaneously
    this.conflictMatrix = {
      'north-south': { 'north-south': true, 'east-west': false, 'north-turn': false, 'south-turn': false },
      'east-west': { 'north-south': false, 'east-west': true, 'east-turn': false, 'west-turn': false },
      'north-turn': { 'north-south': false, 'east-west': false, 'north-turn': false, 'south-turn': false },
      'south-turn': { 'north-south': false, 'east-west': false, 'north-turn': false, 'south-turn': false },
      'east-turn': { 'north-south': false, 'east-west': false, 'east-turn': false, 'west-turn': false },
      'west-turn': { 'north-south': false, 'east-west': false, 'east-turn': false, 'west-turn': false }
    };

    // State - AI mode by default as per project specifications
    this.mode = 'AI';
    this.aiActive = true;
    this.activePhase = 'north-south'; // Current green phase
    this.signalState = {
      north: 'red',
      south: 'red',
      east: 'red',
      west: 'red'
    };
    this.phaseTimer = 0;
    this.currentPhaseEndTime = 0;
    this.phaseQueue = [];
    this.lastServiceTime = {
      north: Date.now(),
      south: Date.now(),
      east: Date.now(),
      west: Date.now()
    };

    // Traffic state per approach
    this.trafficState = {
      north: { count: 0, density: 'low', waitTime: 0, queueLength: 0, speed: 0, moving: 0 },
      south: { count: 0, density: 'low', waitTime: 0, queueLength: 0, speed: 0, moving: 0 },
      east: { count: 0, density: 'low', waitTime: 0, queueLength: 0, speed: 0, moving: 0 },
      west: { count: 0, density: 'low', waitTime: 0, queueLength: 0, speed: 0, moving: 0 }
    };

    // Phase explanations for UI
    this.lastDecisionReason = 'System initialized';
    this.decisionExplanation = '';

    // Manual control queue
    this.manualRequestQueue = [];
    this.currentManualRequest = null;

    // Fault state
    this.faultReason = null;

    // Input health
    this.inputHealth = {
      cameras: { north: 'ok', south: 'ok', east: 'ok', west: 'ok' },
      sensors: { north: 'ok', south: 'ok', east: 'ok', west: 'ok' }
    };

    // Initialize signal states
    this.initializeSignalStates();
  }

  /**
   * Initialize signal states to safe default
   */
  initializeSignalStates() {
    // North/South gets green first
    this.activePhase = 'north-south';
    this.signalState.north = 'green';
    this.signalState.south = 'green';
    this.signalState.east = 'red';
    this.signalState.west = 'red';
    this.currentPhaseEndTime = Date.now() + this.config.maxGreenDuration;
    this.phaseTimer = this.config.maxGreenDuration;
  }

  /**
   * Update traffic analysis from camera and sensor data
   */
  updateTrafficState() {
    const approaches = ['north', 'south', 'east', 'west'];

    approaches.forEach(approach => {
      // Get data from camera simulator
      const cameraData = this.cameraSimulator.getData(approach);
      const sensorData = this.sensorSimulator.getData(approach);

      // Calculate metrics
      const vehicleCount = cameraData?.vehicleCount || sensorData?.vehicleCount || 0;
      const density = this.calculateDensity(vehicleCount);
      const waitTime = cameraData?.waitTime || 0;
      const queueLength = cameraData?.queueLength || 0;
      const moving = cameraData?.moving || 0;
      const speed = cameraData?.speed || 0;

      this.trafficState[approach] = {
        count: vehicleCount,
        density,
        waitTime,
        queueLength,
        speed,
        moving,
        // Input confidence
        cameraConfidence: cameraData?.confidence || 0,
        sensorConfidence: sensorData?.confidence || 0,
        dataFreshness: cameraData?.timestamp ? Date.now() - cameraData?.timestamp : null,
        dataSource: cameraData ? 'camera' : (sensorData ? 'sensor' : 'none')
      };
    });

    // Update input health
    this.updateInputHealth();
  }

  /**
   * Calculate traffic density based on vehicle count
   */
  calculateDensity(count) {
    if (count <= this.config.lowCongestionThreshold) return 'low';
    if (count <= this.config.mediumCongestionThreshold) return 'medium';
    if (count <= this.config.highCongestionThreshold) return 'high';
    return 'congested';
  }

  /**
   * Update input health status
   */
  updateInputHealth() {
    const approaches = ['north', 'south', 'east', 'west'];

    approaches.forEach(approach => {
      const state = this.trafficState[approach];

      // Check camera health
      if (state.dataSource === 'camera' && state.dataFreshness !== null) {
        this.inputHealth.cameras[approach] = state.dataFreshness > 5000 ? 'stale' : 'ok';
      }

      // Check sensor health
      if (state.dataSource === 'sensor' && state.dataFreshness !== null) {
        this.inputHealth.sensors[approach] = state.dataFreshness > 5000 ? 'stale' : 'ok';
      }
    });
  }

  /**
   * Main update loop - called every 100ms
   */
  update() {
    // Update camera simulator with current signal states for realistic speed simulation
    if (this.cameraSimulator && typeof this.cameraSimulator.updateSignalStates === 'function') {
      this.cameraSimulator.updateSignalStates(this.signalState);
    }

    // Update traffic state from inputs
    this.updateTrafficState();

    // Check for violations
    if (this.violationDetector) {
      const approaches = ['north', 'south', 'east', 'west'];
      approaches.forEach((approach) => {
        this.violationDetector.checkViolations(approach, this.trafficState[approach], this.signalState);
      });
    }

    // Process manual request queue (simplified - direct control)
    this.processManualRequestQueue();
  }

  /**
   * AI decision making for adaptive signal control
   */
  processAIDecisions() {
    // If we're in a transition period, wait
    if (this.phaseTimer > 0 && this.signalState[this.activePhase === 'north-south' ? 'north' : 'east'] !== 'green') {
      return;
    }

    // Check if we need to end the current phase
    const shouldEndPhase = this.shouldEndCurrentPhase();

    if (shouldEndPhase) {
      // Determine next phase
      const nextPhase = this.selectNextPhase();

      if (nextPhase && nextPhase !== this.activePhase) {
        this.transitionToPhase(nextPhase);
      }
    } else if (this.phaseTimer <= 0 && this.signalState[this.activePhase === 'north-south' ? 'north' : 'east'] === 'green') {
      // Current green just ended, start next phase
      const nextPhase = this.selectNextPhase();
      if (nextPhase) {
        this.transitionToPhase(nextPhase);
      }
    }
  }

  /**
   * Determine if current phase should end
   */
  shouldEndCurrentPhase() {
    // Check minimum green duration
    const elapsedGreen = this.getCurrentGreenTime();

    if (elapsedGreen < this.config.minGreenDuration) {
      return false;
    }

    // Check max green duration
    if (elapsedGreen >= this.config.maxGreenDuration) {
      this.decisionExplanation = `${this.activePhase} phase reaching maximum green duration`;
      return true;
    }

    // Check traffic demand on other approaches
    const otherApproaches = this.getOtherApproaches(this.activePhase);
    const hasWaitingTraffic = otherApproaches.some(a => this.trafficState[a].count >= this.config.phaseExtensionThreshold);

    if (!hasWaitingTraffic) {
      // No significant waiting traffic, continue current phase
      return false;
    }

    // Check wait time fairness
    const maxWait = this.getMaxWaitTime();
    if (maxWait > this.config.maxWaitTime * 0.7) {
      this.decisionExplanation = `Longest wait (${Math.round(maxWait/1000)}s) exceeds threshold`;
      return true;
    }

    // Check if current phase has minimal traffic
    const currentApproaches = this.activePhase === 'north-south' ? ['north', 'south'] : ['east', 'west'];
    const currentTraffic = currentApproaches.reduce((sum, a) => sum + this.trafficState[a].count, 0);
    const waitingTraffic = otherApproaches.reduce((sum, a) => sum + this.trafficState[a].count, 0);

    if (currentTraffic < this.config.phaseExtensionThreshold && waitingTraffic > currentTraffic * 2) {
      this.decisionExplanation = `Low traffic (${currentTraffic}) on active phase, switching to waiting (${waitingTraffic})`;
      return true;
    }

    return false;
  }

  /**
   * Select the next phase based on traffic conditions
   */
  selectNextPhase() {
    const phases = ['north-south', 'east-west'];

    // Calculate scores for each phase
    const scores = phases.map(phase => {
      const approaches = phase === 'north-south' ? ['north', 'south'] : ['east', 'west'];

      // Total waiting vehicles
      const totalWaiting = approaches.reduce((sum, a) => sum + this.trafficState[a].count, 0);

      // Max wait time for this phase
      const maxWait = approaches.reduce((max, a) =>
        Math.max(max, this.trafficState[a].waitTime), 0);

      // Time since last service
      const timeSinceService = Math.min(...approaches.map(a => Date.now() - this.lastServiceTime[a]));

      // Calculate score (higher = more urgent)
      const waitScore = maxWait / this.config.maxWaitTime;
      const demandScore = Math.min(totalWaiting / 10, 1);
      const fairnessScore = timeSinceService / this.config.maxWaitTime;

      // Weight the scores
      const score = (waitScore * 0.4) + (demandScore * 0.3) + (fairnessScore * 0.3);

      return { phase, score, totalWaiting, maxWait, timeSinceService };
    });

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);

    const selected = scores[0];
    this.decisionExplanation = `Selected ${selected.phase}: wait=${Math.round(selected.maxWait/1000)}s, traffic=${selected.totalWaiting}, urgency=${selected.score.toFixed(2)}`;

    // Don't switch if current phase has similar score and less wait time
    if (this.activePhase && scores[0].phase !== this.activePhase) {
      const currentScore = scores.find(s => s.phase === this.activePhase);
      if (currentScore) {
        const scoreDiff = scores[0].score - currentScore.score;
        if (scoreDiff < 0.15) {
          this.decisionExplanation += ' (small difference, staying current)';
          return this.activePhase;
        }
      }
    }

    return scores[0].phase;
  }

  /**
   * Get the other approaches not in current phase
   */
  getOtherApproaches(currentPhase) {
    if (currentPhase === 'north-south') {
      return ['east', 'west'];
    }
    return ['north', 'south'];
  }

  /**
   * Get maximum wait time across all approaches
   */
  getMaxWaitTime() {
    const approaches = ['north', 'south', 'east', 'west'];
    return Math.max(...approaches.map(a => this.trafficState[a].waitTime));
  }

  /**
   * Get current green time in milliseconds
   */
  getCurrentGreenTime() {
    const approaches = this.activePhase === 'north-south' ? ['north', 'south'] : ['east', 'west'];
    // Return the minimum remaining time as elapsed green
    const remaining = this.phaseTimer;
    const elapsed = this.config.maxGreenDuration - remaining;
    return elapsed;
  }

  /**
   * Transition to a new phase with proper signal sequence
   */
  transitionToPhase(newPhase) {
    const oldPhase = this.activePhase;

    // Start yellow for old phase
    this.setSignalColor(oldPhase === 'north-south' ? 'north' : 'east', 'yellow');
    this.setSignalColor(oldPhase === 'north-south' ? 'south' : 'west', 'yellow');

    this.eventManager.addEvent({
      type: 'PHASE_CHANGE',
      description: `Transitioning from ${oldPhase} to ${newPhase}`,
      details: { from: oldPhase, to: newPhase }
    });

    // Schedule red transition
    setTimeout(() => {
      this.setSignalColor(oldPhase === 'north-south' ? 'north' : 'east', 'red');
      this.setSignalColor(oldPhase === 'north-south' ? 'south' : 'west', 'red');

      // All-red period
      setTimeout(() => {
        // Start green for new phase
        const newApproaches = newPhase === 'north-south' ? ['north', 'south'] : ['east', 'west'];
        this.setSignalColor(newApproaches[0], 'green');
        this.setSignalColor(newApproaches[1], 'green');

        // Update state
        this.activePhase = newPhase;
        this.currentPhaseEndTime = Date.now() + this.config.maxGreenDuration;
        this.phaseTimer = this.config.maxGreenDuration;

        // Update last service time
        newApproaches.forEach(a => {
          this.lastServiceTime[a] = Date.now();
        });

        this.eventManager.addEvent({
          type: 'PHASE_ACTIVATE',
          description: `${newPhase} phase activated`,
          details: { phase: newPhase, greenDuration: this.config.maxGreenDuration }
        });

      }, this.config.allRedDuration);

    }, this.config.yellowDuration);

    this.phaseTimer = this.config.yellowDuration + this.config.allRedDuration;
  }

  /**
   * Set signal color for an approach
   */
  setSignalColor(approach, color) {
    this.signalState[approach] = color;
  }

  /**
   * Check and enforce fairness limits
   */
  checkFairness() {
    const approaches = ['north', 'south', 'east', 'west'];
    let maxWait = 0;
    let longestWaitApproach = null;

    approaches.forEach(approach => {
      const wait = this.trafficState[approach].waitTime;
      if (wait > maxWait) {
        maxWait = wait;
        longestWaitApproach = approach;
      }
    });

    if (maxWait > this.config.maxWaitTime) {
      this.eventManager.addEvent({
        type: 'FAIRNESS_ALERT',
        description: `Fairness limit exceeded: ${longestWaitApproach} waiting ${Math.round(maxWait/1000)}s`,
        severity: 'warning',
        details: { approach: longestWaitApproach, waitTime: maxWait }
      });

      // Force service to the longest-waiting approach
      const forcedPhase = ['north', 'south'].includes(longestWaitApproach) ? 'north-south' : 'east-west';
      if (this.activePhase !== forcedPhase) {
        this.decisionExplanation = `Fairness override: ${longestWaitApproach} waited too long`;
        this.transitionToPhase(forcedPhase);
      }
    }
  }

  /**
   * Manual signal request - queued for processing
   */
  manualSignalRequest(approach, signal, duration = null) {
    const requestId = uuidv4();

    // Validate the request first
    const validation = this.validateSignalRequest(approach, signal);
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    // Add to queue for processing
    const request = {
      id: requestId,
      approach,
      signal,
      duration: duration || 5000,
      timestamp: Date.now(),
      status: 'queued'
    };

    this.manualRequestQueue.push(request);

    this.eventManager.addEvent({
      type: 'MANUAL_REQUEST_QUEUED',
      description: `Manual signal request queued: ${approach} to ${signal.toUpperCase()}`,
      details: { approach, signal, requestId }
    });

    return { success: true, requestId };
  }

  /**
   * Validate manual signal request against conflict matrix
   */
  validateSignalRequest(approach, signal) {
    // Can't request green if conflicting approach has green
    const conflicts = this.getConflicts(approach);

    for (const conflict of conflicts) {
      if (this.signalState[conflict] === 'green') {
        return { valid: false, reason: `Conflicting approach ${conflict} has green` };
      }
    }

    // Validate signal state transitions
    if (signal === 'green' && this.signalState[approach] === 'green') {
      return { valid: false, reason: 'Already green' };
    }

    if (signal === 'yellow' && this.signalState[approach] !== 'green') {
      return { valid: false, reason: 'Can only transition to yellow from green' };
    }

    return { valid: true };
  }

  /**
   * Get conflicting approaches for a given approach
   */
  getConflicts(approach) {
    const conflictMap = {
      north: ['east', 'west'],
      south: ['east', 'west'],
      east: ['north', 'south'],
      west: ['north', 'south']
    };
    return conflictMap[approach] || [];
  }

  /**
   * Process manual request queue with immediate changes
   */
  processManualRequestQueue() {
    while (this.manualRequestQueue.length > 0) {
      const request = this.manualRequestQueue.shift();

      // Apply the signal change immediately
      this.setSignalColor(request.approach, request.signal);

      // If changing from red to green, show yellow first for realism
      if (request.signal === 'green' && this.signalState[request.approach] === 'red') {
        // Note: In a real system we'd handle this with timeouts
        // For simplicity, we set green directly but this is the logic
        this.eventManager.addEvent({
          type: 'MANUAL_SIGNAL_CHANGE',
          description: `Traffic light changed to GREEN for ${request.approach}`,
          details: request
        });
      } else {
        this.eventManager.addEvent({
          type: 'MANUAL_SIGNAL_CHANGE',
          description: `Traffic light changed to ${request.signal.toUpperCase()} for ${request.approach}`,
          details: request
        });
      }
    }
  }

  /**
   * Request a specific phase (for compatible phase changes)
   */
  requestPhase(phase) {
    const validPhases = ['north-south', 'east-west'];

    if (!validPhases.includes(phase)) {
      return { success: false, reason: `Invalid phase: ${phase}` };
    }

    if (this.activePhase === phase) {
      return { success: false, reason: `Already in ${phase} phase` };
    }

    if (this.mode === 'AI' && this.aiActive) {
      // Queue for AI consideration
      this.phaseQueue.push(phase);
      return { success: true, queued: true };
    }

    // Immediate transition in manual mode
    this.transitionToPhase(phase);
    return { success: true };
  }

  /**
   * Set operating mode
   */
  setMode(mode) {
    const validModes = ['AI', 'MANUAL', 'FAULT'];

    if (!validModes.includes(mode)) {
      return { success: false, reason: `Invalid mode: ${mode}` };
    }

    const oldMode = this.mode;
    this.mode = mode;

    this.eventManager.addEvent({
      type: 'MODE_CHANGE',
      description: `Mode changed from ${oldMode} to ${mode}`,
      details: { from: oldMode, to: mode }
    });

    if (mode === 'MANUAL') {
      this.aiActive = false;
    }

    return { success: true };
  }

  /**
   * Start AI control
   */
  startAI() {
    if (this.mode === 'FAULT') {
      return { success: false, reason: 'Cannot start AI in fault state' };
    }

    this.aiActive = true;
    this.mode = 'AI';

    // Ensure safe initial state
    const currentApproaches = this.activePhase === 'north-south' ? ['north', 'south'] : ['east', 'west'];
    currentApproaches.forEach(a => {
      if (this.signalState[a] !== 'green') {
        this.setSignalColor(a, 'green');
      }
    });

    const otherApproaches = this.getOtherApproaches(this.activePhase);
    otherApproaches.forEach(a => {
      if (this.signalState[a] !== 'red') {
        this.setSignalColor(a, 'red');
      }
    });

    this.eventManager.addEvent({
      type: 'AI_STARTED',
      description: 'AI traffic control activated',
      severity: 'info'
    });

    return { success: true };
  }

  /**
   * Stop AI control
   */
  stopAI() {
    this.aiActive = false;

    this.eventManager.addEvent({
      type: 'AI_STOPPED',
      description: 'AI traffic control stopped',
      severity: 'info'
    });

    return { success: true };
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    this.eventManager.addEvent({
      type: 'CONFIG_CHANGED',
      description: 'Configuration updated',
      details: { changes: newConfig }
    });

    return { success: true };
  }

  /**
   * Get complete state for UI rendering
   */
  getFullState() {
    return {
      mode: this.mode,
      aiActive: this.aiActive,
      activePhase: this.activePhase,
      signalState: { ...this.signalState },
      phaseTimer: this.phaseTimer,
      trafficState: { ...this.trafficState },
      inputHealth: { ...this.inputHealth },
      decisionExplanation: this.decisionExplanation,
      lastDecisionReason: this.lastDecisionReason,
      config: { ...this.config },
      manualQueueLength: this.manualRequestQueue.length,
      timestamp: Date.now()
    };
  }

  /**
   * Get state for a specific approach
   */
  getApproachState(approach) {
    return {
      signal: this.signalState[approach],
      traffic: this.trafficState[approach],
      inputHealth: {
        camera: this.inputHealth.cameras[approach],
        sensor: this.inputHealth.sensors[approach]
      }
    };
  }
}

module.exports = TrafficController;