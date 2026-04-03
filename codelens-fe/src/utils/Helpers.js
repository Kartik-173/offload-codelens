import { ENV } from '../config/env';

// Helper functions for various operations
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RepositoryService from '../services/RepositoryService';

import ChatIcon from "@mui/icons-material/Chat";
import ShieldIcon from "@mui/icons-material/Shield";
import FolderIcon from "@mui/icons-material/Folder";
import SourceIcon from "@mui/icons-material/Source";
import DescriptionIcon from "@mui/icons-material/Description";
import SecurityIcon from "@mui/icons-material/Security";

import GitHubIcon from "@mui/icons-material/GitHub";
import AddCommentIcon from "@mui/icons-material/AddComment";
import ArchiveIcon from "@mui/icons-material/Archive";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SpeedIcon from "@mui/icons-material/Speed";
import PolicyIcon from "@mui/icons-material/Policy";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import LanguageIcon from "@mui/icons-material/Language";
import LoadBalancerIcon from "@mui/icons-material/Router";

/**
 * Fetch repositories from GitHub or Bitbucket
 * @param {string} usernameKey - Username key for the provider
 * @param {"github"|"bitbucket"} provider - Provider name
 */
export const fetchRepos = async (usernameKey, provider) => {
  return await RepositoryService.fetchRepos(usernameKey, provider);
};

/**
 * Fetch branches from GitHub or Bitbucket
 * @param {string} repo - full_name (`owner/repo` for GitHub, `workspace/slug` for Bitbucket)
 * @param {"github"|"bitbucket"} provider - Provider name
 * @param {string} usernameKey - Username key for the provider
 */
export const fetchBranches = async (repo, provider, usernameKey) => {
  return await RepositoryService.fetchBranches(repo, provider, usernameKey);
};


/**
 * @description Parse google sign in response
 * @param {*} token
 * @returns
 */
export const parseJwt = (token) => {
  var base64Url = token.split(".")[1];
  var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  var jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  return JSON.parse(jsonPayload);
};

// Format date to 'MMM DD, YYYY'
export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

// Convert numeric rating to letter
export const ratingLetter = (val) => {
  const num = parseFloat(val);
  return { 1: "A", 2: "B", 3: "C", 4: "D", 5: "E" }[num] || "N/A";
};

// Determine project size rating
export const computeSizeRating = (ncloc) => {
  if (ncloc < 500) return "XS";
  if (ncloc < 2000) return "S";
  if (ncloc < 10000) return "M";
  if (ncloc < 50000) return "L";
  return "XL";
};

