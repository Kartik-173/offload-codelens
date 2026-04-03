const axios = require('axios');
const config = require('../config/env.js');
const ErrorResp = require('../utils/ErrorResp');
const { ERROR_CODES } = require('../constants');

/**
 * Sonar - Fetch all lines from a file
 */
async function fetchAllReportCodeLines(req) {
  try {
    req?.log?.info(
      { params: req.params },
      'reportService: fetchAllReportCodeLines - Fetching all lines from sonar'
    );

    const { projectKey } = req.params;
    const filePath = req.params[0];
    const sonarHostUrl = config.SONAR_HOST_URL;
    const sonarToken = config.SONAR_TOKEN;

    if (!sonarHostUrl || !sonarToken) {
      throw new ErrorResp(
        'SonarQube credentials missing',
        'SONAR_HOST_URL or SONAR_TOKEN not configured',
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const encodedToken = Buffer.from(`${sonarToken}:`).toString('base64');
    const headers = { Authorization: `Basic ${encodedToken}` };

    let allSources = [];
    let from = 1;
    const chunkSize = 500; 
    let hasMore = true;

    while (hasMore) {
      const url = `${sonarHostUrl}/api/sources/lines?key=${encodeURIComponent(
        `${projectKey}:${filePath}`
      )}&from=${from}&to=${from + chunkSize - 1}`;

      const response = await axios.get(url, {
        headers,
        validateStatus: () => true,
      });

      if (response.status === 401 || response.status === 403) {
        throw new ErrorResp(
          'Unauthorized',
          'Invalid or expired Sonar token. Please check configuration.',
          ERROR_CODES.UNAUTHORIZED
        );
      }

      if (response.status >= 400) {
        throw new ErrorResp(
          'Sonar API error',
          response.data?.errors?.[0]?.msg || 'Unexpected error from Sonar API',
          response.status
        );
      }

      const sources = response.data?.sources || [];
      if (sources.length === 0) {
        hasMore = false;
      } else {
        allSources.push(...sources);
        from += chunkSize;
      }
    }

    return {
      projectKey,
      filePath,
      sources: allSources,
    };
  } catch (error) {
    req?.log?.error(
      { error: error.message },
      'sonarService: fetchAllSonarLines - Error'
    );
    throw error;
  }
}

module.exports = {
  fetchAllReportCodeLines,
};
