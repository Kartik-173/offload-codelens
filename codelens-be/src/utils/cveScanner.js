// utils/cveScanner.js
// CVE detection for Node.js (npm) projects using OSV.dev batch API
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const semver = require('semver');

async function fetchRegistryVersions(pkgName) {
  try {
    const url = `https://registry.npmjs.org/${encodeURIComponent(pkgName)}`;
    const res = await axios.get(url, { timeout: 15000, validateStatus: () => true });
    const versionsObj = res.status < 400 ? (res.data?.versions || {}) : {};
    return Object.keys(versionsObj);
  } catch (_) {
    return [];
  }
}

function findPackageJsonFiles(rootDir, maxDepth = 4) {
  const found = [];
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
      if (ent.isFile() && ent.name === 'package.json') {
        if (!full.includes(`${path.sep}node_modules${path.sep}`)) found.push(full);
      } else if (ent.isDirectory()) {
        if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === '.svn' || ent.name === '.hg') continue;
        stack.push({ dir: full, depth: depth + 1 });
      }
    }
  }
  return found;
}

function findPythonManifests(rootDir, maxDepth = 4) {
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
        if (ent.name === '__pycache__' || ent.name === 'venv' || ent.name === '.venv' || ent.name === '.git' || ent.name === '.svn' || ent.name === '.hg') continue;
        stack.push({ dir: full, depth: depth + 1 });
      }
    }
  }
  return { requirements, pyprojects };
}

function parseRequirementsPinned(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const results = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('-') || line.startsWith('git+') || line.startsWith('http:') || line.startsWith('https:')) continue;

    const pinnedMatch = /^([A-Za-z0-9_.\-]+)(?:\[[^\]]+\])?==([^#]+)$/.exec(line);
    if (!pinnedMatch) continue;
    const name = pinnedMatch[1];
    const version = pinnedMatch[2].trim();
    if (name && version) results.push({ name, version });
  }
  return results;
}

function parsePyprojectPinned(filePath) {
  // Minimal pinned parsing only: captures name==version from quoted dependency strings.
  // This avoids trying to fully evaluate poetry/pep621 constraints.
  const content = fs.readFileSync(filePath, 'utf-8');
  const results = [];

  const quoted = content.match(/"[^"\r\n]+"/g) || [];
  for (const q of quoted) {
    const s = q.slice(1, -1).trim();
    if (!s) continue;
    const pinnedMatch = /^([A-Za-z0-9_.\-]+)(?:\[[^\]]+\])?==([^#]+)$/.exec(s);
    if (!pinnedMatch) continue;
    const name = pinnedMatch[1];
    const version = pinnedMatch[2].trim();
    if (name && version) results.push({ name, version });
  }

  // Poetry dependency table style:
  // requests = "==2.31.0" or requests = "2.31.0" (treat as pinned only if it looks exact)
  const poetryDepLine = /^\s*([A-Za-z0-9_.\-]+)\s*=\s*"([^"]+)"\s*$/gm;
  let m;
  while ((m = poetryDepLine.exec(content)) !== null) {
    const name = m[1];
    const spec = String(m[2] || '').trim();
    if (!name || name === 'python') continue;
    const pm = /^==?\s*([^#]+)$/.exec(spec);
    if (pm) {
      const version = String(pm[1]).trim();
      if (version) results.push({ name, version });
    } else if (/^\d+\./.test(spec)) {
      results.push({ name, version: spec });
    }
  }

  return results;
}

function findGoModFiles(rootDir, maxDepth = 4) {
  const found = [];
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
        found.push(full);
      } else if (ent.isDirectory()) {
        if (ent.name === 'vendor' || ent.name === 'node_modules' || ent.name === '.git' || ent.name === '.svn' || ent.name === '.hg') continue;
        stack.push({ dir: full, depth: depth + 1 });
      }
    }
  }
  return found;
}

