/* ============================================================
   THE BLUEPRINT — Access Code Entry (js/unlock.js)
   Validates the Full Access code (js/gate.js) and keeps the result in
   this browser's localStorage. There is no account.
   ============================================================ */

import { readRecord, clearRecord, validateKey, fetchMe } from './gate.js';

// ── UI ──────────────────────────────────────────────────────
const entry = document.getElementById('unlock-entry');
const emailPanel = document.getElementById('unlock-email');
const done = document.getElementById('unlock-done');
if (entry && done && emailPanel) {
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

  // Email login shows first; the access-code form is one click away.
  let showCodeForm = false;
  const show = (unlocked, label = '') => {
    emailPanel.hidden = unlocked || showCodeForm;
    entry.hidden = unlocked || !showCodeForm;
    done.hidden = !unlocked;
    if (unlocked) {
      stored.textContent = label;
      back.href = returnTo();
    }
  };
  const openCodeForm = (open) => { showCodeForm = open; show(!done.hidden, stored.textContent); (open ? input : emailInput).focus(); };

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

  const emailInput = document.getElementById('login-email');
  const prefill = new URLSearchParams(location.search).get('key');
  if (prefill) { input.value = prefill.trim(); showCodeForm = true; }

  const existing = readRecord();
  show(!!existing, existing ? `Code ending ${existing.key.slice(-4)}` : '');
  if (!existing) fetchMe().then((me) => { if (me.signedIn) show(true, `Signed in as ${me.email}`); });
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
    show(true, `Code ending ${code.slice(-4)}`);
    if (sessionMsg && doneError) { doneError.textContent = sessionMsg; doneError.hidden = false; }
  });

  remove.addEventListener('click', () => {
    clearRecord();
    try { fetch('/api/logout', { method: 'POST' }).catch(() => {}); } catch { /* ignore */ }
    show(false);
    (showCodeForm ? input : emailInput).focus();
  });

  // ── Email login ───────────────────────────────────────────
  const emailForm = document.getElementById('email-form');
  const otpForm = document.getElementById('otp-form');
  const emailError = document.getElementById('email-error');
  const otpError = document.getElementById('otp-error');
  const otpSent = document.getElementById('otp-sent');
  const otpInput = document.getElementById('login-otp');
  const resend = document.getElementById('otp-resend');
  const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const note = (el, msg) => { el.textContent = msg; el.hidden = !msg; };
  let resendTimer = null;

  document.getElementById('show-code-form').addEventListener('click', (e) => { e.preventDefault(); openCodeForm(true); });
  document.getElementById('show-email-form').addEventListener('click', (e) => { e.preventDefault(); openCodeForm(false); });

  const startResendClock = () => {
    clearInterval(resendTimer);
    let left = 30;
    resend.disabled = true;
    resend.textContent = `Resend code (${left})`;
    resendTimer = setInterval(() => {
      left -= 1;
      if (left <= 0) { clearInterval(resendTimer); resend.disabled = false; resend.textContent = 'Resend code'; }
      else resend.textContent = `Resend code (${left})`;
    }, 1000);
  };

  // Returns true when a code was requested (or the server answered the same way for any email).
  const sendCode = async () => {
    const email = emailInput.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note(emailError, 'Enter the email you bought with.'); return false; }
    note(emailError, '');
    try {
      const res = await post('/api/login/start', { email });
      if (res.status === 503 || res.status === 404 || res.status === 405) {
        showCodeForm = true;
        show(false);
        note(error, 'Email login is being set up. Use your access code for now.');
        return false;
      }
      if (!res.ok) { note(emailError, 'Could not send a code. Try again in a minute.'); return false; }
    } catch { note(emailError, 'Could not reach the server. Check your connection and try again.'); return false; }
    otpSent.textContent = `If that email has access, a code is on its way to ${email}. It expires in 10 minutes.`;
    emailForm.hidden = true;
    otpForm.hidden = false;
    startResendClock();
    otpInput.focus();
    return true;
  };

  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('email-send');
    btn.disabled = true;
    await sendCode();
    btn.disabled = false;
  });
  resend.addEventListener('click', async () => { note(otpError, ''); if (await sendCode()) otpInput.value = ''; });
  document.getElementById('otp-change').addEventListener('click', () => {
    clearInterval(resendTimer);
    otpForm.hidden = true;
    emailForm.hidden = false;
    otpInput.value = '';
    note(otpError, '');
    emailInput.focus();
  });
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = otpInput.value.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(code)) return note(otpError, 'Enter the 6-digit code from the email.');
    const btn = document.getElementById('otp-submit');
    btn.disabled = true;
    try {
      const res = await post('/api/login/verify', { email: emailInput.value.trim(), code });
      if (res.ok) {
        const me = await fetchMe();
        clearInterval(resendTimer);
        note(otpError, '');
        show(true, me.signedIn ? `Signed in as ${me.email}` : 'Signed in');
      } else {
        note(otpError, 'That code did not work. Check it, or ask for a new one.');
      }
    } catch { note(otpError, 'Could not reach the server. Check your connection and try again.'); }
    btn.disabled = false;
  });
}
