const albCloudWatchService = require('./albCloudWatchService');
const memoryStorageService = require('./memoryStorageService');
const albFetcherService = require('./albFetcherService');
const UserTargetSelections = require('../models/userTargetSelections');
const AlbAccountSettings = require('../models/albAccountSettings');

/**
 * ALB Auto-Refresh Service
 * Automatically fetches ALB data every 5 minutes using CloudWatch
 * Stores data in memory instead of OpenSearch
 */

class AlbAutoRefreshService {
  constructor() {
    this.refreshIntervals = new Map(); // userId -> interval
    this.refreshIntervalMs = 5 * 60 * 1000; // 5 minutes
    this.isRefreshing = new Map(); // userId -> boolean
    this.lastRefreshTime = new Map(); // userId -> timestamp
    this.refreshStats = new Map(); // userId -> stats
    this.userCredentials = new Map(); // userId -> credentials for auto actions
  }

  /**
   * Start auto-refresh for a user
   */
  startAutoRefresh(userId, credentials, regions = ['us-east-1']) {
    // Stop existing refresh if any
    this.stopAutoRefresh(userId);

    console.log(`🔄 Starting auto-refresh for user ${userId} every 5 minutes`);
    
    // Store user credentials for auto actions
    this.userCredentials.set(userId, credentials);
    
    // Store user configuration
    this.refreshStats.set(userId, {
      startTime: new Date().toISOString(),
      totalRefreshes: 0,
      successfulRefreshes: 0,
      failedRefreshes: 0,
      lastError: null,
      regions: regions
    });

    // Initial refresh
    this.performRefresh(userId, credentials, regions);

    // Set up recurring refresh
    const interval = setInterval(() => {
      this.performRefresh(userId, credentials, regions);
    }, this.refreshIntervalMs);

    this.refreshIntervals.set(userId, interval);
    
    return {
      success: true,
      message: 'Auto-refresh started',
      interval: this.refreshIntervalMs,
      regions: regions
    };
  }

  /**
   * Stop auto-refresh for a user
   */
  stopAutoRefresh(userId) {
    const interval = this.refreshIntervals.get(userId);
    
    if (interval) {
      clearInterval(interval);
      this.refreshIntervals.delete(userId);
      this.isRefreshing.delete(userId);
      this.userCredentials.delete(userId);
      
      console.log(`⏹️ Stopped auto-refresh for user ${userId}`);
      
      return {
        success: true,
        message: 'Auto-refresh stopped'
      };
    }
    
    return {
      success: false,
      message: 'No active auto-refresh found'
    };
  }

  /**
   * Perform a single refresh operation
   */
  async performRefresh(userId, credentials, regions) {
    if (this.isRefreshing.get(userId)) {
      console.log(`⏳ Refresh already in progress for user ${userId}`);
      return;
    }

    this.isRefreshing.set(userId, true);
    
    try {
      console.log(`🔄 Auto-refreshing ALB data for user ${userId} from regions: ${regions.join(', ')}`);
      
      // Fetch ALBs from specified regions
      const albData = await albFetcherService.fetchAlbsFromRegions(regions);
      
      // Get real-time CloudWatch data for all ALBs
      const albWithMetrics = await albCloudWatchService.getAlbRealTimeStatus(albData, credentials);
      
      // Store in memory
      memoryStorageService.storeAlbData(userId, albWithMetrics);
      
      // Update stats
      const stats = this.refreshStats.get(userId);
      stats.totalRefreshes++;
      stats.successfulRefreshes++;
      stats.lastRefreshTime = new Date().toISOString();
      this.refreshStats.set(userId, stats);
      
      this.lastRefreshTime.set(userId, Date.now());
      
      console.log(`✅ Auto-refresh completed for user ${userId}: ${albWithMetrics.length} ALBs fetched and stored`);

    } catch (error) {
      console.error(`❌ Auto-refresh failed for user ${userId}:`, error);
      
      // Update error stats
      const stats = this.refreshStats.get(userId);
      if (stats) {
        stats.totalRefreshes++;
        stats.failedRefreshes++;
        stats.lastError = {
          message: error.message,
          timestamp: new Date().toISOString()
        };
        this.refreshStats.set(userId, stats);
      }
    } finally {
      this.isRefreshing.set(userId, false);
    }
  }

