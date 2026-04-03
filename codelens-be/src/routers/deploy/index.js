const express = require('express');
const router = express.Router();

const deployController = require('../../controllers/deployController.js');

router.post('/aws', deployController.awsDeploy);

module.exports = router;
