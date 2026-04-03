const express = require('express');
const router = express.Router();
const AlbAutoDeregisterState = require('../models/albAutoDeregisterState');

// Get latest auto-deregister activity for UI refresh
router.get('/latest/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const state = await AlbAutoDeregisterState.getByAccountId(accountId);
    if (!state) {
      return res.json({
        success: true,
        data: {
          hasNewActivity: false,
          lastRunAt: null,
          totalDeregistered: 0
        }
      });
    }
    
    // Return if there's been activity since the last client check
    const clientLastCheck = req.query.lastCheck ? new Date(req.query.lastCheck) : new Date(0);
    const hasNewActivity = state.lastRunAt && new Date(state.lastRunAt) > clientLastCheck;
    
    res.json({
      success: true,
      data: {
        hasNewActivity,
        lastRunAt: state.lastRunAt,
        totalDeregistered: state.totalDeregistered,
        totalProcessed: state.totalProcessed,
        runStatus: state.runStatus,
        errorMessage: state.errorMessage
      }
    });
  } catch (error) {
    console.error('Error getting latest auto-deregister activity:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to get latest activity',
        code: 500
      }
    });
  }
});

module.exports = router;
