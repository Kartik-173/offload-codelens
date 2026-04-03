const pino = require('pino');
const { hostname } = require('os');
const pinoHttp = require('pino-http');
const config = require('../config/env');

const ENV = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

const env = config.NODE_ENV || ENV.DEVELOPMENT;
const serviceName = config.SERVICE_NAME;

const pinoOptions = {
  level: config.LOG_LEVEL || 'info',
  timestamp: () => `,"time":"${Date.now() * 1_000_000}"`,
  base: {
    service: serviceName,
    env,
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  }
};

let logger;

if (env === ENV.DEVELOPMENT) {
  logger = pino(pinoOptions);
} else {
  logger = pino(
    pinoOptions,
    pino.transport({
      target: 'pino-loki',
      options: {
        host: config.LOKI_URL,
        labels: {
          app: serviceName,
          env,
          hostname: hostname(),
        },
        batching: true,
        interval: 10,
      },
    })
  );
}

const httpLogger = pinoHttp({
  logger,
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        remoteAddress: req.socket?.remoteAddress,
        remotePort: req.socket?.remotePort,
        headers: {
          'x-request-id': req.headers['x-request-id'],
          'tmps-correlation-id': req.headers['tmps-correlation-id'],
          'app': req.headers['app'],
        }
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
    err: pino.stdSerializers.err,
  },
  wrapSerializers: false,
  autoLogging: {
    ignorePaths: ['/healthcheck'],
  },
  useLevel: 'info',
  reqCustomProps: (req) => ({
    user: req.user ? {
      roleName: req.user?.roleName,
      userId: req.user?.userId,
      email: req.user?.email,
    } : undefined,
  }),
});

function getHttpLogger() {
  return httpLogger;
}

module.exports = {
  logger,
  getHttpLogger,
};
