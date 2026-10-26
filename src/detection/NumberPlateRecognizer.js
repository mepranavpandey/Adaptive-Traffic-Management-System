/**
 * NumberPlateRecognizer - Detects and recognizes vehicle number plates
 *
 * Uses simulated camera imagery and OCR for plate recognition.
 * In production, this would use actual OCR models.
 */

class NumberPlateRecognizer {
  constructor() {
    this.recognizedPlates = new Map(); // vehicleId -> plate data
    this.platePatterns = [
      // Generic patterns
      /^[A-Z]{2}[0-9]{2}[A-Z]{3}$/, // AB12CDE
      /^[A-Z]{3}[0-9]{3}$/, // ABC123
      /^[0-9]{3}[A-Z]{3}$/, // 123ABC
      /^[A-Z]{2}[0-9]{4}$/, // AB1234
    ];

    this.statePlatePrefixes = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS'];
  }

  /**
   * Process a vehicle frame for number plate recognition
   */
  processFrame(vehicleData, approach) {
    if (!vehicleData.confidence || vehicleData.confidence < 0.6) {
      return { plateText: null, confidence: 0, status: 'unavailable' };
    }

    // Simulate plate detection based on confidence
    const detectionConfidence = Math.random();

    if (detectionConfidence > 0.7) {
      // Successfully detect and recognize plate
      const plateText = this.generateRecognizedPlate(approach);

      const plateData = {
        plateText,
        confidence: 0.85 + Math.random() * 0.14,
        status: 'recognized',
        timestamp: Date.now(),
        approach,
        vehicleId: vehicleData.id
      };

      this.recognizedPlates.set(vehicleData.id, plateData);

      return {
        plateText,
        confidence: plateData.confidence,
        status: 'recognized'
      };
    } else if (detectionConfidence > 0.4) {
      // Partial recognition - plate visible but unreadable
      return {
        plateText: null,
        confidence: 0.3,
        status: 'uncertain'
      };
    } else {
      // Plate not visible or too poor quality
      return {
        plateText: null,
        confidence: 0,
        status: 'unavailable'
      };
    }
  }

  /**
   * Generate a realistic-looking plate number
   */
  generateRecognizedPlate(approach) {
    const patterns = [
      () => this.randomString(2) + Math.floor(Math.random() * 90 + 10) + this.randomString(3),
      () => this.randomString(3) + Math.floor(Math.random() * 900 + 100),
      () => Math.floor(Math.random() * 900 + 100) + this.randomString(3),
      () => this.randomString(2) + Math.floor(Math.random() * 9000 + 1000),
    ];

    const patternIndex = Math.floor(Math.random() * patterns.length);
    return patterns[patternIndex]();
  }

  /**
   * Generate random string for plate
   */
  randomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get plate data for a specific vehicle
   */
  getPlateData(vehicleId) {
    return this.recognizedPlates.get(vehicleId);
  }

  /**
   * Get all recently recognized plates
   */
  getRecognizedPlates() {
    const plates = Array.from(this.recognizedPlates.values());
    return plates.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get plate status for UI display
   */
  getPlateStatus(plateText) {
    if (!plateText) return { text: 'Plate unavailable', confidence: 0 };

    return {
      text: plateText,
      confidence: 0.85
    };
  }

  /**
   * Clear old plate data
   */
  cleanupOldData(maxAge = 300000) {
    const now = Date.now();
    for (const [vehicleId, plateData] of this.recognizedPlates) {
      if (now - plateData.timestamp > maxAge) {
        this.recognizedPlates.delete(vehicleId);
      }
    }
  }
}

module.exports = NumberPlateRecognizer;