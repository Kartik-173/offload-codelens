const express = require('express');
const router = express.Router();

const securityScanController = require('../../controllers/securityScanController');

// Trigger AWS security scan (Prowler)
router.post('/aws', securityScanController.awsScan);

// List AWS security scan reports from OpenSearch
router.get('/aws/reports', securityScanController.listAwsReports);

// Get a single AWS security scan report by OpenSearch _id
router.get('/aws/report/:id', securityScanController.getAwsReportById);

// Trigger Azure security scan (Prowler for Azure)
router.post('/azure', securityScanController.azureScan);

// List Azure security scan reports from OpenSearch
router.get('/azure/reports', securityScanController.listAzureReports);

// Get a single Azure security scan report by OpenSearch _id
router.get('/azure/report/:id', securityScanController.getAzureReportById);

module.exports = router;
