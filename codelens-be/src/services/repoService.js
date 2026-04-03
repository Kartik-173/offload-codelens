// services/repoService.js
const axios = require('axios');
const { context, trace } = require('@opentelemetry/api');
const config = require('../config/env.js');

const repoSchema = require('../schemas/repoSchema.js');
const { validateSchema } = require('../utils/validation');
const ErrorResp = require('../utils/ErrorResp');
const { ERROR_CODES } = require('../constants');
const path = require('path');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const simpleGit = require('simple-git');
const {
  runSonarScanner,
  waitForTaskCompletion,
  fetchFullScanReport,
} = require('../utils/sonarUtil.js');
const { scanAllDependencies } = require('../utils/dependencyAggregator.js');
const { scanNodeCves, scanPhpCves, scanGoCves, scanPythonCves, mergeCveReports } = require('../utils/cveScanner.js');
const gitSecretsScanner = require('../utils/gitSecretsScanner.js');
const s3Service = require('./s3Service.js');
const statusStore = require('./statusStore.js');
const fsPromises = require('fs/promises');
const { readGithubCreds, readBitbucketCreds } = require('../utils/vault.js');
const AdmZip = require('adm-zip');
const { runOpengrepScan } = require('./opengrepService');

function sanitizeSonarProjectKey(input) {
  const raw = String(input || '').trim();
  const cleaned = raw.replace(/[^A-Za-z0-9\-_.:]/g, '_').replace(/_+/g, '_');
  const withoutLeadingTrailing = cleaned.replace(/^_+|_+$/g, '');
  const withFallback = withoutLeadingTrailing || 'project';
  return /^\d+$/.test(withFallback) ? `p_${withFallback}` : withFallback;
}

function buildSonarProjectKey(parts, { maxLength = 200 } = {}) {
  const raw = Array.isArray(parts) ? parts.filter(Boolean).join('_') : String(parts || '');
  const base = sanitizeSonarProjectKey(raw);
  const hash = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 8);
  const suffix = `_${hash}`;
  const allowedBaseLen = Math.max(1, maxLength - suffix.length);
  const trimmedBase = base.length > allowedBaseLen ? base.slice(0, allowedBaseLen) : base;
  return sanitizeSonarProjectKey(`${trimmedBase}${suffix}`);
}

async function attachDependencyInsights({ req, results, tempDir, projectKey, statusOptions, logLabel }) {
  await statusStore.updateStatus(projectKey, {
    phase: 'dependencies',
    progress: 70,
    message: 'Reviewing dependencies...'
  }, statusOptions);
  try {
    const gitReport = await scanAllDependencies(tempDir);
    results.gitReport = gitReport;
    req?.log?.info(`Attached gitReport to ${logLabel}`);
  } catch (e) {
    req?.log?.warn({ error: e?.message }, `Failed to attach gitReport for ${logLabel}`);
  }
}

