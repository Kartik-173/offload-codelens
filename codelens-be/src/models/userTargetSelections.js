const { client } = require('../config/cassandra');
const cassandra = require('cassandra-driver');

class UserTargetSelections {
  // Get user target selections
  static async getByUserId(userId) {
    try {
      const query = `
        SELECT user_id, selected_targets, excluded_from_auto_deregister, 
               created_at, updated_at, updated_by, version
        FROM user_target_selections 
        WHERE user_id = ?
      `;
      const result = await client.execute(query, [userId], { 
        prepare: true,
        consistency: cassandra.types.consistencies.quorum 
      });
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        userId: row.user_id,
        selectedTargets: typeof row.selected_targets === 'string' ? JSON.parse(row.selected_targets || '[]') : (row.selected_targets || []),
        excludedFromAutoDeregister: typeof row.excluded_from_auto_deregister === 'string' ? JSON.parse(row.excluded_from_auto_deregister || '[]') : (row.excluded_from_auto_deregister || []),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by,
        version: row.version
      };
    } catch (error) {
      console.error('Error getting user target selections:', error);
      throw error;
    }
  }

  // Create or update user target selections with optimistic locking
  static async upsert(userId, selections, updatedBy = null) {
    try {
      const now = new Date();
      const currentSelections = await this.getByUserId(userId);
      
      if (currentSelections) {
        // Update with version check (optimistic locking)
        const query = `
          UPDATE user_target_selections 
          SET selected_targets = ?,
              excluded_from_auto_deregister = ?,
              updated_at = ?,
              updated_by = ?,
              version = version + 1
          WHERE user_id = ? 
          IF version = ?
        `;
        
        const params = [
          JSON.stringify(selections.selectedTargets || []),
          JSON.stringify(selections.excludedFromAutoDeregister || []),
          now,
          updatedBy || userId,
          userId,
          currentSelections.version
        ];
        
        const result = await client.execute(query, params, { 
          prepare: true,
          consistency: cassandra.types.consistencies.quorum 
        });
        
        if (!result.rows[0]['[applied]']) {
          throw new Error('Concurrent modification detected. Please refresh and try again.');
        }
        
        return {
          userId,
          selectedTargets: typeof selections.selectedTargets === 'string' ? JSON.parse(selections.selectedTargets) : (selections.selectedTargets || []),
          excludedFromAutoDeregister: typeof selections.excludedFromAutoDeregister === 'string' ? JSON.parse(selections.excludedFromAutoDeregister) : (selections.excludedFromAutoDeregister || []),
          createdAt: currentSelections.createdAt,
          updatedAt: now,
          updatedBy: updatedBy || userId,
          version: currentSelections.version + 1
        };
      } else {
        // Insert new selections
        const query = `
          INSERT INTO user_target_selections 
          (user_id, selected_targets, excluded_from_auto_deregister, 
           created_at, updated_at, updated_by, version)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `;
        
        const params = [
          userId,
          JSON.stringify(selections.selectedTargets || []),
          JSON.stringify(selections.excludedFromAutoDeregister || []),
          now,
          now,
          updatedBy || userId
        ];
        
        await client.execute(query, params, { 
          prepare: true,
          consistency: cassandra.types.consistencies.quorum 
        });
        
        return {
          userId,
          selectedTargets: selections.selectedTargets || [],
          excludedFromAutoDeregister: selections.excludedFromAutoDeregister || [],
          createdAt: now,
          updatedAt: now,
          updatedBy: updatedBy || userId,
          version: 1
        };
      }
    } catch (error) {
      console.error('Error upserting user target selections:', error);
      throw error;
    }
  }

  // Add target to excluded list (prevent auto-deregistration)
  static async addToExcludedList(userId, targetInfo, updatedBy = null) {
    try {
      const current = await this.getByUserId(userId) || { 
        userId, 
        excludedFromAutoDeregister: [],
        selectedTargets: []
      };
      
      // Check if target is already in excluded list
      const targetKey = `${targetInfo.targetId}-${targetInfo.port}`;
      const alreadyExcluded = current.excludedFromAutoDeregister.some(
        target => `${target.targetId}-${target.port}` === targetKey
      );
      
      if (!alreadyExcluded) {
        current.excludedFromAutoDeregister.push({
          ...targetInfo,
          addedAt: new Date(),
          addedBy: updatedBy || userId
        });
        
        return await this.upsert(userId, current, updatedBy);
      }
      
      return current;
    } catch (error) {
      console.error('Error adding target to excluded list:', error);
      throw error;
    }
  }

  // Remove target from excluded list
  static async removeFromExcludedList(userId, targetId, port, updatedBy = null) {
    try {
      const current = await this.getByUserId(userId);
      if (!current) return null;
      
      current.excludedFromAutoDeregister = current.excludedFromAutoDeregister.filter(
        target => !(target.targetId === targetId && target.port === port)
      );
      
      return await this.upsert(userId, current, updatedBy);
    } catch (error) {
      console.error('Error removing target from excluded list:', error);
      throw error;
    }
  }

  // Check if target is excluded from auto-deregistration
  static async isTargetExcluded(userId, targetId, port) {
    try {
      const selections = await this.getByUserId(userId);
      if (!selections) return false;
      
      return selections.excludedFromAutoDeregister.some(
        target => target.targetId === targetId && target.port === port
      );
    } catch (error) {
      console.error('Error checking if target is excluded:', error);
      return false;
    }
  }

  // Get all excluded targets for a user
  static async getExcludedTargets(userId) {
    try {
      const selections = await this.getByUserId(userId);
      return selections ? selections.excludedFromAutoDeregister : [];
    } catch (error) {
      console.error('Error getting excluded targets:', error);
      return [];
    }
  }

  // Get ALL target selections across all users
  static async getAll() {
    try {
      const query = `
        SELECT user_id, selected_targets, excluded_from_auto_deregister
        FROM user_target_selections
      `;
      const result = await client.execute(query, [], {
        prepare: true,
        consistency: cassandra.types.consistencies.quorum
      });

      return result.rows.map(row => ({
        userId: row.user_id,
        selectedTargets: typeof row.selected_targets === 'string' ? JSON.parse(row.selected_targets || '[]') : (row.selected_targets || []),
        excludedFromAutoDeregister: typeof row.excluded_from_auto_deregister === 'string' ? JSON.parse(row.excluded_from_auto_deregister || '[]') : (row.excluded_from_auto_deregister || []),
      }));
    } catch (error) {
      console.error('Error getting all user target selections:', error);
      return [];
    }
  }

  // Delete user target selections
  static async delete(userId) {
    try {
      const query = 'DELETE FROM user_target_selections WHERE user_id = ?';
      await client.execute(query, [userId], { 
        prepare: true,
        consistency: cassandra.types.consistencies.quorum 
      });
      return true;
    } catch (error) {
      console.error('Error deleting user target selections:', error);
      throw error;
    }
  }
}

module.exports = UserTargetSelections;
