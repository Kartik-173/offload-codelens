const securityScanService = require('../services/securityScanService');

async function awsScan(req, res, next) {
  try {
    req?.log?.info({ requestBody: req.body }, 'securityScanController: awsScan');
    const result = await securityScanService.awsSecurityScan(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function listAwsReports(req, res, next) {
  try {
    req?.log?.info('securityScanController: listAwsReports');
    const result = await securityScanService.listAwsScanReports(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function getAwsReportById(req, res, next) {
  try {
    req?.log?.info({ params: req.params }, 'securityScanController: getAwsReportById');
    const result = await securityScanService.getAwsScanReportById(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function azureScan(req, res, next) {
  try {
    req?.log?.info({ requestBody: req.body }, 'securityScanController: azureScan');
    const result = await securityScanService.azureSecurityScan(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function listAzureReports(req, res, next) {
  try {
    req?.log?.info('securityScanController: listAzureReports');
    const result = await securityScanService.listAzureScanReports(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function getAzureReportById(req, res, next) {
  try {
    req?.log?.info({ params: req.params }, 'securityScanController: getAzureReportById');
    const result = await securityScanService.getAzureScanReportById(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  awsScan,
  listAwsReports,
  getAwsReportById,
  azureScan,
  listAzureReports,
  getAzureReportById,
};
