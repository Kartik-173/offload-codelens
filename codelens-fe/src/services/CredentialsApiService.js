import APIConstants from "./APIConstants";
import APIService from "./APIService";
import DebugService from "./DebugService";

/**
 * @description Credentials API Service
 */
const CredentialsApiService = {
  /**
   * Store AWS credentials for a specific user + account
   */
  storeCredentials: async (data) => {
    try {
      return await APIService.post(APIConstants.CREDENTIALS.STORE, data);
    } catch (error) {
      DebugService.error("Credentials API: Error storing credentials", error, data);
      throw error;
    }
  },

  /**
   * Check if credentials exist for a given user + account
   */
  getCredentials: async (userId, accountId) => {
    try {
      const endpoint = `${APIConstants.CREDENTIALS.GET}/${userId}/${accountId}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error("Credentials API: Error fetching credentials", error, userId, accountId);
      throw error;
    }
  },

  /**
   * List all account IDs stored for a given user
   */
  listAccountIds: async (userId) => {
    try {
      const endpoint = `${APIConstants.CREDENTIALS.GET_ACCOUNT_IDS}/${userId}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error("Credentials API: Error listing account IDs", error, userId);
      throw error;
    }
  },

  deleteCredentials: async (userId, accountId) => {
    try {
      const endpoint = `${APIConstants.CREDENTIALS.DELETE}/${userId}/${accountId}`;
      return await APIService.delete(endpoint);
    } catch (error) {
      DebugService.error("Credentials API: Error deleting credentials", error, userId, accountId);
      throw error;
    }
  },

  // -------- Azure --------
  /**
   * Store Azure credentials for a specific user (single tenant)
   */
  storeAzureCredentials: async (data) => {
    try {
      return await APIService.post(APIConstants.CREDENTIALS.STORE_AZURE, data);
    } catch (error) {
      DebugService.error("Credentials API: Error storing Azure credentials", error, data);
      throw error;
    }
  },

  /**
   * Get Azure credentials for a given user + tenantId
   */
  getAzureCredentials: async (userId, tenantId) => {
    try {
      const endpoint = `${APIConstants.CREDENTIALS.GET_AZURE}/${userId}/${tenantId}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error("Credentials API: Error fetching Azure credentials", error, userId, tenantId);
      throw error;
    }
  },

  /**
   * List Azure tenant IDs for a user
   */
  listAzureTenantIds: async (userId) => {
    try {
      const endpoint = `${APIConstants.CREDENTIALS.GET_AZURE_TENANTS}/${userId}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error("Credentials API: Error listing Azure tenant IDs", error, userId);
      throw error;
    }
  },

  deleteAzureCredentials: async (userId, tenantId) => {
    try {
      const endpoint = `${APIConstants.CREDENTIALS.DELETE_AZURE}/${userId}/${tenantId}`;
      return await APIService.delete(endpoint);
    } catch (error) {
      DebugService.error("Credentials API: Error deleting Azure credentials", error, userId, tenantId);
      throw error;
    }
  },
};

export default CredentialsApiService;
