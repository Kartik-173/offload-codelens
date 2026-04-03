const albCloudWatchService = require('../services/albCloudWatchService');
const memoryStorageService = require('../services/memoryStorageService');
const albAutoRefreshService = require('../services/albAutoRefreshService');
const albFetcherService = require('../services/albFetcherService');

// Helper function to get user ID from token
function getUserIdFromToken(token) {
  try {
    if (!token) {
      console.log('No token provided');
      return 'unknown';
    }
    
    // Remove "Bearer " prefix if present
    const cleanToken = token.replace(/^Bearer\s+/, '');
    
    if (!cleanToken || cleanToken === 'undefined' || cleanToken === 'null') {
      console.log('Invalid token format');
      return 'unknown';
    }
    
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      console.log('Token does not have 3 parts');
      return 'unknown';
    }
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || payload['cognito:username'] || 'unknown';
  } catch (e) {
    console.error('Error parsing token:', e.message);
    return 'unknown';
  }
}

// Fetch ALBs with real-time CloudWatch metrics and store in memory
const fetchAlbsFromRegions = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    const { regions, credentials } = req.body;
    
    if (!regions || !Array.isArray(regions) || regions.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'Regions array is required',
          code: 400,
        },
      });
    }
    
    if (!credentials || !credentials.accessKeyId || !credentials.secretAccessKey) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'AWS credentials are required',
          code: 400,
        },
      });
    }
    
    console.log(`🔄 Fetching ALBs with real-time metrics for user: ${userId}`);
    console.log(`📍 Regions: ${regions.join(', ')}`);

    // Fetch ALBs from specified regions
    const albData = await albFetcherService.fetchAlbsFromRegions(regions);
    
    // Get real-time CloudWatch metrics for all ALBs
    const albWithMetrics = await albCloudWatchService.getAlbRealTimeStatus(albData, credentials);

    // Store in memory storage
    const storeResult = memoryStorageService.storeAlbData(userId, albWithMetrics);

    res.status(200).json({
      status: 'success',
      message: 'ALBs fetched and stored in memory',
      data: {
        regions,
        totalAlbs: albWithMetrics.length,
        stored: storeResult.stored,
        albData: albWithMetrics,
        regionResults: regions.map(region => ({
          region,
          count: albWithMetrics.filter(alb => alb.region === region).length
        })),
        storage: memoryStorageService.getMemoryUsage()
      }
    });
  } catch (error) {
    console.error('Failed to fetch ALBs:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to fetch ALBs',
        code: 500,
      },
    });
  }
};

// Get ALB data from memory storage
const getAlbData = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    const { accountId } = req.query; // Get account ID from query params
    
    console.log(`📖 Retrieving ALB data for user: ${userId}, account: ${accountId || 'default'}`);
    
    let result;
    if (accountId) {
      // Try to get account-specific data first
      const accountKey = `alb_data_${accountId}`;
      console.log(`🔍 Looking for account-specific data with key: ${accountKey}`);
      const accountResult = memoryStorageService.retrieve(userId, accountKey);
      
      if (accountResult.success && accountResult.data) {
        console.log(`✅ Found account-specific data for account: ${accountId}`);
        result = {
          success: true,
          data: accountResult.data.albData || []
        };
      } else {
        console.log(`⚠️ No account-specific data found for account: ${accountId}, falling back to default`);
        result = memoryStorageService.getAlbData(userId);
      }
    } else {
      // Default behavior - get general ALB data
      result = memoryStorageService.getAlbData(userId);
    }
    
    if (result.success) {
      res.status(200).json({
        status: 'success',
        message: 'ALB data retrieved successfully',
        data: {
          albData: result.data,
          metadata: memoryStorageService.retrieve(userId, 'alb-metadata').data,
          storage: memoryStorageService.getMemoryUsage(),
          dataAge: memoryStorageService.getDataAge(userId, accountId ? `alb_data_${accountId}` : 'alb'),
          accountId: accountId || null
        }
      });
    } else {
      res.status(404).json({
        status: 'error',
        error: {
          message: 'No ALB data found for user',
          code: 404,
        },
      });
    }
  } catch (error) {
    console.error('Failed to get ALB data:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to get ALB data',
        code: 500,
      },
    });
  }
};

// Get ALB statistics from memory storage
const getAlbStatistics = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    console.log(`📊 Getting ALB statistics for user: ${userId}`);
    
    const stats = memoryStorageService.getStatistics(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'ALB statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Failed to get ALB statistics:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to get ALB statistics',
        code: 500,
      },
    });
  }
};

