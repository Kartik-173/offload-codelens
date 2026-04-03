const { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeTargetHealthCommand } = require('@aws-sdk/client-elastic-load-balancing-v2');
const { ElasticLoadBalancingClient, DescribeLoadBalancersCommand: DescribeClassicLoadBalancersCommand, DescribeInstanceHealthCommand } = require('@aws-sdk/client-elastic-load-balancing');

class AlbFetcherService {
  constructor() {
    this.regions = [
      'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
      'ca-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
      'eu-central-1', 'eu-north-1', 'eu-south-1', 'ap-south-1',
      'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
      'ap-northeast-3', 'sa-east-1', 'me-south-1', 'af-south-1'
    ];
  }

  async fetchClassicElbsFromRegion(region, credentials = null) {
    try {
      console.log(`🔍 Fetching Classic ELBs from region: ${region}`);
      console.log('🔑 Using provided credentials:', !!credentials);

      const awsCredentials = credentials || await this.getAWSCredentials();

      const classicClient = new ElasticLoadBalancingClient({
        region,
        credentials: awsCredentials,
      });

      const classicElbs = [];
      let marker;
      do {
        const cmd = new DescribeClassicLoadBalancersCommand({
          ...(marker ? { Marker: marker } : {}),
        });
        const resp = await classicClient.send(cmd);
        classicElbs.push(...(resp.LoadBalancerDescriptions || []));
        marker = resp.NextMarker;
      } while (marker);

      console.log(`📊 Found ${classicElbs.length} Classic ELBs in ${region}`);

      const normalized = [];
      for (const elb of classicElbs) {
        const lbName = elb.LoadBalancerName;
        const syntheticTgArn = `classic:${region}:${lbName}`;

        let targets = [];
        try {
          const healthResp = await classicClient.send(new DescribeInstanceHealthCommand({
            LoadBalancerName: lbName,
          }));
          targets = (healthResp.InstanceStates || []).map((s) => ({
            Id: s.InstanceId,
            Health: (s.State || 'Unknown').toLowerCase() === 'inservice' ? 'healthy' : 'unhealthy',
            Reason: s.ReasonCode || 'No reason provided',
            Description: s.Description || 'No description available',
          }));
        } catch (healthErr) {
          console.warn(`⚠️ Failed to get Classic ELB instance health for ${lbName}:`, healthErr.message);
        }

        normalized.push({
          region,
          loadBalancerArn: null,
          loadBalancerName: lbName,
          loadBalancerDnsName: elb.DNSName,
          scheme: elb.Scheme || null,
          state: 'active',
          type: 'classic',
          vpcId: elb.VPCId || null,
          availabilityZones: elb.AvailabilityZones || [],
          createdTime: elb.CreatedTime || null,
          ipAddressType: null,
          canonicalHostedZoneId: elb.CanonicalHostedZoneNameID || null,
          securityGroups: elb.SecurityGroups || [],
          targetGroups: [
            {
              targetGroupArn: syntheticTgArn,
              targetGroupName: lbName,
              protocol: null,
              port: null,
              healthCheckEnabled: true,
              healthCheckPath: null,
              healthCheckIntervalSeconds: null,
              healthCheckTimeoutSeconds: null,
              healthyThresholdCount: null,
              unhealthyThresholdCount: null,
              matcher: null,
              targetType: 'instance',
              Targets: targets,
              targets,
              isClassic: true,
              loadBalancerName: lbName,
            }
          ]
        });
      }

      return normalized;
    } catch (error) {
      console.error(`❌ Failed to fetch Classic ELBs from region ${region}:`, error);
      return [];
    }
  }

  // Get AWS credentials
  async getAWSCredentials() {
    try {
      const credentials = {
        accessKeyId: process.env.ACCESSKEYID,
        secretAccessKey: process.env.SECRETACCESSKEY,
      };

      if (!credentials.accessKeyId || !credentials.secretAccessKey) {
        throw new Error('AWS credentials not found in environment variables');
      }

      return credentials;
    } catch (error) {
      console.error('❌ Failed to get AWS credentials:', error);
      throw error;
    }
  }

