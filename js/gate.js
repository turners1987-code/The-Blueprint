/* ============================================================
   THE BLUEPRINT — Access gate (js/gate.js)
   ============================================================
   BETA-GRADE, CLIENT-SIDE. READ THIS BEFORE RELYING ON IT.

   This hides a page and shows a locked state. It does not protect
   anything. The page's HTML, CSS and JS are public files that
   anyone can request directly, and the license record lives in this
   browser's localStorage, where the user can set it by hand. It
   keeps honest readers on the path to pricing; it will not stop
   someone who looks. Real protection needs the server (Cloudflare
   Access or a Worker) and is an open decision in BLUEPRINT_DOC.

   VALIDATION. validateKey() checks a key against the Lemon Squeezy
   License API and stores { key, productId, status, validatedAt }.
   hasAccess() is synchronous: it trusts that record while it is
   younger than GRACE_MS. refreshIfStale() re-validates in the
   background once the record is older than REVALIDATE_AFTER_MS.

   HOW A PAGE OPTS IN
   - Put data-gate on the page's main container (the element that
     carries id="main-content"). css/main.css hides every [data-gate]
     element until this module marks it open, so gated content never
     flashes before the check runs.
   - data-gate="access": always needs a code. Used by the journal
     pages. data-gate-title / data-gate-blurb say what the page is.
   - data-gate="tier": a module page. The module is found from the
     file name, and it is locked only if its tier in data/modules.json
     is "paid". Free modules open straight away. Title and summary
     come from modules.json.
   - Load this file as a module script. scripts/check.mjs fails a
     module page whose tier is paid but which lacks data-gate.

   If this script fails to load, gated pages stay hidden. That is
   deliberate: the failure mode is a blank page, never an open one.
   ============================================================ */

import { LS_PRODUCT_IDS, LS_VALIDATE_URL, REVALIDATE_AFTER_MS, GRACE_MS } from './ls-config.js';

// The key unlock.js and this module share. One place so they cannot drift apart.
export const ACCESS_KEY = 'blueprint_access_code';

const VALID_STATUSES = ['active', 'inactive'];
const TIMEOUT_MS = 8000;

// The stored record, or null if absent, malformed, or storage is unavailable
// (private browsing, storage disabled). A pre-validation bare-string value
// does not parse as an object and counts as no record.
export function readRecord() {
  try {
    const rec = JSON.parse(localStorage.getItem(ACCESS_KEY) || 'null');
    return rec && typeof rec === 'object' && typeof rec.key === 'string' ? rec : null;
  } catch { return null; }
}

function writeRecord(rec) {
  try { localStorage.setItem(ACCESS_KEY, JSON.stringify(rec)); } catch { /* storage unavailable */ }
}

export function clearRecord() {
  try { localStorage.removeItem(ACCESS_KEY); } catch { /* nothing to clear */ }
}

export function hasAccess() {
  const rec = readRecord();
  return !!rec
    && VALID_STATUSES.includes(rec.status)
    && Date.now() - rec.validatedAt < GRACE_MS;
}

export async function validateKey(key) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let data;
  try {
    const res = await fetch(LS_VALIDATE_URL, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `license_key=${encodeURIComponent(key)}`,
      signal: ctrl.signal,
    });
    data = await res.json();
  } catch {
    return { ok: false, reason: 'offline' }; // network error, timeout, or non-JSON reply: storage untouched
  } finally {
    clearTimeout(timer);
  }

  const lk = data && data.license_key;
  if (data && data.valid === true && lk && LS_PRODUCT_IDS.includes(lk.product_id) && VALID_STATUSES.includes(lk.status)) {
    writeRecord({ key, productId: lk.product_id, status: lk.status, validatedAt: Date.now() });
    return { ok: true };
  }
  clearRecord();
  return { ok: false, reason: (data && data.error) || (lk && lk.status) || 'invalid' };
}

// Re-check a stored key in the background once it is older than
// REVALIDATE_AFTER_MS. The page has already opened or locked by then.
export async function refreshIfStale() {
  const rec = readRecord();
  if (rec && Date.now() - rec.validatedAt > REVALIDATE_AFTER_MS) await validateKey(rec.key);
}

const here = (rel) => new URL(rel, import.meta.url).href;

async function findModule() {
  const id = location.pathname.split('/').pop().replace(/\.html$/, '');
  try {
    const res = await fetch(here('../data/modules.json'));
    if (!res.ok) return null;
    return (await res.json()).find((m) => m.id === id) || null;
  } catch {
    return null;
  }
}

function lockedPanel(title, blurb) {
  const el = document.createElement('section');
  el.className = 'gate-locked';
  el.id = 'main-content';
  el.tabIndex = -1;
  const inner = document.createElement('div');
  inner.className = 'container';
  const make = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };
  const link = (href, cls, text) => {
    const a = make('a', cls, text);
    a.href = here(href);
    return a;
  };
  const actions = make('div', 'gate-locked-actions');
  actions.append(
    link('../pricing.html', 'btn btn--primary', 'See Full Access'),
    link('../unlock.html', 'btn btn--ghost', 'I have a code'),
  );
  inner.append(
    make('div', 'eyebrow', 'Full Access'),
    make('h1', '', title),
    make('p', 'lead mt-sm', blurb),
    make('p', 'gate-locked-note', 'This page needs Full Access. If you already have a code, enter it and come back.'),
    actions,
  );
  el.append(inner);
  return el;
}

function lock(gated, title, blurb) {
  gated.removeAttribute('id'); // the panel takes over as the skip-link target
  gated.dataset.gateState = 'locked';
  gated.after(lockedPanel(title, blurb));
}

async function decide() {
  const gated = document.querySelector('[data-gate]');
  if (!gated) return;

  if (gated.dataset.gate === 'tier') {
    const mod = await findModule();
    // A module we cannot find, or one that is free, is open. Only a
    // known paid module without a code is locked.
    if (mod && mod.tier === 'paid' && !hasAccess()) {
      lock(gated, mod.title, mod.summary || '');
      return;
    }
  } else if (!hasAccess()) {
    lock(gated, gated.dataset.gateTitle || document.title, gated.dataset.gateBlurb || '');
    return;
  }
  gated.dataset.gateState = 'open';
}

// Decide open or locked first, then refresh a stale record in the background.
// A stale-but-in-grace page is already open; if validation fails it locks next load.
decide().then(refreshIfStale);
