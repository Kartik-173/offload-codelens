// controllers/authController.js
const authService = require('../services/authService.js');
const config = require('../config/env.js');
const axios = require('axios');
const {
  storeGithubCreds,
  storeBitbucketCreds,
  readGithubCreds,
  deleteGithubCreds,
  readBitbucketCreds,
  deleteBitbucketCreds,
  storeSlackIntegration,
} = require('../utils/vault.js');
const { fetchGitHubUserInfo, fetchBitbucketUserInfo, revokeGitHubToken, revokeBitbucketToken } = require('../utils/helpers.js');
const ErrorResp = require('../utils/ErrorResp.js');
const { ERROR_CODES } = require('../constants.js');

async function signUp(req, res, next) {
  try {
    req?.log?.info(
      { requestBody: req.body },
      'auth controller: save signUp request data'
    );
    const result = await authService.createUser(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function signIn(req, res, next) {
  try {
    req?.log?.info('auth Controller: signIn');
    const signInResult = await authService.login(req);
    res.status(200).send({ data: signInResult });
  } catch (error) {
    next(error);
  }
}

async function redirectToGitHubLogin(req, res, next) {
  try {
    req.log.info('authController: redirectToGitHubLogin');
    const { clientId } = await authService.getGithubOAuthClientConfig();

    const redirectUri = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;
    res.redirect(redirectUri);
  } catch (err) {
    next(err);
  }
}

async function handleGitHubCallback(req, res, next) {
  try {
    req.log.info('authController: handleGitHubCallback');

    const code = req.query.code;
    if (!code) {
      throw new ErrorResp(
        'Missing authorization code',
        'Missing code from GitHub',
        ERROR_CODES.BAD_REQUEST
      );
    }

    const accessToken = await authService.exchangeCodeForToken(code);

    req.log.info('GitHub Access Token received');

    const isDev = config.NODE_ENV === 'development';

    // here we have to fetch the user info from GitHub
    const userInfo = await fetchGitHubUserInfo(accessToken);

    storeGithubCreds(userInfo.login, accessToken);

    if (isDev) {
      req.log.info('Development environment detected, not storing token');
      return res.redirect(`http://localhost:3001/form?github_username=${userInfo.login}&avatar_url=${userInfo.avatar_url}&provider=github`);
    }

    res.redirect(
      `${config.CODELENS_URL}/form?github_username=${userInfo.login}&avatar_url=${userInfo.avatar_url}&provider=github`
    );
  } catch (err) {
    req.log.error('GitHub callback error', err);
    next(err);
  }
}

async function githubLogout(req, res, next) {
  try {
    req.log.info('authController: githubLogout');

    const { github_username } = req.body;
    if (!github_username) throw new ErrorResp('Missing github_username','Missing github_username',ERROR_CODES.NOT_FOUND);

    // fetch token from DB by username
    const accessToken = await readGithubCreds(github_username);
    if (!accessToken?.data?.token) throw new ErrorResp('No token found for this user','No token found for this user',ERROR_CODES.NOT_FOUND);

    // revoke the token from GitHub
    await revokeGitHubToken(accessToken?.data?.token);

    // delete token from DB
    await deleteGithubCreds(github_username);

    res.status(200).json({ message: 'GitHub logout successful, token revoked' });
  } catch (err) {
    next(err);
  }
}


async function redirectToBitBucketLogin(req, res, next) {
  try {
    req.log.info('authController: redirectToBitBucketLogin');

    const { clientId } = await authService.getBitbucketOAuthClientConfig();

    // Step 1 - Authorization URL
    const isDev = config.NODE_ENV === 'development';
    const redirectUri = isDev
      ? 'http://localhost:3000/api/auth/bitbucket/callback'
      : 'https://terraform-ca.cloudsanalytics.ai/api/auth/bitbucket/callback';

    const authUrl = `https://bitbucket.org/site/oauth2/authorize?client_id=${clientId}&response_type=code&scope=account%20email%20repository&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;

    res.redirect(authUrl);
  } catch (err) {
    next(err);
  }
}

async function handleBitBucketCallback(req, res, next) {
  try {
    req.log.info('authController: handleBitBucketCallback');
    const isDev = config.NODE_ENV === 'development';

    const code = req.query.code;
    if (!code) {
      throw new ErrorResp(
        'Missing authorization code',
        'Missing code from Bitbucket',
        ERROR_CODES.BAD_REQUEST
      );
    }

    const { clientId, clientSecret } = await authService.getBitbucketOAuthClientConfig();

    // Exchange code for access token
    const tokenResponse = await fetch(
      'https://bitbucket.org/site/oauth2/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' +
            Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: isDev
            ? 'http://localhost:3000/api/auth/bitbucket/callback'
            : 'https://terraform-ca.cloudsanalytics.ai/api/auth/bitbucket/callback',
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw new ErrorResp(
        'Bitbucket token error',
        tokenData.error_description || 'Error retrieving Bitbucket access token',
        ERROR_CODES.INTERNAL_SERVER_ERROR
      );
    }

    const accessToken = tokenData.access_token;
    req.log.info('Bitbucket Access Token received');

    const userInfo = await fetchBitbucketUserInfo(accessToken);

    storeBitbucketCreds(userInfo.username, accessToken);

    const redirectUri = isDev
      ? `http://localhost:3001/form?bitbucket_username=${encodeURIComponent(userInfo.username)}&display_name=${encodeURIComponent(userInfo.display_name)}&avatar_url=${encodeURIComponent(userInfo.links.avatar.href)}&provider=bitbucket`
      : `${config.CODELENS_URL}/form?bitbucket_username=${encodeURIComponent(userInfo.username)}&display_name=${encodeURIComponent(userInfo.display_name)}&avatar_url=${encodeURIComponent(userInfo.links.avatar.href)}&provider=bitbucket`;

    res.redirect(redirectUri);

  } catch (err) {
    req.log.error('Bitbucket callback error', err);
    next(err);
  }
}

async function bitbucketLogout(req, res, next) {
  try {
    req.log.info('authController: bitbucketLogout');

    const { bitbucket_username } = req.body;
    if (!bitbucket_username) throw new ErrorResp('Missing bitbucket_username','Missing bitbucket_username',ERROR_CODES.NOT_FOUND);

    // fetch token from DB by username
    const accessToken = await readBitbucketCreds(bitbucket_username);
    if (!accessToken?.data?.token) throw new ErrorResp('No token found for this user','No token found for this user',ERROR_CODES.NOT_FOUND);

    // revoke the token from GitHub
    // await revokeBitbucketToken(accessToken?.data?.token);

    // delete token from DB
    await deleteBitbucketCreds(bitbucket_username);

    res.status(200).json({ message: 'Bitbucket logout successful, token revoked' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  redirectToGitHubLogin,
  handleGitHubCallback,
  githubLogout,
  redirectToBitBucketLogin,
  handleBitBucketCallback,
  bitbucketLogout,
  signUp,
  signIn,
};
