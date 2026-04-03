const UserTargetSelections = require('../models/userTargetSelections');
const AlbAccountSettings = require('../models/albAccountSettings');

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

// Get user target selections
const getUserTargetSelections = async (req, res, next) => {
  try {
    // Use regular JWT token parsing since routes are now public
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    console.log('🔍 DEBUG: Get user target selections - userId from JWT:', userId);
    
    if (!userId) {
      return res.status(401).json({ 
        error: { 
          message: 'Unauthorized - Invalid or missing token', 
          code: 401 
        } 
      });
    }

    const selections = await UserTargetSelections.getByUserId(userId);
    
    // Return consistent response structure
    const responseData = selections || {
      userId,
      selectedTargets: [],
      excludedFromAutoDeregister: []
    };

    res.status(200).json({
      success: true,
      message: 'User target selections retrieved successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error getting user target selections:', error);
    res.status(500).json({ 
      error: { 
        message: 'Internal server error while retrieving target selections', 
        code: 500,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      } 
    });
  }
};

// Save user target selections
const saveUserTargetSelections = async (req, res, next) => {
  try {
    console.log('🔍 DEBUG: Save user target selections - Request body:', req.body);
    
    // Use regular JWT token parsing since routes are now public
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    console.log('🔍 DEBUG: Save user target selections - userId from JWT:', userId);
    
    if (!userId) {
      return res.status(401).json({ 
        error: { 
          message: 'Unauthorized - Invalid or missing token', 
          code: 401 
        } 
      });
    }

    const { selectedTargets, excludedFromAutoDeregister } = req.body;

    console.log('🔍 DEBUG: Save user target selections - selectedTargets:', selectedTargets);
    console.log('🔍 DEBUG: Save user target selections - excludedFromAutoDeregister:', excludedFromAutoDeregister);

    // Validate input
    if (!selectedTargets && !excludedFromAutoDeregister) {
      return res.status(400).json({ 
        error: { 
          message: 'At least selectedTargets or excludedFromAutoDeregister must be provided', 
          code: 400 
        } 
      });
    }

    // IMPORTANT: Merge with existing data — do NOT overwrite fields that weren't sent.
    // When frontend toggles a checkbox it only sends selectedTargets, 
    // so we must preserve the existing excludedFromAutoDeregister (and vice versa).
    const existing = await UserTargetSelections.getByUserId(userId);

    const selections = {
      selectedTargets: selectedTargets !== undefined ? selectedTargets : (existing?.selectedTargets || []),
      excludedFromAutoDeregister: excludedFromAutoDeregister !== undefined ? excludedFromAutoDeregister : (existing?.excludedFromAutoDeregister || [])
    };

    console.log('🔍 DEBUG: Save user target selections - selections object:', selections);

    const result = await UserTargetSelections.upsert(userId, selections, userId);
    
    console.log('🔍 DEBUG: Save user target selections - result:', result);
    
    // Return consistent response structure matching frontend expectations
    res.status(200).json({
      success: true,
      message: 'User target selections saved successfully',
      data: {
        userId: result.userId,
        selectedTargets: result.selectedTargets,
        excludedFromAutoDeregister: result.excludedFromAutoDeregister,
        updatedAt: result.updatedAt,
        version: result.version
      }
    });
  } catch (error) {
    console.error('Error saving user target selections:', error);
    console.error('🔍 DEBUG: Save user target selections - Full error:', error);
    
    // Handle specific errors
    if (error.message.includes('Concurrent modification')) {
      return res.status(409).json({ 
        error: { 
          message: error.message, 
          code: 409 
        } 
      });
    }
    
    res.status(500).json({ 
      error: { 
        message: 'Internal server error while saving target selections', 
        code: 500,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      } 
    });
  }
};

// Add target to excluded list (prevent auto-deregistration)
const addTargetToExcludedList = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    if (!userId) {
      return res.status(401).json({ error: { message: 'Unauthorized', code: 401 } });
    }

    const { targetId, port, targetGroupArn, targetGroupName, albName, region, reason } = req.body;

    if (!targetId || port === undefined) {
      return res.status(400).json({ 
        error: { message: 'Target ID and port are required', code: 400 } 
      });
    }

    const targetInfo = {
      targetId,
      port,
      targetGroupArn,
      targetGroupName,
      albName,
      region,
      reason: reason || 'Manually excluded by user'
    };

    const result = await UserTargetSelections.addToExcludedList(userId, targetInfo, userId);
    
    res.status(200).json({
      message: 'Target added to excluded list successfully',
      data: result
    });
  } catch (error) {
    console.error('Error adding target to excluded list:', error);
    next(error);
  }
};

