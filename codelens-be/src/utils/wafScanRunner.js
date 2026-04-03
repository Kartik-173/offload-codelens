const axios = require('axios');

const DEFAULT_RULES = [
  { id: "SQL-001", name: "SQL Injection - Classic OR", category: "SQLi", payload: "' OR '1'='1", weight: 3 },
  { id: "SQL-002", name: "SQL Injection - UNION SELECT", category: "SQLi", payload: "' UNION SELECT NULL--", weight: 3 },
  { id: "SQL-003", name: "SQL Injection - Boolean", category: "SQLi", payload: "' AND 1=1--", weight: 3 },

  { id: "XSS-001", name: "XSS - Script Tag", category: "XSS", payload: "<script>alert(1)</script>", weight: 1 },
  { id: "XSS-002", name: "XSS - SVG", category: "XSS", payload: "<svg/onload=alert(1)>", weight: 1 },

  { id: "LFI-001", name: "LFI - Linux", category: "LFI", payload: "../../etc/passwd", weight: 3 },
  { id: "LFI-002", name: "LFI - Deep", category: "LFI", payload: "../../../../etc/passwd", weight: 3 },

  { id: "RCE-001", name: "RCE - Semicolon", category: "RCE", payload: ";id", weight: 2 },

  { id: "XXE-001", name: "XXE - Basic", category: "XXE", payload: "<!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]>", weight: 3 },

  { id: "SSRF-001", name: "SSRF - Metadata", category: "SSRF", payload: "http://169.254.169.254/latest/meta-data/", weight: 2 }
];

const DEFAULT_CHALLENGE_KEYWORDS = [
  'access denied',
  'request blocked',
  'security challenge',
  'captcha',
  'cloudfront',
  'cloudflare'
];

async function runWafScan({ parsedUrl, rules = DEFAULT_RULES, challengeKeywords = DEFAULT_CHALLENGE_KEYWORDS }) {
  const results = [];
  const wafHeaders = {};
  const challengeIndicators = [];
  const evidence = [];
  const wafCandidates = new Set();
  let weightedScore = 0;
  const maxScore = rules.reduce((s, r) => s + r.weight, 0);

  const baselineStart = Date.now();
  await axios.get(parsedUrl.toString(), { timeout: 8000, validateStatus: () => true });
  const baselineTime = Date.now() - baselineStart;

  for (const rule of rules) {
    try {
      const start = Date.now();

      const response = await axios.post(
        parsedUrl.toString(),
        { test: rule.payload },
        {
          timeout: 8000,
          validateStatus: () => true,
          headers: {
            'User-Agent': 'CodeLens-WAF-Scanner/1.0',
            'Content-Type': 'application/json'
          }
        }
      );

      const duration = Date.now() - start;
      const blocked = [401, 403, 406, 429].includes(response.status);
      const body = (response.data || "").toString().toLowerCase();

      Object.entries(response.headers || {}).forEach(([k, v]) => {
        if (k.startsWith('cf-') || k.startsWith('x-amz') || k.includes('akamai')) wafHeaders[k] = v;
      });

      const server = response.headers?.server?.toLowerCase() || '';
      if (server.includes('awselb')) wafCandidates.add('AWS WAF (via ALB)');
      if (response.headers['x-amz-cf-id']) wafCandidates.add('CloudFront');
      if (server.includes('cloudflare')) wafCandidates.add('Cloudflare');

      challengeKeywords.forEach(k => {
        if (body.includes(k)) challengeIndicators.push(k);
      });

      if (blocked) {
        weightedScore += rule.weight;
        evidence.push(`Blocked ${rule.category} payload (${rule.id})`);
      }

      if (duration > baselineTime * 1.8) {
        evidence.push(`Response delay detected for ${rule.id}`);
      }

      results.push({
        rule_id: rule.id,
        rule_name: rule.name,
        category: rule.category,
        payload: rule.payload,
        status: response.status,
        blocked,
        responseTimeMs: duration,
        server: response.headers?.server || null
      });
    } catch (err) {
      results.push({
        rule_id: rule.id,
        rule_name: rule.name,
        category: rule.category,
        error: err.message
      });
    }
  }

  let rateLimited = false;
  for (let i = 0; i < 5; i++) {
    const r = await axios.get(parsedUrl.toString(), { validateStatus: () => true });
    if (r.status === 429) rateLimited = true;
  }
  if (rateLimited) evidence.push('Rate limiting detected (HTTP 429)');

  return {
    results,
    wafHeaders,
    challengeIndicators,
    evidence,
    wafCandidates: Array.from(wafCandidates),
    weightedScore,
    maxScore,
    baselineTime
  };
}

module.exports = {
  DEFAULT_RULES,
  DEFAULT_CHALLENGE_KEYWORDS,
  runWafScan
};
