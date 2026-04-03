const { client } = require('../config/cassandra');
const cassandra = require('cassandra-driver');

class AlbAutoDeregisterState {
  // Helper function to convert object to Cassandra MAP format
  static objectToMap(obj) {
    if (!obj || typeof obj !== 'object') {
      return {};
    }
    
    const map = {};
    Object.keys(obj).forEach(key => {
      // Convert all values to strings for MAP<TEXT, TEXT>
      const value = obj[key];
      if (Array.isArray(value)) {
        map[key] = JSON.stringify(value);
      } else if (typeof value === 'object' && value !== null) {
        map[key] = JSON.stringify(value);
      } else {
        map[key] = String(value);
      }
    });
    return map;
  }

  // Helper function to convert Cassandra MAP to object
  static mapToObject(map) {
    const obj = {};
    if (map && typeof map === 'object') {
      Object.keys(map).forEach(key => {
        try {
          // Try to parse as JSON, if fails keep as string
          obj[key] = JSON.parse(map[key]);
        } catch (e) {
          obj[key] = map[key];
        }
      });
    }
    return obj;
  }

  // Get auto deregister state for a specific account
  static async getByAccountId(accountId) {
    try {
      const query = `
        SELECT account_id, is_active, last_run_at, next_run_at, 
               total_processed, total_deregistered, total_excluded, 
               selected_count, protected_count, created_at, updated_at,
               run_status, error_message, config
        FROM alb_auto_deregister_state 
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
        isActive: result.rows[0].is_active,
        lastRunAt: result.rows[0].last_run_at,
        nextRunAt: result.rows[0].next_run_at,
        totalProcessed: result.rows[0].total_processed,
        totalDeregistered: result.rows[0].total_deregistered,
        totalExcluded: result.rows[0].total_excluded,
        selectedCount: result.rows[0].selected_count,
        protectedCount: result.rows[0].protected_count,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        runStatus: result.rows[0].run_status,
        errorMessage: result.rows[0].error_message,
        config: this.mapToObject(result.rows[0].config) // Convert MAP back to object
      };
    } catch (error) {
      console.error('Error getting auto deregister state:', error);
      throw error;
    }
  }

  // Create or update auto deregister state
  static async upsert(accountId, stateData) {
    try {
      const now = new Date();
      const currentState = await this.getByAccountId(accountId);
      
      console.log('🔍 AlbAutoDeregisterState.upsert called:', { accountId, stateData });
      
      if (currentState) {
        console.log('📊 Current state:', currentState);

        const configMap = stateData.config !== undefined
          ? this.objectToMap(stateData.config)
          : (this.objectToMap(currentState.config) || {});
        
        // Update existing record
        const query = `
          UPDATE alb_auto_deregister_state 
          SET config = ?, 
              created_at = ?, 
              error_message = ?, 
              is_active = ?, 
              last_run_at = ?, 
              next_run_at = ?, 
              protected_count = ?, 
              run_status = ?, 
              selected_count = ?, 
              total_deregistered = ?, 
              total_excluded = ?, 
              total_processed = ?, 
              updated_at = ?
          WHERE account_id = ?
        `;
        
        const params = [
          configMap, // config (as MAP)
          currentState.createdAt, // created_at
          stateData.errorMessage || currentState.errorMessage, // error_message
          stateData.isActive !== undefined ? stateData.isActive : currentState.isActive, // is_active
          stateData.lastRunAt || currentState.lastRunAt, // last_run_at
          stateData.nextRunAt || currentState.nextRunAt, // next_run_at
          stateData.protectedCount !== undefined ? stateData.protectedCount : currentState.protectedCount, // protected_count
          stateData.runStatus || currentState.runStatus, // run_status
          stateData.selectedCount !== undefined ? stateData.selectedCount : currentState.selectedCount, // selected_count
          stateData.totalDeregistered !== undefined ? stateData.totalDeregistered : currentState.totalDeregistered, // total_deregistered
          stateData.totalExcluded !== undefined ? stateData.totalExcluded : currentState.totalExcluded, // total_excluded
          stateData.totalProcessed !== undefined ? stateData.totalProcessed : currentState.totalProcessed, // total_processed
          now, // updated_at
          accountId
        ];
        
        console.log('🔧 Executing UPDATE query with params:', params);
        
        await client.execute(query, params, { prepare: true });
        
        console.log('✅ State updated successfully');
      } else {
        console.log('📝 Creating new record for account:', accountId);
        
        // Insert new record
        const query = `
          INSERT INTO alb_auto_deregister_state (
            account_id, is_active, last_run_at, next_run_at, total_processed, 
            total_deregistered, total_excluded, selected_count, protected_count, 
            created_at, updated_at, run_status, error_message, config
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
          accountId,                                    // account_id
          stateData.isActive !== undefined ? stateData.isActive : false, // is_active
          stateData.lastRunAt || null,                   // last_run_at
          stateData.nextRunAt || null,                   // next_run_at
          stateData.totalProcessed || 0,                 // total_processed
          stateData.totalDeregistered || 0,              // total_deregistered
          stateData.totalExcluded || 0,                  // total_excluded
          stateData.selectedCount || 0,                  // selected_count
          stateData.protectedCount || 0,                 // protected_count
          now,                                         // created_at
          now,                                         // updated_at
          stateData.runStatus || 'idle',               // run_status
          stateData.errorMessage || null,              // error_message
          (stateData.config !== undefined ? this.objectToMap(stateData.config) : {})    // config (as MAP)
        ];
        
        console.log('🔧 Executing INSERT query with params:', params);
        
        await client.execute(query, params, { prepare: true });
        
        console.log('✅ New state created successfully');
      }
      
      return await this.getByAccountId(accountId);
    } catch (error) {
      console.error('❌ Error in upsert:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  }

  // Update run statistics
  static async updateRunStats(accountId, stats) {
    try {
      // First get current state to preserve config
      const currentState = await this.getByAccountId(accountId);
      if (!currentState) {
        throw new Error('No state found for account');
      }

      // Calculate new values (can't use counter operations in Cassandra UPDATE)
      const newTotalProcessed = (currentState.totalProcessed || 0) + (stats.processed || 0);
      const newTotalDeregistered = (currentState.totalDeregistered || 0) + (stats.deregistered || 0);
      const newTotalExcluded = (currentState.totalExcluded || 0) + (stats.excluded || 0);

      const query = `
        UPDATE alb_auto_deregister_state 
        SET last_run_at = ?, 
            total_processed = ?, 
            total_deregistered = ?, 
            total_excluded = ?, 
            selected_count = ?, 
            protected_count = ?, 
            updated_at = ?,
            run_status = ?,
            error_message = ?,
            config = ?
        WHERE account_id = ?
      `;
      
      await client.execute(query, [
        new Date(),
        newTotalProcessed,
        newTotalDeregistered,
        newTotalExcluded,
        stats.selectedCount || 0,
        stats.protectedCount || 0,
        new Date(),
        stats.status || 'completed',
        stats.errorMessage || null,
        this.objectToMap(currentState.config) || {},
        accountId
      ], { prepare: true });
      
      return await this.getByAccountId(accountId);
    } catch (error) {
      console.error('Error updating run stats:', error);
      throw error;
    }
  }

  // Get all active auto deregister states
  static async getAllActive() {
    try {
      const query = `
        SELECT account_id, is_active, last_run_at, next_run_at, 
               total_processed, total_deregistered, total_excluded, 
               selected_count, protected_count, created_at, updated_at,
               run_status, error_message, config
        FROM alb_auto_deregister_state 
        WHERE is_active = true
        ALLOW FILTERING
      `;
      const result = await client.execute(query, [], { 
        prepare: true,
        consistency: cassandra.types.consistencies.quorum 
      });
      
      return result.rows.map(row => ({
        accountId: row.account_id,
        isActive: row.is_active,
        lastRunAt: row.last_run_at,
        nextRunAt: row.next_run_at,
        totalProcessed: row.total_processed,
        totalDeregistered: row.total_deregistered,
        totalExcluded: row.total_excluded,
        selectedCount: row.selected_count,
        protectedCount: row.protected_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        runStatus: row.run_status,
        errorMessage: row.error_message,
        config: this.mapToObject(row.config) // Convert MAP back to object
      }));
    } catch (error) {
      console.error('Error getting all active auto deregister states:', error);
      throw error;
    }
  }

  // Delete auto deregister state for an account
  static async delete(accountId) {
    try {
      const query = 'DELETE FROM alb_auto_deregister_state WHERE account_id = ?';
      await client.execute(query, [accountId], { prepare: true });
    } catch (error) {
      console.error('Error deleting auto deregister state:', error);
      throw error;
    }
  }
}

module.exports = AlbAutoDeregisterState;
