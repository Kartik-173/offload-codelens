import { AxiosService } from './APIService';
import APIConstants from './APIConstants';
import { getUserId } from '../utils/Helpers';

class AlbMemoryApiService {
  // Initialize user ALB data (memory storage)
  static async initializeUserAlbIndex() {
    try {
      const response = await AxiosService.post(APIConstants.AWS_ALB.INITIALIZE_MEMORY, {});
      return response.data;
    } catch (error) {
      console.error('Error initializing ALB data:', error);
      throw error;
    }
  }

  // Fetch ALBs from specific regions and store in memory
  static async fetchAlbsFromRegions(regions, credentials) {
    try {
      const response = await AxiosService.post(APIConstants.AWS_ALB.FETCH_MEMORY, {
        regions,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching ALBs to memory:', error);
      throw error;
    }
  }

  // Get ALB data from memory storage
  static async getAlbData(accountId = null) {
    try {
      const url = accountId ? `${APIConstants.AWS_ALB.DATA_MEMORY}?accountId=${accountId}` : APIConstants.AWS_ALB.DATA_MEMORY;
      const response = await AxiosService.get(url);
      return response.data;
    } catch (error) {
      console.error('Error getting ALB data from memory:', error);
      throw error;
    }
  }

  // Get ALB statistics from memory storage
  static async getAlbStatistics() {
    try {
      const response = await AxiosService.get(APIConstants.AWS_ALB.STATISTICS_MEMORY);
      return response.data;
    } catch (error) {
      console.error('Error getting ALB statistics:', error);
      throw error;
    }
  }

  // Start automatic refresh (every 5 minutes)
  static async startAutoRefresh(regions, credentials) {
    try {
      const response = await AxiosService.post(APIConstants.AWS_ALB.START_AUTO_REFRESH, {
        regions,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
          userId: credentials.userId || getUserId(),
          accountId: credentials.accountId
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error starting auto-refresh:', error);
      throw error;
    }
  }

  // Stop automatic refresh
  static async stopAutoRefresh() {
    try {
      const response = await AxiosService.post(APIConstants.AWS_ALB.STOP_AUTO_REFRESH, {});
      return response.data;
    } catch (error) {
      console.error('Error stopping auto-refresh:', error);
      throw error;
    }
  }

  // Get refresh status
  static async getRefreshStatus() {
    try {
      const response = await AxiosService.get(APIConstants.AWS_ALB.REFRESH_STATUS);
      return response.data;
    } catch (error) {
      console.error('Error getting refresh status:', error);
      throw error;
    }
  }

  // Force refresh
  static async forceRefresh(regions, credentials) {
    try {
      const response = await AxiosService.post(APIConstants.AWS_ALB.FORCE_REFRESH, {
        regions,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error force refreshing:', error);
      throw error;
    }
  }

  // Delete ALB data from memory
  static async deleteAlbData(accountId = null) {
    try {
      const url = accountId ? `${APIConstants.AWS_ALB.DATA_MEMORY}?accountId=${accountId}` : APIConstants.AWS_ALB.DATA_MEMORY;
      const response = await AxiosService.delete(url);
      return response.data;
    } catch (error) {
      console.error('Error deleting ALB data from memory:', error);
      throw error;
    }
  }

  // Get global refresh statistics (admin)
  static async getGlobalRefreshStats() {
    try {
      const response = await AxiosService.get(APIConstants.AWS_ALB.GLOBAL_REFRESH_STATS);
      return response.data;
    } catch (error) {
      console.error('Error getting global refresh stats:', error);
      throw error;
    }
  }

  // Helper method to format refresh status for UI
  static formatRefreshStatus(status) {
    if (!status) return null;

    return {
      isActive: status.isActive,
      isCurrentlyRefreshing: status.isCurrentlyRefreshing,
      lastRefreshTime: status.lastRefreshTime,
      timeSinceLastRefresh: status.timeSinceLastRefresh,
      nextRefreshIn: status.nextRefreshIn,
      stats: {
        totalRefreshes: status.stats?.totalRefreshes || 0,
        successfulRefreshes: status.stats?.successfulRefreshes || 0,
        failedRefreshes: status.stats?.failedRefreshes || 0,
        lastError: status.stats?.lastError || null,
        regions: status.stats?.regions || []
      },
      // Computed properties
      successRate: status.stats?.totalRefreshes > 0 
        ? ((status.stats.successfulRefreshes / status.stats.totalRefreshes) * 100).toFixed(1)
        : 0,
      nextRefreshFormatted: status.nextRefreshIn 
        ? this.formatDuration(status.nextRefreshIn)
        : null,
      lastRefreshFormatted: status.lastRefreshTime
        ? new Date(status.lastRefreshTime).toLocaleString()
        : 'Never'
    };
  }

  // Helper method to format duration
  static formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Helper method to get refresh status color
  static getRefreshStatusColor(status) {
    if (!status) return 'default';
    
    if (status.isCurrentlyRefreshing) return 'info';
    if (status.stats?.failedRefreshes > 0) return 'error';
    if (status.isActive) return 'success';
    return 'default';
  }

  // Helper method to get refresh status text
  static getRefreshStatusText(status) {
    if (!status) return 'Unknown';
    
    if (status.isCurrentlyRefreshing) return 'Refreshing...';
    if (status.isActive) return 'Active';
    return 'Inactive';
  }
}

export default AlbMemoryApiService;
