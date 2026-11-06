/* GET /api/me — who the bp_session cookie says you are: { signedIn, tier, email (masked) }. */

import { activeSession, maskEmail, type GateEnv } from '../_lib/gate.ts';

const json = (status: number, body: unknown, extra: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra } });

export const onRequestGet = async ({ request, env }: { request: Request; env: GateEnv }): Promise<Response> => {
  const a = await activeSession(request.headers.get('Cookie'), env);
  return a
    ? json(200, { signedIn: true, tier: a.session.tier, email: maskEmail(a.record?.user_email) })
    : json(200, { signedIn: false, tier: null, email: '' });
};

export const onRequest = async (): Promise<Response> => new Response(null, { status: 405, headers: { Allow: 'GET' } });
