// utils/goDependencyScanner.js
// Minimal Go (Go modules) dependency scanner - Phase 1
// - Discovers go.mod files
// - Parses require directives
// - Uses Go module proxy to determine latest versions

const fs = require('fs');
const path = require('path');
const axios = require('axios');

function walkForGoModules(rootDir, maxDepth = 4) {
  const goMods = [];
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
      if (ent.isFile() && ent.name === 'go.mod') {
        goMods.push(full);
      } else if (ent.isDirectory()) {
        if (['.git', '.svn', '.hg', 'vendor', 'node_modules'].includes(ent.name)) continue;
        stack.push({ dir: full, depth: depth + 1 });
      }
    }
  }

  return { goMods };
}

function parseGoMod(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  let modulePath = null;
  let goVersion = null;
  const deps = [];

  let inRequireBlock = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('//')) continue;

    if (line.startsWith('module ')) {
      modulePath = line.replace(/^module\s+/, '').trim();
      continue;
    }

    if (line.startsWith('go ')) {
      goVersion = line.replace(/^go\s+/, '').trim();
      continue;
    }

    if (line.startsWith('require (')) {
      inRequireBlock = true;
      continue;
    }
    if (inRequireBlock && line === ')') {
      inRequireBlock = false;
      continue;
    }

    if (line.startsWith('require ')) {
      const rest = line.replace(/^require\s+/, '');
      const dep = parseRequireLine(rest);
      if (dep) deps.push(dep);
      continue;
    }

    if (inRequireBlock) {
      const dep = parseRequireLine(line);
      if (dep) deps.push(dep);
    }
  }

  return { modulePath, goVersion, deps };
}

function parseRequireLine(line) {
  // examples:
  // github.com/foo/bar v1.2.3
  // github.com/foo/bar v1.2.3 // indirect
  const cleaned = line.split('//')[0].trim();
  if (!cleaned) return null;
  const parts = cleaned.split(/\s+/);
  if (parts.length < 2) return null;

  const [module, version] = parts;
  const indirect = line.includes('// indirect');
  return { module, version, indirect };
}

function compareSemverLike(a, b) {
  if (!a || !b) return 0;
  const stripV = (v) => String(v).replace(/^v/, '');
  const pa = stripV(a).split('.').map((x) => parseInt(x, 10) || 0);
  const pb = stripV(b).split('.').map((x) => parseInt(x, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va !== vb) return va - vb;
  }
  return 0;
}

function computeStatusGo(current, latest) {
  if (!current || !latest) return 'unknown';
  const pa = String(current).replace(/^v/, '').split('.').map((x) => parseInt(x, 10) || 0);
  const pb = String(latest).replace(/^v/, '').split('.').map((x) => parseInt(x, 10) || 0);

  if (pa[0] === pb[0] && pa[1] === pb[1] && (pa[2] || 0) === (pb[2] || 0)) return 'upToDate';
  if ((pa[0] || 0) !== (pb[0] || 0)) return 'major';
  if ((pa[1] || 0) !== (pb[1] || 0)) return 'minor';
  return 'patch';
}

async function fetchGoModuleLatest(modulePath) {
  try {
    // Use Go module proxy. This returns a plain text list of versions.
    const url = `https://proxy.golang.org/${encodeURIComponent(modulePath)}/@v/list`;
    const res = await axios.get(url, { timeout: 15000, validateStatus: () => true });
    if (res.status >= 400) return { latest: null };

    const versions = String(res.data || '')
      .split(/\r?\n/)
      .map((v) => v.trim())
      .filter(Boolean);

    if (!versions.length) return { latest: null };

    versions.sort(compareSemverLike);
    const latest = versions[versions.length - 1];
    return { latest };
  } catch (_) {
    return { latest: null };
  }
}

async function scanGoDependencies(tempDir) {
  try {
    const { goMods } = walkForGoModules(tempDir);
    console.log('[goDependencyScanner] manifests', {
      tempDir,
      goModsCount: goMods.length,
    });

    if (goMods.length === 0) {
      return { packages: [], summary: { total: 0, outdated: 0, major: 0, minor: 0, patch: 0 } };
    }

    const packages = [];
    const summary = { total: 0, outdated: 0, major: 0, minor: 0, patch: 0 };

    for (const modPath of goMods) {
      const { modulePath, goVersion, deps } = parseGoMod(modPath);
      console.log('[goDependencyScanner] parsed go.mod', {
        path: modPath,
        modulePath,
        goVersion,
        depsCount: deps.length,
      });

      for (const dep of deps) {
        summary.total++;

        const { module, version, indirect } = dep;
        const { latest } = await fetchGoModuleLatest(module);

        const current = version || null;
        const compatible = current; // phase 1: treat current as compatible
        const status = computeStatusGo(current, latest);

        if (status === 'major') summary.major++;
        else if (status === 'minor') summary.minor++;
        else if (status === 'patch') summary.patch++;
        if (status === 'major' || status === 'minor' || status === 'patch') summary.outdated++;

        packages.push({
          name: module,
          current,
          compatible,
          latest,
          type: indirect ? 'indirect' : 'dependency',
          status,
          homepage: null, // Go proxy does not provide homepage; phase 1 leaves this null
          deprecated: false,
          deprecatedInfo: {
            latest: false,
            compatible: false,
          },
          ecosystem: 'gomod',
          manifestPath: path.relative(process.cwd(), modPath),
          specifier: version,
        });
      }
    }

    console.log('[goDependencyScanner] completed', {
      tempDir,
      packagesCount: packages.length,
      summary,
    });

    return { packages, summary };
  } catch (err) {
    console.error('[goDependencyScanner] error', { tempDir, error: err && err.message });
    return { packages: [], summary: { total: 0, outdated: 0, major: 0, minor: 0, patch: 0 }, error: err.message };
  }
}

module.exports = { scanGoDependencies };
