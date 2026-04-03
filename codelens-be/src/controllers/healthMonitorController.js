const HealthMonitorService = require('../services/healthMonitorService');
const emailService = require('../services/emailService');
const userEmailService = require('../services/userEmailService');
const UserTargetSelections = require('../models/userTargetSelections');

// Create a singleton instance
const healthMonitor = new HealthMonitorService();

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

// Get health monitor status
const getHealthMonitorStatus = (req, res) => {
  try {
    const status = healthMonitor.getStatus();
    res.status(200).json({
      status: 'success',
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message,
        code: 500,
      },
    });
  }
};

// Trigger unhealthy email from UI-provided unhealthy targets
const notifyUnhealthyFromUI = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token) || userEmailService.getUserIdFromToken(token);

    const { unhealthyTargets, totalTargets } = req.body || {};

    if (!Array.isArray(unhealthyTargets) || unhealthyTargets.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'unhealthyTargets must be a non-empty array',
          code: 400,
        },
      });
    }

    const normalizeUnhealthyTarget = (t) => {
      const id = t?.id ?? t?.Id ?? t?.targetId ?? t?.TargetId;
      const port = t?.port ?? t?.Port ?? t?.targetPort ?? t?.TargetPort;
      const health = t?.health ?? t?.Health ?? t?.state ?? t?.State ?? 'unknown';
      const targetGroupName = t?.targetGroupName ?? t?.TargetGroupName ?? t?.tgName ?? t?.targetGroup ?? 'Unknown';
      const targetGroupArn = t?.targetGroupArn ?? t?.TargetGroupArn ?? null;
      const albName = t?.albName ?? t?.LoadBalancerName ?? t?.loadBalancerName ?? t?.albDisplayName ?? t?.lbName ?? 'Unknown';
      const reason = t?.reason ?? t?.Reason ?? 'No reason provided';
      const description = t?.description ?? t?.Description ?? t?.targetDescription ?? 'No description available';
      const severity = t?.severity ?? t?.Severity ?? null;

      return {
        ...t,
        id,
        port,
        health,
        reason,
        description,
        severity,
        targetGroupName,
        targetGroupArn,
        albName,
      };
    };

    const normalizedUnhealthyTargets = unhealthyTargets.map(normalizeUnhealthyTarget);

    // Filter out protected (selected + excluded) targets for the CURRENT user
    // This avoids another user's saved selections globally suppressing UI-triggered alerts.
    // Protected = selectedTargets OR excludedFromAutoDeregister (matches UI logic)
    let unprotectedTargets = normalizedUnhealthyTargets;
    try {
      const protectedKeys = new Set();

      const sel = userId ? await UserTargetSelections.getByUserId(userId) : null;
      const allProtected = [
        ...(sel?.excludedFromAutoDeregister || []),
        ...(sel?.selectedTargets || [])
      ];

      allProtected.forEach(t => {
        const targetId = t.targetId || t.id;
        const port = t.port;
        protectedKeys.add(`${targetId}-${port}`);
      });

      console.log(`🛡️  NOTIFY UI: Protected keys for user ${userId || 'unknown'}: [${Array.from(protectedKeys).join(', ')}]`);

      unprotectedTargets = normalizedUnhealthyTargets.filter(t => {
        const targetId = t.id || t.targetId;
        const port = t.port;
        const key = `${targetId}-${port}`;
        const isProtected = protectedKeys.has(key);
        if (isProtected) {
          console.log(`🛡️  NOTIFY UI: Skipping protected ${key}`);
        }
        return !isProtected;
      });

      console.log(`🛡️  NOTIFY UI: ${normalizedUnhealthyTargets.length} total unhealthy, ${unprotectedTargets.length} unprotected`);
    } catch (selErr) {
      console.warn('Failed to load target selections for protection check:', selErr.message);
    }

    if (unprotectedTargets.length === 0) {
      console.log('🛡️  NOTIFY UI: All unhealthy targets are protected - no email sent');
      return res.status(200).json({
        status: 'success',
        message: 'All unhealthy targets are protected - no email sent',
        data: {
          unhealthyTargetsCount: normalizedUnhealthyTargets.length,
          protectedCount: normalizedUnhealthyTargets.length,
          unprotectedCount: 0,
        },
      });
    }

    const safeTotalTargets = Number.isFinite(Number(totalTargets))
      ? Number(totalTargets)
      : unprotectedTargets.length;

    // Send using Cassandra email configs (account_id). Token userId is Cognito sub and may not map
    // to alb_account_settings, so we broadcast to all enabled email configs.
    const allConfigs = await userEmailService.getAllEmailConfigs();
    const enabledUsers = (allConfigs?.configs || []).filter(cfg => cfg && cfg.emailsEnabled);

    if (enabledUsers.length === 0) {
      console.log('🛡️  NOTIFY UI: No users have email alerts enabled; skipping send');
      return res.status(200).json({
        status: 'success',
        message: 'No users have email alerts enabled; no email sent',
        data: {
          unhealthyTargetsCount: unprotectedTargets.length,
          protectedCount: normalizedUnhealthyTargets.length - unprotectedTargets.length,
          enabledUsers: 0,
        },
      });
    }

    const results = [];
    for (const cfg of enabledUsers) {
      const r = await emailService.sendCustomHealthCheckEmail(
        'UNHEALTHY',
        unprotectedTargets,
        safeTotalTargets,
        cfg.userId
      );
      results.push({ userId: cfg.userId, messageId: r?.MessageId });
    }

    res.status(200).json({
      status: 'success',
      message: 'Unhealthy email sent (UI trigger)',
      data: {
        results,
        triggeredByUserId: userId || null,
        unhealthyTargetsCount: unprotectedTargets.length,
        protectedCount: normalizedUnhealthyTargets.length - unprotectedTargets.length,
      },
    });
  } catch (error) {
    console.error('Failed to send UI-triggered unhealthy email:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to send UI-triggered unhealthy email',
        code: 500,
      },
    });
  }
};

