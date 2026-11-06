/* Start or end a paid-content session (Cloudflare Pages Function).
   POST /api/session with JSON { "license_key": "..." } sets the signed bp_session cookie.
   DELETE /api/session clears it. Needs the Cloudflare secret GATE_SECRET
   (any long random string, set in the dashboard, never in the repo). */

import { createSession, CLEAR_COOKIE, type GateEnv } from '../_lib/gate.ts';

const json = (status: number, body: unknown, extra: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
  });

export const onRequestPost = async ({ request, env }: { request: Request; env: GateEnv }): Promise<Response> => {
  let payload: any;
  try { payload = await request.json(); } catch { return json(400, { ok: false, error: 'bad json' }); }
  const r = await createSession(payload?.license_key, env);
  return json(r.status, r.body, r.cookie ? { 'Set-Cookie': r.cookie } : {});
};

export const onRequestDelete = async (): Promise<Response> => json(200, { ok: true }, { 'Set-Cookie': CLEAR_COOKIE });

export const onRequest = async (): Promise<Response> =>
  new Response(null, { status: 405, headers: { Allow: 'POST, DELETE' } });
