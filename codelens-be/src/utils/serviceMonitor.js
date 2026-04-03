const axios = require('axios');
const client = require('prom-client');
const config = require('../config/env.js');

// Create connection status metrics
const connectionStatusGauge = new client.Gauge({
  name: 'service_connection_status',
  help: 'Service connection status (1 = connected, 0 = disconnected)',
  labelNames: ['service', 'component']
});

const connectionDuration = new client.Histogram({
  name: 'service_connection_duration_seconds',
  help: 'Time taken to check service connection',
  labelNames: ['service', 'component'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
});

class ServiceMonitor {
  constructor() {
    this.services = {
      vault: {
        url: config.VAULT_ADDR,
        check: this.checkVault.bind(this)
      },
      sonar: {
        url: config.SONAR_HOST_URL,
        check: this.checkSonar.bind(this)
      },
      n8n: {
        url: config.N8N_ADDR,
        check: this.checkN8N.bind(this)
      },
      opensearch: {
        url: config.OPEN_SEARCH_URL,
        check: this.checkOpenSearch.bind(this)
      }
    };
    this.status = {};
    this.checkInterval = null;
    this.serviceName = config.SERVICE_NAME;
  }

  async checkVault() {
    try {
      const response = await axios.get(`${this.services.vault.url}/v1/sys/health`, {
        headers: { 'X-Vault-Token': config.VAULT_TOKEN },
        timeout: 5000
      });
      return { success: true, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async checkSonar() {
    try {
      const response = await axios.get(`${this.services.sonar.url}/api/system/status`, {
        timeout: 5000
      });
      return { success: true, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async checkN8N() {
    try {
      const response = await axios.get(`${this.services.n8n.url}/healthz`, {
        timeout: 5000
      });
      return { success: true, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async checkOpenSearch() {
    try {
      const response = await axios.get(`${this.services.opensearch.url}/`, {
        auth: {
          username: config.OPEN_SEARCH_USERNAME,
          password: config.OPEN_SEARCH_PASSWORD
        },
        timeout: 5000
      });
      return { success: true, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async checkService(serviceName) {
    const start = Date.now();
    const service = this.services[serviceName];
    
    if (!service) {
      return { success: false, error: 'Service not configured' };
    }

    try {
      const result = await service.check();
      const duration = (Date.now() - start) / 1000;
      
      // Update metrics
      connectionStatusGauge.set({ 
        service: this.serviceName, 
        component: serviceName 
      }, result.success ? 1 : 0);
      
      connectionDuration.observe({ 
        service: this.serviceName, 
        component: serviceName 
      }, duration);

      this.status[serviceName] = {
        isHealthy: result.success,
        lastCheck: new Date(),
        url: service.url,
        error: result.error || null,
        duration: duration
      };

      if ((config.LOG_LEVEL || '').toLowerCase() === 'debug') {
        console.log(`${serviceName} connection check`, {
          success: result.success,
          duration: `${duration}ms`,
          error: result.error
        });
      }

      return result;

    } catch (error) {
      const duration = (Date.now() - start) / 1000;
      
      connectionStatusGauge.set({ 
        service: this.serviceName, 
        component: serviceName 
      }, 0);
      
      connectionDuration.observe({ 
        service: this.serviceName, 
        component: serviceName 
      }, duration);

      this.status[serviceName] = {
        isHealthy: false,
        lastCheck: new Date(),
        url: service.url,
        error: error.message,
        duration: duration
      };

      if ((config.LOG_LEVEL || '').toLowerCase() === 'debug') {
        console.error(`${serviceName} connection check failed`, {
          error: error.message,
          duration: `${duration}ms`
        });
      }

      return { success: false, error: error.message };
    }
  }

  async checkAllServices() {
    const promises = Object.keys(this.services).map(service => 
      this.checkService(service)
    );
    
    await Promise.allSettled(promises);
  }

  start(intervalSeconds = 30) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    if ((config.LOG_LEVEL || '').toLowerCase() === 'debug') {
      console.log('Starting service connection monitor', {
        services: Object.keys(this.services),
        interval: `${intervalSeconds}s`
      });
    }

    // Initial check
    this.checkAllServices();

    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.checkAllServices();
    }, intervalSeconds * 1000);
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      if ((config.LOG_LEVEL || '').toLowerCase() === 'debug') {
        console.log('Service connection monitor stopped');
      }
    }
  }

  getStatus() {
    return this.status;
  }

  getServiceStatus(serviceName) {
    return this.status[serviceName] || { isHealthy: false, lastCheck: null };
  }
}

// Create singleton instance
const serviceMonitor = new ServiceMonitor();

module.exports = serviceMonitor;
