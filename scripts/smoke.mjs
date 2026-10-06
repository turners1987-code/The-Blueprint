#!/usr/bin/env node
/* ============================================================
   THE BLUEPRINT — browser smoke test (scripts/smoke.mjs)
   ============================================================
   Node only, no dependencies (needs Node 22+ for the built-in
   WebSocket; the CDP client is hand-rolled on top of it).

   Run:  npm run test:smoke

   Serves the repo over a local HTTP server, launches headless
   Chrome (Edge as fallback — both Chromium), loads every HTML page
   in the repo, and fails on any console error, uncaught exception
   or unhandled rejection.

   It also asserts, on every page, that the shared nav renders the
   same link set into the desktop bar and the mobile menu — they
   are one set in js/nav.js and must never drift apart.

   Gated pages (js/gate.js) need an access code. The main run seeds
   one into localStorage before each page loads and asserts every
   data-gate page opens. A separate case loads a gated page with NO
   code and asserts the locked state renders and the content stays
   hidden.

   Ignored, deliberately:
     - favicon.ico 404s (the site ships favicon.svg)
     - failed loads of cross-origin resources (the Google Fonts
       CDN in main.css) — an offline test machine is not a site bug

   Exit code 1 if any page reports a real error, 0 otherwise.
   ============================================================ */

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SETTLE_MS = 1200;   // after load: modules, the service worker, async renders
const PAGE_TIMEOUT_MS = 20000;
const LAUNCH_TIMEOUT_MS = 20000;

if (typeof WebSocket === 'undefined') {
  console.error('smoke: this Node has no built-in WebSocket client; use Node 22 or newer.');
  process.exit(1);
}

// ── Find a Chromium to drive ───────────────────────────────────
function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    ...(['win32'].includes(process.platform)
      ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        ]
      : process.platform === 'darwin'
        ? [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
          ]
        : [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            '/usr/bin/microsoft-edge',
          ]),
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    console.error('smoke: no Chrome/Edge/Chromium found. Set CHROME_PATH to a Chromium executable.');
    process.exit(1);
  }
  return found;
}

// ── Static server ──────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function walkHtml(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const server = createServer((req, res) => {
  const raw = (req.url || '/').split('?')[0];
  let clean;
  try { clean = decodeURIComponent(raw); } catch { clean = raw; }
  if (clean === '/') clean = '/index.html';
  const within = path.posix.normalize(clean.replace(/^\/+/, '')); // repo-relative, no leading slash
  const file = path.resolve(ROOT, within);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end('forbidden'); return; }
  try {
    const body = readFileSync(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(body);
  } catch {
    // Like Cloudflare Pages: a missing URL gets 404.html, with a 404 status.
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(readFileSync(path.join(ROOT, '404.html')));
  }
});
await new Promise((res) => server.listen(0, '127.0.0.1', res));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;
const PAGES = walkHtml(ROOT)
  .map((f) => path.relative(ROOT, f).split(path.sep).join('/'))
  .sort();

// Any non-empty code passes while validation is a placeholder (js/gate.js).
const SEED_CODE = 'smoke-test-code';
const SEED_SCRIPT = `try { localStorage.setItem('blueprint_access_code', ${JSON.stringify(SEED_CODE)}); } catch {}`;

// Missing URLs at several depths must still serve a styled 404 page.
const NOT_FOUND_PROBES = ['nope', 'modules/nope', 'modules/deep/nope'];

// Reads the rendered nav out of a page as comparable strings
// ("href label" per link). The CTA button lives inside the desktop
// list but in its own .nav-mobile-cta block on mobile, so it is
// compared separately and filtered out of the desktop list.
const NAV_PARITY = `(() => {
  const menu = (ul) => ul ? [...ul.querySelectorAll('a')]
    .filter((a) => !a.classList.contains('btn'))
    .map((a) => a.getAttribute('href') + ' ' + a.textContent.trim()) : null;
  const cta = (a) => a ? a.getAttribute('href') + ' ' + a.textContent.trim() : null;
  return {
    desktop: menu(document.querySelector('.nav-links')),
    mobile: menu(document.querySelector('.nav-mobile-links')),
    desktopCta: cta(document.querySelector('.nav-links a.btn')),
    mobileCta: cta(document.querySelector('.nav-mobile-cta a')),
  };
})()`;

