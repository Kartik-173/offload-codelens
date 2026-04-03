import APIConstants from './APIConstants';
import APIService from './APIService';
import { ENV } from '../config/env';

const SlackIntegrationService = {
  // Check if Slack webhook config exists
  getSlackOAuthConfig: async (organization) => {
    const endpoint = `${APIConstants.SLACK_OAUTH.CONFIG}?organization=${organization}`;
    return APIService.get(endpoint);
  },

  // Store Slack webhook config
  storeSlackOAuthConfig: async (config) => {
    const endpoint = APIConstants.SLACK_OAUTH.CONFIG;
    return APIService.post(endpoint, config);
  },

  disconnectSlack: async () => {
    const org = ENV.SLACK_OAUTH_NAME;
    const qs = org ? `?organization=${encodeURIComponent(org)}` : '';
    const endpoint = `${APIConstants.SLACK.DISCONNECT}${qs}`;
    return APIService.post(endpoint, {});
  },

  testSlackNotification: async () => {
    const endpoint = APIConstants.SLACK.TEST;
    return APIService.post(endpoint, {});
  },
};

export default SlackIntegrationService;
