// services/s3Service.js
const config = require('../config/env');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand
} = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: config.ACCESSKEYID,
    secretAccessKey: config.SECRETACCESSKEY,
  },
});

/**
 * Upload Sonar Scan result to S3 as JSON
 * @param {Object} req - Express request object with logging
 * @param {Object} data - JSON data to upload
 * @param {String} userId - User ID
 * @param {String} projectKey - Sonar project key
 * @param {String} [organization] - Optional organization name for namespacing
 * @returns {Object} S3 response
 */
async function uploadSonarScanResult(req, data, userId, projectKey, organization) {
  try {
    const rootPrefix = organization ? `${organization}/${userId}` : `${userId}`;
    const key = `${rootPrefix}/${projectKey}/sonar.json`;

    req?.log?.info(`Uploading sonar scan result to S3 at key: ${key}`);

    const command = new PutObjectCommand({
      Bucket: config.S3_BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json'
    });

    const response = await s3Client.send(command);
    return { success: true, key, response };
  } catch (error) {
    req?.log?.error({ error }, 's3Service: uploadSonarScanResult - Error');
    throw error;
  }
}

async function deletePrefix(req, prefix) {
  try {
    let continuationToken;
    let deletedCount = 0;

    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: config.S3_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken
      });

      const listResp = await s3Client.send(listCommand);
      const contents = listResp.Contents || [];

      if (!contents.length) {
        break;
      }

      const deleteCommand = new DeleteObjectsCommand({
        Bucket: config.S3_BUCKET_NAME,
        Delete: {
          Objects: contents
            .filter((o) => o && o.Key)
            .map((o) => ({ Key: o.Key })),
          Quiet: true
        }
      });

      const deleteResp = await s3Client.send(deleteCommand);
      deletedCount += (deleteResp?.Deleted || []).length;

      continuationToken = listResp.IsTruncated
        ? listResp.NextContinuationToken
        : undefined;
    } while (continuationToken);

    return { success: true, deletedCount };
  } catch (error) {
    req?.log?.error({ error }, 's3Service: deletePrefix - Error');
    throw error;
  }
}

/**
 * ======================================================
 * Generic JSON uploader (USED BY OPENGREP)
 * ======================================================
 */
async function uploadGenericJson(req, data, key) {
  try {
    req?.log?.info(`Uploading JSON to S3 at key: ${key}`);

    const command = new PutObjectCommand({
      Bucket: config.S3_BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json'
    });

    const response = await s3Client.send(command);
    return { success: true, key, response };
  } catch (error) {
    req?.log?.error({ error }, 's3Service: uploadGenericJson - Error');
    throw error;
  }
}

/**
 * ======================================================
 * Fetch file from S3
 * ======================================================
 */
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });

async function getBucketFile(req, key) {
  try {
    req?.log?.info(`Fetching file from S3: ${key}`);

    const command = new GetObjectCommand({
      Bucket: config.S3_BUCKET_NAME,
      Key: key,
    });

    const data = await s3Client.send(command);
    return await streamToString(data.Body);
  } catch (error) {
    req?.log?.error({ error }, 's3Service: getBucketFile - Error');
    throw error;
  }
}

async function listOrganizationScans(req, organization) {
  try {
    const prefix = `${organization}/`;

    const command = new ListObjectsV2Command({
      Bucket: config.S3_BUCKET_NAME,
      Prefix: prefix,
    });

    const resp = await s3Client.send(command);
    return resp.Contents || [];
  } catch (error) {
    req?.log?.error({ error }, 's3Service: listOrganizationScans - Error');
    throw error;
  }
}

module.exports = {
  uploadSonarScanResult,
  uploadGenericJson,   
  getBucketFile,
  listOrganizationScans,
  deletePrefix
};
