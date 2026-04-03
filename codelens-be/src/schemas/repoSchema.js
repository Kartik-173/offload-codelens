module.exports = {
  scan: {
    reqBody: {
      type: 'object',
      required: ['repoUrl', 'repo_username', 'userId', 'repo_provider'],
      properties: {
        repoUrl: { type: 'string' },
        repo_username: { type: 'string' },
        userId: { type: 'string' },
        repo_provider: { type: 'string', enum: ['github', 'bitbucket'] },
        branch: { type: 'string' },
        organization: { type: 'string' },
      },
      additionalProperties: true,
    },
  },

  zipScan: {
    reqBody: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { type: 'string' },
        organization: { type: 'string' },
      },
      additionalProperties: true,
    },
    reqFile: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'object',
          properties: {
            originalname: { type: 'string' },
            mimetype: { type: 'string', enum: ['application/zip'] },
            path: { type: 'string' },
            size: { type: 'integer' },
          },
          additionalProperties: true,
        },
      },
      additionalProperties: false,
    },
  },

  getSonarScanFiles: {
    reqQuery: {
      type: 'object',
      required: ['key'],
      properties: {
        key: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  getSonarScanFilesNames: {
    reqQuery: {
      type: 'object',
      required: ['organization'],
      properties: {
        organization: { type: 'string' },
      },
      additionalProperties: false,
    },
  },

  deleteSonarScanReport: {
    reqQuery: {
      type: 'object',
      required: ['key'],
      properties: {
        key: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  fetchReposGraphQL: {
    reqBody: {
      type: 'object',
      required: ['github_token'],
      properties: {
        github_token: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  fetchBranchesGraphQL: {
    reqBody: {
      type: 'object',
      required: ['github_username', 'repo_name', 'github_token'],
      properties: {
        github_username: { type: 'string' },
        repo_name: { type: 'string' },
        github_token: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  fetchAllGithubRepos: {
    reqParams: {
      type: 'object',
      required: ['github_username'],
      properties: {
        github_username: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};
