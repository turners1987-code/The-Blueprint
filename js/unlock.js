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

  // Where "continue" goes: the page they came from, if it is on this site, else the journal.
  const returnTo = () => {
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

  const prefill = new URLSearchParams(location.search).get('key');
  if (prefill) input.value = prefill.trim();

  const existing = readRecord();
  show(!!existing, existing ? existing.key : '');

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
    show(true, code);
  });

  remove.addEventListener('click', () => {
    clearRecord();
    show(false);
    input.focus();
  });
}
