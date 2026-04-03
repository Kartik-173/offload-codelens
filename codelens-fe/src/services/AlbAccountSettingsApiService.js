import APIConstants from './APIConstants';
import APIService from './APIService';
import DebugService from './DebugService';

/**
 * ALB Account Settings API Service
 * Handles ALB manager account-specific settings stored in Cassandra
 */
const AlbAccountSettingsApiService = {
  // Get ALB settings for a specific account
  getAccountSettings: async (accountId) => {
    try {
      const endpoint = `${APIConstants.ALB_ACCOUNT_SETTINGS.GET_SETTINGS}/${accountId}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error('AlbAccountSettingsApiService: Error getting ALB account settings', error, accountId);
      throw error;
    }
  },

  // Update ALB account settings
  updateAccountSettings: async (accountId, settings) => {
    try {
      const endpoint = `${APIConstants.ALB_ACCOUNT_SETTINGS.UPDATE_SETTINGS}/${accountId}`;
      return await APIService.put(endpoint, settings);
    } catch (error) {
      DebugService.error('AlbAccountSettingsApiService: Error updating ALB account settings', error, accountId, settings);
      throw error;
    }
  },

  // Get settings for multiple accounts (batch operation)
  getBatchAccountSettings: async (accountIds) => {
    try {
      const endpoint = APIConstants.ALB_ACCOUNT_SETTINGS.GET_BATCH_SETTINGS;
      return await APIService.post(endpoint, { accountIds });
    } catch (error) {
      DebugService.error('AlbAccountSettingsApiService: Error getting batch ALB account settings', error, accountIds);
      throw error;
    }
  },

  // Log ALB action (used by ALB manager for audit)
  logAlbAction: async (actionData) => {
    try {
      const endpoint = APIConstants.ALB_ACCOUNT_SETTINGS.LOG_ACTION;
      return await APIService.post(endpoint, actionData);
    } catch (error) {
      DebugService.error('AlbAccountSettingsApiService: Error logging ALB action', error, actionData);
      // Don't throw - logging failures shouldn't break main flow
      console.warn('Failed to log ALB action:', error.message);
    }
  },

  // Admin functions
  getAccountsWithAutoDeregisterEnabled: async () => {
    try {
      const endpoint = APIConstants.ALB_ACCOUNT_SETTINGS.GET_USERS_WITH_AUTO_DEREGISTER;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error('AlbAccountSettingsApiService: Error getting accounts with auto-deregister enabled', error);
      throw error;
    }
  },

  bulkDisableAutoDeregister: async (adminUserId) => {
    try {
      const endpoint = APIConstants.ALB_ACCOUNT_SETTINGS.BULK_DISABLE_AUTO_DEREGISTER;
      return await APIService.post(endpoint, { adminUserId });
    } catch (error) {
      DebugService.error('AlbAccountSettingsApiService: Error in bulk disable auto-deregister', error, adminUserId);
      throw error;
    }
  },

  getAlbActionStats: async (days = 30) => {
    try {
      const endpoint = `${APIConstants.ALB_ACCOUNT_SETTINGS.GET_STATS}?days=${days}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error('AlbAccountSettingsApiService: Error getting ALB action stats', error);
      throw error;
    }
  },

  getFailedActions: async (hours = 24, limit = 100) => {
    try {
      const endpoint = `${APIConstants.ALB_ACCOUNT_SETTINGS.GET_FAILED_ACTIONS}?hours=${hours}&limit=${limit}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error('AlbAccountSettingsApiService: Error getting failed actions', error);
      throw error;
    }
  }
};

export default AlbAccountSettingsApiService;
