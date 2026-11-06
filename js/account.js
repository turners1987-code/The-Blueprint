/* ============================================================
   THE BLUEPRINT — Account page (js/account.js)
   Resets the activations of a license key through
   POST /api/reset-activations. The key identifies the customer;
   there is no password. The key is sent once and not stored here.
   ============================================================ */

import { readRecord } from './gate.js';

const form = document.getElementById('reset-form');
if (form) {
  const input = document.getElementById('reset-code');
  const error = document.getElementById('reset-error');
  const okBox = document.getElementById('reset-ok');
  const stored = document.getElementById('reset-stored');
  const submit = document.getElementById('reset-submit');

  const MESSAGES = {
    key_not_accepted: 'That key was not accepted. Check it against your receipt and try again.',
    rate_limited: 'This key was already reset in the last 24 hours. Try again tomorrow, or contact support.',
    not_configured: 'Resets are not available yet. Contact support.',
    upstream: 'The license server did not answer. Try again in a few minutes.',
    partial: 'Some activations could not be reset. Try again, or contact support.',
  };

  const existing = readRecord();
  if (existing) {
    stored.textContent = `This browser holds a code ending ${existing.key.slice(-4)}. Paste the full key above to reset it.`;
    stored.hidden = false;
  }

  const fail = (message) => { error.textContent = message; error.hidden = false; okBox.hidden = true; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.hidden = true;
    okBox.hidden = true;
    const key = input.value.trim();
    if (!key) return fail('Enter your license key.');
    submit.disabled = true;
    try {
      const res = await fetch('/api/reset-activations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: key }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        input.value = '';
        okBox.textContent = data.deactivated
          ? `Done. ${data.deactivated} ${data.deactivated === 1 ? 'device was' : 'devices were'} signed out. Enter your code again on the devices you use.`
          : 'Done. No devices were active on this key.';
        okBox.hidden = false;
      } else {
        fail(MESSAGES[data.error] || 'The reset did not go through. Try again, or contact support.');
      }
    } catch {
      fail('Could not reach the server. Check your connection and try again.');
    } finally {
      submit.disabled = false;
    }
  });
}
