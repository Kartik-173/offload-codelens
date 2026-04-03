// utils/dependencyScanner.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const semver = require('semver');

async function fetchRegistryInfo(pkgName) {
  try {
    const url = `https://registry.npmjs.org/${encodeURIComponent(pkgName)}`;
    const res = await axios.get(url, { timeout: 15000, validateStatus: () => true });
    if (res.status >= 400) return { latest: null, versions: [], homepage: null, versionMeta: {} };
    const latest = res.data?.["dist-tags"]?.latest || null;
    const versionsObj = res.data?.versions || {};
    const versions = Object.keys(versionsObj);
    const homepage = res.data?.homepage || res.data?.["dist-tags"]?.homepage || null;
    return { latest, versions, homepage, versionMeta: versionsObj };
  } catch (_) {
    return { latest: null, versions: [], homepage: null, versionMeta: {} };
  }
}

function computeStatus(wanted, latest) {
  if (!wanted || !latest) return 'unknown';
  if (semver.eq(wanted, latest)) return 'upToDate';
  const diff = semver.diff(semver.coerce(wanted), semver.coerce(latest));
  if (!diff) return 'unknown';
  if (diff === 'major') return 'major';
  if (diff === 'minor') return 'minor';
  if (diff === 'patch' || diff === 'prerelease') return 'patch';
  return 'unknown';
}

async function scanPackageJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(content);
  const deps = json.dependencies || {};
  const devDeps = json.devDependencies || {};

  const entries = [
    ...Object.entries(deps).map(([name, range]) => ({ name, range, type: 'dependency' })),
    ...Object.entries(devDeps).map(([name, range]) => ({ name, range, type: 'devDependency' })),
  ];

  const packages = [];
  let summary = { total: entries.length, outdated: 0, major: 0, minor: 0, patch: 0 };

  for (const item of entries) {
    const { latest, versions, homepage, versionMeta } = await fetchRegistryInfo(item.name);
    let wanted = null;
    try {
      wanted = semver.maxSatisfying(versions, item.range) || null;
    } catch (_) {
      wanted = null;
    }
    const status = computeStatus(wanted, latest);
    const deprecatedLatest = latest && versionMeta?.[latest]?.deprecated ? true : false;
    const deprecatedWanted = wanted && versionMeta?.[wanted]?.deprecated ? true : false;
    if (status === 'major') summary.major++;
    if (status === 'minor') summary.minor++;
    if (status === 'patch') summary.patch++;
    if (status !== 'upToDate' && status !== 'unknown') summary.outdated++;

    packages.push({
      name: item.name,
      current: item.range,
      wanted,
      compatible: wanted,
      latest,
      type: item.type,
      status,
      homepage: homepage || (json.homepage || null),
      deprecated: deprecatedLatest || deprecatedWanted || false,
      deprecatedInfo: {
        latest: deprecatedLatest,
        compatible: deprecatedWanted,
      },
      packageJsonPath: path.relative(process.cwd(), filePath)
    });
  }

  return { packages, summary };
}

async function scanNodeDependencies(tempDir) {
  try {
    const rootPkg = path.join(tempDir, 'package.json');

    // Helper: recursively find package.json files (skip node_modules/.git)
    const found = [];
    const stack = [{ dir: tempDir, depth: 0 }];
    const MAX_DEPTH = 4;
    while (stack.length) {
      const { dir, depth } = stack.pop();
      if (depth > MAX_DEPTH) continue;
      let entries = [];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch (_) {
        continue;
      }
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isFile() && ent.name === 'package.json') {
          if (!full.includes(`${path.sep}node_modules${path.sep}`)) found.push(full);
        } else if (ent.isDirectory()) {
          if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === '.svn' || ent.name === '.hg') continue;
          stack.push({ dir: full, depth: depth + 1 });
        }
      }
    }

    // Prefer root package.json if present
    if (fs.existsSync(rootPkg)) {
      if (!found.includes(rootPkg)) found.unshift(rootPkg);
    }

    if (found.length === 0) {
      return { packages: [], summary: { total: 0, outdated: 0, major: 0, minor: 0, patch: 0 } };
    }

    // Scan all discovered package.json files and merge results
    let allPackages = [];
    let totals = { total: 0, outdated: 0, major: 0, minor: 0, patch: 0 };
    for (const pkgPath of found) {
      try {
        const { packages, summary } = await scanPackageJson(pkgPath);
        allPackages.push(...packages);
        totals.total += summary.total || 0;
        totals.outdated += summary.outdated || 0;
        totals.major += summary.major || 0;
        totals.minor += summary.minor || 0;
        totals.patch += summary.patch || 0;
      } catch (_) {
        // continue with next package.json
      }
    }

    return { packages: allPackages, summary: totals };
  } catch (err) {
    return { packages: [], summary: { total: 0, outdated: 0, major: 0, minor: 0, patch: 0 }, error: err.message };
  }
}

module.exports = { scanNodeDependencies };
