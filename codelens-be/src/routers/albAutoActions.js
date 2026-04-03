const express = require('express');
const router = express.Router();
const {
  startAutoDeregister,
  stopAutoDeregister,
  getAutoDeregisterState,
  performAutoDeregister,
  runAutoDeregisterOnDemand,
  getActiveAutoActions
} = require('../controllers/albAutoActionsController');

// Auto Deregister Routes
router.post('/deregister/start', startAutoDeregister);
router.post('/deregister/stop', stopAutoDeregister);
router.get('/deregister/state/:accountId', getAutoDeregisterState);
router.post('/deregister/perform', performAutoDeregister);
router.post('/deregister/run-on-demand', runAutoDeregisterOnDemand);

// Combined Routes
router.get('/active', getActiveAutoActions);

module.exports = router;
