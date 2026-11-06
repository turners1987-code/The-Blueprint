/* Reset a license key's activations (Cloudflare Pages Function).
   POST /api/reset-activations with JSON { "license_key": "..." }.
   The customer is identified by the license key. One reset per key per 24 hours.
   Needs the Cloudflare secret LS_API_KEY (set in the dashboard, never in the repo). */

import { resetActivations, type KvLike } from '../_lib/reset.ts';

interface Env {
  LS_API_KEY?: string;
  ENTITLEMENTS: KVNamespace;
}

const json = (status: number, body: unknown, extra: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
  });

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'bad json' });
  }
  const kv: KvLike = {
    get: (k) => env.ENTITLEMENTS.get(k),
    put: (k, v, o) => env.ENTITLEMENTS.put(k, v, o),
    delete: (k) => env.ENTITLEMENTS.delete(k),
  };
  const result = await resetActivations(payload?.license_key, { LS_API_KEY: env.LS_API_KEY, ENTITLEMENTS: kv });
  return json(result.status, result.body, result.headers);
};

export const onRequest = async (): Promise<Response> =>
  new Response(null, { status: 405, headers: { Allow: 'POST' } });
