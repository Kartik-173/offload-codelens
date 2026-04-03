// vault.js
const axios = require("axios");
const config = require("../config/env.js");

const VAULT_ADDR = config.VAULT_ADDR;
const VAULT_TOKEN = config.VAULT_TOKEN;

/* ===================== AWS ===================== */

// Store AWS credentials
async function storeAWSCreds(userId, accountId, name, accessKey, secretKey) {
  const url = `${VAULT_ADDR}/v1/codelens/awsSecrets/${userId}/${accountId}`;
  try {
    const response = await axios.post(
      url,
      {
        name,
        aws_account_id: accountId,
        access_key: accessKey,
        secret_key: secretKey,
      },
      {
        headers: {
          "X-Vault-Token": VAULT_TOKEN,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Vault store error:", error.response?.data || error.message);
    throw error;
  }
}


// Read AWS credentials
async function readAWSCreds(userId, accountId) {
  const url = `${VAULT_ADDR}/v1/codelens/awsSecrets/${userId}/${accountId}`;
  try {
    const response = await axios.get(url, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response?.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`Vault: No AWS creds for user=${userId}, account=${accountId}`);
      return false;
    }
    console.error("Vault read error:", error.response?.data || error.message);
    throw error;
  }
}


// List all AWS account IDs for user
async function listAWSCredAccountIds(userId) {
  const url = `${VAULT_ADDR}/v1/codelens/awsSecrets/${userId}?list=true`;
  try {
    const response = await axios.request({
      method: "LIST",
      url,
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response?.data?.data?.keys || [];
  } catch (error) {
    if (error.response?.status === 404) return [];
    console.error("Vault list error:", error.response?.data || error.message);
    throw error;
  }
}

async function deleteAWSCreds(userId, accountId) {
  const url = `${VAULT_ADDR}/v1/codelens/awsSecrets/${userId}/${accountId}`;
  try {
    const response = await axios.delete(url, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return { ok: response.status === 204 || response.status === 200, notFound: false };
  } catch (error) {
    if (error.response?.status === 404) {
      return { ok: false, notFound: true };
    }
    console.error("Vault deleteAWSCreds error:", error.response?.data || error.message);
    throw error;
  }
}


/* ===================== GITHUB ========================= */

// Store GitHub credentials
async function storeGithubCreds(githubUsername, token) {
  const url = `${VAULT_ADDR}/v1/github/${githubUsername}`;
  try {
    const response = await axios.post(url, {
      token,
      github_username: githubUsername,
    }, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Vault GitHub store error:", error.response?.data || error.message);
    throw error;
  }
}

// Read GitHub credentials
async function readGithubCreds(githubUsername) {
  const url = `${VAULT_ADDR}/v1/github/${githubUsername}`;
  try {
    const response = await axios.get(url, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response?.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`Vault: No GitHub creds found for ${githubUsername}`);
      return false;
    }
    console.error("Vault GitHub read error:", error.response?.data || error.message);
    throw error;
  }
}

// Delete GitHub credentials
async function deleteGithubCreds(githubUsername) {
  const url = `${VAULT_ADDR}/v1/github/${githubUsername}`;
  try {
    const response = await axios.delete(url, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response.status === 204 || response.status === 200;
  } catch (error) {
    console.error("Vault deleteGithubCreds error:", error.response?.data || error.message);
    return false;
  }
}

/* ---------------- GitHub OAuth Config ---------------- */

async function storeGithubOAuthConfig(organization, clientId, clientSecret) {
  const url = `${VAULT_ADDR}/v1/codelens/githubSecrets/${organization}`;
  try {
    const response = await axios.post(url, {
      client_id: clientId,
      client_secret: clientSecret,
    }, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Vault GitHub OAuth store error:", error.response?.data || error.message);
    throw error;
  }
}

async function readGithubOAuthConfig(organization) {
  const url = `${VAULT_ADDR}/v1/codelens/githubSecrets/${organization}`;
  try {
    const response = await axios.get(url, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response?.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`Vault: No GitHub OAuth config found for organization=${organization}`);
      return false;
    }
    console.error("Vault GitHub OAuth read error:", error.response?.data || error.message);
    throw error;
  }
}

/* ===================== BITBUCKET ====================== */

// Store Bitbucket credentials
async function storeBitbucketCreds(bitbucketUsername, token) {
  const url = `${VAULT_ADDR}/v1/bitbucket/${bitbucketUsername}`;
  try {
    const response = await axios.post(url, {
      token,
      bitbucket_username: bitbucketUsername,
    }, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Vault Bitbucket store error:", error.response?.data || error.message);
    throw error;
  }
}

// Read Bitbucket credentials
async function readBitbucketCreds(bitbucketUsername) {
  const url = `${VAULT_ADDR}/v1/bitbucket/${bitbucketUsername}`;
  try {
    const response = await axios.get(url, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response?.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`Vault: No Bitbucket creds found for ${bitbucketUsername}`);
      return false;
    }
    console.error("Vault Bitbucket read error:", error.response?.data || error.message);
    throw error;
  }
}

// Delete Bitbucket credentials
async function deleteBitbucketCreds(bitbucketUsername) {
  const url = `${VAULT_ADDR}/v1/bitbucket/${bitbucketUsername}`;
  try {
    const response = await axios.delete(url, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response.status === 204 || response.status === 200;
  } catch (error) {
    console.error("Vault deleteBitbucketCreds error:", error.response?.data || error.message);
    return false;
  }
}

/* ---------------- Bitbucket OAuth Config ---------------- */

async function storeBitbucketOAuthConfig(organization, clientId, clientSecret) {
  const url = `${VAULT_ADDR}/v1/codelens/bitbucketSecrets/${organization}`;
  try {
    const response = await axios.post(url, {
      client_id: clientId,
      client_secret: clientSecret,
    }, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Vault Bitbucket OAuth store error:", error.response?.data || error.message);
    throw error;
  }
}

async function readBitbucketOAuthConfig(organization) {
  const url = `${VAULT_ADDR}/v1/codelens/bitbucketSecrets/${organization}`;
  try {
    const response = await axios.get(url, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response?.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`Vault: No Bitbucket OAuth config found for organization=${organization}`);
      return false;
    }
    console.error("Vault Bitbucket OAuth read error:", error.response?.data || error.message);
    throw error;
  }
}

/* ===================== AZURE ========================== */

// Store Azure credentials
async function storeAzureCreds(userId, tenantId, name, clientId, clientSecret, subscriptionId) {
  const url = `${VAULT_ADDR}/v1/codelens/azureSecrets/${userId}/${tenantId}`;
  try {
    const response = await axios.post(url, {
      name,
      azure_tenant_id: tenantId,
      azure_client_id: clientId,
      azure_client_secret: clientSecret,
      azure_subscription_id: subscriptionId,
    }, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Vault Azure store error:", error.response?.data || error.message);
    throw error;
  }
}

async function deleteAzureCreds(userId, tenantId) {
  const url = `${VAULT_ADDR}/v1/codelens/azureSecrets/${userId}/${tenantId}`;
  try {
    const response = await axios.delete(url, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return { ok: response.status === 204 || response.status === 200, notFound: false };
  } catch (error) {
    if (error.response?.status === 404) {
      return { ok: false, notFound: true };
    }
    console.error("Vault deleteAzureCreds error:", error.response?.data || error.message);
    throw error;
  }
}

// List Azure tenant IDs for user
async function listAzureTenantIds(userId) {
  const url = `${VAULT_ADDR}/v1/codelens/azureSecrets/${userId}?list=true`;
  try {
    const response = await axios.request({
      method: "LIST",
      url,
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response?.data?.data?.keys || [];
  } catch (error) {
    if (error.response?.status === 404) {
      const legacy = await readAzureCredsLegacy(userId);
      if (!legacy) return [];

      const inner = legacy?.data?.data || legacy?.data || legacy;
      const tenantId = inner && inner["azure_tenant_id"];
      return tenantId ? [tenantId] : [];
    }
    console.error("Vault Azure list error:", error.response?.data || error.message);
    throw error;
  }
}

async function readAzureCredsLegacy(userId) {
  const url = `${VAULT_ADDR}/v1/codelens/azureSecrets/${userId}`;
  try {
    const response = await axios.get(url, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response?.data;
  } catch (error) {
    if (error.response?.status === 404) return false;
    console.error("Vault Azure legacy read error:", error.response?.data || error.message);
    throw error;
  }
}

// Read Azure credentials. If tenantId is omitted, reads the first stored tenant.
async function readAzureCreds(userId, tenantId) {
  const readByTenant = async (tId) => {
    const url = `${VAULT_ADDR}/v1/codelens/azureSecrets/${userId}/${tId}`;
    try {
      const response = await axios.get(url, {
        headers: {
          "X-Vault-Token": VAULT_TOKEN,
        },
      });
      return response?.data;
    } catch (error) {
      if (error.response?.status === 404) {
        const legacy = await readAzureCredsLegacy(userId);
        if (!legacy) return false;
        const inner = legacy?.data?.data || legacy?.data || legacy;
        if (inner?.azure_tenant_id && inner.azure_tenant_id !== tId) return false;
        return legacy;
      }
      console.error("Vault Azure read error:", error.response?.data || error.message);
      throw error;
    }
  };

  if (tenantId) {
    return readByTenant(tenantId);
  }

  const tenantIds = await listAzureTenantIds(userId);
  if (!tenantIds.length) {
    console.warn(`Vault: No Azure creds found for userId=${userId}`);
    return false;
  }

  return readByTenant(tenantIds[0]);
}

/* ===================== SLACK ===================== */

async function getSlackIntegration(organization) {
  const url = `${VAULT_ADDR}/v1/codelens/slackIntegration/${organization}`;
  try {
    const response = await axios.get(url, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error("❌ VAULT: Error retrieving Slack integration:", error.response?.data || error.message);
    throw error;
  }
}

async function storeSlackIntegration(organization, integration) {
  const url = `${VAULT_ADDR}/v1/codelens/slackIntegration/${organization}`;
  try {
    const response = await axios.post(
      url,
      integration,
      {
        headers: {
          "X-Vault-Token": VAULT_TOKEN,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ VAULT: Error storing Slack integration:", error.response?.data || error.message);
    throw error;
  }
}

async function deleteSlackIntegration(organization) {
  const url = `${VAULT_ADDR}/v1/codelens/slackIntegration/${organization}`;
  try {
    const response = await axios.delete(url, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error("❌ VAULT: Error deleting Slack integration:", error.response?.data || error.message);
    throw error;
  }
}

async function storeSlackWebhook(organization, webhookUrl) {
  const url = `${VAULT_ADDR}/v1/codelens/slackWebhooks/${organization}`;
  try {
    const response = await axios.post(
      url,
      {
        webhook_url: webhookUrl,
        created_at: new Date().toISOString(),
      },
      {
        headers: {
          "X-Vault-Token": VAULT_TOKEN,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ VAULT: Error storing Slack webhook:", error.response?.data || error.message);
    throw error;
  }
}

async function getSlackWebhook(organization) {
  const url = `${VAULT_ADDR}/v1/codelens/slackWebhooks/${organization}`;
  try {
    const response = await axios.get(url, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error("❌ VAULT: Error retrieving Slack webhook:", error.response?.data || error.message);
    throw error;
  }
}

async function deleteSlackWebhook(organization) {
  const url = `${VAULT_ADDR}/v1/codelens/slackWebhooks/${organization}`;
  try {
    const response = await axios.delete(url, {
      headers: {
        "X-Vault-Token": VAULT_TOKEN,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error("❌ VAULT: Error deleting Slack webhook:", error.response?.data || error.message);
    throw error;
  }
}

/* ===================== EXPORTS ======================== */

module.exports = {
  // AWS
  storeAWSCreds,
  readAWSCreds,
  listAWSCredAccountIds,
  deleteAWSCreds,

  // GitHub
  storeGithubCreds,
  readGithubCreds,
  deleteGithubCreds,
  storeGithubOAuthConfig,
  readGithubOAuthConfig,

  // Bitbucket
  storeBitbucketCreds,
  readBitbucketCreds,
  deleteBitbucketCreds,
  storeBitbucketOAuthConfig,
  readBitbucketOAuthConfig,

  // Azure
  storeAzureCreds,
  readAzureCreds,
  listAzureTenantIds,
  deleteAzureCreds,

  storeSlackIntegration,
  getSlackIntegration,
  deleteSlackIntegration,
  storeSlackWebhook,
  getSlackWebhook,
  deleteSlackWebhook,
};
