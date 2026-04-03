/**
 * Authentication utilities
 */

// Extract user ID from request
const getUserIdFromRequest = (req) => {
  // Try different common ways user ID might be stored
  return req.user?.id || 
         req.user?.sub || 
         req.user?.userId || 
         req.headers['x-user-id'] || 
         req.query.userId ||
         null;
};

// Simple authentication middleware (for now - replace with proper auth)
const validateAuth = (req, res, next) => {
  const userId = getUserIdFromRequest(req);
  
  if (!userId) {
    return res.status(401).json({
      error: {
        message: 'Unauthorized - User ID not found',
        code: 401
      }
    });
  }
  
  // Attach user info to request for downstream use
  req.userId = userId;
  next();
};

module.exports = {
  getUserIdFromRequest,
  validateAuth
};
