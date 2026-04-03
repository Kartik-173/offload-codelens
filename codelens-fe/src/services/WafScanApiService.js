import APIConstants from './APIConstants';
import APIService from './APIService';
import DebugService from './DebugService';

const WafScanApiService = {
  startScan: async ({ targetUrl, userId, scanName }) => {
    try {
      const payload = { targetUrl, userId, scanName };
      return await APIService.post(APIConstants.WAF_SCAN.RUN, payload);
    } catch (error) {
      DebugService.error('WafScanApiService: Error starting scan', error, targetUrl);
      throw error;
    }
  },

  listScans: async () => {
    try {
      return await APIService.get(APIConstants.WAF_SCAN.LIST);
    } catch (error) {
      DebugService.error('WafScanApiService: Error fetching scan list', error);
      throw error;
    }
  },

  getReport: async ({ key }) => {
    try {
      const endpoint = `${APIConstants.WAF_SCAN.REPORT}?key=${encodeURIComponent(key)}/waf-report.json`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error('WafScanApiService: Error fetching report', error, key);
      throw error;
    }
  },
};

export default WafScanApiService;
