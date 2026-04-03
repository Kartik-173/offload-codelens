const albFetcherService = require('../services/albFetcherService');
const albCloudWatchService = require('../services/albCloudWatchService');

// Helper function to get user ID from token
function getUserIdFromToken(token) {
  try {
    if (!token) return 'unknown';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload['cognito:username'] || 'unknown';
  } catch (e) {
    console.error('Error parsing token:', e);
    return 'unknown';
  }
}

// Fetch ALBs with real-time CloudWatch metrics (no storage)
const fetchAlbsWithRealTimeMetrics = async (req, res) => {
  try {
    // Get user ID from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    const { regions } = req.body;
    
    if (!regions || !Array.isArray(regions) || regions.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'Regions array is required',
          code: 400,
        },
      });
    }
    
    console.log(`🔄 Fetching ALBs with real-time metrics for user: ${userId}`);
    console.log(`📍 Regions: ${regions.join(', ')}`);
    console.log('🔍 Request body keys:', Object.keys(req.body));
    console.log('🔍 Request contains credentials:', !!req.body.accessKeyId && !!req.body.secretAccessKey);

    // Get credentials from request body (for fresh account switching)
    const credentials = {
      accessKeyId: req.body.accessKeyId,
      secretAccessKey: req.body.secretAccessKey,
      sessionToken: req.body.sessionToken || null,
      region: regions[0] // Use first region as default
    };

    console.log('🔑 Using credentials from request for account:', req.body.accountId || 'unknown');
    console.log('🔑 Access Key provided:', !!credentials.accessKeyId);
    console.log('🔑 Secret Key provided:', !!credentials.secretAccessKey);
    console.log('🔑 Session Token provided:', !!credentials.sessionToken);
    console.log('🔑 Force Refresh flag:', req.body._forceRefresh);
    console.log('🔑 Account Switch flag:', req.body._accountSwitch);

    // Validate credentials
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'AWS credentials (accessKeyId and secretAccessKey) are required',
          code: 400,
        },
      });
    }

    console.log('🚀 ABOUT TO CALL ALB FETCHER WITH FRESH CREDENTIALS');
    console.log('🚀 This should bypass memory storage and use fresh AWS API');

    // Always do a fresh realtime scan (no memory storage)
    console.log('🔄 REALTIME MODE: Always bypassing memory storage');
    console.log('🔄 Using direct AWS API with provided credentials');
    
    const albData = await albFetcherService.fetchAlbsFromRegions(regions, credentials);
    const albWithMetrics = await albCloudWatchService.getAlbRealTimeStatus(albData, credentials);

    console.log('✅ Fresh scan completed - returning direct AWS API data');
    console.log('✅ Account ID in response:', req.body.accountId);
    console.log('🕒 Fresh scan timestamp:', new Date().toISOString());
    
    return res.status(200).json({
      status: 'success',
      message: 'ALBs fetched with fresh AWS API scan',
      data: {
        regions: regions,
        totalAlbs: albWithMetrics.length,
        albData: albWithMetrics,
        regionResults: regions.map(region => ({
          region,
          count: albWithMetrics.filter(alb => alb.region === region).length
        })),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to fetch ALBs with real-time metrics:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to fetch ALBs with real-time metrics',
        code: 500,
      },
    });
  }
};

// Get real-time metrics for specific ALB
const getAlbRealTimeMetrics = async (req, res) => {
  try {
    // Get user ID from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    const { loadBalancerArn, region } = req.body;
    
    if (!loadBalancerArn || !region) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'LoadBalancer ARN and region are required',
          code: 400,
        },
      });
    }
    
    console.log(`📊 Getting real-time metrics for ALB: ${loadBalancerArn}`);

    // Get credentials from request
    const credentials = {
      accessKeyId: req.body.accessKeyId,
      secretAccessKey: req.body.secretAccessKey,
      region: region
    };

    // Get real-time metrics
    const metrics = await albCloudWatchService.getAlbMetrics(loadBalancerArn, region, credentials);

    res.status(200).json({
      status: 'success',
      message: 'Real-time metrics retrieved successfully',
      data: metrics
    });
  } catch (error) {
    console.error('Failed to get real-time metrics:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to get real-time metrics',
        code: 500,
      },
    });
  }
};

// Get target group health status
const getTargetGroupHealth = async (req, res) => {
  try {
    // Get user ID from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    const { targetGroupArn, region } = req.body;
    
    if (!targetGroupArn || !region) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'TargetGroup ARN and region are required',
          code: 400,
        },
      });
    }
    
    console.log(`🏥 Getting target group health for: ${targetGroupArn}`);

    // Get credentials from request
    const credentials = {
      accessKeyId: req.body.accessKeyId,
      secretAccessKey: req.body.secretAccessKey,
      region: region
    };

    // Get target group health
    const health = await albCloudWatchService.getTargetGroupHealth(targetGroupArn, region, credentials);

    res.status(200).json({
      status: 'success',
      message: 'Target group health retrieved successfully',
      data: health
    });
  } catch (error) {
    console.error('Failed to get target group health:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to get target group health',
        code: 500,
      },
    });
  }
};

