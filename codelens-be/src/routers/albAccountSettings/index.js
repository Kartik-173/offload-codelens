const express = require('express');
const AlbAccountSettingsController = require('../../controllers/albAccountSettingsController');

const router = express.Router();

// Account settings routes (no auth for now)
router.get('/settings/:accountId', AlbAccountSettingsController.getAccountSettings);
router.put('/settings/:accountId', AlbAccountSettingsController.updateAccountSettings);
router.post('/batch-settings', AlbAccountSettingsController.getBatchAccountSettings);
router.post('/actions/log', AlbAccountSettingsController.logAlbAction);

// Admin/monitoring routes
router.get('/accounts/auto-deregister-enabled', AlbAccountSettingsController.getAccountsWithAutoDeregisterEnabled);
router.post('/bulk-disable-auto-deregister', AlbAccountSettingsController.bulkDisableAutoDeregister);
router.get('/actions/stats', AlbAccountSettingsController.getAlbActionStats);
router.get('/actions/failed', AlbAccountSettingsController.getFailedActions);

module.exports = router;
