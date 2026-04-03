import APIConstants from './APIConstants';
import APIService from './APIService';
import DebugService from './DebugService';

/**
 * User Preferences API Service
 * Handles ALB manager user preferences stored in Cassandra
 */
const UserPreferencesApiService = {
  // Get user ALB preferences
  getAlbPreferences: async (userId) => {
    try {
      const endpoint = `${APIConstants.USER_PREFERENCES.GET_ALB_PREFERENCES}/${userId}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error('UserPreferencesApiService: Error getting ALB preferences', error, userId);
      throw error;
    }
  },

  // Update user ALB preferences
  updateAlbPreferences: async (userId, preferences) => {
    try {
      const endpoint = `${APIConstants.USER_PREFERENCES.UPDATE_ALB_PREFERENCES}/${userId}`;
      return await APIService.put(endpoint, preferences);
    } catch (error) {
      DebugService.error('UserPreferencesApiService: Error updating ALB preferences', error, userId, preferences);
      throw error;
    }
  },

  // Get preference history
  getPreferenceHistory: async (userId, limit = 50) => {
    try {
      const endpoint = `${APIConstants.USER_PREFERENCES.GET_HISTORY}/${userId}?limit=${limit}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error('UserPreferencesApiService: Error getting preference history', error, userId);
      throw error;
    }
  },

  // Log ALB action (used by ALB manager for audit)
  logAlbAction: async (actionData) => {
    try {
      const endpoint = APIConstants.USER_PREFERENCES.LOG_ACTION;
      return await APIService.post(endpoint, actionData);
    } catch (error) {
      DebugService.error('UserPreferencesApiService: Error logging ALB action', error, actionData);
      // Don't throw - logging failures shouldn't break main flow
      console.warn('Failed to log ALB action:', error.message);
    }
  },

  // Admin functions

  getAlbActionStats: async (days = 30) => {
    try {
      const endpoint = `${APIConstants.USER_PREFERENCES.GET_STATS}?days=${days}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error('UserPreferencesApiService: Error getting ALB action stats', error);
      throw error;
    }
  },

  getFailedActions: async (hours = 24, limit = 100) => {
    try {
      const endpoint = `${APIConstants.USER_PREFERENCES.GET_FAILED_ACTIONS}?hours=${hours}&limit=${limit}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error('UserPreferencesApiService: Error getting failed actions', error);
      throw error;
    }
  }
};

export default UserPreferencesApiService;
