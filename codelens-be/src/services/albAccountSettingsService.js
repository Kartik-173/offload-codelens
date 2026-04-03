const AlbAccountSettings = require('../models/albAccountSettings');
const AlbActionAuditLog = require('../models/albActionAuditLog');

class AlbAccountSettingsService {
  // Get ALB settings for a specific account
  static async getAccountSettings(accountId) {
    try {
      const settings = await AlbAccountSettings.getByAccountId(accountId);
      
      // Return defaults if no settings exist
      if (!settings) {
        return {
          accountId,
          autoDeregisterEnabled: false
        };
      }
      
      return {
        accountId: settings.accountId,
        autoDeregisterEnabled: settings.autoDeregisterEnabled,
        updatedAt: settings.updatedAt,
        updatedBy: settings.updatedBy
      };
    } catch (error) {
      console.error('Error getting ALB account settings:', error);
      throw new Error('Failed to retrieve ALB account settings');
    }
  }

  // Update ALB account settings
  static async updateAccountSettings(accountId, settings, updatedBy = null) {
    try {
      // Validate input
      if (typeof settings.autoDeregisterEnabled !== 'boolean') {
        throw new Error('Invalid setting values. autoDeregisterEnabled must be boolean.');
      }

      // Update settings
      const updatedSettings = await AlbAccountSettings.upsert(accountId, {
        autoDeregisterEnabled: settings.autoDeregisterEnabled
      }, updatedBy);

      // Log the setting change
      await AlbActionAuditLog.logAction({
        accountId,
        actionType: 'settings_update',
        resourceType: 'account_settings',
        resourceId: accountId,
        details: {
          oldSettings: {
            autoDeregisterEnabled: updatedSettings.autoDeregisterEnabled !== settings.autoDeregisterEnabled
          },
          newSettings: settings,
          changedBy: updatedBy || 'system'
        },
        timestamp: new Date(),
        success: true
      });

      return {
        accountId: updatedSettings.accountId,
        autoDeregisterEnabled: updatedSettings.autoDeregisterEnabled,
        updatedAt: updatedSettings.updatedAt,
        updatedBy: updatedSettings.updatedBy
      };
    } catch (error) {
      console.error('Error updating ALB account settings:', error);
      
      // Log failed attempt
      await AlbActionAuditLog.logAction({
        accountId,
        actionType: 'settings_update',
        resourceType: 'account_settings',
        resourceId: accountId,
        details: {
          attemptedSettings: settings,
          error: error.message
        },
        timestamp: new Date(),
        success: false,
        errorMessage: error.message
      });
      
      throw error;
    }
  }

  // Get settings for multiple accounts (batch operation)
  static async getBatchAccountSettings(accountIds) {
    try {
      const settings = await AlbAccountSettings.getByAccountIds(accountIds);
      
      // Create a map for easy lookup and add defaults for missing accounts
      const settingsMap = {};
      accountIds.forEach(accountId => {
        const existingSetting = settings.find(s => s.accountId === accountId);
        if (existingSetting) {
          settingsMap[accountId] = {
            accountId: existingSetting.accountId,
            autoDeregisterEnabled: existingSetting.autoDeregisterEnabled,
            updatedAt: existingSetting.updatedAt,
            updatedBy: existingSetting.updatedBy
          };
        } else {
          settingsMap[accountId] = {
            accountId,
            autoDeregisterEnabled: false
          };
        }
      });
      
      return settingsMap;
    } catch (error) {
      console.error('Error getting batch ALB account settings:', error);
      throw new Error('Failed to retrieve batch ALB account settings');
    }
  }

  // Get all accounts with auto-deregister enabled
  static async getAccountsWithAutoDeregisterEnabled() {
    try {
      return await AlbAccountSettings.getAccountsWithAutoDeregisterEnabled();
    } catch (error) {
      console.error('Error getting accounts with auto-deregister enabled:', error);
      throw new Error('Failed to retrieve accounts with auto-deregister enabled');
    }
  }

  // Admin function: Bulk disable auto-deregister (emergency)
  static async bulkDisableAutoDeregister(adminUserId) {
    try {
      // Log admin action
      await AlbActionAuditLog.logAction({
        accountId: 'system',
        actionType: 'admin_bulk_disable_auto_deregister',
        resourceType: 'system',
        resourceId: 'all_accounts',
        details: {
          action: 'bulk_disable_auto_deregister',
          performedBy: adminUserId
        },
        timestamp: new Date(),
        success: true
      });

      // Perform bulk disable
      const result = await AlbAccountSettings.bulkDisableAutoDeregister(adminUserId);
      
      return {
        success: true,
        message: 'Auto-deregister has been disabled for all accounts',
        performedBy: adminUserId,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error in bulk disable auto-deregister:', error);
      
      // Log failed attempt
      await AlbActionAuditLog.logAction({
        accountId: 'system',
        actionType: 'admin_bulk_disable_auto_deregister',
        resourceType: 'system',
        resourceId: 'all_accounts',
        details: {
          action: 'bulk_disable_auto_deregister',
          error: error.message
        },
        timestamp: new Date(),
        success: false,
        errorMessage: error.message
      });
      
      throw new Error('Failed to bulk disable auto-deregister');
    }
  }

  // Get ALB action statistics for admin dashboard
  static async getAlbActionStats(days = 30) {
    try {
      return await AlbActionAuditLog.getStatistics(days);
    } catch (error) {
      console.error('Error getting ALB action statistics:', error);
      throw new Error('Failed to retrieve ALB action statistics');
    }
  }

  // Get failed actions for monitoring
  static async getFailedActions(hours = 24, limit = 100) {
    try {
      return await AlbActionAuditLog.getFailedActions(hours, limit);
    } catch (error) {
      console.error('Error getting failed actions:', error);
      throw new Error('Failed to retrieve failed actions');
    }
  }

  // Log ALB action (used by ALB manager for audit)
  static async logAlbAction(actionData) {
    try {
      return await AlbActionAuditLog.logAction(actionData);
    } catch (error) {
      // Don't throw - logging failures shouldn't break main flow
      console.warn('Failed to log ALB action:', error.message);
    }
  }

}

module.exports = AlbAccountSettingsService;
