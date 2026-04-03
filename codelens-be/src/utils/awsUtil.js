const config = require('../config/env');
const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts');
const DEFAULT_REGION = 'us-east-1';

const globalConfig = {
  credentials: {
    accessKeyId: config.ACCESSKEYID,
    secretAccessKey: config.SECRETACCESSKEY,
  },
  region: 'ap-southeast-1',
};

/**
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/sts/command/AssumeRoleCommand/
 */

async function getAWSConfig(req, roleARN, durationSeconds = 3600) {
  try {
    // Create an AWS STS service client object.
    const config = { ...globalConfig };

    const client = new STSClient(config);

    // Returns a set of temporary security credentials that you can use to
    // access Amazon Web Services resources that you might not normally
    // have access to.
    const command = new AssumeRoleCommand({
      // The Amazon Resource Name (ARN) of the role to assume.
      RoleArn: roleARN,
      // An identifier for the assumed role session.
      RoleSessionName: `SESSION_${Date.now()}`,
      // The duration, in seconds, of the role session. The value specified
      // can range from 900 seconds (15 minutes) up to the maximum session
      // duration set for the role.
      DurationSeconds: durationSeconds,
      ExternalId: 567567
    });
    const response = await client.send(command);
    req?.log?.info(response, "STS - AssumeRoleCommand - Response ");
    return {
      credentials: {
        accessKeyId: response.Credentials.AccessKeyId,
        secretAccessKey: response.Credentials.SecretAccessKey,
        sessionToken: response.Credentials.SessionToken,
      },
      region: DEFAULT_REGION
    };
  } catch (error) {
    req?.log?.error({ error }, "getAWSConfig - catch");
    throw error;
  }
};

module.exports = {
  getAWSConfig,
};