import APIConstants from "./APIConstants";
import APIService, { AxiosService } from "./APIService";
import DebugService from "./DebugService";

/**
 * @description Bitbucket Accounts API Service
 */
const BitbucketApiService = {
  /**
   * Build the Bitbucket OAuth login URL based on the current environment baseURL
   */
  getBitbucketAuthUrl: () => `${AxiosService.defaults.baseURL}/api/auth/bitbucket`,

  /**
   * Logout Bitbucket account (revoke token + delete from DB)
   * @param {string} bitbucketUsername
   */
  logoutBitbucket: async (bitbucketUsername) => {
    try {
      return await APIService.post(APIConstants.AUTH.BITBUCKET_LOGOUT, {
        bitbucket_username: bitbucketUsername,
      });
    } catch (error) {
      DebugService.error(
        "Bitbucket API: Error logging out",
        error,
        bitbucketUsername
      );
      throw error;
    }
  },

  /**
   * Check if org-level Bitbucket OAuth config exists
   */
  fetchBitbucketOAuthStatus: async (organization) => {
    try {
      const endpoint = `${APIConstants.BITBUCKET_OAUTH.CONFIG}?organization=${encodeURIComponent(
        organization
      )}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error(
        "Bitbucket API: Error fetching OAuth config status",
        error,
        organization
      );
      throw error;
    }
  },

  /**
   * Save org-level Bitbucket OAuth clientId / clientSecret
   */
  saveBitbucketOAuthConfig: async ({ organization, clientId, clientSecret }) => {
    try {
      return await APIService.post(APIConstants.BITBUCKET_OAUTH.CONFIG, {
        organization,
        clientId,
        clientSecret,
      });
    } catch (error) {
      DebugService.error("Bitbucket API: Error saving OAuth config", error, {
        organization,
      });
      throw error;
    }
  },
};

export default BitbucketApiService;