  // Fetch ALBs from a specific region
  async fetchAlbsFromRegion(region, credentials = null) {
    try {
      console.log(`🔍 Fetching ALBs from region: ${region}`);
      console.log('🔑 Using provided credentials:', !!credentials);
      
      // Use provided credentials or fallback to environment variables
      const awsCredentials = credentials || await this.getAWSCredentials();
      
      console.log('🔑 AWS credentials account:', credentials?.accountId || 'environment');
      
      const client = new ElasticLoadBalancingV2Client({
        region: region,
        credentials: awsCredentials,
      });

      // Get all load balancers (including ALB, NLB, GWLB)
      // Note: DescribeLoadBalancers is paginated; we must follow NextMarker to avoid missing LBs.
      const albs = [];
      let marker;
      do {
        const describeAlbsCommand = new DescribeLoadBalancersCommand({
          ...(marker ? { Marker: marker } : {}),
        });
        const albsResponse = await client.send(describeAlbsCommand);
        albs.push(...(albsResponse.LoadBalancers || []));
        marker = albsResponse.NextMarker;
      } while (marker);
      console.log(`📊 Found ${albs.length} ALBs in ${region}`);
      
      // Debug: Show ALB types found
      const albTypes = {};
      albs.forEach(alb => {
        const type = alb.Type || 'unknown';
        albTypes[type] = (albTypes[type] || 0) + 1;
      });
      console.log(`📋 ALB types in ${region}:`, albTypes);
      
      // Debug: Show ALB names and types
      albs.forEach(alb => {
        console.log(`  - ${alb.LoadBalancerName} (${alb.Type || 'unknown'})`);
      });

      // Fetch target groups for each ALB
      const albData = [];
      
      for (const alb of albs) {
        try {
          // Get target groups for this ALB
          const describeTgCommand = new DescribeTargetGroupsCommand({
            LoadBalancerArn: alb.LoadBalancerArn,
          });
          const tgResponse = await client.send(describeTgCommand);

          const targetGroups = [];
          
          // Fetch target health for each target group
          for (const tg of tgResponse.TargetGroups || []) {
            try {
              const describeHealthCommand = new DescribeTargetHealthCommand({
                TargetGroupArn: tg.TargetGroupArn,
              });
              const healthResponse = await client.send(describeHealthCommand);

              const targets = (healthResponse.TargetHealthDescriptions || []).map(target => ({
                Id: target.Target?.Id,
                Port: target.Target?.Port,
                AvailabilityZone: target.Target?.AvailabilityZone,
                Health: target.TargetHealth?.State || 'unknown',
                Reason: target.TargetHealth?.Reason || 'No reason provided',
                Description: target.TargetHealth?.Description || 'No description available',
              }));

              targetGroups.push({
                targetGroupArn: tg.TargetGroupArn,
                targetGroupName: tg.TargetGroupName,
                protocol: tg.Protocol,
                port: tg.Port,
                healthCheckEnabled: tg.HealthCheckEnabled,
                healthCheckPath: tg.HealthCheckPath,
                healthCheckIntervalSeconds: tg.HealthCheckIntervalSeconds,
                healthCheckTimeoutSeconds: tg.HealthCheckTimeoutSeconds,
                healthyThresholdCount: tg.HealthyThresholdCount,
                unhealthyThresholdCount: tg.UnhealthyThresholdCount,
                matcher: tg.Matcher?.HttpConfig?.Path || null,
                targetType: tg.TargetType,
                Targets: targets,
                targets: targets
              });
            } catch (healthError) {
              console.warn(`⚠️ Failed to get health for target group ${tg.TargetGroupName}:`, healthError.message);
              // Still add target group without health data
              targetGroups.push({
                targetGroupArn: tg.TargetGroupArn,
                targetGroupName: tg.TargetGroupName,
                protocol: tg.Protocol,
                port: tg.Port,
                healthCheckEnabled: tg.HealthCheckEnabled,
                healthCheckPath: tg.HealthCheckPath,
                healthCheckIntervalSeconds: tg.HealthCheckIntervalSeconds,
                healthCheckTimeoutSeconds: tg.HealthCheckTimeoutSeconds,
                healthyThresholdCount: tg.HealthyThresholdCount,
                unhealthyThresholdCount: tg.UnhealthyThresholdCount,
                matcher: tg.Matcher?.HttpConfig?.Path || null,
                targetType: tg.TargetType,
                Targets: [],
                targets: []
              });
            }
          }

          // Add ALB data with target groups
          albData.push({
            region: region,
            loadBalancerArn: alb.LoadBalancerArn,
            loadBalancerName: alb.LoadBalancerName,
            loadBalancerDnsName: alb.DNSName,
            scheme: alb.Scheme,
            state: alb.State?.Code || 'unknown',
            type: alb.Type,
            vpcId: alb.VpcId,
            availabilityZones: alb.AvailabilityZones?.map(az => az.ZoneName) || [],
            createdTime: alb.CreatedTime,
            ipAddressType: alb.IpAddressType,
            canonicalHostedZoneId: alb.CanonicalHostedZoneId,
            targetGroups: targetGroups
          });

        } catch (tgError) {
          console.warn(`⚠️ Failed to get target groups for ALB ${alb.LoadBalancerName}:`, tgError.message);
          // Still add ALB without target groups
          albData.push({
            region: region,
            loadBalancerArn: alb.LoadBalancerArn,
            loadBalancerName: alb.LoadBalancerName,
            loadBalancerDnsName: alb.DNSName,
            scheme: alb.Scheme,
            state: alb.State?.Code || 'unknown',
            type: alb.Type,
            vpcId: alb.VpcId,
            availabilityZones: alb.AvailabilityZones?.map(az => az.ZoneName) || [],
            createdTime: alb.CreatedTime,
            ipAddressType: alb.IpAddressType,
            canonicalHostedZoneId: alb.CanonicalHostedZoneId,
            targetGroups: []
          });
        }
      }

      console.log(`✅ Successfully fetched ${albData.length} ALBs from ${region}`);
      return albData;
    } catch (error) {
      console.error(`❌ Failed to fetch ALBs from region ${region}:`, error);
      return [];
    }
  }

