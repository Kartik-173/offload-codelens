const vegetaService = require('../services/vegetaService');

async function runTest(req, res, next) {
  try {
    req?.log?.info(
      { requestBody: req.body },
      "vegetaController: runTest request data"
    );
    const result = await vegetaService.run(req);
    res.send({ data: result });
  } catch (err) {
    next(err);
  }
}

async function listTests(req, res, next) {
  try {
    req?.log?.info(
      { requestQuery: req.query },
      "vegetaController: listTests request data"
    );
    const result = await vegetaService.list(req);
    res.send({ data: result });
  } catch (err) {
    next(err);
  }
}

async function getTestReport(req, res, next) {
  try {
    req?.log?.info(
      { requestQuery: req.query },
      "vegetaController: getTestReport request data"
    );
    const result = await vegetaService.getOne(req);
    res.send({ data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  runTest,
  listTests,
  getTestReport
};
