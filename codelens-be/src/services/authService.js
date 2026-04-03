// services/authService.js
const axios = require('axios');
const config = require('../config/env.js');

const { ERROR_CODES } = require('../constants');
const ErrorResp = require('../utils/ErrorResp');
const qs = require("qs");
const { readGithubOAuthConfig, readBitbucketOAuthConfig } = require('../utils/vault');

const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

// Setup JWKS client to verify Cognito JWTs
const client = jwksClient({
  jwksUri: `https://cognito-idp.${config.AWS_REGION}.amazonaws.com/${config.USER_POOL_ID}/.well-known/jwks.json`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

async function createUser(req) {
  try {
    req?.log?.info(
      { requestBody: req.body },
      "authService: createUser request data"
    );

    const { code } = req.body;
    if (!code) {
      throw new ErrorResp(
        "Invalid credentials",
        "Invalid credentials",
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // 1. Exchange code for tokens
    const tokenRes = await axios.post(
      `${config.COGNITO_LOGIN_PAGE_URL}/oauth2/token`,
      qs.stringify({
        grant_type: "authorization_code",
        client_id: config.COGNITO_CLIENT_ID,
        client_secret: config.COGNITO_CLIENT_SECRET,
        code,
        redirect_uri: config.COGNITO_REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { id_token, access_token, refresh_token } = tokenRes.data;

    if (!id_token) {
      throw new ErrorResp(
        "Invalid credentials",
        "Invalid credentials",
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // 2. Verify + Decode the id_token
    const payload = await new Promise((resolve, reject) => {
      jwt.verify(id_token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      });
    });

    const {
      email,
      given_name: firstname = "",
      family_name: lastname = "",
      sub: cognitoSub,
    } = payload;

    if (!email || !cognitoSub) {
      throw new ErrorResp(
        "Invalid credentials",
        "Invalid credentials",
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // 3. Return user info directly from Cognito
    return {
      message: "User authenticated via Cognito",
      userId: cognitoSub,
      email,
      firstname,
      lastname,
      id_token,
      access_token,
      refresh_token,
    };
  } catch (error) {
    console.error("Error in createUser:", error.message);
    throw error;
  }
}

// Shared helper to fetch GitHub OAuth app credentials from Vault
async function getGithubOAuthClientConfig() {
  const orgKey = config.GITHUB_OAUTH_NAME;

  if (!orgKey) {
    throw new ErrorResp(
      'GitHub OAuth not configured',
      'Missing GITHUB_OAUTH_NAME for GitHub OAuth configuration',
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }

  const cfg = await readGithubOAuthConfig(orgKey);
  const clientId = cfg?.data?.client_id;
  const clientSecret = cfg?.data?.client_secret;

  if (!clientId || !clientSecret) {
    throw new ErrorResp(
      'GitHub OAuth not configured',
      'Missing GitHub OAuth client_id or client_secret in Vault',
      ERROR_CODES.NOT_FOUND
    );
  }

  return { clientId, clientSecret };
}

// Shared helper to fetch Bitbucket OAuth app credentials from Vault
async function getBitbucketOAuthClientConfig() {
  const orgKey = config.BITBUCKET_OAUTH_NAME;

  if (!orgKey) {
    throw new ErrorResp(
      'Bitbucket OAuth not configured',
      'Missing BITBUCKET_OAUTH_NAME for Bitbucket OAuth configuration',
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }

  const cfg = await readBitbucketOAuthConfig(orgKey);
  const clientId = cfg?.data?.client_id;
  const clientSecret = cfg?.data?.client_secret;

  if (!clientId || !clientSecret) {
    throw new ErrorResp(
      'Bitbucket OAuth not configured',
      'Missing Bitbucket OAuth client_id or client_secret in Vault',
      ERROR_CODES.NOT_FOUND
    );
  }

  return { clientId, clientSecret };
}

async function exchangeCodeForToken(code) {
  const { clientId, clientSecret } = await getGithubOAuthClientConfig();

  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (response.data.error) {
      throw new ErrorResp(
        'GitHub token error',
        response.data.error_description || 'GitHub token error',
        ERROR_CODES.INTERNAL_SERVER_ERROR
      );
    }

    return response.data.access_token;
  } catch (error) {
    if (error instanceof ErrorResp) {
      throw error;
    }

    throw new ErrorResp(
      'GitHub token error',
      error.response?.data?.error_description || error.message,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
}

module.exports = {
  exchangeCodeForToken,
  getGithubOAuthClientConfig,
  getBitbucketOAuthClientConfig,
  createUser,
};
