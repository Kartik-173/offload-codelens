const express = require('express');
const router = express.Router();
const {
  getUserEmailConfig,
  storeUserEmailConfig,
  updateUserEmailConfig,
  deleteUserEmailConfig,
} = require('../../controllers/userEmailController');

// Get user email configuration
router.get('/config', getUserEmailConfig);

// Store user email configuration
router.post('/config', storeUserEmailConfig);

// Update user email configuration
router.put('/config', updateUserEmailConfig);

// Delete user email configuration
router.delete('/config', deleteUserEmailConfig);

module.exports = router;
