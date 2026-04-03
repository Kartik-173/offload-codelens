const axios = require('axios');
const config = require('../config/env');

const zendeskAxios = axios.create({
  baseURL: config.ZENDESK_HOST,
  headers: {
    Authorization:
      'Basic ' +
      Buffer.from(
        config.ZENDESK_USER_EMAIL + '/token:' + config.ZENDESK_TOKEN
      ).toString('base64'),
  },
});

module.exports = {
  zendeskAxios,
};
