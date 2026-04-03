// utils/sonarUtil.js
const { exec } = require('child_process');
const axios = require('axios');

/**
 * Run SonarScanner CLI in given directory and extract task ID.
 */
function runSonarScanner(tempDir) {
  return new Promise((resolve, reject) => {
    exec(
      "sonar-scanner",
      { cwd: tempDir, maxBuffer: 1024 * 1024 * 10 }, // 10MB buffer
      (err, stdout, stderr) => {
        if (err) {
          return reject(
            new Error(
              `Sonar scanner failed: ${err.message}\nSTDERR:\n${stderr}\nSTDOUT (partial):\n${stdout.slice(
                0,
                500
              )}...`
            )
          );
        }

        const match =
          stdout.match(/ce\/task\?id=([A-Za-z0-9_-]+)/) ||
          stdout.match(/task\?id=([A-Za-z0-9_-]+)/);

        const taskId = match ? match[1] : null;

        if (!taskId) {
          return reject(
            new Error(
              `Unable to parse SonarQube task ID from scanner output.\nSTDERR:\n${stderr}\nSTDOUT (partial):\n${stdout.slice(
                0,
                500
              )}...`
            )
          );
        }

        resolve({ taskId, rawOutput: stdout });
      }
    );
  });
}

/**
 * Poll SonarQube CE task until it finishes (SUCCESS or FAILED).
 */
