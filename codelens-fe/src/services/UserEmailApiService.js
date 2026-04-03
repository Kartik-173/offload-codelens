import { AxiosService } from './APIService';
import APIConstants from './APIConstants';

class UserEmailApiService {
  // Get user email configuration
  static async getUserEmailConfig(accountId) {
    try {
      const response = await AxiosService.get(`${APIConstants.USER_EMAIL.GET_CONFIG}?accountId=${accountId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user email config:', error);
      throw error;
    }
  }

  // Store user email configuration
  static async storeUserEmailConfig(emailConfig) {
    try {
      const response = await AxiosService.post(APIConstants.USER_EMAIL.STORE_CONFIG, emailConfig);
      return response.data;
    } catch (error) {
      console.error('Failed to store user email config:', error);
      throw error;
    }
  }

  // Update user email configuration
  static async updateUserEmailConfig(emailConfig) {
    try {
      const response = await AxiosService.put(APIConstants.USER_EMAIL.UPDATE_CONFIG, emailConfig);
      return response.data;
    } catch (error) {
      console.error('Failed to update user email config:', error);
      throw error;
    }
  }

  // Delete user email configuration
  static async deleteUserEmailConfig(accountId) {
    try {
      const response = await AxiosService.delete(`${APIConstants.USER_EMAIL.DELETE_CONFIG}?accountId=${accountId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete user email config:', error);
      throw error;
    }
  }

  // Test user email configuration
  static async testUserEmailConfig(type = 'healthy') {
    try {
      const endpoint = type === 'healthy' ? APIConstants.HEALTH_MONITOR.TEST_HEALTHY_EMAIL : APIConstants.HEALTH_MONITOR.TEST_UNHEALTHY_EMAIL;
      const response = await AxiosService.post(endpoint, {});
      return response.data;
    } catch (error) {
      console.error(`Failed to test ${type} email:`, error);
      throw error;
    }
  }
}

export default UserEmailApiService;
