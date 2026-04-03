const n8nService = require('../services/n8nService');

async function submitPrompt(req, res, next) {
  try {
    req?.log?.info(
      { requestBody: req.body },
      "n8nController: submitPrompt request data"
    );
    const result = await n8nService.submitToN8n(req.body);
    res.send(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitPrompt,
};