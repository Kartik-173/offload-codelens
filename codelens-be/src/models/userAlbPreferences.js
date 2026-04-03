const { client } = require('../config/cassandra');

class UserAlbPreferences {
  // Get user preferences
  static async getByUserId(userId) {
    try {
      const query = `
        SELECT user_id, auto_deregister_enabled, 
               created_at, updated_at, updated_by, version
        FROM user_alb_preferences 
        WHERE user_id = ?
      `;
      const result = await client.execute(query, [userId], { 
        prepare: true,
        consistency: cassandra.types.consistencies.quorum 
      });
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return {
        userId: result.rows[0].user_id,
        autoDeregisterEnabled: result.rows[0].auto_deregister_enabled,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        updatedBy: result.rows[0].updated_by,
        version: result.rows[0].version
      };
    } catch (error) {
      console.error('Error getting user ALB preferences:', error);
      throw error;
    }
  }

  // Create or update user preferences with optimistic locking
  static async upsert(userId, preferences, updatedBy = null) {
    try {
      const now = new Date();
      const currentPrefs = await this.getByUserId(userId);
      
      if (currentPrefs) {
        // Update with version check (optimistic locking)
        const query = `
          UPDATE user_alb_preferences 
          SET auto_deregister_enabled = ?, 
              updated_at = ?, 
              updated_by = ?,
              version = version + 1
          WHERE user_id = ? 
          IF version = ?
        `;
        
        const params = [
          preferences.autoDeregisterEnabled,
          now,
          updatedBy || userId,
          userId,
          currentPrefs.version
        ];
        
        const result = await client.execute(query, params, { 
          prepare: true,
          consistency: cassandra.types.consistencies.quorum 
        });
        
        if (!result.rows[0]['[applied]']) {
          throw new Error('Concurrent modification detected. Please refresh and try again.');
        }
        
        return {
          ...currentPrefs,
          autoDeregisterEnabled: preferences.autoDeregisterEnabled,
          updatedAt: now,
          updatedBy: updatedBy || userId,
          version: currentPrefs.version + 1
        };
      } else {
        // Insert new preferences
        const query = `
          INSERT INTO user_alb_preferences 
          (user_id, auto_deregister_enabled, 
           created_at, updated_at, updated_by, version)
          VALUES (?, ?, ?, ?, ?, 1)
        `;
        
        const params = [
          userId,
          preferences.autoDeregisterEnabled,
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
          autoDeregisterEnabled: preferences.autoDeregisterEnabled,
          createdAt: now,
          updatedAt: now,
          updatedBy: updatedBy || userId,
          version: 1
        };
      }
    } catch (error) {
      console.error('Error upserting user ALB preferences:', error);
      throw error;
    }
  }

  // Delete user preferences
  static async delete(userId) {
    try {
      const query = 'DELETE FROM user_alb_preferences WHERE user_id = ?';
      await client.execute(query, [userId], { 
        prepare: true,
        consistency: cassandra.types.consistencies.quorum 
      });
      return true;
    } catch (error) {
      console.error('Error deleting user ALB preferences:', error);
      throw error;
    }
  }
}

module.exports = UserAlbPreferences;
