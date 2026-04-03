const { v4: uuidv4 } = require('uuid');
const { client } = require('../config/cassandra');
const cassandra = require('cassandra-driver');

class AlbActionAuditLog {
  // Log an ALB action
  static async logAction(actionData) {
    try {
      const actionId = uuidv4();
      const query = `
        INSERT INTO alb_action_audit_log 
        (action_id, user_id, action_type, resource_type, resource_id, 
         resource_arn, region, account_id, action_details, timestamp, 
         success, error_message, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        actionId,
        actionData.userId,
        actionData.actionType, // 'auto_deregister', 'manual_deregister'
        actionData.resourceType, // 'target', 'instance'
        actionData.resourceId,
        actionData.resourceArn,
        actionData.region,
        actionData.accountId,
        JSON.stringify(actionData.details || {}), // Additional details as JSON
        actionData.timestamp || new Date(),
        actionData.success !== false, // Default to true unless explicitly false
        actionData.errorMessage || null,
        actionData.ipAddress || null,
        actionData.userAgent || null
      ];
      
      await client.execute(query, params, { 
        prepare: true,
        consistency: cassandra.types.consistencies.quorum 
      });
      
      return actionId;
    } catch (error) {
      console.error('Error logging ALB action:', error);
      // Don't throw error - logging failures shouldn't break the main flow
      console.warn('⚠️ Failed to log audit entry:', error.message);
    }
  }

  // Get audit log for a specific user
  static async getByUserId(userId, limit = 100, offset = 0) {
    try {
      const query = `
        SELECT action_id, action_type, resource_type, resource_id, 
               resource_arn, region, account_id, action_details, 
               timestamp, success, error_message, ip_address, user_agent
        FROM alb_action_audit_log 
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `;
      
      const result = await client.execute(query, [userId, limit], { 
        prepare: true,
        consistency: cassandra.types.consistencies.quorum 
      });
      
      return result.rows.map(row => ({
        actionId: row.action_id,
        userId,
        actionType: row.action_type,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        resourceArn: row.resource_arn,
        region: row.region,
        accountId: row.account_id,
        details: row.action_details ? JSON.parse(row.action_details) : {},
        timestamp: row.timestamp,
        success: row.success,
        errorMessage: row.error_message,
        ipAddress: row.ip_address,
        userAgent: row.user_agent
      }));
    } catch (error) {
      console.error('Error getting audit log for user:', error);
      throw error;
    }
  }

  // Get audit log for a specific resource
  static async getByResource(resourceId, limit = 50) {
    try {
      const query = `
        SELECT action_id, user_id, action_type, resource_type, resource_id, 
               resource_arn, region, account_id, action_details, 
               timestamp, success, error_message, ip_address, user_agent
        FROM alb_action_audit_log 
        WHERE resource_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `;
      
      const result = await client.execute(query, [resourceId, limit], { 
        prepare: true,
        consistency: cassandra.types.consistencies.quorum 
      });
      
      return result.rows.map(row => ({
        actionId: row.action_id,
        userId: row.user_id,
        actionType: row.action_type,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        resourceArn: row.resource_arn,
        region: row.region,
        accountId: row.account_id,
        details: row.action_details ? JSON.parse(row.action_details) : {},
        timestamp: row.timestamp,
        success: row.success,
        errorMessage: row.error_message,
        ipAddress: row.ip_address,
        userAgent: row.user_agent
      }));
    } catch (error) {
      console.error('Error getting audit log for resource:', error);
      throw error;
    }
  }

  // Get failed actions for monitoring
  static async getFailedActions(hours = 24, limit = 100) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const query = `
        SELECT action_id, user_id, action_type, resource_type, resource_id, 
               resource_arn, region, account_id, action_details, 
               timestamp, error_message
        FROM alb_action_audit_log 
        WHERE success = false 
          AND timestamp >= ?
        ORDER BY timestamp DESC
        LIMIT ?
      `;
      
      const result = await client.execute(query, [since, limit], { 
        prepare: true,
        consistency: cassandra.types.consistencies.quorum 
      });
      
      return result.rows.map(row => ({
        actionId: row.action_id,
        userId: row.user_id,
        actionType: row.action_type,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        resourceArn: row.resource_arn,
        region: row.region,
        accountId: row.account_id,
        details: row.action_details ? JSON.parse(row.action_details) : {},
        timestamp: row.timestamp,
        errorMessage: row.error_message
      }));
    } catch (error) {
      console.error('Error getting failed actions:', error);
      throw error;
    }
  }

  // Get statistics for admin dashboard
  static async getStatistics(days = 30) {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const queries = [
        `SELECT COUNT(*) as total FROM alb_action_audit_log WHERE timestamp >= ?`,
        `SELECT COUNT(*) as failed FROM alb_action_audit_log WHERE success = false AND timestamp >= ?`,
        `SELECT COUNT(DISTINCT user_id) as unique_users FROM alb_action_audit_log WHERE timestamp >= ?`
      ];
      
      const results = await Promise.all(
        queries.map(query => 
          client.execute(query, [since], { 
            prepare: true,
            consistency: cassandra.types.consistencies.quorum 
          })
        )
      );
      
      return {
        totalActions: results[0].rows[0].total,
        failedActions: results[1].rows[0].failed,
        uniqueUsers: results[2].rows[0].unique_users,
        period: `${days} days`
      };
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      throw error;
    }
  }
}

module.exports = AlbActionAuditLog;
