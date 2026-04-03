const ENV_NAME = process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development';

const IS_DEV = ENV_NAME === 'development';
const IS_PROD = ENV_NAME === 'production';

export const ENV = {
  ENV_NAME,

  // API URLs
  API_BASE_URL: IS_DEV
    ? process.env.REACT_APP_API_BASE_URL_DEV
    : process.env.REACT_APP_API_BASE_URL,

  API_N8N_BASE_URL: process.env.REACT_APP_API_N8N_BASE_URL,
  
  API_URL: IS_DEV 
    ? process.env.REACT_APP_API_BASE_URL_DEV
    : process.env.REACT_APP_API_BASE_URL,

  // Authentication
  LOGIN_PAGE: IS_DEV
    ? process.env.REACT_APP_LOGIN_PAGE_DEV
    : process.env.REACT_APP_LOGIN_PAGE,

  // OAuth & Integrations
  ORGANIZATION_NAME: process.env.REACT_APP_ORGANIZATION_NAME,
  GITHUB_OAUTH_NAME: process.env.REACT_APP_GITHUB_OAUTH_NAME,
  BITBUCKET_OAUTH_NAME: process.env.REACT_APP_BITBUCKET_OAUTH_NAME,
  SLACK_OAUTH_NAME: process.env.REACT_APP_SLACK_OAUTH_NAME,
  SLACK_CLIENT_ID: process.env.REACT_APP_SLACK_CLIENT_ID,

  // Redirect URLs
  COMPLAINCE_REDIRECT: process.env.REACT_APP_API_COMPLAINCE_REDIRECT,
  SECLENS_REDIRECT: process.env.REACT_APP_API_SECLENS_REDIRECT,

  // Development helpers
  IS_DEV,
  IS_PROD,
};

// Export individual variables for convenience
export const {
  API_BASE_URL,
  API_N8N_BASE_URL,
  API_URL,
  LOGIN_PAGE,
  ORGANIZATION_NAME,
  GITHUB_OAUTH_NAME,
  BITBUCKET_OAUTH_NAME,
  SLACK_OAUTH_NAME,
  SLACK_CLIENT_ID,
  COMPLAINCE_REDIRECT,
  SECLENS_REDIRECT,
} = ENV;