function parseGoModRequireLine(line) {
  const cleaned = line.split('//')[0].trim();
  if (!cleaned) return null;
  const parts = cleaned.split(/\s+/);
  if (parts.length < 2) return null;
  const [module, version] = parts;
  if (!module || !version) return null;
  if (!/^v\d+\./.test(version)) return null;
  return { module, version };
}

function parseGoModReplaceLine(line) {
  // Examples:
  // replace old/module v1.2.3 => new/module v1.2.4
  // replace old/module => ../local/path
  const cleaned = line.split('//')[0].trim();
  if (!cleaned) return null;
  const rest = cleaned.replace(/^replace\s+/, '').trim();
  const parts = rest.split(/\s+/);
  const arrowIdx = parts.indexOf('=>');
  if (arrowIdx === -1) return null;

  const left = parts.slice(0, arrowIdx);
  const right = parts.slice(arrowIdx + 1);
  if (left.length < 1 || right.length < 1) return null;

  const oldModule = left[0];
  const oldVersion = left.length >= 2 && /^v\d+\./.test(left[1]) ? left[1] : null;

  const newModule = right[0];
  const newVersion = right.length >= 2 && /^v\d+\./.test(right[1]) ? right[1] : null;

  // Ignore local filesystem replacements
  if (newModule.startsWith('.') || newModule.startsWith('/') || /^[A-Za-z]:\\/.test(newModule)) return null;

  return { oldModule, oldVersion, newModule, newVersion };
}

function parseGoModDeps(goModPath) {
  const content = fs.readFileSync(goModPath, 'utf-8');
  const lines = content.split(/\r?\n/);

  const requires = [];
  const replaceMap = new Map();

  let inRequireBlock = false;
  let inReplaceBlock = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('//')) continue;

    if (line.startsWith('require (')) {
      inRequireBlock = true;
      continue;
    }
    if (inRequireBlock && line === ')') {
      inRequireBlock = false;
      continue;
    }

    if (line.startsWith('replace (')) {
      inReplaceBlock = true;
      continue;
    }
    if (inReplaceBlock && line === ')') {
      inReplaceBlock = false;
      continue;
    }

    if (line.startsWith('require ')) {
      const dep = parseGoModRequireLine(line.replace(/^require\s+/, ''));
      if (dep) requires.push(dep);
      continue;
    }
    if (inRequireBlock) {
      const dep = parseGoModRequireLine(line);
      if (dep) requires.push(dep);
      continue;
    }

    if (line.startsWith('replace ')) {
      const rep = parseGoModReplaceLine(line);
      if (rep) replaceMap.set(`${rep.oldModule}@${rep.oldVersion || ''}`, rep);
      continue;
    }
    if (inReplaceBlock) {
      const rep = parseGoModReplaceLine(`replace ${line}`);
      if (rep) replaceMap.set(`${rep.oldModule}@${rep.oldVersion || ''}`, rep);
    }
  }

  const resolved = [];
  for (const r of requires) {
    const keyExact = `${r.module}@${r.version}`;
    const keyAny = `${r.module}@`;
    const rep = replaceMap.get(keyExact) || replaceMap.get(keyAny);
    if (rep && rep.newModule && rep.newVersion) {
      resolved.push({ name: rep.newModule, version: rep.newVersion });
    } else {
      resolved.push({ name: r.module, version: r.version });
    }
  }

  return resolved;
}

function findComposerJsonFiles(rootDir, maxDepth = 4) {
  const found = [];
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
      if (ent.isFile() && ent.name === 'composer.json') {
        if (!full.includes(`${path.sep}vendor${path.sep}`)) found.push(full);
      } else if (ent.isDirectory()) {
        if (ent.name === 'vendor' || ent.name === 'node_modules' || ent.name === '.git' || ent.name === '.svn' || ent.name === '.hg') continue;
        stack.push({ dir: full, depth: depth + 1 });
      }
    }
  }
  return found;
}

