const express = require('express');
const router = express.Router();

const n8nController = require('../../controllers/n8nController.js');

router.post('/submit-job', n8nController.submitPrompt);

module.exports = router;
