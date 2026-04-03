// utils/phpDependencyScanner.js
// Minimal PHP (Packagist) dependency scanner - Phase 1
// - Discovers composer.json files
// - Reads require/require-dev
// - Uses composer.lock when available to determine current versions

const fs = require('fs');
const path = require('path');
const axios = require('axios');

function walkForPhpManifests(rootDir, maxDepth = 4) {
  const composerFiles = [];
  const stack = [{ dir: rootDir, depth: 0 }];

  while (stack.length) {
    const { dir, depth } = stack.pop();
    if (depth > maxDepth) continue;

    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
      continue;
    }

    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isFile()) {
        if (ent.name === 'composer.json') composerFiles.push(full);
      } else if (ent.isDirectory()) {
        if (['.git', '.svn', '.hg', 'vendor', 'node_modules'].includes(ent.name)) continue;
        stack.push({ dir: full, depth: depth + 1 });
      }
    }
  }

  return { composerFiles };
}

function readJsonSafe(p) {
  try {
    const content = fs.readFileSync(p, 'utf-8');
    return JSON.parse(content);
  } catch (_) {
    return null;
  }
}

function compareVersionStrings(a, b) {
  if (!a || !b) return 0;
  const pa = a.split('.').map((x) => parseInt(x, 10) || 0);
  const pb = b.split('.').map((x) => parseInt(x, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va !== vb) return va - vb;
  }
  return 0;
}

function computeStatusPhp(current, latest) {
  if (!current || !latest) return 'unknown';
  const pa = current.split('.').map((x) => parseInt(x, 10) || 0);
  const pb = latest.split('.').map((x) => parseInt(x, 10) || 0);

  if (pa[0] === pb[0] && pa[1] === pb[1] && (pa[2] || 0) === (pb[2] || 0)) return 'upToDate';
  if ((pa[0] || 0) !== (pb[0] || 0)) return 'major';
  if ((pa[1] || 0) !== (pb[1] || 0)) return 'minor';
  return 'patch';
}

async function fetchPackagistInfo(name) {
  try {
    // Packagist package names are like vendor/package
    const url = `https://repo.packagist.org/p2/${encodeURIComponent(name)}.json`;
    const res = await axios.get(url, { timeout: 15000, validateStatus: () => true });
    if (res.status >= 400 || !res.data || !Array.isArray(res.data.packages?.[name])) {
      return { latest: null, homepage: null };
    }
    const versions = res.data.packages[name]
      .map((v) => v.version_normalized || v.version)
      .filter(Boolean)
      // Filter out dev/alpha/beta/RC suffixes where possible
      .filter((v) => !/(dev|alpha|beta|RC)/i.test(v));

    if (!versions.length) return { latest: null, homepage: null };
    versions.sort(compareVersionStrings);
    const latest = versions[versions.length - 1];

    // Try to get homepage from the latest entry
    const latestEntry = res.data.packages[name].find(
      (v) => (v.version_normalized || v.version) === latest
    ) || res.data.packages[name][0];

    const homepage = latestEntry.homepage || (Array.isArray(latestEntry.keywords) ? latestEntry.keywords[0] : null);

    return { latest, homepage: homepage || null };
  } catch (_) {
    return { latest: null, homepage: null };
  }
}

async function scanPhpDependencies(tempDir) {
  try {
    const { composerFiles } = walkForPhpManifests(tempDir);
    console.log('[phpDependencyScanner] manifests', {
      tempDir,
      composerFilesCount: composerFiles.length,
    });

    if (composerFiles.length === 0) {
      return { packages: [], summary: { total: 0, outdated: 0, major: 0, minor: 0, patch: 0 } };
    }

    const packages = [];
    const summary = { total: 0, outdated: 0, major: 0, minor: 0, patch: 0 };

    for (const composerPath of composerFiles) {
      const composerDir = path.dirname(composerPath);
      const json = readJsonSafe(composerPath);
      if (!json) continue;

      const lockPath = path.join(composerDir, 'composer.lock');
      const lockJson = fs.existsSync(lockPath) ? readJsonSafe(lockPath) : null;
      const locked = {};
      if (lockJson) {
        const allPackages = []
          .concat(Array.isArray(lockJson.packages) ? lockJson.packages : [])
          .concat(Array.isArray(lockJson['packages-dev']) ? lockJson['packages-dev'] : []);
        for (const pkg of allPackages) {
          if (pkg && pkg.name && pkg.version) {
            locked[pkg.name] = pkg.version.replace(/^v/, '');
          }
        }
      }

      const sections = [
        { section: json.require || {}, type: 'dependency' },
        { section: json['require-dev'] || {}, type: 'devdependency' },
      ];

      for (const { section, type } of sections) {
        for (const [name, constraint] of Object.entries(section)) {
          if (name === 'php') continue;

          summary.total++;
          const specifier = String(constraint || '').trim();
          const current = locked[name] ? locked[name].replace(/^v/, '') : null;

          const { latest, homepage } = await fetchPackagistInfo(name);

          const status = current ? computeStatusPhp(current, latest) : 'unknown';
          if (status === 'major') summary.major++;
          else if (status === 'minor') summary.minor++;
          else if (status === 'patch') summary.patch++;
          if (status === 'major' || status === 'minor' || status === 'patch') summary.outdated++;

          packages.push({
            name,
            current,
            compatible: current,
            latest,
            type,
            status,
            homepage: homepage || null,
            deprecated: false,
            deprecatedInfo: {
              latest: false,
              compatible: false,
            },
            ecosystem: 'php',
            manifestPath: path.relative(process.cwd(), composerPath),
            specifier,
          });
        }
      }
    }

    console.log('[phpDependencyScanner] completed', {
      tempDir,
      packagesCount: packages.length,
      summary,
    });

    return { packages, summary };
  } catch (err) {
    console.error('[phpDependencyScanner] error', { tempDir, error: err && err.message });
    return { packages: [], summary: { total: 0, outdated: 0, major: 0, minor: 0, patch: 0 }, error: err.message };
  }
}

module.exports = { scanPhpDependencies };