// Get ALB access logs
const getAlbAccessLogs = async (req, res) => {
  try {
    // Get user ID from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    const { loadBalancerArn, region, startTime, endTime } = req.body;
    
    if (!loadBalancerArn || !region) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'LoadBalancer ARN and region are required',
          code: 400,
        },
      });
    }
    
    console.log(`📋 Getting access logs for ALB: ${loadBalancerArn}`);

    // Get credentials from request
    const credentials = {
      accessKeyId: req.body.accessKeyId,
      secretAccessKey: req.body.secretAccessKey,
      region: region
    };

    // Get access logs
    const logs = await albCloudWatchService.getAlbLogs(loadBalancerArn, region, credentials, startTime, endTime);

    res.status(200).json({
      status: 'success',
      message: 'Access logs retrieved successfully',
      data: logs
    });
  } catch (error) {
    console.error('Failed to get access logs:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to get access logs',
        code: 500,
      },
    });
  }
};

// Get comprehensive ALB dashboard data
const getAlbDashboard = async (req, res) => {
  try {
    // Get user ID from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    const { regions, includeLogs = false, timeRange = '1h' } = req.body;
    
    if (!regions || !Array.isArray(regions) || regions.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'Regions array is required',
          code: 400,
        },
      });
    }
    
    console.log(`📊 Getting ALB dashboard for user: ${userId}`);

    // Fetch ALBs from specified regions
    const albData = await albFetcherService.fetchAlbsFromRegions(regions);
    
    // Get credentials from request
    const credentials = {
      accessKeyId: req.body.accessKeyId,
      secretAccessKey: req.body.secretAccessKey,
      region: regions[0]
    };

    // Calculate time range
    const endTime = Date.now();
    const startTime = endTime - getTimeRangeMs(timeRange);

    // Get real-time data for all ALBs
    const dashboardData = await Promise.allSettled(
      albData.map(async (alb) => {
        const [metrics, targetHealth] = await Promise.allSettled([
          albCloudWatchService.getAlbMetrics(alb.loadBalancerArn, alb.region, credentials),
          Promise.allSettled(
            alb.targetGroups.map(tg => 
              albCloudWatchService.getTargetGroupHealth(tg.targetGroupArn, alb.region, credentials)
            )
          )
        ]);

        const result = {
          ...alb,
          realTimeMetrics: metrics.status === 'fulfilled' ? metrics.value : null,
          targetGroupHealth: targetHealth.status === 'fulfilled' 
            ? targetHealth.value.filter(r => r.status === 'fulfilled').map(r => r.value)
            : [],
          timestamp: new Date().toISOString()
        };

        // Add logs if requested
        if (includeLogs) {
          try {
            result.accessLogs = await albCloudWatchService.getAlbLogs(
              alb.loadBalancerArn, 
              alb.region, 
              credentials, 
              startTime, 
              endTime
            );
          } catch (logError) {
            console.warn(`Failed to get logs for ${alb.loadBalancerArn}:`, logError);
            result.accessLogs = null;
          }
        }

        return result;
      })
    );

    const successfulResults = dashboardData
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    // Calculate overall statistics
    const statistics = calculateDashboardStatistics(successfulResults);

    res.status(200).json({
      status: 'success',
      message: 'ALB dashboard data retrieved successfully',
      data: {
        regions: regions,
        totalAlbs: successfulResults.length,
        albData: successfulResults,
        statistics: statistics,
        regionResults: regions.map(region => ({
          region,
          count: successfulResults.filter(alb => alb.region === region).length
        })),
        timestamp: new Date().toISOString(),
        timeRange: timeRange
      }
    });
  } catch (error) {
    console.error('Failed to get ALB dashboard:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to get ALB dashboard',
        code: 500,
      },
    });
  }
};

// Helper method to convert time range to milliseconds
function getTimeRangeMs(timeRange) {
  const ranges = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };
  return ranges[timeRange] || ranges['1h'];
}

// Helper method to calculate dashboard statistics
function calculateDashboardStatistics(albData) {
  const stats = {
    totalAlbs: albData.length,
    healthyAlbs: 0,
    unhealthyAlbs: 0,
    totalTargetGroups: 0,
    totalTargets: 0,
    healthyTargets: 0,
    unhealthyTargets: 0,
    totalRequests: 0,
    totalErrors: 0,
    averageLatency: 0,
    regions: {}
  };

  albData.forEach(alb => {
    // Count by region
    stats.regions[alb.region] = (stats.regions[alb.region] || 0) + 1;

    // Process metrics
    if (alb.realTimeMetrics && alb.realTimeMetrics.metrics) {
      const metrics = alb.realTimeMetrics.metrics;
      stats.totalRequests += metrics.requestCount?.sum || 0;
      stats.totalErrors += (metrics.clientErrors?.sum || 0) + (metrics.serverErrors?.sum || 0);
      
      if (metrics.latency && metrics.latency.average) {
        stats.averageLatency += metrics.latency.average;
      }
    }

    // Process target group health
    alb.targetGroupHealth.forEach(tg => {
      stats.totalTargetGroups++;
      stats.totalTargets += tg.summary.total;
      stats.healthyTargets += tg.summary.healthy;
      stats.unhealthyTargets += tg.summary.unhealthy;
    });

    // Determine ALB health based on target groups
    const albHealthy = alb.targetGroupHealth.every(tg => 
      tg.summary.unhealthy === 0 && tg.summary.total > 0
    );
    
    if (albHealthy) {
      stats.healthyAlbs++;
    } else {
      stats.unhealthyAlbs++;
    }
  });

  // Calculate average latency
  if (stats.totalAlbs > 0) {
    stats.averageLatency = stats.averageLatency / stats.totalAlbs;
  }

  return stats;
}

module.exports = {
  fetchAlbsWithRealTimeMetrics,
  getAlbRealTimeMetrics,
  getTargetGroupHealth,
  getAlbAccessLogs,
  getAlbDashboard,
};