// Start health monitor
const startHealthMonitor = (req, res) => {
  try {
    healthMonitor.start();
    console.log('Health monitor started via API call');
    res.status(200).json({
      status: 'success',
      message: 'Health monitor started successfully',
      data: healthMonitor.getStatus(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message,
        code: 500,
      },
    });
  }
};

// Stop health monitor
const stopHealthMonitor = (req, res) => {
  try {
    healthMonitor.stop();
    console.log('Health monitor stopped via API call');
    res.status(200).json({
      status: 'success',
      message: 'Health monitor stopped successfully',
      data: healthMonitor.getStatus(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message,
        code: 500,
      },
    });
  }
};

// Perform immediate health check
const performHealthCheck = async (req, res) => {
  try {
    console.log('Manual health check triggered via API');
    await healthMonitor.performHealthCheck();
    
    res.status(200).json({
      status: 'success',
      message: 'Health check completed successfully',
      data: {
        timestamp: new Date().toISOString(),
        status: healthMonitor.getStatus(),
      },
    });
  } catch (error) {
    console.error('Manual health check failed:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message,
        code: 500,
      },
    });
  }
};

// Add monitored region
const addMonitoredRegion = (req, res) => {
  try {
    const { region } = req.body;
    
    if (!region) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'Region is required',
          code: 400,
        },
      });
    }

    healthMonitor.addRegion(region);
    
    res.status(200).json({
      status: 'success',
      message: `Region ${region} added to monitoring`,
      data: healthMonitor.getStatus(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message,
        code: 500,
      },
    });
  }
};

// Remove monitored region
const removeMonitoredRegion = (req, res) => {
  try {
    const { region } = req.body;
    
    if (!region) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'Region is required',
          code: 400,
        },
      });
    }

    healthMonitor.removeRegion(region);
    
    res.status(200).json({
      status: 'success',
      message: `Region ${region} removed from monitoring`,
      data: healthMonitor.getStatus(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message,
        code: 500,
      },
    });
  }
};

// Test email functionality
const testHealthCheckEmail = async (req, res) => {
  try {
    const emailService = require('../services/emailService');
    
    // Create a test unhealthy target
    const testTargets = [
      {
        id: 'i-test123456789',
        port: 80,
        health: 'unhealthy',
        reason: 'Target.FailedHealthChecks',
        description: 'Test unhealthy target for email verification',
        targetGroupName: 'test-target-group',
        targetGroupArn: 'arn:aws:elasticloadbalancing:ap-south-1:123456789012:targetgroup/test-target-group/1234567890abcdef',
        albName: 'test-alb',
        albDisplayName: 'Test Load Balancer',
        region: 'ap-south-1',
        targetType: 'instance',
        severity: 'medium',
        timestamp: new Date().toISOString(),
      }
    ];

    await emailService.sendHealthCheckAlert(testTargets, 5);
    
    console.log('Test health check email sent successfully');
    res.status(200).json({
      status: 'success',
      message: 'Test email sent successfully',
      data: {
        timestamp: new Date().toISOString(),
        testTargetsCount: testTargets.length,
      },
    });
  } catch (error) {
    console.error('Failed to send test email:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message,
        code: 500,
      },
    });
  }
};