function readJsonSafe(p) {
  try {
    const content = fs.readFileSync(p, 'utf-8');
    return JSON.parse(content);
  } catch (_) {
    return null;
  }
}

function normalizeComposerVersion(v) {
  if (!v) return null;
  const raw = String(v).trim();
  if (!raw) return null;
  // Skip non-version branches like dev-master, dev-main, etc.
  if (/^dev-/i.test(raw) || /dev$/i.test(raw)) return null;
  const noPrefix = raw.startsWith('v') ? raw.slice(1) : raw;
  // Ensure it looks like a version OSV can match for Packagist.
  if (!/^\d+\.\d+/.test(noPrefix)) return null;
  return noPrefix;
}

async function resolveRangeToVersion(name, range) {
  if (!range) return null;
  try {
    const versions = await fetchRegistryVersions(name);
    if (!versions || versions.length === 0) return null;
    const v = semver.maxSatisfying(versions, range);
    return v || null;
  } catch (_) {
    return null;
  }
}

async function queryOSVBatch(requests) {
  // OSV batch: https://api.osv.dev/v1/querybatch
  try {
    const resp = await axios.post('https://api.osv.dev/v1/querybatch', { queries: requests }, {
      timeout: 20000,
      validateStatus: () => true,
      headers: { 'Content-Type': 'application/json' },
    });
    if (resp.status >= 400) return [];
    return resp.data?.results || [];
  } catch (_) {
    return [];
  }
}

function normalizeSeverity(vuln) {
  // Prefer numeric CVSS scores from severity array
  let level = 'UNKNOWN';
  const mapCvssToLevel = (score) => {
    if (score >= 9) return 'CRITICAL';
    if (score >= 7) return 'HIGH';
    if (score >= 4) return 'MEDIUM';
    if (score > 0) return 'LOW';
    return 'UNKNOWN';
  };

  const sevArr = vuln?.severity;
  if (Array.isArray(sevArr) && sevArr.length) {
    const sv = sevArr
      .filter((s) => s.type && String(s.type).toUpperCase().includes('CVSS'))
      .map((s) => parseFloat(s.score))
      .filter((n) => !Number.isNaN(n));
    if (sv.length) {
      const max = Math.max(...sv);
      level = mapCvssToLevel(max);
    }
  }

  // Fallback: database_specific.severity may carry HIGH/MODERATE/CRITICAL strings for GHSA
  if (level === 'UNKNOWN') {
    const dbSev = String(vuln?.database_specific?.severity || '').toUpperCase();
    if (dbSev) {
      if (dbSev.includes('CRITICAL')) level = 'CRITICAL';
      else if (dbSev.includes('HIGH')) level = 'HIGH';
      else if (dbSev.includes('MEDIUM') || dbSev.includes('MODERATE')) level = 'MEDIUM';
      else if (dbSev.includes('LOW')) level = 'LOW';
    }
  }

  // Fallback: affected[].ecosystem_specific.severity sometimes present as HIGH/MEDIUM/LOW
  if (level === 'UNKNOWN' && Array.isArray(vuln?.affected)) {
    for (const aff of vuln.affected) {
      const ecoSev = String(aff?.ecosystem_specific?.severity || '').toUpperCase();
      if (ecoSev) {
        if (ecoSev.includes('CRITICAL')) { level = 'CRITICAL'; break; }
        if (ecoSev.includes('HIGH'))     { level = 'HIGH'; break; }
        if (ecoSev.includes('MEDIUM') || ecoSev.includes('MODERATE')) { level = 'MEDIUM'; break; }
        if (ecoSev.includes('LOW'))      { level = 'LOW'; break; }
      }
    }
  }

  // Final fallback: if it has a CVE alias, mark at least LOW to count as present
  if (level === 'UNKNOWN' && Array.isArray(vuln?.aliases) && vuln.aliases.some((a) => /^CVE-/.test(a))) {
    level = 'LOW';
  }

  return level;
}

