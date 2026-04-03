const AlbAutoDeregisterService = require('../services/albAutoDeregisterService');

// Helper function to get user ID from token
function getUserIdFromToken(token) {
  try {
    if (!token) {
      console.log('No token provided');
      return 'unknown';
    }
    
    // Remove "Bearer " prefix if present
    const cleanToken = token.replace(/^Bearer\s+/, '');
    
    if (!cleanToken || cleanToken === 'undefined' || cleanToken === 'null') {
      console.log('Invalid token format');
      return 'unknown';
    }
    
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      console.log('Token does not have 3 parts');
      return 'unknown';
    }
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || payload['cognito:username'] || 'unknown';
  } catch (e) {
    console.error('Error parsing token:', e.message);
    return 'unknown';
  }
}

// Auto Deregister Controllers

// Start auto deregister
const startAutoDeregister = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    const { accountId, config } = req.body;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Account ID is required',
          code: 400
        }
      });
    }
    
    console.log(`🚀 Starting auto deregister for account: ${accountId}, user: ${userId}`);
    
    const result = await AlbAutoDeregisterService.startAutoDeregister(accountId, {
      ...config,
      userId
    });
    
    res.status(200).json({
      success: true,
      message: 'Auto deregister started successfully',
      data: result
    });
  } catch (error) {
    console.error('Failed to start auto deregister:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to start auto deregister',
        code: 500
      }
    });
  }
};

// Stop auto deregister
const stopAutoDeregister = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    const { accountId } = req.body;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Account ID is required',
          code: 400
        }
      });
    }
    
    console.log(`⏹️ Stopping auto deregister for account: ${accountId}, user: ${userId}`);
    
    const result = await AlbAutoDeregisterService.stopAutoDeregister(accountId);
    
    res.status(200).json({
      success: true,
      message: 'Auto deregister stopped successfully',
      data: result
    });
  } catch (error) {
    console.error('Failed to stop auto deregister:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to stop auto deregister',
        code: 500
      }
    });
  }
};

// Get auto deregister state
const getAutoDeregisterState = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Account ID is required',
          code: 400
        }
      });
    }
    
    const result = await AlbAutoDeregisterService.getState(accountId);
    
    res.status(200).json({
      success: true,
      message: 'Auto deregister state retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Failed to get auto deregister state:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to get auto deregister state',
        code: 500
      }
    });
  }
};

// Perform auto deregister run
const performAutoDeregister = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    const { accountId, credentials, regions } = req.body;
    
    if (!accountId || !credentials) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Account ID and credentials are required',
          code: 400
        }
      });
    }
    
    console.log(`🔄 Performing auto deregister for account: ${accountId}, user: ${userId}`);
    
    const result = await AlbAutoDeregisterService.performAutoDeregister(accountId, {
      ...credentials,
      userId
    }, regions);
    
    res.status(200).json({
      success: true,
      message: 'Auto deregister completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Failed to perform auto deregister:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to perform auto deregister',
        code: 500
      }
    });
  }
};

// Run auto deregister on-demand (called on page refresh)
const runAutoDeregisterOnDemand = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = getUserIdFromToken(token);
    const { accountId, credentials, regions } = req.body;
    
    if (!accountId || !credentials) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Account ID and credentials are required',
          code: 400
        }
      });
    }
    
    console.log(`🔄 Running on-demand auto deregister for account: ${accountId}, user: ${userId}`);
    
    const result = await AlbAutoDeregisterService.runOnDemand(accountId, {
      ...credentials,
      userId
    }, regions);
    
    res.status(200).json({
      success: true,
      message: 'On-demand auto deregister completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Failed to run on-demand auto deregister:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to run on-demand auto deregister',
        code: 500
      }
    });
  }
};

// Get all active auto actions
const getActiveAutoActions = async (req, res) => {
  try {
    const activeDeregister = await AlbAutoDeregisterService.getActiveAccounts();
    
    res.status(200).json({
      success: true,
      message: 'Active auto actions retrieved successfully',
      data: {
        autoDeregister: activeDeregister.accounts,
      }
    });
  } catch (error) {
    console.error('Failed to get active auto actions:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to get active auto actions',
        code: 500
      }
    });
  }
};

module.exports = {
  // Auto Deregister
  startAutoDeregister,
  stopAutoDeregister,
  getAutoDeregisterState,
  performAutoDeregister,
  runAutoDeregisterOnDemand,
  
  // Combined
  getActiveAutoActions
};
