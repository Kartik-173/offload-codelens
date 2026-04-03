import APIConstants from './APIConstants';
import APIService from './APIService';
import DebugService from './DebugService';

/**
 * ALB Auto Actions API Service
 * Handles auto deregister operations with state management
 */
const AlbAutoActionsApiService = {
  // Auto Deregister Methods
  
  // Start auto deregister for an account
  startAutoDeregister: async (accountId, config = {}) => {
    try {
      const endpoint = APIConstants.ALB_AUTO_ACTIONS.START_DEREGISTER;
      return await APIService.post(endpoint, {
        accountId,
        config
      });
    } catch (error) {
      DebugService.error('AlbAutoActionsApiService: Error starting auto deregister', error, accountId, config);
      throw error;
    }
  },

  // Stop auto deregister for an account
  stopAutoDeregister: async (accountId) => {
    try {
      const endpoint = APIConstants.ALB_AUTO_ACTIONS.STOP_DEREGISTER;
      return await APIService.post(endpoint, {
        accountId
      });
    } catch (error) {
      DebugService.error('AlbAutoActionsApiService: Error stopping auto deregister', error, accountId);
      throw error;
    }
  },

  // Get auto deregister state for an account
  getAutoDeregisterState: async (accountId) => {
    try {
      const endpoint = APIConstants.ALB_AUTO_ACTIONS.GET_DEREGISTER_STATE.replace(':accountId', accountId);
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error('AlbAutoActionsApiService: Error getting auto deregister state', error, accountId);
      throw error;
    }
  },

  // Perform auto deregister run
  performAutoDeregister: async (accountId, credentials, regions) => {
    try {
      const endpoint = APIConstants.ALB_AUTO_ACTIONS.PERFORM_DEREGISTER;
      return await APIService.post(endpoint, {
        accountId,
        credentials,
        regions
      });
    } catch (error) {
      DebugService.error('AlbAutoActionsApiService: Error performing auto deregister', error, accountId);
      throw error;
    }
  },

  // Run auto deregister on-demand (called on page refresh)
  runOnDemand: async (accountId, credentials, regions) => {
    try {
      const endpoint = APIConstants.ALB_AUTO_ACTIONS.RUN_ON_DEMAND_DEREGISTER;
      return await APIService.post(endpoint, {
        accountId,
        credentials,
        regions
      });
    } catch (error) {
      DebugService.error('AlbAutoActionsApiService: Error running on-demand auto deregister', error, accountId);
      throw error;
    }
  },

  // Auto Deregister Activity Methods
  
  // Check for latest auto-deregister activity
  getLatestActivity: async (accountId, lastCheck) => {
    try {
      const endpoint = APIConstants.AUTO_DEREGISTER_ACTIVITY.LATEST.replace(':accountId', accountId);
      const params = lastCheck ? `?lastCheck=${encodeURIComponent(lastCheck)}` : '';
      return await APIService.get(endpoint + params);
    } catch (error) {
      DebugService.error('AlbAutoActionsApiService: Error getting latest activity', error, accountId, lastCheck);
      throw error;
    }
  },

  // Combined Methods

  // Get all active auto actions
  getActiveAutoActions: async () => {
    try {
      const endpoint = APIConstants.ALB_AUTO_ACTIONS.GET_ACTIVE_ACTIONS;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error('AlbAutoActionsApiService: Error getting active auto actions', error);
      throw error;
    }
  },
};

export default AlbAutoActionsApiService;
