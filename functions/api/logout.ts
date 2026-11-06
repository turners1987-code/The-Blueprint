/* POST /api/logout — clears the bp_session cookie. */

import { CLEAR_COOKIE } from '../_lib/gate.ts';

export const onRequestPost = async (): Promise<Response> =>
  new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Set-Cookie': CLEAR_COOKIE } });

export const onRequest = async (): Promise<Response> => new Response(null, { status: 405, headers: { Allow: 'POST' } });