async function fetchVulnById(id) {
  try {
    const url = `https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`;
    const resp = await axios.get(url, { timeout: 15000, validateStatus: () => true });
    if (resp.status >= 400) return null;
    return resp.data || null;
  } catch (_) {
    return null;
  }
}

async function scanNodeCves(tempDir) {
  const pkgFiles = findPackageJsonFiles(tempDir);
  if (pkgFiles.length === 0) return { summary: { totalPackages: 0, affectedPackages: 0, totalVulns: 0, critical: 0, high: 0, medium: 0, low: 0 }, items: [] };

  const pkgVersionPairs = [];
  for (const pkgPath of pkgFiles) {
    try {
      const json = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const deps = json.dependencies || {};
      const devDeps = json.devDependencies || {};
      for (const [name, range] of [...Object.entries(deps), ...Object.entries(devDeps)]) {
        const version = await resolveRangeToVersion(name, range);
        if (version) pkgVersionPairs.push({ name, version });
      }
    } catch (_) {}
  }

  // Deduplicate name@version
  const unique = Object.values(pkgVersionPairs.reduce((acc, p) => {
    const key = `${p.name}@${p.version}`;
    if (!acc[key]) acc[key] = p;
    return acc;
  }, {}));

  // Build OSV queries in chunks
  const chunkSize = 100;
  let results = [];
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const queries = chunk.map((p) => ({
      package: { ecosystem: 'npm', name: p.name },
      version: p.version,
    }));
    const r = await queryOSVBatch(queries);
    results = results.concat(r.map((res, idx) => ({ pkg: chunk[idx], vulns: res?.vulns || [] })));
  }

  // Enrich UNKNOWN severities by fetching full OSV entries (cap to avoid too many requests)
  const unknownList = [];
  for (const r of results) {
    for (const v of r.vulns) {
      const sev = normalizeSeverity(v);
      if (sev === 'UNKNOWN') unknownList.push(v);
    }
  }
  const ENRICH_LIMIT = 80;
  for (let i = 0; i < Math.min(unknownList.length, ENRICH_LIMIT); i++) {
    const v = unknownList[i];
    const full = await fetchVulnById(v.id);
    if (full) {
      // merge important fields back
      v.severity = full.severity || v.severity;
      v.database_specific = full.database_specific || v.database_specific;
      v.affected = full.affected || v.affected;
      v.summary = full.summary || v.summary;
      v.details = full.details || v.details;
      v.aliases = full.aliases || v.aliases;
      v.references = full.references || v.references;
    }
  }

  const items = results
    .filter((r) => Array.isArray(r.vulns) && r.vulns.length)
    .map((r) => ({
      name: r.pkg.name,
      version: r.pkg.version,
      count: r.vulns.length,
      vulnerabilities: r.vulns.map((v) => ({
        id: v.id,
        summary: v.summary || v.details || '',
        severity: normalizeSeverity(v),
        aliases: v.aliases || [],
        references: v.references || [],
        affectedRanges: v.affected || [],
      })),
    }));

  const summary = { totalPackages: unique.length, affectedPackages: items.length, totalVulns: 0, critical: 0, high: 0, medium: 0, low: 0 };
  for (const it of items) {
    summary.totalVulns += it.count;
    for (const v of it.vulnerabilities) {
      const sev = v.severity;
      if (sev === 'CRITICAL') summary.critical++;
      else if (sev === 'HIGH') summary.high++;
      else if (sev === 'MEDIUM') summary.medium++;
      else if (sev === 'LOW') summary.low++;
    }
  }

  return { summary, items };
}

