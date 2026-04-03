const axios = require('axios');
const config = require('../config/env');
const securityScanSchema = require('../schemas/securityScanSchema');
const { validateSchema } = require('../utils/validation');
const { readAWSCreds, readAzureCreds, listAWSCredAccountIds, listAzureTenantIds } = require('../utils/vault');
const ErrorResp = require('../utils/ErrorResp');
const { ERROR_CODES } = require('../constants');

async function awsSecurityScan(req) {
  try {
    req?.log?.info(
      { requestBody: req.body },
      'securityScanService: awsSecurityScan request data',
    );

    validateSchema(securityScanSchema.awsSecurityScan.reqBody, req.body);
    const { userId, accountId } = req.body;

    if (!userId) {
      throw new ErrorResp(
        'Validation error',
        'Missing userId in request body',
        ERROR_CODES.BAD_REQUEST,
      );
    }

    let accountIdToScan = accountId === undefined || accountId === null ? '' : String(accountId);
    if (!accountIdToScan) {
      const storedAccountIds = await listAWSCredAccountIds(userId);
      accountIdToScan = storedAccountIds.length ? String(storedAccountIds[0]) : '';
    }

    if (!accountIdToScan) {
      throw new ErrorResp(
        'Vault error',
        'AWS credentials not found in Vault for this user',
        ERROR_CODES.BAD_REQUEST,
      );
    }

    const secret = await readAWSCreds(userId, accountIdToScan);
    if (!secret) {
      throw new ErrorResp(
        'Vault error',
        'AWS credentials not found in Vault for this account',
        ERROR_CODES.BAD_REQUEST,
      );
    }

    const inner = secret?.data?.data || secret?.data || secret;

    const resolvedAccountId = inner?.aws_account_id || accountIdToScan;
    const accessKeyId = inner?.access_key;
    const secretAccessKey = inner?.secret_key;

    if (!resolvedAccountId || !accessKeyId || !secretAccessKey) {
      throw new ErrorResp(
        'Vault error',
        'Incomplete AWS credentials stored in Vault',
        ERROR_CODES.INTERNAL_SERVER_ERROR,
      );
    }

    const response = await axios.post(`${config.PROWLER_BASE_URL}/api/security/scan`, {
      accountId: resolvedAccountId,
      accessKeyId,
      secretAccessKey,
    });

    return response.data?.data || response.data;
  } catch (error) {
    req?.log?.error(
      { err: error?.message || error },
      'securityScanService: awsSecurityScan failed',
    );
    throw error;
  }
}

async function listAwsScanReports(req) {
  try {
    req?.log?.info('securityScanService: listAwsScanReports called');

    const indexName = 'codelensawssecurityscan';
    const url = `${config.OPEN_SEARCH_URL.replace(/\/$/, '')}/${indexName}/_search`;

    const response = await axios.post(
      url,
      {
        query: { match_all: {} },
        size: 100,
      },
      {
        auth: {
          username: config.OPEN_SEARCH_USERNAME,
          password: config.OPEN_SEARCH_PASSWORD,
        },
      },
    );

    const hits = response?.data?.hits?.hits || [];

    const reports = hits.map((hit) => ({
      id: hit?._id,
      index: hit?._index,
      score: hit?._score,
      accountId: hit?._source?.accountId,
      timestamp: hit?._source?.timestamp,
    }));

    return reports;
  } catch (error) {
    req?.log?.error(
      {
        err: error?.message || error,
        status: error?.response?.status,
        data: error?.response?.data,
      },
      'securityScanService: listAwsScanReports failed',
    );

    // Wrap OpenSearch error into a structured ErrorResp so FE gets a clear message
    const reason =
      error?.response?.data?.error?.reason ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to fetch AWS scan report list from OpenSearch';

    throw new ErrorResp(
      'OpenSearch error',
      reason,
      ERROR_CODES.BAD_REQUEST,
    );
  }
}

async function getAwsScanReportById(req) {
  try {
    const { id } = req.params || {};

    req?.log?.info({ id }, 'securityScanService: getAwsScanReportById called');

    if (!id) {
      throw new ErrorResp(
        'Validation error',
        'Missing report id in path parameters',
        ERROR_CODES.BAD_REQUEST,
      );
    }

    const indexName = 'codelensawssecurityscan';
    const url = `${config.OPEN_SEARCH_URL.replace(/\/$/, '')}/${indexName}/_doc/${encodeURIComponent(id)}`;

    const response = await axios.get(url, {
      auth: {
        username: config.OPEN_SEARCH_USERNAME,
        password: config.OPEN_SEARCH_PASSWORD,
      },
    });

    return response?.data;
  } catch (error) {
    req?.log?.error(
      { err: error?.message || error },
      'securityScanService: getAwsScanReportById failed',
    );
    throw error;
  }
}

