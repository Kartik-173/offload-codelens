// Import AWS ELBv2 client and commands
const { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeTargetHealthCommand, DeregisterTargetsCommand } = require('@aws-sdk/client-elastic-load-balancing-v2');

// Import AWS ELBv1 client and commands (Classic ELB)
const { ElasticLoadBalancingClient, DeregisterInstancesFromLoadBalancerCommand } = require('@aws-sdk/client-elastic-load-balancing');

// Import AWS EC2 client and commands
const { EC2Client, TerminateInstancesCommand } = require('@aws-sdk/client-ec2');

// All AWS regions (2025/2026)
const awsRegions = [
  // North America - United States
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  // North America - Canada  
  'ca-central-1', 'ca-west-1',
  // South America
  'sa-east-1', 'mx-central-1',
  // Europe
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-central-2',
  'eu-north-1', 'eu-south-1', 'eu-south-2',
  // Middle East
  'me-south-1', 'me-central-1',
  // Africa
  'af-south-1',
  // Asia Pacific - India
  'ap-south-1', 'ap-south-2',
  // Asia Pacific - East Asia
  'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3', 'ap-northeast-4',
  // Asia Pacific - Southeast Asia
  'ap-southeast-1', 'ap-southeast-2', 'ap-southeast-3', 'ap-southeast-4',
  // Asia Pacific - Greater China & North Asia
  'ap-east-1', 'ap-southeast-5', 'ap-southeast-6', 'ap-southeast-7'
];

function getUserIdFromToken(token) {
  try {
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload['cognito:username'] || null;
  } catch (e) {
    console.error('Error parsing token:', e);
    return null;
  }
}

