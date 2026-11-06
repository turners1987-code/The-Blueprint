/* ============================================================
   THE BLUEPRINT — Access Code Entry (js/unlock.js)
   Validates the Full Access code (js/gate.js) and keeps the result in
   this browser's localStorage. There is no account.
   ============================================================ */

import { readRecord, clearRecord, validateKey } from './gate.js';

// ── UI ──────────────────────────────────────────────────────
const entry = document.getElementById('unlock-entry');
const done = document.getElementById('unlock-done');
if (entry && done) {
  const form = document.getElementById('unlock-form');
  const input = document.getElementById('unlock-code');
  const error = document.getElementById('unlock-error');
  const stored = document.getElementById('unlock-stored');
  const remove = document.getElementById('unlock-remove');

  const back = document.getElementById('unlock-back');

  // Where "continue" goes: the ?next= path the server gate sent, else the page they came from
  // (same site only), else the journal.
  const returnTo = () => {
    const next = new URLSearchParams(location.search).get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) return new URL(next, location.origin).href;
    try {
      const ref = new URL(document.referrer);
      if (ref.origin === location.origin && ref.pathname !== location.pathname) return ref.href;
    } catch { /* no usable referrer */ }
    return new URL('journal.html', location.href).href;
  };

  const show = (unlocked, code = '') => {
    entry.hidden = unlocked;
    done.hidden = !unlocked;
    if (unlocked) {
      stored.textContent = `Code ending ${code.slice(-4)}`;
      back.href = returnTo();
    }
  };

  const fail = (message) => {
    error.textContent = message;
    error.hidden = false;
  };

  // Ask the server for the paid-content session cookie the gate checks.
  // Returns null when the server side accepted the key (or has no gate function, e.g. local preview),
  // else a message to show.
  const SERVER_MSG = {
    not_configured: 'Paid pages are not switched on yet on the server. Try again shortly.',
    key_not_accepted: 'The server did not accept this code for paid pages. Check it against your receipt.',
    no_active_entitlement: 'This code has no active membership on record. If you just bought, wait a minute and try again.',
  };
  const startSession = async (code) => {
    try {
      const res = await fetch('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ license_key: code }) });
      if (res.ok || res.status === 404 || res.status === 405) return null;
      let err = '';
      try { err = (await res.json()).error || ''; } catch { /* not json */ }
      return SERVER_MSG[err] || `The server could not open paid pages (${res.status}${err ? ', ' + err : ''}). Try again shortly.`;
    } catch { return null; }
  };
  const doneError = document.getElementById('unlock-done-error');
  let sessionMsg = null;

  const prefill = new URLSearchParams(location.search).get('key');
  if (prefill) input.value = prefill.trim();

  const existing = readRecord();
  show(!!existing, existing ? existing.key : '');
  // A code saved in this browser before the server gate existed has no session cookie yet:
  // Continue asks for one before leaving the page.
  back.addEventListener('click', async (e) => {
    const rec = readRecord();
    if (!rec) return;
    e.preventDefault();
    sessionMsg = await startSession(rec.key);
    if (sessionMsg) {
      if (doneError) { doneError.textContent = sessionMsg; doneError.hidden = false; }
      return;
    }
    location.href = back.href;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.hidden = true;
    const code = input.value.trim();
    if (!code) return fail('Enter the code from your receipt.');
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    const result = await validateKey(code);
    submit.disabled = false;
    if (result.reason === 'offline') return fail('Could not reach the license server. Check your connection and try again.');
    if (!result.ok) return fail('That code was not accepted. Check it against your receipt and try again.');
    input.value = '';
    sessionMsg = await startSession(code);
    show(true, code);
    if (sessionMsg && doneError) { doneError.textContent = sessionMsg; doneError.hidden = false; }
  });

  remove.addEventListener('click', () => {
    clearRecord();
    try { fetch('/api/session', { method: 'DELETE' }).catch(() => {}); } catch { /* ignore */ }
    show(false);
    input.focus();
  });
}
