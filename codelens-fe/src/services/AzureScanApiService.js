import APIConstants from './APIConstants';
import APIService from './APIService';
import DebugService from './DebugService';

/**
 * Azure Scan API Service
 * 1) Trigger scan
 * 2) Get report list
 * 3) Get single report
 */
const AzureScanApiService = {
  triggerScan: async ({ userId, tenantId }) => {
    try {
      const payload = { userId, tenantId };
      return await APIService.post(APIConstants.SECURITY_SCAN.AZURE_TRIGGER, payload);
    } catch (error) {
      DebugService.error('AzureScanApiService: Error triggering scan', error, userId, tenantId);
      throw error;
    }
  },

  getReportList: async () => {
    try {
      return await APIService.get(APIConstants.SECURITY_SCAN.AZURE_REPORT_LIST);
    } catch (error) {
      DebugService.error('AzureScanApiService: Error fetching report list', error);
      throw error;
    }
  },

  getReport: async ({ openSearchId }) => {
    try {
      const endpoint = `${APIConstants.SECURITY_SCAN.AZURE_REPORT}/${openSearchId}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error('AzureScanApiService: Error fetching report', error, openSearchId);
      throw error;
    }
  },
};

export default AzureScanApiService;
