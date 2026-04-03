module.exports={
    runWafScan: {
        reqBody: {
            type: "object",
            required: ["targetUrl", "userId", "scanName"],
            properties: {
                targetUrl: { type: "string", format: "uri" },
                userId: { type: "string" },
                scanName: { type: "string" },
            },
            additionalProperties: false
        }
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
            properties: {},
            additionalProperties: true
        }
    }
}