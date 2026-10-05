#!/usr/bin/env node
/* ============================================================
   THE BLUEPRINT — repo validation (scripts/check.mjs)
   ============================================================
   Node only. No dependencies, no build step.

   Run:  npm run check   (or: node scripts/check.mjs)
         node scripts/check.mjs --strict   (0-byte stubs are not
         skipped, so they can be audited deliberately)

   Checks, per HTML file in the repo:
     1. Every <link>, <script src>, <img src> and internal href
        resolves to a file on disk, with the correct relative
        depth for css/ and js/ (css/, js/ at root; ../css/,
        ../js/ inside modules/).
     2. Exactly one <h1>.
     3. Non-empty <title> and <meta name="description">.
     4. No <style> blocks (CSS lives in css/).
     5. Contains <div id="nav-root"></div> and loads js/nav.js.
     6. No banned phrases anywhere in the file (case-insensitive):
        wording that labels a person or the course — "complete
        beginner(s)", "for beginners", "beginner-friendly", "no
        experience required", "we assume you know nothing",
        "beginner/advanced" as a level label, "newbie". Plain
        descriptive uses of "advanced" pass.
     7. Every data-module-id matches an entry in
        data/modules.json (skipped while that file is absent).
     8. (repo-wide) Every css/*.css and js/*.js is referenced by
        at least one HTML file — unreferenced files are warnings.
     9. Any element inside a stat-block whose text has a percentage
        (number + %) must itself carry the sample size — n=… (or
        "n …"), or "sessions"/"trades" with a number — within its
        own subtree. Sibling elements don't count. No statistic
        publishes without its n.

   Exit code 1 on any error, 0 otherwise.
   ============================================================ */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STRICT = process.argv.includes('--strict');

// Check 6 matches phrasing that labels a person or the course.
// Plain descriptive uses (e.g. "an advanced chart type") pass.
const BANNED_PATTERNS = [
  { label: 'complete beginner(s)',       re: /complete beginners?\b/i },
  { label: 'for beginners',              re: /for beginners?\b/i },
  { label: 'beginner-friendly',          re: /beginner-friendly/i },
  { label: 'no experience required',     re: /no experience required/i },
  { label: 'we assume you know nothing', re: /we assume you know nothing/i },
  { label: 'beginner/advanced level label', re: /beginner\s*(?:\/|to|-|–)\s*advanced/i },
  { label: 'newbie',                     re: /\bnewbies?\b/i },
];

const MODULES_JSON = path.join(ROOT, 'data', 'modules.json');

// ── helpers ──────────────────────────────────────────────────
function walkHtml(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const relName = (file) => path.relative(ROOT, file).split(path.sep).join('/');

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return m ? m[1] : null;
};

const isExternalUrl = (u) => /^[a-z][a-z0-9+.-]*:/i.test(u) || u.startsWith('//');

// Resolve a relative URL against an HTML file. Returns null for
// pure anchors (#...), empty values and external URLs.
function resolveRef(htmlFile, url) {
  if (!url || isExternalUrl(url) || url.startsWith('#')) return null;
  let clean = url.split('#')[0].split('?')[0];
  try { clean = decodeURIComponent(clean); } catch { /* keep raw */ }
  if (!clean) return null;
  return path.resolve(path.dirname(htmlFile), clean);
}

const toRel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');

// Check 1 depth rule: css/js asset references must match the
// file's depth — css/ and js/ at root, ../css/ and ../js/ inside
// modules/. Returns an error message or null.
function depthError(htmlFile, rawRef, resolved) {
  const rel = toRel(resolved);
  if (!rel.startsWith('css/') && !rel.startsWith('js/')) return null;
  const relDir = path.dirname(toRel(htmlFile));
  const inFileModules = relDir === 'modules' || relDir.startsWith('modules/');
  if (inFileModules && !rawRef.startsWith('../css/') && !rawRef.startsWith('../js/')) {
    return `css/js reference "${rawRef}" must use ../css/ or ../js/ inside modules/`;
  }
  if (!inFileModules && rawRef.startsWith('../')) {
    return `css/js reference "${rawRef}" must not use ../ at the repo root`;
  }
  return null;
}

function moduleIdsFrom(data) {
  const list = Array.isArray(data) ? data : (Array.isArray(data?.modules) ? data.modules : []);
  return new Set(list.map(m => (typeof m === 'string' ? m : m?.id)));
}

const lineOf = (content, index) => content.slice(0, index).split('\n').length;

