const { client } = require('../config/cassandra');
const cassandra = require('cassandra-driver');

class AlbAccountSettings {
  // Get ALB settings for a specific account
  static async getByAccountId(accountId) {
    try {
      const query = `
        SELECT account_id, auto_deregister_enabled, 
               created_at, updated_at, updated_by, version
        FROM alb_account_settings 
        WHERE account_id = ?
      `;
      const result = await client.execute(query, [accountId], { 
        prepare: true,
        consistency: cassandra.types.consistencies.quorum 
      });
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return {
        accountId: result.rows[0].account_id,
        autoDeregisterEnabled: result.rows[0].auto_deregister_enabled,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        updatedBy: result.rows[0].updated_by,
        version: result.rows[0].version
      };
    } catch (error) {
      console.error('Error getting ALB account settings:', error);
      throw error;
    }
  }

  // Create or update ALB account settings with optimistic locking
  static async upsert(accountId, settings, updatedBy = null) {
    try {
      const now = new Date();
      const currentSettings = await this.getByAccountId(accountId);
      
      if (currentSettings) {
        // Update with version check (optimistic locking)
        const query = `
          UPDATE alb_account_settings 
          SET auto_deregister_enabled = ?, 
              updated_at = ?, 
              updated_by = ?,
              version = version + 1
          WHERE account_id = ? 
          IF version = ?
        `;
        
        const params = [
          settings.autoDeregisterEnabled,
          now,
          updatedBy || 'system',
          accountId,
          currentSettings.version
        ];
        
        const result = await client.execute(query, params, { 
          prepare: true,
          consistency: cassandra.types.consistencies.quorum 
        });
        
        if (!result.rows[0]['[applied]']) {
          throw new Error('Concurrent modification detected. Please refresh and try again.');
        }
        
        return {
          ...currentSettings,
          autoDeregisterEnabled: settings.autoDeregisterEnabled,
          updatedAt: now,
          updatedBy: updatedBy || 'system',
          version: currentSettings.version + 1
        };
      } else {
        // Insert new settings
        const query = `
          INSERT INTO alb_account_settings 
          (account_id, auto_deregister_enabled, 
           created_at, updated_at, updated_by, version)
          VALUES (?, ?, ?, ?, ?, 1)
        `;
        
        const params = [
          accountId,
          settings.autoDeregisterEnabled,
          now,
          now,
          updatedBy || 'system'
        ];
        
        await client.execute(query, params, { 
          prepare: true,
          consistency: cassandra.types.consistencies.quorum 
        });
        
        return {
          accountId,
          autoDeregisterEnabled: settings.autoDeregisterEnabled,
          createdAt: now,
          updatedAt: now,
          updatedBy: updatedBy || 'system',
          version: 1
        };
      }
    } catch (error) {
      console.error('Error upserting ALB account settings:', error);
      throw error;
    }
  }

  // Delete ALB account settings
  static async delete(accountId) {
    try {
      const query = 'DELETE FROM alb_account_settings WHERE account_id = ?';
      await client.execute(query, [accountId], { 
        prepare: true,
        consistency: cassandra.types.consistencies.quorum 
      });
      return true;
    } catch (error) {
      console.error('Error deleting ALB account settings:', error);
      throw error;
    }
  }

  // Get all accounts with auto-deregister enabled
  static async getAccountsWithAutoDeregisterEnabled() {
    try {
      const query = `
        SELECT account_id, updated_at, updated_by 
        FROM alb_account_settings 
        WHERE auto_deregister_enabled = true 
        ALLOW FILTERING
      `;
      const result = await client.execute(query, [], { 
        prepare: true,
        consistency: cassandra.types.consistencies.quorum 
      });
      
      return result.rows.map(row => ({
        accountId: row.account_id,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by
      }));
    } catch (error) {
      console.error('Error getting accounts with auto-deregister enabled:', error);
      throw error;
    }
  }

  // Bulk disable auto-deregister for all accounts (emergency function)
  static async bulkDisableAutoDeregister(updatedBy = 'system_admin') {
    try {
      const query = `
        UPDATE alb_account_settings 
        SET auto_deregister_enabled = false, 
            updated_at = ?, 
            updated_by = ?
        WHERE auto_deregister_enabled = true
      `;
      
      await client.execute(query, [new Date(), updatedBy], { 
        prepare: true,
        consistency: cassandra.types.consistencies.quorum 
      });
      
      return true;
    } catch (error) {
      console.error('Error bulk disabling auto-deregister:', error);
      throw error;
    }
  }

  // Get settings for multiple accounts (batch operation)
  static async getByAccountIds(accountIds) {
    try {
      const query = `
        SELECT account_id, auto_deregister_enabled, 
               created_at, updated_at, updated_by, version
        FROM alb_account_settings 
        WHERE account_id IN ?
      `;
      const result = await client.execute(query, [accountIds], { 
        prepare: true,
        consistency: cassandra.types.consistencies.quorum 
      });
      
      return result.rows.map(row => ({
        accountId: row.account_id,
        autoDeregisterEnabled: row.auto_deregister_enabled,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by,
        version: row.version
      }));
    } catch (error) {
      console.error('Error getting batch ALB account settings:', error);
      throw error;
    }
  }
}

module.exports = AlbAccountSettings;
