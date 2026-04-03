// controllers/credentialController.js
const credentialService = require('../services/credentialService.js');

// AWS creds
async function storeCredentials(req, res, next) {
  try {
    req?.log?.info({ requestBody: req.body }, 'credential controller: store AWS Credentials request received');
    const result = await credentialService.storeCredentials(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function getCredentials(req, res, next) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credential controller: get AWS Credentials request received');
    const result = await credentialService.getCredentials(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function listAccountIdsForUser(req, res, next) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credential controller: list AWS Account IDs request received');
    const result = await credentialService.listAccountIdsForUser(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function deleteCredentials(req, res, next) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credential controller: delete AWS Credentials request received');
    const result = await credentialService.deleteCredentials(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

// GitHub creds
async function storeGithubCredentials(req, res, next) {
  try {
    req?.log?.info({ requestBody: req.body }, 'credential controller: store GitHub Credentials request received');
    const result = await credentialService.storeGithubCredentials(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function getGithubCredentials(req, res, next) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credential controller: get GitHub Credentials request received');
    const result = await credentialService.getGithubCredentials(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

// async function listGithubAccountsForUser(req, res, next) {
//   try {
//     req?.log?.info({ requestParams: req.params }, 'credential controller: list GitHub accounts for user request received');
//     const result = await credentialService.listGithubUsernames(req);
//     res.send({ data: result });
//   } catch (error) {
//     next(error);
//   }
// }

async function deleteGithubAccount(req, res, next) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credential controller: delete GitHub account request received');
    const result = await credentialService.deleteGithubAccount(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

// ---------------- Bitbucket ----------------
async function storeBitbucketCredentials(req, res, next) {
  try {
    req?.log?.info({ requestBody: req.body }, 'credential controller: store Bitbucket Credentials request received');
    const result = await credentialService.storeBitbucketCredentials(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function getBitbucketCredentials(req, res, next) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credential controller: get Bitbucket Credentials request received');
    const result = await credentialService.getBitbucketCredentials(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function deleteBitbucketAccount(req, res, next) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credential controller: delete Bitbucket account request received');
    const result = await credentialService.deleteBitbucketAccount(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

// ---------------- Azure ----------------
async function storeAzureCredentials(req, res, next) {
  try {
    req?.log?.info({ requestBody: req.body }, 'credential controller: store Azure Credentials request received');
    const result = await credentialService.storeAzureCredentials(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function getAzureCredentials(req, res, next) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credential controller: get Azure Credentials request received');
    const result = await credentialService.getAzureCredentials(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function listAzureTenantsForUser(req, res, next) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credential controller: list Azure Tenant IDs request received');
    const result = await credentialService.listAzureTenantsForUser(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function deleteAzureCredentials(req, res, next) {
  try {
    req?.log?.info({ requestParams: req.params }, 'credential controller: delete Azure Credentials request received');
    const result = await credentialService.deleteAzureCredentials(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}


module.exports = {
  storeCredentials,
  getCredentials,
  listAccountIdsForUser,
  deleteCredentials,
  storeGithubCredentials,
  getGithubCredentials,
  // listGithubAccountsForUser,
  deleteGithubAccount,
  storeBitbucketCredentials,
  getBitbucketCredentials,
  deleteBitbucketAccount,
  storeAzureCredentials,
  getAzureCredentials,
  listAzureTenantsForUser,
  deleteAzureCredentials,
};