// Get current email configuration
const getEmailConfig = (req, res) => {
  try {
    const config = {
      fromEmail: process.env.SES_FROM_EMAIL,
      emailsEnabled: process.env.ENABLE_HEALTH_CHECK_EMAILS === 'true',
      interval: process.env.HEALTH_CHECK_INTERVAL_MINUTES || '5',
    };
    
    res.status(200).json({
      status: 'success',
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message,
        code: 500,
      },
    });
  }
};

// Update email configuration
const updateEmailConfig = (req, res) => {
  try {
    const { toEmails, emailsEnabled, interval } = req.body;
    
    if (!toEmails || !Array.isArray(toEmails) || toEmails.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'At least one recipient email is required',
          code: 400,
        },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = toEmails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: `Invalid email format: ${invalidEmails.join(', ')}`,
          code: 400,
        },
      });
    }

    // Update environment variables (note: this won't persist across restarts)
    process.env.ENABLE_HEALTH_CHECK_EMAILS = emailsEnabled ? 'true' : 'false';
    if (interval) {
      process.env.HEALTH_CHECK_INTERVAL_MINUTES = interval.toString();
    }

    const config = {
      fromEmail: process.env.SES_FROM_EMAIL,
      toEmails: toEmails,
      emailsEnabled: emailsEnabled,
      interval: interval || process.env.HEALTH_CHECK_INTERVAL_MINUTES || '5',
    };
    
    console.log('Email configuration updated:', config);
    
    res.status(200).json({
      status: 'success',
      message: 'Email configuration updated successfully',
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message,
        code: 500,
      },
    });
  }
};

// Test healthy email
const testHealthyEmail = async (req, res) => {
  try {
    // Get user ID from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    console.log('Testing healthy email for user:', userId);

    const emailService = require('../services/emailService');
    
    // Create test healthy targets
    const testTargets = [
      {
        id: 'i-healthy123456789',
        port: 80,
        health: 'healthy',
        reason: 'Target.Healthy',
        description: 'Test healthy target for email verification',
        targetGroupName: 'test-healthy-target-group',
        targetGroupArn: 'arn:aws:elasticloadbalancing:ap-south-1:123456789012:targetgroup/test-healthy-target-group/1234567890abcdef',
        albName: 'test-alb',
        albDisplayName: 'Test Load Balancer',
        region: 'ap-south-1',
      },
    ];

    const result = await emailService.sendCustomHealthCheckEmail('HEALTHY', testTargets, testTargets.length, userId);

    res.status(200).json({
      status: 'success',
      message: 'Test healthy email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Failed to send test healthy email:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to send test healthy email',
        code: 500,
      },
    });
  }
};

// Test unhealthy email
const testUnhealthyEmail = async (req, res) => {
  try {
    // Get user ID from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    
    console.log('Testing unhealthy email for user:', userId);

    // Create test unhealthy targets
    const testTargets = [
      {
        targetGroupArn: 'arn:aws:elasticloadbalancing:ap-south-1:654654634301:targetgroup/test-unhealthy-tg/1234567890abcdef',
        targetGroupName: 'test-unhealthy-tg',
        loadBalancerArn: 'arn:aws:elasticloadbalancing:ap-south-1:654654634301:loadbalancer/app/test-lb/1234567890abcdef',
        loadBalancerName: 'test-lb',
        targetId: 'i-1234567890abcdef0',
        port: 80,
        health: 'unhealthy',
        reason: 'Target.FailedHealthChecks',
        description: 'The load balancer does not have permission to invoke the Lambda function',
        availabilityZone: 'ap-south-1a',
        lastSeen: new Date().toISOString(),
        region: 'ap-south-1',
        targetType: 'instance',
        severity: 'critical',
        timestamp: new Date().toISOString(),
      }
    ];

    const result = await emailService.sendCustomHealthCheckEmail('UNHEALTHY', testTargets, testTargets.length, userId);
    
    console.log('Test unhealthy email sent successfully');
    res.status(200).json({
      status: 'success',
      message: 'Test unhealthy email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Failed to send test unhealthy email:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to send test unhealthy email',
        code: 500,
      },
    });
  }
};

// Test SES connectivity
const testSESConnectivity = async (req, res) => {
  try {
    const emailService = require('../services/emailService');
    
    console.log('Starting SES connectivity test...');
    const result = await emailService.testSESConnectivity();
    
    if (result.success) {
      res.status(200).json({
        status: 'success',
        message: 'SES connectivity test successful',
        data: result,
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'SES connectivity test failed',
        data: result,
      });
    }
  } catch (error) {
    console.error('Failed to test SES connectivity:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message,
        code: 500,
      },
    });
  }
};

