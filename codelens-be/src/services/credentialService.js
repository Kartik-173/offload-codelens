// services/credentialService.js

const authSchema = require('../schemas/authSchema.js');

const {
  // AWS
  storeAWSCreds,
  readAWSCreds,
  listAWSCredAccountIds,
  deleteAWSCreds,

  // GitHub
  storeGithubCreds,
  readGithubCreds,
  listGithubUsernamesForUser,
  deleteGithubCreds,

  // Bitbucket
  storeBitbucketCreds,
  readBitbucketCreds,
  deleteBitbucketCreds,

  // Azure
  storeAzureCreds,
  readAzureCreds,
  listAzureTenantIds,
  deleteAzureCreds,
} = require('../utils/vault.js');

const { validateSchema } = require('../utils/validation.js');
const ErrorResp = require('../utils/ErrorResp');
const { ERROR_CODES } = require('../constants');

/* ===================== AWS ===================== */

async function storeCredentials(req) {
  try {
    req?.log?.info({ requestBody: req.body }, 'credentialService: storeCredentials request data');
    validateSchema(authSchema.storeCredentials.reqBody, req.body);
    const { userId, accountId, name, accessKey, secretKey } = req.body;
    const response = await storeAWSCreds(userId, accountId, name, accessKey, secretKey);
    if (response === undefined || response === null)
      throw new ErrorResp('Vault error', 'Failed to store AWS credentials in Vault', ERROR_CODES.INTERNAL_SERVER_ERROR);
    return { success: true, message: 'AWS credentials stored successfully' };
  } catch (error) {
    throw error;
  }
}

async function getCredentials(req) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credentialService: getCredentials request data');
    validateSchema(authSchema.getCredentials.reqBody, req.params);
    const { userId, accountId } = req.params;
    const secret = await readAWSCreds(userId, accountId);
    const inner = secret?.data?.data || secret?.data || secret;
    const creds = inner || null;
    if (creds && accountId && creds["aws_account_id"] && creds["aws_account_id"] !== accountId)
      return { creds: null };
    return { creds };
  } catch (error) {
    throw error;
  }
}

async function listAccountIdsForUser(req) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credentialService: listAccountIdsForUser request data');
    const { userId } = req.params;
    if (!userId)
      throw new ErrorResp('Validation error', 'Missing userId param', ERROR_CODES.BAD_REQUEST);
    const accountIds = await listAWSCredAccountIds(userId);
    const accounts = await Promise.all(
      accountIds.map(async (id) => {
        const accountId = String(id);
        try {
          const secret = await readAWSCreds(userId, accountId);
          const inner = secret?.data?.data || secret?.data || secret;
          return { accountId, name: inner?.name || null };
        } catch (_) {
          return { accountId, name: null };
        }
      }),
    );

    return { accountIds, accounts };
  } catch (error) {
    throw error;
  }
}

async function deleteCredentials(req) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credentialService: deleteCredentials request data');
    validateSchema(authSchema.deleteCredentials.reqBody, req.params);
    const { userId, accountId } = req.params;
    const result = await deleteAWSCreds(userId, accountId);
    if (result?.notFound)
      throw new ErrorResp('Not Found', 'AWS credentials not found', ERROR_CODES.NOT_FOUND);
    if (!result?.ok)
      throw new ErrorResp('Vault error', 'Failed to delete AWS credentials from Vault', ERROR_CODES.INTERNAL_SERVER_ERROR);
    return { success: true, message: 'AWS credentials deleted successfully' };
  } catch (error) {
    throw error;
  }
}


/* ===================== AZURE ===================== */

async function storeAzureCredentials(req) {
  try {
    req?.log?.info({ requestBody: req.body }, 'credentialService: storeAzureCredentials request data');
    validateSchema(authSchema.storeAzureCredentials.reqBody, req.body);
    const { userId, tenantId, name, clientId, clientSecret, subscriptionId } = req.body;
    const response = await storeAzureCreds(userId, tenantId, name, clientId, clientSecret, subscriptionId);
    if (response === undefined || response === null)
      throw new ErrorResp('Vault error', 'Failed to store Azure credentials in Vault', ERROR_CODES.INTERNAL_SERVER_ERROR);
    return { success: true, message: 'Azure credentials stored successfully' };
  } catch (error) {
    throw error;
  }
}

async function getAzureCredentials(req) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credentialService: getAzureCredentials request data');
    validateSchema(authSchema.getAzureCredentials.reqBody, req.params);
    const { userId, tenantId } = req.params;
    const secret = await readAzureCreds(userId, tenantId);
    const inner = secret?.data?.data || secret?.data || secret;
    const creds = inner || null;
    if (creds && tenantId && creds["azure_tenant_id"] && creds["azure_tenant_id"] !== tenantId)
      return { creds: null };
    return { creds };
  } catch (error) {
    throw error;
  }
}

