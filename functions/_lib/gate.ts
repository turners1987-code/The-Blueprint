/* Server-side paid-content gate logic. Kept apart from the routes so Node can
   test it with a fake fetch and a fake KV. Exports no handlers, so it adds no route.

   Flow: POST /api/session validates a license key with the public License API,
   reads the customer's entitlement record in KV (written by ls-webhook), and sets
   a signed cookie. _middleware.ts checks that cookie on every paid path and
   re-reads the KV entitlement, so a lapsed subscription stops opening pages. */

import { timingSafeEqual, toHex } from './util.ts';
import { LS_PRODUCT_TIERS, LS_ACCEPT_TEST_KEYS, LS_VALIDATE_URL } from '../../js/ls-config.js';
import { tierForProduct, tierGrants } from '../../js/tiers.js';

export const COOKIE = 'bp_session';
export const SESSION_TTL_S = 24 * 60 * 60;
const ACTIVE_STATUSES = ['active', 'on_trial'];
const KEY_STATUSES = ['active', 'inactive'];
const encoder = new TextEncoder();

export interface KvRead { get(key: string): Promise<string | null>; }
export interface GateEnv { GATE_SECRET?: string; ENTITLEMENTS: KvRead; }
export interface Session { cid: string; tier: string; exp: number; }

// ---- which path needs which tier requirement ------------------------------
// need: 'journal' | 'modules' | 'keylevels' | null (public)
export function pathNeed(pathname: string, paidModuleIds: ReadonlySet<string>): string | null {
  const p = pathname.replace(/\/+$/, '').replace(/\.html$/, '').toLowerCase();
  if (p === '/journal' || p === '/journal-analysis' || p === '/plan-board') return 'journal';
  const mod = /^\/modules\/([^/]+)$/.exec(p);
  if (mod && paidModuleIds.has(mod[1])) return 'modules';
  if (/^\/downloads\/bpkeylevels[^/]*$/.test(p)) return 'keylevels';
  return null;
}

// ---- signed session cookie -------------------------------------------------
async function hmac(secret: string, text: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(text)));
}

export async function signSession(s: Session, secret: string): Promise<string> {
  const body = `${s.cid}.${s.tier}.${s.exp}`;
  return `${body}.${await hmac(secret, body)}`;
}

export async function verifySession(token: string | null | undefined, secret: string | undefined, now = Date.now()): Promise<Session | null> {
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 4) return null;
  const [cid, tier, expText, sig] = parts;
  const expected = await hmac(secret, `${cid}.${tier}.${expText}`);
  if (!timingSafeEqual(encoder.encode(expected), encoder.encode(sig))) return null;
  const exp = Number(expText);
  if (!Number.isFinite(exp) || exp <= now) return null;
  return { cid, tier, exp };
}

export function readCookie(header: string | null, name = COOKIE): string | null {
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

// ---- entitlement -----------------------------------------------------------
// Does this KV customer record currently allow access? Cancelled keeps access to the period end.
export function entitlementActive(record: any, now = Date.now()): boolean {
  if (!record || typeof record !== 'object') return false;
  if (ACTIVE_STATUSES.includes(record.status)) return true;
  if (record.status === 'cancelled' && record.ends_at) return Date.parse(record.ends_at) > now;
  return false;
}

async function readEntitlement(kv: KvRead, cid: string): Promise<any | null> {
  const raw = await kv.get(`cust:${cid}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// Used by the middleware: cookie valid, tier grants the need, entitlement still active.
export async function allowed(need: string, cookieHeader: string | null, env: GateEnv, now = Date.now()): Promise<boolean> {
  const s = await verifySession(readCookie(cookieHeader), env.GATE_SECRET, now);
  if (!s || !tierGrants(s.tier, need)) return false;
  try { return entitlementActive(await readEntitlement(env.ENTITLEMENTS, s.cid), now); } catch { return false; }
}

// ---- create a session from a license key -----------------------------------
export interface SessionResult { status: number; body: Record<string, unknown>; cookie?: string; }

export async function createSession(licenseKey: unknown, env: GateEnv, fetchFn: typeof fetch = fetch, now = Date.now()): Promise<SessionResult> {
  if (typeof licenseKey !== 'string' || !licenseKey.trim() || licenseKey.length > 200) {
    return { status: 400, body: { ok: false, error: 'license_key required' } };
  }
  if (!env.GATE_SECRET) return { status: 503, body: { ok: false, error: 'not_configured' } };

  let data: any;
  try {
    const res = await fetchFn(LS_VALIDATE_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ license_key: licenseKey.trim() }).toString(),
    });
    data = await res.json();
  } catch {
    return { status: 502, body: { ok: false, error: 'upstream' } };
  }
  const lk = data?.license_key;
  const tier = tierForProduct(data?.meta?.product_id, LS_PRODUCT_TIERS);
  const cid = data?.meta?.customer_id;
  const testBlocked = !LS_ACCEPT_TEST_KEYS && lk?.test_mode === true;
  if (!data?.valid || !lk || !KEY_STATUSES.includes(lk.status) || !tier || cid === undefined || cid === null || testBlocked) {
    return { status: 403, body: { ok: false, error: 'key_not_accepted' } };
  }
  let record: any;
  try { record = await readEntitlement(env.ENTITLEMENTS, String(cid)); } catch { return { status: 500, body: { ok: false, error: 'kv' } }; }
  if (!entitlementActive(record, now)) return { status: 403, body: { ok: false, error: 'no_active_entitlement' } };

  const exp = now + SESSION_TTL_S * 1000;
  const token = await signSession({ cid: String(cid), tier, exp }, env.GATE_SECRET);
  return {
    status: 200,
    body: { ok: true, tier },
    cookie: `${COOKIE}=${token}; Max-Age=${SESSION_TTL_S}; Path=/; Secure; HttpOnly; SameSite=Lax`,
  };
}

export const CLEAR_COOKIE = `${COOKIE}=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`;