// Remove target from excluded list
const removeTargetFromExcludedList = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    if (!userId) {
      return res.status(401).json({ error: { message: 'Unauthorized', code: 401 } });
    }

    const { targetId, port } = req.body;

    if (!targetId || port === undefined) {
      return res.status(400).json({ 
        error: { message: 'Target ID and port are required', code: 400 } 
      });
    }

    const result = await UserTargetSelections.removeFromExcludedList(userId, targetId, port, userId);
    
    res.status(200).json({
      message: 'Target removed from excluded list successfully',
      data: result
    });
  } catch (error) {
    console.error('Error removing target from excluded list:', error);
    next(error);
  }
};

// Get all excluded targets for a user
const getExcludedTargets = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    if (!userId) {
      return res.status(401).json({ 
        error: { 
          message: 'Unauthorized - Invalid or missing token', 
          code: 401 
        } 
      });
    }

    const excludedTargets = await UserTargetSelections.getExcludedTargets(userId);
    
    res.status(200).json({
      success: true,
      message: 'Excluded targets retrieved successfully',
      data: excludedTargets
    });
  } catch (error) {
    console.error('Error getting excluded targets:', error);
    res.status(500).json({ 
      error: { 
        message: 'Internal server error while retrieving excluded targets', 
        code: 500,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      } 
    });
  }
};

// Check if target should be excluded from auto-deregistration
const shouldExcludeTarget = async (userId, targetId, port) => {
  try {
    return await UserTargetSelections.isTargetExcluded(userId, targetId, port);
  } catch (error) {
    console.error('Error checking target exclusion:', error);
    return false; // Default to not excluding if there's an error
  }
};

// Enhanced auto-deregister function that respects user exclusions
const autoDeregisterUnhealthyTargets = async (req, res, next) => {
  try {
    const { accessKeyId, secretAccessKey, sessionToken, region, accountId } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token) || accountId;

    if (!accessKeyId || !secretAccessKey || !region) {
      return res.status(400).json({ 
        error: { message: 'Missing required parameters', code: 400 } 
      });
    }

    // Check if auto-deregister is enabled for this account
    const accountSettings = await AlbAccountSettings.getByAccountId(accountId);
    if (!accountSettings?.autoDeregisterEnabled) {
      return res.status(403).json({ 
        error: { message: 'Auto-deregister is not enabled for this account', code: 403 } 
      });
    }

    // Get user's excluded targets AND selected targets
    const excludedTargets = await UserTargetSelections.getExcludedTargets(userId);
    const selectedTargets = await UserTargetSelections.getByUserId(userId);
    const selectedTargetList = selectedTargets?.selectedTargets || [];
    
    // Combine both excluded and selected targets for protection
    const excludedTargetKeys = new Set(
      excludedTargets.map(target => `${target.targetId}-${target.port}`)
    );
    const selectedTargetKeys = new Set(
      selectedTargetList.map(target => `${target.targetId}-${target.port}`)
    );
    
    // All protected targets = excluded OR selected
    const protectedTargetKeys = new Set([...excludedTargetKeys, ...selectedTargetKeys]);

    // Import AWS SDK
    const { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeTargetHealthCommand, DeregisterTargetsCommand } = require('@aws-sdk/client-elastic-load-balancing-v2');

    const client = new ElasticLoadBalancingV2Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken && { sessionToken }),
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

              // Check if target is protected from auto-deregistration (excluded OR selected)
              if (protectedTargetKeys.has(targetKey)) {
                totalExcluded++;
                console.log(`🛡️ Target ${targetKey} is protected (excluded or selected) from auto-deregistration`);
                continue;
              }

              try {
                // Deregister the target
                const deregisterCommand = new DeregisterTargetsCommand({
                  TargetGroupArn: tg.TargetGroupArn,
                  Targets: [{ Id: targetId, Port: port }],
                });

                await client.send(deregisterCommand);
                totalDeregistered++;

                deregistrationResults.push({
                  targetId,
                  port,
                  targetGroupArn: tg.TargetGroupArn,
                  targetGroupName: tg.TargetGroupName,
                  albName: alb.LoadBalancerName,
                  region,
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
                  region,
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

    res.status(200).json({
      message: 'Auto-deregistration completed',
      data: {
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
      }
    });
  } catch (error) {
    console.error('Error in auto-deregister unhealthy targets:', error);
    next(error);
  }
};

module.exports = {
  getUserTargetSelections,
  saveUserTargetSelections,
  addTargetToExcludedList,
  removeTargetFromExcludedList,
  getExcludedTargets,
  shouldExcludeTarget,
  autoDeregisterUnhealthyTargets
};
