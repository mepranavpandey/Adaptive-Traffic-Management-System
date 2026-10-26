/**
 * SensorSimulator - Simulates traffic sensors (loop detectors, IR sensors)
 *
 * Provides vehicle presence and count data to supplement camera data.
 */

class SensorSimulator {
  constructor() {
    this.data = {
      north: { vehicleCount: 0, presence: false, confidence: 0, timestamp: null },
      south: { vehicleCount: 0, presence: false, confidence: 0, timestamp: null },
      east: { vehicleCount: 0, presence: false, confidence: 0, timestamp: null },
      west: { vehicleCount: 0, presence: false, confidence: 0, timestamp: null }
    };

    // Sensor health status
    this.status = {
      north: 'ok',
      south: 'ok',
      east: 'ok',
      west: 'ok'
    };

    // Simulated sensor noise
    this.noiseLevel = 0.1;
  }

  /**
   * Update sensor simulation
   */
  update() {
    const approaches = ['north', 'south', 'east', 'west'];

    approaches.forEach(approach => {
      // Simulate sensor reading with some noise
      const noise = (Math.random() - 0.5) * this.noiseLevel;
      const baseReading = Math.random() > 0.3 ? 1 : 0; // 70% chance of detecting presence

      this.data[approach] = {
        vehicleCount: baseReading,
        presence: baseReading === 1,
        confidence: 0.9 + Math.random() * 0.08,
        timestamp: Date.now()
      };

      // Occasionally simulate sensor issues
      if (Math.random() < 0.002) {
        this.status[approach] = 'degraded';
      } else if (Math.random() < 0.001) {
        this.status[approach] = 'disconnected';
      } else {
        this.status[approach] = 'ok';
      }
    });
  }

  /**
   * Get sensor data for approach
   */
  getData(approach) {
    return this.data[approach] || null;
  }

  /**
   * Get all sensor data
   */
  getAllData() {
    return { ...this.data };
  }

  /**
   * Get sensor status
   */
  getStatus(approach) {
    return this.status[approach] || 'unknown';
  }

  /**
   * Set sensor to a specific state (for testing)
   */
  setSensorState(approach, hasVehicle) {
    if (this.data[approach]) {
      this.data[approach].vehicleCount = hasVehicle ? 1 : 0;
      this.data[approach].presence = hasVehicle;
    }
  }
}

module.exports = SensorSimulator;