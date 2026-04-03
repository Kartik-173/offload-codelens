var AWS = require('aws-sdk');
const config = require('../config/env');
const ErrorResp = require('./ErrorResp');

if (process.env.NODE_ENV === 'development') {
  const credentials = new AWS.SharedIniFileCredentials({
    profile: 'tm-nonprod-Ops-Techops',
  });
  AWS.config.credentials = credentials;

  AWS.config.getCredentials(function (err) {
    if (err) console.log(err.stack);
  });
}

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: config.S3_REGION,
  signatureVersion: 'v4',
  params: {
    Bucket: config.S3_BUCKET,
  },
});

async function getSignedUpUrls(filenames, prefix, metadata) {
  try {
    const res = await Promise.all(
      filenames.map((filename) =>
        s3
          .getSignedUrlPromise('putObject', {
            Key: `${prefix}/${filename}`,
            Expires: config.S3_PRESIGN_UP_EXP,
            Metadata: metadata,
          })
          .then((url) => ({
            url,
            filename,
          }))
          .catch((err) => {
            throw err;
          })
      )
    );
    return res;
  } catch (err) {
    throw err;
  }
}

async function getSignedDownUrls(filenames, prefix) {
  try {
    return await Promise.all(
      filenames.map(async (filename) => {
        try {
          await s3.headObject({ Key: `${prefix}/${filename}` }).promise();
        } catch (err) {
          return {
            filename,
            error: {
              message: 'File not found',
              detail: 'File not found',
              statusCode: 404,
            },
          };
        }
        return await s3
          .getSignedUrlPromise('getObject', {
            Key: `${prefix}/${filename}`,
            Expires: config.S3_PRESIGN_DOWN_EXP,
            ResponseContentDisposition: 'attachment;',
          })
          .then((url) => ({
            filename,
            url,
          }));
      })
    );
  } catch (err) {
    throw err;
  }
}

async function getAssests(prefix) {
  try {
    const listObjs = await s3.listObjectsV2({ Prefix: prefix }).promise();
    return listObjs.Contents;
  } catch (err) {
    throw err;
  }
}

async function getSignedReadUrls(fileList) {
  try {
    return await Promise.all(
      fileList.map((filename) =>
        getSignedReadUrl(filename.Key).then((url) => ({
          url,
          ...filename,
        }))
      )
    );
  } catch (err) {
    throw err;
  }
}

async function getSignedReadUrl(
  Key,
  expires = config.S3_PRESIGN_DOWN_EXP,
  versionId
) {
  try {
    return await s3
      .getSignedUrlPromise('getObject', {
        Key: Key,
        Expires: expires,
        VersionId: versionId,
      })
      .then((url) => url);
  } catch (err) {
    throw err;
  }
}

async function getAssetsVersionList(prefix) {
  try {
    let versionFileList = [];
    let IsTruncated = true;
    let KeyMarker = null;
    let VersionIdMarker = null;
    while (IsTruncated) {
      const versionObjectList = await s3
        .listObjectVersions({
          Prefix: prefix,
          KeyMarker,
          VersionIdMarker,
        })
        .promise();
      versionFileList.push(...versionObjectList.Versions);
      IsTruncated = versionObjectList.IsTruncated;
      KeyMarker = versionObjectList.NextKeyMarker;
      VersionIdMarker = versionObjectList.NextVersionIdMarker;
    }

    return versionFileList;
  } catch (err) {
    throw err;
  }
}

async function getLatestFileVersion(filename) {
  try {
    let versionData = await s3
      .listObjectVersions({ Prefix: filename })
      .promise();
    let latestVersion = versionData.Versions.map((file) => {
      if (file.IsLatest) return file.VersionId;
    });

    return latestVersion[0];
  } catch (err) {
    throw err;
  }
}

async function getVersionSignedDownUrls(filePaths, prefix) {
  try {
    const urls = await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          await s3
            .headObject({
              Key: `${prefix}/${filePath.filename}`,
              VersionId: filePath.versionId,
            })
            .promise();
        } catch (err) {
          return {
            filename: filePath.filename,
            error: new ErrorResp('File not found', 'File not found', 404),
          };
        }
        return await s3
          .getSignedUrlPromise('getObject', {
            Key: `${prefix}/${filePath.filename}`,
            VersionId: filePath.versionId,
            Expires: config.S3_PRESIGN_DOWN_EXP,
            ResponseContentDisposition: 'attachment;',
          })
          .then((url) => ({
            url,
            filename: filePath.filename,
          }));
      })
    );
    return urls;
  } catch (err) {
    throw err;
  }
}

async function s3CopyFolder(source, dest) {
  try {
    const listResponse = await s3
      .listObjectsV2({
        Prefix: source,
        Delimiter: '/',
      })
      .promise();

    // copy objects
    const copyResponse = await Promise.all(
      listResponse.Contents.map(async (file) => {
        return await s3
          .copyObject({
            Bucket: config.S3_BUCKET,
            CopySource: `${config.S3_BUCKET}/${file.Key}`,
            Key: `${dest}${file.Key.replace(listResponse.Prefix, '')}`,
          })
          .promise();
      })
    );

    // recursive copy sub-folders
    await Promise.all(
      listResponse.CommonPrefixes.map(async (folder) => {
        return await s3CopyFolder(
          `${folder.Prefix}`,
          `${dest}${folder.Prefix.replace(listResponse.Prefix, '')}`
        );
      })
    );

    return Promise.resolve('ok');
  } catch (err) {
    throw err;
  }
}

function getAssetReadStream(key) {
  try {
    const stream = s3.getObject({ Key: key }).createReadStream();
    return stream;
  } catch (error) {
    return error;
  }
}

async function putAssetObject(body, key, params) {
  try {
    const putResponse = await s3
      .upload({ Body: body, Key: key, ...params })
      .promise();
    return putResponse;
  } catch (error) {
    return error;
  }
}

module.exports = {
  s3,
  getSignedUpUrls,
  getSignedDownUrls,
  getAssests,
  getSignedReadUrls,
  getSignedReadUrl,
  getAssetsVersionList,
  getVersionSignedDownUrls,
  s3CopyFolder,
  getAssetReadStream,
  putAssetObject,
  getLatestFileVersion,
};
