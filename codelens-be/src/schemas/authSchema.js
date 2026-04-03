const { SIGN_UP_TYPE } = require('../constants');

module.exports = {
  // ---------------- Auth ----------------
  createUser: {
    reqBody: {
      type: 'object',
      required: ['firstname', 'email', 'signUpType'],
      properties: {
        firstname: { type: 'string' },
        lastname: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
        signUpType: {
          type: 'string',
          enum: [SIGN_UP_TYPE.GOOGLE, SIGN_UP_TYPE.NORMAL],
        },
        googleLoginToken: { type: 'string' },
        googleJson: { type: 'string' },
      },
      additionalProperties: false,
      allOf: [
        {
          if: { properties: { signUpType: { enum: [SIGN_UP_TYPE.NORMAL] } } },
          then: { required: ['password'] },
        },
        {
          if: { properties: { signUpType: { enum: [SIGN_UP_TYPE.GOOGLE] } } },
          then: { required: ['googleLoginToken', 'googleJson'] },
        },
      ],
    },
  },

  login: {
    reqBody: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
        loginType: {
          type: 'string',
          enum: [SIGN_UP_TYPE.GOOGLE, SIGN_UP_TYPE.NORMAL],
        },
        googleLoginToken: { type: 'string' },
        googleJson: { type: 'string' },
      },
      additionalProperties: false,
      allOf: [
        {
          if: { properties: { loginType: { enum: [SIGN_UP_TYPE.NORMAL] } } },
          then: { required: ['password'] },
        },
        {
          if: { properties: { loginType: { enum: [SIGN_UP_TYPE.GOOGLE] } } },
          then: { required: ['googleLoginToken', 'googleJson'] },
        },
      ],
    },
  },

  // ---------------- AWS ----------------
  awsDeploy: {
    reqBody: {
      type: 'object',
      required: ['userId', 'userAccountId'],
      properties: {
        userId: { type: 'string' },
        userAccountId: { type: 'integer' },
      },
    },
  },

  storeCredentials: {
    reqBody: {
      type: 'object',
      required: ['accountId', 'userId', 'accessKey', 'secretKey', 'name'],
      properties: {
        accountId: { type: ['integer', 'string'] },
        userId: { type: 'string' },
        accessKey: { type: 'string' },
        secretKey: { type: 'string' },
        name: { type: 'string' },
      },
    },
  },

  getCredentials: {
    reqBody: {
      type: 'object',
      required: ['accountId', 'userId'],
      properties: {
        accountId: { type: ['integer', 'string'] },
        userId: { type: 'string' },
      },
    },
  },

  deleteCredentials: {
    reqBody: {
      type: 'object',
      required: ['accountId', 'userId'],
      properties: {
        accountId: { type: ['integer', 'string'] },
        userId: { type: 'string' },
      },
      additionalProperties: false,
    },
  },

  // ---------------- GitHub ----------------
  storeGithubCredentials: {
    reqBody: {
      type: 'object',
      required: ['githubUsername', 'token'],
      properties: {
        githubUsername: { type: 'string' },
        token: { type: 'string' },
        avatar_url: { type: 'string' },
      },
    },
  },

  getGithubCredentials: {
    reqBody: {
      type: 'object',
      required: ['githubUsername'],
      properties: {
        githubUsername: { type: 'string' },
      },
    },
  },

  deleteGithubAccount: {
    reqBody: {
      type: 'object',
      required: ['githubUsername'],
      properties: {
        githubUsername: { type: 'string' },
      },
      additionalProperties: false,
    },
  },

  // ---------------- Bitbucket ----------------
  storeBitbucketCredentials: {
    reqBody: {
      type: 'object',
      required: ['bitbucketUsername', 'token'],
      properties: {
        bitbucketUsername: { type: 'string' },
        token: { type: 'string' },
        avatar_url: { type: 'string' },
      },
    },
  },

  getBitbucketCredentials: {
    reqBody: {
      type: 'object',
      required: ['bitbucketUsername'],
      properties: {
        bitbucketUsername: { type: 'string' },
      },
    },
  },

  deleteBitbucketAccount: {
    reqBody: {
      type: 'object',
      required: ['bitbucketUsername'],
      properties: {
        bitbucketUsername: { type: 'string' },
      },
      additionalProperties: false,
    },
  },

  // ---------------- Azure ----------------
  storeAzureCredentials: {
    reqBody: {
      type: 'object',
      required: ['userId', 'tenantId', 'clientId', 'clientSecret', 'subscriptionId', 'name'],
      properties: {
        userId: { type: 'string' },
        tenantId: { type: 'string' },
        clientId: { type: 'string' },
        clientSecret: { type: 'string' },
        subscriptionId: { type: 'string' },
        name: { type: 'string' },
      },
      additionalProperties: false,
    },
  },

  getAzureCredentials: {
    reqBody: {
      type: 'object',
      required: ['userId', 'tenantId'],
      properties: {
        userId: { type: 'string' },
        tenantId: { type: 'string' },
      },
      additionalProperties: false,
    },
  },

  deleteAzureCredentials: {
    reqBody: {
      type: 'object',
      required: ['userId', 'tenantId'],
      properties: {
        userId: { type: 'string' },
        tenantId: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};
