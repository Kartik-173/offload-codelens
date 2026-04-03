const express = require('express');
const router = express.Router();

const chatController = require('../../controllers/chatController.js');

router.post('/ollama', chatController.chatOllama);

module.exports = router;
