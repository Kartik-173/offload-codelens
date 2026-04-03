// controllers/authController.js
const chatService = require('../services/chatService.js');

async function chatOllama(req, res, next) {
  try {
    req?.log?.info(
      { requestBody: req.body },
      "chatController: chatOllama request data"
    );
    const result = await chatService.chatOllama(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  chatOllama,
};
