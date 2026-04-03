const express = require('express');
const router = express.Router();

const credentialController = require('../../controllers/credentialController.js');

//aws creds
router.post('/store-creds', credentialController.storeCredentials);
router.get('/get-creds/:userId/:accountId', credentialController.getCredentials);
router.get('/get-account-ids/:userId', credentialController.listAccountIdsForUser);
router.delete('/delete-creds/:userId/:accountId', credentialController.deleteCredentials);

// GitHub creds
router.post('/store-github-creds', credentialController.storeGithubCredentials);
router.get('/get-github-cred/:githubUsername', credentialController.getGithubCredentials);
// router.get('/get-github-creds-list/:userId', credentialController.listGithubAccountsForUser);
router.delete('/delete-github-cred/:githubUsername', credentialController.deleteGithubAccount);

// Bitbucket creds
router.post('/store-bitbucket-creds', credentialController.storeBitbucketCredentials);
router.get('/get-bitbucket-cred/:bitbucketUsername', credentialController.getBitbucketCredentials);
router.delete('/delete-bitbucket-cred/:bitbucketUsername', credentialController.deleteBitbucketAccount);

// Azure creds
router.post('/store-azure-creds', credentialController.storeAzureCredentials);
router.get('/get-azure-creds/:userId/:tenantId', credentialController.getAzureCredentials);
router.get('/get-azure-tenant-ids/:userId', credentialController.listAzureTenantsForUser);
router.delete('/delete-azure-creds/:userId/:tenantId', credentialController.deleteAzureCredentials);


module.exports = router;