// Test email with live AWS data
const testLiveEmail = async (req, res) => {
  try {
    console.log('🧪 Testing email with live AWS data...');
    
    const { userId } = req.body || {};
    
    // Import required services
    const HealthMonitorService = require('../services/healthMonitorService');
    const healthMonitor = new HealthMonitorService();
    
    // Get live healthy targets from AWS
    const liveHealthyTargets = await healthMonitor.getAllHealthyTargets();
    
    if (liveHealthyTargets.length === 0) {
      return res.status(200).json({
        status: 'info',
        message: 'No healthy targets found in AWS account',
        data: {
          targetsFound: 0,
          suggestion: 'Make sure you have healthy targets in your ALBs before testing'
        }
      });
    }
    
    console.log(`🧪 Found ${liveHealthyTargets.length} live healthy targets for email test`);
    console.log('🧪 Sample target data:', liveHealthyTargets[0]);
    
    // Send email with live data
    const emailService = require('../services/emailService');
    const result = await emailService.sendCustomHealthCheckEmail('HEALTHY', liveHealthyTargets, liveHealthyTargets.length, userId);
    
    res.status(200).json({
      status: 'success',
      message: `Test email sent successfully with ${liveHealthyTargets.length} live targets`,
      data: {
        targetsCount: liveHealthyTargets.length,
        sampleTargets: liveHealthyTargets.slice(0, 3).map(t => ({
          id: t.id,
          targetGroupName: t.targetGroupName,
          albDisplayName: t.albDisplayName,
          port: t.port,
          health: t.health
        })),
        emailResult: result
      }
    });
    
  } catch (error) {
    console.error('Failed to send test live email:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to send test live email',
        code: 500,
        details: error.stack
      }
    });
  }
};

// Test deregistration email with live data
const testLiveDeregisterEmail = async (req, res) => {
  try {
    console.log('🧪 Testing deregistration email with live AWS data...');
    
    const { userId } = req.body || {};
    
    // Import required services
    const HealthMonitorService = require('../services/healthMonitorService');
    const healthMonitor = new HealthMonitorService();
    
    // Get live unhealthy targets from AWS
    const liveUnhealthyTargets = await healthMonitor.getAllUnhealthyTargets();
    
    if (liveUnhealthyTargets.length === 0) {
      return res.status(200).json({
        status: 'info',
        message: 'No unhealthy targets found in AWS account',
        data: {
          targetsFound: 0,
          suggestion: 'Create some unhealthy targets or use mock data for testing'
        }
      });
    }
    
    console.log(`🧪 Found ${liveUnhealthyTargets.length} live unhealthy targets for deregister email test`);
    
    // Send deregistration email with live data
    const emailService = require('../services/emailService');
    const firstTarget = liveUnhealthyTargets[0];
    
    // Create targets list for email
    const emailTargets = liveUnhealthyTargets.slice(0, 5).map(target => ({
      targetGroupName: target.targetGroupName,
      albDisplayName: target.albDisplayName,
      id: target.id,
      port: target.port,
      health: 'unhealthy',
      targetType: target.targetType || 'INSTANCE'
    }));
    
    const result = await emailService.sendDeregisterSuccessEmail({
      userId: userId || 'test-user',
      region: firstTarget.region || 'ap-south-1',
      targetGroupArn: firstTarget.targetGroupArn,
      targetId: firstTarget.id,
      targetPort: firstTarget.port,
      targetName: firstTarget.targetGroupName || firstTarget.id,
      unhealthyDeletedCount: emailTargets.length,
      healthyCount: 10, // Mock healthy count
      allTargets: emailTargets,
      totalTargets: emailTargets.length,
      useProvidedData: true
    });
    
    res.status(200).json({
      status: 'success',
      message: `Test deregistration email sent successfully with ${emailTargets.length} live targets`,
      data: {
        targetsCount: emailTargets.length,
        sampleTargets: emailTargets.slice(0, 3),
        emailResult: result
      }
    });
    
  } catch (error) {
    console.error('Failed to send test live deregister email:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to send test live deregister email',
        code: 500,
        details: error.stack
      }
    });
  }
};

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

// Export the health monitor instance for use in app.js
module.exports = {
  healthMonitor,
  getHealthMonitorStatus,
  startHealthMonitor,
  stopHealthMonitor,
  performHealthCheck,
  notifyUnhealthyFromUI,
  addMonitoredRegion,
  removeMonitoredRegion,
  testHealthCheckEmail,
  getEmailConfig,
  updateEmailConfig,
  testHealthyEmail,
  testUnhealthyEmail,
  testSESConnectivity,
  testLiveEmail,
  testLiveDeregisterEmail,
};
