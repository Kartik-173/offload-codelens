const oauthService = require('../services/oauthService.js');

// GitHub OAuth
async function getGithubOAuthConfig(req, res, next) {
  try {
    req?.log?.info(
      { requestQuery: req.query },
      "oauthController: getGithubOAuthConfig request data"
    );
    const result = await oauthService.getGithubOAuthConfig(req);
    res.send(result);
  } catch (error) {
    next(error);
  }
}

async function setGithubOAuthConfig(req, res, next) {
  try {
    req?.log?.info(
      { requestBody: req.body },
      "oauthController: setGithubOAuthConfig request data"
    );
    const result = await oauthService.setGithubOAuthConfig(req);
    res.status(201).send(result);
  } catch (error) {
    next(error);
  }
}

// Bitbucket OAuth
async function getBitbucketOAuthConfig(req, res, next) {
  try {
    req?.log?.info(
      { requestQuery: req.query },
      "oauthController: getBitbucketOAuthConfig request data"
    );
    const result = await oauthService.getBitbucketOAuthConfig(req);
    res.send(result);
  } catch (error) {
    next(error);
  }
}

async function setBitbucketOAuthConfig(req, res, next) {
  try {
    req?.log?.info(
      { requestBody: req.body },
      "oauthController: setBitbucketOAuthConfig request data"
    );
    const result = await oauthService.setBitbucketOAuthConfig(req);
    res.status(201).send(result);
  } catch (error) {
    next(error);
  }
}

// Slack OAuth
async function getSlackOAuthConfig(req, res, next) {
  try {
    req?.log?.info(
      { requestQuery: req.query },
      "oauthController: getSlackOAuthConfig request data"
    );
    const result = await oauthService.getSlackOAuthConfig(req);
    res.send(result);
  } catch (error) {
    next(error);
  }
}

async function setSlackOAuthConfig(req, res, next) {
  try {
    req?.log?.info(
      { requestBody: req.body },
      "oauthController: setSlackOAuthConfig request data"
    );
    const result = await oauthService.setSlackOAuthConfig(req);
    res.status(201).send(result);
  } catch (error) {
    next(error);
  }
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
