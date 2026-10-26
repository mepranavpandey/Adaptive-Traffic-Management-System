/**
 * ViolationDetector - Detects traffic violations (speed, red light, accidents)
 *
 * Uses vehicle tracking data and signal state to identify violations.
 */

class ViolationDetector {
  constructor(eventManager) {
    this.eventManager = eventManager;
    this.trackedVehicles = new Map(); // vehicleId -> tracking data
    this.violationCooldowns = new Map(); // vehicleId -> violation types with timestamps
  }

  /**
   * Check for violations on an approach
   */
  checkViolations(approach, trafficState, signalState) {
    this.checkSpeedViolations(approach, trafficState);
    this.checkRedLightViolations(approach, trafficState, signalState);
    this.checkAccidentSuspicion(approach, trafficState);
  }

  /**
   * Check for speed violations
   */
  checkSpeedViolations(approach, trafficState) {
    const speedLimit = 60; // Configurable speed limit

    // Skip if speed data is not available
    if (!trafficState.speed || trafficState.speed <= 0) {
      return;
    }

    // Check if vehicle is exceeding speed limit
    if (trafficState.speed > speedLimit) {
      // Check cooldown to avoid duplicate alerts for same vehicle
      const cooldownKey = `${approach}-speed`;
      if (!this.hasCooldown(cooldownKey, 5000)) {
        // Simulate plate recognition for violation event
        const plate = this.generateFakePlate(approach);

        this.eventManager.addSpeedViolation({
          approach,
          estimatedSpeed: trafficState.speed,
          speedLimit,
          confidence: 0.85,
          numberPlate: plate,
          cameraFrame: `cam_${approach}_frame_${Date.now()}`
        });

        this.setCooldown(cooldownKey);
      }
    }
  }

  /**
   * Check for red light violations
   */
  checkRedLightViolations(approach, trafficState, signalState) {
    const signal = signalState[approach];

    // Only check for violations when signal is red
    if (signal !== 'red') {
      return;
    }

    // Skip if vehicle is not detected approaching
    if (trafficState.count === 0) {
      return;
    }

    // Check if there's movement during red (potential violation)
    if (trafficState.moving > 0 && trafficState.waitTime < 2000) {
      const cooldownKey = `${approach}-red-light`;
      if (!this.hasCooldown(cooldownKey, 8000)) {
        const plate = this.generateFakePlate(approach);

        this.eventManager.addRedLightViolation({
          approach,
          movement: 'through',
          signalState: signal,
          stopLineCrossing: true,
          confidence: 0.75,
          numberPlate: plate,
          cameraFrame: `cam_${approach}_frame_${Date.now()}`
        });

        this.setCooldown(cooldownKey);
      }
    }
  }

  /**
   * Check for accident suspicion based on traffic patterns
   */
  checkAccidentSuspicion(approach, trafficState) {
    // Accident indicators:
    // 1. Sudden drop in vehicle count
    // 2. High queue with no movement
    // 3. Unusual congestion growth

    const cooldownKey = `${approach}-accident`;

    // Check for stationary queue with waiting vehicles
    const queueThreshold = 8;
    const waitThreshold = 45000; // 45 seconds

    if (trafficState.queueLength >= queueThreshold &&
        trafficState.waitTime > waitThreshold &&
        trafficState.moving === 0) {
      if (!this.hasCooldown(cooldownKey, 60000)) {
        this.eventManager.addEvent({
          type: 'ACCIDENT_SUSPICION',
          category: 'incident',
          severity: 'warning',
          description: `Possible accident suspected on ${approach}`,
          details: {
            approach,
            queueLength: trafficState.queueLength,
            waitTime: trafficState.waitTime,
            movingVehicles: trafficState.moving,
            suspicionReasons: [
              'High queue with no movement',
              'Extended wait time'
            ]
          }
        });

        this.setCooldown(cooldownKey);
      }
    }
  }

  /**
   * Check if cooldown period has expired for a violation type
   */
  hasCooldown(key, duration) {
    const cooldownTime = this.violationCooldowns.get(key);
    if (!cooldownTime) return false;

    return Date.now() - cooldownTime < duration;
  }

  /**
   * Set a cooldown period for a violation type
   */
  setCooldown(key) {
    this.violationCooldowns.set(key, Date.now());

    // Clean up old cooldowns periodically
    setTimeout(() => {
      this.violationCooldowns.delete(key);
    }, 300000); // 5 minute cleanup
  }

  /**
   * Generate a fake plate number for demonstration
   */
  generateFakePlate(approach) {
    const plates = [
      'ABC123', 'DEF456', 'GHI789', 'JKL012',
      'MNO345', 'PQR678', 'STU901', 'VWX234',
      'YZA567', 'BCD890'
    ];

    const index = Math.floor(Math.random() * plates.length);
    return plates[index];
  }
}

module.exports = ViolationDetector;