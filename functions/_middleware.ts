/* Paid-content gate (Cloudflare Pages Function middleware). Runs before every request.
   Public paths pass straight through. Paid paths need a valid bp_session cookie
   (set by /api/session) whose tier grants the page and whose KV entitlement is active.
   Fails closed: if the module list cannot be read, paid-module paths are refused. */

import { accessFor, pathNeed, refreshedCookie, type GateEnv } from './_lib/gate.ts';

interface Env extends GateEnv { ASSETS: { fetch(req: Request | string | URL): Promise<Response> }; }

let paidCache: { ids: Set<string>; at: number } | null = null;
const PAID_TTL_MS = 5 * 60 * 1000;

async function paidModuleIds(env: Env, origin: string): Promise<Set<string> | null> {
  if (paidCache && Date.now() - paidCache.at < PAID_TTL_MS) return paidCache.ids;
  try {
    const res = await env.ASSETS.fetch(new URL('/data/modules.json', origin));
    if (!res.ok) return null;
    const list: any[] = await res.json();
    const ids = new Set(list.filter((m) => m.tier === 'paid').map((m) => String(m.id).toLowerCase()));
    paidCache = { ids, at: Date.now() };
    return ids;
  } catch { return null; }
}

export const onRequest = async ({ request, env, next }: { request: Request; env: Env; next: () => Promise<Response> }): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/') || url.pathname === '/data/modules.json') return next();

  const ids = await paidModuleIds(env, url.origin);
  if (!ids && /^\/modules\//i.test(url.pathname)) return new Response('Unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const need = pathNeed(url.pathname, ids ?? new Set());
  if (!need) return next();

  const session = await accessFor(need, request.headers.get('Cookie'), env);
  if (session) {
    const res = await next();
    const out = new Response(res.body, res);
    out.headers.set('Cache-Control', 'private, no-store');
    const fresh = await refreshedCookie(session, env.GATE_SECRET);
    if (fresh) out.headers.append('Set-Cookie', fresh);
    return out;
  }
  // Not entitled. Pages are sent to the unlock screen; other files get 403.
  const isPage = /(\.html)?$/.test(url.pathname) && !/\.[a-z0-9]+$/i.test(url.pathname.replace(/\.html$/i, ''));
  if (isPage) {
    return new Response(null, { status: 302, headers: { Location: `/unlock.html?next=${encodeURIComponent(url.pathname)}`, 'Cache-Control': 'no-store' } });
  }
  return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'no-store' } });
};