export const computeIssuesBySeverity = (issues) => {
  const severities = ["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "INFO"];
  const types = ["BUG", "VULNERABILITY", "CODE_SMELL"]; // match SonarQube naming

  // Initialize matrix: severity → [bugs, vulnerabilities, maintainability]
  const counts = severities.reduce((acc, sev) => {
    acc[sev] = [0, 0, 0];
    return acc;
  }, {});

  issues.forEach((issue) => {
    if (!counts.hasOwnProperty(issue.severity)) return;

    let typeIndex;
    if (issue.type === "BUG") typeIndex = 0;
    else if (issue.type === "VULNERABILITY") typeIndex = 1;
    else typeIndex = 2; // maintainability (code smell, etc.)

    counts[issue.severity][typeIndex] += 1;
  });

  return counts;
};

export const formatReportName = (key) => {
  // Remove folder and extension
  const fileName = key.split("/").pop().replace(/\.json$/, "");

  // Split into parts
  const parts = fileName.split("_");

  if (parts.length < 3) return fileName; // no timestamp, fallback

  // Last two parts are timestamp (YYYYMMDD and HHmmss)
  const datePart = parts[parts.length - 2];
  const timePart = parts[parts.length - 1];
  const namePart = parts.slice(0, parts.length - 2).join("_");

  // Format timestamp
  const match = datePart.match(/^(\d{4})(\d{2})(\d{2})$/);
  const matchTime = timePart.match(/^(\d{2})(\d{2})(\d{2})$/);
  if (!match || !matchTime) return fileName; // fallback

  const formattedTimestamp = `${match[1]}-${match[2]}-${match[3]} ${matchTime[1]}:${matchTime[2]}:${matchTime[3]}`;

  return `${namePart}_${formattedTimestamp}`;
};

export function buildTree(components) {
  const root = {};

  const extractMetric = (measures, metric) =>
    measures?.find((m) => m.metric === metric)?.value || null;

  components.forEach((comp) => {
    const parts = comp.path.split("/");
    let current = root;

    parts.forEach((part, idx) => {
      const isLeaf = idx === parts.length - 1;

      if (!current[part]) {
        current[part] = {
          name: part,
          type: isLeaf ? comp.qualifier : "DIR",
          language: comp.language || null,
          path: comp.path,
          metrics: {},
          children: {},
        };

        // Extract from comp.measures[]
        const measures = comp.measures || [];

        current[part].metrics = {
          lines: parseInt(extractMetric(measures, "ncloc")) || 0,
          security: extractMetric(measures, "vulnerabilities") || 0,
          reliability: extractMetric(measures, "bugs") || 0,
          maintainability: extractMetric(measures, "code_smells") || 0,
          securityHotspots: extractMetric(measures, "security_hotspots") || 0,
          coverage: extractMetric(measures, "coverage"),
          duplications: extractMetric(measures, "duplicated_lines_density") || 0,
        };
      }

      current = current[part].children;
    });
  });

  function convert(node) {
    return Object.values(node).map((n) => ({
      name: n.name,
      type: n.type,
      language: n.language,
      path: n.path,
      metrics: n.metrics,
      children: convert(n.children),
    }));
  }
  return convert(root);
}


export const getPriorityIcon = (priority) => {
  switch (priority.toLowerCase()) {
    case "high":
      return <KeyboardDoubleArrowUpIcon className="priority-icon priority-high-icon" />;
    case "medium":
      return <KeyboardArrowUpIcon className="priority-icon priority-medium-icon" />;
    case "low":
      return <KeyboardArrowDownIcon className="priority-icon priority-low-icon" />;
    default:
      return null;
  }
};

export const CWE_LABELS = {
  "CWE-327": "Weak Cryptography",
  "CWE-798": "Hard-coded Credentials",
  "CWE-522": "Weak Password Protection",
  "CWE-89": "SQL Injection",
  "CWE-90": "LDAP Injection",
  "CWE-502": "Unsafe Deserialization",
  "CWE-614": "Insecure Cookies",
  "CWE-1004": "Sensitive Cookie Without HttpOnly",
  "CWE-601": "Open Redirect"
};

export const SidebarMenu = (navigate) => [
  {
    label: "New Chat",
    icon: <AddCommentIcon />,
    action: "newChat",
  },
  {
    label: "GitHub",
    icon: <GitHubIcon />,
    route: "/github-connections",
  },
  {
    label: "Bitbucket",
    icon: <SourceIcon />,
    route: "/bitbucket-connections",
  },
  {
    label: "Scan Repo",
    icon: <FolderIcon />,
    route: "/scan-repo",
  },
  {
    label: "Scan ZIP Code",
    icon: <ArchiveIcon />,
    route: "/upload-zip",
  },
  {
    label: "Reports",
    icon: <AssessmentIcon />,
    route: "/report-list",
  },
  {
    label: "Vegeta Scan",
    icon: <SpeedIcon />,
    route: "/vegeta-scan",
  },
  {
    label: "WAF Scan",
    icon: <PolicyIcon />,
    route: "/waf-scan",
  },
  {
    label: "Clouds Security Scan",
    icon: <CloudOutlinedIcon />,
    expandable: true,
    children: [
      {
        label: "Clouds Credentials",
        icon: <ManageAccountsIcon />,
        route: "/credentials",
      },
      {
        label: "Security Scan",
        icon: <SecurityIcon />,
        route: "/security-scan",
      },
      {
        label: "ALB Health Preview",
        icon: <LoadBalancerIcon />,
        route: "/aws-alb-manager",
      },
    ],
  },
  {
    label: "OpenShield",
    icon: <ShieldIcon />,
    external: () => {
      const accessToken = localStorage.getItem("access_token");
      const idToken = localStorage.getItem("id_token");
      window.open(
        `${ENV.COMPLAINCE_REDIRECT}?accesstoken=${accessToken}&idtoken=${idToken}`,
        "_blank"
      );
    },
  },
  {
    label: "SecLens",
    icon: <LanguageIcon />,
    external: () => {
      const accessToken = localStorage.getItem("access_token");
      const idToken = localStorage.getItem("id_token");
      window.open(
        `${ENV.SECLENS_REDIRECT}?accesstoken=${accessToken}&idtoken=${idToken}`,
        "_blank"
      );
    },
  },
];

export const METHOD_OPTIONS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export const RATE_OPTIONS = [
  { label: "10 req/sec — Light", value: 10 },
  { label: "25 req/sec — Medium", value: 25 },
  { label: "50 req/sec — High", value: 50 },
  { label: "100 req/sec — Stress", value: 100 },
];

export const DURATION_OPTIONS = [
  { label: "10 seconds", value: "10s" },
  { label: "20 seconds", value: "20s" },
  { label: "30 seconds", value: "30s" },
  { label: "60 seconds", value: "60s" },
];

export const initialFormState = {
  url: "",
  method: "GET",

  rate: 50,
  rateMode: "preset",
  customRate: "",

  duration: "20s",
  durationMode: "preset",
  customDurationSeconds: "",

  scanName: "",
  body: "",

  headers: [{ key: "", value: "" }],

  authType: "none",
  token: "",
  username: "",
  password: "",
};

export const getEffectiveRate = (form) => {
  if (form.rateMode !== "custom") return Number(form.rate);
  const n = parseInt(String(form.customRate), 10);
  return Number.isFinite(n) ? n : NaN;
};

export const getEffectiveDuration = (form) => {
  if (form.durationMode !== "custom") return String(form.duration);
  const n = parseInt(String(form.customDurationSeconds), 10);
  return Number.isFinite(n) ? `${n}s` : "";
};

export const buildHeaders = (form) => {
  let headers = form.headers
    .filter((h) => h.key.trim())
    .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});

  if (form.authType === "bearer") {
    headers.Authorization = `Bearer ${form.token.trim()}`;
  }

  if (form.authType === "basic") {
    const encoded = btoa(`${form.username.trim()}:${form.password.trim()}`);
    headers.Authorization = `Basic ${encoded}`;
  }

  return headers;
};

