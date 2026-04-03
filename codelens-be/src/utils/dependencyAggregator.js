// utils/dependencyAggregator.js
// Aggregates dependency insights from one or more ecosystem-specific scanners

const { scanNodeDependencies } = require('./dependencyScanner');
const { scanPythonDependencies } = require('./pythonDependencyScanner');
const { scanPhpDependencies } = require('./phpDependencyScanner');
const { scanGoDependencies } = require('./goDependencyScanner');

/**
 * Unified dependency scan entrypoint.
 * For now this only wraps the Node.js (npm) scanner, but the shape is
 * intentionally generic so we can plug in Python, PHP, etc. later.
 *
 * @param {string} tempDir - Absolute path to the extracted project directory.
 * @returns {Promise<{ packages: Array, summary: { total: number, outdated: number, major: number, minor: number, patch: number } }>}
 */
async function scanAllDependencies(tempDir) {
  // Run all ecosystem scanners in parallel and merge results.
  const emptySummary = { total: 0, outdated: 0, major: 0, minor: 0, patch: 0 };

  const [nodeRes, pyRes, phpRes, goRes] = await Promise.allSettled([
    scanNodeDependencies(tempDir),
    scanPythonDependencies(tempDir),
    scanPhpDependencies(tempDir),
    scanGoDependencies(tempDir),
  ]);

  const nodeReport = nodeRes.status === 'fulfilled' ? nodeRes.value : { packages: [], summary: emptySummary, error: nodeRes.reason?.message };
  const pyReport = pyRes.status === 'fulfilled' ? pyRes.value : { packages: [], summary: emptySummary, error: pyRes.reason?.message };
  const phpReport = phpRes.status === 'fulfilled' ? phpRes.value : { packages: [], summary: emptySummary, error: phpRes.reason?.message };
  const goReport = goRes.status === 'fulfilled' ? goRes.value : { packages: [], summary: emptySummary, error: goRes.reason?.message };

  const packages = [
    ...(Array.isArray(nodeReport.packages) ? nodeReport.packages : []),
    ...(Array.isArray(pyReport.packages) ? pyReport.packages : []),
    ...(Array.isArray(phpReport.packages) ? phpReport.packages : []),
    ...(Array.isArray(goReport.packages) ? goReport.packages : []),
  ];
  const summary = {
    total: packages.length,
    major: 0,
    minor: 0,
    patch: 0,
    outdated: 0,
  };

  for (const p of packages) {
    const status = p.status || 'unknown';
    if (status === 'major') summary.major++;
    else if (status === 'minor') summary.minor++;
    else if (status === 'patch') summary.patch++;
  }
  summary.outdated = summary.major + summary.minor + summary.patch;

  return { packages, summary };
}

module.exports = { scanAllDependencies };