async function attachVulnerabilityReport({ req, results, tempDir, projectKey, statusOptions, logLabel }) {
  await statusStore.updateStatus(projectKey, {
    phase: 'cve_scan',
    progress: 80,
    message: 'Checking for vulnerabilities...'
  }, statusOptions);
  try {
    // CVE Scanning
    const [nodeRes, phpRes, goRes, pyRes] = await Promise.allSettled([
      scanNodeCves(tempDir),
      scanPhpCves(tempDir),
      scanGoCves(tempDir),
      scanPythonCves(tempDir),
    ]);

    const fulfilled = [nodeRes, phpRes, goRes, pyRes]
      .filter((r) => r && r.status === 'fulfilled')
      .map((r) => r.value)
      .filter(Boolean);

    if (fulfilled.length) {
      const merged = fulfilled.reduce(
        (acc, curr) => (acc ? mergeCveReports(acc, curr) : curr),
        null
      );
      results.cveReport = merged;
      req?.log?.info(`Attached cveReport to ${logLabel}`);
    }

    const rejected = [nodeRes, phpRes, goRes, pyRes]
      .filter((r) => r && r.status === 'rejected')
      .map((r) => r.reason);
    if (rejected.length) {
      req?.log?.warn(
        { error: rejected?.[0]?.message || String(rejected?.[0] || '') },
        `One or more CVE scanners failed (${logLabel})`
      );
    }

    // Git-Secrets Scanning
    try {
      req?.log?.info(`Running git-secrets scan for ${logLabel}`);
      const gitSecretsReport = await gitSecretsScanner.scanRepository(tempDir, projectKey);
      results.gitSecretsReport = gitSecretsReport;
      req?.log?.info(`Attached gitSecretsReport to ${logLabel} - Status: ${gitSecretsReport.status}, Findings: ${gitSecretsReport.totalFindings}`);
    } catch (gitSecretsError) {
      req?.log?.warn({ error: gitSecretsError?.message }, `Git-secrets scan failed for ${logLabel}`);
      // Still add a basic report even if scanning failed
      results.gitSecretsReport = {
        projectKey,
        scanTime: new Date().toISOString(),
        totalFindings: 0,
        findings: [],
        status: 'ERROR',
        error: gitSecretsError?.message || 'Unknown error'
      };
    }
  } catch (e) {
    req?.log?.warn({ error: e?.message }, `Failed to attach vulnerability reports for ${logLabel}`);
  }
}