export const validateApiTestForm = (form) => {
  const errors = {};

  if (!form.url.trim()) errors.url = "URL required";

  if (form.rateMode === "custom") {
    const rate = getEffectiveRate(form);
    if (!Number.isInteger(rate) || rate <= 0) {
      errors.customRate = "Enter a valid integer rate";
    }
  }

  if (form.durationMode === "custom") {
    const secs = parseInt(String(form.customDurationSeconds), 10);
    if (!Number.isInteger(secs) || secs <= 0) {
      errors.customDurationSeconds = "Enter seconds as a whole number";
    }
  }

  if (["POST", "PUT", "PATCH"].includes(form.method) && !form.body.trim()) {
    errors.body = "Body required";
  }

  if (form.authType === "bearer" && !form.token.trim()) {
    errors.token = "Token required";
  }

  if (form.authType === "basic") {
    if (!form.username.trim()) errors.username = "Username required";
    if (!form.password.trim()) errors.password = "Password required";
  }

  return errors;
};


const HomeData = (navigate) => [
  {
    icon: <ChatIcon />,
    title: "AI Copilot Chat",
    text: "Generate and refine Terraform, review diffs, and automate PRs.",
    buttons: [{ label: "Open Chat", action: () => navigate("/chat-start") }],
  },
  {
    icon: <FolderIcon />,
    title: "Scan Your Repos",
    text: "Run deep analysis and quality checks across your projects.",
    buttons: [
      { label: "Start Scan", action: () => navigate("/scan-repo") },
      { label: "Upload ZIP", action: () => navigate("/upload-zip") },
    ],
  },
  {
    icon: <DescriptionIcon />,
    title: "Reports & Insights",
    text: "Explore issues, hotspots, trends, and key metrics at a glance.",
    buttons: [{ label: "View Reports", action: () => navigate("/report-list") }],
  },
  {
    icon: <ShieldIcon />,
    title: "OpenShield • Server Security",
    text: "Harden servers and detect vulnerabilities with Wazuh.",
    buttons: [
      {
        label: "Launch OpenShield",
        action: () => {
          const accessToken = localStorage.getItem("access_token");
          const idToken = localStorage.getItem("id_token");
          const url = `${ENV.COMPLAINCE_REDIRECT}?accesstoken=${accessToken}&idtoken=${idToken}`;
          window.open(url, "_blank");
        },
      },
    ],
  },
  {
    icon: <SecurityIcon />,
    title: "SecLens • Web App Scans",
    text: "Scan domains and URLs for security risks with OWASP ZAP.",
    buttons: [
      {
        label: "Launch SecLens",
        action: () => {
          const accessToken = localStorage.getItem("access_token");
          const idToken = localStorage.getItem("id_token");
          const url = `${ENV.SECLENS_REDIRECT}?accesstoken=${accessToken}&idtoken=${idToken}`;
          window.open(url, "_blank");
        },
      },
    ],
  },
  {
    icon: <SourceIcon />,
    title: "Connect Git Accounts",
    text: "Link GitHub or Bitbucket to enable PRs, branches, and pushes.",
    buttons: [
      { label: "Connect GitHub", action: () => navigate("/github-connections") },
      { label: "Connect Bitbucket", action: () => navigate("/bitbucket-connections") },
    ],
  },
  {
    icon: <ShieldIcon />,
    title: "Secure AWS Credentials",
    text: "Store and manage credentials safely for scans and Terraform jobs.",
    buttons: [
      { label: "Manage Credentials", action: () => navigate("/credentials") },
    ],
  },
];

