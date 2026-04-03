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
    STORE: 'api/credential/store-creds',
    GET: 'api/credential/get-creds',
    GET_ACCOUNT_IDS: 'api/credential/get-account-ids',
    DELETE: 'api/credential/delete-creds',
    STORE_GITHUB: 'api/credential/store-github-creds',
    GET_GITHUB_LIST: 'api/credential/get-github-creds-list',
    // Azure
    STORE_AZURE: 'api/credential/store-azure-creds',
    GET_AZURE: 'api/credential/get-azure-creds',
    GET_AZURE_TENANTS: 'api/credential/get-azure-tenant-ids',
    DELETE_AZURE: 'api/credential/delete-azure-creds',
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

  // User Email endpoints
  USER_EMAIL: {
    GET_CONFIG: 'api/user-email/config',
    STORE_CONFIG: 'api/user-email/config',
    UPDATE_CONFIG: 'api/user-email/config',
    DELETE_CONFIG: 'api/user-email/config',
    INITIALIZE_INDEX: 'api/user-email/initialize-index',
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

  // Chat endpoints
  CHAT: {
    N8N_SUBMIT_JOB: 'api/n8n/submit-job',
    OLLAMA_CHAT: 'api/chat/ollama',
    GENERATE_TITLE: `${ENV.API_N8N_BASE_URL}/generate-chat-title`,
    GITHUB_PUSH: `${ENV.API_N8N_BASE_URL}/github-push`,
    MERGE_PR: `${ENV.API_N8N_BASE_URL}/merge-pr`,
    AWS_DEPLOY: 'api/deploy/aws',
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

  // Security scan endpoints (AWS)
  SECURITY_SCAN: {
    AWS_TRIGGER: 'api/security-scan/aws',
    AWS_REPORT_LIST: 'api/security-scan/aws/reports',
    AWS_REPORT: 'api/security-scan/aws/report',
    // Azure
    AZURE_TRIGGER: 'api/security-scan/azure',
    AZURE_REPORT_LIST: 'api/security-scan/azure/reports',
    AZURE_REPORT: 'api/security-scan/azure/report',
  },

  // Vegeta Scan endpoints
  VEGETA: {
    RUN_TEST: 'api/performance/run',
    LIST_TESTS: 'api/performance/list',
    GET_TEST: 'api/performance/report',
  },

  // WAF Scan endpoints
  WAF_SCAN: {
    RUN: 'api/waf-scan/start-scan',
    LIST: 'api/waf-scan/list',
    REPORT: 'api/waf-scan/report',
  },

  // AWS ALB endpoints
  AWS_ALB: {
    GET_ALBS: 'api/aws/albs',
    DEREGISTER_TARGET: 'api/aws/deregister-target',
    GET_UNHEALTHY_DETAILS: 'api/aws/unhealthy-target-details',
    TERMINATE_INSTANCE: 'api/aws/terminate-instance',
    // CloudWatch endpoints
    FETCH_REALTIME: 'api/alb/fetch-realtime',
    METRICS: 'api/alb/metrics',
    TARGET_HEALTH: 'api/alb/target-health',
    ACCESS_LOGS: 'api/alb/access-logs',
    DASHBOARD: 'api/alb/dashboard',
    // Memory storage endpoints
    INITIALIZE_MEMORY: 'api/alb/initialize-memory',
    FETCH_MEMORY: 'api/alb/fetch-memory',
    DATA_MEMORY: 'api/alb/data-memory',
    STATISTICS_MEMORY: 'api/alb/statistics-memory',
    START_AUTO_REFRESH: 'api/alb/auto-refresh/start-memory',
    STOP_AUTO_REFRESH: 'api/alb/auto-refresh/stop-memory',
    REFRESH_STATUS: 'api/alb/auto-refresh/status-memory',
    FORCE_REFRESH: 'api/alb/force-refresh-memory',
    GLOBAL_REFRESH_STATS: 'api/alb/global-refresh-stats',
  },

  // ALB Account Settings endpoints
  ALB_ACCOUNT_SETTINGS: {
    GET_SETTINGS: 'api/alb-account-settings/settings',
    UPDATE_SETTINGS: 'api/alb-account-settings/settings',
    GET_BATCH_SETTINGS: 'api/alb-account-settings/batch-settings',
    LOG_ACTION: 'api/alb-account-settings/actions/log',
    GET_USERS_WITH_AUTO_DEREGISTER: 'api/alb-account-settings/accounts/auto-deregister-enabled',
    BULK_DISABLE_AUTO_DEREGISTER: 'api/alb-account-settings/bulk-disable-auto-deregister',
    GET_STATS: 'api/alb-account-settings/actions/stats',
    GET_FAILED_ACTIONS: 'api/alb-account-settings/actions/failed',
  },

  // Auto Deregister Activity endpoints
  AUTO_DEREGISTER_ACTIVITY: {
    LATEST: 'api/alb/auto-deregister-activity/latest/:accountId',
  },

  // Health Monitor endpoints
  HEALTH_MONITOR: {
    STATUS: 'api/health-monitor/status',
    START: 'api/health-monitor/start',
    STOP: 'api/health-monitor/stop',
    CHECK: 'api/health-monitor/check',
    NOTIFY_UNHEALTHY: 'api/health-monitor/notify-unhealthy',
    ADD_REGION: 'api/health-monitor/region/add',
    REMOVE_REGION: 'api/health-monitor/region/remove',
    GET_EMAIL_CONFIG: 'api/health-monitor/email-config',
    UPDATE_EMAIL_CONFIG: 'api/health-monitor/email-config',
    TEST_HEALTHY_EMAIL: 'api/health-monitor/test-healthy-email',
    TEST_UNHEALTHY_EMAIL: 'api/health-monitor/test-unhealthy-email',
    TEST_EMAIL: 'api/health-monitor/test-email',
    TEST_SES_CONNECTIVITY: 'api/health-monitor/test-ses-connectivity',
  },

  // Slack Integration endpoints
  SLACK: {
    DISCONNECT: 'api/slack/disconnect',
    TEST: 'api/slack/test',
  },

  // User Target Selections endpoints
  USER_TARGET_SELECTIONS: {
    GET: 'api/user/target-selections',
    SAVE: 'api/user/target-selections',
    EXCLUDE_TARGET: 'api/user/exclude-target',
    REMOVE_EXCLUSION: 'api/user/remove-exclusion',
    GET_EXCLUDED_TARGETS: 'api/user/excluded-targets',
    AUTO_DEREGISTER: 'api/user/auto-deregister',
  },

  // ALB Auto Actions endpoints
  ALB_AUTO_ACTIONS: {
    START_DEREGISTER: 'api/alb/auto-actions/deregister/start',
    STOP_DEREGISTER: 'api/alb/auto-actions/deregister/stop',
    GET_DEREGISTER_STATE: 'api/alb/auto-actions/deregister/state/:accountId',
    PERFORM_DEREGISTER: 'api/alb/auto-actions/deregister/perform',
    RUN_ON_DEMAND_DEREGISTER: 'api/alb/auto-actions/deregister/run-on-demand',
    GET_ACTIVE_ACTIONS: 'api/alb/auto-actions/active',
  },
};

export default APIConstants;
