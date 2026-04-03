import APIConstants from "./APIConstants";
import APIService from "./APIService";
import DebugService from "./DebugService";

/**
 * Vegeta Scan Service
 */
const ApiLoadTestService = {
  triggerLoadTest: async (data) => {
    try {
      return await APIService.post(APIConstants.VEGETA.RUN_TEST, data);
    } catch (error) {
      DebugService.error("Vegeta Scan: Error triggering load test", error, data);
      throw error;
    }
  },

  fetchLoadTestList: async () => {
    try {
      return await APIService.get(APIConstants.VEGETA.LIST_TESTS);
    } catch (error) {
      DebugService.error("Vegeta Scan: Error fetching list", error);
      throw error;
    }
  },

  fetchLoadTestReport: async (key) => {
    try {
      const endpoint = `${APIConstants.VEGETA.GET_TEST}?key=${encodeURIComponent(
        key
      )}/vegeta-report.json`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error("Vegeta Scan: Error fetching report", error);
      throw error;
    }
  },
};

export default ApiLoadTestService;