export default HomeData;

// AWS Regions organized by geography (2025/2026)
export const AWS_REGIONS = [
  // North America - United States
  { value: 'us-east-1', label: 'US East (N. Virginia) - us-east-1', popular: true, group: 'North America' },
  { value: 'us-east-2', label: 'US East (Ohio) - us-east-2', popular: true, group: 'North America' },
  { value: 'us-west-1', label: 'US West (N. California) - us-west-1', group: 'North America' },
  { value: 'us-west-2', label: 'US West (Oregon) - us-west-2', popular: true, group: 'North America' },
  
  // North America - Canada
  { value: 'ca-central-1', label: 'Canada (Central) - ca-central-1', group: 'North America' },
  { value: 'ca-west-1', label: 'Canada West (Calgary) - ca-west-1', group: 'North America' },
  
  // South America
  { value: 'sa-east-1', label: 'South America (São Paulo) - sa-east-1', group: 'South America' },
  { value: 'mx-central-1', label: 'Mexico (Central) - mx-central-1', group: 'South America' },
  
  // Europe
  { value: 'eu-west-1', label: 'Europe (Ireland) - eu-west-1', popular: true, group: 'Europe' },
  { value: 'eu-west-2', label: 'Europe (London) - eu-west-2', group: 'Europe' },
  { value: 'eu-west-3', label: 'Europe (Paris) - eu-west-3', group: 'Europe' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt) - eu-central-1', group: 'Europe' },
  { value: 'eu-central-2', label: 'Europe (Zurich) - eu-central-2', group: 'Europe' },
  { value: 'eu-north-1', label: 'Europe (Stockholm) - eu-north-1', group: 'Europe' },
  { value: 'eu-south-1', label: 'Europe (Milan) - eu-south-1', group: 'Europe' },
  { value: 'eu-south-2', label: 'Europe (Spain) - eu-south-2', group: 'Europe' },
  
  // Middle East
  { value: 'me-south-1', label: 'Middle East (Bahrain) - me-south-1', group: 'Middle East' },
  { value: 'me-central-1', label: 'Middle East (UAE) - me-central-1', group: 'Middle East' },
  
  // Africa
  { value: 'af-south-1', label: 'Africa (Cape Town) - af-south-1', group: 'Africa' },
  
  // Asia Pacific - India
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai) - ap-south-1', popular: true, group: 'Asia Pacific' },
  { value: 'ap-south-2', label: 'Asia Pacific (Hyderabad) - ap-south-2', group: 'Asia Pacific' },
  
  // Asia Pacific - East Asia
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo) - ap-northeast-1', popular: true, group: 'Asia Pacific' },
  { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul) - ap-northeast-2', group: 'Asia Pacific' },
  { value: 'ap-northeast-3', label: 'Asia Pacific (Osaka) - ap-northeast-3', group: 'Asia Pacific' },
  { value: 'ap-northeast-4', label: 'Asia Pacific (Taipei) - ap-northeast-4', group: 'Asia Pacific' },
  
  // Asia Pacific - Southeast Asia
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore) - ap-southeast-1', popular: true, group: 'Asia Pacific' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney) - ap-southeast-2', group: 'Asia Pacific' },
  { value: 'ap-southeast-3', label: 'Asia Pacific (Jakarta) - ap-southeast-3', group: 'Asia Pacific' },
  { value: 'ap-southeast-4', label: 'Asia Pacific (Melbourne) - ap-southeast-4', group: 'Asia Pacific' },
  
  // Asia Pacific - Greater China & North Asia
  { value: 'ap-east-1', label: 'Asia Pacific (Hong Kong) - ap-east-1', group: 'Asia Pacific' },
  { value: 'ap-southeast-5', label: 'Asia Pacific (Malaysia) - ap-southeast-5', group: 'Asia Pacific' },
  { value: 'ap-southeast-6', label: 'Asia Pacific (Thailand) - ap-southeast-6', group: 'Asia Pacific' },
  { value: 'ap-southeast-7', label: 'Asia Pacific (New Zealand) - ap-southeast-7', group: 'Asia Pacific' }
];

