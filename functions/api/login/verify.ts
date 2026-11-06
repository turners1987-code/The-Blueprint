/* POST /api/login/verify { email, code } — checks the 6-digit code and sets the bp_session cookie. */

import { verifyLogin, type LoginEnv } from '../../_lib/login.ts';

const json = (status: number, body: unknown, extra: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra } });

export const onRequestPost = async ({ request, env }: { request: Request; env: LoginEnv }): Promise<Response> => {
  let payload: any;
  try { payload = await request.json(); } catch { return json(400, { ok: false, error: 'bad json' }); }
  const r = await verifyLogin(payload?.email, payload?.code, env);
  return json(r.status, r.body, r.cookie ? { 'Set-Cookie': r.cookie } : {});
};

export const onRequest = async (): Promise<Response> => new Response(null, { status: 405, headers: { Allow: 'POST' } });
