const express = require('express');
const router = express.Router();
const multer = require('multer');
const repoController = require('../../controllers/repoController.js');

const upload = multer({ dest: 'uploads/' });

router.post('/scan', repoController.startSonarScan);
router.post('/scan/upload-zip', upload.single('file'), repoController.startZipScan);
router.get('/scan/status/:projectKey', repoController.getScanStatus);
router.get('/scan-list-names', repoController.sonarScanFilesNames);
router.get('/scan-list', repoController.getSonarScanFile);
router.delete('/scan-report', repoController.deleteSonarScanReport);

router.get('/opengrep', repoController.getOpengrepScanFile);

router.get('/repos/:github_username', repoController.fetchAllGithubRepos);
router.get('/branches/:github_username/:repoOwner/:repo_name', repoController.fetchBranchesGraphQL);

router.get('/bitbucket/repos/:bitbucket_username', repoController.fetchAllBitbucketRepos)
router.post('/bitbucket/branches/:bitbucket_username/:workspace/:repoSlug', repoController.fetchAllBitbucketBranches)

module.exports = router;
