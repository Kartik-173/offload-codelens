

// controllers/deployController.js
const deployService = require('../services/deployService.js');
const config = require('../config/env.js');

async function awsDeploy(req, res, next) {
  try {
    req?.log?.info({ requestBody: req.body }, 'deploy controller: deploying to AWS');
    const result = await deployService.awsDeploy(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  awsDeploy
};
