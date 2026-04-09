/**
 * @description Centralized API endpoint constants
 * All API endpoints should be defined here for better maintainability
 */

import { ENV } from '../config/env';

const APIConstants = {
  // Authentication endpoints
  AUTH: {
    LOGIN: 'api/auth/login',
    LOGOUT: 'api/auth/logout',
    REFRESH: 'api/auth/refresh',
    REGISTER: 'api/auth/register',
    GITHUB_LOGOUT: 'api/auth/github/logout',
    BITBUCKET_LOGOUT: 'api/auth/bitbucket/logout',
  },

  // Credential management endpoints
  CREDENTIALS: {
    STORE_GITHUB: 'api/credential/store-github-creds',
    GET_GITHUB_LIST: 'api/credential/get-github-creds-list',
  },

  // Repository endpoints
  REPOSITORY: {
    SCAN: 'api/repo/scan',
    SCAN_UPLOAD_ZIP: 'api/repo/scan/upload-zip',
    SCAN_LIST_NAMES: 'api/repo/scan-list-names',
    SCAN_LIST: 'api/repo/scan-list',
    OPENGREP: 'api/repo/opengrep',
    REPOS: 'api/repo/repos',
    BITBUCKET_REPOS: 'api/repo/bitbucket/repos',
    BRANCHES: 'api/repo/branches',
    BITBUCKET_BRANCHES: 'api/repo/bitbucket/branches',
  },

  // Report endpoints
  REPORTS: {
    SOURCES: 'api/report/sources',
    GET_REPORT: 'api/report/get',
    DELETE_REPORT: 'api/report/delete',
  },

  // User management endpoints
  USER: {
    PROFILE: 'api/user/profile',
    SETTINGS: 'api/user/settings',
    PREFERENCES: 'api/user/preferences',
  },

  // Notification endpoints
  NOTIFICATIONS: {
    SETTINGS: 'api/notification/settings',
    GET_NOTIFICATIONS: 'api/notification/list',
    MARK_READ: 'api/notification/mark-read',
  },

  // File upload endpoints
  UPLOAD: {
    SINGLE: 'api/upload/single',
    MULTIPLE: 'api/upload/multiple',
    ZIP: 'api/upload/zip',
  },

  // Health check endpoints
  HEALTH: {
    CHECK: 'api/health/check',
    STATUS: 'api/health/status',
  },

  // GitHub OAuth org-level configuration
  GITHUB_OAUTH: {
    CONFIG: 'api/oauth/github/config',
  },

  // Bitbucket OAuth org-level configuration
  BITBUCKET_OAUTH: {
    CONFIG: 'api/oauth/bitbucket/config',
  },

  // Slack OAuth org-level configuration
  SLACK_OAUTH: {
    CONFIG: 'api/oauth/slack/config',
  },

  // Vegeta Scan endpoints
  VEGETA: {
    RUN_TEST: 'api/performance/run',
    LIST_TESTS: 'api/performance/list',
    GET_TEST: 'api/performance/report',
  },
};

export default APIConstants;