async function waitForTaskCompletion(taskId, sonarHostUrl, sonarToken, timeoutMs = 5 * 60 * 1000) {
  const start = Date.now();
  const headers = sonarToken
    ? { Authorization: `Basic ${Buffer.from(`${sonarToken}:`).toString('base64')}` }
    : undefined;

  while (true) {
    if (Date.now() - start > timeoutMs) throw new Error('SonarQube task timed out');

    const res = await axios.get(
      `${sonarHostUrl}/api/ce/task?id=${encodeURIComponent(taskId)}`,
      { headers }
    );

    const status = res.data?.task?.status;
    if (status === 'SUCCESS' || status === 'FAILED') {
      return res.data.task; // includes analysisId
    }

    await new Promise((r) => setTimeout(r, 3000));
  }
}

  /**
   * Fetch all pages for paginated APIs
   *
   * For very large SonarQube projects, some endpoints (like /api/issues/search)
   * enforce a hard cap of 10,000 results and return HTTP 400 with a message
   * like "Can return only the first 10000 results" when that limit is hit.
   *
   * Instead of failing the entire report build in that case, we stop
   * pagination and return whatever we have so far, so downstream consumers
   * (including S3 upload) can still succeed.
   */
  async function fetchAllPaginated(baseUrl, headers, key) {
    let page = 1;
    let results = [];
    let total = 0;

    while (true) {
      let res;
      try {
        res = await axios.get(`${baseUrl}&p=${page}`, { headers });
      } catch (err) {
        const status = err?.response?.status;
        const msg = Array.isArray(err?.response?.data?.errors)
          ? err.response.data.errors.map((e) => e.msg || '').join(' | ')
          : err?.response?.data?.message || '';

        // SonarQube hard 10k limit: keep partial data instead of failing
        if (
          status === 400 &&
          typeof msg === 'string' &&
          msg.includes('Can return only the first 10000 results')
        ) {
          return results;
        }

        throw err;
      }

      const items = res.data[key] || [];
      results = results.concat(items);

      if (!res.data.paging) break;
      total = res.data.paging.total;
      if (results.length >= total) break;
      page++;
    }
    return results;
  }

  /**
   * Fetch a full, rich scan report for a given projectKey
   * (SonarQube Community Edition compatible, shaped like SonarCloud).
   */
  async function fetchFullScanReport(projectKey, sonarHostUrl, sonarToken) {
    const headers = sonarToken
      ? { Authorization: `Basic ${Buffer.from(`${sonarToken}:`).toString("base64")}` }
      : undefined;

    // Endpoint URLs
    const qualityGateUrl = `${sonarHostUrl}/api/qualitygates/project_status?projectKey=${encodeURIComponent(projectKey)}`;
    const measuresUrl =
      `${sonarHostUrl}/api/measures/component?component=${encodeURIComponent(projectKey)}` +
      `&metricKeys=coverage,bugs,vulnerabilities,code_smells,duplicated_lines_density,reliability_rating,security_rating,sqale_index,sqale_rating,ncloc,blocker_violations,critical_violations,major_violations,minor_violations,info_violations,duplicated_blocks,security_hotspots`;
    const issuesBase = `${sonarHostUrl}/api/issues/search?componentKeys=${encodeURIComponent(projectKey)}&ps=500`;
    const branchesUrl = `${sonarHostUrl}/api/project_branches/list?project=${encodeURIComponent(projectKey)}`;
    const componentTreeUrl = `${sonarHostUrl}/api/components/tree?component=${encodeURIComponent(projectKey)}&qualifiers=DIR,FIL`;
    const analysisHistoryUrl = `${sonarHostUrl}/api/project_analyses/search?project=${encodeURIComponent(projectKey)}`;
    const qualityProfilesUrl = `${sonarHostUrl}/api/qualityprofiles/search?projectKey=${encodeURIComponent(projectKey)}`;
    const rulesUrl = `${sonarHostUrl}/api/rules/search?ps=500`;
    const metricsUrl = `${sonarHostUrl}/api/metrics/search?ps=500`;
    const projectSettingsUrl = `${sonarHostUrl}/api/settings/values?component=${encodeURIComponent(projectKey)}`;
    const hotspotsBase = `${sonarHostUrl}/api/hotspots/search?project=${encodeURIComponent(projectKey)}&ps=500`;

    // Fetch non-paginated parts in parallel
    const [
      qualityGateRes,
      measuresRes,
      branchesRes,
      componentTreeRes,
      analysisHistoryRes,
      qualityProfilesRes,
      projectSettingsRes,
    ] = await Promise.all([
      axios.get(qualityGateUrl, { headers }),
      axios.get(measuresUrl, { headers }),
      axios.get(branchesUrl, { headers }),
      axios.get(componentTreeUrl, { headers }),
      axios.get(analysisHistoryUrl, { headers }),
      axios.get(qualityProfilesUrl, { headers }),
      axios.get(projectSettingsUrl, { headers }),
    ]);

    // Fully fetch paginated data
    const [issues, rules, metrics, hotspots] = await Promise.all([
      fetchAllPaginated(issuesBase, headers, "issues"),
      fetchAllPaginated(rulesUrl, headers, "rules"),
      fetchAllPaginated(metricsUrl, headers, "metrics"),
      fetchAllPaginated(hotspotsBase, headers, "hotspots"),
    ]);

    // Fetch hotspot details for each hotspot
    const hotspotDetails = {};
    await Promise.all(
      hotspots.map(async (h) => {
        try {
          const res = await axios.get(
            `${sonarHostUrl}/api/hotspots/show?hotspot=${encodeURIComponent(h.key)}`,
            { headers }
          );
          hotspotDetails[h.key] = res.data;
        } catch (err) {
          hotspotDetails[h.key] = { error: err.message };
        }
      })
    );

    // Per-branch quality gate
    const perBranch = {};
    if (branchesRes.data.branches && Array.isArray(branchesRes.data.branches)) {
      await Promise.all(
        branchesRes.data.branches.map(async (branch) => {
          const name = branch.name;
          try {
            const branchQG = await axios.get(
              `${sonarHostUrl}/api/qualitygates/project_status?projectKey=${encodeURIComponent(projectKey)}&branch=${encodeURIComponent(name)}`,
              { headers }
            );
            perBranch[name] = { qualityGate: branchQG.data };
          } catch (e) {
            perBranch[name] = { error: e.message };
          }
        })
      );
    }

    // ---- Component tree enrichment (like SonarCloud /measures/component_tree) ----
    const metricKeys = [
      "bugs",
      "vulnerabilities",
      "code_smells",
      "ncloc",
      "duplicated_lines_density",
      "coverage",
      "security_hotspots",
    ];

    const allComponentMeasures = await fetchAllPaginated(
      `${sonarHostUrl}/api/measures/component_tree?component=${encodeURIComponent(projectKey)}&metricKeys=${metricKeys.join(",")}&ps=500`,
      headers,
      "components"
    );

    // Map enriched component measures by merging them with component tree structure
    const enrichedComponents = allComponentMeasures.map((comp) => ({
      ...comp,
      measures: comp.measures || [],
    }));

    // Final report
    return {
      projectKey,
      fetchedAt: new Date().toISOString(),

      // High-level project quality
      qualityGate: qualityGateRes.data,
      measures: measuresRes.data,

      // Complete sets
      issues: { total: issues.length, items: issues },
      rules: { total: rules.length, items: rules },
      metrics: { total: metrics.length, items: metrics },
      hotspots: { total: hotspots.length, items: hotspots, details: hotspotDetails },

      // Branches
      branchesList: branchesRes.data,
      perBranch,

      // Component tree shaped like SonarCloud
      componentTree: {
        baseComponent: { key: projectKey },
        components: enrichedComponents,
      },

      // History + Profiles + Settings
      analysisHistory: analysisHistoryRes.data,
      qualityProfiles: qualityProfilesRes.data,
      projectSettings: projectSettingsRes.data,
    };
  }

module.exports = {
  runSonarScanner,
  waitForTaskCompletion,
  fetchFullScanReport,
};
