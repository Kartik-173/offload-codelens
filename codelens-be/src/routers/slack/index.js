const express = require('express');

const config = require('../../config/env.js');
const axios = require('axios');
const { getSlackWebhook, deleteSlackWebhook } = require('../../utils/vault.js');

const router = express.Router();

router.post('/disconnect', async (_req, res) => {
  const organization = _req.query?.organization || config.SLACK_OAUTH_NAME;

  if (!organization) {
    return res.status(400).json({
      status: 'error',
      error: {
        message: 'organization is required',
      },
    });
  }

  await deleteSlackWebhook(organization);

  return res.status(200).json({
    status: 'success',
    data: {
      message: 'Slack disconnected',
    },
  });
});

router.post('/test', async (_req, res) => {
  const organization = _req.query?.organization || config.SLACK_OAUTH_NAME;

  if (!organization) {
    return res.status(400).json({
      status: 'error',
      error: {
        message: 'organization is required',
      },
    });
  }

  const webhookCfg = await getSlackWebhook(organization);
  if (!webhookCfg?.webhook_url) {
    return res.status(404).json({
      status: 'error',
      error: {
        message: 'Slack webhook is not configured for this organization',
      },
    });
  }

  await axios.post(webhookCfg.webhook_url, {
    text: `Test notification from Terraform CA (${organization})`,
  });

  return res.status(200).json({
    status: 'success',
    data: {
      message: 'Test notification sent',
    },
  });
});

module.exports = router;
