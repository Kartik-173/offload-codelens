// controllers/redirectController.js
const authService = require('../services/authService.js');
const config = require('../config/env.js');
const { ERROR_CODES } = require('../constants.js');

async function redirectToCompliance(req, res, next) {
  try {
    req?.log?.info(
      { requestQuery: req.query, requestParams: req.params },
      "redirectController: redirectToCompliance request data"
    );
    res.redirect(`https://${config.COMPLIANCE_USER}:${config.COMPLIANCE_PASSWORD}@openshield.cloudsanalytics.ai/`);
  } catch (error) {
    next(error);
  }
}

async function redirectToOwasp(req, res, next) {
  try {
    req?.log?.info(
      { requestQuery: req.query, requestParams: req.params },
      "redirectController: redirectToOwasp request data"
    );
    res.redirect(`https://ca-urlscan.cloudsanalytics.ai/`);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  redirectToCompliance,
  redirectToOwasp
};
