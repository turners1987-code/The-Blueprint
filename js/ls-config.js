/* ============================================================
   THE BLUEPRINT — Lemon Squeezy license settings (js/ls-config.js)
   Read by js/gate.js. The validate endpoint needs no API key.
   ============================================================

   GO-LIVE CHECKLIST
   1. Recreate the product in Lemon Squeezy live mode.
   2. Append the live product ID to LS_PRODUCT_IDS.
   3. Set LS_CHECKOUT_URL to the live checkout link.
   4. Set LS_ACCEPT_TEST_KEYS = false.
   5. Register a live-mode webhook with the same URL and secret
      (functions/api/ls-webhook.ts).
   ============================================================ */

// Accepted product IDs. Test-mode product for now; the live ID is appended later.
export const LS_PRODUCT_IDS = [1472366];
export const LS_VALIDATE_URL = "https://api.lemonsqueezy.com/v1/licenses/validate";
// A stored key older than this is re-checked in the background.
export const REVALIDATE_AFTER_MS = 24 * 60 * 60 * 1000;
// A stored key not re-validated within this window stops granting access.
export const GRACE_MS = 7 * 24 * 60 * 60 * 1000;
// Live checkout link. Empty = the pricing button stays on its placeholder.
export const LS_CHECKOUT_URL = "";
// Test-mode keys pass while true. Set false at go-live.
export const LS_ACCEPT_TEST_KEYS = true;