async function scanPythonCves(tempDir) {
  const { requirements, pyprojects } = findPythonManifests(tempDir);
  if (requirements.length === 0 && pyprojects.length === 0) {
    return { summary: { totalPackages: 0, affectedPackages: 0, totalVulns: 0, critical: 0, high: 0, medium: 0, low: 0 }, items: [] };
  }

  const pkgVersionPairs = [];
  for (const reqPath of requirements) {
    try {
      const deps = parseRequirementsPinned(reqPath);
      for (const d of deps) pkgVersionPairs.push(d);
    } catch (_) {}
  }
  for (const projPath of pyprojects) {
    try {
      const deps = parsePyprojectPinned(projPath);
      for (const d of deps) pkgVersionPairs.push(d);
    } catch (_) {}
  }

  const unique = Object.values(pkgVersionPairs.reduce((acc, p) => {
    const key = `${p.name}@${p.version}`;
    if (!acc[key]) acc[key] = p;
    return acc;
  }, {}));

  if (unique.length === 0) {
    return { summary: { totalPackages: 0, affectedPackages: 0, totalVulns: 0, critical: 0, high: 0, medium: 0, low: 0 }, items: [] };
  }

  const chunkSize = 100;
  let results = [];
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const queries = chunk.map((p) => ({
      package: { ecosystem: 'PyPI', name: p.name },
      version: p.version,
    }));
    const r = await queryOSVBatch(queries);
    results = results.concat(r.map((res, idx) => ({ pkg: chunk[idx], vulns: res?.vulns || [] })));
  }

  const unknownList = [];
  for (const r of results) {
    for (const v of r.vulns) {
      const sev = normalizeSeverity(v);
      if (sev === 'UNKNOWN') unknownList.push(v);
    }
  }
  const ENRICH_LIMIT = 80;
  for (let i = 0; i < Math.min(unknownList.length, ENRICH_LIMIT); i++) {
    const v = unknownList[i];
    const full = await fetchVulnById(v.id);
    if (full) {
      v.severity = full.severity || v.severity;
      v.database_specific = full.database_specific || v.database_specific;
      v.affected = full.affected || v.affected;
      v.summary = full.summary || v.summary;
      v.details = full.details || v.details;
      v.aliases = full.aliases || v.aliases;
      v.references = full.references || v.references;
    }
  }

  const items = results
    .filter((r) => Array.isArray(r.vulns) && r.vulns.length)
    .map((r) => ({
      name: r.pkg.name,
      version: r.pkg.version,
      count: r.vulns.length,
      ecosystem: 'PyPI',
      vulnerabilities: r.vulns.map((v) => ({
        id: v.id,
        summary: v.summary || v.details || '',
        severity: normalizeSeverity(v),
        aliases: v.aliases || [],
        references: v.references || [],
        affectedRanges: v.affected || [],
      })),
    }));

  const summary = { totalPackages: unique.length, affectedPackages: items.length, totalVulns: 0, critical: 0, high: 0, medium: 0, low: 0 };
  for (const it of items) {
    summary.totalVulns += it.count;
    for (const v of it.vulnerabilities) {
      const sev = v.severity;
      if (sev === 'CRITICAL') summary.critical++;
      else if (sev === 'HIGH') summary.high++;
      else if (sev === 'MEDIUM') summary.medium++;
      else if (sev === 'LOW') summary.low++;
    }
  }

  return { summary, items };
}