async function startSonarScan(req) {
  req?.log?.info({ requestBody: req.body }, 'repoService: startSonarScan');

  validateSchema(repoSchema.scan.reqBody, req.body);

  const {
    repoUrl,
    repo_username,
    userId,
    repo_provider,
    branch,
    organization,
  } = req.body;

  let repo_token = null;
  if (repo_provider === 'github') {
    const creds = await readGithubCreds(repo_username);
    repo_token = creds?.data?.token;
  }
  else if (repo_provider === 'bitbucket') {
    const creds = await readBitbucketCreds(repo_username);
    repo_token = creds?.data?.token;
  }

  if (!repoUrl || !repo_username || !userId || !repo_provider || !repo_token) {
    throw new ErrorResp(
      'Missing required fields',
      'Repository URL, username, userId, provider and token are required.',
      ERROR_CODES.BAD_REQUEST
    );
  }

  const repoName = repoUrl.split('/').pop().replace(/\.git$/, '');
  const safeRepoName = sanitizeSonarProjectKey(repoName);
  const orgName = repoUrl.split('/')[3];
  const organizationName = organization || 'default';

  const statusOptions = { organization: organizationName, userId };

  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];

  const cloneBranch = String(branch || 'main');
  const branchName = sanitizeSonarProjectKey(cloneBranch);

  const projectKey = sanitizeSonarProjectKey([safeRepoName, branchName, timestamp].join('_'));
  const tempDir = path.join(os.tmpdir(), projectKey);

  // Initialize status
  await statusStore.setStatus(projectKey, {
    status: 'running',
    phase: 'initializing',
    progress: 0,
    message: 'Initializing scan...',
    startedAt: new Date().toISOString(),
    repoName,
    branchName: cloneBranch
  }, statusOptions);

  // Capture current tracing context for async operation
  const activeContext = context.active();
  const tracer = trace.getTracer('repo-service');

  setImmediate(async () => {
    // Create a new span with proper context propagation
    const span = tracer.startSpan('sonar-scan-background', {
      attributes: {
        'service.name': config.SERVICE_NAME,
        'repo.url': repoUrl,
        'repo.provider': repo_provider,
        'user.id': userId,
        'branch': cloneBranch
      }
    });

    // Set the context for the async operation
    context.with(trace.setSpan(activeContext, span), async () => {
  try {
    await statusStore.updateStatus(projectKey, {
      phase: 'clone',
      progress: 10,
      message: `Cloning ${repo_provider} repository...`
    }, statusOptions);
    req.log.info(`Cloning ${repo_provider} repo for userId=${userId}, branch=${cloneBranch}, into ${tempDir}`);

    const git = simpleGit();

    if (repo_provider === 'github') {
      const authenticatedUrl = repoUrl.replace(
        /^https:\/\//,
        `https://${repo_username}:${repo_token}@`
      );
      await git.clone(authenticatedUrl, tempDir, ['--branch', cloneBranch]);
    } else if (repo_provider === 'bitbucket') {
      const cleanedUrl = repoUrl.replace(/^https:\/\/[^@]+@/, 'https://');
      const authenticatedUrl = cleanedUrl.replace(
        /^https:\/\//,
        `https://x-token-auth:${repo_token}@`
      );
      await git.clone(authenticatedUrl, tempDir, ['--branch', cloneBranch]);
    }

    const projectName = `${repo_username}-${repoName}-${branchName}`;
    const sonarHostUrl = config.SONAR_HOST_URL;
    const sonarToken = config.SONAR_TOKEN;

    const propsLines = [
      `sonar.projectKey=${projectKey}`,
      `sonar.projectName=${projectName}`,
      `sonar.sources=.`,
      `sonar.host.url=${sonarHostUrl}`,
    ];
    if (sonarToken) propsLines.push(`sonar.login=${sonarToken}`);

    const propsPath = path.join(tempDir, 'sonar-project.properties');
    fs.writeFileSync(propsPath, propsLines.join('\n') + '\n', 'utf-8');
    req.log.info(`Created sonar-project.properties at ${propsPath}`);

    await statusStore.updateStatus(projectKey, {
      phase: 'sonar_scan',
      progress: 25,
      message: 'Analyzing your code...'
    }, statusOptions);
    const { taskId } = await runSonarScanner(tempDir);
    await statusStore.updateStatus(projectKey, {
      phase: 'sonar_wait',
      progress: 40,
      message: 'Processing analysis results...'
    }, statusOptions);
    await waitForTaskCompletion(taskId, sonarHostUrl, sonarToken);
    await statusStore.updateStatus(projectKey, {
      phase: 'sonar_fetch',
      progress: 55,
      message: 'Preparing report...'
    }, statusOptions);
    const results = await fetchFullScanReport(projectKey, sonarHostUrl, sonarToken);
    
    results.scannedBranch = cloneBranch;
    results.organization = orgName;

    await attachDependencyInsights({
      req,
      results,
      tempDir,
      projectKey,
      statusOptions,
      logLabel: 'scan results'
    });

    await attachVulnerabilityReport({
      req,
      results,
      tempDir,
      projectKey,
      statusOptions,
      logLabel: 'scan results'
    });

    await statusStore.updateStatus(projectKey, {
      phase: 'upload',
      progress: 90,
      message: 'Finalizing results...'
    }, statusOptions);
    await s3Service.uploadSonarScanResult(
      req,
      results,
      userId,
      projectKey,
      organizationName
    );
    req?.log?.info(
      `Sonar scan results uploaded for userId=${userId}, projectKey=${projectKey}`
    );
    await statusStore.updateStatus(projectKey, {
      phase: 'opengrep_scan',
      progress: 95,
      message: 'Running OpenGrep security scan...'
    }, statusOptions);

    try {
      await runOpengrepScan({
        req,
        tempDir,
        repoUrl,
        projectKey,
        userId,
        organization: organizationName
      });

      req?.log?.info(
        `OpenGrep scan completed for projectKey=${projectKey}`
      );
    } catch (ogErr) {
      req?.log?.warn(
        { error: ogErr.message },
        `OpenGrep scan failed for projectKey=${projectKey}`
      );
    }

    await statusStore.updateStatus(projectKey, {
      status: 'completed',
      phase: 'completed',
      progress: 100,
      message: 'Scan completed successfully',
      completedAt: new Date().toISOString()
    }, statusOptions);

    setTimeout(async () => {
      try {
        await statusStore.deleteStatus(projectKey, statusOptions);
      } catch (_) {}
    }, 60000);
  } catch (err) {
    req?.log?.error(err, `Sonar scan failed for userId=${userId}`);
    await statusStore.updateStatus(projectKey, {
      status: 'failed',
      phase: 'failed',
      progress: 0,
      message: 'Scan failed',
      error: err.message,
      failedAt: new Date().toISOString()
    }, statusOptions);
    span.setStatus({ code: 2, message: err.message });
  } finally {
    await fsPromises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    req?.log?.info(`Cleaned up temp folder: ${tempDir}`);
    span.end();
  }
    }); // Close context.with
  }); // Close setImmediate

  return {
    message: `Repo scan for ${repoName}/${branchName} started. Please wait some time to see the results.`,
    projectKey,
  };
}

