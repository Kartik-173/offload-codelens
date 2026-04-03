const express = require('express');
const UserPreferencesController = require('../controllers/userPreferencesController');

const router = express.Router();

// User preference routes (no auth for now)
router.get('/alb-preferences', UserPreferencesController.getAlbPreferences);
router.put('/alb-preferences', UserPreferencesController.updateAlbPreferences);
router.get('/alb-preferences/history', UserPreferencesController.getPreferenceHistory);

// Admin/monitoring routes
router.get('/alb-actions/stats', UserPreferencesController.getAlbActionStats);
router.get('/alb-actions/failed', UserPreferencesController.getFailedActions);

module.exports = router;