const VOID_TAGS = new Set(['br', 'img', 'hr', 'input', 'meta', 'link', 'source', 'wbr', 'area', 'base', 'col', 'embed', 'track']);

const hasSampleSize = (s) =>
  /\bn\s*=\s*\d/i.test(s) ||
  /\bn\s+\d/.test(s) ||
  /\d[\d,.]*\s*(?:sessions|trades)\b/i.test(s) ||
  /(?:sessions|trades)\s*[:=]?\s*\d/i.test(s);

// Walk one stat-block's inner HTML: every element whose own text
// shows a percentage must carry the sample size within itself
// (its text or a descendant's). A sibling element's n doesn't
// count — that is the point of the element-level rule.
function scanStatBlock(content, blockStart, blockEnd, openTag, errors) {
  const block = content.slice(blockStart, blockEnd);
  const stack = [{ tag: openTag, line: lineOf(content, blockStart), pct: false, n: false }];
  for (const tok of block.matchAll(/<\/?([a-z][a-z0-9]*)\b[^>]*>|[^<]+/gi)) {
    const s = tok[0];
    if (s[0] !== '<') {
      // text run — % marks the innermost element, n marks the
      // whole open chain (every ancestor contains it)
      if (!stack.length) continue;
      if (/\d\s*%/.test(s)) stack[stack.length - 1].pct = true;
      if (hasSampleSize(s)) stack.forEach(el => { el.n = true; });
    } else if (s[1] === '/') {
      closeStatEl(stack.pop(), errors);
    } else if (!VOID_TAGS.has(tok[1].toLowerCase()) && !s.endsWith('/>')) {
      stack.push({ tag: s, line: lineOf(content, blockStart + tok.index), pct: false, n: false });
    }
  }
  while (stack.length) closeStatEl(stack.pop(), errors); // unterminated leftovers
}

function closeStatEl(el, errors) {
  if (el && el.pct && !el.n) {
    errors.push(`E9: percentage without sample size (line ${el.line}): "${el.tag.slice(0, 70)}"`);
  }
}