// ── Minimal CDP client over WebSocket ──────────────────────────
function cdpConnect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const pending = new Map();
    const listeners = [];
    let seq = 0;
    const api = {
      send(method, params = {}) {
        return new Promise((res, rej) => {
          const id = ++seq;
          pending.set(id, { res, rej });
          ws.send(JSON.stringify({ id, method, params }));
        });
      },
      on(fn) { listeners.push(fn); },
      close() { try { ws.close(); } catch { /* already closed */ } },
    };
    ws.addEventListener('open', () => resolve(api));
    ws.addEventListener('error', () => reject(new Error(`CDP socket failed for ${url}`)));
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== undefined && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message || 'CDP error'));
        else res(msg.result);
      } else if (msg.method) {
        for (const fn of listeners) fn(msg);
      }
    });
  });
}

// ── Error bookkeeping ──────────────────────────────────────────
const sameOrigin = (url) => {
  try { return new URL(url, ORIGIN).origin === ORIGIN; } catch { return true; }
};

// The two deliberate ignores, and nothing else.
const ignored = (text, url) => {
  if (/favicon\.ico/i.test(`${url} ${text}`) && /(404|not found)/i.test(text)) return true;
  if (/failed to load resource/i.test(text) && !sameOrigin(url)) return true; // fonts CDN
  return false;
};

function collector() {
  const errors = [];
  const seen = new Set();
  const note = (rawText, url) => {
    const text = String(rawText).replace(/\s+/g, ' ').trim();
    if (!text || ignored(text, url)) return;
    const key = `${text} ${url}`;
    if (seen.has(key)) return;
    seen.add(key);
    errors.push({ text: text.slice(0, 200), url });
  };
  const listen = (api) => api.on((m) => {
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      const detail = d.exception && (d.exception.description || d.exception.value);
      note(`${d.text}${detail ? `: ${detail}` : ''}`, d.url || '');
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      const text = m.params.args.map((a) => (a.value !== undefined ? a.value : a.description) || '').join(' ');
      const frame = m.params.stackTrace && m.params.stackTrace.callFrames && m.params.stackTrace.callFrames[0];
      note(text, (frame && frame.url) || '');
    } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      note(m.params.entry.text, m.params.entry.url || '');
    }
  });
  return { errors, listen };
}

// ── Launch the browser ─────────────────────────────────────────
const browserPath = findBrowser();
const userDataDir = mkdtempSync(path.join(os.tmpdir(), 'blueprint-smoke-'));
const child = spawn(browserPath, [
  '--headless=new',
  '--remote-debugging-port=0',
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--disable-gpu',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

const devtoolsWs = await new Promise((resolve, reject) => {
  let buf = '';
  const timer = setTimeout(() => reject(new Error(`browser did not expose DevTools within ${LAUNCH_TIMEOUT_MS / 1000}s (${browserPath})`)), LAUNCH_TIMEOUT_MS);
  child.stderr.on('data', (d) => {
    buf += d;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) { clearTimeout(timer); resolve(m[1]); }
  });
  child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`browser exited during launch (code ${code})`)); });
});
const httpBase = devtoolsWs.replace(/^ws:/, 'http:').replace(/\/devtools\/browser\/.*$/, '');

async function newTab() {
  let res = await fetch(`${httpBase}/json/new?about%3Ablank`, { method: 'PUT' });
  if (!res.ok) res = await fetch(`${httpBase}/json/new?about%3Ablank`); // older builds accept GET only
  if (!res.ok) throw new Error(`/json/new failed: HTTP ${res.status}`);
  return res.json();
}
const closeTab = (id) => fetch(`${httpBase}/json/close/${id}`).catch(() => {});

