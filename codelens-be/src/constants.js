const ERROR_CODES = {
  CONFLICT: 409,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PERMISSION_DENIED: 403, // Forbidden
  SQL: 515,
  UNEXPECTED: 516,
  REDIS_CONNECTION_RETRY: 521,
  REDIS_CONNECTION: 522,
  REDIS_CONNECTION_END: 523,
  NETWORK_AUTHENTICATION_REQUIRED: 511,
  NOT_EXTENDED: 512,
  NOT_MODIFIED: 304
};

const LOG_ERR_MSG = {
  HANDLED: 'Handled Error',
  UN_HANDLED: 'UNHandled Error',
  SQL: 'Sql Error',
  UNEXPECTED: 'Some Unexpected Error',
  REDIS_CONNECTION_RETRY: 'Redis Connection Retry Error',
  REDIS_CONNECTION: 'Redis Connection Error',
  REDIS_CONNECTION_END: 'Redis Connection End Error',
};

const SIGN_UP_TYPE = {
  GOOGLE: 'google',
  MANUAL: 'manual',
};


const BYCRPT_SALT = 10;

const ENV = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

const PUBLIC_ROUTES = [
  '/test',
  '/healthcheck',
  '/service-status',
  '/metrics',
  '/api/contact',
  '/api/appointment',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/email-verification',
  '/api/auth/verify-email',
  '/api/subscription/list',
  '/api/auth/github',
  '/api/auth/github/callback',
  '/api/auth/bitbucket',
  '/api/auth/bitbucket/callback',
  '/api/redirect/compliance',
];


module.exports = {
  ERROR_CODES,
  LOG_ERR_MSG,
  SIGN_UP_TYPE,
  BYCRPT_SALT,
  ENV,
  PUBLIC_ROUTES,
};
