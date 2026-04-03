module.exports = {
  runTest: {
    reqBody: {
      type: 'object',
      required: ['url', 'userId', 'scanName'],
      properties: {
        url: { type: 'string' },
        method: { type: 'string' },
        rate: { type: 'integer' },
        duration: { type: 'string' },
        userId: { type: 'string' },
        scanName: { type: 'string' },
      },
      additionalProperties: true
    },
  },

  getReportFile: {
    reqQuery: {
      type: 'object',
      required: ['key'],
      properties: {
        key: { type: 'string' },
      },
      additionalProperties: false
    },
  },

  listReports: {
    reqQuery: {
      type: 'object',
      properties: {}, // No params for now
      additionalProperties: true
    }
  }
};
