const AlbAutoDeregisterState = require('../models/albAutoDeregisterState');
const AlbAccountSettings = require('../models/albAccountSettings');
const UserTargetSelections = require('../models/userTargetSelections');

class AlbAutoDeregisterService {
  // Start auto deregister for an account
  static async startAutoDeregister(accountId, config = {}) {
    try {
      console.log(`🚀 Starting auto deregister for account: ${accountId}`);
      
      // Check if auto deregister is enabled in account settings
      const accountSettings = await AlbAccountSettings.getByAccountId(accountId);
      if (!accountSettings?.autoDeregisterEnabled) {
        throw new Error('Auto deregister is not enabled for this account');
      }

      // Create or update state
      const stateData = {
        isActive: true,
        lastRunAt: null,
        nextRunAt: new Date(),
        runStatus: 'active',
        config: {
          interval: config.interval || 5 * 60 * 1000, // 5 minutes
          regions: config.regions || ['us-east-1'],
          ...config
        }
      };

      const state = await AlbAutoDeregisterState.upsert(accountId, stateData);
      
      console.log(`✅ Auto deregister started for account: ${accountId}`);
      return {
        success: true,
        message: 'Auto deregister started successfully',
        state
      };
    } catch (error) {
      console.error('❌ Failed to start auto deregister:', error);
      throw error;
    }
  }

  // Stop auto deregister for an account
  static async stopAutoDeregister(accountId) {
    try {
      console.log(`⏹️ Stopping auto deregister for account: ${accountId}`);
      
      const stateData = {
        isActive: false,
        runStatus: 'stopped',
        nextRunAt: null
      };

      const state = await AlbAutoDeregisterState.upsert(accountId, stateData);
      
      console.log(`✅ Auto deregister stopped for account: ${accountId}`);
      return {
        success: true,
        message: 'Auto deregister stopped successfully',
        state
      };
    } catch (error) {
      console.error('❌ Failed to stop auto deregister:', error);
      throw error;
    }
  }

  // Get auto deregister state for an account
  static async getState(accountId) {
    try {
      const state = await AlbAutoDeregisterState.getByAccountId(accountId);
      return {
        success: true,
        state
      };
    } catch (error) {
      console.error('❌ Failed to get auto deregister state:', error);
      throw error;
    }
  }