async function startZipScan(req) {
  req?.log?.info({ file: req.file, body: req.body }, 'repoService: startZipScan');

  validateSchema(repoSchema.zipScan.reqBody, req.body);

  const { userId, organization } = req.body;

  if (!req.file || !userId) {
    throw new ErrorResp(
      'Missing required fields',
      'Zip file and userId are required.',
      ERROR_CODES.BAD_REQUEST
    );
  }

  // Derive a Sonar-safe project name from the zip filename.
  // Sonar project keys allow: letters, digits, '-', '_', '.', ':' and at least one non-digit.
  const rawName = req.file.originalname ? path.parse(req.file.originalname).name : "Zip";
  const safeRepoName = sanitizeSonarProjectKey(rawName);
  const branch = sanitizeSonarProjectKey("Zip");
  const organizationName = organization || 'default';

  const statusOptions = { organization: organizationName, userId };

  const zipFilePath = req.file.path;

  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
  const projectKey = sanitizeSonarProjectKey([safeRepoName, branch, timestamp].join('_'));
  const tempDir = path.join(os.tmpdir(), projectKey);

  // Initialize status
  await statusStore.setStatus(projectKey, {
    status: 'running',
    phase: 'extract',
    progress: 5,
    message: 'Extracting zip file...',
    startedAt: new Date().toISOString(),
    fileName: safeRepoName
  }, statusOptions);

  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo(tempDir, true);
  req.log.info(`Extracted zip to ${tempDir}`);
  // Capture current tracing context for async operation
  const activeContext = context.active();
  const tracer = trace.getTracer('repo-service');

  setImmediate(async () => {
  // Create a new span with proper context propagation
  const span = tracer.startSpan('zip-scan-background', {
    attributes: {
      'service.name': config.SERVICE_NAME,
      'zip.file': req.file?.originalname,
      'user.id': userId,
      'branch': branch
    }
  });

  // Set the context for the async operation
  context.with(trace.setSpan(activeContext, span), async () => {
  try {
    const sonarHostUrl = config.SONAR_HOST_URL;
    const sonarToken = config.SONAR_TOKEN;

    const propsLines = [
      `sonar.projectKey=${projectKey}`,
      `sonar.projectName=${safeRepoName}`,
      `sonar.sources=.`,
      `sonar.host.url=${sonarHostUrl}`,
    ];
    if (sonarToken) propsLines.push(`sonar.login=${sonarToken}`);

    const propsPath = path.join(tempDir, 'sonar-project.properties');
    fs.writeFileSync(propsPath, propsLines.join('\n') + '\n', 'utf-8');
    req.log.info(`Created sonar-project.properties at ${propsPath}`);

    await statusStore.updateStatus(projectKey, {
      phase: 'sonar_scan',
      progress: 25,
      message: 'Analyzing your code...'
    }, statusOptions);
    const { taskId } = await runSonarScanner(tempDir);
    await statusStore.updateStatus(projectKey, {
      phase: 'sonar_wait',
      progress: 40,
      message: 'Processing analysis results...'
    }, statusOptions);
    await waitForTaskCompletion(taskId, sonarHostUrl, sonarToken);
    await statusStore.updateStatus(projectKey, {
      phase: 'sonar_fetch',
      progress: 55,
      message: 'Preparing report...'
    }, statusOptions);
    const results = await fetchFullScanReport(projectKey, sonarHostUrl, sonarToken);

    results.scannedBranch = "Zip";
    results.organization = "Zip";

    await attachDependencyInsights({
      req,
      results,
      tempDir,
      projectKey,
      statusOptions,
      logLabel: 'zip scan results'
    });

    await attachVulnerabilityReport({
      req,
      results,
      tempDir,
      projectKey,
      statusOptions,
      logLabel: 'zip scan results'
    });

    await statusStore.updateStatus(projectKey, {
      phase: 'upload',
      progress: 90,
      message: 'Finalizing results...'
    }, statusOptions);
    await s3Service.uploadSonarScanResult(req, results, userId, projectKey, organizationName);
    req?.log?.info(`Sonar scan results uploaded for userId=${userId}, projectKey=${projectKey}`);

    await statusStore.updateStatus(projectKey, {
      phase: 'opengrep_scan',
      progress: 95,
      message: 'Running OpenGrep security scan...'
    }, statusOptions);

    try {
      await runOpengrepScan({
        req,
        tempDir,
        repoUrl: req.file?.originalname || safeRepoName,
        projectKey,
        userId,
        organization: organizationName,
        branch: 'Zip'
      });

      req?.log?.info(
        `OpenGrep scan completed for projectKey=${projectKey}`
      );
    } catch (ogErr) {
      req?.log?.warn(
        { error: ogErr.message },
        `OpenGrep scan failed for projectKey=${projectKey}`
      );
    }

    await statusStore.updateStatus(projectKey, {
      status: 'completed',
      phase: 'completed',
      progress: 100,
      message: 'Scan completed successfully',
      completedAt: new Date().toISOString()
    }, statusOptions);

    setTimeout(async () => {
      try {
        await statusStore.deleteStatus(projectKey, statusOptions);
      } catch (_) {}
    }, 60000);
  } catch (err) {
    req?.log?.error(err, `Sonar scan failed for userId=${userId}`);
    await statusStore.updateStatus(projectKey, {
      status: 'failed',
      phase: 'failed',
      progress: 0,
      message: 'Scan failed',
      error: err.message,
      failedAt: new Date().toISOString()
    }, statusOptions);
  } finally {
    await fsPromises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    await fsPromises.rm(zipFilePath, { force: true }).catch(() => {});
    req?.log?.info(`Cleaned up temp folder and zip file`);
  span.end();
  }
});
})

  return {
    message: `Zip scan for ${safeRepoName}/${branch} started. Please wait some time to see the results.`,
    projectKey,
  };
}