const withTimeout = (p, ms, what) => Promise.race([
  p,
  new Promise((_, rej) => setTimeout(() => rej(new Error(`${what} timed out after ${ms / 1000}s`)), ms)),
]);
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ── Load every page ────────────────────────────────────────────
let failed = 0;
console.log(`smoke: ${PAGES.length} pages on ${ORIGIN} (${path.basename(browserPath)})`);
for (const page of [...PAGES, ...NOT_FOUND_PROBES]) {
  const probe = NOT_FOUND_PROBES.includes(page);
  const url = `${ORIGIN}/${page}`;
  let api = null;
  let tab = null;
  try {
    tab = await newTab();
    api = await withTimeout(cdpConnect(tab.webSocketDebuggerUrl), PAGE_TIMEOUT_MS, 'connecting to the tab');
    const { errors, listen } = collector();
    listen(api);
    await api.send('Runtime.enable');
    await api.send('Log.enable');
    await api.send('Page.enable');
    await api.send('Page.addScriptToEvaluateOnNewDocument', { source: SEED_SCRIPT });
    const loaded = new Promise((res) => api.on((m) => { if (m.method === 'Page.loadEventFired') res(); }));
    await api.send('Page.navigate', { url });
    await withTimeout(loaded, PAGE_TIMEOUT_MS, `loading ${page}`);
    await sleep(SETTLE_MS); // modules run after load; async renders finish here

    // The nav injects one link set into two places (desktop bar,
    // mobile menu). If they ever render differently, the shared nav
    // has drifted — fail the page.
    if (!probe) {
      const { result } = await api.send('Runtime.evaluate', { returnByValue: true, expression: NAV_PARITY });
      const v = result.value;
      if (!v || !v.desktop || !v.mobile) {
        errors.push({ text: 'nav was not injected (js/nav.js missing)', url: '' });
      } else if (JSON.stringify(v.desktop) !== JSON.stringify(v.mobile)) {
        errors.push({ text: `nav link parity broken — desktop [${v.desktop.join(' | ')}] vs mobile [${v.mobile.join(' | ')}]`, url: '' });
      } else if (JSON.stringify(v.desktopCta) !== JSON.stringify(v.mobileCta)) {
        errors.push({ text: `nav CTA parity broken — desktop "${v.desktopCta}" vs mobile "${v.mobileCta}"`, url: '' });
      }
    }
    // A gated page with a code must have opened, not stayed hidden.
    if (!probe) {
      const { result } = await api.send('Runtime.evaluate', { returnByValue: true, expression:
        `(() => { const g = document.querySelector('[data-gate]'); return g ? g.dataset.gateState : null; })()` });
      if (result.value !== null && result.value !== 'open') {
        errors.push({ text: `gated page did not open with a code stored (state: ${result.value})`, url: '' });
      }
    }
    if (probe) {
      // The 404 status on the document itself is expected; anything else is not.
      for (let i = errors.length - 1; i >= 0; i--) {
        if (errors[i].url === url && /404/.test(errors[i].text)) errors.splice(i, 1);
      }
      const { result } = await api.send('Runtime.evaluate', { returnByValue: true, expression:
        `({ bg: getComputedStyle(document.documentElement).backgroundColor,
            btn: getComputedStyle(document.querySelector('.btn--primary')).backgroundImage,
            nav: !!document.querySelector('.site-nav'),
            h1: document.querySelector('h1') && document.querySelector('h1').textContent })` });
      const v = result.value;
      if (v.bg !== 'rgb(7, 20, 38)') errors.push({ text: `404 page is unstyled (page background ${v.bg})`, url: '' });
      if (!v.btn || v.btn === 'none') errors.push({ text: '404 page: .btn--primary has no gradient (CSS missing)', url: '' });
      if (!v.nav) errors.push({ text: '404 page: nav was not injected (js/nav.js missing)', url: '' });
      if (v.h1 !== 'Page not found') errors.push({ text: `404 page: unexpected h1 ${v.h1}`, url: '' });
    }
    if (errors.length) {
      failed++;
      console.log(`✗ /${page}`);
      errors.slice(0, 5).forEach((e) => console.log(`    ${e.text}${e.url ? `  [${e.url.replace(ORIGIN, '')}]` : ''}`));
      if (errors.length > 5) console.log(`    … ${errors.length - 5} more`);
    } else {
      console.log(`✓ /${page}`);
    }
  } catch (e) {
    failed++;
    console.log(`✗ /${page}`);
    console.log(`    ${e && e.message ? e.message : e}`);
  } finally {
    if (api) api.close();
    if (tab) await closeTab(tab.id);
  }
}

