/* Email login with a 6-digit code. Kept apart from the routes so Node can test it
   with a fake fetch and a fake KV. Exports no handlers, so it adds no route.

   KV keys (all in the ENTITLEMENTS namespace):
     email:<email>      -> customer_id        (written by ls-webhook and the backfill route)
     otp:<email>        -> { h, attempts, exp }   h = SHA-256 of "<email>:<code>", TTL 10 minutes
     rl:email:<email>   -> { n, reset }       3 sends per 15 minutes
     rl:ip:<ip>         -> { n, reset }       10 sends per 15 minutes */

import { sha256Hex, secretsMatch } from './util.ts';
import { entitlementActive, readEntitlement, issueCookie, type GateEnv } from './gate.ts';
import { LS_PRODUCT_TIERS } from '../../js/ls-config.js';
import { tierForProduct } from '../../js/tiers.js';

export interface KvRw {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}
export interface LoginEnv extends Omit<GateEnv, 'ENTITLEMENTS'> { RESEND_API_KEY?: string; ENTITLEMENTS: KvRw; }
export interface LoginResult { status: number; body: Record<string, unknown>; cookie?: string; }

export const OTP_TTL_S = 600;
export const MAX_ATTEMPTS = 5;
export const WINDOW_S = 15 * 60;
export const EMAIL_SENDS = 3;
export const IP_SENDS = 10;
export const START_BODY = { ok: true, message: 'If that email has access, a code is on its way.' };
const FROM = 'The Blueprint <login@bptrade.co>';
const RESEND_URL = 'https://api.resend.com/emails';

export const normalizeEmail = (v: unknown): string => (typeof v === 'string' ? v.trim().toLowerCase() : '');
const validEmail = (e: string): boolean => e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Fixed-window counter in KV. Returns true when this hit is within the limit.
async function hit(kv: KvRw, key: string, limit: number, now: number): Promise<boolean> {
  let n = 0; let reset = now + WINDOW_S * 1000;
  try {
    const cur = JSON.parse((await kv.get(key)) ?? 'null');
    if (cur && cur.reset > now) { n = cur.n; reset = cur.reset; }
  } catch { /* start a new window */ }
  if (n >= limit) return false;
  await kv.put(key, JSON.stringify({ n: n + 1, reset }), { expirationTtl: Math.max(60, Math.ceil((reset - now) / 1000)) });
  return true;
}

function randomCode(): string {
  const buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= 4294000000); // no modulo bias
  return String(buf[0] % 1000000).padStart(6, '0');
}

// Customer record for an email, only when it holds a currently active entitlement with a known tier.
async function accountForEmail(kv: KvRw, email: string, now: number): Promise<{ cid: string; tier: string } | null> {
  const cid = await kv.get(`email:${email}`);
  if (!cid) return null;
  const record = await readEntitlement(kv, cid);
  if (!entitlementActive(record, now)) return null;
  const tier = tierForProduct(record?.product_id, LS_PRODUCT_TIERS);
  return tier ? { cid, tier } : null;
}

export async function startLogin(emailIn: unknown, ip: string, env: LoginEnv, fetchFn: typeof fetch = fetch, now = Date.now(), codeFn: () => string = randomCode): Promise<LoginResult> {
  if (!env.RESEND_API_KEY) return { status: 503, body: { ok: false, error: 'email_not_configured' } };
  const email = normalizeEmail(emailIn);
  const same = { status: 200, body: START_BODY };
  if (!validEmail(email)) return same;
  const kv = env.ENTITLEMENTS;
  try {
    // Count every request, known email or not, so limits and answers reveal nothing.
    const okEmail = await hit(kv, `rl:email:${email}`, EMAIL_SENDS, now);
    const okIp = await hit(kv, `rl:ip:${ip}`, IP_SENDS, now);
    if (!okEmail || !okIp) return same;
    if (!(await accountForEmail(kv, email, now))) return same;
    const code = codeFn();
    await kv.put(`otp:${email}`, JSON.stringify({ h: await sha256Hex(`${email}:${code}`), attempts: 0, exp: now + OTP_TTL_S * 1000 }), { expirationTtl: OTP_TTL_S });
    const res = await fetchFn(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: `Your Blueprint login code: ${code}`,
        text: `Your Blueprint login code is ${code}.\n\nIt expires in 10 minutes. If you did not ask for it, you can ignore this email.`,
        html: `<p>Your Blueprint login code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>It expires in 10 minutes. If you did not ask for it, you can ignore this email.</p>`,
      }),
    });
    if (!res.ok) await kv.delete(`otp:${email}`);
  } catch { /* same answer either way */ }
  return same;
}

export async function verifyLogin(emailIn: unknown, codeIn: unknown, env: LoginEnv, now = Date.now()): Promise<LoginResult> {
  if (!env.GATE_SECRET) return { status: 503, body: { ok: false, error: 'not_configured' } };
  const email = normalizeEmail(emailIn);
  const code = typeof codeIn === 'string' ? codeIn.trim() : '';
  const bad = { status: 403, body: { ok: false, error: 'invalid_code' } };
  if (!validEmail(email) || !/^\d{6}$/.test(code)) return bad;
  const kv = env.ENTITLEMENTS;
  try {
    const raw = await kv.get(`otp:${email}`);
    if (!raw) return bad;
    const otp = JSON.parse(raw);
    if (!(otp.exp > now) || otp.attempts >= MAX_ATTEMPTS) { await kv.delete(`otp:${email}`); return bad; }
    if (!(await secretsMatch(await sha256Hex(`${email}:${code}`), String(otp.h)))) {
      otp.attempts += 1;
      if (otp.attempts >= MAX_ATTEMPTS) await kv.delete(`otp:${email}`);
      else await kv.put(`otp:${email}`, JSON.stringify(otp), { expirationTtl: Math.max(60, Math.ceil((otp.exp - now) / 1000)) });
      return bad;
    }
    await kv.delete(`otp:${email}`);
    const acct = await accountForEmail(kv, email, now);
    if (!acct) return bad;
    return { status: 200, body: { ok: true, tier: acct.tier }, cookie: await issueCookie(acct.cid, acct.tier, env.GATE_SECRET, now) };
  } catch { return { status: 500, body: { ok: false, error: 'kv' } }; }
}

// ---- backfill: write the missing email:<email> indexes for existing customers --
export interface KvList extends KvRw {
  list(opts: { prefix: string; cursor?: string }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
}
export async function backfillEmails(kv: KvList): Promise<{ scanned: number; written: number }> {
  let scanned = 0; let written = 0; let cursor: string | undefined;
  for (;;) {
    const page = await kv.list({ prefix: 'cust:', cursor });
    for (const { name } of page.keys) {
      scanned++;
      const raw = await kv.get(name);
      let rec: any = null;
      try { rec = raw ? JSON.parse(raw) : null; } catch { /* skip */ }
      const email = normalizeEmail(rec?.user_email);
      if (!email.includes('@')) continue;
      const cid = name.slice('cust:'.length);
      if ((await kv.get(`email:${email}`)) === cid) continue;
      await kv.put(`email:${email}`, cid);
      written++;
    }
    if (page.list_complete) return { scanned, written };
    cursor = page.cursor;
  }
}