// ── per-file checks ──────────────────────────────────────────
function checkHtml(htmlFile, moduleIds) {
  const errors = [];
  const warnings = [];
  const content = readFileSync(htmlFile, 'utf8');
  const fileLabel = relName(htmlFile);

  const referenced = []; // resolved absolute paths, for check 8

  const addRef = (rawUrl) => {
    const resolved = resolveRef(htmlFile, rawUrl);
    if (resolved) referenced.push(resolved);
    return resolved;
  };

  // ── Check 1: references resolve + depth ──
  const tags = [...content.matchAll(/<link\b[^>]*>|<script\b[^>]*>|<img\b[^>]*>|<a\b[^>]*>/gi)].map(m => m[0]);
  for (const tag of tags) {
    const kind = tag.slice(1, tag.search(/[\s>]/)).toLowerCase();
    const urlAttr = kind === 'link' || kind === 'a' ? 'href' : kind === 'script' ? 'src' : 'src';
    const raw = attr(tag, urlAttr);
    if (!raw) continue; // inline <script>, pure anchor <a>, etc.
    const resolved = addRef(raw);
    if (!resolved) continue;
    if (!existsSync(resolved)) {
      errors.push(`E1: ${kind} <${urlAttr}> does not resolve: "${raw}"`);
      continue;
    }
    const dErr = depthError(htmlFile, raw, resolved);
    if (dErr) errors.push(`E1: ${dErr}`);
  }

  // ── Check 2: exactly one <h1> ──
  const h1Count = (content.match(/<h1[\s>]/gi) || []).length;
  if (h1Count !== 1) errors.push(`E2: expected exactly 1 <h1>, found ${h1Count}`);

  // ── Check 3: non-empty <title> and meta description ──
  const title = content.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (!title || !title[1].trim()) errors.push('E3: missing or empty <title>');
  const metaDesc = [...content.matchAll(/<meta\b[^>]*>/gi)]
    .find(t => (attr(t[0], 'name') || '').toLowerCase() === 'description');
  if (!metaDesc || !(attr(metaDesc[0], 'content') || '').trim()) {
    errors.push('E3: missing or empty <meta name="description">');
  }

  // ── Check 4: no <style> blocks ──
  if (/<style[\s>]/i.test(content)) errors.push('E4: inline <style> block found — CSS lives in css/');

  // ── Check 5: nav-root placeholder + js/nav.js ──
  if (!/<div\b[^>]*id\s*=\s*["']nav-root["'][^>]*>\s*<\/div>/i.test(content)) {
    errors.push('E5: <div id="nav-root"></div> not found');
  }
  const loadsNav = referenced.some(ref => ref === path.join(ROOT, 'js', 'nav.js'));
  if (!loadsNav) errors.push('E5: js/nav.js is not loaded');

  // ── Check 6: banned phrases (person/course labels) ──
  for (const { label, re } of BANNED_PATTERNS) {
    const m = content.match(re);
    if (m) errors.push(`E6: banned phrase "${label}" (line ${lineOf(content, m.index)})`);
  }

  // ── Check 7: data-module-id values exist in data/modules.json ──
  if (moduleIds) {
    for (const m of content.matchAll(/data-module-id\s*=\s*["']([^"']+)["']/gi)) {
      if (!moduleIds.has(m[1])) errors.push(`E7: data-module-id "${m[1]}" has no entry in data/modules.json`);
    }
  }

  // ── Check 9: percentages in .stat-block need a sample size ──
  const statBlockOpen = /<([a-z][a-z0-9]*)\b[^>]*\bclass\s*=\s*["'][^"']*\bstat-block\b[^"']*["'][^>]*>/gi;
  for (const open of content.matchAll(statBlockOpen)) {
    // Find the end of this element, honouring nested same-name tags
    const tag = open[1].toLowerCase();
    const token = new RegExp(`</?${tag}\\b[^>]*>`, 'gi');
    token.lastIndex = open.index + open[0].length;
    let depth = 1;
    let end = content.length; // unterminated → check to EOF
    let t;
    while ((t = token.exec(content)) !== null) {
      if (t[0][1] === '/') { if (--depth === 0) { end = t.index; break; } }
      else if (!t[0].endsWith('/>')) depth++;
    }
    scanStatBlock(content, open.index, end, open[0], errors);
  }

  return { fileLabel, errors, warnings, referenced };
}

// ── main ─────────────────────────────────────────────────────
const htmlFiles = walkHtml(ROOT).sort();
if (htmlFiles.length === 0) {
  console.error('No HTML files found.');
  process.exit(1);
}

let moduleIds = null; // null → check 7 skipped
if (existsSync(MODULES_JSON)) {
  try {
    moduleIds = moduleIdsFrom(JSON.parse(readFileSync(MODULES_JSON, 'utf8')));
  } catch (e) {
    console.error(`data/modules.json exists but is not valid JSON: ${e.message}`);
    process.exit(1);
  }
}

const allRefs = new Set();
let totalErrors = 0;
let totalWarnings = 0;
const stubs = []; // 0-byte placeholders, skipped unless --strict

for (const file of htmlFiles) {
  if (!STRICT && statSync(file).size === 0) {
    stubs.push(file);
    continue;
  }
  const r = checkHtml(file, moduleIds);
  r.referenced.forEach(p => allRefs.add(p));
  totalErrors += r.errors.length;
  totalWarnings += r.warnings.length;

  const flag = r.errors.length ? '✗' : '✓';
  console.log(`${flag} ${r.fileLabel}`);
  r.errors.forEach(e => console.log(`    ${e}`));
  r.warnings.forEach(w => console.log(`    ${w}`));
}

// ── Stubs: 0-byte placeholders, reported but not checked ──
if (stubs.length) {
  console.log('────────────────────────────────────────');
  console.log(`STUB (0 bytes, skipped): ${stubs.length}`);
  stubs.forEach(f => console.log(`    ${relName(f)}`));
}

// ── Check 8 (repo-wide): unreferenced css/ and js/ files ──
for (const dir of ['css', 'js']) {
  const dirPath = path.join(ROOT, dir);
  if (!existsSync(dirPath)) continue;
  for (const f of readdirSync(dirPath)) {
    if (!/\.(css|js)$/.test(f)) continue;
    const abs = path.join(dirPath, f);
    if (!allRefs.has(abs)) {
      console.log(`⚠  ${toRel(abs)} — not referenced by any HTML file`);
      totalWarnings++;
    }
  }
}

console.log('────────────────────────────────────────');
console.log(`Files checked: ${htmlFiles.length - stubs.length}` +
  (stubs.length ? ` (${stubs.length} stubs skipped — run with --strict to audit them)` : (STRICT ? ' (--strict)' : '')));
console.log(`Errors:   ${totalErrors}`);
console.log(`Warnings: ${totalWarnings}`);
if (moduleIds === null) console.log('(check 7 skipped: data/modules.json not found)');

process.exit(totalErrors > 0 ? 1 : 0);