// ── Gated page without a code: the locked state must render ──
// The journal pages, plus any module page that exists and is tier "paid"
// (none yet: this follows data/modules.json, not a list).
const GATED_NO_CODE = [
  'journal.html',
  'journal-analysis.html',
  ...JSON.parse(readFileSync(path.join(ROOT, 'data', 'modules.json'), 'utf8'))
    .filter((m) => m.tier === 'paid' && PAGES.includes(`modules/${m.id}.html`))
    .map((m) => `modules/${m.id}.html`),
];
for (const page of GATED_NO_CODE) {
  let api = null;
  let tab = null;
  const problems = [];
  try {
    tab = await newTab();
    api = await withTimeout(cdpConnect(tab.webSocketDebuggerUrl), PAGE_TIMEOUT_MS, 'connecting to the tab');
    const { errors, listen } = collector();
    listen(api);
    await api.send('Runtime.enable');
    await api.send('Log.enable');
    await api.send('Page.enable');
    const loaded = new Promise((res) => api.on((m) => { if (m.method === 'Page.loadEventFired') res(); }));
    // The profile is shared with the seeded run above: clear the stored code.
    await api.send('Storage.clearDataForOrigin', { origin: ORIGIN, storageTypes: 'local_storage' });
    await api.send('Page.navigate', { url: `${ORIGIN}/${page}` });
    await withTimeout(loaded, PAGE_TIMEOUT_MS, `loading ${page} without a code`);
    await sleep(SETTLE_MS);
    const { result } = await api.send('Runtime.evaluate', { returnByValue: true, expression:
      `(() => {
        const g = document.querySelector('[data-gate]');
        const p = document.querySelector('.gate-locked');
        const hrefs = p ? [...p.querySelectorAll('a')].map((a) => new URL(a.href).pathname) : [];
        return {
          state: g && g.dataset.gateState,
          hidden: g ? getComputedStyle(g).display === 'none' : null,
          panel: !!p,
          heading: p && p.querySelector('h1') && p.querySelector('h1').textContent,
          hrefs,
          nav: !!document.querySelector('.site-nav'),
          footer: !!document.querySelector('.site-footer'),
          form: !!document.querySelector('#trade-form') && getComputedStyle(document.querySelector('#trade-form')).display !== 'none' && !!document.querySelector('#trade-form').offsetParent,
        };
      })()` });
    const v = result.value;
    if (v.state !== 'locked') problems.push(`gate state is ${v.state}, expected locked`);
    if (!v.hidden) problems.push('gated content is not hidden');
    if (!v.panel || !v.heading) problems.push('locked state did not render');
    if (!v.hrefs.some((h) => h.endsWith('/pricing.html'))) problems.push('locked state has no link to pricing.html');
    if (!v.hrefs.some((h) => h.endsWith('/unlock.html'))) problems.push('locked state has no link to unlock.html');
    if (!v.nav || !v.footer) problems.push('nav or footer missing from the locked state');
    if (v.form) problems.push('journal form is visible while locked');
    errors.forEach((e) => problems.push(e.text));
  } catch (e) {
    problems.push(e && e.message ? e.message : String(e));
  } finally {
    if (api) api.close();
    if (tab) await closeTab(tab.id);
  }
  if (problems.length) {
    failed++;
    console.log(`✗ /${page} (no code: locked state)`);
    problems.slice(0, 5).forEach((p) => console.log(`    ${p}`));
  } else {
    console.log(`✓ /${page} (no code: locked state)`);
  }
}

// ── Shut down ──────────────────────────────────────────────────
child.kill();
await new Promise((res) => { child.on('exit', res); setTimeout(res, 3000); });
server.close();
for (const delay of [0, 500]) {
  await sleep(delay);
  try { rmSync(userDataDir, { recursive: true, force: true }); break; } catch { /* files still held */ }
}

console.log('─'.repeat(40));
const total = PAGES.length + NOT_FOUND_PROBES.length + GATED_NO_CODE.length;
console.log(`${total - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
