const AlbAccountSettingsService = require('../services/albAccountSettingsService');

class AlbAccountSettingsController {
  // Get ALB settings for a specific account
  static async getAccountSettings(req, res) {
    try {
      const { accountId } = req.params;
      
      if (!accountId) {
        return res.status(400).json({
          error: {
            message: 'Account ID is required',
            code: 400
          }
        });
      }

      const settings = await AlbAccountSettingsService.getAccountSettings(accountId);
      
      res.status(200).json({
        status: 'success',
        data: settings
      });
    } catch (error) {
      console.error('Error getting ALB account settings:', error);
      res.status(500).json({
        error: {
          message: error.message || 'Failed to retrieve ALB account settings',
          code: 500
        }
      });
    }
  }

  // Update ALB account settings
  static async updateAccountSettings(req, res) {
    try {
      const { accountId } = req.params;
      const { autoDeregisterEnabled } = req.body;
      
      if (!accountId) {
        return res.status(400).json({
          error: {
            message: 'Account ID is required',
            code: 400
          }
        });
      }

      // Validate input
      if (typeof autoDeregisterEnabled !== 'boolean') {
        return res.status(400).json({
          error: {
            message: 'Invalid input. autoDeregisterEnabled must be a boolean value.',
            code: 400
          }
        });
      }

      const updatedSettings = await AlbAccountSettingsService.updateAccountSettings(
        accountId, 
        { autoDeregisterEnabled },
        'test-user' // Hardcoded for now
      );
      
      res.status(200).json({
        status: 'success',
        message: 'ALB account settings updated successfully',
        data: updatedSettings
      });
    } catch (error) {
      console.error('Error updating ALB account settings:', error);
      
      if (error.message.includes('cannot be enabled without')) {
        return res.status(400).json({
          error: {
            message: error.message,
            code: 400
          }
        });
      }
      
      if (error.message.includes('Concurrent modification')) {
        return res.status(409).json({
          error: {
            message: error.message,
            code: 409
          }
        });
      }
      
      res.status(500).json({
        error: {
          message: error.message || 'Failed to update ALB account settings',
          code: 500
        }
      });
    }
  }

  // Get settings for multiple accounts (batch operation)
  static async getBatchAccountSettings(req, res) {
    try {
      const { accountIds } = req.body;
      
      if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return res.status(400).json({
          error: {
            message: 'Account IDs array is required',
            code: 400
          }
        });
      }

      const settings = await AlbAccountSettingsService.getBatchAccountSettings(accountIds);
      
      res.status(200).json({
        status: 'success',
        data: settings
      });
    } catch (error) {
      console.error('Error getting batch ALB account settings:', error);
      res.status(500).json({
        error: {
          message: error.message || 'Failed to retrieve batch ALB account settings',
          code: 500
        }
      });
    }
  }

  // Log ALB action (used by ALB manager for audit)
  static async logAlbAction(req, res) {
    try {
      const actionData = req.body;
      
      if (!actionData.accountId || !actionData.actionType) {
        return res.status(400).json({
          error: {
            message: 'Account ID and action type are required',
            code: 400
          }
        });
      }

      const actionId = await AlbAccountSettingsService.logAlbAction(actionData);
      
      res.status(200).json({
        status: 'success',
        message: 'ALB action logged successfully',
        data: { actionId }
      });
    } catch (error) {
      console.error('Error logging ALB action:', error);
      res.status(500).json({
        error: {
          message: error.message || 'Failed to log ALB action',
          code: 500
        }
      });
    }
  }

  // Admin: Get accounts with auto-deregister enabled
  static async getAccountsWithAutoDeregisterEnabled(req, res) {
    try {
      const accounts = await AlbAccountSettingsService.getAccountsWithAutoDeregisterEnabled();
      
      res.status(200).json({
        status: 'success',
        data: {
          accounts,
          total: accounts.length
        }
      });
    } catch (error) {
      console.error('Error getting accounts with auto-deregister enabled:', error);
      res.status(500).json({
        error: {
          message: error.message || 'Failed to retrieve accounts with auto-deregister enabled',
          code: 500
        }
      });
    }
  }


  // Admin: Bulk disable auto-deregister (emergency function)
  static async bulkDisableAutoDeregister(req, res) {
    try {
      const { adminUserId } = req.body;
      
      if (!adminUserId) {
        return res.status(400).json({
          error: {
            message: 'Admin user ID is required',
            code: 400
          }
        });
      }

      const result = await AlbAccountSettingsService.bulkDisableAutoDeregister(adminUserId);
      
      res.status(200).json({
        status: 'success',
        message: 'Auto-deregister has been disabled for all accounts',
        data: result
      });
    } catch (error) {
      console.error('Error in bulk disable auto-deregister:', error);
      res.status(500).json({
        error: {
          message: error.message || 'Failed to bulk disable auto-deregister',
          code: 500
        }
      });
    }
  }

  // Get ALB action statistics (admin dashboard)
  static async getAlbActionStats(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;
      const stats = await AlbAccountSettingsService.getAlbActionStats(days);
      
      res.status(200).json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      console.error('Error getting ALB action statistics:', error);
      res.status(500).json({
        error: {
          message: error.message || 'Failed to retrieve ALB action statistics',
          code: 500
        }
      });
    }
  }

  // Get failed actions (monitoring)
  static async getFailedActions(req, res) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const limit = parseInt(req.query.limit) || 100;
      const actions = await AlbAccountSettingsService.getFailedActions(hours, limit);
      
      res.status(200).json({
        status: 'success',
        data: {
          actions,
          total: actions.length
        }
      });
    } catch (error) {
      console.error('Error getting failed actions:', error);
      res.status(500).json({
        error: {
          message: error.message || 'Failed to retrieve failed actions',
          code: 500
        }
      });
    }
  }
}

module.exports = AlbAccountSettingsController;
