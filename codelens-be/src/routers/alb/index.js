const express = require('express');
const router = express.Router();
const {
  fetchAlbsWithRealTimeMetrics,
  getAlbRealTimeMetrics,
  getTargetGroupHealth,
  getAlbAccessLogs,
  getAlbDashboard,
} = require('../../controllers/albCloudWatchController');
const {
  fetchAlbsFromRegions: fetchAlbsFromMemory,
  getAlbData: getAlbDataFromMemory,
  getAlbStatistics: getAlbStatisticsFromMemory,
  startAutoRefresh: startAutoRefreshMemory,
  stopAutoRefresh: stopAutoRefreshMemory,
  getRefreshStatus: getRefreshStatusFromMemory,
  forceRefresh: forceRefreshMemory,
  deleteAlbData: deleteAlbDataFromMemory,
  getGlobalRefreshStats,
  initializeUserAlbIndex: initializeUserAlbIndexMemory,
} = require('../../controllers/albMemoryController');

// ===== CLOUDWATCH-BASED ENDPOINTS (Real-time) =====

// Fetch ALBs with real-time CloudWatch metrics (no storage)
router.post('/fetch-realtime', fetchAlbsWithRealTimeMetrics);

// Get real-time metrics for specific ALB
router.post('/metrics', getAlbRealTimeMetrics);

// Get target group health status
router.post('/target-health', getTargetGroupHealth);

// Get ALB access logs
router.post('/access-logs', getAlbAccessLogs);

// Get comprehensive ALB dashboard data
router.post('/dashboard', getAlbDashboard);

// ===== MEMORY-BASED ENDPOINTS (Auto-refresh) =====

// Initialize user ALB data (memory storage)
router.post('/initialize-memory', initializeUserAlbIndexMemory);

// Fetch ALBs from specific regions and store in memory
router.post('/fetch-memory', fetchAlbsFromMemory);

// Get ALB data from memory storage
router.get('/data-memory', getAlbDataFromMemory);

// Get ALB statistics from memory storage
router.get('/statistics-memory', getAlbStatisticsFromMemory);

// Start automatic refresh (every 5 minutes)
router.post('/auto-refresh/start-memory', startAutoRefreshMemory);

// Stop automatic refresh
router.post('/auto-refresh/stop-memory', stopAutoRefreshMemory);

// Get refresh status
router.get('/auto-refresh/status-memory', getRefreshStatusFromMemory);

// Force refresh
router.post('/force-refresh-memory', forceRefreshMemory);

// Delete ALB data from memory
router.delete('/data-memory', deleteAlbDataFromMemory);

// Get global refresh statistics (admin)
router.get('/global-refresh-stats', getGlobalRefreshStats);

module.exports = router;