  /**
   * Perform auto-deregistration for unhealthy targets
   */
  async performAutoDeregister(userId, credentials, regions) {
    try {
      console.log(`🔄 Performing auto-deregistration for user ${userId}`);
      
      // Check if auto-deregister is enabled for this account
      const accountSettings = await AlbAccountSettings.getByAccountId(credentials.accountId);
      if (!accountSettings?.autoDeregisterEnabled) {
        console.log(`⏸️ Auto-deregister is disabled for account ${credentials.accountId}`);
        return { skipped: true, reason: 'Auto-deregister disabled' };
      }

      // Get user's excluded targets AND selected targets
      console.log(`🔍 Loading user target selections for user ${userId}`);
      const excludedTargets = await UserTargetSelections.getExcludedTargets(userId);
      const selectedTargets = await UserTargetSelections.getByUserId(userId);
      const selectedTargetList = selectedTargets?.selectedTargets || [];
      
      console.log(`📊 Target selections loaded:`, {
        excludedTargetsCount: excludedTargets?.length || 0,
        selectedTargetsCount: selectedTargetList?.length || 0,
        excludedTargets: excludedTargets,
        selectedTargets: selectedTargetList
      });
      
      // Combine both excluded and selected targets for protection
      const excludedTargetKeys = new Set(
        excludedTargets.map(target => `${target.targetId}-${target.port}`)
      );
      const selectedTargetKeys = new Set(
        selectedTargetList.map(target => `${target.targetId}-${target.port}`)
      );
      
      // All protected targets = excluded OR selected
      const protectedTargetKeys = new Set([...excludedTargetKeys, ...selectedTargetKeys]);
      
      console.log(`🛡️ Protected targets computed:`, {
        excludedTargetKeys: Array.from(excludedTargetKeys),
        selectedTargetKeys: Array.from(selectedTargetKeys),
        totalProtected: protectedTargetKeys.size,
        protectedTargetKeys: Array.from(protectedTargetKeys)
      });

      // Import AWS SDK
      const { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeTargetHealthCommand, DeregisterTargetsCommand } = require('@aws-sdk/client-elastic-load-balancing-v2');

      const client = new ElasticLoadBalancingV2Client({
        region: regions[0] || 'us-east-1',
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          ...(credentials.sessionToken && { sessionToken: credentials.sessionToken }),
        },
      });

      // Get all load balancers
      const describeAlbsCommand = new DescribeLoadBalancersCommand({});
      const albsResponse = await client.send(describeAlbsCommand);
      const loadBalancers = albsResponse.LoadBalancers || [];

      let totalUnhealthy = 0;
      let totalDeregistered = 0;
      let totalExcluded = 0;
      const deregistrationResults = [];

      // Check each load balancer's target groups
      for (const alb of loadBalancers) {
        try {
          // Get target groups for this load balancer
          const describeTargetGroupsCommand = new DescribeTargetGroupsCommand({
            LoadBalancerArn: alb.LoadBalancerArn,
          });
          
          const targetGroupsResponse = await client.send(describeTargetGroupsCommand);
          const targetGroups = targetGroupsResponse.TargetGroups || [];

          // Check each target group's health
          for (const tg of targetGroups) {
            try {
              const targetHealthCommand = new DescribeTargetHealthCommand({
                TargetGroupArn: tg.TargetGroupArn,
              });
              
              const targetHealthResponse = await client.send(targetHealthCommand);
              const targets = targetHealthResponse.TargetHealthDescriptions || [];

              // Find unhealthy targets
              const unhealthyTargets = targets.filter(t => t.TargetHealth?.State === 'unhealthy');
              totalUnhealthy += unhealthyTargets.length;

              // Process each unhealthy target
              for (const target of unhealthyTargets) {
                const targetId = target.Target?.Id;
                const port = target.Target?.Port;
                const targetKey = `${targetId}-${port}`;

                console.log(`🔍 Checking unhealthy target: ${targetKey}`, {
                  targetId,
                  port,
                  targetKey,
                  isProtected: protectedTargetKeys.has(targetKey),
                  allProtectedKeys: Array.from(protectedTargetKeys)
                });

                // Check if target is protected from auto-deregistration (excluded OR selected)
                if (protectedTargetKeys.has(targetKey)) {
                  totalExcluded++;
                  console.log(`🛡️ Target ${targetKey} is protected (excluded or selected) from auto-deregistration`);
                  continue;
                }

                console.log(`⚠️ Target ${targetKey} is NOT protected, proceeding with auto-deregistration`);

                try {
                  // Deregister the target
                  const deregisterCommand = new DeregisterTargetsCommand({
                    TargetGroupArn: tg.TargetGroupArn,
                    Targets: [{ Id: targetId, Port: port }],
                  });

                  await client.send(deregisterCommand);
                  totalDeregistered++;

                  console.log(`🔄 Auto-deregistered unhealthy target: ${targetKey} from ${tg.TargetGroupName}`);

                  deregistrationResults.push({
                    targetId,
                    port,
                    targetGroupArn: tg.TargetGroupArn,
                    targetGroupName: tg.TargetGroupName,
                    albName: alb.LoadBalancerName,
                    region: regions[0] || 'us-east-1',
                    status: 'deregistered',
                    timestamp: new Date().toISOString()
                  });

                  console.log(`🔄 Auto-deregistered unhealthy target: ${targetKey} from ${tg.TargetGroupName}`);
                } catch (deregError) {
                  console.error(`Failed to auto-deregister target ${targetKey}:`, deregError.message);
                  deregistrationResults.push({
                    targetId,
                    port,
                    targetGroupArn: tg.TargetGroupArn,
                    targetGroupName: tg.TargetGroupName,
                    albName: alb.LoadBalancerName,
                    region: regions[0] || 'us-east-1',
                    status: 'failed',
                    error: deregError.message,
                    timestamp: new Date().toISOString()
                  });
                }
              }
            } catch (tgError) {
              console.warn(`Failed to check health for target group ${tg.TargetGroupArn}:`, tgError.message);
            }
          }
        } catch (albError) {
          console.warn(`Failed to get target groups for load balancer ${alb.LoadBalancerArn}:`, albError.message);
        }
      }

      console.log(`✅ Auto-deregistration completed: ${totalDeregistered} deregistered, ${totalExcluded} protected`);
      
      return {
        success: true,
        totalUnhealthy,
        totalDeregistered,
        totalExcluded,
        totalSelected: selectedTargetList.length,
        protectedTargets: protectedTargetKeys.size,
        results: deregistrationResults
      };
      
    } catch (error) {
      console.error(`❌ Auto-deregistration failed for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get refresh status for a user
   */
  getRefreshStatus(userId) {
    const isActive = this.refreshIntervals.has(userId);
    const isCurrentlyRefreshing = this.isRefreshing.get(userId) || false;
    const lastRefresh = this.lastRefreshTime.get(userId);
    const stats = this.refreshStats.get(userId);
    
    return {
      isActive,
      isCurrentlyRefreshing,
      lastRefreshTime: lastRefresh ? new Date(lastRefresh).toISOString() : null,
      timeSinceLastRefresh: lastRefresh ? Date.now() - lastRefresh : null,
      stats: stats || {
        totalRefreshes: 0,
        successfulRefreshes: 0,
        failedRefreshes: 0,
        lastError: null
      },
      nextRefreshIn: lastRefresh && isActive ? 
        Math.max(0, this.refreshIntervalMs - (Date.now() - lastRefresh)) : null
    };
  }

  /**
   * Force an immediate refresh
   */
  forceRefresh(userId, credentials, regions = ['us-east-1']) {
    console.log(`🔄 Force refreshing ALB data for user ${userId}`);
    return this.performRefresh(userId, credentials, regions);
  }

  /**
   * Get all active refresh users
   */
  getActiveRefreshUsers() {
    return Array.from(this.refreshIntervals.keys());
  }

  /**
   * Get global statistics
   */
  getGlobalStats() {
    const activeUsers = this.getActiveRefreshUsers();
    const globalStats = {
      activeUsers: activeUsers.length,
      totalRefreshes: 0,
      successfulRefreshes: 0,
      failedRefreshes: 0,
      memoryUsage: memoryStorageService.getMemoryUsage()
    };

    for (const userId of activeUsers) {
      const stats = this.refreshStats.get(userId);
      if (stats) {
        globalStats.totalRefreshes += stats.totalRefreshes;
        globalStats.successfulRefreshes += stats.successfulRefreshes;
        globalStats.failedRefreshes += stats.failedRefreshes;
      }
    }

    return globalStats;
  }

  /**
   * Update refresh configuration for a user
   */
  updateRefreshConfig(userId, newRegions) {
    const stats = this.refreshStats.get(userId);
    if (stats) {
      stats.regions = newRegions;
      this.refreshStats.set(userId, stats);
      
      console.log(`⚙️ Updated refresh regions for user ${userId}: ${newRegions.join(', ')}`);
      
      return {
        success: true,
        message: 'Refresh configuration updated',
        regions: newRegions
      };
    }
    
    return {
      success: false,
      message: 'No active refresh found for user'
    };
  }

  /**
   * Clean up all refresh intervals (for shutdown)
   */
  cleanup() {
    console.log('🧹 Cleaning up all auto-refresh intervals...');
    
    for (const [userId, interval] of this.refreshIntervals.entries()) {
      clearInterval(interval);
    }
    
    this.refreshIntervals.clear();
    this.isRefreshing.clear();
    this.lastRefreshTime.clear();
    this.userCredentials.clear();
    
    console.log('✅ All auto-refresh intervals cleaned up');
  }

  /**
   * Get refresh statistics for all users
   */
  getAllUserStats() {
    const allStats = {};
    
    for (const userId of this.refreshStats.keys()) {
      allStats[userId] = this.getRefreshStatus(userId);
    }
    
    return allStats;
  }

  /**
   * Check if user has active refresh
   */
  hasActiveRefresh(userId) {
    return this.refreshIntervals.has(userId);
  }

  /**
   * Get time until next refresh
   */
  getTimeUntilNextRefresh(userId) {
    const lastRefresh = this.lastRefreshTime.get(userId);
    if (!lastRefresh || !this.hasActiveRefresh(userId)) {
      return null;
    }
    
    const timeSinceLastRefresh = Date.now() - lastRefresh;
    const timeUntilNext = Math.max(0, this.refreshIntervalMs - timeSinceLastRefresh);
    
    return {
      milliseconds: timeUntilNext,
      seconds: Math.ceil(timeUntilNext / 1000),
      minutes: Math.ceil(timeUntilNext / 60000),
      formatted: this.formatDuration(timeUntilNext)
    };
  }

  /**
   * Format duration in human readable format
   */
  formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Singleton instance
const albAutoRefreshService = new AlbAutoRefreshService();

// Clean up on process exit
process.on('SIGINT', () => {
  albAutoRefreshService.cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  albAutoRefreshService.cleanup();
  process.exit(0);
});

module.exports = albAutoRefreshService;
