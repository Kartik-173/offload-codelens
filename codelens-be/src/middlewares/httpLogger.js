const { getHttpLogger } = require('../utils/logger');

const ErrorhttpLogger = (error, req, res, next) => {
  const logger = getHttpLogger();
  logger(req, res);
  return next(error);
};

const httpLogger = (req, res, next) => {
  const logger = getHttpLogger();
  logger(req, res);
  return next();
};

module.exports = { ErrorhttpLogger, httpLogger };