const getAlbs = async (req, res, next) => {
  try {
    const { accessKeyId, secretAccessKey, region, debug = false } = req.body;

    console.log('=== ALB Fetch Request ===');
    console.log('Region parameter:', region);
    console.log('Debug mode:', debug);

    if (!accessKeyId || !secretAccessKey) {
      console.log('ERROR: Missing AWS credentials');
      return res.status(400).json({ error: { message: 'AWS credentials are required', code: 400 } });
    }

    // Get regions to check based on request
    let regionsToCheck;
    if (region && region !== 'all') {
      // Use the specific region provided
      regionsToCheck = [region];
      console.log(`Fetching ALBs from specific region: ${region}`);
    } else {
      // If no region specified, don't fetch anything (require explicit region)
      return res.status(400).json({ 
        error: { 
          message: 'Region parameter is required. Please specify a specific AWS region.', 
          code: 400 
        } 
      });
    }

    console.log(`Checking ${regionsToCheck.length} regions: ${regionsToCheck.join(', ')}`);

    const allAlbs = [];
    const allTargetGroupDetails = {};
    const regionResults = {};

    console.log('Starting parallel region fetch...');

    // Fetch ALBs from each region in parallel for better performance
    const regionPromises = regionsToCheck.map(async (currentRegion) => {
      try {
        console.log(`\n=== Processing region: ${currentRegion} ===`);
        if (debug) {
          console.log(`Creating AWS client for ${currentRegion}`);
        }

        // Create AWS ELBv2 client for this region
        const client = new ElasticLoadBalancingV2Client({
          region: currentRegion,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });

        const command = new DescribeLoadBalancersCommand({
          PageSize: 100, // Get more results per page
        });

        const response = await client.send(command);
        const regionAlbs = response.LoadBalancers || [];
        
        // Include all ELBv2 load balancer types (application/network/gateway)
        const loadBalancers = regionAlbs;
        
        if (loadBalancers.length > 0) {
          console.log(`Found ${loadBalancers.length} load balancers in ${currentRegion}`);
          
          // Get target groups for each load balancer in this region
          for (const alb of loadBalancers) {
            try {
              // Get target groups associated with this ALB
              const targetGroupsCommand = new DescribeTargetGroupsCommand({
                LoadBalancerArn: alb.LoadBalancerArn,
              });
              
              const targetGroupsResponse = await client.send(targetGroupsCommand);
              alb.TargetGroups = targetGroupsResponse.TargetGroups || [];
              
              console.log(`ALB ${alb.LoadBalancerName} has ${alb.TargetGroups.length} target groups`);
              console.log('Target Groups Response:', targetGroupsResponse.TargetGroups?.map(tg => ({
                Name: tg.TargetGroupName,
                ARN: tg.TargetGroupArn,
                Protocol: tg.Protocol,
                Port: tg.Port,
                HealthCheckProtocol: tg.HealthCheckProtocol,
                HealthCheckPort: tg.HealthCheckPort,
                HealthCheckIntervalSeconds: tg.HealthCheckIntervalSeconds
              })));

              // Get target health for each target group
              for (const tg of targetGroupsResponse.TargetGroups || []) {
                try {
                  console.log(`Fetching health for target group: ${tg.TargetGroupName} (${tg.TargetGroupArn})`);
                  const targetHealthCommand = new DescribeTargetHealthCommand({
                    TargetGroupArn: tg.TargetGroupArn,
                  });
                  
                  let targetHealthResponse;
                  let retryCount = 0;
                  const maxRetries = 2;
                  
                  // Retry mechanism for Elastic Beanstalk target groups that might have API delays
                  while (retryCount <= maxRetries) {
                    try {
                      targetHealthResponse = await client.send(targetHealthCommand);
                      break;
                    } catch (retryError) {
                      retryCount++;
                      console.log(`Retry ${retryCount}/${maxRetries} for ${tg.TargetGroupName}:`, retryError.message);
                      if (retryCount > maxRetries) {
                        throw retryError;
                      }
                      // Wait 1 second before retry
                      await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                  }
                  
                  console.log(`Raw Target Health Response for ${tg.TargetGroupName}:`, {
                    ResponseMetadata: targetHealthResponse.ResponseMetadata,
                    TargetHealthDescriptionsCount: targetHealthResponse.TargetHealthDescriptions?.length || 0,
                    TargetHealthDescriptions: targetHealthResponse.TargetHealthDescriptions
                  });
                  
                  allTargetGroupDetails[tg.TargetGroupArn] = {
                    TargetGroup: tg,
                    Targets: (targetHealthResponse.TargetHealthDescriptions || []).map(target => ({
                      Id: target.Target?.Id,
                      Port: target.Target?.Port,
                      Health: target.TargetHealth?.State,
                      Reason: target.TargetHealth?.Reason,
                      Description: target.TargetHealth?.Description,
                      AvailabilityZone: target.Target?.AvailabilityZone,
                    })),
                  };
                  const targetCount = targetHealthResponse.TargetHealthDescriptions?.length || 0;
                  console.log(`Target group ${tg.TargetGroupName} has ${targetCount} targets`);
                  
                  // Debug: Show transformed target data
                  if (targetCount > 0) {
                    console.log(`Transformed targets for ${tg.TargetGroupName}:`, 
                      (targetHealthResponse.TargetHealthDescriptions || []).map(target => ({
                        Id: target.Target?.Id,
                        Port: target.Target?.Port,
                        Health: target.TargetHealth?.State,
                        Reason: target.TargetHealth?.Reason,
                      }))
                    );
                  }
                  
                  if (targetCount === 0) {
                    console.log(`DEBUG: No targets found for target group ${tg.TargetGroupName}`);
                    console.log(`Target Group ARN: ${tg.TargetGroupArn}`);
                    console.log(`Target Group Type: ${tg.TargetType}`);
                    console.log(`Target Group VPC ID: ${tg.VpcId}`);
                    console.log(`Target Group Protocol: ${tg.Protocol}:${tg.Port}`);
                    console.log(`Target Group Health Check: ${tg.HealthCheckProtocol}:${tg.HealthCheckPort}`);
                    console.log(`Full AWS Response:`, JSON.stringify(targetHealthResponse, null, 2));
                    
                    // Check if this is an Elastic Beanstalk environment
                    if (tg.TargetGroupName.includes('AWSEB')) {
                      console.log('\n🌱 Elastic Beanstalk Environment Detected:');
                      console.log('• EB manages instances automatically via Auto Scaling');
                      console.log('• No targets might mean:');
                      console.log('  - Environment is scaling down (0 instances)');
                      console.log('  - Environment is unhealthy/not ready');
                      console.log('  - Deployment in progress');
                      console.log('  - AWS API delay in registering targets');
                      console.log('• Check EB console for environment status');
                      console.log('• Check Auto Scaling group min/desired capacity');
                      console.log('• This might be a temporary AWS API inconsistency');
                      
                      // For EB target groups, add a note about potential API inconsistency
                      console.log(`⚠️  NOTE: AWS console might show instances but API returns 0 targets`);
                      console.log(`   This is a known AWS issue with Elastic Beanstalk target groups`);
                      console.log(`   The instances will appear once they fully register with the load balancer`);
                    }
                  }
                  
                  console.log('Target Health Response:', targetHealthResponse.TargetHealthDescriptions);
                } catch (healthError) {
                  console.warn(`Failed to get health for target group ${tg.TargetGroupArn} in region ${currentRegion}:`, healthError.message);
                  allTargetGroupDetails[tg.TargetGroupArn] = {
                    TargetGroup: tg,
                    Targets: [],
                  };
                }
              }
            } catch (tgError) {
              console.warn(`Failed to get target groups for ALB ${alb.LoadBalancerArn} in region ${currentRegion}:`, tgError.message);
              alb.TargetGroups = [];
            }
          }
          
          return { region: currentRegion, albs: applicationAlbs, success: true, count: applicationAlbs.length };
        } else {
          console.log(`No ALBs found in ${currentRegion}, skipping...`);
          return { region: currentRegion, albs: [], success: true, count: 0 };
        }
      } catch (error) {
        console.error(`Failed to fetch ALBs from region ${currentRegion}:`, error.message);
        return { region: currentRegion, albs: [], success: false, error: error.message };
      }
    });

    // Wait for all region requests to complete
    const regionResultsArray = await Promise.all(regionPromises);

    // Process results
    for (const result of regionResultsArray) {
      allAlbs.push(...result.albs);
      regionResults[result.region] = {
        success: result.success,
        count: result.count,
        error: result.error
      };
    }

    const responseData = {
      albs: allAlbs,
      targetGroups: allTargetGroupDetails,
      regionsSearched: regionsToCheck,
      totalAlbsFound: allAlbs.length,
      regionResults: debug ? regionResults : undefined,
    };

    console.log('\n=== FINAL RESULTS ===');
    console.log(`Total ALBs found: ${allAlbs.length}`);
    console.log(`Regions searched: ${regionsToCheck.join(', ')}`);
    console.log(`Target groups found: ${Object.keys(allTargetGroupDetails).length}`);
    console.log('Sample target group details:', Object.values(allTargetGroupDetails)[0]);
    
    if (debug) {
      console.log('Region results:', regionResults);
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error fetching ALBs:', error);
    next(error);
  }
};

const deregisterTarget = async (req, res, next) => {
  try {
    console.log('🔧 Deregister target request body:', req.body);
    
    console.log('🔧 DEBUG: Full request body:', req.body);
    
    const { 
      accessKeyId, 
      secretAccessKey, 
      sessionToken,
      region, 
      targetGroupArn, 
      targetId, 
      targetPort,
      userId: bodyUserId,
      accountId,
      targetName,
      healthyCount,
      unhealthyDeletedCount,
    } = req.body;

    console.log('🔧 Extracted parameters:', {
      accessKeyId: accessKeyId ? 'present' : 'missing',
      secretAccessKey: secretAccessKey ? 'present' : 'missing',
      region,
      targetGroupArn,
      targetId,
      targetPort,
      targetName,
      healthyCount,
      unhealthyDeletedCount
    });

    if (!accessKeyId || !secretAccessKey || !targetGroupArn || !targetId) {
      console.error('❌ Missing required parameters');
      return res.status(400).json({ error: { message: 'Missing required parameters', code: 400 } });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    const tokenUserId = getUserIdFromToken(token);
    const effectiveUserId = req.user?.userId || bodyUserId || tokenUserId || null;

    const effectiveRegion = region || 'us-east-1';
    console.log('🔧 Using region:', effectiveRegion);

    // Classic ELB support via synthetic targetGroupArn: classic:<region>:<loadBalancerName>
    if (typeof targetGroupArn === 'string' && targetGroupArn.startsWith('classic:')) {
      const parts = targetGroupArn.split(':');
      const classicRegion = parts[1] || effectiveRegion;
      const lbName = parts.slice(2).join(':');

      if (!lbName) {
        return res.status(400).json({ error: { message: 'Invalid classic targetGroupArn format', code: 400 } });
      }

      if (!targetId.startsWith('i-')) {
        return res.status(400).json({ error: { message: 'Classic ELB deregistration requires an EC2 instance ID (i-...)', code: 400 } });
      }

      const classicClient = new ElasticLoadBalancingClient({
        region: classicRegion,
        credentials: {
          accessKeyId,
          secretAccessKey,
          ...(sessionToken ? { sessionToken } : {}),
        },
      });

      const deregisterClassicCommand = new DeregisterInstancesFromLoadBalancerCommand({
        LoadBalancerName: lbName,
        Instances: [{ InstanceId: targetId }],
      });

      await classicClient.send(deregisterClassicCommand);
    } else {
      // Default: ELBv2 target group deregistration (ALB/NLB/GWLB)
      const client = new ElasticLoadBalancingV2Client({
        region: effectiveRegion,
        credentials: {
          accessKeyId,
          secretAccessKey,
          ...(sessionToken ? { sessionToken } : {}),
        },
      });

      let resolvedTargetGroupName = null;
      let resolvedLoadBalancerName = null;
      let resolvedLoadBalancerArn = null;
      let allTargetsForEmail = null;

      const parsedPort = targetPort === undefined || targetPort === null || targetPort === ''
        ? undefined
        : parseInt(targetPort);

      const targetSpec = {
        Id: targetId,
        ...(Number.isFinite(parsedPort) ? { Port: parsedPort } : {}),
      };

      const deregisterCommand = new DeregisterTargetsCommand({
        TargetGroupArn: targetGroupArn,
        Targets: [targetSpec],
      });

      await client.send(deregisterCommand);
      console.log('✅ AWS deregistration completed successfully');

      try {
        const emailConfigLookupIdForCombined = accountId || effectiveUserId;
        const emailService = require('../services/emailService');
        const AlbAutoDeregisterService = require('../services/albAutoDeregisterService');

        const describeTargetGroups = await client.send(
          new DescribeTargetGroupsCommand({ TargetGroupArns: [targetGroupArn] })
        );
        const tg = (describeTargetGroups?.TargetGroups || [])[0];
        resolvedTargetGroupName = tg?.TargetGroupName || null;
        resolvedLoadBalancerArn = (tg?.LoadBalancerArns || [])[0] || null;

        // To match auto-deregister email, include health status across ALL load balancers in this region
        const describeAllLbs = await client.send(new DescribeLoadBalancersCommand({}));
        const allLoadBalancers = describeAllLbs?.LoadBalancers || [];

        if (resolvedLoadBalancerArn) {
          const resolvedLb = allLoadBalancers.find(lb => lb?.LoadBalancerArn === resolvedLoadBalancerArn);
          resolvedLoadBalancerName = resolvedLb?.LoadBalancerName || resolvedLoadBalancerName;

          if (!resolvedLoadBalancerName) {
            const describeResolvedLb = await client.send(
              new DescribeLoadBalancersCommand({ LoadBalancerArns: [resolvedLoadBalancerArn] })
            );
            resolvedLoadBalancerName = (describeResolvedLb?.LoadBalancers || [])[0]?.LoadBalancerName || null;
          }
        }

        allTargetsForEmail = await AlbAutoDeregisterService.fetchAllTargetsForEmail(client, allLoadBalancers);

        const safeAllTargets = Array.isArray(allTargetsForEmail) ? allTargetsForEmail : [];
        await emailService.sendCombinedDeregistrationAndHealthEmail({
          userId: emailConfigLookupIdForCombined,
          deregistrationMode: 'manual',
          region: effectiveRegion,
          targetGroupArn,
          targetId,
          targetPort: parsedPort,
          targetName: resolvedTargetGroupName || targetName || targetId,
          targetGroupName: resolvedTargetGroupName || targetGroupArn,
          albName: resolvedLoadBalancerName,
          albDisplayName: resolvedLoadBalancerName,
          unhealthyDeletedCount: 1,
          allTargets: safeAllTargets,
          totalTargets: safeAllTargets.length,
          useProvidedData: true,
          totalHealthyTargets: safeAllTargets.filter(t => t.health === 'healthy').length,
          totalUnhealthyTargets: safeAllTargets.filter(t => t.health === 'unhealthy').length,
          totalAllTargets: safeAllTargets.length,
        });
      } catch (combinedEmailErr) {
        console.error('Failed to send combined deregistration + health email (manual):', combinedEmailErr?.message || combinedEmailErr);
      }
    }
    const emailConfigLookupId = accountId || effectiveUserId;
    const emailService = require('../services/emailService');

    // For Classic ELB, keep the original success email (combined template depends on ELBv2 APIs)
    if (typeof targetGroupArn === 'string' && targetGroupArn.startsWith('classic:')) {
      try {
        console.log('🔧 DEBUG: Before email service call - healthyCount:', healthyCount, 'unhealthyDeletedCount:', unhealthyDeletedCount);
        
        await emailService.sendDeregisterSuccessEmail({
          userId: emailConfigLookupId, // Use accountId (UI email config key) when available
          region: region || 'us-east-1',
          targetGroupArn,
          targetId,
          targetPort,
          targetName: targetName || targetId,
          unhealthyDeletedCount: unhealthyDeletedCount || '1',
          healthyCount: healthyCount || '0',
        });
      } catch (emailErr) {
        console.error('Failed to send deregister success email:', emailErr?.message || emailErr);
      }
    }

    res.status(200).json({
      message: 'Target deregistered successfully',
      targetId,
      targetPort,
    });

  } catch (error) {
    console.error('❌ Error deregistering target:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      requestId: error.requestId
    });
    
    // Send failure notifications
    const token = req.headers.authorization?.replace('Bearer ', '');
    const tokenUserId = getUserIdFromToken(token);
    const effectiveUserId = req.user?.userId || req.body.userId || tokenUserId || null;
    const emailConfigLookupId = req.body.accountId || effectiveUserId;
    const emailService = require('../services/emailService');

    try {
      await emailService.sendDeregisterFailureEmail({
        userId: emailConfigLookupId,
        region: req.body.region || 'us-east-1',
        targetGroupArn: req.body.targetGroupArn,
        targetId: req.body.targetId,
        targetPort: req.body.targetPort,
        error: error?.message || error,
      });
    } catch (emailErr) {
      console.error('Failed to send deregister failure email:', emailErr?.message || emailErr);
    }

    next(error);
  }
};

const getUnhealthyTargetDetails = async (req, res, next) => {
  try {
    const { 
      accessKeyId, 
      secretAccessKey, 
      region, 
      targetGroupArn 
    } = req.body;

    if (!accessKeyId || !secretAccessKey || !targetGroupArn) {
      return res.status(400).json({ error: { message: 'Missing required parameters', code: 400 } });
    }

    // Create AWS ELBv2 client
    const client = new ElasticLoadBalancingV2Client({
      region: region || 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Get detailed target health
    const targetHealthCommand = new DescribeTargetHealthCommand({
      TargetGroupArn: targetGroupArn,
    });

    const targetHealthResponse = await client.send(targetHealthCommand);
    
    // Process and enhance unhealthy target information
    const unhealthyTargets = [];
    const allTargets = [];
    
    for (const target of targetHealthResponse.TargetHealthDescriptions || []) {
      const targetInfo = {
        id: target.Target?.Id,
        port: target.Target?.Port,
        health: target.TargetHealth?.State || 'unknown',
        reason: target.TargetHealth?.Reason || 'No specific reason provided',
        description: target.TargetHealth?.Description || 'No description available',
        lastSeen: target.TargetHealth?.LastSeen || null,
        availabilityZone: target.Target?.AvailabilityZone,
      };

      allTargets.push(targetInfo);
      
      if (target.TargetHealth?.State === 'unhealthy') {
        // Add detailed analysis for unhealthy targets
        const enhancedInfo = {
          ...targetInfo,
          possibleCauses: getPossibleCauses(target.TargetHealth?.Reason),
          recommendedActions: getRecommendedActions(target.TargetHealth?.Reason),
          severity: getSeverityLevel(target.TargetHealth?.Reason),
        };
        unhealthyTargets.push(enhancedInfo);
      }
    }

    res.status(200).json({
      targetGroupArn,
      totalTargets: allTargets.length,
      unhealthyTargets,
      allTargets,
      summary: {
        healthyCount: allTargets.filter(t => t.health === 'healthy').length,
        unhealthyCount: unhealthyTargets.length,
        unknownCount: allTargets.filter(t => t.health === 'unknown').length,
      }
    });

  } catch (error) {
    console.error('Error getting unhealthy target details:', error);
    next(error);
  }
};

// Helper function to provide possible causes for health issues
const getPossibleCauses = (reason) => {
  const causes = {
    'Target.ResponseCodeMismatch': [
      'Target returned unexpected HTTP status code',
      'Health check path may be incorrect',
      'Application may be returning wrong status codes'
    ],
    'Target.Timeout': [
      'Target is not responding within health check timeout',
      'Application may be overloaded or hanging',
      'Network connectivity issues'
    ],
    'Target.FailedHealthChecks': [
      'Target has failed consecutive health checks',
      'Application may be restarting or crashing',
      'Service may not be running on target'
    ],
    'Target.NotRegistered': [
      'Target is not properly registered with the target group',
      'Target may have been deregistered recently',
      'Auto Scaling group may have terminated the instance'
    ],
    'Target.DeregistrationInProgress': [
      'Target is being deregistered',
      'Connection draining may be in progress',
      'Target will be removed from rotation'
    ],
    'Target.InitialHealthChecking': [
      'Target is still being initialized',
      'Application is starting up',
      'Health checks are still in progress'
    ],
    'Target.InvalidState': [
      'Target is in an invalid state',
      'Instance may be stopped or terminated',
      'Network configuration issues'
    ]
  };
  
  return causes[reason] || ['Unknown health issue', 'Target may be experiencing problems', 'Check target instance/application logs'];
};

// Helper function to provide recommended actions
const getRecommendedActions = (reason) => {
  const actions = {
    'Target.ResponseCodeMismatch': [
      'Verify health check path is correct',
      'Check application logs for errors',
      'Ensure application returns 200 OK for health checks',
      'Test health check endpoint manually'
    ],
    'Target.Timeout': [
      'Increase health check timeout period',
      'Check if application is running',
      'Monitor application performance',
      'Check network connectivity'
    ],
    'Target.FailedHealthChecks': [
      'Restart the application/service',
      'Check application logs for errors',
      'Verify application dependencies',
      'Monitor system resources'
    ],
    'Target.NotRegistered': [
      'Register target with target group',
      'Check Auto Scaling group configuration',
      'Verify instance is running',
      'Check target group registration process'
    ],
    'Target.DeregistrationInProgress': [
      'Wait for deregistration to complete',
      'Check if deregistration was intentional',
      'Re-register target if needed'
    ],
    'Target.InitialHealthChecking': [
      'Wait for health checks to complete',
      'Check application startup logs',
      'Verify application is starting properly'
    ],
    'Target.InvalidState': [
      'Start or restart the instance',
      'Check instance status in EC2 console',
      'Verify network configuration',
      'Check security group settings'
    ]
  };
  
  return actions[reason] || [
    'Check target instance/application status',
    'Review application and system logs',
    'Verify network connectivity',
    'Contact support if issue persists'
  ];
};

// Helper function to determine severity level
const getSeverityLevel = (reason) => {
  const highSeverity = ['Target.InvalidState', 'Target.NotRegistered'];
  const mediumSeverity = ['Target.Timeout', 'Target.FailedHealthChecks'];
  const lowSeverity = ['Target.InitialHealthChecking', 'Target.DeregistrationInProgress'];
  
  if (highSeverity.includes(reason)) return 'high';
  if (mediumSeverity.includes(reason)) return 'medium';
  if (lowSeverity.includes(reason)) return 'low';
  return 'medium';
};

// Terminate EC2 instance
const terminateInstance = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, sessionToken, region, instanceId } = req.body;

    // Validate required parameters
    if (!accessKeyId || !secretAccessKey || !region || !instanceId) {
      return res.status(400).json({
        error: {
          message: 'Missing required parameters: accessKeyId, secretAccessKey, region, instanceId',
          code: 400
        }
      });
    }

    // Validate instance ID format
    if (!instanceId.startsWith('i-')) {
      return res.status(400).json({
        error: {
          message: 'Invalid instance ID format. Instance ID must start with "i-"',
          code: 400
        }
      });
    }

    console.log(`🔥 TERMINATING INSTANCE: ${instanceId} in region ${region}`);

    // Create EC2 client
    const ec2Client = new EC2Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken && { sessionToken })
      }
    });

    // Terminate the instance
    const terminateCommand = new TerminateInstancesCommand({
      InstanceIds: [instanceId]
    });

    const terminateResult = await ec2Client.send(terminateCommand);

    console.log(`✅ Instance termination initiated: ${instanceId}`);

    res.json({
      status: 'success',
      message: `Instance termination initiated for ${instanceId}`,
      data: {
        instanceId,
        terminatingInstances: terminateResult.TerminatingInstances
      }
    });

  } catch (error) {
    console.error('❌ Error terminating instance:', error);
    
    let errorMessage = 'Failed to terminate instance';
    let errorCode = 500;

    if (error.name === 'InvalidInstanceID.NotFound') {
      errorMessage = `Instance not found: ${req.body.instanceId}`;
      errorCode = 404;
    } else if (error.name === 'InvalidInstanceID.Malformed') {
      errorMessage = `Invalid instance ID format: ${req.body.instanceId}`;
      errorCode = 400;
    } else if (error.name === 'UnauthorizedOperation') {
      errorMessage = 'You do not have permission to terminate instances';
      errorCode = 403;
    }

    res.status(errorCode).json({
      error: {
        message: errorMessage,
        code: errorCode
      }
    });
  }
};

module.exports = {
  getAlbs,
  deregisterTarget,
  getUnhealthyTargetDetails,
  terminateInstance,
};
