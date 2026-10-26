/**
 * CameraSimulator - Simulates camera input for traffic detection
 *
 * Provides realistic vehicle detection data for demo/testing purposes.
 * In production, this would be replaced with actual camera feed processing.
 */

class CameraSimulator {
  constructor(signalStates = null) {
    this.data = {
      north: { vehicleCount: 0, queueLength: 0, waitTime: 0, moving: 0, speed: 0, confidence: 0, timestamp: null },
      south: { vehicleCount: 0, queueLength: 0, waitTime: 0, moving: 0, speed: 0, confidence: 0, timestamp: null },
      east: { vehicleCount: 0, queueLength: 0, waitTime: 0, moving: 0, speed: 0, confidence: 0, timestamp: null },
      west: { vehicleCount: 0, queueLength: 0, waitTime: 0, moving: 0, speed: 0, confidence: 0, timestamp: null }
    };

    // Signal states to simulate realistic vehicle behavior
    this.signalStates = signalStates || {
      north: 'red',
      south: 'red',
      east: 'red',
      west: 'red'
    };

    // Simulation state
    this.simulationTime = 0;
    this.pattern = 'balanced'; // 'balanced', 'heavy-ns', 'heavy-ew', 'congested'
    this.lastPatternChange = Date.now();

    // Base counts for simulation
    this.baseCounts = { north: 2, south: 2, east: 2, west: 2 };
    this.targetCounts = { ...this.baseCounts };
  }

  /**
   * Update simulation - called periodically
   */
  update() {
    this.simulationTime += 200;

    // Generate more dynamic traffic that changes every few seconds
    this.generateDynamicTraffic();
    this.generateDetectionData();
  }

  /**
   * Generate dynamic traffic patterns that change frequently
   */
  generateDynamicTraffic() {
    const approaches = ['north', 'south', 'east', 'west'];

    approaches.forEach(approach => {
      // Base traffic varies between 1-10 vehicles
      const baseTraffic = 1 + Math.sin(this.simulationTime / 5000) * 4;

      // Add random variations
      const randomVariation = (Math.random() - 0.5) * 3;

      // Approach-specific patterns
      let approachPattern = 0;
      switch (approach) {
        case 'north':
          approachPattern = Math.sin(this.simulationTime / 3000);
          break;
        case 'south':
          approachPattern = Math.cos(this.simulationTime / 3500);
          break;
        case 'east':
          approachPattern = Math.sin(this.simulationTime / 4000 + 1);
          break;
        case 'west':
          approachPattern = Math.cos(this.simulationTime / 4500 + 1);
          break;
      }

      // Calculate final count
      const count = Math.max(1, Math.floor(baseTraffic + randomVariation + approachPattern * 2));
      this.baseCounts[approach] = count;

      // Also update target counts for consistency
      this.targetCounts[approach] = count;
    });
  }

  /**
   * Smoothly interpolate toward target counts
   */
  updateCounts() {
    const approaches = ['north', 'south', 'east', 'west'];
    const smoothing = 0.02; // Slow change for smooth simulation

    approaches.forEach(approach => {
      const target = this.targetCounts[approach];
      const current = this.baseCounts[approach];
      this.baseCounts[approach] = current + (target - current) * smoothing;

      // Add some random variation
      const variation = (Math.random() - 0.5) * 2;
      this.baseCounts[approach] = Math.max(0, this.baseCounts[approach] + variation);
    });
  }

  /**
   * Generate realistic detection data based on counts and signal state
   */
  generateDetectionData() {
    const approaches = ['north', 'south', 'east', 'west'];

    approaches.forEach(approach => {
      const baseCount = Math.round(this.baseCounts[approach]);
      const signalState = this.signalStates[approach];

      // Calculate queue (vehicles waiting at stop line)
      const queueLength = Math.floor(baseCount * 0.7 + Math.random() * 2);

      // Calculate moving vehicles based on signal state
      let moving, speed;

      if (signalState === 'green') {
        // Green light: most vehicles are moving
        moving = Math.max(0, baseCount - queueLength * 0.2);
        // Calculate average speed for green (fewer vehicles = faster)
        const baseSpeed = 40 - baseCount * 1.5;
        speed = Math.max(15, baseSpeed + (Math.random() - 0.5) * 10);
      } else if (signalState === 'yellow') {
        // Yellow light: some vehicles still moving, some stopping
        moving = Math.max(0, baseCount - queueLength * 0.5);
        const baseSpeed = 25 - baseCount * 1.0;
        speed = Math.max(10, baseSpeed + (Math.random() - 0.5) * 8);
      } else {
        // Red light: most vehicles are stopped, minimal movement
        moving = Math.max(0, baseCount - queueLength * 0.9);
        const baseSpeed = 5 - baseCount * 0.2;
        speed = Math.max(0, baseSpeed + (Math.random() - 0.5) * 3);
      }

      // Ensure moving vehicles don't exceed total count
      moving = Math.min(moving, baseCount);

      // Calculate wait time (longer queue = more wait)
      const waitTime = queueLength * 3000 + Math.random() * 5000;

      this.data[approach] = {
        vehicleCount: baseCount,
        queueLength,
        waitTime: Math.round(waitTime),
        moving: Math.round(moving),
        speed: Math.round(speed),
        confidence: 0.85 + Math.random() * 0.1,
        timestamp: Date.now()
      };
    });
  }

  /**
   * Get data for a specific approach
   */
  getData(approach) {
    return this.data[approach] || null;
  }

  /**
   * Update signal states for realistic speed simulation
   */
  updateSignalStates(signalStates) {
    if (signalStates) {
      this.signalStates = { ...this.signalStates, ...signalStates };
    }
  }

  /**
   * Get all camera data
   */
  getAllData() {
    return { ...this.data };
  }

  /**
   * Set simulation pattern manually
   */
  setPattern(pattern) {
    this.pattern = pattern;
    this.lastPatternChange = Date.now();

    switch (pattern) {
      case 'balanced':
        this.targetCounts = { north: 3, south: 3, east: 3, west: 3 };
        break;
      case 'heavy-ns':
        this.targetCounts = { north: 12, south: 10, east: 2, west: 2 };
        break;
      case 'heavy-ew':
        this.targetCounts = { north: 2, south: 2, east: 12, west: 10 };
        break;
      case 'congested':
        this.targetCounts = { north: 18, south: 15, east: 20, west: 16 };
        break;
    }
  }

  /**
   * Inject specific vehicle count (for testing)
   */
  setVehicleCount(approach, count) {
    if (this.data[approach]) {
      this.baseCounts[approach] = count;
    }
  }
}

module.exports = CameraSimulator;