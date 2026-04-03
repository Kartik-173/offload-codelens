const cassandraService = require('./cassandraService');

class UserEmailService {
  constructor() {
    // Using Cassandra for persistent storage
  }

  // Get user ID from JWT token (similar to other services)
  getUserIdFromToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload['cognito:username'] || 'unknown';
    } catch (e) {
      console.error('Error parsing token:', e);
      return 'unknown';
    }
  }

  // Store user email configuration in Cassandra
  async storeUserEmailConfig(accountId, emailConfig) {
    try {
      console.log(`📧 USER EMAIL SERVICE: Storing email config for account: ${accountId}`);
      
      const document = {
        account_id: accountId,
        email_from: emailConfig.fromEmail,
        email_to_emails: emailConfig.toEmails,
        email_notifications_enabled: emailConfig.emailsEnabled,
        email_check_interval: emailConfig.interval,
        created_at: new Date(),
        updated_at: new Date(),
        updated_by: 'system',
        version: 1
      };

      // Store in Cassandra
      const result = await cassandraService.insert('alb_account_settings', document);
      
      console.log(`📧 USER EMAIL SERVICE: Email config stored successfully for account: ${accountId}`);
      
      return {
        success: true,
        message: 'Email configuration saved successfully',
        config: {
          userId: accountId,
          fromEmail: emailConfig.fromEmail,
          toEmails: emailConfig.toEmails,
          emailsEnabled: emailConfig.emailsEnabled,
          interval: emailConfig.interval,
          createdAt: document.created_at.toISOString(),
          updatedAt: document.updated_at.toISOString()
        },
      };
    } catch (error) {
      console.error(`📧 USER EMAIL SERVICE: Failed to store email config for account ${accountId}:`, error);
      throw error;
    }
  }

  // Get user email configuration from Cassandra
  async getUserEmailConfig(accountId) {
    try {
      console.log(`📧 USER EMAIL SERVICE: Retrieving email config for account: ${accountId}`);
      
      // Retrieve from Cassandra
      const result = await cassandraService.findOne('alb_account_settings', { account_id: accountId });
      
      if (result && result.rowLength > 0) {
        const config = result.rows[0];
        console.log(`📧 USER EMAIL SERVICE: Email config found for account: ${accountId}`);
        
        return {
          success: true,
          message: 'Email configuration found',
          data: {
            userId: accountId,
            fromEmail: config.email_from,
            toEmails: config.email_to_emails,
            emailsEnabled: config.email_notifications_enabled,
            interval: config.email_check_interval,
            createdAt: config.created_at,
            updatedAt: config.updated_at
          }
        };
      } else {
        console.log(`📧 USER EMAIL SERVICE: No email config found for account: ${accountId}`);
        return {
          success: false,
          message: 'No email configuration found',
          data: null
        };
      }
    } catch (error) {
      console.error(`📧 USER EMAIL SERVICE: Failed to retrieve email config for account ${accountId}:`, error);
      throw error;
    }
  }

  // Update user email configuration
  async updateUserEmailConfig(accountId, emailConfig) {
    try {
      console.log(`📧 USER EMAIL SERVICE: Updating email config for account: ${accountId}`);
      
      const document = {
        account_id: accountId,
        email_from: emailConfig.fromEmail,
        email_to_emails: emailConfig.toEmails,
        email_notifications_enabled: emailConfig.emailsEnabled,
        email_check_interval: emailConfig.interval,
        updated_at: new Date(),
        updated_by: 'system',
        version: 1
      };

      // Update in Cassandra using UPSERT
      const result = await cassandraService.insert('alb_account_settings', document);
      
      console.log(`📧 USER EMAIL SERVICE: Email config updated successfully for account: ${accountId}`);
      
      return {
        success: true,
        message: 'Email configuration updated successfully',
        data: {
          userId: accountId,
          fromEmail: emailConfig.fromEmail,
          toEmails: emailConfig.toEmails,
          emailsEnabled: emailConfig.emailsEnabled,
          interval: emailConfig.interval,
          updatedAt: document.updated_at.toISOString()
        }
      };
    } catch (error) {
      console.error(`📧 USER EMAIL SERVICE: Failed to update email config for account ${accountId}:`, error);
      throw error;
    }
  }

  // Delete user email configuration
  async deleteUserEmailConfig(accountId) {
    try {
      console.log(`📧 USER EMAIL SERVICE: Deleting email config for account: ${accountId}`);
      
      const result = await cassandraService.delete('alb_account_settings', { account_id: accountId });
      
      console.log(`📧 USER EMAIL SERVICE: Email config deleted successfully for account: ${accountId}`);
      
      return {
        success: true,
        message: 'Email configuration deleted successfully',
      };
    } catch (error) {
      console.error(`📧 USER EMAIL SERVICE: Failed to delete email config for account ${accountId}:`, error);
      throw error;
    }
  }

  // Get user emails for sending (used by email service)
  async getUserEmailsForSending(accountId) {
    try {
      const response = await this.getUserEmailConfig(accountId);
      
      if (!response.success || !response.data) {
        console.log(`📧 USER EMAIL SERVICE: No email config found for account: ${accountId}`);
        return null;
      }

      const config = response.data;
      
      if (!config.emailsEnabled || !config.toEmails || config.toEmails.length === 0) {
        console.log(`📧 USER EMAIL SERVICE: Email notifications disabled or no recipients for account: ${accountId}`);
        return null;
      }

      console.log(`📧 USER EMAIL SERVICE: Found ${config.toEmails.length} email recipients for account: ${accountId}`);
      
      return {
        fromEmail: config.fromEmail,
        toEmails: config.toEmails,
        emailsEnabled: config.emailsEnabled,
      };
    } catch (error) {
      console.error(`📧 USER EMAIL SERVICE: Failed to get user emails for sending for account ${accountId}:`, error);
      return null;
    }
  }

  // Get all email configurations (admin function)
  async getAllEmailConfigs() {
    try {
      console.log('📧 USER EMAIL SERVICE: Retrieving all email configurations');
      
      // Retrieve all configs from Cassandra
      const result = await cassandraService.find('alb_account_settings');
      
      const configs = [];
      if (result && result.rows) {
        for (const row of result.rows) {
          if (row.email_to_emails && row.email_to_emails.length > 0) {
            configs.push({
              userId: row.account_id,
              fromEmail: row.email_from,
              toEmails: row.email_to_emails,
              emailsEnabled: row.email_notifications_enabled,
              interval: row.email_check_interval,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            });
          }
        }
      }
      
      console.log(`📧 USER EMAIL SERVICE: Retrieved ${configs.length} email configurations`);
      
      return {
        success: true,
        configs: configs,
        total: configs.length,
      };
    } catch (error) {
      console.error('📧 USER EMAIL SERVICE: Failed to retrieve all email configs:', error);
      throw error;
    }
  }

  // Get email service statistics
  async getEmailServiceStats() {
    try {
      const allConfigs = await this.getAllEmailConfigs();
      const enabledConfigs = allConfigs.configs.filter(config => config.emailsEnabled);
      
      const stats = {
        totalUsers: allConfigs.total,
        enabledUsers: enabledConfigs.length,
        disabledUsers: allConfigs.total - enabledConfigs.length,
        storageType: 'Cassandra',
      };
      
      console.log('📧 USER EMAIL SERVICE: Email service statistics:', stats);
      
      return {
        success: true,
        stats: stats,
      };
    } catch (error) {
      console.error('📧 USER EMAIL SERVICE: Failed to get email service stats:', error);
      throw error;
    }
  }
}

module.exports = new UserEmailService();
