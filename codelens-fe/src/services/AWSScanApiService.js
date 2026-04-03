import APIConstants from './APIConstants';
import APIService from './APIService';
import DebugService from './DebugService';

/**
 * AWS Scan API Service
 * 1) Trigger scan
 * 2) Get report list
 * 3) Get single report
 */
const AWSScanApiService = {
  triggerScan: async ({ userId, accountId }) => {
    try {
      const payload = { userId, accountId };
      return await APIService.post(APIConstants.SECURITY_SCAN.AWS_TRIGGER, payload);
    } catch (error) {
      DebugService.error('AWSScanApiService: Error triggering scan', error, userId, accountId);
      throw error;
    }
  },

  getReportList: async () => {
    try {
      return await APIService.get(APIConstants.SECURITY_SCAN.AWS_REPORT_LIST);
    } catch (error) {
      DebugService.error('AWSScanApiService: Error fetching report list', error);
      throw error;
    }
  },

  getReport: async ({ openSearchId }) => {
    try {
      const endpoint = `${APIConstants.SECURITY_SCAN.AWS_REPORT}/${openSearchId}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error('AWSScanApiService: Error fetching report', error, openSearchId);
      throw error;
    }
  },
};

export default AWSScanApiService;
