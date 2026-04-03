import axios from 'axios';
import { ENV } from '../config/env';
import APIConstants from './APIConstants';

const API_BASE_URL = ENV.API_URL;

class AlbCloudWatchApiService {
  // Fetch ALBs with real-time CloudWatch metrics (no storage)
  static async fetchAlbsWithRealTimeMetrics(regions, credentials) {
    try {
      const token = localStorage.getItem('id_token') || localStorage.getItem('token');
      
      console.log('🚀 AlbCloudWatchApiService sending request with credentials:');
      console.log('🔑 Account ID:', credentials.accountId);
      console.log('🔑 Access Key (first 4):', credentials.accessKeyId?.substring(0, 4) + '...');
      console.log('🔑 Secret Key (first 4):', credentials.secretAccessKey?.substring(0, 4) + '...');
      console.log('🔑 Session Token:', !!credentials.sessionToken);
      console.log('🔑 Force Refresh:', credentials._forceRefresh);
      console.log('🔑 Account Switch:', credentials._accountSwitch);
      
      const response = await axios.post(`${API_BASE_URL}/${APIConstants.AWS_ALB.FETCH_REALTIME}`, {
        regions,
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        ...(credentials.sessionToken && { sessionToken: credentials.sessionToken }),
        accountId: credentials.accountId,
        ...(credentials._forceRefresh && { _forceRefresh: credentials._forceRefresh }),
        ...(credentials._accountSwitch && { _accountSwitch: credentials._accountSwitch }),
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 AlbCloudWatchApiService received response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching ALBs with real-time metrics:', error);
      throw error;
    }
  }

  // Get real-time metrics for specific ALB
  static async getAlbRealTimeMetrics(loadBalancerArn, region, credentials) {
    try {
      const token = localStorage.getItem('id_token') || localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/${APIConstants.AWS_ALB.METRICS}`, {
        loadBalancerArn,
        region,
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      throw error;
    }
  }

  // Get target group health status
  static async getTargetGroupHealth(targetGroupArn, region, credentials) {
    try {
      const token = localStorage.getItem('id_token') || localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/${APIConstants.AWS_ALB.TARGET_HEALTH}`, {
        targetGroupArn,
        region,
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting target group health:', error);
      throw error;
    }
  }

  // Get ALB access logs
  static async getAlbAccessLogs(loadBalancerArn, region, credentials, startTime, endTime) {
    try {
      const token = localStorage.getItem('id_token') || localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/${APIConstants.AWS_ALB.ACCESS_LOGS}`, {
        loadBalancerArn,
        region,
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        startTime,
        endTime,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting access logs:', error);
      throw error;
    }
  }

  // Get comprehensive ALB dashboard data
  static async getAlbDashboard(regions, credentials, options = {}) {
    try {
      const token = localStorage.getItem('id_token') || localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/${APIConstants.AWS_ALB.DASHBOARD}`, {
        regions,
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        includeLogs: options.includeLogs || false,
        timeRange: options.timeRange || '1h',
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting ALB dashboard:', error);
      throw error;
    }
  }

  // Helper method to format CloudWatch metrics for UI display
  static formatMetricsForUI(metrics) {
    if (!metrics) return null;

    console.log('📊 Formatting metrics for UI:', metrics);

    return {
      requestCount: {
        value: metrics.requestCount?.value || 0,
        unit: metrics.requestCount?.unit || 'Count',
        timestamp: metrics.requestCount?.timestamp,
        status: metrics.requestCount?.status || 'unknown',
      },
      errors: {
        clientErrors: metrics.clientErrors?.value || 0,
        serverErrors: metrics.serverErrors?.value || 0,
        total: (metrics.clientErrors?.value || 0) + (metrics.serverErrors?.value || 0),
        unit: metrics.clientErrors?.unit || 'Count',
      },
      latency: {
        average: metrics.latency?.value || 0,
        unit: metrics.latency?.unit || 'Seconds',
        status: metrics.latency?.status || 'unknown',
      },
      connections: {
        active: metrics.activeConnections?.value || 0,
        unit: metrics.activeConnections?.unit || 'Count',
        status: metrics.activeConnections?.status || 'unknown',
      },
      bandwidth: {
        processedBytes: metrics.processedBytes?.value || 0,
        unit: metrics.processedBytes?.unit || 'Bytes',
        status: metrics.processedBytes?.status || 'unknown',
      },
      timestamp: metrics.timestamp,
    };
  }

  // Helper method to format target health for UI display
  static formatTargetHealthForUI(targetHealth) {
    if (!targetHealth) return null;

    return {
      targetGroupArn: targetHealth.targetGroupArn,
      region: targetHealth.region,
      timestamp: targetHealth.timestamp,
      summary: targetHealth.summary,
      targets: targetHealth.targets.map(target => ({
        id: target.targetId,
        port: target.port,
        availabilityZone: target.availabilityZone,
        health: target.health,
        reason: target.reason,
        description: target.description,
        status: this.getTargetStatus(target.health),
        color: this.getTargetStatusColor(target.health),
      })),
    };
  }

  // Helper method to get target status display text
  static getTargetStatus(health) {
    const statusMap = {
      'healthy': 'Healthy',
      'unhealthy': 'Unhealthy',
      'draining': 'Draining',
      'unused': 'Unused',
      'unknown': 'Unknown',
    };
    return statusMap[health] || 'Unknown';
  }

  // Helper method to get target status color
  static getTargetStatusColor(health) {
    const colorMap = {
      'healthy': 'success',
      'unhealthy': 'error',
      'draining': 'warning',
      'unused': 'default',
      'unknown': 'default',
    };
    return colorMap[health] || 'default';
  }

  // Helper method to calculate ALB overall health
  static calculateAlbHealth(targetGroups) {
    if (!targetGroups || targetGroups.length === 0) {
      return { status: 'unknown', color: 'default', text: 'No Target Groups' };
    }

    const totalTargets = targetGroups.reduce((sum, tg) => sum + (tg.summary?.total || 0), 0);
    const healthyTargets = targetGroups.reduce((sum, tg) => sum + (tg.summary?.healthy || 0), 0);
    const unhealthyTargets = targetGroups.reduce((sum, tg) => sum + (tg.summary?.unhealthy || 0), 0);

    if (totalTargets === 0) {
      return { status: 'unknown', color: 'default', text: 'No Targets' };
    }

    const healthPercentage = (healthyTargets / totalTargets) * 100;

    if (healthPercentage === 100) {
      return { status: 'healthy', color: 'success', text: 'All Targets Healthy' };
    } else if (healthPercentage >= 80) {
      return { status: 'warning', color: 'warning', text: `${Math.round(healthPercentage)}% Healthy` };
    } else {
      return { status: 'unhealthy', color: 'error', text: `${Math.round(healthPercentage)}% Healthy` };
    }
  }

  // Helper method to format access logs for UI
  static formatAccessLogsForUI(logs) {
    if (!logs) return null;

    return {
      loadBalancerArn: logs.loadBalancerArn,
      region: logs.region,
      logGroupName: logs.logGroupName,
      timestamp: logs.timestamp,
      events: logs.events.map(event => ({
        timestamp: event.timestamp,
        message: event.message,
        logStreamName: event.logStreamName,
        parsed: this.parseLogEntry(event.message),
      })),
      summary: logs.summary,
    };
  }

  // Helper method to parse a single log entry
  static parseLogEntry(logMessage) {
    try {
      // Basic ALB access log parsing
      const parts = logMessage.split(' ');
      
      return {
        timestamp: parts[0] || '',
        elb: parts[1] || '',
        client: parts[2] || '',
        backend: parts[3] || '',
        requestProcessingTime: parts[4] || '',
        targetProcessingTime: parts[5] || '',
        responseProcessingTime: parts[6] || '',
        elbStatusCode: parts[7] || '',
        targetStatusCode: parts[8] || '',
        receivedBytes: parts[9] || '',
        sentBytes: parts[10] || '',
        request: parts.slice(11, -2).join(' ') || '',
        userAgent: parts[parts.length - 2] || '',
        sslCipher: parts[parts.length - 1] || '',
      };
    } catch (error) {
      return {
        error: 'Failed to parse log entry',
        rawMessage: logMessage,
      };
    }
  }
}

export default AlbCloudWatchApiService;
