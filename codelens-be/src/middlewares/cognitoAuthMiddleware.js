const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const config = require('../config/env.js');
const { ERROR_CODES, PUBLIC_ROUTES } = require('../constants');
const ErrorResp = require('../utils/ErrorResp');

// Setup JWKS client to verify Cognito JWTs
const client = jwksClient({
  jwksUri: `https://cognito-idp.${config.AWS_REGION}.amazonaws.com/${config.USER_POOL_ID}/.well-known/jwks.json`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

async function cognitoAuthMiddleware(req, res, next) {
  try {
    const path = req?.originalUrl?.split('?')[0];

    // Check for wildcard matches
    const isPublic = PUBLIC_ROUTES.some((route) => {
      if (route.endsWith("/*")) {
        const baseRoute = route.replace("/*", "");
        return path.startsWith(baseRoute);
      }
      return route === path;
    });

    if (isPublic) {
      return next();
    }

    // Extract token from Authorization header
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new ErrorResp(
        'Unauthorized User',
        'Authorization header missing or invalid. Expected format: Bearer <token>',
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const token = authorization.split(' ')[1];
    if (!token) {
      throw new ErrorResp(
        'Unauthorized User',
        'Token missing in the authorization header',
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Verify the JWT token with Cognito
    const decodedToken = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, { 
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${config.AWS_REGION}.amazonaws.com/${config.USER_POOL_ID}`
      }, (err, decoded) => {
        if (err) return reject(err);

        // Validate audience / client depending on token type
        if (decoded.token_use === 'id') {
          if (decoded.aud !== config.COGNITO_CLIENT_ID) {
            return reject(new Error('Invalid audience in ID token'));
          }
        } else if (decoded.token_use === 'access') {
          if (decoded.client_id !== config.COGNITO_CLIENT_ID) {
            return reject(new Error('Invalid client_id in access token'));
          }
        } else {
          return reject(new Error('Unknown token type'));
        }

        resolve(decoded);
      });
    });

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decodedToken.exp && decodedToken.exp < currentTime) {
      throw new ErrorResp(
        'Token Expired',
        'Access token has expired. Please refresh your token.',
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Extract user information from token
    const user = {
      userId: decodedToken.sub,
      email: decodedToken.email || '',
      username: decodedToken.username || decodedToken['cognito:username'] || '',
      firstName: decodedToken.given_name || '',
      lastName: decodedToken.family_name || '',
      tokenUse: decodedToken.token_use,
      clientId: decodedToken.client_id,
      iss: decodedToken.iss,
      aud: decodedToken.aud,
      exp: decodedToken.exp,
      iat: decodedToken.iat,
      authTime: decodedToken.auth_time
    };

    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Cognito Auth Middleware Error:', error.message);

    if (error.name === 'TokenExpiredError') {
      next(new ErrorResp(
        'Token Expired',
        'Access token has expired. Please refresh your token.',
        ERROR_CODES.UNAUTHORIZED
      ));
    } else if (error.name === 'JsonWebTokenError') {
      next(new ErrorResp(
        'Invalid Token',
        'Invalid token provided.',
        ERROR_CODES.UNAUTHORIZED
      ));
    } else if (error.name === 'NotBeforeError') {
      next(new ErrorResp(
        'Token Not Active',
        'Token is not yet active.',
        ERROR_CODES.UNAUTHORIZED
      ));
    } else {
      next(error);
    }
  }
}


module.exports = cognitoAuthMiddleware;
