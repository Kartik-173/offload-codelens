import PestControlOutlinedIcon from "@mui/icons-material/PestControlOutlined";
import LockPersonOutlinedIcon from "@mui/icons-material/LockPersonOutlined";
import GppMaybeOutlinedIcon from "@mui/icons-material/GppMaybeOutlined";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";

export const reportInfoConfig = [
  { key: "organization", label: "Organization" },
  { key: "spacer1", spacer: true },
  { key: "branch", label: "Branch" },
  { key: "reportDate", label: "Report Date" },
  { key: "sizeRating", label: "Size Rating" },
  { key: "linesOfCode", label: "Overall Lines of Code" },
  { key: "spacer2", spacer: true },
  { key: "projects", label: "Projects" },
];

export const reportMetricsConfig = [
  {
    title: "Reliability",
    ratingKey: "reliabilityRating",
    metricLabel: "Bugs",
    key: "bugs",
    barValuesKey: "reliabilityRating",
    icon: <PestControlOutlinedIcon fontSize="large" />,
  },
  {
    title: "Security",
    ratingKey: "securityRating",
    metricLabel: "Vulnerabilities",
    key: "vulnerabilities",
    barValuesKey: "securityRating",
    icon: <LockPersonOutlinedIcon fontSize="large" />,
  },
  {
    title: "Maintainability",
    ratingKey: "maintainabilityRating",
    metricLabel: "Code Smells",
    key: "codeSmells",
    barValuesKey: "maintainabilityRating",
    icon: <BuildCircleOutlinedIcon fontSize="large" />,
  },
];


export const bottomMetricsConfig = [
  {
    key: "issuesBySeverity",
    title: "Issues by Severity",
    component: "IssuesSeverityChart",
  },
  {
    key: "coverage",
    title: "Coverage",
    metricKey: "coverage",
  },
  {
    key: "duplications",
    title: "Duplications",
    metricKey: "duplications",
  },
];