  // Fetch ALBs from all regions
  async fetchAllAlbs() {
    try {
      console.log('🌍 Starting to fetch ALBs from all regions...');
      
      const allAlbData = [];
      const regionResults = {};

      // Fetch from all regions concurrently (with some batching to avoid rate limits)
      const batchSize = 5; // Process 5 regions at a time
      for (let i = 0; i < this.regions.length; i += batchSize) {
        const batch = this.regions.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (region) => {
          try {
            const regionData = await this.fetchAlbsFromRegion(region);
            regionResults[region] = {
              success: true,
              count: regionData.length,
              data: regionData
            };
            return regionData;
          } catch (error) {
            console.error(`❌ Failed to fetch from region ${region}:`, error);
            regionResults[region] = {
              success: false,
              error: error.message,
              count: 0
            };
            return [];
          }
        });

        const batchResults = await Promise.all(batchPromises);
        allAlbData.push(...batchResults.flat());

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < this.regions.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Log summary
      const successfulRegions = Object.keys(regionResults).filter(r => regionResults[r].success);
      const failedRegions = Object.keys(regionResults).filter(r => !regionResults[r].success);
      
      console.log(`📊 Fetch Summary:`);
      console.log(`✅ Successful regions: ${successfulRegions.length}/${this.regions.length}`);
      console.log(`❌ Failed regions: ${failedRegions.length}/${this.regions.length}`);
      console.log(`📊 Total ALBs fetched: ${allAlbData.length}`);
      
      if (failedRegions.length > 0) {
        console.log(`⚠️ Failed regions: ${failedRegions.join(', ')}`);
      }

      return {
        success: true,
        totalAlbs: allAlbData.length,
        regionResults,
        data: allAlbData
      };
    } catch (error) {
      console.error('❌ Failed to fetch ALBs from all regions:', error);
      throw error;
    }
  }

