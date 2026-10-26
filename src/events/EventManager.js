/**
 * EventManager - Central event collection and management
 *
 * Tracks all traffic events, violations, system notifications,
 * and provides event history for the side panel.
 */

const { v4: uuidv4 } = require('uuid');

class EventManager {
  constructor(maxEvents = 200) {
    this.events = [];
    this.maxEvents = maxEvents;
    this.listeners = [];
  }

  /**
   * Add a new event to the event log
   */
  addEvent(event) {
    const fullEvent = {
      id: uuidv4(),
      ...event,
      timestamp: event.timestamp || Date.now()
    };

    this.events.unshift(fullEvent);

    // Trim old events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    // Notify listeners
    this.notifyListeners(fullEvent);

    return fullEvent;
  }

  /**
   * Add speed violation event
   */
  addSpeedViolation(data) {
    return this.addEvent({
      type: 'SPEED_VIOLATION',
      category: 'violation',
      severity: 'warning',
      description: `Speed violation on ${data.approach}: ${data.estimatedSpeed} km/h (limit: ${data.speedLimit})`,
      details: {
        approach: data.approach,
        estimatedSpeed: data.estimatedSpeed,
        speedLimit: data.speedLimit,
        confidence: data.confidence,
        numberPlate: data.numberPlate || null,
        cameraFrame: data.cameraFrame || null
      }
    });
  }

  /**
   * Add red light violation event
   */
  addRedLightViolation(data) {
    return this.addEvent({
      type: 'RED_LIGHT_VIOLATION',
      category: 'violation',
      severity: 'warning',
      description: `Red light violation on ${data.approach}`,
      details: {
        approach: data.approach,
        movement: data.movement,
        signalState: data.signalState,
        stopLineCrossing: data.stopLineCrossing,
        confidence: data.confidence,
        numberPlate: data.numberPlate || null,
        cameraFrame: data.cameraFrame || null
      }
    });
  }

  /**
   * Add vehicle detection event
   */
  addVehicleDetected(data) {
    return this.addEvent({
      type: 'VEHICLE_DETECTED',
      category: 'action',
      description: `Vehicle detected on ${data.approach}`,
      details: {
        approach: data.approach,
        count: data.count,
        numberPlate: data.numberPlate || null
      }
    });
  }

  /**
   * Add number plate recognition event
   */
  addNumberPlateRecognized(data) {
    return this.addEvent({
      type: 'NUMBER_PLATE_RECOGNIZED',
      category: 'action',
      description: `Plate recognized: ${data.plateText}`,
      details: {
        plateText: data.plateText,
        approach: data.approach,
        confidence: data.confidence,
        vehicleId: data.vehicleId
      }
    });
  }

  /**
   * Add system notification
   */
  addNotification(type, message, severity = 'info') {
    return this.addEvent({
      type: type,
      category: 'system',
      severity,
      description: message
    });
  }

  /**
   * Get recent events
   */
  getRecentEvents(count = 20, category = null) {
    let filtered = this.events;

    if (category) {
      filtered = filtered.filter(e => e.category === category);
    }

    return filtered.slice(0, count);
  }

  /**
   * Get events by type
   */
  getEventsByType(type, count = 20) {
    return this.events
      .filter(e => e.type === type)
      .slice(0, count);
  }

  /**
   * Get speed violations
   */
  getSpeedViolations(count = 20) {
    return this.getEventsByType('SPEED_VIOLATION', count);
  }

  /**
   * Get red light violations
   */
  getRedLightViolations(count = 20) {
    return this.getEventsByType('RED_LIGHT_VIOLATION', count);
  }

  /**
   * Get recognized plates
   */
  getNumberPlates(count = 20) {
    return this.getEventsByType('NUMBER_PLATE_RECOGNIZED', count);
  }

  /**
   * Get system notifications
   */
  getSystemNotifications(count = 20) {
    return this.events
      .filter(e => e.category === 'system')
      .slice(0, count);
  }

  /**
   * Get all detected actions
   */
  getDetectedActions(count = 20) {
    return this.events
      .filter(e => e.category === 'action')
      .slice(0, count);
  }

  /**
   * Subscribe to events
   */
  subscribe(callback) {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  /**
   * Clear all events
   */
  clearEvents() {
    this.events = [];
  }

  /**
   * Get event statistics
   */
  getStats() {
    return {
      total: this.events.length,
      violations: this.events.filter(e => e.category === 'violation').length,
      actions: this.events.filter(e => e.category === 'action').length,
      system: this.events.filter(e => e.category === 'system').length,
      speedViolations: this.getSpeedViolations().length,
      redLightViolations: this.getRedLightViolations().length
    };
  }
}

module.exports = EventManager;