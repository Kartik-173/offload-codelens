const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const s3Service = require('./s3Service');

/**
 * -----------------------------
 * CWE ENRICHMENT MAP
 * -----------------------------
 * Minimal but high-value set
 * (you can extend anytime)
 */
const RULE_TO_CWE = [
  { match: 'private-key', cwe: 'CWE-798' },
  { match: 'api-key', cwe: 'CWE-798' },
  { match: 'password', cwe: 'CWE-522' },
  { match: 'bcrypt-hash', cwe: 'CWE-522' },

  { match: 'weak-random', cwe: 'CWE-327' },
  { match: 'md5', cwe: 'CWE-327' },
  { match: 'use-of-default-aes', cwe: 'CWE-327' },

  { match: 'formatted-sql-string', cwe: 'CWE-89' },
  { match: 'ldap-injection', cwe: 'CWE-90' },
  { match: 'command-injection', cwe: 'CWE-77' },

  { match: 'object-deserialization', cwe: 'CWE-502' },
  { match: 'unvalidated-redirect', cwe: 'CWE-601' },

  { match: 'cookie-missing-httponly', cwe: 'CWE-1004' },
  { match: 'cookie-missing-secure', cwe: 'CWE-614' }
];

/**
 * Execute shell command
 */
function execCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    exec(
      command,
      { cwd, timeout: 300000, maxBuffer: 50 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          error.stderr = stderr;
          return reject(error);
        }
        resolve(stdout);
      }
    );
  });
}

/**
 * Stable Finding ID
 */
function generateStableId(ruleId, file, line) {
  return crypto
    .createHash('sha1')
    .update(`${ruleId}:${file}:${line}`)
    .digest('hex');
}

/**
 * File extension → language mapping
 */
function detectLanguage(filePath) {
  if (!filePath) return 'unknown';
  const ext = path.extname(filePath).toLowerCase();

  const map = {
    '.js': 'JavaScript',
    '.ts': 'TypeScript',
    '.java': 'Java',
    '.py': 'Python',
    '.tf': 'Terraform',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.dockerfile': 'Dockerfile',
    '.sh': 'Shell',
    '.go': 'Go'
  };

  return map[ext] || 'Other';
}

/**
 * Severity classification (OpenGrep-safe)
 */
function classifySeverity(result) {
  const raw =
    result.severity ||
    result.metadata?.severity ||
    result.extra?.severity ||
    '';

  const normalized = String(raw).toUpperCase();

  if (normalized === 'ERROR') return 'CRITICAL';
  if (normalized === 'WARNING') return 'HIGH';
  if (normalized === 'INFO') return 'MEDIUM';

  const rule = (result.check_id || '').toLowerCase();
  if (rule.includes('critical')) return 'CRITICAL';
  if (rule.includes('high')) return 'HIGH';
  if (rule.includes('medium')) return 'MEDIUM';

  return 'LOW';
}

/**
 * Infer CWE from rule_id
 */
function inferCWE(ruleId) {
  if (!ruleId) return null;
  const id = ruleId.toLowerCase();

  for (const entry of RULE_TO_CWE) {
    if (id.includes(entry.match)) {
      return entry.cwe;
    }
  }
  return null;
}

/**
 * Normalize OpenGrep JSON → product findings
 */
function normalizeOpengrepJson(rawJson) {
  const findings = [];
  const severityCount = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const languages = {};
  const ruleHits = {};
  const cweCounts = {};

  for (const r of rawJson.results || []) {
    const severity = classifySeverity(r);
    severityCount[severity]++;

    const language = detectLanguage(r.path);
    languages[language] = (languages[language] || 0) + 1;

    ruleHits[r.check_id] = (ruleHits[r.check_id] || 0) + 1;

    const cwe =
      r.metadata?.cwe ||
      inferCWE(r.check_id);

    if (cwe) {
      cweCounts[cwe] = (cweCounts[cwe] || 0) + 1;
    }

    findings.push({
      finding_id: generateStableId(
        r.check_id,
        r.path,
        r.start?.line || 0
      ),
      rule_id: r.check_id,
      title: r.message || 'OpenGrep Finding',
      severity,
      confidence: r.confidence || 'MEDIUM',
      category: r.metadata?.category || 'other',
      cwe,
      owasp: null,
      file_path: r.path,
      line_start: r.start?.line || null,
      line_end: r.end?.line || null,
      code_snippet: r.extra?.lines || null,
      remediation: r.metadata?.fix || null,
      references: r.metadata?.references || []
    });
  }

  return {
    findings,
    severityCount,
    languages,
    ruleHits,
    cweCounts
  };
}

/**
 * Run OpenGrep scan and build report
 */
async function runOpengrepScan({
  req,
  tempDir,
  repoUrl,
  projectKey,
  userId,
  organization,
  branch = 'main'
}) {
  const scanStart = Date.now();
  const outputPath = path.join(tempDir, 'opengrep.json');

  try {
    req?.log?.info(
      { requestBody: { repoUrl, projectKey, userId, organization, branch } },
      "opengrepService: runOpengrepScan request data"
    );

    await execCommand(
      `/opengrep scan --config auto --json --output ${outputPath} .`,
      tempDir
    );

    const rawJson = JSON.parse(await fs.readFile(outputPath, 'utf-8'));
    const normalized = normalizeOpengrepJson(rawJson);

    const report = {
      scan_metadata: {
        scan_id: `scan-${crypto.randomUUID()}`,
        tool: 'opengrep',
        tool_version: rawJson.version || 'unknown',
        scan_time: new Date().toISOString(),
        duration_seconds: Math.round((Date.now() - scanStart) / 1000),
        branch,
        repo: {
          url: repoUrl,
          provider: 'github',
          organization,
          owner: projectKey
        },
        triggered_by: userId
      },

      summary: {
        total_findings: normalized.findings.length,
        severity_count: normalized.severityCount,
        languages: normalized.languages,
        cwe: normalized.cweCounts
      },

      findings: normalized.findings,

      rules_statistics: {
        total_rules_executed: Object.keys(normalized.ruleHits).length,
        rules_triggered: Object.keys(normalized.ruleHits).length,
        top_rules: Object.entries(normalized.ruleHits).map(
          ([rule_id, hit_count]) => ({ rule_id, hit_count })
        )
      },

      scan_status: {
        state: 'COMPLETED',
        errors: [],
        warnings: []
      }
    };

    const s3Key =
      `${organization}/${userId}/${projectKey}/opengrep-dashboard.json`;

    await s3Service.uploadGenericJson(req, report, s3Key);

    return { success: true, s3Key };

  } catch (error) {
    req?.log?.warn(
      { error: error.message },
      'OpenGrep scan failed'
    );
    return { success: false, error: error.message };
  }
}

module.exports = {
  runOpengrepScan
};
