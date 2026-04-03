import APIConstants from "./APIConstants";
import APIService, { AxiosService } from "./APIService";
import DebugService from "./DebugService";

/**
 * @description GitHub Accounts API Service
 */
const GithubApiService = {
  /**
   * Build the GitHub OAuth login URL based on the current environment baseURL
   */
  getGithubAuthUrl: () => `${AxiosService.defaults.baseURL}/api/auth/github`,

  /**
   * Fetch all GitHub accounts for a user
   * @param {number} userId
   */
  fetchAllAccounts: async (userId) => {
    try {
      const endpoint = `${APIConstants.CREDENTIALS.GET_GITHUB_LIST}/${userId}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error("GitHub API: Error fetching accounts", error, userId);
      throw error;
    }
  },

  /**
   * Store new GitHub account credentials
   * @param {Object} payload
   * @param {string|number} payload.userId
   * @param {string} payload.githubUsername
   * @param {string} payload.token
   */
  addAccount: async (payload) => {
    try {
      return await APIService.post(APIConstants.CREDENTIALS.STORE_GITHUB, payload);
    } catch (error) {
      DebugService.error("GitHub API: Error storing account", error, payload);
      throw error;
    }
  },

  /**
   * Logout GitHub account (revoke token + delete from DB)
   * @param {string} githubUsername
   */
  logoutGithub: async (githubUsername) => {
    try {
      return await APIService.post(APIConstants.AUTH.GITHUB_LOGOUT, {
        github_username: githubUsername,
      });
    } catch (error) {
      DebugService.error("GitHub API: Error logging out", error, githubUsername);
      throw error;
    }
  },

  /**
   * Check if org-level GitHub OAuth config exists
   */
  fetchGithubOAuthStatus: async (organization) => {
    try {
      const endpoint = `${APIConstants.GITHUB_OAUTH.CONFIG}?organization=${encodeURIComponent(
        organization
      )}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error('GitHub API: Error fetching OAuth config status', error, organization);
      throw error;
    }
  },

  /**
   * Save org-level GitHub OAuth clientId / clientSecret
   */
  saveGithubOAuthConfig: async ({ organization, clientId, clientSecret }) => {
    try {
      return await APIService.post(APIConstants.GITHUB_OAUTH.CONFIG, {
        organization,
        clientId,
        clientSecret,
      });
    } catch (error) {
      DebugService.error('GitHub API: Error saving OAuth config', error, {
        organization,
      });
      throw error;
    }
  },
};

export default GithubApiService;
