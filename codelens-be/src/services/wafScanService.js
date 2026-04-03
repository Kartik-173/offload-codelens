const wafSchema = require("../schemas/wafSchema");
const { validateSchema } = require("../utils/validation");
const { DEFAULT_RULES, runWafScan } = require("../utils/wafScanRunner");
const {
  uploadGenericJson,
  listOrganizationScans,
  getBucketFile
} = require('../services/s3Service');
const { ERROR_CODES } = require("../constants");
const ErrorResp = require("../utils/ErrorResp");

const PREFIX = 'ca-waf-scan';

function getTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
}

async function list(req) {
  req?.log?.info({ reqQuery: req.query }, 'wafScanService: list - Fetch');
  validateSchema(wafSchema.listReports.reqQuery, req.query);

  const objects = await listOrganizationScans(req, PREFIX);
  if (!objects?.length) return [];

  return objects
    .filter(o => o.Key?.endsWith('/waf-report.json'))
    .map(o => {
      const [_, userId, folder] = o.Key.split('/');
      return {
        userId,
        testFolder: folder,
        key: `${PREFIX}/${userId}/${folder}`,
        lastModified: o.LastModified,
        size: o.Size
      };
    })
    .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
}

async function getOne(req) {
  req?.log?.info({ reqQuery: req.query }, 'wafScanService: getOne - Fetch report');
  validateSchema(wafSchema.getReportFile.reqQuery, req.query);
  const { key } = req.query;

  const file = await getBucketFile(req, key);

  let parsed;
  try {
    parsed = JSON.parse(file);
  } catch {
    req?.log?.error({ key }, 'wafScanService: getOne - JSON parse failed');
    throw new ErrorResp('Invalid JSON inside S3 file', key, ERROR_CODES.UNEXPECTED);
  }

  return { data: parsed };
}

async function startWafScan(req) {
  const scanStart = Date.now();

  try {
    req?.log?.info({ requestBody: req.body }, 'wafScanService: startWafScan request data');

    validateSchema(wafSchema.runWafScan.reqBody, req.body);
    const { targetUrl, userId, scanName } = req.body;

    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      throw new ErrorResp(
        "Invalid targetUrl",
        "Invalid targetUrl",
        ERROR_CODES.BAD_REQUEST
      );
    }

    const {
      results,
      wafHeaders,
      challengeIndicators,
      evidence,
      wafCandidates,
      weightedScore,
      maxScore,
      baselineTime
    } = await runWafScan({ parsedUrl });

    const enabledRules = results.filter(r => r.blocked);
    const disabledRules = results.filter(r => r.blocked === false);

    const protectionScore = Number(((weightedScore / maxScore) * 100).toFixed(2));

    let confidence = "Low";
    if (protectionScore >= 60) confidence = "High";
    else if (protectionScore >= 30) confidence = "Medium";

    const report = {
      target: parsedUrl.origin,
      scanType: "WAF",
      wafDetected: enabledRules.length > 0,
      wafName: wafCandidates.length ? wafCandidates.join(" and/or ") : "Unknown",
      detectionMethod: "Behavioral + Fingerprint + Timing + Challenge Analysis",
      confidenceLevel: confidence,
      scanDurationSeconds: Number(((Date.now() - scanStart) / 1000).toFixed(2)),
      baselineResponseTimeMs: baselineTime,
      protectionLevel:
        protectionScore >= 60 ? "High" :
        protectionScore >= 30 ? "Medium" : "Low",
      rulesProtectionScore: protectionScore,
      totalRules: DEFAULT_RULES.length,
      enabledRulesCount: enabledRules.length,
      disabledRulesCount: disabledRules.length,
      wafHeaders,
      challengeIndicators: [...new Set(challengeIndicators)],
      evidence,
      categorySummary: Object.fromEntries(
        [...new Set(DEFAULT_RULES.map(r => r.category))].map(cat => [
          cat,
          enabledRules.some(r => r.category === cat) ? "Blocked" : "Not Detected"
        ])
      ),
      enabledRules,
      disabledRules,
      scannedAt: new Date().toISOString(),
      note:
        "All findings are inference-based using safe, non-exploitative techniques. This does not represent actual WAF configuration."
    };

    const timestamp = getTimestamp();
    const folder = `${scanName}_${timestamp}`;
    const key = `${PREFIX}/${userId}/${folder}/waf-report.json`;

    await uploadGenericJson(req, report, key);
    req?.log?.info({ key }, 'wafScanService: startWafScan - Report uploaded');

    return {
      message: 'WAF scan completed & uploaded',
      s3Key: key,
      ...report
    };

  } catch (error) {
    throw error;
  }
}

module.exports = {
  startWafScan,
  list,
  getOne
};
