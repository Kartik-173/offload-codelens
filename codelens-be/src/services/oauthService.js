const { ERROR_CODES } = require('../constants');
const ErrorResp = require('../utils/ErrorResp');
const { 
  storeGithubOAuthConfig, 
  readGithubOAuthConfig,
  storeBitbucketOAuthConfig,
  readBitbucketOAuthConfig,
  storeSlackWebhook,
  getSlackWebhook
} = require('../utils/vault.js');

// GitHub OAuth
async function getGithubOAuthConfig(req) {
  req?.log?.info({ query: req.query }, 'oauthService: getGithubOAuthConfig');

  const { organization } = req.query || {};

  if (!organization) {
    throw new ErrorResp(
      'Validation error',
      'organization is required',
      ERROR_CODES.BAD_REQUEST
    );
  }

  const cfg = await readGithubOAuthConfig(organization);

  if (!cfg) {
    return { exists: false };
  }

  return { exists: true };
}

async function setGithubOAuthConfig(req) {
  req?.log?.info({ body: req.body }, 'oauthService: setGithubOAuthConfig');

  const { organization, clientId, clientSecret } = req.body || {};

  if (!organization || !clientId || !clientSecret) {
    throw new ErrorResp(
      'Validation error',
      'organization, clientId and clientSecret are required',
      ERROR_CODES.BAD_REQUEST
    );
  }

  await storeGithubOAuthConfig(organization, clientId, clientSecret);

  return { success: true };
}

// Bitbucket OAuth
async function getBitbucketOAuthConfig(req) {
  req?.log?.info({ query: req.query }, 'oauthService: getBitbucketOAuthConfig');

  const { organization } = req.query || {};

  if (!organization) {
    throw new ErrorResp(
      'Validation error',
      'organization is required',
      ERROR_CODES.BAD_REQUEST
    );
  }

  const cfg = await readBitbucketOAuthConfig(organization);

  if (!cfg) {
    return { exists: false };
  }

  return { exists: true };
}

async function setBitbucketOAuthConfig(req) {
  req?.log?.info({ body: req.body }, 'oauthService: setBitbucketOAuthConfig');

  const { organization, clientId, clientSecret } = req.body || {};

  if (!organization || !clientId || !clientSecret) {
    throw new ErrorResp(
      'Validation error',
      'organization, clientId and clientSecret are required',
      ERROR_CODES.BAD_REQUEST
    );
  }

  await storeBitbucketOAuthConfig(organization, clientId, clientSecret);

  return { success: true };
}

// Slack (Incoming Webhook)
async function getSlackOAuthConfig(req) {
  req?.log?.info({ query: req.query }, 'oauthService: getSlackOAuthConfig');

  const { organization } = req.query || {};

  if (!organization) {
    throw new ErrorResp(
      'Validation error',
      'organization is required',
      ERROR_CODES.BAD_REQUEST
    );
  }

  const cfg = await getSlackWebhook(organization);

  if (!cfg?.webhook_url) {
    return { exists: false };
  }

  return { exists: true };
}

async function setSlackOAuthConfig(req) {
  req?.log?.info({ body: req.body }, 'oauthService: setSlackOAuthConfig');

  const { organization, webhookUrl } = req.body || {};

  if (!organization || !webhookUrl) {
    throw new ErrorResp(
      'Validation error',
      'organization and webhookUrl are required',
      ERROR_CODES.BAD_REQUEST
    );
  }

  await storeSlackWebhook(organization, webhookUrl);

  return { success: true };
}

module.exports = {
  // GitHub
  getGithubOAuthConfig,
  setGithubOAuthConfig,
  // Bitbucket
  getBitbucketOAuthConfig,
  setBitbucketOAuthConfig,
  // Slack
  getSlackOAuthConfig,
  setSlackOAuthConfig,
};
