/* ============================================================
   THE BLUEPRINT — Tier rules (js/tiers.js)
   Pure functions, no DOM, so scripts/test-tiers.mjs can run them.
   Tiers: journal, all, keylevels. The product-to-tier map lives
   in js/ls-config.js.
   ============================================================ */

import { LS_PRODUCT_TIERS } from './ls-config.js';

// Which needs each held tier opens. "all" opens everything.
const GRANTS = {
  all: ['journal', 'modules', 'keylevels'],
  journal: ['journal'],
  keylevels: ['keylevels'],
};

export function tierForProduct(productId, map = LS_PRODUCT_TIERS) {
  const t = map[String(productId)];
  return typeof t === 'string' && GRANTS[t] ? t : null;
}

// need: "journal" | "modules" | "keylevels". Does a held tier open it?
export function tierGrants(tier, need) {
  return !!tier && (GRANTS[tier] || []).includes(need);
}
