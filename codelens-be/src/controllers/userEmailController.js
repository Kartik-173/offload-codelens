const userEmailService = require('../services/userEmailService');

// Get user email configuration
const getUserEmailConfig = async (req, res) => {
  try {
    const { accountId } = req.query;
    
    if (!accountId) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'Account ID is required',
          code: 400,
        },
      });
    }

    const response = await userEmailService.getUserEmailConfig(accountId);
    
    if (response.success) {
      res.status(200).json({
        status: 'success',
        data: response.data,
      });
    } else {
      res.status(404).json({
        status: 'error',
        error: {
          message: response.message,
          code: 404,
        },
      });
    }
  } catch (error) {
    console.error('Failed to get user email config:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to get email configuration',
        code: 500,
      },
    });
  }
};

// Store user email configuration
const storeUserEmailConfig = async (req, res) => {
  try {
    const { accountId, fromEmail, toEmails, emailsEnabled, interval } = req.body;

    // Validate input
    if (!accountId) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'Account ID is required',
          code: 400,
        },
      });
    }

    if (!fromEmail) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'From email is required',
          code: 400,
        },
      });
    }

    if (!toEmails || !Array.isArray(toEmails) || toEmails.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'At least one recipient email is required',
          code: 400,
        },
      });
    }

    const normalizedToEmails = toEmails
      .filter((v) => typeof v === 'string')
      .map((v) => v.trim())
      .filter(Boolean);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = normalizedToEmails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: `Invalid email format: ${invalidEmails.join(', ')}`,
          code: 400,
        },
      });
    }

    const emailConfig = {
      fromEmail,
      toEmails: normalizedToEmails,
      emailsEnabled: emailsEnabled !== false, // default to true
      interval: interval || 5,
    };

    const response = await userEmailService.storeUserEmailConfig(accountId, emailConfig);
    
    res.status(200).json({
      status: 'success',
      message: response.message,
      data: response.config,
    });
  } catch (error) {
    console.error('Failed to store user email config:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to store email configuration',
        code: 500,
      },
    });
  }
};

// Update user email configuration
const updateUserEmailConfig = async (req, res) => {
  try {
    const { accountId, fromEmail, toEmails, emailsEnabled, interval } = req.body;

    // Validate input
    if (!accountId) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'Account ID is required',
          code: 400,
        },
      });
    }

    if (!fromEmail) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'From email is required',
          code: 400,
        },
      });
    }

    if (!toEmails || !Array.isArray(toEmails) || toEmails.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'At least one recipient email is required',
          code: 400,
        },
      });
    }

    const normalizedToEmails = toEmails
      .filter((v) => typeof v === 'string')
      .map((v) => v.trim())
      .filter(Boolean);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = normalizedToEmails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: `Invalid email format: ${invalidEmails.join(', ')}`,
          code: 400,
        },
      });
    }

    const emailConfig = {
      fromEmail,
      toEmails: normalizedToEmails,
      emailsEnabled: emailsEnabled !== false, // default to true
      interval: interval || 5,
    };

    const response = await userEmailService.updateUserEmailConfig(accountId, emailConfig);
    
    res.status(200).json({
      status: 'success',
      message: response.message,
      data: response.config,
    });
  } catch (error) {
    console.error('Failed to update user email config:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to update email configuration',
        code: 500,
      },
    });
  }
};

// Delete user email configuration
const deleteUserEmailConfig = async (req, res) => {
  try {
    const { accountId } = req.query;
    
    if (!accountId) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'Account ID is required',
          code: 400,
        },
      });
    }

    const response = await userEmailService.deleteUserEmailConfig(accountId);
    
    if (response.success) {
      res.status(200).json({
        status: 'success',
        message: response.message,
      });
    } else {
      res.status(404).json({
        status: 'error',
        error: {
          message: response.message,
          code: 404,
        },
      });
    }
  } catch (error) {
    console.error('Failed to delete user email config:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to delete email configuration',
        code: 500,
      },
    });
  }
};

// Initialize OpenSearch index
const initializeIndex = async (req, res) => {
  try {
    await userEmailService.ensureIndexExists();
    
    res.status(200).json({
      status: 'success',
      message: 'OpenSearch index initialized successfully',
    });
  } catch (error) {
    console.error('Failed to initialize OpenSearch index:', error);
    res.status(500).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to initialize OpenSearch index',
        code: 500,
      },
    });
  }
};

module.exports = {
  getUserEmailConfig,
  storeUserEmailConfig,
  updateUserEmailConfig,
  deleteUserEmailConfig,
};
