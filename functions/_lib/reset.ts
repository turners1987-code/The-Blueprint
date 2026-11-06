/* Reset-activations logic, kept apart from the route so Node can test it with
   a fake fetch and a fake KV. Exports no handlers, so it adds no route.

   Flow: validate the license key (public License API, no API key) to get its id,
   rate-limit one reset per key per 24 hours, list its activation instances with
   the secret LS_API_KEY, then deactivate each through the public License API. */

import { sha256Hex } from './util.ts';

export const LS_API = 'https://api.lemonsqueezy.com';
export const RESET_WINDOW_S = 24 * 60 * 60;
const KEY_STATUSES = ['active', 'inactive'];

export interface KvLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface ResetEnv {
  LS_API_KEY?: string;
  ENTITLEMENTS: KvLike;
}

export interface ResetResult {
  status: number;
  body: Record<string, unknown>;
  headers?: Record<string, string>;
}

type Fetch = typeof fetch;

const form = (fields: Record<string, string>): string =>
  new URLSearchParams(fields).toString();

export async function resetActivations(
  licenseKey: unknown,
  env: ResetEnv,
  fetchFn: Fetch = fetch,
): Promise<ResetResult> {
  if (typeof licenseKey !== 'string' || !licenseKey.trim() || licenseKey.length > 200) {
    return { status: 400, body: { ok: false, error: 'license_key required' } };
  }
  const key = licenseKey.trim();
  if (!env.LS_API_KEY) return { status: 503, body: { ok: false, error: 'not_configured' } };

  // 1. Who owns this key? The validate call needs no API key.
  let validated: any;
  try {
    const res = await fetchFn(`${LS_API}/v1/licenses/validate`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form({ license_key: key }),
    });
    validated = await res.json();
  } catch {
    return { status: 502, body: { ok: false, error: 'upstream' } };
  }
  const lk = validated?.license_key;
  if (!validated?.valid || !lk?.id || !KEY_STATUSES.includes(lk.status)) {
    return { status: 404, body: { ok: false, error: 'key_not_accepted' } };
  }

  // 2. One reset per key per 24 hours. The marker is written before the work so
  //    two quick requests cannot both pass, and removed if the work fails.
  const limitKey = `reset:${await sha256Hex(key)}`;
  try {
    const last = await env.ENTITLEMENTS.get(limitKey);
    if (last) {
      const wait = Math.max(60, RESET_WINDOW_S - Math.floor((Date.now() - Number(last)) / 1000));
      return {
        status: 429,
        body: { ok: false, error: 'rate_limited', retry_after_s: wait },
        headers: { 'Retry-After': String(wait) },
      };
    }
    await env.ENTITLEMENTS.put(limitKey, String(Date.now()), { expirationTtl: RESET_WINDOW_S });
  } catch {
    return { status: 500, body: { ok: false, error: 'kv' } };
  }
  const release = async () => { try { await env.ENTITLEMENTS.delete(limitKey); } catch { /* best effort */ } };

  // 3. List the key's activation instances (needs LS_API_KEY).
  let instanceIds: string[];
  try {
    const url = `${LS_API}/v1/license-key-instances?filter[license_key_id]=${encodeURIComponent(String(lk.id))}&page[size]=100`;
    const res = await fetchFn(url, {
      headers: { Accept: 'application/vnd.api+json', Authorization: `Bearer ${env.LS_API_KEY}` },
    });
    if (!res.ok) throw new Error(`list ${res.status}`);
    const data: any = await res.json();
    instanceIds = (Array.isArray(data?.data) ? data.data : []).map((d: any) => String(d.id));
  } catch {
    await release();
    return { status: 502, body: { ok: false, error: 'upstream' } };
  }

  // 4. Deactivate each through the public License API.
  let deactivated = 0;
  for (const id of instanceIds) {
    try {
      const res = await fetchFn(`${LS_API}/v1/licenses/deactivate`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form({ license_key: key, instance_id: id }),
      });
      const out: any = await res.json();
      if (out?.deactivated === true) deactivated++;
    } catch { /* counted below */ }
  }
  if (deactivated < instanceIds.length) {
    // Partial failure: free the limiter so the customer can retry.
    await release();
    return { status: 502, body: { ok: false, error: 'partial', deactivated, total: instanceIds.length } };
  }
  return { status: 200, body: { ok: true, deactivated } };
}
