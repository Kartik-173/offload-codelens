const express = require('express');
const router = express.Router();
const reportController = require('../../controllers/reportController.js');

router.get('/sources/:projectKey/*', reportController.fetchAllReportCodeLines);

module.exports = router;
