const config = require('../config/env');
const { default: axios } = require('axios');
const { ERROR_CODES } = require('../constants');
const ErrorResp = require('../utils/ErrorResp');
const authService = require('../services/authService');


function fetchGitHubUserInfo(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      url: 'https://api.github.com/user',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CloudsAnalytics'
      }
    };

    axios(options)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

function fetchBitbucketUserInfo(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      method: "GET",
      url: "https://api.bitbucket.org/2.0/user",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json"
      }
    };

    axios(options)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

async function revokeGitHubToken(accessToken) {
  try {
    const { clientId, clientSecret } = await authService.getGithubOAuthClientConfig();

    const url = `https://api.github.com/applications/${clientId}/token`;

    await axios.delete(url, {
      auth: {
        username: clientId,
        password: clientSecret
      },
      data: { access_token: accessToken }
    });
  } catch (error) {
    if (error instanceof ErrorResp) {
      throw error;
    }

    throw new ErrorResp(
      'Failed to revoke GitHub token',
      error.response?.data || error.message,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
}

async function revokeBitbucketToken(accessToken) {
  const url = "https://bitbucket.org/site/oauth2/revoke";

  try {
    const { clientId, clientSecret } = await authService.getBitbucketOAuthClientConfig();

    const params = new URLSearchParams();
    params.append("token", accessToken);

    // Bitbucket requires Basic Auth = base64(clientId:clientSecret)
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    await axios.post(url, params, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  } catch (error) {
    if (error instanceof ErrorResp) {
      throw error;
    }

    throw new ErrorResp(
      'Failed to revoke Bitbucket token',
      error.response?.data || error.message,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
}





module.exports = {
  fetchGitHubUserInfo,
  fetchBitbucketUserInfo,
  revokeGitHubToken,
  revokeBitbucketToken
};
