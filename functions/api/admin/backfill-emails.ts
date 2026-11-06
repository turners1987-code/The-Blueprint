/* POST /api/admin/backfill-emails with header Authorization: Bearer <ADMIN_TOKEN>.
   One-off: walks cust:* and writes the missing email:<email> -> customer_id indexes. */

import { secretsMatch } from '../../_lib/util.ts';
import { backfillEmails, type KvList } from '../../_lib/login.ts';

interface Env { ADMIN_TOKEN?: string; ENTITLEMENTS: KvList; }

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const m = /^Bearer (.+)$/.exec(request.headers.get('Authorization') ?? '');
  if (!m || !env.ADMIN_TOKEN || !(await secretsMatch(m[1], env.ADMIN_TOKEN))) return new Response(null, { status: 401 });
  try {
    return new Response(JSON.stringify({ ok: true, ...(await backfillEmails(env.ENTITLEMENTS)) }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch { return new Response(JSON.stringify({ ok: false, error: 'kv' }), { status: 500 }); }
};

export const onRequest = async (): Promise<Response> => new Response(null, { status: 405, headers: { Allow: 'POST' } });