// ALB Health Status Utilities
export const getTargetGroupHealthStatus = (tgDetails) => {
  // Handle case where tgDetails is null or undefined
  if (!tgDetails) {
    return {
      label: 'Unknown',
      color: 'default'
    };
  }

  // Check for targets array (both old and new structure)
  const targets = tgDetails.Targets || tgDetails.targets || [];
  
  if (!targets || targets.length === 0) {
    const tgName = tgDetails?.TargetGroup?.TargetGroupName || '';
    const tgType = tgDetails?.TargetGroup?.TargetType || '';
    const isElasticBeanstalk = tgName.includes('AWSEB');
    
    let label = 'No Targets';
    let color = 'default';
    
    // Type-specific labels
    switch (tgType) {
      case 'instance':
        label = 'No Instances';
        color = 'warning';
        break;
      case 'ip':
        label = 'No IP Targets';
        color = 'warning';
        break;
      case 'lambda':
        label = 'No Lambda Targets';
        color = 'warning';
        break;
      case 'alb':
        label = 'No ALB Targets';
        color = 'warning';
        break;
      default:
        label = 'No Targets';
        color = 'default';
    }
    
    // Special handling for ElasticBeanstalk
    if (isElasticBeanstalk) {
      label = 'ElasticBeanstalk Environment';
      color = 'info';
    }
    
    return { label, color };
  }
  
  // Count healthy vs unhealthy targets
  const healthyCount = targets.filter(t => t.Health === 'healthy').length;
  const unhealthyCount = targets.filter(t => t.Health === 'unhealthy').length;
  const totalCount = targets.length;
  
  if (healthyCount === totalCount) {
    return {
      label: `${healthyCount} healthy`,
      color: 'success'
    };
  } else if (unhealthyCount > 0) {
    return {
      label: `${healthyCount} healthy, ${unhealthyCount} unhealthy`,
      color: 'error'
    };
  } else {
    return {
      label: `${healthyCount} healthy, ${totalCount - healthyCount} other`,
      color: 'warning'
    };
  }
};