async function scanGoCves(tempDir) {
  const modFiles = findGoModFiles(tempDir);
  if (modFiles.length === 0) {
    return { summary: { totalPackages: 0, affectedPackages: 0, totalVulns: 0, critical: 0, high: 0, medium: 0, low: 0 }, items: [] };
  }

  const pkgVersionPairs = [];
  for (const modPath of modFiles) {
    try {
      const deps = parseGoModDeps(modPath);
      for (const d of deps) {
        if (d?.name && d?.version) pkgVersionPairs.push({ name: d.name, version: d.version });
      }
    } catch (_) {}
  }

  const unique = Object.values(pkgVersionPairs.reduce((acc, p) => {
    const key = `${p.name}@${p.version}`;
    if (!acc[key]) acc[key] = p;
    return acc;
  }, {}));

  if (unique.length === 0) {
    return { summary: { totalPackages: 0, affectedPackages: 0, totalVulns: 0, critical: 0, high: 0, medium: 0, low: 0 }, items: [] };
  }

  const chunkSize = 100;
  let results = [];
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const queries = chunk.map((p) => ({
      package: { ecosystem: 'Go', name: p.name },
      version: p.version,
    }));
    const r = await queryOSVBatch(queries);
    results = results.concat(r.map((res, idx) => ({ pkg: chunk[idx], vulns: res?.vulns || [] })));
  }

  const unknownList = [];
  for (const r of results) {
    for (const v of r.vulns) {
      const sev = normalizeSeverity(v);
      if (sev === 'UNKNOWN') unknownList.push(v);
    }
  }
  const ENRICH_LIMIT = 80;
  for (let i = 0; i < Math.min(unknownList.length, ENRICH_LIMIT); i++) {
    const v = unknownList[i];
    const full = await fetchVulnById(v.id);
    if (full) {
      v.severity = full.severity || v.severity;
      v.database_specific = full.database_specific || v.database_specific;
      v.affected = full.affected || v.affected;
      v.summary = full.summary || v.summary;
      v.details = full.details || v.details;
      v.aliases = full.aliases || v.aliases;
      v.references = full.references || v.references;
    }
  }

  const items = results
    .filter((r) => Array.isArray(r.vulns) && r.vulns.length)
    .map((r) => ({
      name: r.pkg.name,
      version: r.pkg.version,
      count: r.vulns.length,
      ecosystem: 'Go',
      vulnerabilities: r.vulns.map((v) => ({
        id: v.id,
        summary: v.summary || v.details || '',
        severity: normalizeSeverity(v),
        aliases: v.aliases || [],
        references: v.references || [],
        affectedRanges: v.affected || [],
      })),
    }));

  const summary = { totalPackages: unique.length, affectedPackages: items.length, totalVulns: 0, critical: 0, high: 0, medium: 0, low: 0 };
  for (const it of items) {
    summary.totalVulns += it.count;
    for (const v of it.vulnerabilities) {
      const sev = v.severity;
      if (sev === 'CRITICAL') summary.critical++;
      else if (sev === 'HIGH') summary.high++;
      else if (sev === 'MEDIUM') summary.medium++;
      else if (sev === 'LOW') summary.low++;
    }
  }

  return { summary, items };
}

