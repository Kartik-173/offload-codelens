import { ENV } from '../config/env';
import {
  FolderOpen,
  FileText,
  Shield,
  Lock,
  FolderGit,
  ChevronsUp,
  ChevronUp,
  ChevronDown,
  Folder,
  Waypoints,
  Archive,
  ClipboardList,
  Gauge,
  ShieldCheck,
  Cloud,
  UserCog,
  ShieldAlert,
  Globe,
} from 'lucide-react';
import RepositoryService from '../services/RepositoryService';

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
      return <ChevronsUp className="priority-icon priority-high-icon" />;
    case "medium":
      return <ChevronUp className="priority-icon priority-medium-icon" />;
    case "low":
      return <ChevronDown className="priority-icon priority-low-icon" />;
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
    label: "GitHub",
    icon: <FolderGit />,
    route: "/github-connections",
  },
  {
    label: "Bitbucket",
    icon: <Waypoints />,
    route: "/bitbucket-connections",
  },
  {
    label: "Scan Repo",
    icon: <Folder />,
    route: "/scan-repo",
  },
  {
    label: "Scan ZIP Code",
    icon: <Archive />,
    route: "/upload-zip",
  },
  {
    label: "Reports",
    icon: <ClipboardList />,
    route: "/report-list",
  },
  {
    label: "Vegeta Scan",
    icon: <Gauge />,
    route: "/vegeta-scan",
  },
  {
    label: "WAF Scan",
    icon: <ShieldCheck />,
    route: "/waf-scan",
  },
  {
    label: "Clouds Security Scan",
    icon: <Cloud />,
    expandable: true,
    children: [
      {
        label: "Clouds Credentials",
        icon: <UserCog />,
        route: "/credentials",
      },
      {
        label: "Security Scan",
        icon: <ShieldAlert />,
        route: "/security-scan",
      },
    ],
  },
  {
    label: "OpenShield",
    icon: <Shield />,
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
    icon: <Globe />,
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

const HomeData = (navigate) => [
  {
    icon: <FolderOpen className="h-8 w-8 text-emerald-500" />,
    title: "Scan Your Repos",
    text: "Run deep analysis and quality checks across your projects.",
    buttons: [
      { label: "Start Scan", action: () => navigate("/scan-repo") },
      { label: "Upload ZIP", action: () => navigate("/upload-zip") },
    ],
  },
  {
    icon: <FileText className="h-8 w-8 text-purple-500" />,
    title: "Reports & Insights",
    text: "Explore issues, hotspots, trends, and key metrics at a glance.",
    buttons: [{ label: "View Reports", action: () => navigate("/report-list") }],
  },
  {
    icon: <Shield className="h-8 w-8 text-green-600" />,
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
    icon: <Lock className="h-8 w-8 text-orange-500" />,
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
    icon: <FolderGit className="h-8 w-8 text-slate-600" />,
    title: "Connect Git Accounts",
    text: "Link GitHub or Bitbucket to enable PRs, branches, and pushes.",
    buttons: [
      { label: "Connect GitHub", action: () => navigate("/github-connections") },
      { label: "Connect Bitbucket", action: () => navigate("/bitbucket-connections") },
    ],
  },
  {
    icon: <Shield className="h-8 w-8 text-indigo-500" />,
    title: "Secure AWS Credentials",
    text: "Store and manage credentials safely for scans and Terraform jobs.",
    buttons: [
      { label: "Manage Credentials", action: () => navigate("/credentials") },
    ],
  },
];

export default HomeData;

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
