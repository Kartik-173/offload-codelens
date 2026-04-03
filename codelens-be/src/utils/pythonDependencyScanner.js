// utils/pythonDependencyScanner.js
// Minimal Python (PyPI) dependency scanner - Phase 1
// - Discovers requirements.txt files
// - Handles pinned requirements of the form `name==version`
// - Other specifiers are included but marked with status "unknown"

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const toml = require('toml');

function walkForPythonManifests(rootDir, maxDepth = 4) {
  const requirements = [];
  const pyprojects = [];
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
        if (ent.name === 'requirements.txt') requirements.push(full);
        else if (ent.name === 'pyproject.toml') pyprojects.push(full);
      } else if (ent.isDirectory()) {
        if (['.git', '.svn', '.hg', '__pycache__', 'venv', '.venv'].includes(ent.name)) continue;
        stack.push({ dir: full, depth: depth + 1 });
      }
    }
  }

  return { requirements, pyprojects };
}

function parseRequirementsFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const results = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    // Ignore editable installs, URLs, -r includes, etc. for now
    if (line.startsWith('-') || line.startsWith('git+') || line.startsWith('http:') || line.startsWith('https:')) continue;

    // Very small parser: name[extra]==version or name==version
    const pinnedMatch = /^([A-Za-z0-9_.\-]+)(?:\[[^\]]+\])?==([^#]+)$/.exec(line);
    if (pinnedMatch) {
      const name = pinnedMatch[1];
      const version = pinnedMatch[2].trim();
      results.push({ name, specifier: `==${version}`, pinnedVersion: version });
      continue;
    }

    // Fallback: capture name (before first space / comparator)
    const nameMatch = /^([A-Za-z0-9_.\-]+)/.exec(line);
    if (nameMatch) {
      const name = nameMatch[1];
      results.push({ name, specifier: line, pinnedVersion: null });
    }
  }

  return results;
}

