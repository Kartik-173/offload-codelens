const express = require('express');
const router = express.Router();
const wafScanController = require('../../controllers/wafScanController');

router.post('/start-scan', wafScanController.startWafScan);
router.get('/list', wafScanController.listScans);
router.get('/report', wafScanController.getScanReport);

module.exports = router;