async function listAzureTenantsForUser(req) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credentialService: listAzureTenantsForUser request data');
    const { userId } = req.params;
    if (!userId)
      throw new ErrorResp('Validation error', 'Missing userId param', ERROR_CODES.BAD_REQUEST);
    const tenantIds = await listAzureTenantIds(userId);
    const tenants = await Promise.all(
      tenantIds.map(async (id) => {
        const tenantId = String(id);
        try {
          const secret = await readAzureCreds(userId, tenantId);
          const inner = secret?.data?.data || secret?.data || secret;
          return { tenantId, name: inner?.name || null };
        } catch (_) {
          return { tenantId, name: null };
        }
      }),
    );

    return { tenantIds, tenants };
  } catch (error) {
    throw error;
  }
}

async function deleteAzureCredentials(req) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credentialService: deleteAzureCredentials request data');
    validateSchema(authSchema.deleteAzureCredentials.reqBody, req.params);
    const { userId, tenantId } = req.params;
    const result = await deleteAzureCreds(userId, tenantId);
    if (result?.notFound)
      throw new ErrorResp('Not Found', 'Azure credentials not found', ERROR_CODES.NOT_FOUND);
    if (!result?.ok)
      throw new ErrorResp('Vault error', 'Failed to delete Azure credentials from Vault', ERROR_CODES.INTERNAL_SERVER_ERROR);
    return { success: true, message: 'Azure credentials deleted successfully' };
  } catch (error) {
    throw error;
  }
}

/* ===================== GITHUB ===================== */

async function storeGithubCredentials(req) {
  try {
    req?.log?.info({ requestBody: req.body }, 'credentialService: storeGithubCredentials request data');
    validateSchema(authSchema.storeGithubCredentials.reqBody, req.body);
    const { githubUsername, token } = req.body;
    await storeGithubCreds(githubUsername, token);
    return { success: true, message: 'GitHub credentials stored successfully' };
  } catch (error) {
    throw error;
  }
}

async function getGithubCredentials(req) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credentialService: getGithubCredentials request data');
    validateSchema(authSchema.getGithubCredentials.reqBody, req.params);
    const { githubUsername } = req.params;
    const creds = await readGithubCreds(githubUsername);
    return { creds: creds || null };
  } catch (error) {
    throw error;
  }
}

async function deleteGithubAccount(req) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credentialService: deleteGithubAccount request data');
    validateSchema(authSchema.deleteGithubAccount.reqBody, req.params);
    const { githubUsername } = req.params;
    const result = await deleteGithubCreds(githubUsername);
    if (!result)
      throw new ErrorResp('Vault error', 'Failed to delete GitHub account from Vault', ERROR_CODES.INTERNAL_SERVER_ERROR);
    return { success: true, message: 'GitHub account deleted successfully' };
  } catch (error) {
    throw error;
  }
}

/* ===================== BITBUCKET ===================== */

async function storeBitbucketCredentials(req) {
  try {
    req?.log?.info({ requestBody: req.body }, 'credentialService: storeBitbucketCredentials request data');
    validateSchema(authSchema.storeBitbucketCredentials.reqBody, req.body);
    const { bitbucketUsername, token } = req.body;
    await storeBitbucketCreds(bitbucketUsername, token);
    return { success: true, message: 'Bitbucket credentials stored successfully' };
  } catch (error) {
    throw error;
  }
}

async function getBitbucketCredentials(req) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credentialService: getBitbucketCredentials request data');
    validateSchema(authSchema.getBitbucketCredentials.reqBody, req.params);
    const { bitbucketUsername } = req.params;
    const creds = await readBitbucketCreds(bitbucketUsername);
    return { creds: creds || null };
  } catch (error) {
    throw error;
  }
}

async function deleteBitbucketAccount(req) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credentialService: deleteBitbucketAccount request data');
    validateSchema(authSchema.deleteBitbucketAccount.reqBody, req.params);
    const { bitbucketUsername } = req.params;
    const result = await deleteBitbucketCreds(bitbucketUsername);
    if (!result)
      throw new ErrorResp('Vault error', 'Failed to delete Bitbucket account from Vault', ERROR_CODES.INTERNAL_SERVER_ERROR);
    return { success: true, message: 'Bitbucket account deleted successfully' };
  } catch (error) {
    throw error;
  }
}

/* ===================== EXPORTS ===================== */

module.exports = {
  // AWS
  storeCredentials,
  getCredentials,
  listAccountIdsForUser,
  deleteCredentials,

  // GitHub
  storeGithubCredentials,
  getGithubCredentials,
  deleteGithubAccount,

  // Bitbucket
  storeBitbucketCredentials,
  getBitbucketCredentials,
  deleteBitbucketAccount,

  // Azure
  storeAzureCredentials,
  getAzureCredentials,
  listAzureTenantsForUser,
  deleteAzureCredentials,
};
