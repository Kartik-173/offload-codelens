const UserAlbPreferences = require('../models/userAlbPreferences');
const AlbActionAuditLog = require('../models/albActionAuditLog');

class UserPreferencesService {
  // Get user ALB preferences
  static async getAlbPreferences(userId) {
    try {
      const preferences = await UserAlbPreferences.getByUserId(userId);
      
      // Return defaults if no preferences exist
      if (!preferences) {
        return {
          autoDeregisterEnabled: false,
          userId
        };
      }

      
      return {
        autoDeregisterEnabled: preferences.autoDeregisterEnabled,
        userId: preferences.userId,
        updatedAt: preferences.updatedAt,
        updatedBy: preferences.updatedBy
      };
    } catch (error) {
      console.error('Error getting ALB preferences:', error);
      throw new Error('Failed to retrieve ALB preferences');
    }
  }

  // Update user ALB preferences
  static async updateAlbPreferences(userId, preferences, updatedBy = null) {
    try {
      // Validate input
      if (typeof preferences.autoDeregisterEnabled !== 'boolean') {
        throw new Error('Invalid preference values. autoDeregisterEnabled must be boolean.');
      }

      // Update preferences
      const updatedPrefs = await UserAlbPreferences.upsert(userId, {
        autoDeregisterEnabled: preferences.autoDeregisterEnabled
      }, updatedBy);

      // Log the preference change
      await AlbActionAuditLog.logAction({
        userId,
        actionType: 'preference_update',
        resourceType: 'user_preferences',
        resourceId: userId,
        details: {
          oldPreferences: {
            autoDeregisterEnabled: updatedPrefs.autoDeregisterEnabled !== preferences.autoDeregisterEnabled
          },
          newPreferences: preferences,
          changedBy: updatedBy || userId
        },
        timestamp: new Date(),
        success: true
      });

      return {
        autoDeregisterEnabled: updatedPrefs.autoDeregisterEnabled,
        userId: updatedPrefs.userId,
        updatedAt: updatedPrefs.updatedAt,
        updatedBy: updatedPrefs.updatedBy
      };
    } catch (error) {
      console.error('Error updating ALB preferences:', error);
      
      // Log failed attempt
      await AlbActionAuditLog.logAction({
        userId,
        actionType: 'preference_update',
        resourceType: 'user_preferences',
        resourceId: userId,
        details: {
          attemptedPreferences: preferences,
          error: error.message
        },
        timestamp: new Date(),
        success: false,
        errorMessage: error.message
      });
      
      throw error;
    }
  }

  // Get user preference history/audit log
  static async getPreferenceHistory(userId, limit = 50) {
    try {
      const auditLogs = await AlbActionAuditLog.getByUserId(userId, limit);
      
      // Filter for preference changes only
      return auditLogs.filter(log => log.actionType === 'preference_update');
    } catch (error) {
      console.error('Error getting preference history:', error);
      throw new Error('Failed to retrieve preference history');
    }
  }


  // Get ALB action statistics for admin dashboard
  static async getAlbActionStats(days = 30) {
    try {
      return await AlbActionAuditLog.getStatistics(days);
    } catch (error) {
      console.error('Error getting ALB action statistics:', error);
      throw new Error('Failed to retrieve ALB action statistics');
    }
  }

  // Get failed actions for monitoring
  static async getFailedActions(hours = 24, limit = 100) {
    try {
      return await AlbActionAuditLog.getFailedActions(hours, limit);
    } catch (error) {
      console.error('Error getting failed actions:', error);
      throw new Error('Failed to retrieve failed actions');
    }
  }

  // Log ALB action (used by ALB manager)
  static async logAlbAction(actionData) {
    try {
      return await AlbActionAuditLog.logAction(actionData);
    } catch (error) {
      // Don't throw - logging failures shouldn't break main flow
      console.warn('Failed to log ALB action:', error.message);
    }
  }
}

module.exports = UserPreferencesService;
