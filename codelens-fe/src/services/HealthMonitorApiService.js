import axios from 'axios';
import { ENV } from '../config/env';
import APIConstants from './APIConstants';

const API_BASE_URL = ENV.API_BASE_URL;

class HealthMonitorApiService {
  // Helper method to get auth headers
  static getAuthHeaders() {
    const token = localStorage.getItem('id_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Get health monitor status
  static async getHealthMonitorStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/${APIConstants.HEALTH_MONITOR.STATUS}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get health monitor status:', error);
      throw error;
    }
  }

  // Start health monitor
  static async startHealthMonitor() {
    try {
      const response = await axios.post(`${API_BASE_URL}/${APIConstants.HEALTH_MONITOR.START}`, {}, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to start health monitor:', error);
      throw error;
    }
  }

  // Stop health monitor
  static async stopHealthMonitor() {
    try {
      const response = await axios.post(`${API_BASE_URL}/${APIConstants.HEALTH_MONITOR.STOP}`, {}, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to stop health monitor:', error);
      throw error;
    }
  }

  // Perform manual health check
  static async performHealthCheck() {
    try {
      const response = await axios.post(`${API_BASE_URL}/${APIConstants.HEALTH_MONITOR.CHECK}`, {}, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to perform health check:', error);
      throw error;
    }
  }

  // UI-triggered unhealthy email
  static async notifyUnhealthyFromUI({ unhealthyTargets, totalTargets }) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/${APIConstants.HEALTH_MONITOR.NOTIFY_UNHEALTHY}`,
        { unhealthyTargets, totalTargets },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to send UI-triggered unhealthy email:', error);
      throw error;
    }
  }

  // Add monitored region
  static async addMonitoredRegion(region) {
    try {
      const response = await axios.post(`${API_BASE_URL}/${APIConstants.HEALTH_MONITOR.ADD_REGION}`, { region }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to add monitored region:', error);
      throw error;
    }
  }

  // Remove monitored region
  static async removeMonitoredRegion(region) {
    try {
      const response = await axios.post(`${API_BASE_URL}/${APIConstants.HEALTH_MONITOR.REMOVE_REGION}`, { region }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to remove monitored region:', error);
      throw error;
    }
  }

  // Get email configuration
  static async getEmailConfig() {
    try {
      const response = await axios.get(`${API_BASE_URL}/${APIConstants.HEALTH_MONITOR.GET_EMAIL_CONFIG}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get email config:', error);
      throw error;
    }
  }

  // Update email configuration
  static async updateEmailConfig(config) {
    try {
      const response = await axios.post(`${API_BASE_URL}/${APIConstants.HEALTH_MONITOR.UPDATE_EMAIL_CONFIG}`, config, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update email config:', error);
      throw error;
    }
  }

  // Test healthy email
  static async testHealthyEmail() {
    try {
      const response = await axios.post(`${API_BASE_URL}/${APIConstants.HEALTH_MONITOR.TEST_HEALTHY_EMAIL}`, {}, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send test healthy email:', error);
      throw error;
    }
  }

  // Test unhealthy email
  static async testUnhealthyEmail() {
    try {
      const response = await axios.post(`${API_BASE_URL}/${APIConstants.HEALTH_MONITOR.TEST_UNHEALTHY_EMAIL}`, {}, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send test unhealthy email:', error);
      throw error;
    }
  }

  // Test general email (legacy)
  static async testEmail() {
    try {
      const response = await axios.post(`${API_BASE_URL}/${APIConstants.HEALTH_MONITOR.TEST_EMAIL}`, {}, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send test email:', error);
      throw error;
    }
  }

  // Test SES connectivity
  static async testSESConnectivity() {
    try {
      const response = await axios.post(`${API_BASE_URL}/${APIConstants.HEALTH_MONITOR.TEST_SES_CONNECTIVITY}`, {}, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to test SES connectivity:', error);
      throw error;
    }
  }
}

export default HealthMonitorApiService;
