import APIService from "./APIService";
import APIConstants from "./APIConstants";
import DebugService from "./DebugService";
import axios from "axios";

/**
 * @description Chat API Service for handling all chat-related API calls
 */
const ChatApiService = {
  /**
   * Submit Terraform job to n8n
   * @param {Object} payload - Job submission data
   * @param {Array} payload.message_history - Chat message history
   * @param {string} payload.username - Username
   * @param {string} payload.cloud_provider - Cloud provider (e.g., "aws")
   * @param {string} payload.vcs_provider - VCS provider (e.g., "github")
   * @param {string} payload.mode - Mode ("create" or "reply")
   * @returns {Object} Response from n8n job submission
   */
  submitTerraformJob: async (payload) => {
    try {
      const response = await APIService.post(APIConstants.CHAT.N8N_SUBMIT_JOB, payload);
      return response;
    } catch (error) {
      DebugService.error("Chat API Service: Error submitting Terraform job", error);
      throw error;
    }
  },

  /**
   * Send chat message to Ollama
   * @param {Object} payload - Chat data
   * @param {string} payload.prompt - User prompt
   * @returns {Object} Response from Ollama chat
   */
  sendChatMessage: async (payload) => {
    try {
      const response = await APIService.post(APIConstants.CHAT.OLLAMA_CHAT, payload);
      return response;
    } catch (error) {
      DebugService.error("Chat API Service: Error sending chat message", error);
      throw error;
    }
  },

  /**
   * Generate chat title using n8n webhook
   * @param {Object} payload - Title generation data
   * @param {string} payload.chatId - Chat ID
   * @param {string} payload.latestAssistantMessage - Combined message for title generation
   * @returns {Object} Response with generated title
   */
  generateChatTitle: async (payload) => {
    try {
      // This endpoint is external (n8n.cloudsanalytics.ai), so we use direct axios
      const response = await axios.post(APIConstants.CHAT.GENERATE_TITLE, payload);
      return response.data;
    } catch (error) {
      DebugService.error("Chat API Service: Error generating chat title", error);
      throw error;
    }
  },

  /**
   * Push files to GitHub using n8n webhook
   * @param {Object} payload - GitHub push data
   * @param {string} payload.github_username - GitHub username
   * @param {string} payload.repo - Repository name
   * @param {string} payload.description - Commit description
   * @param {string} payload.branch - Branch name
   * @param {string} payload.visibility - Repository visibility
   * @param {Array} payload.edited_files - Files to push
   * @returns {Object} Response from GitHub push
   */
  pushToGitHub: async (payload) => {
    try {
      // This endpoint is external (n8n.cloudsanalytics.ai), so we use direct axios
      const response = await axios.post(APIConstants.CHAT.GITHUB_PUSH, payload);
      return response.data;
    } catch (error) {
      DebugService.error("Chat API Service: Error pushing to GitHub", error);
      throw error;
    }
  },

  /**
   * Deploy to AWS using Terraform
   * @param {Object} payload - AWS deployment data
   * @param {string} payload.userId - User ID
   * @param {string} payload.userAccountId - User account ID
   * @param {string} payload.repoUrl - Repository URL
   * @param {string} payload.github_username - GitHub username
   * @returns {Object} Response from AWS deployment
   */
  deployToAWS: async (payload) => {
    try {
      const response = await APIService.post(APIConstants.CHAT.AWS_DEPLOY, payload);
      return response;
    } catch (error) {
      DebugService.error("Chat API Service: Error deploying to AWS", error);
      throw error;
    }
  },
};

export default ChatApiService;
