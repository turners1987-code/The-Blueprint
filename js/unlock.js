/* ============================================================
   THE BLUEPRINT — Access Code Entry (js/unlock.js)
   Stores the Full Access code in this browser's localStorage.
   There is no account and no server: the code lives here only.
   ============================================================ */

const STORAGE_KEY = 'blueprint_access_code';

// ── Validation ──────────────────────────────────────────────
// PLACEHOLDER: accepts any non-empty code. Nothing is verified yet.
//
// TODO: replace the body with a Lemon Squeezy License API call:
//   POST https://api.lemonsqueezy.com/v1/licenses/validate
//   Content-Type: application/x-www-form-urlencoded
//   Accept: application/json
//   body: license_key=<code>   (add instance_id once activate is used)
// The response carries `valid` (boolean) and an `error` message.
// Activating first (POST /v1/licenses/activate, same body plus
// instance_name) is what limits how many browsers one code can use.
// These endpoints need no API key, so they can be called from here.
//
// Contract: resolve to { valid: true } or { valid: false, message }.
// Do not store the code unless valid is true.
async function validateCode(code) {
  return { valid: code.length > 0 };
}

// ── Storage ─────────────────────────────────────────────────
// localStorage can throw (private browsing, storage disabled).
function readCode() {
  try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
}
function writeCode(code) {
  try { localStorage.setItem(STORAGE_KEY, code); return true; } catch { return false; }
}
function clearCode() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* nothing to clear */ }
}

// ── UI ──────────────────────────────────────────────────────
const entry = document.getElementById('unlock-entry');
const done = document.getElementById('unlock-done');
if (entry && done) {
  const form = document.getElementById('unlock-form');
  const input = document.getElementById('unlock-code');
  const error = document.getElementById('unlock-error');
  const stored = document.getElementById('unlock-stored');
  const remove = document.getElementById('unlock-remove');

  const show = (unlocked, code = '') => {
    entry.hidden = unlocked;
    done.hidden = !unlocked;
    if (unlocked) stored.textContent = `Code ending ${code.slice(-4)}`;
  };

  const fail = (message) => {
    error.textContent = message;
    error.hidden = false;
  };

  const existing = readCode();
  show(!!existing, existing);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.hidden = true;
    const code = input.value.trim();
    if (!code) return fail('Enter the code from your receipt.');
    const result = await validateCode(code);
    if (!result.valid) return fail(result.message || 'That code was not accepted.');
    if (!writeCode(code)) return fail('This browser would not store the code. Check that site data is allowed, then try again.');
    input.value = '';
    show(true, code);
  });

  remove.addEventListener('click', () => {
    clearCode();
    show(false);
    input.focus();
  });
}
