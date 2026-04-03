const express = require('express');
const router = express.Router();

const vegetaController = require('../../controllers/vegetaController.js');

router.post('/run', vegetaController.runTest);
router.get('/list', vegetaController.listTests);
router.get('/report', vegetaController.getTestReport);

module.exports = router;
