/* Entitlement lookup, for our own verification only.
   GET /api/entitlement?customer_id=<id> with header X-Admin-Token. */

import { secretsMatch } from '../_lib/util';

interface Env {
  ADMIN_TOKEN?: string;
  ENTITLEMENTS: KVNamespace;
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const token = request.headers.get('X-Admin-Token');
  if (!token || !env.ADMIN_TOKEN || !(await secretsMatch(token, env.ADMIN_TOKEN))) {
    return new Response(null, { status: 401 });
  }
  const customerId = new URL(request.url).searchParams.get('customer_id');
  if (!customerId) return new Response('customer_id required', { status: 400 });
  const record = await env.ENTITLEMENTS.get(`cust:${customerId}`);
  if (!record) return new Response(null, { status: 404 });
  return new Response(record, { headers: { 'Content-Type': 'application/json' } });
};
