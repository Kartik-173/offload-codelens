/**
 * In-Memory Storage Service
 * Replaces OpenSearch for storing ALB and email data
 * Provides fast, temporary storage with automatic cleanup
 */

class MemoryStorageService {
  constructor() {
    this.data = new Map(); // Main storage
    this.timestamps = new Map(); // Track when data was stored
    this.ttl = 30 * 60 * 1000; // 30 minutes TTL for data
    this.cleanupInterval = 5 * 60 * 1000; // Cleanup every 5 minutes
    
    // Start automatic cleanup
    this.startCleanup();
  }

  /**
   * Start automatic cleanup of expired data
   */
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Clean up expired data
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.data.delete(key);
      this.timestamps.delete(key);
    }

    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired memory storage entries`);
    }
  }

  /**
   * Store data with timestamp
   */
  store(userId, type, data) {
    const key = `${userId}:${type}`;
    this.data.set(key, {
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
    this.timestamps.set(key, Date.now());
    return { success: true, data: data };
  }

  /**
   * Retrieve data
   */
  retrieve(userId, type) {
    const key = `${userId}:${type}`;
    const result = this.data.get(key);
    
    if (!result) {
      return { success: false, message: 'Data not found' };
    }

    // Check if expired
    const age = Date.now() - this.timestamps.get(key);
    if (age > this.ttl) {
      this.data.delete(key);
      this.timestamps.delete(key);
      return { success: false, message: 'Data expired' };
    }

    return result;
  }

  /**
   * Store ALB data specifically
   */
  storeAlbData(userId, albData) {
    return this.store(userId, 'alb', albData);
  }

  /**
   * Get ALB data specifically
   */
  getAlbData(userId) {
    return this.retrieve(userId, 'alb');
  }

  /**
   * Store email configuration specifically
   */
  storeEmailConfig(userId, emailConfig) {
    return this.store(userId, 'email-config', emailConfig);
  }

  /**
   * Get email configuration specifically
   */
  getEmailConfig(userId) {
    return this.retrieve(userId, 'email-config');
  }

  /**
   * Get all keys
   */
  getAllKeys() {
    return Array.from(this.data.keys());
  }

  /**
   * Get general data by key
   */
  get(key) {
    const result = this.data.get(key);
    if (!result) {
      return null;
    }

    // Check if expired
    const keyTimestamp = this.timestamps.get(key);
    if (!keyTimestamp || (Date.now() - keyTimestamp > this.ttl)) {
      this.data.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    return result.data;
  }

  /**
   * Set general data by key
   */
  set(key, data) {
    this.data.set(key, data);
    this.timestamps.set(key, Date.now());
  }

  /**
   * Delete user data by type
   */
  deleteUserDataByType(userId, type) {
    const key = `${userId}:${type}`;
    const deleted = this.data.has(key);
    this.data.delete(key);
    this.timestamps.delete(key);
    return { deleted: deleted ? 1 : 0 };
  }

  /**
   * Delete specific data
   */
  deleteData(userId, type) {
    return this.deleteUserDataByType(userId, type);
  }

  /**
   * Get memory usage statistics
   */
  getMemoryUsage() {
    const totalEntries = this.data.size;
    const totalSize = JSON.stringify(Array.from(this.data.entries())).length;
    
    return {
      totalEntries,
      estimatedSizeBytes: totalSize,
      estimatedSizeMB: (totalSize / 1024 / 1024).toFixed(2)
    };
  }

  /**
   * Get statistics for a user
   */
  getStatistics(userId) {
    const userKeys = Array.from(this.data.keys()).filter(key => key.startsWith(`${userId}:`));
    
    return {
      totalEntries: userKeys.length,
      keys: userKeys,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Get data age
   */
  getDataAge(userId, type) {
    const key = `${userId}:${type}`;
    const timestamp = this.timestamps.get(key);
    
    if (!timestamp) {
      return null;
    }

    return Date.now() - timestamp;
  }
}

module.exports = new MemoryStorageService();
