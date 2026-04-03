// services/deployService.js
const axios = require('axios');
const config = require('../config/env.js');

const authSchema = require('../schemas/authSchema.js');
const { validateSchema } = require('../utils/validation');
const { SIGN_UP_TYPE, ERROR_CODES } = require('../constants');
const ErrorResp = require('../utils/ErrorResp');
const { readGithubCreds } = require('../utils/vault.js');

async function awsDeploy(req) {
  try {
    req?.log?.info(
      { requestBody: req.body },
      'deployService: awsDeploy request data'
    );

    validateSchema(authSchema.awsDeploy.reqBody, req.body);
    const { userId, userAccountId, repoUrl, github_username } = req.body;

    if(!userId || !userAccountId || !repoUrl || !github_username) {
      throw new ErrorResp(
        'Missing required fields: userId, userAccountId, repoUrl, github_username',
        "Missing required fields: userId, userAccountId, repoUrl, github_username",
        ERROR_CODES.BAD_REQUEST
      );
    }

    const creds = await readGithubCreds(github_username);

    const n8nWebhookUrl = `${config.N8N_ADDR}/webhook/deploy`;

    const payload = {
      userId,
      userAccountId,
      repoUrl,
      github_token: creds?.data?.token,
      github_username,
    };

    const response = await axios.post(n8nWebhookUrl, payload);

    return {
      response: response.data[0],
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  awsDeploy,
};
