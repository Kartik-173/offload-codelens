const express = require('express');
const router = express.Router();

const oauthController = require('../../controllers/oauthController.js');

// GitHub OAuth routes
router.get('/github/config', oauthController.getGithubOAuthConfig);
router.post('/github/config', oauthController.setGithubOAuthConfig);

// Bitbucket OAuth routes
router.get('/bitbucket/config', oauthController.getBitbucketOAuthConfig);
router.post('/bitbucket/config', oauthController.setBitbucketOAuthConfig);

// Slack OAuth routes
router.get('/slack/config', oauthController.getSlackOAuthConfig);
router.post('/slack/config', oauthController.setSlackOAuthConfig);

module.exports = router;
