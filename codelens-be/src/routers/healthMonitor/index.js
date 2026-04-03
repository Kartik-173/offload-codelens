const express = require('express');
const router = express.Router();
const {
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
} = require('../../controllers/healthMonitorController');

// Get health monitor status
router.get('/status', getHealthMonitorStatus);

// Start health monitor
router.post('/start', startHealthMonitor);

// Stop health monitor
router.post('/stop', stopHealthMonitor);

// Perform immediate health check
router.post('/check', performHealthCheck);

// UI-triggered unhealthy email notification
router.post('/notify-unhealthy', notifyUnhealthyFromUI);

// Add monitored region
router.post('/region/add', addMonitoredRegion);

// Remove monitored region
router.post('/region/remove', removeMonitoredRegion);

// Test email functionality
router.post('/test-email', testHealthCheckEmail);

// Email configuration endpoints
router.get('/email-config', getEmailConfig);
router.post('/email-config', updateEmailConfig);

// Test specific email types
router.post('/test-healthy-email', testHealthyEmail);
router.post('/test-unhealthy-email', testUnhealthyEmail);

// Test SES connectivity
router.post('/test-ses-connectivity', testSESConnectivity);

// Test emails with live AWS data
router.post('/test-live-email', testLiveEmail);
router.post('/test-live-deregister-email', testLiveDeregisterEmail);

module.exports = router;
