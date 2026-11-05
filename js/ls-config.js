/* ============================================================
   THE BLUEPRINT — Lemon Squeezy license settings (js/ls-config.js)
   Read by js/gate.js. The validate endpoint needs no API key.
   ============================================================

   GO-LIVE CHECKLIST
   1. Recreate the product in Lemon Squeezy live mode.
   2. Replace the LS_PRODUCT_* placeholders in LS_PRODUCT_TIERS with the live product ids.
   3. Set LS_CHECKOUT_URL to the live checkout link.
   4. Set LS_ACCEPT_TEST_KEYS = false.
   5. Register a live-mode webhook with the same URL and secret
      (functions/api/ls-webhook.ts).
   ============================================================ */

// Product-to-tier map. The one place that says which Lemon Squeezy product opens what.
// Tiers: "journal" (journal + Plan Board), "all" (everything), "keylevels" (BP Key Levels download only).
// The LS_PRODUCT_* ids below are placeholders: replace each with the real numeric product id
// once the products exist in Lemon Squeezy. Placeholder strings never match a real id.
export const LS_PRODUCT_JOURNAL = 'LS_PRODUCT_JOURNAL';
export const LS_PRODUCT_ALL_ACCESS = 'LS_PRODUCT_ALL_ACCESS';
export const LS_PRODUCT_KEY_LEVELS = 'LS_PRODUCT_KEY_LEVELS';
export const LS_PRODUCT_TIERS = {
  1472366: 'all', // test-mode product, treated as All Access until go-live
  [LS_PRODUCT_JOURNAL]: 'journal',
  [LS_PRODUCT_ALL_ACCESS]: 'all',
  [LS_PRODUCT_KEY_LEVELS]: 'keylevels',
};
// Accepted product IDs, derived from the map. Numeric keys are converted back to numbers.
export const LS_PRODUCT_IDS = Object.keys(LS_PRODUCT_TIERS).map((k) => (/^\d+$/.test(k) ? Number(k) : k));
export const LS_VALIDATE_URL = "https://api.lemonsqueezy.com/v1/licenses/validate";
// A stored key older than this is re-checked in the background.
export const REVALIDATE_AFTER_MS = 24 * 60 * 60 * 1000;
// A stored key not re-validated within this window stops granting access.
export const GRACE_MS = 7 * 24 * 60 * 60 * 1000;
// Live checkout link. Empty = the pricing button stays on its placeholder.
export const LS_CHECKOUT_URL = "";
// Test-mode keys pass while true. Set false at go-live.
export const LS_ACCEPT_TEST_KEYS = true;