function parsePyprojectToml(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = toml.parse(content);
  } catch (err) {
    console.error('[pythonDependencyScanner] toml parse error', { filePath, error: err && err.message });

    // Fallback: very small parser to extract [project] dependencies = ["pkg", ...]
    const results = [];
    try {
      const projectSectionMatch = /^\s*\[project\][\r\n]+([\s\S]*?)(?:^[ \t]*\[|$)/m.exec(content);
      console.log('[pythonDependencyScanner] fallback projectSectionMatch', {
        filePath,
        hasSection: !!projectSectionMatch,
      });
      if (projectSectionMatch) {
        const section = projectSectionMatch[1];
        let depsMatch = /dependencies\s*=\s*\[([\s\S]*?)\]/m.exec(section);
        if (!depsMatch) {
          // Fallback: search globally if for some reason it's not captured in section
          depsMatch = /dependencies\s*=\s*\[([\s\S]*?)\]/m.exec(content);
        }
        console.log('[pythonDependencyScanner] fallback depsMatch', {
          filePath,
          hasDeps: !!depsMatch,
        });
        if (depsMatch) {
          const inner = depsMatch[1];
          const depRegex = /"([^"]+)"/g;
          let m;
          while ((m = depRegex.exec(inner)) !== null) {
            const line = m[1].trim();
            if (!line) continue;
            const nameMatch = /^([A-Za-z0-9_.\-]+)/.exec(line);
            if (nameMatch) {
              const name = nameMatch[1];
              results.push({ name, specifier: line, pinnedVersion: null });
            }
          }
        }
      }
    } catch (_) {
      // ignore, we'll just return what we have so far
    }

    return results;
  }

  const results = [];

  // PEP 621 style: [project] dependencies = ["pkg==1.2.3", ...]
  const projectDeps = data?.project?.dependencies || [];
  if (Array.isArray(projectDeps)) {
    for (const dep of projectDeps) {
      if (typeof dep !== 'string') continue;
      const line = dep.trim();
      if (!line) continue;
      const pinnedMatch = /^([A-Za-z0-9_.\-]+)(?:\[[^\]]+\])?==([^#]+)$/.exec(line);
      if (pinnedMatch) {
        const name = pinnedMatch[1];
        const version = pinnedMatch[2].trim();
        results.push({ name, specifier: `==${version}`, pinnedVersion: version });
      } else {
        const nameMatch = /^([A-Za-z0-9_.\-]+)/.exec(line);
        if (nameMatch) {
          const name = nameMatch[1];
          results.push({ name, specifier: line, pinnedVersion: null });
        }
      }
    }
  }

  // Poetry-style: [tool.poetry.dependencies]
  const poetryDeps = data?.tool?.poetry?.dependencies || {};
  if (poetryDeps && typeof poetryDeps === 'object') {
    for (const [name, spec] of Object.entries(poetryDeps)) {
      if (name === 'python') continue; // not a package
      if (typeof spec === 'string') {
        const line = spec.trim();
        const pinnedMatch = /^==?\s*([^#]+)$/.exec(line);
        if (pinnedMatch) {
          const version = pinnedMatch[1].trim();
          results.push({ name, specifier: `==${version}`, pinnedVersion: version });
        } else {
          results.push({ name, specifier: line, pinnedVersion: null });
        }
      } else if (spec && typeof spec === 'object' && typeof spec.version === 'string') {
        const line = spec.version.trim();
        const pinnedMatch = /^==?\s*([^#]+)$/.exec(line);
        if (pinnedMatch) {
          const version = pinnedMatch[1].trim();
          results.push({ name, specifier: `==${version}`, pinnedVersion: version });
        } else {
          results.push({ name, specifier: line, pinnedVersion: null });
        }
      }
    }
  }

  return results;
}

async function fetchPyPiInfo(name) {
  try {
    const url = `https://pypi.org/pypi/${encodeURIComponent(name)}/json`;
    const res = await axios.get(url, { timeout: 15000, validateStatus: () => true });
    if (res.status >= 400) return { latest: null, versions: [], homepage: null };

    const releases = res.data?.releases || {};
    const allVersions = Object.keys(releases);

    // Filter out pre-releases (simple heuristic: contains a letter)
    const stableVersions = allVersions.filter((v) => !/[a-zA-Z]/.test(v));
    const versions = stableVersions.length ? stableVersions : allVersions;

    // Very naive max: sort lexicographically with a basic semver-like comparator
    const sorted = versions.sort(compareVersionStrings);
    const latest = sorted[sorted.length - 1] || null;

    const info = res.data?.info || {};
    const homepage = info.home_page || info.project_url || null;

    return { latest, versions: sorted, homepage };
  } catch (_) {
    return { latest: null, versions: [], homepage: null };
  }
}

function compareVersionStrings(a, b) {
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

function computeStatusPython(current, latest) {
  if (!current || !latest) return 'unknown';
  const pa = current.split('.').map((x) => parseInt(x, 10) || 0);
  const pb = latest.split('.').map((x) => parseInt(x, 10) || 0);

  if (pa[0] === pb[0] && pa[1] === pb[1] && (pa[2] || 0) === (pb[2] || 0)) return 'upToDate';
  if ((pa[0] || 0) !== (pb[0] || 0)) return 'major';
  if ((pa[1] || 0) !== (pb[1] || 0)) return 'minor';
  return 'patch';
}

async function scanPythonDependencies(tempDir) {
  try {
    const { requirements: requirementFiles, pyprojects } = walkForPythonManifests(tempDir);
    console.log('[pythonDependencyScanner] manifests', {
      tempDir,
      requirementFilesCount: requirementFiles.length,
      pyprojectsCount: pyprojects.length,
    });

    if (requirementFiles.length === 0 && pyprojects.length === 0) {
      return { packages: [], summary: { total: 0, outdated: 0, major: 0, minor: 0, patch: 0 } };
    }

    const packages = [];
    const summary = { total: 0, outdated: 0, major: 0, minor: 0, patch: 0 };

    // requirements.txt entries
    for (const reqPath of requirementFiles) {
      const entries = parseRequirementsFile(reqPath);
      console.log('[pythonDependencyScanner] parsed requirements.txt', { path: reqPath, entriesCount: entries.length });
      for (const entry of entries) {
        summary.total++;
        const { name, specifier, pinnedVersion } = entry;

        const { latest, homepage } = await fetchPyPiInfo(name);

        let current = pinnedVersion || null;
        let compatible = pinnedVersion || null; // phase 1: treat pinned as compatible
        let status = pinnedVersion ? computeStatusPython(current, latest) : 'unknown';

        if (status === 'major') summary.major++;
        else if (status === 'minor') summary.minor++;
        else if (status === 'patch') summary.patch++;

        if (status === 'major' || status === 'minor' || status === 'patch') summary.outdated++;

        packages.push({
          name,
          current,
          compatible,
          latest,
          type: 'dependency', // no separate dev/prod in requirements.txt
          status,
          homepage: homepage || null,
          deprecated: false, // PyPI does not expose an explicit deprecated flag; phase 1 ignores this
          deprecatedInfo: {
            latest: false,
            compatible: false,
          },
          ecosystem: 'pypi',
          manifestPath: path.relative(process.cwd(), reqPath),
          specifier,
        });
      }
    }

    // pyproject.toml entries
    for (const projPath of pyprojects) {
      const entries = parsePyprojectToml(projPath);
      console.log('[pythonDependencyScanner] parsed pyproject.toml', { path: projPath, entriesCount: entries.length });
      for (const entry of entries) {
        summary.total++;
        const { name, specifier, pinnedVersion } = entry;

        const { latest, homepage } = await fetchPyPiInfo(name);

        let current = pinnedVersion || null;
        let compatible = pinnedVersion || null;
        let status = pinnedVersion ? computeStatusPython(current, latest) : 'unknown';

        if (status === 'major') summary.major++;
        else if (status === 'minor') summary.minor++;
        else if (status === 'patch') summary.patch++;

        if (status === 'major' || status === 'minor' || status === 'patch') summary.outdated++;

        packages.push({
          name,
          current,
          compatible,
          latest,
          type: 'dependency',
          status,
          homepage: homepage || null,
          deprecated: false,
          deprecatedInfo: {
            latest: false,
            compatible: false,
          },
          ecosystem: 'pypi',
          manifestPath: path.relative(process.cwd(), projPath),
          specifier,
        });
      }
    }

    console.log('[pythonDependencyScanner] completed', {
      tempDir,
      packagesCount: packages.length,
      summary,
    });

    return { packages, summary };
  } catch (err) {
    console.error('[pythonDependencyScanner] error', { tempDir, error: err && err.message });
    return { packages: [], summary: { total: 0, outdated: 0, major: 0, minor: 0, patch: 0 }, error: err.message };
  }
}

module.exports = { scanPythonDependencies };