async function azureSecurityScan(req) {
  try {
    req?.log?.info(
      { requestBody: req.body },
      'securityScanService: azureSecurityScan request data',
    );

    validateSchema(securityScanSchema.azureSecurityScan.reqBody, req.body);
    const { userId, tenantId } = req.body;

    if (!userId) {
      throw new ErrorResp(
        'Validation error',
        'Missing userId in request body',
        ERROR_CODES.BAD_REQUEST,
      );
    }

    let tenantIdToScan = tenantId === undefined || tenantId === null ? '' : String(tenantId);
    if (!tenantIdToScan) {
      const storedTenantIds = await listAzureTenantIds(userId);
      tenantIdToScan = storedTenantIds.length ? String(storedTenantIds[0]) : '';
    }

    const secret = await readAzureCreds(userId, tenantIdToScan || undefined);
    if (!secret) {
      throw new ErrorResp(
        'Vault error',
        'Azure credentials not found in Vault for this user',
        ERROR_CODES.BAD_REQUEST,
      );
    }

    const inner = secret?.data?.data || secret?.data || secret;
    const userAccountId = inner?.azure_tenant_id;
    const azClientId = inner?.azure_client_id;
    const azClientSecret = inner?.azure_client_secret;
    const azSubscriptionId = inner?.azure_subscription_id;

    if (!userAccountId || !azClientId || !azClientSecret || !azSubscriptionId) {
      throw new ErrorResp(
        'Vault error',
        'Incomplete Azure credentials stored in Vault',
        ERROR_CODES.INTERNAL_SERVER_ERROR,
      );
    }

    // Forward to codelens-prowler-be
    const response = await axios.post(`${config.PROWLER_BASE_URL}/api/security/azure-scan`, {
      userAccountId,
      azClientId,
      azClientSecret,
      azSubscriptionId,
    });

    return response.data?.data || response.data;
  } catch (error) {
    req?.log?.error(
      { err: error?.message || error },
      'securityScanService: azureSecurityScan failed',
    );
    throw error;
  }
}

async function listAzureScanReports(req) {
  try {
    req?.log?.info('securityScanService: listAzureScanReports called');

    const indexName = 'codelensazuresecurityscan';
    const url = `${config.OPEN_SEARCH_URL.replace(/\/$/, '')}/${indexName}/_search`;

    const response = await axios.post(
      url,
      {
        query: { match_all: {} },
        size: 100,
      },
      {
        auth: {
          username: config.OPEN_SEARCH_USERNAME,
          password: config.OPEN_SEARCH_PASSWORD,
        },
      },
    );

    const hits = response?.data?.hits?.hits || [];

    const reports = hits.map((hit) => ({
      id: hit?._id,
      index: hit?._index,
      score: hit?._score,
      userAccountId: hit?._source?.userAccountId,
      timestamp: hit?._source?.timestamp,
    }));

    return reports;
  } catch (error) {
    req?.log?.error(
      {
        err: error?.message || error,
        status: error?.response?.status,
        data: error?.response?.data,
      },
      'securityScanService: listAzureScanReports failed',
    );

    const reason =
      error?.response?.data?.error?.reason ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to fetch Azure scan report list from OpenSearch';

    throw new ErrorResp(
      'OpenSearch error',
      reason,
      ERROR_CODES.BAD_REQUEST,
    );
  }
}

async function getAzureScanReportById(req) {
  try {
    const { id } = req.params || {};

    req?.log?.info({ id }, 'securityScanService: getAzureScanReportById called');

    if (!id) {
      throw new ErrorResp(
        'Validation error',
        'Missing report id in path parameters',
        ERROR_CODES.BAD_REQUEST,
      );
    }

    const indexName = 'codelensazuresecurityscan';
    const url = `${config.OPEN_SEARCH_URL.replace(/\/$/, '')}/${indexName}/_doc/${encodeURIComponent(id)}`;

    const response = await axios.get(url, {
      auth: {
        username: config.OPEN_SEARCH_USERNAME,
        password: config.OPEN_SEARCH_PASSWORD,
      },
    });

    return response?.data;
  } catch (error) {
    req?.log?.error(
      { err: error?.message || error },
      'securityScanService: getAzureScanReportById failed',
    );
    throw error;
  }
}

module.exports = {
  awsSecurityScan,
  listAwsScanReports,
  getAwsScanReportById,
  azureSecurityScan,
  listAzureScanReports,
  getAzureScanReportById,
};
