const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const { ElasticLoadBalancingV2Client, DescribeTargetHealthCommand } = require('@aws-sdk/client-elastic-load-balancing-v2');
const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');

class AlbCloudWatchService {
  constructor() {
    this.cloudWatchClient = new CloudWatchClient();
    this.elbv2Client = new ElasticLoadBalancingV2Client();
    this.cloudWatchLogsClient = new CloudWatchLogsClient();
  }

  /**
   * Get ALB metrics from CloudWatch for real-time monitoring
   */
  async getAlbMetrics(loadBalancerArn, lbType, region, credentials) {
    try {
      // Create clients with credentials and region
      const cloudWatchClient = new CloudWatchClient({
        region: region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          ...(credentials.sessionToken && { sessionToken: credentials.sessionToken }), // Only add sessionToken if it exists
        }
      });

      const normalizedLbType = (lbType || '').toLowerCase();
      const isApplication = normalizedLbType === 'application';
      const isNetwork = normalizedLbType === 'network';
      const isClassic = normalizedLbType === 'classic';

      // Determine CloudWatch dimension based on LB type
      // - ELBv2 (ALB/NLB/GWLB): Dimension is "LoadBalancer" and value is the resource name from ARN
      // - Classic ELB: Dimension is "LoadBalancerName" and value is the LB name
      let dimensionName = 'LoadBalancer';
      let dimensionValue;
      if (isClassic) {
        dimensionName = 'LoadBalancerName';
        dimensionValue = loadBalancerArn; // for classic we pass lbName in place of ARN
      } else {
        // CloudWatch "LoadBalancer" dimension expects the full resource name, e.g. "app/my-alb/50dc6c495c0c9188"
        // The ARN format contains "/loadbalancer/<resourceName>".
        dimensionValue = (loadBalancerArn || '').includes('loadbalancer/')
          ? loadBalancerArn.split('loadbalancer/')[1]
          : (loadBalancerArn || '').split(':loadbalancer/')[1] || loadBalancerArn;
      }

      let metrics;
      if (isApplication) {
        // Get key ALB metrics from CloudWatch with appropriate statistics
        metrics = await Promise.all([
          this.getMetric(cloudWatchClient, 'AWS/ApplicationELB', 'RequestCount', dimensionName, dimensionValue, 'Sum'),
          this.getMetric(cloudWatchClient, 'AWS/ApplicationELB', 'TargetConnectionErrorCount', dimensionName, dimensionValue, 'Sum'),
          this.getMetric(cloudWatchClient, 'AWS/ApplicationELB', 'HTTPCode_Target_2XX_Count', dimensionName, dimensionValue, 'Sum'),
          this.getMetric(cloudWatchClient, 'AWS/ApplicationELB', 'HTTPCode_Target_4XX_Count', dimensionName, dimensionValue, 'Sum'),
          this.getMetric(cloudWatchClient, 'AWS/ApplicationELB', 'HTTPCode_Target_5XX_Count', dimensionName, dimensionValue, 'Sum'),
          this.getMetric(cloudWatchClient, 'AWS/ApplicationELB', 'TargetResponseTime', dimensionName, dimensionValue, 'Average'),
          this.getMetric(cloudWatchClient, 'AWS/ApplicationELB', 'ActiveConnectionCount', dimensionName, dimensionValue, 'Average'),
          this.getMetric(cloudWatchClient, 'AWS/ApplicationELB', 'ProcessedBytes', dimensionName, dimensionValue, 'Sum')
        ]);
      } else if (isNetwork) {
        // NLB metrics live under AWS/NetworkELB.
        // Note: There is no HTTP code breakdown like ALB.
        metrics = await Promise.all([
          this.getMetric(cloudWatchClient, 'AWS/NetworkELB', 'NewFlowCount', dimensionName, dimensionValue, 'Sum'),
          this.getMetric(cloudWatchClient, 'AWS/NetworkELB', 'TCP_Target_Reset_Count', dimensionName, dimensionValue, 'Sum'),
          this.getMetric(cloudWatchClient, 'AWS/NetworkELB', 'ProcessedBytes', dimensionName, dimensionValue, 'Sum'),
          this.getMetric(cloudWatchClient, 'AWS/NetworkELB', 'ActiveFlowCount', dimensionName, dimensionValue, 'Average')
        ]);
      } else if (isClassic) {
        metrics = await Promise.all([
          this.getMetric(cloudWatchClient, 'AWS/ELB', 'RequestCount', dimensionName, dimensionValue, 'Sum'),
          this.getMetric(cloudWatchClient, 'AWS/ELB', 'HTTPCode_Backend_2XX', dimensionName, dimensionValue, 'Sum'),
          this.getMetric(cloudWatchClient, 'AWS/ELB', 'HTTPCode_Backend_4XX', dimensionName, dimensionValue, 'Sum'),
          this.getMetric(cloudWatchClient, 'AWS/ELB', 'HTTPCode_Backend_5XX', dimensionName, dimensionValue, 'Sum'),
          this.getMetric(cloudWatchClient, 'AWS/ELB', 'Latency', dimensionName, dimensionValue, 'Average'),
          this.getMetric(cloudWatchClient, 'AWS/ELB', 'SurgeQueueLength', dimensionName, dimensionValue, 'Average'),
          this.getMetric(cloudWatchClient, 'AWS/ELB', 'SpilloverCount', dimensionName, dimensionValue, 'Sum'),
          this.getMetric(cloudWatchClient, 'AWS/ELB', 'ProcessedBytes', dimensionName, dimensionValue, 'Sum')
        ]);
      } else {
        metrics = [];
      }

      console.log(`📊 All metrics fetched for ${dimensionValue}:`, (metrics || []).map(m => ({ name: m.metricName, value: m.value, status: m.status })));

      return {
        loadBalancerArn,
        region,
        timestamp: new Date().toISOString(),
        metrics: {
          requestCount: isApplication ? metrics[0] : (isNetwork ? metrics[0] : (isClassic ? metrics[0] : { value: 0, status: 'not_applicable' })),
          targetConnectionErrors: isApplication ? metrics[1] : (isNetwork ? metrics[1] : { value: 0, status: 'not_applicable' }),
          successCount: isApplication ? metrics[2] : (isClassic ? metrics[1] : { value: 0, status: 'not_applicable' }),
          clientErrors: isApplication ? metrics[3] : (isClassic ? metrics[2] : { value: 0, status: 'not_applicable' }),
          serverErrors: isApplication ? metrics[4] : (isClassic ? metrics[3] : { value: 0, status: 'not_applicable' }),
          latency: isApplication ? metrics[5] : (isClassic ? metrics[4] : { value: 0, status: 'not_applicable' }),
          activeConnections: isApplication ? metrics[6] : (isNetwork ? metrics[3] : { value: 0, status: 'not_applicable' }),
          processedBytes: isApplication ? metrics[7] : (isNetwork ? metrics[2] : (isClassic ? metrics[7] : { value: 0, status: 'not_applicable' }))
        }
      };
    } catch (error) {
      console.error(`Error getting CloudWatch metrics for ${loadBalancerArn}:`, error);
      throw error;
    }
  }

  /**
   * Get target group health status from ELBv2 API (real-time)
   */
  async getTargetGroupHealth(targetGroupArn, region, credentials) {
    try {
      // Create ELBv2 client with credentials and region
      const elbv2Client = new ElasticLoadBalancingV2Client({
        region: region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          ...(credentials.sessionToken && { sessionToken: credentials.sessionToken }), // Only add sessionToken if it exists
        }
      });
      
      const params = {
        TargetGroupArn: targetGroupArn
      };

      const command = new DescribeTargetHealthCommand(params);
      const result = await elbv2Client.send(command);
      
      // Extract unique instance IDs from targets
      const instanceIds = [...new Set(
        result.TargetHealthDescriptions
          .map(desc => desc.Target.Id)
          .filter(id => id.startsWith('i-')) // Only EC2 instance IDs
      )];

      // Fetch instance names for all instances
      let instanceNames = {};
      if (instanceIds.length > 0) {
        try {
          instanceNames = await this.getInstanceNames(instanceIds, region, credentials);
        } catch (error) {
          console.warn('Failed to fetch instance names:', error.message);
          // Continue without instance names
        }
      }
      
      // Extract target group name and load balancer name from ARN
      const targetGroupName = targetGroupArn.split(':target-group/')[1]?.split('/')[1] || 
                              targetGroupArn.split('/').pop() || 'unknown';
      
      // Extract load balancer name from target group ARN (format includes load balancer)
      const loadBalancerName = targetGroupArn.split(':target-group/')[1]?.split('/')[0] || 'unknown';
      
      return {
        targetGroupArn,
        targetGroupName,
        albDisplayName: loadBalancerName,
        region,
        timestamp: new Date().toISOString(),
        targets: result.TargetHealthDescriptions.map(desc => ({
          targetId: desc.Target.Id,
          targetName: instanceNames[desc.Target.Id] || desc.Target.Id, // Add instance name
          port: desc.Target.Port,
          availabilityZone: desc.Target.AvailabilityZone,
          health: desc.TargetHealth.State,
          reason: desc.TargetHealth.Reason || '',
          description: desc.TargetHealth.Description || ''
        })),
        summary: this.calculateHealthSummary(result.TargetHealthDescriptions)
      };
    } catch (error) {
      console.error(`Error getting target health for ${targetGroupArn}:`, error);
      throw error;
    }
  }

  /**
   * Get EC2 instance names for given instance IDs
   */
  async getInstanceNames(instanceIds, region, credentials) {
    try {
      const ec2Client = new EC2Client({
        region: region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          ...(credentials.sessionToken && { sessionToken: credentials.sessionToken }),
        }
      });

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds
      });

      const result = await ec2Client.send(command);
      
      // Create mapping of instance ID to name (from Name tag)
      const instanceNames = {};
      result.Reservations.forEach(reservation => {
        reservation.Instances.forEach(instance => {
          const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
          instanceNames[instance.InstanceId] = nameTag?.Value || instance.InstanceId;
        });
      });

      return instanceNames;
    } catch (error) {
      console.error('Error fetching instance names:', error);
      throw error;
    }
  }

  /**
   * Get CloudWatch logs for ALB access logs
   */
  async getAlbLogs(loadBalancerArn, region, credentials, startTime, endTime) {
    try {
      // Create CloudWatch Logs client with credentials and region
      const cloudWatchLogsClient = new CloudWatchLogsClient({
        region: region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        }
      });

      const loadBalancerName = loadBalancerArn.split('/').pop();
      
      // Get log groups for ALB
      const logGroupName = `/aws/application-load-balancer/${loadBalancerName}`;
      
      const params = {
        logGroupName: logGroupName,
        startTime: startTime || Date.now() - 3600000, // Default: last 1 hour
        endTime: endTime || Date.now()
      };

      const command = new FilterLogEventsCommand(params);
      const result = await cloudWatchLogsClient.send(command);
      
      return {
        loadBalancerArn,
        region,
        logGroupName,
        timestamp: new Date().toISOString(),
        events: result.events.map(event => ({
          timestamp: new Date(event.timestamp).toISOString(),
          message: event.message,
          logStreamName: event.logStreamName
        })),
        summary: this.analyzeLogs(result.events)
      };
    } catch (error) {
      console.error(`Error getting CloudWatch logs for ${loadBalancerArn}:`, error);
      // Return empty logs if log group doesn't exist
      if (error.name === 'ResourceNotFoundException') {
        return {
          loadBalancerArn,
          region,
          logGroupName: `/aws/application-load-balancer/${loadBalancerArn.split('/').pop()}`,
          timestamp: new Date().toISOString(),
          events: [],
          summary: { totalEvents: 0, errors: 0, warnings: 0 }
        };
      }
      throw error;
    }
  }

  /**
   * Get comprehensive ALB status combining CloudWatch metrics and target health
   */
  async getAlbRealTimeStatus(albData, credentials) {
    try {
      console.log(`🔄 Getting real-time status for ${albData.length} ALBs`);
      
      const results = await Promise.allSettled(
        albData.map(async (alb) => {
          console.log(`📊 Processing ALB: ${alb.loadBalancerName} (${alb.loadBalancerArn})`);
          
          try {
            const normalizedLbType = (alb.type || '').toLowerCase();
            const isClassic = normalizedLbType === 'classic';

            // Get ALB metrics
            console.log(`📈 Fetching CloudWatch metrics for ${alb.loadBalancerName}`);
            const metricsIdentifier = isClassic ? alb.loadBalancerName : alb.loadBalancerArn;
            const metrics = await this.getAlbMetrics(metricsIdentifier, alb.type, alb.region, credentials);
            console.log(`📈 Metrics fetched for ${alb.loadBalancerName}:`, {
              requestCount: metrics.metrics?.requestCount?.value,
              latency: metrics.metrics?.latency?.value,
              errors: (metrics.metrics?.clientErrors?.value || 0) + (metrics.metrics?.serverErrors?.value || 0)
            });
            
            let targetGroupHealth;
            if (isClassic) {
              const tg = alb.targetGroups?.[0];
              const targets = tg?.Targets || tg?.targets || [];

              // Extract unique instance IDs from Classic ELB targets
              const instanceIds = [...new Set(
                targets
                  .map(t => t.Id)
                  .filter(id => id.startsWith('i-')) // Only EC2 instance IDs
              )];

              // Fetch instance names for all instances
              let instanceNames = {};
              if (instanceIds.length > 0) {
                try {
                  instanceNames = await this.getInstanceNames(instanceIds, alb.region, credentials);
                } catch (error) {
                  console.warn('Failed to fetch instance names for Classic ELB:', error.message);
                  // Continue without instance names
                }
              }

              const summary = {
                total: targets.length,
                healthy: targets.filter(t => (t.Health || '').toLowerCase() === 'healthy').length,
                unhealthy: targets.filter(t => (t.Health || '').toLowerCase() === 'unhealthy').length,
                draining: 0,
                unused: 0,
                unknown: targets.filter(t => !t.Health).length,
              };

              targetGroupHealth = [{
                status: 'fulfilled',
                value: {
                  targetGroupArn: tg?.targetGroupArn,
                  targetGroupName: tg?.targetGroupName || alb.loadBalancerName, // Use LB name for Classic ELB
                  albDisplayName: alb.loadBalancerName,
                  region: alb.region,
                  timestamp: new Date().toISOString(),
                  targets: targets.map(t => ({
                    targetId: t.Id,
                    targetName: instanceNames[t.Id] || t.Id, // Add instance name
                    port: t.Port,
                    availabilityZone: t.AvailabilityZone,
                    health: (t.Health || '').toLowerCase() || 'unknown',
                    reason: t.Reason || '',
                    description: t.Description || '',
                  })),
                  summary,
                }
              }];
            } else {
              // Get target group health for all target groups (ELBv2)
              console.log(`🏥 Fetching target health for ${alb.targetGroups.length} target groups`);
              targetGroupHealth = await Promise.allSettled(
                alb.targetGroups.map(tg => 
                  this.getTargetGroupHealth(tg.targetGroupArn, alb.region, credentials)
                )
              );
            }

            const result = {
              ...alb,
              realTimeMetrics: metrics,
              targetGroupHealth: targetGroupHealth
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value),
              timestamp: new Date().toISOString()
            };
            
            console.log(`✅ Successfully processed ALB: ${alb.loadBalancerName}`);
            return result;
          } catch (error) {
            console.error(`❌ Error processing ALB ${alb.loadBalancerName}:`, error);
            return {
              ...alb,
              realTimeMetrics: { error: error.message, metrics: {} },
              targetGroupHealth: [],
              timestamp: new Date().toISOString()
            };
          }
        })
      );

      console.log(`🔄 Completed real-time status for ${albData.length} ALBs`);
      
      return results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
    } catch (error) {
      console.error('❌ Error in getAlbRealTimeStatus:', error);
      throw error;
    }
  }

  /**
   * Helper method to get a specific CloudWatch metric
   */
  async getMetric(cloudWatchClient, namespace, metricName, dimensionName, dimensionValue, statistic = 'Sum') {
    try {
      console.log(`📊 Fetching CloudWatch metric: ${metricName} for ${dimensionValue}`);
      console.log(`📊 Parameters: namespace=${namespace}, statistic=${statistic}`);

      const aggregateDatapoints = (datapoints) => {
        const sorted = [...datapoints].sort((a, b) => b.Timestamp - a.Timestamp);
        const latestTimestamp = sorted[0]?.Timestamp;

        const values = sorted
          .map((dp) => dp?.[statistic])
          .filter((v) => typeof v === 'number' && Number.isFinite(v));

        if (values.length === 0) {
          return { value: 0, timestamp: latestTimestamp };
        }

        switch (statistic) {
          case 'Sum':
            return {
              value: values.reduce((acc, v) => acc + v, 0),
              timestamp: latestTimestamp,
            };
          case 'Average':
            return {
              value: values.reduce((acc, v) => acc + v, 0) / values.length,
              timestamp: latestTimestamp,
            };
          case 'Maximum':
            return { value: Math.max(...values), timestamp: latestTimestamp };
          case 'Minimum':
            return { value: Math.min(...values), timestamp: latestTimestamp };
          default:
            return { value: values[0] ?? 0, timestamp: latestTimestamp };
        }
      };

      const params = {
        Namespace: namespace,
        MetricName: metricName,
        Dimensions: [
          {
            Name: dimensionName,
            Value: dimensionValue
          }
        ],
        StartTime: new Date(Date.now() - 300000), // Last 5 minutes
        EndTime: new Date(),
        Period: 60, // 1 minute periods
        Statistics: [statistic] // Use specific statistic
      };

      const command = new GetMetricStatisticsCommand(params);
      const cloudWatchResult = await cloudWatchClient.send(command);
      
      console.log(`📊 CloudWatch response for ${metricName}:`, {
        datapoints: cloudWatchResult.Datapoints.length,
        datapoints: cloudWatchResult.Datapoints.slice(0, 2) // Log first 2 datapoints
      });
      
      if (cloudWatchResult.Datapoints.length === 0) {
        console.log(`📊 No datapoints found for ${metricName} - trying with different time window`);
        
        // Try with longer time window (2 hours)
        const extendedParams = {
          ...params,
          StartTime: new Date(Date.now() - 7200000), // Last 2 hours
          Period: 300, // 5 minute periods
        };
        
        console.log(`📊 Retrying with extended time window...`);
        const extendedCommand = new GetMetricStatisticsCommand(extendedParams);
        const extendedResult = await cloudWatchClient.send(extendedCommand);
        
        console.log(`📊 Extended CloudWatch response for ${metricName}:`, {
          datapoints: extendedResult.Datapoints.length,
          datapoints: extendedResult.Datapoints.slice(0, 2)
        });
        
        if (extendedResult.Datapoints.length === 0) {
          console.log(`📊 Still no datapoints for ${metricName} even with extended window`);
          return {
            timestamp: new Date(),
            value: 0,
            statistic: statistic,
            status: 'no_data_extended'
          };
        }

        const aggregated = aggregateDatapoints(extendedResult.Datapoints);
        const finalResult = {
          timestamp: aggregated.timestamp,
          value: aggregated.value,
          statistic: statistic,
          status: 'success_extended'
        };
        
        console.log(`📊 Final extended metric result for ${metricName}:`, finalResult);
        return finalResult;
      }

      const aggregated = aggregateDatapoints(cloudWatchResult.Datapoints);
      const finalResult = {
        timestamp: aggregated.timestamp,
        value: aggregated.value,
        statistic: statistic,
        status: 'success'
      };
      
      console.log(`📊 Final metric result for ${metricName}:`, finalResult);
      return finalResult;
    } catch (error) {
      console.error(`❌ Error getting CloudWatch metric ${metricName}:`, error);
      console.error(`❌ Error details:`, {
        message: error.message,
        name: error.name,
        code: error.Code || error.code,
        requestId: error.requestId
      });
      return {
        timestamp: new Date(),
        value: 0,
        statistic: statistic,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Calculate health summary for target group
   */
  calculateHealthSummary(targetHealthDescriptions) {
    const summary = {
      total: targetHealthDescriptions.length,
      healthy: 0,
      unhealthy: 0,
      draining: 0,
      unused: 0,
      unknown: 0
    };

    targetHealthDescriptions.forEach(desc => {
      const state = desc.TargetHealth.State;
      switch (state) {
        case 'healthy':
          summary.healthy++;
          break;
        case 'unhealthy':
          summary.unhealthy++;
          break;
        case 'draining':
          summary.draining++;
          break;
        case 'unused':
          summary.unused++;
          break;
        default:
          summary.unknown++;
          break;
      }
    });

    return summary;
  }

  /**
   * Analyze CloudWatch logs for errors and warnings
   */
  analyzeLogs(events) {
    const summary = {
      totalEvents: events.length,
      errors: 0,
      warnings: 0,
      httpStatusCodes: {}
    };

    events.forEach(event => {
      const message = event.message.toLowerCase();
      
      // Count HTTP status codes
      const httpStatusMatch = message.match(/http\/[0-9\.]+\s+([0-9]{3})/);
      if (httpStatusMatch) {
        const statusCode = httpStatusMatch[1];
        summary.httpStatusCodes[statusCode] = (summary.httpStatusCodes[statusCode] || 0) + 1;
        
        if (statusCode.startsWith('4')) {
          summary.errors++;
        } else if (statusCode.startsWith('5')) {
          summary.errors++;
        }
      }

      // Count errors and warnings
      if (message.includes('error') || message.includes('failed')) {
        summary.errors++;
      } else if (message.includes('warning') || message.includes('warn')) {
        summary.warnings++;
      }
    });

    return summary;
  }
}

module.exports = new AlbCloudWatchService();
