const UserPreferencesService = require('../services/userPreferencesService');

class UserPreferencesController {
  // Get user ALB preferences
  static async getAlbPreferences(req, res) {
    try {
      const userId = 'test-user'; // Hardcoded for now

      const preferences = await UserPreferencesService.getAlbPreferences(userId);
      
      res.status(200).json({
        status: 'success',
        data: preferences
      });
    } catch (error) {
      console.error('Error getting ALB preferences:', error);
      res.status(500).json({
        error: {
          message: error.message || 'Failed to retrieve ALB preferences',
          code: 500
        }
      });
    }
  }

  // Update user ALB preferences
  static async updateAlbPreferences(req, res) {
    try {
      const userId = 'test-user'; // Hardcoded for now

      const { autoDeregisterEnabled } = req.body;

      // Validate input
      if (typeof autoDeregisterEnabled !== 'boolean') {
        return res.status(400).json({
          error: {
            message: 'Invalid input. autoDeregisterEnabled must be a boolean value.',
            code: 400
          }
        });
      }

      const updatedPreferences = await UserPreferencesService.updateAlbPreferences(
        userId, 
        { autoDeregisterEnabled },
        userId // User is updating their own preferences
      );
      
      res.status(200).json({
        status: 'success',
        message: 'ALB preferences updated successfully',
        data: updatedPreferences
      });
    } catch (error) {
      console.error('Error updating ALB preferences:', error);
      
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
          message: error.message || 'Failed to update ALB preferences',
          code: 500
        }
      });
    }
  }

  // Get user preference history
  static async getPreferenceHistory(req, res) {
    try {
      const userId = 'test-user'; // Hardcoded for now

      const limit = parseInt(req.query.limit) || 50;
      const history = await UserPreferencesService.getPreferenceHistory(userId, limit);
      
      res.status(200).json({
        status: 'success',
        data: {
          history,
          total: history.length
        }
      });
    } catch (error) {
      console.error('Error getting preference history:', error);
      res.status(500).json({
        error: {
          message: error.message || 'Failed to retrieve preference history',
          code: 500
        }
      });
    }
  }

  // Get ALB action statistics (admin dashboard)
  static async getAlbActionStats(req, res) {
    try {
      const userId = 'test-user'; // Hardcoded for now

      const days = parseInt(req.query.days) || 30;
      const stats = await UserPreferencesService.getAlbActionStats(days);
      
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
      const userId = 'test-user'; // Hardcoded for now

      const hours = parseInt(req.query.hours) || 24;
      const limit = parseInt(req.query.limit) || 100;
      const actions = await UserPreferencesService.getFailedActions(hours, limit);
      
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

module.exports = UserPreferencesController;