export const getTargetGroupHealthSummary = (targetGroups) => {
  const totalTargets = Object.values(targetGroups).reduce((acc, tg) => acc + (tg.Targets?.length || 0), 0);
  const healthyTargets = Object.values(targetGroups).reduce((acc, tg) => 
    acc + (tg.Targets?.filter(t => t.Health === 'healthy').length || 0), 0);
  const unhealthyTargets = Object.values(targetGroups).reduce((acc, tg) => 
    acc + (tg.Targets?.filter(t => t.Health === 'unhealthy').length || 0), 0);
  
  return { totalTargets, healthyTargets, unhealthyTargets };
};

export const getAllUnhealthyTargets = (targetGroups, albs, silent = false) => {
  const unhealthyTargets = [];
  
  if (!silent) {
    console.log('=== DEBUG: Collecting Unhealthy Targets ===');
    console.log('Current target groups:', Object.keys(targetGroups));
  }
  
  Object.entries(targetGroups).forEach(([tgArn, tgDetails]) => {
    if (tgDetails.Targets) {
      const tgName = tgDetails.TargetGroup?.TargetGroupName || 'Unknown';
      const albName = albs.find(alb => 
        alb.TargetGroups?.some(tg => tg.TargetGroupArn === tgArn)
      )?.LoadBalancerName || 'Unknown';
      
      if (!silent) {
        console.log(`Checking target group: ${tgName} (${tgArn}) in ALB: ${albName}`);
        console.log(`Targets in this group:`, tgDetails.Targets.map(t => ({
          id: t.Id,
          health: t.Health,
          type: tgDetails.TargetGroup?.TargetType
        })));
      }
      
      tgDetails.Targets.forEach(target => {
        if (target.Health === 'unhealthy') {
          const unhealthyTarget = {
            ...target,
            targetGroupArn: tgArn,
            targetGroupName: tgName,
            albName: albName,
          };
          if (!silent) {
            console.log(`Found unhealthy target:`, unhealthyTarget);
          }
          unhealthyTargets.push(unhealthyTarget);
        }
      });
    }
  });
  
  if (!silent) {
    console.log(`Total unhealthy targets found: ${unhealthyTargets.length}`);
    console.log('Unhealthy targets:', unhealthyTargets);
  }
  
  return unhealthyTargets;
};

export const getUnhealthyTargetsCount = (targetGroups, albs) => {
  return getAllUnhealthyTargets(targetGroups, albs, true).length;
};

export const getHealthStatusIcon = (health, targetType) => {
  // Note: Icons should be imported in the component using this function
  // This function returns the icon name that should be rendered
  const iconMap = {
    healthy: 'CheckCircle',
    unhealthy: 'Error',
    unused: 'Warning',
    unknown: 'Warning'
  };
  
  // Handle Lambda targets differently
  if (targetType === 'lambda') {
    if (health === 'healthy') return { icon: 'CheckCircle', color: 'success' };
    if (health === 'unhealthy') return { icon: 'Error', color: 'error' };
    // For Lambda targets, show a special icon for unknown status
    return { icon: 'CloudQueue', color: 'info' }; // Lambda/cloud icon
  }
  
  const iconName = iconMap[health] || 'Warning';
  const color = getHealthStatusColor(health);
  
  return { icon: iconName, color };
};

export const getHealthStatusColor = (health) => {
  switch (health) {
    case 'healthy':
      return 'success';
    case 'unhealthy':
      return 'error';
    case 'unused':
      return 'warning';
    default:
      return 'default';
  }
};

// User ID utility
export const getUserId = () => {
  const token = localStorage.getItem('id_token') || localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload['cognito:username'] || 'unknown';
    } catch (e) {
      console.error('Error parsing token:', e);
      return 'unknown';
    }
  }
  return 'unknown';
};

// Storage key utilities
export const getSelectedRegionsStorageKey = () => {
  const userId = getUserId();
  return `alb:selectedRegions:${userId}`;
};

export const getSelectedAccountStorageKey = () => {
  const userId = getUserId();
  return `alb:selectedAccountId:${userId}`;
};

export const getAutoRefreshStorageKey = () => {
  const userId = getUserId();
  return `alb:autoRefreshEnabled:${userId}`;
};