async function getScanStatus(projectKey, options = {}) {
  try {
    const { userId, organization } = options;
    if (!userId || !organization) {
      throw new ErrorResp(
        'Invalid request',
        'Scan status requires both userId and organization',
        ERROR_CODES.BAD_REQUEST
      );
    }

    const normalizedProjectKey = String(projectKey || '')
      .split('/')
      .pop()
      .replace(/\.json$/i, '');

    const status = await statusStore.getStatus(normalizedProjectKey, options);
    if (!status) {
      return {
        status: 'not_found',
        message: 'Scan not found or expired'
      };
    }
    return status;
  } catch (error) {
    throw error;
  }
}

async function getSonarScanFile(req) {
  try {
    req?.log?.info(
      { reqQuery: req.query },
      'repoService: getSonarScanFile - Request query data'
    );

    validateSchema(repoSchema.getSonarScanFiles.reqQuery, req.query);

    const { key } = req.query;

    const fileContent = await s3Service.getBucketFile(req, key);
    const jsonData = JSON.parse(fileContent);

    return { data: jsonData };
  } catch (error) {
    req?.log?.error({ error }, 'repoService: getSonarScanFile - Error');
    throw error;
  }
}


async function getSonarScanFilesNames(req) {
  try {
    validateSchema(
      repoSchema.getSonarScanFilesNames.reqQuery,
      req.query
    );

    const { organization } = req.query;

    const objects = await s3Service.listOrganizationScans(
      req,
      organization
    );

    const scans = objects
      .filter(
        (obj) =>
          obj?.Key &&
          obj.Key.endsWith("/sonar.json") &&
          !obj.Key.includes("/scan-status/")
      )
      .map((obj) => {
        const parts = obj.Key.split("/");

        const org = parts[0];
        const userId = parts[1];
        const projectKey = parts[2];

        return {
          Key: `${org}/${userId}/${projectKey}`, // 🔥 PROJECT-LEVEL KEY
          projectKey,
          userId,
          lastModified: obj.LastModified,
          size: obj.Size,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.lastModified) -
          new Date(a.lastModified)
      );

    return { data: scans };
  } catch (error) {
    req?.log?.error(
      { error },
      "repoService: getSonarScanFilesNames - Error"
    );
    throw error;
  }
}

async function deleteSonarScanReport(req) {
  try {
    req?.log?.info(
      { reqQuery: req.query },
      'repoService: deleteSonarScanReport - Request query data'
    );

    validateSchema(repoSchema.deleteSonarScanReport.reqQuery, req.query);

    const { key } = req.query;
    const normalizedKey = String(key || '').replace(/\/+$/g, '');
    const parts = normalizedKey.split('/');

    if (parts.length < 3) {
      throw new ErrorResp(
        'Validation error',
        'Invalid key format. Expected <organization>/<userId>/<projectKey>',
        ERROR_CODES.BAD_REQUEST
      );
    }

    const organization = parts[0];
    const userId = parts[1];
    const projectKey = parts.slice(2).join('/');

    const prefix = `${organization}/${userId}/${projectKey}/`;
    const deleteResult = await s3Service.deletePrefix(req, prefix);

    let statusDeleted = false;
    try {
      const statusRes = await statusStore.deleteStatus(projectKey, { organization, userId });
      statusDeleted = Boolean(statusRes?.success);
    } catch (e) {
      req?.log?.warn(
        { error: e?.message },
        'repoService: deleteSonarScanReport - Failed to delete scan status'
      );
    }

    return {
      success: true,
      key: normalizedKey,
      deletedCount: deleteResult?.deletedCount || 0,
      statusDeleted,
    };
  } catch (error) {
    req?.log?.error(
      { error },
      'repoService: deleteSonarScanReport - Error'
    );
    throw error;
  }
}



async function getOpengrepScanFile(req) {
  try {
    req?.log?.info(
      { reqQuery: req.query },
      'repoService: getOpengrepScanFile - Request query data'
    );

    validateSchema(repoSchema.getSonarScanFiles.reqQuery, req.query);

    const { key } = req.query;

    const fileContent = await s3Service.getBucketFile(req, key);
    const jsonData = JSON.parse(fileContent);

    return { data: jsonData };
  } catch (error) {
    req?.log?.error({ error }, 'repoService: getOpengrepScanFile - Error');
    throw error;
  }
}


/**
 * GitHub - Fetch Repositories
 */
async function fetchAllGithubRepos(req) {
  try {
    req?.log?.info(
      { params: req.params },
      'repoService: fetchAllGithubRepos - Fetching all repos'
    );

    const { github_username } = req.params;
    validateSchema(repoSchema.fetchAllGithubRepos.reqParams, req.params);

    const creds = await readGithubCreds(github_username);
    const github_token = creds?.data?.token;

    if (!github_token) {
      throw new ErrorResp(
        'GitHub account not connected',
        'Please connect your github account first.',
        ERROR_CODES.NOT_FOUND
      );
    }

    let repos = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await axios.get(
        `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&affiliation=owner,collaborator,organization_member`,
        {
          headers: { Authorization: `Bearer ${github_token}` },
          validateStatus: () => true,
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new ErrorResp(
          'GitHub account not connected',
          'Please connect your github account first.',
          ERROR_CODES.NOT_FOUND
        );
      }

      if (response.status >= 400) {
        throw new ErrorResp(
          'GitHub API error',
          response.data?.message || 'Unexpected error from GitHub API',
          response.status
        );
      }

      if (!Array.isArray(response.data)) {
        throw new ErrorResp(
          'GitHub API error',
          'Invalid response from GitHub API.',
          ERROR_CODES.UNEXPECTED
        );
      }

      repos.push(
        ...response.data.map((repo) => ({
          id: repo.node_id,
          name: repo.name,
          fullName: repo.full_name,
          url: repo.html_url,
          isPrivate: repo.private,
        }))
      );

      if (response.data.length < perPage) break; // no more pages
      page++;
    }

    return repos;
  } catch (error) {
    req?.log?.error(
      { error: error.message },
      'repoService: fetchAllGithubRepos - Error'
    );
    throw error;
  }
}


/**
 * GitHub - Fetch Branches
 */
async function fetchBranchesGraphQL(req) {
  try {
    req?.log?.info(
      { params: req.params },
      'repoService: fetchBranchesGraphQL - Request params data'
    );

    const { github_username, repoOwner, repo_name } = req.params;

    const creds = await readGithubCreds(github_username);
    const github_token = creds?.data?.token;

    if (!github_token) {
      throw new ErrorResp(
        'GitHub account not connected',
        'Please connect your github account first.',
        ERROR_CODES.NOT_FOUND
      );
    }

    const url = 'https://api.github.com/graphql';

    let hasNextPage = true;
    let endCursor = null;
    let branches = [];
    let defaultBranch = null;

    while (hasNextPage) {
      const query = `
        query($owner: String!, $name: String!, $after: String) {
          repository(owner: $owner, name: $name) {
            defaultBranchRef { name }
            refs(
              refPrefix: "refs/heads/"
              first: 100
              after: $after
              orderBy: { field: ALPHABETICAL, direction: ASC }
            ) {
              nodes { name }
              pageInfo { hasNextPage endCursor }
            }
          }
        }
      `;

      const response = await axios.post(
        url,
        {
          query,
          variables: {
            owner: repoOwner,
            name: repo_name,
            after: endCursor,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${github_token}`,
            'Content-Type': 'application/json',
          },
          validateStatus: () => true,
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new ErrorResp(
          'GitHub account not connected',
          'Please connect your github account first.',
          ERROR_CODES.NOT_FOUND
        );
      }
      if (response.status >= 400) {
        throw new ErrorResp(
          'GitHub API error',
          response.data?.message || 'Unexpected error from GitHub API',
          response.status
        );
      }
      if (response.data.errors) {
        throw new ErrorResp(
          'GitHub API error',
          response.data.errors.map((e) => e.message).join(', '),
          ERROR_CODES.UNEXPECTED
        );
      }

      const repository = response.data?.data?.repository;
      if (!repository) {
        throw new ErrorResp(
          'Repository not found',
          'The requested repository does not exist or access is denied.',
          ERROR_CODES.NOT_FOUND
        );
      }

      branches.push(...(repository.refs?.nodes?.map((b) => b.name) || []));
      hasNextPage = repository.refs?.pageInfo?.hasNextPage;
      endCursor = repository.refs?.pageInfo?.endCursor;

      if (!defaultBranch && repository.defaultBranchRef) {
        defaultBranch = repository.defaultBranchRef.name;
      }
    }

    return { defaultBranch: defaultBranch || null, branches };
  } catch (error) {
    req?.log?.error(
      { error: error.message },
      'repoService: fetchBranchesGraphQL - Error'
    );
    throw error;
  }
}

/**
 * Bitbucket - Fetch Repositories
 */
async function fetchAllBitbucketRepos(req) {
  try {
    req?.log?.info(
      { params: req.params },
      'repoService: fetchAllBitbucketRepos - Fetching all repos'
    );

    const { bitbucket_username } = req.params;

    const creds = await readBitbucketCreds(bitbucket_username);
    const bitbucket_token = creds?.data?.token;

    if (!bitbucket_token) {
      throw new ErrorResp(
        'Bitbucket account not connected',
        'Please connect your bitbucket account first.',
        ERROR_CODES.NOT_FOUND
      );
    }

    const roles = ['owner', 'contributor', 'member'];
    let repos = [];

    for (const role of roles) {
      let url = `https://api.bitbucket.org/2.0/repositories?role=${role}&pagelen=100`;

      while (url) {
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${bitbucket_token}` },
          validateStatus: () => true,
        });

        if (response.status === 401 || response.status === 403) {
          throw new ErrorResp(
            'Bitbucket account not connected',
            'Please connect your bitbucket account first.',
            ERROR_CODES.NOT_FOUND
          );
        }
        if (response.status >= 400) {
          throw new ErrorResp(
            'Bitbucket API error',
            response.data?.error?.message ||
              'Unexpected error from Bitbucket API',
            response.status
          );
        }

        if (!response.data || !response.data.values) {
          throw new ErrorResp(
            'Bitbucket API error',
            `Invalid response from Bitbucket API for role=${role}`,
            ERROR_CODES.UNEXPECTED
          );
        }

        repos.push(
          ...response.data.values.map((repo) => ({
            id: repo.uuid,
            name: repo.name,
            fullName: `${repo.owner.username || repo.owner.nickname}/${
              repo.slug
            }`,
            url: repo.links.html.href,
            isPrivate: repo.is_private,
            role,
          }))
        );

        url = response.data.next || null;
      }
    }

    const uniqueRepos = Object.values(
      repos.reduce((acc, repo) => {
        acc[repo.id] = repo;
        return acc;
      }, {})
    );

    return uniqueRepos;
  } catch (error) {
    req?.log?.error(
      { error: error.message },
      'repoService: fetchAllBitbucketRepos - Error'
    );
    throw error;
  }
}

/**
 * Bitbucket - Fetch Branches
 */
async function fetchAllBitbucketBranches(req) {
  try {
    req?.log?.info(
      { params: req.params },
      'repoService: fetchBitbucketBranches - Request params data'
    );

    const { bitbucket_username, workspace, repoSlug } = req.params;

    const creds = await readBitbucketCreds(bitbucket_username);
    const bitbucket_token = creds?.data?.token;
    if (!bitbucket_token) {
      throw new ErrorResp(
        'Bitbucket account not connected',
        'Please connect your bitbucket account first.',
        ERROR_CODES.NOT_FOUND
      );
    }

    if (!workspace || !repoSlug) {
      throw new ErrorResp(
        'Missing parameters',
        'Workspace and repository slug are required to fetch branches.',
        ERROR_CODES.BAD_REQUEST
      );
    }

    let branches = [];
    let defaultBranch = null;

    let url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/refs/branches?pagelen=100`;

    while (url) {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${bitbucket_token}` },
        validateStatus: () => true,
      });

      if (response.status === 401 || response.status === 403) {
        throw new ErrorResp(
          'Bitbucket account not connected',
          'Please connect your bitbucket account first.',
          ERROR_CODES.NOT_FOUND
        );
      }
      if (response.status >= 400) {
        throw new ErrorResp(
          'Bitbucket API error',
          response.data?.error?.message ||
            'Unexpected error from Bitbucket API',
          response.status
        );
      }

      if (!response.data || !response.data.values) {
        throw new ErrorResp(
          'Bitbucket API error',
          `Invalid response from Bitbucket API for ${workspace}/${repoSlug}`,
          ERROR_CODES.UNEXPECTED
        );
      }

      branches.push(...response.data.values.map((branch) => branch.name));

      if (response.data?.mainbranch?.name) {
        defaultBranch = response.data.mainbranch.name;
      }

      url = response.data.next || null;
    }

    return {
      defaultBranch: defaultBranch || (branches.length ? branches[0] : null),
      branches,
    };
  } catch (error) {
    req?.log?.error(
      { error: error.message },
      'branchService: fetchAllBitbucketBranches - Error'
    );
    throw error;
  }
}

module.exports = {
  startSonarScan,
  startZipScan,
  getScanStatus,
  getSonarScanFilesNames,
  deleteSonarScanReport,
  getSonarScanFile,
  getOpengrepScanFile,
  fetchAllGithubRepos,
  fetchBranchesGraphQL,
  fetchAllBitbucketRepos,
  fetchAllBitbucketBranches,
};
