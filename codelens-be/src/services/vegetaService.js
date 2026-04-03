const axios = require('axios');
const ErrorResp = require('../utils/ErrorResp');
const { ERROR_CODES } = require('../constants');
const {
  uploadGenericJson,
  listOrganizationScans,
  getBucketFile
} = require('../services/s3Service');
const config = require('../config/env');
const { validateSchema } = require('../utils/validation');
const vegetaSchema = require('../schemas/vegetaSchema');

const PREFIX = 'ca-vegeta-scan';
const MAX_RATE = 500;
const MIN_RATE = 1;

function getTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
}

async function run(req) {
  req?.log?.info({ reqBody: req.body }, 'vegetaService: run - Request body received');

  validateSchema(vegetaSchema.runTest.reqBody, req.body);

  const {
    url,
    method = 'GET',
    rate = 10,
    duration = '10s',
    headers = {},
    body = '',
    userId,
    scanName
  } = req.body;

  if (!/^\d+s$/i.test(duration) || rate < MIN_RATE || rate > MAX_RATE) {
    throw new ErrorResp(
      'Invalid parameters',
      `rate must be ${MIN_RATE}-${MAX_RATE} and duration like 10s`,
      ERROR_CODES.BAD_REQUEST
    );
  }

  const vegetaUrl = `${config.VEGETA_API_URL}/api/load-test/run`;
  let result;

  try {
    const response = await axios.post(vegetaUrl, {
      url,
      method,
      rate,
      duration,
      headers,
      body
    });
    result = response?.data?.data;
  } catch (err) {
    req?.log?.error({ err }, 'Vegeta BE call failed');
    throw new ErrorResp('Vegeta load test failed', err?.message, ERROR_CODES.UNEXPECTED);
  }

  if (!result) {
    throw new ErrorResp('Invalid vegeta response', 'Missing data', ERROR_CODES.UNEXPECTED);
  }

  const timestamp = getTimestamp();
  const folder = `${scanName}_${timestamp}`;
  const key = `${PREFIX}/${userId}/${folder}/vegeta-report.json`;

  await uploadGenericJson(req, result, key);

  req?.log?.info({ key }, 'vegetaService: run - Report uploaded');

  return {
    message: 'Load test completed & uploaded',
    s3Key: key,
    summary: result.summary,
  };
}

async function list(req) {
  req?.log?.info({ reqQuery: req.query }, 'vegetaService: list - Fetch');
  validateSchema(vegetaSchema.listReports.reqQuery, req.query);

  const objects = await listOrganizationScans(req, PREFIX);
  if (!objects?.length) return [];

  return objects
    .filter(o => o.Key?.endsWith('/vegeta-report.json'))
    .map(o => {
      const [_, userId, folder] = o.Key.split('/');
      return {
        userId,
        testFolder: folder,
        key: `${PREFIX}/${userId}/${folder}`,
        lastModified: o.LastModified,
        size: o.Size
      };
    })
    .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
}

async function getOne(req) {
  req?.log?.info({ reqQuery: req.query }, 'vegetaService: getOne - Fetch report');

  validateSchema(vegetaSchema.getReportFile.reqQuery, req.query);
  const { key } = req.query;

  const file = await getBucketFile(req, key);

  let parsed;
  try {
    parsed = JSON.parse(file);
  } catch {
    req?.log?.error({ key }, 'vegetaService: getOne - JSON parse failed');
    throw new ErrorResp('Invalid JSON inside S3 file', key, ERROR_CODES.UNEXPECTED);
  }

  return { data: parsed };
}

module.exports = {
  run,
  list,
  getOne
};
