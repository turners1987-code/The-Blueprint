/* ============================================================
   THE BLUEPRINT — Lemon Squeezy license settings (js/ls-config.js)
   Read by js/gate.js. The validate endpoint needs no API key.
   ============================================================ */

// Accepted product IDs. Test-mode product for now; the live ID is appended later.
export const LS_PRODUCT_IDS = [1472366];
export const LS_VALIDATE_URL = "https://api.lemonsqueezy.com/v1/licenses/validate";
// A stored key older than this is re-checked in the background.
export const REVALIDATE_AFTER_MS = 24 * 60 * 60 * 1000;
// A stored key not re-validated within this window stops granting access.
export const GRACE_MS = 7 * 24 * 60 * 60 * 1000;
