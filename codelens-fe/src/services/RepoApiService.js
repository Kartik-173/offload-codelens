import APIConstants from "./APIConstants";
import APIService from "./APIService";
import DebugService from "./DebugService";
import { ENV } from '../config/env';

/**
 * @description Repository API Service
 */
const RepoApiService = {
  /**
   * Trigger a Sonar scan for the selected repo and branch
   */
  async triggerScan(data) {
    try {
      return await APIService.post(APIConstants.REPOSITORY.SCAN, data);
    } catch (error) {
      DebugService.error("Repo API: Error triggering scan", error, data);
      throw error;
    }
  },

  /**
   * Trigger a ZIP scan for uploaded repository
   */
  async triggerZipScan(formData) {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      return await APIService.post(APIConstants.REPOSITORY.SCAN_UPLOAD_ZIP, formData, config);
    } catch (error) {
      DebugService.error("Repo API: Error triggering ZIP scan", error);
      throw error;
    }
  },

  /**
   * Fetch list of scan reports for a user
   */
  async fetchReportList(userId) {
    try {
      const orgName = ENV.ORGANIZATION_NAME;
      let endpoint = `${APIConstants.REPOSITORY.SCAN_LIST_NAMES}`;
      if (orgName) {
        endpoint += `?organization=${encodeURIComponent(orgName)}`;
      }
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error("Repo API: Error fetching report list", error, userId);
      throw error;
    }
  },

  /**
   * Fetch specific scan report for a user
   */
  async fetchReport(selectedReport) {
    try {
      const endpoint = `${APIConstants.REPOSITORY.SCAN_LIST}?key=${encodeURIComponent(selectedReport)}/sonar.json`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error("Repo API: Error fetching report", error);
      throw error;
    }
  },

  /**
   * Fetch specific scan report for a user
   */
  async fetchOpenGrepReport(selectedReport) {
    try {
      const endpoint = `${APIConstants.REPOSITORY.OPENGREP}?key=${encodeURIComponent(selectedReport)}/opengrep-dashboard.json`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error("Repo API: Error fetching report", error);
      throw error;
    }
  },

  /**
   * Fetch all code lines for a given project and file
   */
  async fetchLines(projectKey, filePath) {
    try {
      const endpoint = `${APIConstants.REPORTS.SOURCES}/${encodeURIComponent(projectKey)}/${filePath}`;
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error("Repo API: Error fetching file lines", error, { projectKey, filePath });
      throw error;
    }
  },

  /**
   * Fetch scan status for a given project key
   */
  async fetchScanStatus(projectKey, userId) {
    try {
      const orgName = ENV.ORGANIZATION_NAME;
      let endpoint = `${APIConstants.REPOSITORY.SCAN}/status/${encodeURIComponent(projectKey)}?userId=${encodeURIComponent(userId || '')}`;
      if (orgName) {
        endpoint += `&organization=${encodeURIComponent(orgName)}`;
      }
      return await APIService.get(endpoint);
    } catch (error) {
      DebugService.error("Repo API: Error fetching scan status", error, projectKey);
      throw error;
    }
  },
};

export default RepoApiService;