async function scanPhpCves(tempDir) {
  const composerFiles = findComposerJsonFiles(tempDir);
  if (composerFiles.length === 0) {
    return { summary: { totalPackages: 0, affectedPackages: 0, totalVulns: 0, critical: 0, high: 0, medium: 0, low: 0 }, items: [] };
  }

  const pkgVersionPairs = [];
  for (const composerPath of composerFiles) {
    const composerDir = path.dirname(composerPath);
    const composerJson = readJsonSafe(composerPath);
    if (!composerJson) continue;

    const lockPath = path.join(composerDir, 'composer.lock');
    const lockJson = fs.existsSync(lockPath) ? readJsonSafe(lockPath) : null;
    if (!lockJson) continue;

    const locked = {};
    const allPackages = []
      .concat(Array.isArray(lockJson.packages) ? lockJson.packages : [])
      .concat(Array.isArray(lockJson['packages-dev']) ? lockJson['packages-dev'] : []);
    for (const pkg of allPackages) {
      const name = pkg?.name;
      const version = normalizeComposerVersion(pkg?.version);
      if (name && version) locked[name] = version;
    }

    const sections = [composerJson.require || {}, composerJson['require-dev'] || {}];
    for (const section of sections) {
      for (const name of Object.keys(section)) {
        if (name === 'php') continue;
        const version = locked[name];
        if (version) pkgVersionPairs.push({ name, version });
      }
    }
  }

  // Deduplicate name@version
  const unique = Object.values(pkgVersionPairs.reduce((acc, p) => {
    const key = `${p.name}@${p.version}`;
    if (!acc[key]) acc[key] = p;
    return acc;
  }, {}));

  if (unique.length === 0) {
    return { summary: { totalPackages: 0, affectedPackages: 0, totalVulns: 0, critical: 0, high: 0, medium: 0, low: 0 }, items: [] };
  }

  const chunkSize = 100;
  let results = [];
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const queries = chunk.map((p) => ({
      package: { ecosystem: 'Packagist', name: p.name },
      version: p.version,
    }));
    const r = await queryOSVBatch(queries);
    results = results.concat(r.map((res, idx) => ({ pkg: chunk[idx], vulns: res?.vulns || [] })));
  }

  // Enrich UNKNOWN severities by fetching full OSV entries (cap to avoid too many requests)
  const unknownList = [];
  for (const r of results) {
    for (const v of r.vulns) {
      const sev = normalizeSeverity(v);
      if (sev === 'UNKNOWN') unknownList.push(v);
    }
  }
  const ENRICH_LIMIT = 80;
  for (let i = 0; i < Math.min(unknownList.length, ENRICH_LIMIT); i++) {
    const v = unknownList[i];
    const full = await fetchVulnById(v.id);
    if (full) {
      v.severity = full.severity || v.severity;
      v.database_specific = full.database_specific || v.database_specific;
      v.affected = full.affected || v.affected;
      v.summary = full.summary || v.summary;
      v.details = full.details || v.details;
      v.aliases = full.aliases || v.aliases;
      v.references = full.references || v.references;
    }
  }

  const items = results
    .filter((r) => Array.isArray(r.vulns) && r.vulns.length)
    .map((r) => ({
      name: r.pkg.name,
      version: r.pkg.version,
      count: r.vulns.length,
      ecosystem: 'Packagist',
      vulnerabilities: r.vulns.map((v) => ({
        id: v.id,
        summary: v.summary || v.details || '',
        severity: normalizeSeverity(v),
        aliases: v.aliases || [],
        references: v.references || [],
        affectedRanges: v.affected || [],
      })),
    }));

  const summary = { totalPackages: unique.length, affectedPackages: items.length, totalVulns: 0, critical: 0, high: 0, medium: 0, low: 0 };
  for (const it of items) {
    summary.totalVulns += it.count;
    for (const v of it.vulnerabilities) {
      const sev = v.severity;
      if (sev === 'CRITICAL') summary.critical++;
      else if (sev === 'HIGH') summary.high++;
      else if (sev === 'MEDIUM') summary.medium++;
      else if (sev === 'LOW') summary.low++;
    }
  }

  return { summary, items };
}

function mergeCveReports(a, b) {
  const ra = a || { summary: { totalPackages: 0, affectedPackages: 0, totalVulns: 0, critical: 0, high: 0, medium: 0, low: 0 }, items: [] };
  const rb = b || { summary: { totalPackages: 0, affectedPackages: 0, totalVulns: 0, critical: 0, high: 0, medium: 0, low: 0 }, items: [] };

  const items = [...(ra.items || []), ...(rb.items || [])];
  const summary = {
    totalPackages: (ra.summary?.totalPackages || 0) + (rb.summary?.totalPackages || 0),
    affectedPackages: items.length,
    totalVulns: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const it of items) {
    const vulns = Array.isArray(it.vulnerabilities) ? it.vulnerabilities : [];
    summary.totalVulns += typeof it.count === 'number' ? it.count : vulns.length;
    for (const v of vulns) {
      const sev = v?.severity;
      if (sev === 'CRITICAL') summary.critical++;
      else if (sev === 'HIGH') summary.high++;
      else if (sev === 'MEDIUM') summary.medium++;
      else if (sev === 'LOW') summary.low++;
    }
  }

  return { summary, items };
}

module.exports = { scanNodeCves, scanPhpCves, scanGoCves, scanPythonCves, mergeCveReports };
