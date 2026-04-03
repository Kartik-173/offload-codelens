const axios = require('axios');
const { readGithubCreds } = require('../utils/vault');
const config = require('../config/env');

// Submit prompt to n8n Webhook
async function submitToN8n({message_history, cloud_provider, vcs_provider, github_username, mode = 'reply'}) {
  try {
    const creds = await readGithubCreds(github_username);
    const n8nWebhookUrl = `${config.N8N_ADDR}/webhook/prompt-to-ollama`;

    const payload = {
      message_history,
      cloud_provider: cloud_provider?.toLowerCase(),
      vcs_provider: vcs_provider?.toLowerCase(),
      github_token: creds?.data?.token,
      github_username,
      mode,
      timestamp: Math.floor(Date.now() / 1000),
    };

    const response = await axios.post(n8nWebhookUrl, payload);
    return {
      message: "✅ Submitted to n8n successfully",
      n8n_response: response.data,
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  submitToN8n,
};
