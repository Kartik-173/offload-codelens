const axios = require('axios');
const config = require('../config/env.js');
const { getSlackWebhook } = require('../utils/vault.js');

async function sendSlackText(text, organization = null) {
  const org = organization || config.SLACK_OAUTH_NAME;

  if (!org) {
    console.log('🔔 SLACK: organization not configured; skipping Slack alert');
    return false;
  }

  const webhookCfg = await getSlackWebhook(org);
  if (!webhookCfg?.webhook_url) {
    console.log(`🔔 SLACK: webhook not configured for organization ${org}; skipping Slack alert`);
    return false;
  }

  const isPayloadObject = typeof text === 'object' && text !== null;
  const payload = isPayloadObject
    ? text
    : {
        text,
        mrkdwn: true,
      };

  await axios.post(webhookCfg.webhook_url, payload);

  return true;
}

module.exports = {
  sendSlackText,
};
