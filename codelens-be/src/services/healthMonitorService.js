const { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeTargetHealthCommand } = require('@aws-sdk/client-elastic-load-balancing-v2');
const emailService = require('./emailService');
const config = require('../config/env.js');

class HealthMonitorService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.healthCheckInterval = (parseInt(process.env.HEALTH_CHECK_INTERVAL_MINUTES) || 5) * 60 * 1000; // Convert to milliseconds
    this.monitoredRegions = ['ap-south-1']; // Default region, can be expanded
    this.lastHealthStatus = new Map(); // Store last health status to detect changes
  }


  // Method to get AWS credentials from vault (similar to ALB controller)
  async getAWSCredentials() {
    // For now, we'll use environment variables as fallback
    const credentials = {
      accessKeyId: process.env.ACCESSKEYID,
      secretAccessKey: process.env.SECRETACCESSKEY,
    };
    
    console.log('📧 HEALTH MONITOR: Using AWS credentials for health check');
    console.log('📧 HEALTH MONITOR: Access Key ID:', credentials.accessKeyId ? 'Set' : 'NOT SET');
    console.log('📧 HEALTH MONITOR: Secret Access Key:', credentials.secretAccessKey ? 'Set' : 'NOT SET');
    
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      console.warn('📧 HEALTH MONITOR: ⚠️  WARNING - AWS credentials not found in environment variables');
      throw new Error('AWS credentials not configured for health monitoring');
    }
    
    return credentials;
  }

  start() {
    if (this.isRunning) {
      console.log('Health monitor is already running');
      return;
    }

    console.log(`Starting health monitor service - checking every ${process.env.HEALTH_CHECK_INTERVAL_MINUTES || 5} minutes`);
    this.isRunning = true;

    // Run immediately on start
    this.performHealthCheck();

    // Set up recurring health checks
    this.interval = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);
  }

  stop() {
    if (!this.isRunning) {
      console.log('Health monitor is not running');
      return;
    }

    console.log('Stopping health monitor service');
    this.isRunning = false;
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async performHealthCheck() {
    console.log(`\n=== Performing Health Check - ${new Date().toLocaleString()} ===`);
    console.log('🔧 DEBUG: Using updated health monitoring service with protection logic');
    
    try {
      this.lastHealthStatus.set('lastCheckTime', new Date().toISOString());
      const allUnhealthyTargets = [];
      let totalTargets = 0;

      for (const region of this.monitoredRegions) {
        try {
          const regionResults = await this.checkRegionHealth(region);
          allUnhealthyTargets.push(...regionResults.unhealthyTargets);
          totalTargets += regionResults.totalTargets;
        } catch (regionError) {
          console.error(`Failed to check health for region ${region}:`, regionError.message);
        }
      }

      console.log(`🔍 Total unhealthy targets found: ${allUnhealthyTargets.length}`);
      allUnhealthyTargets.forEach(target => {
        console.log(`   📋 Unhealthy: ${target.id}-${target.port} in ${target.targetGroupName}`);
      });

      // Get all user target selections to filter out protected targets
      const UserTargetSelections = require('../models/userTargetSelections');
      const userEmailService = require('./userEmailService');
      const allConfigs = await userEmailService.getAllEmailConfigs();
      const enabledUsers = (allConfigs?.configs || []).filter(cfg => cfg && cfg.emailsEnabled);

      if (enabledUsers.length === 0) {
        console.log('No users have email alerts enabled; skipping health check');
        return;
      }

      // Collect all protected targets across ALL users
      // Protected = selectedTargets OR excludedFromAutoDeregister (matches UI logic)
      const protectedTargets = new Set();
      console.log(`🔍 Loading ALL protected targets from Cassandra...`);
      
      try {
        const allSelections = await UserTargetSelections.getAll();
        console.log(`📊 Found ${allSelections.length} user(s) with target selections`);
        
        for (const sel of allSelections) {
          console.log(`👤 User ${sel.userId}: ${sel.excludedFromAutoDeregister.length} excluded, ${sel.selectedTargets.length} selected`);
          
          // Both excluded AND selected targets are protected
          const allProtected = [
            ...sel.excludedFromAutoDeregister,
            ...sel.selectedTargets
          ];
          
          allProtected.forEach(target => {
            const targetId = target.targetId || target.id;
            const port = target.port;
            const legacyKey = `${targetId}-${port}`;
            protectedTargets.add(legacyKey);
            console.log(`🛡️  Protected: ${legacyKey}`);
          });
        }
      } catch (error) {
        console.warn('Failed to load target selections:', error.message);
      }

      console.log(`🔐 Total protected targets: ${protectedTargets.size}`);
      console.log(`🔐 Protected target keys:`, Array.from(protectedTargets));

      // Filter out protected unhealthy targets using simple targetId-port key
      const unprotectedUnhealthyTargets = allUnhealthyTargets.filter(target => {
        const targetId = target.id || target.targetId;
        const port = target.port;
        const key = `${targetId}-${port}`;
        const isProtected = protectedTargets.has(key);
        
        console.log(`🔍 Target ${targetId}:${port} in ${target.targetGroupName} → key=${key} protected=${isProtected}`);
        
        return !isProtected;
      });

      console.log(`🔧 DEBUG: Filtering results - Original: ${allUnhealthyTargets.length}, Unprotected: ${unprotectedUnhealthyTargets.length}`);

      // Send email alert only if there are unprotected unhealthy targets
      console.log(`🔧 DEBUG: About to check ${allUnhealthyTargets.length} unhealthy targets for protection`);
      if (unprotectedUnhealthyTargets.length > 0) {
        console.log(`Found ${unprotectedUnhealthyTargets.length} unprotected unhealthy targets across all regions`);
        
        // Track unhealthy status for recovery detection, but always send email every run while unhealthy
        const currentStatusHash = this.generateStatusHash(unprotectedUnhealthyTargets);
        const wasUnhealthy = Boolean(this.lastHealthStatus.get('global'));
        console.log(wasUnhealthy ? 'Still UNHEALTHY, sending alert (every run)' : 'Changed to UNHEALTHY, sending alert');

        // Send to all users who have enabled email notifications
        for (const cfg of enabledUsers) {
          await this.sendUnhealthyAlert(unprotectedUnhealthyTargets, totalTargets, cfg.userId);
        }

        this.lastHealthStatus.set('global', currentStatusHash);
      } else {
        if (allUnhealthyTargets.length > 0) {
          console.log(`Found ${allUnhealthyTargets.length} unhealthy targets, but all are protected - no alert sent`);
        } else {
          console.log('All targets are healthy across all regions');
        }
        
        // Check if we had unhealthy targets before (recovery scenario)
        const lastStatusHash = this.lastHealthStatus.get('global');
        if (lastStatusHash) {
          console.log('Health status changed to HEALTHY, sending recovery alert');
          // Send recovery email with all healthy targets
          const allHealthyTargets = await this.getAllHealthyTargets();

          const userEmailService = require('./userEmailService');
          const allConfigs = await userEmailService.getAllEmailConfigs();
          const enabledUsers = (allConfigs?.configs || []).filter(cfg => cfg && cfg.emailsEnabled);

          if (enabledUsers.length > 0) {
            for (const cfg of enabledUsers) {
              await this.sendHealthyAlert(allHealthyTargets, totalTargets, cfg.userId);
            }
          } else {
            console.log('No users have email alerts enabled; skipping recovery email notification');
          }

          this.lastHealthStatus.delete('global');
        } else {
          console.log('Health status unchanged (still healthy), no notification needed');
        }
      }

    } catch (error) {
      console.error('Health check failed:', error);
    }

    console.log(`=== Health Check Completed - ${new Date().toLocaleString()} ===\n`);
  }

  // Send email alerts for unhealthy targets
  async sendUnhealthyAlert(unhealthyTargets, totalTargets, userId = null) {
    try {
      console.log(`📧 HEALTH MONITOR: Sending unhealthy alert for ${unhealthyTargets.length} targets`);
      console.log(`📧 HEALTH MONITOR: User ID: ${userId || 'default'}`);
      
      const emailService = require('./emailService');
      await emailService.sendHealthCheckAlert(unhealthyTargets, totalTargets, userId);
      
      console.log(`📧 HEALTH MONITOR: Unhealthy alert sent successfully`);
    } catch (error) {
      console.error(`📧 HEALTH MONITOR: Failed to send unhealthy alert:`, error);
      // Don't throw error - health monitoring should continue even if email fails
    }
  }

  // Send email alerts when targets become healthy again
  async sendHealthyAlert(healthyTargets, totalTargets, userId = null) {
    try {
      console.log(`📧 HEALTH MONITOR: Sending recovery alert for ${healthyTargets.length} targets`);
      console.log(`📧 HEALTH MONITOR: User ID: ${userId || 'default'}`);
      
      const emailService = require('./emailService');
      await emailService.sendCustomHealthCheckEmail('HEALTHY', healthyTargets, totalTargets, userId);
      
      console.log(`📧 HEALTH MONITOR: Recovery alert sent successfully`);
    } catch (error) {
      console.error(`📧 HEALTH MONITOR: Failed to send recovery alert:`, error);
      // Don't throw error - health monitoring should continue even if email fails
    }
  }

  async checkRegionHealth(region) {
    console.log(`\n--- Checking region: ${region} ---`);
    
    const unhealthyTargets = [];
    let totalTargets = 0;

    try {
      // Get AWS credentials dynamically
      const credentials = await this.getAWSCredentials();
      
      // Create AWS ELBv2 client for this region
      const client = new ElasticLoadBalancingV2Client({
        region: region,
        credentials: credentials,
      });

      // Get all ELBv2 load balancers
      const describeAlbsCommand = new DescribeLoadBalancersCommand({});
      const albsResponse = await client.send(describeAlbsCommand);
      
      // Include all ELBv2 load balancer types (application/network/gateway)
      const loadBalancers = albsResponse.LoadBalancers || [];
      console.log(`Found ${loadBalancers.length} load balancers in ${region}`);

      // Check each load balancer's target groups
      for (const alb of loadBalancers) {
        try {
          const targetGroupsCommand = new DescribeTargetGroupsCommand({
            LoadBalancerArn: alb.LoadBalancerArn,
          });
          
          const targetGroupsResponse = await client.send(targetGroupsCommand);
          const targetGroups = targetGroupsResponse.TargetGroups || [];
          
          console.log(`Load balancer ${alb.LoadBalancerName} has ${targetGroups.length} target groups`);

          // Check each target group's health
          for (const tg of targetGroups) {
            try {
              const targetHealthCommand = new DescribeTargetHealthCommand({
                TargetGroupArn: tg.TargetGroupArn,
              });
              
              const targetHealthResponse = await client.send(targetHealthCommand);
              const targets = targetHealthResponse.TargetHealthDescriptions || [];
              
              totalTargets += targets.length;
              console.log(`Target group ${tg.TargetGroupName} has ${targets.length} targets`);

              // Process each target
              for (const target of targets) {
                const targetHealth = target.TargetHealth?.State || 'unknown';
                
                if (targetHealth === 'unhealthy') {
                  const unhealthyTarget = {
                    id: target.Target?.Id,
                    port: target.Target?.Port,
                    health: targetHealth,
                    reason: target.TargetHealth?.Reason || 'No reason provided',
                    description: target.TargetHealth?.Description || 'No description available',
                    targetGroupName: tg.TargetGroupName,
                    targetGroupArn: tg.TargetGroupArn,
                    albName: alb.LoadBalancerName,
                    albDisplayName: alb.LoadBalancerName,
                    loadBalancerArn: alb.LoadBalancerArn,
                    loadBalancerType: alb.Type,
                    region: region,
                    targetType: tg.TargetType,
                    severity: this.getSeverityLevel(target.TargetHealth?.Reason),
                    timestamp: new Date().toISOString(),
                  };

                  unhealthyTargets.push(unhealthyTarget);
                  console.log(`  ❌ Unhealthy target: ${target.Target?.Id} in ${tg.TargetGroupName}`);
                } else if (targetHealth === 'healthy') {
                  console.log(`  ✅ Healthy target: ${target.Target?.Id} in ${tg.TargetGroupName}`);
                } else {
                  console.log(`  ❓ Unknown target: ${target.Target?.Id} in ${tg.TargetGroupName}`);
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

    } catch (error) {
      console.error(`Failed to check region ${region}:`, error);
      throw error;
    }

    console.log(`Region ${region} summary: ${unhealthyTargets.length} unhealthy, ${totalTargets} total targets`);
    
    return {
      region,
      unhealthyTargets,
      totalTargets,
    };
  }

  getSeverityLevel(reason) {
    if (!reason) return 'medium';
    
    const reasonLower = reason.toLowerCase();
    
    // Critical issues
    if (reasonLower.includes('timeout') || 
        reasonLower.includes('connection') || 
        reasonLower.includes('failed') ||
        reasonLower.includes('error')) {
      return 'critical';
    }
    
    // High priority issues
    if (reasonLower.includes('health') || 
        reasonLower.includes('unhealthy') ||
        reasonLower.includes('draining')) {
      return 'high';
    }
    
    // Medium priority issues
    if (reasonLower.includes('initial') || 
        reasonLower.includes('warming') ||
        reasonLower.includes('unused')) {
      return 'medium';
    }
    
    // Low priority issues
    return 'low';
  }

  generateStatusHash(unhealthyTargets) {
    // Create a hash based on the current unhealthy targets to detect changes
    const targetData = unhealthyTargets
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(target => `${target.id}:${target.health}:${target.reason}`)
      .join('|');
    
    return require('crypto').createHash('md5').update(targetData).digest('hex');
  }

  // Get all healthy targets for recovery emails
  async getAllHealthyTargets() {
    const allHealthyTargets = [];
    
    for (const region of this.monitoredRegions) {
      try {
        const credentials = await this.getAWSCredentials();
        const client = new ElasticLoadBalancingV2Client({
          region: region,
          credentials: credentials,
        });

        // Get all ELBv2 load balancers
        const describeAlbsCommand = new DescribeLoadBalancersCommand({});
        const albsResponse = await client.send(describeAlbsCommand);
        
        const loadBalancers = albsResponse.LoadBalancers || [];

        for (const alb of loadBalancers) {
          // Get target groups for this load balancer
          const describeTargetGroupsCommand = new DescribeTargetGroupsCommand({
            LoadBalancerArn: alb.LoadBalancerArn,
          });
          const tgResponse = await client.send(describeTargetGroupsCommand);

          for (const tg of tgResponse.TargetGroups) {
            // Get target health for this target group
            const describeHealthCommand = new DescribeTargetHealthCommand({
              TargetGroupArn: tg.TargetGroupArn,
            });
            const healthResponse = await client.send(describeHealthCommand);

            // Add healthy targets
            for (const target of healthResponse.TargetHealthDescriptions || []) {
              if (target.TargetHealth?.State === 'healthy') {
                allHealthyTargets.push({
                  targetGroupArn: tg.TargetGroupArn,
                  targetGroupName: tg.TargetGroupName,
                  loadBalancerArn: alb.LoadBalancerArn,
                  albDisplayName: alb.LoadBalancerName,
                  id: target.Target?.Id,
                  port: target.Target?.Port,
                  health: 'healthy',
                  reason: 'Target is healthy',
                  description: 'Health check passed',
                  availabilityZone: target.Target?.AvailabilityZone,
                  lastSeen: target.TargetHealth?.LastSeen || new Date().toISOString(),
                  region: region,
                  targetType: tg.TargetType || 'instance',
                  severity: 'info',
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to get healthy targets for region ${region}:`, error);
      }
    }
    
    return allHealthyTargets;
  }

  // Get all unhealthy targets for testing emails
  async getAllUnhealthyTargets() {
    const allUnhealthyTargets = [];
    
    for (const region of this.monitoredRegions) {
      try {
        console.log(`🧪 Getting unhealthy targets for region: ${region}`);
        
        // Get AWS credentials dynamically
        const credentials = await this.getAWSCredentials();
        
        // Create AWS ELBv2 client for this region
        const { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeTargetHealthCommand } = require('@aws-sdk/client-elastic-load-balancing-v2');
        
        const client = new ElasticLoadBalancingV2Client({
          region: region,
          credentials: credentials,
        });

        // Get all load balancers in the region
        const describeAlbsCommand = new DescribeLoadBalancersCommand({});
        const albsResponse = await client.send(describeAlbsCommand);
        const loadBalancers = albsResponse.LoadBalancers || [];

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
                const healthResponse = await client.send(targetHealthCommand);

                // Add unhealthy targets
                for (const target of healthResponse.TargetHealthDescriptions || []) {
                  if (target.TargetHealth?.State === 'unhealthy') {
                    allUnhealthyTargets.push({
                      targetGroupArn: tg.TargetGroupArn,
                      targetGroupName: tg.TargetGroupName,
                      albDisplayName: alb.LoadBalancerName,
                      id: target.Target?.Id,
                      port: target.Target?.Port,
                      health: 'unhealthy',
                      reason: target.TargetHealth?.Reason || 'Target is unhealthy',
                      description: target.TargetHealth?.Description || 'Health check failed',
                      availabilityZone: target.Target?.AvailabilityZone,
                      region: region,
                      targetType: tg.TargetType || 'instance',
                      severity: this.getSeverityLevel(target.TargetHealth?.Reason),
                      timestamp: new Date().toISOString(),
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
      } catch (error) {
        console.error(`Failed to get unhealthy targets for region ${region}:`, error);
      }
    }
    
    return allUnhealthyTargets;
  }

  // Method to add/remove monitored regions
  addRegion(region) {
    if (!this.monitoredRegions.includes(region)) {
      this.monitoredRegions.push(region);
      console.log(`Added region ${region} to health monitoring`);
    }
  }

  removeRegion(region) {
    const index = this.monitoredRegions.indexOf(region);
    if (index > -1) {
      this.monitoredRegions.splice(index, 1);
      console.log(`Removed region ${region} from health monitoring`);
    }
  }

  // Get current status
  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.healthCheckInterval,
      monitoredRegions: [...this.monitoredRegions],
      lastCheck: this.lastHealthStatus.get('lastCheckTime'),
    };
  }
}

module.exports = HealthMonitorService;
