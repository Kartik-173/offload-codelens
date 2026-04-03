import APIConstants from "./APIConstants";
import APIService from "./APIService";
import DebugService from "./DebugService";

/**
 * @description AWS ALB API Service
 * Handles all AWS Application Load Balancer operations
 */
const AwsAlbApiService = {
  /**
   * Get all ALBs with their target groups from all AWS regions
   * @param {Object} credentials - AWS credentials object
   * @param {string} credentials.accessKeyId - AWS access key ID
   * @param {string} credentials.secretAccessKey - AWS secret access key
   * @param {string} credentials.region - AWS region (optional, will search all regions if not provided)
   * @param {string} credentials.accountId - AWS account ID
   * @returns {Promise<Object>} - ALBs and target groups data
   */
  getAlbs: async (credentials) => {
    try {
      return await APIService.post(APIConstants.AWS_ALB.GET_ALBS, credentials);
    } catch (error) {
      DebugService.error("AWS ALB API: Error fetching ALBs", error, credentials);
      throw error;
    }
  },

  /**
   * Deregister a target from a target group
   * @param {Object} data - Deregistration data
   * @param {string} data.accessKeyId - AWS access key ID
   * @param {string} data.secretAccessKey - AWS secret access key
   * @param {string} data.region - AWS region
   * @param {string} data.targetGroupArn - Target group ARN
   * @param {string} data.targetId - Target ID (IP address or instance ID)
   * @param {string} data.targetPort - Target port
   * @returns {Promise<Object>} - Deregistration result
   */
  deregisterTarget: async (data) => {
    try {
      console.log('🔍 DEBUG: AwsAlbApiService - sending data:', data);
      return await APIService.post(APIConstants.AWS_ALB.DEREGISTER_TARGET, data);
    } catch (error) {
      DebugService.error("AWS ALB API: Error deregistering target", error, data);
      throw error;
    }
  },

  /**
   * Get detailed unhealthy target information
   * @param {Object} data - Request data
   * @param {string} data.accessKeyId - AWS access key ID
   * @param {string} data.secretAccessKey - AWS secret access key
   * @param {string} data.region - AWS region
   * @param {string} data.targetGroupArn - Target group ARN
   * @returns {Promise<Object>} - Detailed unhealthy target information
   */
  getUnhealthyTargetDetails: async (data) => {
    try {
      return await APIService.post(APIConstants.AWS_ALB.GET_UNHEALTHY_DETAILS, data);
    } catch (error) {
      DebugService.error("AWS ALB API: Error getting unhealthy target details", error, data);
      throw error;
    }
  },

  /**
   * Terminate an EC2 instance
   * @param {Object} data - Termination data
   * @param {string} data.accessKeyId - AWS access key ID
   * @param {string} data.secretAccessKey - AWS secret access key
   * @param {string} data.region - AWS region
   * @param {string} data.instanceId - EC2 instance ID
   * @returns {Promise<Object>} - Termination result
   */
  terminateInstance: async (data) => {
    try {
      return await APIService.post(APIConstants.AWS_ALB.TERMINATE_INSTANCE, data);
    } catch (error) {
      DebugService.error("AWS ALB API: Error terminating instance", error, data);
      throw error;
    }
  },
};

export default AwsAlbApiService;