// Start auto-refresh for ALB data
const startAutoRefresh = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    const { regions, credentials } = req.body;
    
    if (!credentials || !credentials.accessKeyId || !credentials.secretAccessKey) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'AWS credentials are required',
          code: 400,
        },
      });
    }
    
    console.log(`🔄 Starting auto-refresh for user: ${userId}`);
    
    const result = albAutoRefreshService.startAutoRefresh(userId, credentials, regions);
    
    res.status(200).json({
      status: 'success',
      message: 'Auto-refresh started successfully',
      data: result
    });
  } catch (error) {
    console.error('Failed to start auto-refresh:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to start auto-refresh',
        code: 500,
      },
    });
  }
};

// Stop auto-refresh for ALB data
const stopAutoRefresh = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    console.log(`⏹️ Stopping auto-refresh for user: ${userId}`);
    
    const result = albAutoRefreshService.stopAutoRefresh(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'Auto-refresh stopped successfully',
      data: result
    });
  } catch (error) {
    console.error('Failed to stop auto-refresh:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to stop auto-refresh',
        code: 500,
      },
    });
  }
};

// Get auto-refresh status
const getRefreshStatus = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    console.log(`📊 Getting refresh status for user: ${userId}`);
    
    const status = albAutoRefreshService.getRefreshStatus(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'Refresh status retrieved successfully',
      data: status
    });
  } catch (error) {
    console.error('Failed to get refresh status:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to get refresh status',
        code: 500,
      },
    });
  }
};

// Force refresh ALB data
const forceRefresh = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    const { regions, credentials } = req.body;
    
    if (!credentials || !credentials.accessKeyId || !credentials.secretAccessKey) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'AWS credentials are required',
          code: 400,
        },
      });
    }
    
    console.log(`🔄 Force refreshing ALB data for user: ${userId}`);
    
    // Perform the refresh
    await albAutoRefreshService.forceRefresh(userId, credentials, regions);
    
    // Get the updated data
    const result = memoryStorageService.getAlbData(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'Force refresh completed successfully',
      data: {
        albData: result.data || [],
        stored: result.success ? result.data.length : 0,
        refreshStatus: albAutoRefreshService.getRefreshStatus(userId)
      }
    });
  } catch (error) {
    console.error('Failed to force refresh:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to force refresh',
        code: 500,
      },
    });
  }
};

// Delete ALB data from memory storage
const deleteAlbData = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    const { accountId } = req.query; // Get account ID from query params
    
    console.log(`🗑️ Deleting ALB data for user: ${userId}, account: ${accountId || 'all'}`);
    
    // Stop auto-refresh first
    albAutoRefreshService.stopAutoRefresh(userId);
    
    let result;
    if (accountId) {
      // Delete account-specific data
      const accountKey = `alb_data_${accountId}`;
      console.log(`🗑️ Deleting account-specific data with key: ${accountKey}`);
      memoryStorageService.deleteData(userId, accountKey);
      result = { deleted: true, accountId };
    } else {
      // Delete all ALB data (default behavior)
      result = memoryStorageService.deleteUserDataByType(userId, 'alb');
      memoryStorageService.deleteUserDataByType(userId, 'alb-metadata');
    }
    
    res.status(200).json({
      status: 'success',
      message: 'ALB data deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('Failed to delete ALB data:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to delete ALB data',
        code: 500,
      },
    });
  }
};

// Get global auto-refresh statistics (admin endpoint)
const getGlobalRefreshStats = async (req, res) => {
  try {
    console.log(`📊 Getting global refresh statistics`);
    
    const stats = albAutoRefreshService.getGlobalStats();
    
    res.status(200).json({
      status: 'success',
      message: 'Global refresh statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Failed to get global refresh stats:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to get global refresh stats',
        code: 500,
      },
    });
  }
};

// Initialize user ALB data (no longer needed with memory storage)
const initializeUserAlbIndex = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    console.log(`🚀 Initializing ALB data for user: ${userId} (memory storage)`);
    
    // With memory storage, no initialization is needed
    res.status(200).json({
      status: 'success',
      message: 'ALB data initialized (memory storage ready)',
      data: {
        userId,
        storageType: 'memory',
        initialized: true
      }
    });
  } catch (error) {
    console.error('Failed to initialize ALB data:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to initialize ALB data',
        code: 500,
      },
    });
  }
};

module.exports = {
  fetchAlbsFromRegions,
  getAlbData,
  getAlbStatistics,
  startAutoRefresh,
  stopAutoRefresh,
  getRefreshStatus,
  forceRefresh,
  deleteAlbData,
  getGlobalRefreshStats,
  initializeUserAlbIndex,
};
