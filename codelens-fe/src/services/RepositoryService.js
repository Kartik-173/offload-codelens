import APIConstants from "./APIConstants";
import APIService from "./APIService";
import DebugService from "./DebugService";

/**
 * @description Repository Service for fetching repos and branches from GitHub/Bitbucket
 */
const RepositoryService = {
  /**
   * Fetch repositories from GitHub or Bitbucket
   * @param {string} usernameKey - Username key for the provider
   * @param {"github"|"bitbucket"} provider - Provider name
   * @returns {Array} Array of repositories
   */
  fetchRepos: async (usernameKey, provider) => {
    try {
      let endpoint;
      
      if (provider === "github") {
        endpoint = `${APIConstants.REPOSITORY.REPOS}/${usernameKey}`;
      } else if (provider === "bitbucket") {
        endpoint = `${APIConstants.REPOSITORY.BITBUCKET_REPOS}/${usernameKey}`;
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      const response = await APIService.get(endpoint);
      
      // Check for error in response data
      if (response?.error) {
        const { code, title, detail, message } = response.error;

        // If backend reports missing creds (NOT_FOUND), clear local cache
        if (code === 404) {
          if (provider === 'github') {
            localStorage.removeItem('github_username');
            localStorage.removeItem('github_avatar_url');
          } else if (provider === 'bitbucket') {
            localStorage.removeItem('bitbucket_username');
            localStorage.removeItem('bitbucket_avatar_url');
            localStorage.removeItem('bitbucket_display_name');
          }
        }

        const err = new Error(detail || message || `Failed to fetch ${provider} repositories`);
        err.code = code;
        err.title = title;
        throw err;
      }

      return response || [];
    } catch (error) {
      // Handle HTTP errors (e.g. 404) where Axios throws instead of returning response.error
      const backendError = error?.response?.data?.error;
      if (backendError) {
        const { code, title, detail, message } = backendError;

        if (code === 404) {
          if (provider === 'github') {
            localStorage.removeItem('github_username');
            localStorage.removeItem('github_avatar_url');
          } else if (provider === 'bitbucket') {
            localStorage.removeItem('bitbucket_username');
            localStorage.removeItem('bitbucket_avatar_url');
            localStorage.removeItem('bitbucket_display_name');
          }

          const err = new Error(detail || message || `Please connect your ${provider} account first.`);
          err.code = code;
          err.title = title;
          throw err;
        }
      }

      console.error(`❌ Failed to fetch ${provider} repositories:`, error);
      throw error;
    }
  },

  /**
   * Fetch branches from GitHub or Bitbucket
   * @param {string} repo - Full repository name (owner/repo for GitHub, workspace/slug for Bitbucket)
   * @param {"github"|"bitbucket"} provider - Provider name
   * @param {string} usernameKey - Username key for the provider
   * @returns {Array} Array of branches
   */
  fetchBranches: async (repo, provider, usernameKey) => {
    if (!repo || !usernameKey) return [];

    try {
      let endpoint;
      let response;
      
      if (provider === "github") {
        const [repoOwner, repoName] = repo.split("/");
        endpoint = `${APIConstants.REPOSITORY.BRANCHES}/${usernameKey}/${repoOwner}/${repoName}`;
        response = await APIService.get(endpoint);
      } else if (provider === "bitbucket") {
        const [workspace, repoSlug] = repo.split("/");
        endpoint = `${APIConstants.REPOSITORY.BITBUCKET_BRANCHES}/${usernameKey}/${workspace}/${repoSlug}`;
        response = await APIService.post(endpoint);
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      
      // Check for error in response data
      if (response?.error) {
        const { code, title, detail, message } = response.error;

        // If backend reports missing creds (NOT_FOUND), clear local cache
        if (code === 404) {
          if (provider === 'github') {
            localStorage.removeItem('github_username');
            localStorage.removeItem('github_avatar_url');
          } else if (provider === 'bitbucket') {
            localStorage.removeItem('bitbucket_username');
            localStorage.removeItem('bitbucket_avatar_url');
            localStorage.removeItem('bitbucket_display_name');
          }
        }

        const err = new Error(detail || message || `Failed to fetch ${provider} branches`);
        err.code = code;
        err.title = title;
        throw err;
      }

      return response || [];
    } catch (error) {
      // Handle HTTP errors (e.g. 404) where Axios throws instead of returning response.error
      const backendError = error?.response?.data?.error;
      if (backendError) {
        const { code, title, detail, message } = backendError;

        if (code === 404) {
          if (provider === 'github') {
            localStorage.removeItem('github_username');
            localStorage.removeItem('github_avatar_url');
          } else if (provider === 'bitbucket') {
            localStorage.removeItem('bitbucket_username');
            localStorage.removeItem('bitbucket_avatar_url');
            localStorage.removeItem('bitbucket_display_name');
          }

          const err = new Error(detail || message || `Please connect your ${provider} account first.`);
          err.code = code;
          err.title = title;
          throw err;
        }
      }

      console.error(`❌ Failed to fetch ${provider} branches:`, error);
      throw error;
    }
  },
};

export default RepositoryService;
