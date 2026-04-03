import APIService from './APIService';
import DebugService from './DebugService';
import APIConstants from './APIConstants';

/**
 * @description User Target Selections API Service
 */
class UserTargetSelectionsApiService {
  // Get user target selections
  static async getUserTargetSelections() {
    try {
      const result = await APIService.get(APIConstants.USER_TARGET_SELECTIONS.GET);
      
      // Handle the new response structure
      if (result && result.success && result.data) {
        return result.data;
      }
      
      // Fallback for backward compatibility
      return result;
    } catch (error) {
      DebugService.error('User Target Selections API: Error getting user target selections', error);
      
      // Enhanced error handling
      if (error.response?.data?.error) {
        const errorData = error.response.data.error;
        throw new Error(errorData.message || 'Failed to get target selections');
      }
      
      throw error;
    }
  }

  // Save user target selections
  static async saveUserTargetSelections(selections) {
    try {
      const result = await APIService.post(APIConstants.USER_TARGET_SELECTIONS.SAVE, selections);
      console.log('🔍 DEBUG: Save successful:', result);
      
      // Handle the new response structure
      if (result && result.success && result.data) {
        return result.data;
      }
      
      // Fallback for backward compatibility
      return result;
    } catch (error) {
      console.error('User Target Selections API: Error saving user target selections', error);
      DebugService.error('User Target Selections API: Error saving user target selections', error);
      
      // Enhanced error handling
      if (error.response?.data?.error) {
        const errorData = error.response.data.error;
        throw new Error(errorData.message || 'Failed to save target selections');
      }
      
      throw error;
    }
  }

  // Add target to excluded list
  static async addTargetToExcludedList(targetInfo) {
    try {
      return await APIService.post(APIConstants.USER_TARGET_SELECTIONS.EXCLUDE_TARGET, targetInfo);
    } catch (error) {
      DebugService.error('User Target Selections API: Error adding target to excluded list', error);
      throw error;
    }
  }

  // Remove target from excluded list
  static async removeTargetFromExclusionList(targetId, port) {
    try {
      return await APIService.post(APIConstants.USER_TARGET_SELECTIONS.REMOVE_EXCLUSION, {
        targetId,
        port,
      });
    } catch (error) {
      DebugService.error('User Target Selections API: Error removing target from excluded list', error);
      throw error;
    }
  }

  // Get all excluded targets for user
  static async getExcludedTargets() {
    try {
      const result = await APIService.get(APIConstants.USER_TARGET_SELECTIONS.GET_EXCLUDED_TARGETS);
      
      // Handle the new response structure
      if (result && result.success && result.data !== undefined) {
        return result.data;
      }
      
      // Fallback for backward compatibility
      return result?.data || result || [];
    } catch (error) {
      DebugService.error('User Target Selections API: Error getting excluded targets', error);
      
      // Enhanced error handling
      if (error.response?.data?.error) {
        const errorData = error.response.data.error;
        throw new Error(errorData.message || 'Failed to get excluded targets');
      }
      
      throw error;
    }
  }

  // Enhanced auto-deregister that respects exclusions
  static async autoDeregisterUnhealthyTargets(credentials) {
    try {
      const result = await APIService.post(APIConstants.USER_TARGET_SELECTIONS.AUTO_DEREGISTER, credentials);
      
      // Handle the new response structure
      if (result && result.success && result.data !== undefined) {
        return result.data;
      }
      
      // Fallback for backward compatibility
      return result;
    } catch (error) {
      DebugService.error('User Target Selections API: Error auto-deregistering unhealthy targets', error);
      
      // Enhanced error handling
      if (error.response?.data?.error) {
        const errorData = error.response.data.error;
        throw new Error(errorData.message || 'Failed to auto-deregister targets');
      }
      
      throw error;
    }
  }
}

export default UserTargetSelectionsApiService;
