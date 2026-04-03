const repoService = require('../services/repoService.js');

async function startSonarScan(req, res, next) {
  try {
    req.log.info({ requestBody: req.body }, 'repoController: startSonarScan');
    const result = await repoService.startSonarScan(req);
    res.status(200).send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function startZipScan(req, res, next) {
  try {
    req.log.info({ file: req.file }, 'repoController: startZipScan');
    const result = await repoService.startZipScan(req);
    res.status(200).send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function getScanStatus(req, res, next) {
  try {
    const { projectKey } = req.params;
    const normalizedProjectKey = String(projectKey || '').split('/').pop();
    const { userId, organization } = req.query;
    req.log.info({ projectKey: normalizedProjectKey }, 'repoController: getScanStatus');
    const result = await repoService.getScanStatus(normalizedProjectKey, { userId, organization });
    res.status(200).send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function getSonarScanFile(req, res, next) {
  try {
    req?.log?.info({ reqQuery: req.query }, 'repoController: getSonarScanFile - Request query data');
    const result = await repoService.getSonarScanFile(req);
    res.send(result);
  } catch (error) {
    next(error);
  }
}

async function sonarScanFilesNames(req, res, next) {
  try {
    req?.log?.info({ reqQuery: req.query }, 'repoController: sonarScanFilesNames - Request query data');
    const result = await repoService.getSonarScanFilesNames(req);
    res.send(result);
  } catch (error) {
    next(error);
  }
}

async function deleteSonarScanReport(req, res, next) {
  try {
    req?.log?.info({ reqQuery: req.query }, 'repoController: deleteSonarScanReport - Request query data');
    const result = await repoService.deleteSonarScanReport(req);
    res.send({ data: result });
  } catch (error) {
    next(error);
  }
}

async function getOpengrepScanFile(req, res, next) {
  try {
    req?.log?.info({ reqQuery: req.query },'repoController: getOpengrepScanFile - Request query data');
    const result = await repoService.getOpengrepScanFile(req);
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
}


async function fetchAllGithubRepos(req, res, next) {
  try {
    req?.log?.info({ params: req.params }, 'repoController: fetchAllGithubRepos - Request params data');
    const result = await repoService.fetchAllGithubRepos(req);
    res.send(result);
  } catch (error) {
    next(error);
  }
}


async function fetchBranchesGraphQL(req, res, next) {
  try {
    req?.log?.info({ params: req.params }, 'repoController: fetchBranchesGraphQL - Request params data');
    const result = await repoService.fetchBranchesGraphQL(req);
    res.send(result);
  } catch (error) {
    next(error);
  }
}

async function fetchAllBitbucketRepos(req, res, next) {
  try {
    req?.log?.info({ reqBody: req.params }, 'repoController: fetchAllBitbucketRepos - Request params data');
    const result = await repoService.fetchAllBitbucketRepos(req);
    res.send(result);
  } catch (error) {
    next(error);
  }
}

async function fetchAllBitbucketBranches(req, res, next) {
  try {
    req?.log?.info({ reqBody: req.params }, 'repoController: fetchAllBitbucketBranches - Request params data');
    const result = await repoService.fetchAllBitbucketBranches(req);
    res.send(result);
  } catch (error) {
    next(error);
  }
}


module.exports = {
  startSonarScan,
  startZipScan,
  getScanStatus,
  getSonarScanFile,
  sonarScanFilesNames,
  deleteSonarScanReport,
  fetchAllGithubRepos,
  fetchBranchesGraphQL,
  fetchAllBitbucketRepos,
  fetchAllBitbucketBranches,
  getOpengrepScanFile
};
