module.exports = {
  awsSecurityScan: {
    reqBody: {
      type: 'object',
      required: ['userId', 'accountId'],
      properties: {
        userId: { type: 'string' },
        accountId: { type: ['string', 'number'] },
      },
      additionalProperties: false,
    },
  },
  azureSecurityScan: {
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
