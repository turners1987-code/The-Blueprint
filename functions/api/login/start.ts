/* POST /api/login/start { email } — sends a 6-digit login code by email (Resend).
   Always answers 200 with the same body, so it cannot be used to find out which emails are customers.
   Needs the Cloudflare secret RESEND_API_KEY; without it answers 503 email_not_configured. */

import { startLogin, type LoginEnv } from '../../_lib/login.ts';

const json = (status: number, body: unknown, extra: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra } });

export const onRequestPost = async ({ request, env }: { request: Request; env: LoginEnv }): Promise<Response> => {
  let payload: any;
  try { payload = await request.json(); } catch { return json(400, { ok: false, error: 'bad json' }); }
  const r = await startLogin(payload?.email, request.headers.get('CF-Connecting-IP') ?? 'unknown', env);
  return json(r.status, r.body);
};

export const onRequest = async (): Promise<Response> => new Response(null, { status: 405, headers: { Allow: 'POST' } });