  // Fetch ALBs from specific regions
  async fetchAlbsFromRegions(regions, credentials = null) {
    try {
      console.log(`🔍 Fetching ALBs from regions: ${regions.join(', ')}`);
      console.log('🔑 Using provided credentials:', !!credentials);
      
      if (credentials) {
        console.log('🔑 Provided credentials details:');
        console.log('  - Account ID:', credentials.accountId || 'not specified');
        console.log('  - Access Key provided:', !!credentials.accessKeyId);
        console.log('  - Secret Key provided:', !!credentials.secretAccessKey);
        console.log('  - Session Token provided:', !!credentials.sessionToken);
        console.log('🚀 WILL USE FRESH AWS API WITH PROVIDED CREDENTIALS');
      } else {
        console.log('⚠️ No credentials provided, will use environment variables');
      }
      
      const allAlbData = [];
      
      for (const region of regions) {
        const [v2Data, classicData] = await Promise.all([
          this.fetchAlbsFromRegion(region, credentials),
          this.fetchClassicElbsFromRegion(region, credentials),
        ]);
        allAlbData.push(...v2Data, ...classicData);
      }

      console.log(`✅ Successfully fetched ${allAlbData.length} ALBs from ${regions.length} regions`);
      if (allAlbData.length > 0) {
        console.log('🔍 First ALB ARN from fetch:', allAlbData[0]?.loadBalancerArn);
        console.log('🔍 Account ID in first ALB ARN:', allAlbData[0]?.loadBalancerArn?.split(':')[4]);
      }
      return allAlbData;
    } catch (error) {
      console.error(`❌ Failed to fetch ALBs from regions ${regions}:`, error);
      throw error;
    }
  }

  // Get regions with ALBs
  async getRegionsWithAlbs(userId) {
    try {
      const memoryStorageService = require('./memoryStorageService');
      const albResult = memoryStorageService.getAlbData(userId);
      const albData = albResult?.success ? (albResult.data || []) : [];

      const regions = [...new Set(albData.map(alb => alb.region))];
      console.log(`📍 Found ALBs in ${regions.length} regions for user ${userId}: ${regions.join(', ')}`);
      
      return regions;
    } catch (error) {
      console.error(`❌ Failed to get regions with ALBs for user ${userId}:`, error);
      return [];
    }
  }

  // Refresh ALB data for a user (incremental)
  async refreshAlbData(userId, regions = null) {
    try {
      console.log(`🔄 Refreshing ALB data for user: ${userId}`);
      
      let albData;
      if (regions) {
        albData = await this.fetchAlbsFromRegions(regions);
      } else {
        const result = await this.fetchAllAlbs();
        albData = result.data;
      }

      // OpenSearch storage disabled for ALB; store latest snapshot in memory instead
      const memoryStorageService = require('./memoryStorageService');
      memoryStorageService.storeAlbData(userId, albData);

      const storeResult = {
        total: albData.length,
        stored: albData.length,
        duplicates: 0,
        storage: 'memory'
      };

      console.log(`✅ Successfully refreshed ALB data for user ${userId} (stored in memory):`);
      console.log(`📊 Total ALBs processed: ${storeResult.total}`);
      console.log(`📍 Regions: ${regions ? regions.join(', ') : 'All regions'}`);

      return storeResult;
    } catch (error) {
      console.error(`❌ Failed to refresh ALB data for user ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = new AlbFetcherService();
