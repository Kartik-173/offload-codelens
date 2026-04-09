const express = require('express');
const router = express.Router();

const authRouter = require('./auth');
const repoRouter = require('./repo');
const reportRouter = require('./report');
const complianceRouter = require('./compliance');
const oauthRouter = require('./oauth');
const performanceRouter = require('./performance');

router.use('/auth', authRouter);
router.use('/repo', repoRouter);
router.use('/report', reportRouter);
router.use('/redirect', complianceRouter);
router.use('/oauth', oauthRouter);
router.use('/performance', performanceRouter);

module.exports = router;
