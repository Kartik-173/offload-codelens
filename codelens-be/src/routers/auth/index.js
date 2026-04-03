const express = require('express');
const router = express.Router();

const authController = require('../../controllers/authController');

router.post('/register', authController.signUp);
// router.post('/login', authController.signIn);
router.get('/github', authController.redirectToGitHubLogin);
router.get('/github/callback', authController.handleGitHubCallback);
router.post('/github/logout', authController.githubLogout);
router.get('/bitbucket', authController.redirectToBitBucketLogin);
router.get('/bitbucket/callback', authController.handleBitBucketCallback);
router.post('/bitbucket/logout', authController.bitbucketLogout);

module.exports = router;
