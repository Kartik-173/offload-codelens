// services/statusStore.js
// S3-based scan status storage for progress tracking
const config = require('../config/env');
const ErrorResp = require('../utils/ErrorResp');
const { ERROR_CODES } = require('../constants');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: config.ACCESSKEYID,
    secretAccessKey: config.SECRETACCESSKEY,
  },
});

const STATUS_PREFIX = 'scan-status';
const STATUS_TTL_HOURS = 24;

function buildStatusKey(projectKey, options = {}) {
  const normalizedProjectKey = String(projectKey || '')
    .split('/')
    .pop()
    .replace(/\.json$/i, '');

  const { userId, organization } = options;

  if (!organization || !userId) {
    throw new ErrorResp(
      'Invalid request',
      'Scan status requires both organization and userId',
      ERROR_CODES.BAD_REQUEST
    );
  }

  return `${organization}/${userId}/${STATUS_PREFIX}/${normalizedProjectKey}.json`;
}

/**
 * Store scan status in S3
 * @param {string} projectKey - Unique project key
 * @param {object} status - Status object { status, phase, progress, message, error, startedAt, updatedAt }
 */
async function setStatus(projectKey, status, options = {}) {
  try {
    const key = buildStatusKey(projectKey, options);
    const data = {
      ...status,
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + STATUS_TTL_HOURS * 60 * 60 * 1000).toISOString()
    };

    const command = new PutObjectCommand({
      Bucket: config.S3_BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json'
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('[statusStore] setStatus error:', error);
    throw error;
  }
}

/**
 * Get scan status from S3
 * @param {string} projectKey - Unique project key
 * @returns {object|null} Status object or null if not found
 */
async function getStatus(projectKey, options = {}) {
  try {
    const key = buildStatusKey(projectKey, options);
    
    const command = new GetObjectCommand({
      Bucket: config.S3_BUCKET_NAME,
      Key: key
    });

    const response = await s3Client.send(command);
    const bodyString = await streamToString(response.Body);
    const status = JSON.parse(bodyString);

    // Check if expired
    if (status.expiresAt && new Date(status.expiresAt) < new Date()) {
      await deleteStatus(projectKey, options);
      return null;
    }

    return status;
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return null;
    }
    console.error('[statusStore] getStatus error:', error);
    throw error;
  }
}

/**
 * Delete scan status from S3
 * @param {string} projectKey - Unique project key
 */
async function deleteStatus(projectKey, options = {}) {
  try {
    const key = buildStatusKey(projectKey, options);
    
    const command = new DeleteObjectCommand({
      Bucket: config.S3_BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('[statusStore] deleteStatus error:', error);
    return { success: false, error: error.message };
  }
}

const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });

/**
 * Update specific fields in existing status
 * @param {string} projectKey - Unique project key
 * @param {object} updates - Partial status updates
 */
async function updateStatus(projectKey, updates, options = {}) {
  try {
    const current = await getStatus(projectKey, options);
    const merged = { ...current, ...updates };
    return await setStatus(projectKey, merged, options);
  } catch (error) {
    console.error('[statusStore] updateStatus error:', error);
    throw error;
  }
}

module.exports = {
  setStatus,
  getStatus,
  deleteStatus,
  updateStatus
};