  // Perform auto deregister run
  static async performAutoDeregister(accountId, credentials, regions) {
    try {
      console.log(`🔄 Performing auto deregister for account: ${accountId}`);
      
      // Get current state
      const currentState = await AlbAutoDeregisterState.getByAccountId(accountId);
      if (!currentState || !currentState.isActive) {
        return { skipped: true, reason: 'Auto deregister is not active' };
      }

      // Update state to running
      await AlbAutoDeregisterState.upsert(accountId, {
        runStatus: 'running',
        lastRunAt: new Date()
      });

      // Get user's excluded and selected targets
      const userId = credentials.userId || accountId;
      console.log(`🔍 Resolving user ID for target selections:`, {
        credentialsUserId: credentials.userId,
        accountId,
        finalUserId: userId
      });
      
      console.log(`📊 Fetching target selections for user: ${userId}`);
      const excludedTargets = await UserTargetSelections.getExcludedTargets(userId);
      const selectedTargets = await UserTargetSelections.getByUserId(userId);
      const selectedTargetList = selectedTargets?.selectedTargets || [];
      
      console.log(`📋 Target selections loaded:`, {
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
      
      console.log(`🔍 DEBUG SUMMARY:`);
      console.log(`🔍 - Total targets found: Will be determined during scan`);
      console.log(`🔍 - Excluded targets (protected): ${excludedTargetKeys.size}`, Array.from(excludedTargetKeys));
      console.log(`🔍 - Selected targets (protected): ${selectedTargetKeys.size}`, Array.from(selectedTargetKeys));
      console.log(`🔍 - Total protected targets: ${protectedTargetKeys.size}`, Array.from(protectedTargetKeys));
      console.log(`🔍 - Any target in these lists will NOT be deregistered`);

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

      console.log(`🔄 Starting auto-deregistration for account: ${accountId}`);
      console.log(`🔄 Regions: ${regions?.join(', ') || 'none'}`);
      console.log(`🔄 Protected targets count: ${protectedTargetKeys.size}`);
      console.log(`🔄 Selected targets count: ${selectedTargetList.length}`);
      console.log(`🔄 Excluded targets count: ${excludedTargets?.length || 0}`);
      console.log(`🔐 AWS Credentials: AccessKeyID=${credentials.accessKeyId ? 'Present' : 'Missing'}, Region=${regions[0] || 'us-east-1'}`);

      // Get all load balancers
      const describeAlbsCommand = new DescribeLoadBalancersCommand({});
      const albsResponse = await client.send(describeAlbsCommand);
      const loadBalancers = albsResponse.LoadBalancers || [];
      
      console.log(`🔄 Found ${loadBalancers.length} load balancers in region: ${regions[0] || 'us-east-1'}`);

      let totalUnhealthy = 0;
      let totalDeregistered = 0;
      let totalExcluded = 0;
      const deregistrationResults = [];
      let emailSent = false; // Flag to ensure only one email per session

      console.log(`🎯 Starting to check each load balancer for unhealthy targets...`);

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
              console.log(`🔍 Checking target group: ${tg.TargetGroupName} in ALB: ${alb.LoadBalancerName}`);
              
              const targetHealthCommand = new DescribeTargetHealthCommand({
                TargetGroupArn: tg.TargetGroupArn,
              });
              
              const targetHealthResponse = await client.send(targetHealthCommand);
              const targets = targetHealthResponse.TargetHealthDescriptions || [];
              
              console.log(`🔍 Found ${targets.length} targets in ${tg.TargetGroupName}`);

              // Find unhealthy targets
              const unhealthyTargets = targets.filter(t => t.TargetHealth?.State === 'unhealthy');
              totalUnhealthy += unhealthyTargets.length;
              
              console.log(`🔍 Found ${unhealthyTargets.length} unhealthy targets in ${tg.TargetGroupName}:`, 
                unhealthyTargets.map(t => `${t.Target?.Id}:${t.Target?.Port} (${t.TargetHealth?.State})`));

              // Process each unhealthy target
              for (const target of unhealthyTargets) {
                const targetId = target.Target?.Id;
                const port = target.Target?.Port;
                const targetKey = `${targetId}-${port}`;

                console.log(`🔍 Processing unhealthy target: ${targetKey}`);
                console.log(`🔍 Protected targets check - is ${targetKey} in protected list?`, protectedTargetKeys.has(targetKey));
                console.log(`🔍 Protected list contains:`, Array.from(protectedTargetKeys));
                console.log(`🔍 Checking if ${targetKey} matches any protected target...`);

                // Check if target is protected from auto-deregistration (excluded OR selected)
                if (protectedTargetKeys.has(targetKey)) {
                  totalExcluded++;
                  console.log(`🛡️ PROTECTED: Target ${targetKey} is protected (excluded or selected) from auto-deregistration`);
                  console.log(`🛡️ This target will NOT be deregistered`);
                  continue;
                }

                console.log(`🔍 UNPROTECTED: Target ${targetKey} is NOT in protected list`);
                console.log(`🔍 This target WILL be deregistered`);

                try {
                  // Send combined email (deregistration + health check) only once per session
                  if (!emailSent) {
                    console.log(`📧 Sending combined deregistration + health check email for target: ${targetKey}`);
                    
                    const emailService = require('./emailService');
                    
                    // Fetch all targets with their current health status for the email
                    const allTargetsForEmail = await AlbAutoDeregisterService.fetchAllTargetsForEmail(client, loadBalancers);
                    
                    // Create targets list for email using the target being deregistered
                    const emailTargets = [
                      {
                        targetGroupName: tg.TargetGroupName,
                        albDisplayName: alb.LoadBalancerName,
                        id: targetId,
                        port: port,
                        health: 'unhealthy', // This target is being deregistered because it's unhealthy
                        targetType: tg.TargetType || 'INSTANCE'
                      }
                    ];
                    
                    // Send combined email with both deregistration and health check info
                    await emailService.sendCombinedDeregistrationAndHealthEmail({
                      userId: accountId,
                      region: regions[0] || 'ap-south-1',
                      targetGroupArn: tg.TargetGroupArn,
                      targetId: targetId,
                      targetPort: port,
                      targetName: tg.TargetGroupName,
                      targetGroupName: tg.TargetGroupName,
                      albName: alb.LoadBalancerName,
                      albDisplayName: alb.LoadBalancerName,
                      unhealthyDeletedCount: 1, // This target is being deregistered now
                      // Pass the actual target data instead of fetching fresh data
                      allTargets: allTargetsForEmail, // Use all targets with real health data
                      totalTargets: allTargetsForEmail.length,
                      useProvidedData: true, // Flag to use provided data instead of fetching
                      // Health check report data (real data)
                      totalHealthyTargets: allTargetsForEmail.filter(t => t.health === 'healthy').length,
                      totalUnhealthyTargets: allTargetsForEmail.filter(t => t.health === 'unhealthy').length,
                      totalAllTargets: allTargetsForEmail.length
                    });
                    
                    emailSent = true; // Mark email as sent
                    console.log(`✅ Combined deregistration + health check email sent for target: ${targetKey}`);
                  }

                  // Deregister the target
                  console.log(`🔄 About to deregister target: ${targetKey} from ${tg.TargetGroupName}`);
                  console.log(`🔄 AWS API Call - TargetGroupArn: ${tg.TargetGroupArn}, TargetId: ${targetId}, Port: ${port}`);
                  
                  const deregisterCommand = new DeregisterTargetsCommand({
                    TargetGroupArn: tg.TargetGroupArn,
                    Targets: [{ Id: targetId, Port: port }],
                  });

                  const deregisterResult = await client.send(deregisterCommand);
                  console.log(`🔄 AWS API Response:`, deregisterResult);
                  totalDeregistered++;

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

                  console.log(`✅ Auto-deregistered unhealthy target: ${targetKey} from ${tg.TargetGroupName}`);
                  console.log(`📊 Total deregistered so far: ${totalDeregistered}`);
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

      // Update run statistics
      await AlbAutoDeregisterState.updateRunStats(accountId, {
        processed: totalUnhealthy,
        deregistered: totalDeregistered,
        excluded: totalExcluded,
        selectedCount: selectedTargetList.length,
        protectedCount: protectedTargetKeys.size,
        status: 'completed'
      });

      // Set next run time
      const nextRunTime = new Date(Date.now() + (currentState.config?.interval || 5 * 60 * 1000));
      await AlbAutoDeregisterState.upsert(accountId, {
        nextRunAt: nextRunTime,
        runStatus: 'completed'
      });

      console.log(`🔄 Auto-deregistration completed: ${totalDeregistered} deregistered, ${totalExcluded} protected`);
      console.log(`📧 Email Check - totalDeregistered: ${totalDeregistered}, totalUnhealthy: ${totalUnhealthy}, totalExcluded: ${totalExcluded}`);
      console.log(`📧 Deregistration results:`, deregistrationResults.map(r => ({ status: r.status, targetId: r.targetId })));
      console.log(`🔍 DEBUG: Protected targets list:`, Array.from(protectedTargetKeys));
      console.log(`🔍 DEBUG: Selected targets list:`, selectedTargetList.map(t => `${t.targetId}-${t.port}`));
      console.log(`🔍 DEBUG: Excluded targets list:`, excludedTargets.map(t => `${t.targetId}-${t.port}`));
      
      // Clear memory cache for this user to force frontend refresh
      if (totalDeregistered > 0) {
        try {
          const memoryStorageService = require('./memoryStorageService');
          console.log(`🧹 Clearing memory cache for user ${userId} after deregistering ${totalDeregistered} targets`);
          memoryStorageService.clearAlbData(userId);
          console.log(`✅ Memory cache cleared - frontend will fetch fresh data on next refresh`);
        } catch (cacheError) {
          console.warn(`⚠️ Failed to clear memory cache:`, cacheError.message);
        }
      }
       
      // Email notifications are now sent when deregistration starts, not when completes
      console.log(`📧 Email notifications already sent during deregistration start process`);
      
      return {
        success: true,
        totalUnhealthy,
        totalDeregistered,
        totalExcluded,
        totalSelected: selectedTargetList.length,
        protectedTargets: protectedTargetKeys.size,
        results: deregistrationResults,
        summary: {
          processed: totalUnhealthy,
          deregistered: totalDeregistered,
          excluded: totalExcluded,
          selected: selectedTargetList.length,
          protected: protectedTargetKeys.size,
          failed: deregistrationResults.filter(r => r.status === 'failed').length
        }
      };
    } catch (error) {
      console.error(`❌ Auto-deregistration failed for account ${accountId}:`, error);
      
      // Update state with error
      await AlbAutoDeregisterState.upsert(accountId, {
        runStatus: 'failed',
        errorMessage: error.message
      });
      
      throw error;
    }
  }

  // Run auto deregister on-demand (called on page refresh when user is active)
  static async runOnDemand(accountId, credentials, regions) {
    try {
      console.log(`🔄 Running on-demand auto deregister for account: ${accountId}`);
      
      // Check if auto deregister is active
      const currentState = await AlbAutoDeregisterState.getByAccountId(accountId);
      if (!currentState || !currentState.isActive) {
        return { skipped: true, reason: 'Auto deregister is not active' };
      }

      // Update last activity timestamp
      await AlbAutoDeregisterState.upsert(accountId, {
        lastUserActivity: new Date(),
        runStatus: 'running'
      });

      // Perform the deregister (reuse existing logic)
      const result = await this.performAutoDeregister(accountId, {
        ...credentials,
        userId: credentials.userId || accountId
      }, regions);

      // After successful run, schedule next run for 5 minutes later (fallback)
      const nextRunTime = new Date(Date.now() + 5 * 60 * 1000);
      await AlbAutoDeregisterState.upsert(accountId, {
        nextRunAt: nextRunTime,
        runStatus: 'completed'
      });

      console.log(`✅ On-demand auto-deregistration completed, next run scheduled for: ${nextRunTime.toLocaleString()}`);
      
      return {
        ...result,
        onDemand: true,
        nextRunAt: nextRunTime
      };
      
    } catch (error) {
      console.error(`❌ On-demand auto-deregistration failed for account ${accountId}:`, error);
      
      // Update state with error
      await AlbAutoDeregisterState.upsert(accountId, {
        runStatus: 'failed',
        errorMessage: error.message
      });
      
      throw error;
    }
  }

  // Check if user is inactive and run scheduled auto deregister
  static async checkAndRunScheduled(accountId) {
    try {
      const currentState = await AlbAutoDeregisterState.getByAccountId(accountId);
      if (!currentState || !currentState.isActive) {
        return { skipped: true, reason: 'Auto deregister is not active' };
      }

      // Check if user has been inactive for more than 5 minutes
      const now = new Date();
      const lastActivity = currentState.lastUserActivity || currentState.updatedAt;
      const inactiveTime = now - new Date(lastActivity);
      const fiveMinutes = 5 * 60 * 1000;

      if (inactiveTime < fiveMinutes) {
        return { skipped: true, reason: 'User is still active, skipping scheduled run' };
      }

      // User is inactive, run scheduled auto deregister
      console.log(`⏰ User inactive for ${Math.round(inactiveTime / 60000)} minutes, running scheduled auto deregister`);
      
      // Get credentials from somewhere (this would need to be passed in or stored)
      // For now, we'll just update the state
      await AlbAutoDeregisterState.upsert(accountId, {
        runStatus: 'scheduled-run',
        lastRunAt: now
      });

      return {
        success: true,
        message: 'Scheduled auto deregister run completed',
        inactiveTime: Math.round(inactiveTime / 60000)
      };

    } catch (error) {
      console.error(`❌ Scheduled auto-deregistration failed for account ${accountId}:`, error);
      throw error;
    }
  }

  // Helper method to fetch all targets with health status for email
  static async fetchAllTargetsForEmail(client, loadBalancers) {
    const allTargets = [];
    
    try {
      const { DescribeTargetGroupsCommand, DescribeTargetHealthCommand } = require('@aws-sdk/client-elastic-load-balancing-v2');
      
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
              const describeTargetHealthCommand = new DescribeTargetHealthCommand({
                TargetGroupArn: tg.TargetGroupArn,
              });

              const healthResponse = await client.send(describeTargetHealthCommand);
              const targetHealthDescriptions = healthResponse.TargetHealthDescriptions || [];

              for (const desc of targetHealthDescriptions) {
                const id = desc?.Target?.Id || 'Unknown ID';
                const port = desc?.Target?.Port ?? 'N/A';
                const healthState = desc?.TargetHealth?.State || 'unknown';
                const reason = desc?.TargetHealth?.Reason || '';

                allTargets.push({
                  targetGroupName: tg.TargetGroupName,
                  albDisplayName: alb.LoadBalancerName,
                  id,
                  port,
                  health: healthState, // Map to 'health' for email template
                  healthState, // Keep original too for debugging
                  reason,
                  targetType: tg.TargetType || 'INSTANCE',
                  targetGroupArn: tg.TargetGroupArn,
                });
              }
            } catch (tgError) {
              console.warn(`Failed to check health for target group ${tg.TargetGroupArn}:`, tgError.message);
            }
          }
        } catch (albError) {
          console.warn(`Failed to get target groups for load balancer ${alb.LoadBalancerArn}:`, albError.message);
        }
      }
      
      console.log(`📧 Fetched ${allTargets.length} targets for email:`, {
        healthy: allTargets.filter(t => t.healthState === 'healthy').length,
        unhealthy: allTargets.filter(t => t.healthState === 'unhealthy').length,
        unknown: allTargets.filter(t => t.healthState === 'unknown').length
      });
      
    } catch (error) {
      console.error('Error fetching all targets for email:', error);
    }
    
    return allTargets;
  }

  // Get all active auto deregister accounts
  static async getActiveAccounts() {
    try {
      const activeStates = await AlbAutoDeregisterState.getAllActive();
      return {
        success: true,
        accounts: activeStates
      };
    } catch (error) {
      console.error('❌ Failed to get active auto deregister accounts:', error);
      throw error;
    }
  }
}

module.exports = AlbAutoDeregisterService;
