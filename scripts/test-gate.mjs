#!/usr/bin/env node
/* Tests for functions/_lib/gate.ts and the middleware, with a fake fetch and fake KV. Run: npm run test:gate */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathNeed, signSession, verifySession, readCookie, entitlementActive, allowed, createSession } from '../functions/_lib/gate.ts';
import { onRequest } from '../functions/_middleware.ts';
import { SESSION_TTL_S, activeSession, maskEmail, refreshedCookie } from '../functions/_lib/gate.ts';
import { startLogin, verifyLogin, backfillEmails, START_BODY } from '../functions/_lib/login.ts';
import { onRequestPost as startRoute } from '../functions/api/login/start.ts';
import { onRequestGet as meRoute } from '../functions/api/me.ts';
import { onRequestPost as logoutRoute } from '../functions/api/logout.ts';
import { onRequestPost as backfillRoute } from '../functions/api/admin/backfill-emails.ts';

const SECRET = 'test-secret';
const NOW = Date.parse('2026-11-06T12:00:00Z');
const kv = (rec = {}) => ({ get: async (k) => (k in rec ? JSON.stringify(rec[k]) : null) });
const ls = (o) => async () => ({ ok: true, json: async () => o });
const valid = (product_id, customer_id = 5, extra = {}) => ls({ valid: true, license_key: { status: 'active', test_mode: false, ...extra }, meta: { product_id, customer_id } });

// ---- path rules: every page with data-gate and every paid module is covered
const modules = JSON.parse(readFileSync(new URL('../data/modules.json', import.meta.url)));
const paid = new Set(modules.filter((m) => m.tier === 'paid').map((m) => m.id));
assert.ok(paid.size > 0);
for (const id of paid) assert.equal(pathNeed(`/modules/${id}.html`, paid), 'modules', id);
for (const m of modules.filter((m) => m.tier !== 'paid')) assert.equal(pathNeed(`/modules/${m.id}.html`, paid), null, m.id);
for (const p of ['/journal.html', '/journal-analysis.html', '/plan-board.html', '/journal', '/Plan-Board.html']) assert.equal(pathNeed(p, paid), 'journal', p);
assert.equal(pathNeed('/downloads/BPKeyLevels_v1.zip', paid), 'keylevels');
assert.equal(pathNeed('/downloads/BPTradeReview_v1.0.1.zip', paid), null);
for (const p of ['/', '/index.html', '/pricing.html', '/unlock.html', '/modules/dial-in.html', '/guides/bp-key-levels.html']) assert.equal(pathNeed(p, paid), null, p);

// ---- cookie signing
{
  const t = await signSession({ cid: '5', tier: 'all', exp: NOW + 1000 }, SECRET);
  assert.deepEqual(await verifySession(t, SECRET, NOW), { cid: '5', tier: 'all', exp: NOW + 1000 });
  assert.equal(await verifySession(t, 'other', NOW), null);
  assert.equal(await verifySession(t, SECRET, NOW + 2000), null);
  assert.equal(await verifySession(t.replace('.all.', '.journal.'), SECRET, NOW), null);
  assert.equal(await verifySession(t.replace(/^5/, '6'), SECRET, NOW), null);
  assert.equal(await verifySession('garbage', SECRET, NOW), null);
  assert.equal(await verifySession(t, undefined, NOW), null);
  assert.equal(readCookie('a=1; bp_session=xyz; b=2'), 'xyz');
  assert.equal(readCookie(null), null);
}

// ---- entitlement rules
assert.ok(entitlementActive({ status: 'active' }, NOW));
assert.ok(entitlementActive({ status: 'on_trial' }, NOW));
assert.ok(entitlementActive({ status: 'cancelled', ends_at: '2026-12-01T00:00:00Z' }, NOW));
assert.ok(!entitlementActive({ status: 'cancelled', ends_at: '2026-11-01T00:00:00Z' }, NOW));
for (const s of ['expired', 'past_due', 'unpaid', 'paused', undefined]) assert.ok(!entitlementActive({ status: s }, NOW), String(s));
assert.ok(!entitlementActive(null, NOW));

// ---- createSession
const active = { 'cust:5': { status: 'active' } };
{
  const r = await createSession('KEY', { GATE_SECRET: SECRET, ENTITLEMENTS: kv(active) }, valid(1472366), NOW);
  assert.deepEqual([r.status, r.body.tier], [200, 'all']);
  assert.match(r.cookie, /HttpOnly/); assert.match(r.cookie, /Secure/); assert.match(r.cookie, /SameSite=Lax/);
  assert.ok(!r.cookie.includes('KEY'));
  // the cookie it issues opens an all-access page, and stops once the entitlement lapses
  const header = r.cookie.split(';')[0];
  assert.ok(await allowed('modules', header, { GATE_SECRET: SECRET, ENTITLEMENTS: kv(active) }, NOW));
  assert.ok(await allowed('keylevels', header, { GATE_SECRET: SECRET, ENTITLEMENTS: kv(active) }, NOW));
  assert.ok(!await allowed('modules', header, { GATE_SECRET: SECRET, ENTITLEMENTS: kv({ 'cust:5': { status: 'expired' } }) }, NOW));
  assert.ok(!await allowed('modules', header, { GATE_SECRET: SECRET, ENTITLEMENTS: kv({}) }, NOW));
  assert.ok(!await allowed('modules', null, { GATE_SECRET: SECRET, ENTITLEMENTS: kv(active) }, NOW));
}
// tiers: Journal opens journal only; Key Levels opens its download only
{
  const env0 = { GATE_SECRET: SECRET, ENTITLEMENTS: kv(active) };
  const j = await createSession('K', env0, valid('LS_PRODUCT_JOURNAL'), NOW);
  assert.deepEqual([j.status, j.body.tier], [200, 'journal']); // placeholder id stands in for the real one
  const jh = j.cookie.split(';')[0];
  assert.ok(await allowed('journal', jh, env0, NOW));
  assert.ok(!await allowed('modules', jh, env0, NOW));
  assert.ok(!await allowed('keylevels', jh, env0, NOW));
  const k = await createSession('K', env0, valid('LS_PRODUCT_KEY_LEVELS'), NOW);
  const kh = k.cookie.split(';')[0];
  assert.ok(await allowed('keylevels', kh, env0, NOW));
  assert.ok(!await allowed('journal', kh, env0, NOW));
  assert.ok(!await allowed('modules', kh, env0, NOW));
}
// bad input and refusals
const env = { GATE_SECRET: SECRET, ENTITLEMENTS: kv(active) };
assert.equal((await createSession('', env, valid(1472366), NOW)).status, 400);
assert.equal((await createSession('K', { ENTITLEMENTS: kv(active) }, valid(1472366), NOW)).status, 503);
assert.equal((await createSession('K', env, ls({ valid: false }), NOW)).status, 403);
assert.equal((await createSession('K', env, valid(999), NOW)).status, 403);
assert.equal((await createSession('K', env, valid(1472366, 77), NOW)).status, 403); // no entitlement record
assert.equal((await createSession('K', env, async () => { throw new Error('net'); }, NOW)).status, 502);
assert.equal((await createSession('K', { GATE_SECRET: SECRET, ENTITLEMENTS: kv({ 'cust:5': { status: 'expired' } }) }, valid(1472366), NOW)).status, 403);

// ---- middleware
const assets = (list = modules) => ({ fetch: async () => new Response(JSON.stringify(list)) });
const call = (path, cookie, mEnv = {}) => onRequest({
  request: new Request('https://bptrade.co' + path, { headers: cookie ? { Cookie: cookie } : {} }),
  env: { GATE_SECRET: SECRET, ENTITLEMENTS: kv(active), ASSETS: assets(), ...mEnv },
  next: async () => new Response('page'),
});
const paidId = [...paid][0];
{
  const open = await call('/pricing.html'); assert.equal(open.status, 200);
  assert.equal((await call('/api/session')).status, 200); // api routes are not gated here
  const locked = await call(`/modules/${paidId}.html`); assert.equal(locked.status, 302);
  assert.match(locked.headers.get('Location'), /^\/unlock\.html\?next=/);
  assert.equal((await call('/downloads/BPKeyLevels_v1.zip')).status, 403);
  const t = await signSession({ cid: '5', tier: 'all', exp: NOW + 3600e3 }, SECRET);
  // the cookie's own expiry is judged against the real clock, so sign one far in the future
  const far = await signSession({ cid: '5', tier: 'all', exp: Date.now() + 3600e3 }, SECRET);
  const ok = await call(`/modules/${paidId}.html`, `bp_session=${far}`);
  assert.equal(ok.status, 200); assert.equal(ok.headers.get('Cache-Control'), 'private, no-store');
  const jt = await signSession({ cid: '5', tier: 'journal', exp: Date.now() + 3600e3 }, SECRET);
  assert.equal((await call('/plan-board.html', `bp_session=${jt}`)).status, 200);
  assert.equal((await call(`/modules/${paidId}.html`, `bp_session=${jt}`)).status, 302);
  assert.equal((await call(`/modules/${paidId}.html`, `bp_session=${t}x`)).status, 302);
  // fail closed when the module list cannot be read (fresh isolate state aside, a module path is refused or still gated)
  const bad = await call(`/modules/${paidId}.html`, null, { ASSETS: { fetch: async () => { throw new Error('x'); } } });
  assert.notEqual(bad.status, 200);
}

// ---- sliding 90-day sessions
assert.equal(SESSION_TTL_S, 90 * 24 * 3600);
{
  const fresh = { cid: '5', tier: 'all', exp: Date.now() + SESSION_TTL_S * 1000 };
  assert.equal(await refreshedCookie(fresh, SECRET), null); // under a day old: no reissue
  const old = { cid: '5', tier: 'all', exp: Date.now() + (SESSION_TTL_S - 2 * 86400) * 1000 };
  const c = await refreshedCookie(old, SECRET);
  assert.match(c, new RegExp(`Max-Age=${SESSION_TTL_S}`));
  const tok = await signSession(old, SECRET);
  const res = await call(`/modules/${paidId}.html`, `bp_session=${tok}`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Set-Cookie'), /^bp_session=/); // middleware slid the session
  const young = await signSession(fresh, SECRET);
  assert.equal((await call(`/modules/${paidId}.html`, `bp_session=${young}`)).headers.get('Set-Cookie'), null);
}

// ---- email login (fake Resend, fake KV with put/delete/list)
const mem = (seed = {}) => {
  const m = new Map(Object.entries(seed).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]));
  return {
    m,
    get: async (k) => m.get(k) ?? null,
    put: async (k, v) => { m.set(k, v); },
    delete: async (k) => { m.delete(k); },
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }),
  };
};
const mailer = () => { const sent = []; const f = async (url, init) => { sent.push({ url, ...init, json: JSON.parse(init.body) }); return { ok: true }; }; f.sent = sent; return f; };
const base = () => ({ 'cust:5': { status: 'active', product_id: 1472366, user_email: 'Sam@Gmail.com' }, 'email:sam@gmail.com': '5' });
const L = (store) => ({ GATE_SECRET: SECRET, RESEND_API_KEY: 'rk', ENTITLEMENTS: store });
{
  // same answer for known and unknown emails; mail only for the known one
  const store = mem(base()); const f = mailer();
  const a = await startLogin('  SAM@gmail.com ', '1.1.1.1', L(store), f, NOW, () => '123456');
  const b = await startLogin('nobody@example.com', '1.1.1.1', L(store), f, NOW, () => '654321');
  assert.deepEqual(a, b); assert.equal(a.status, 200); assert.deepEqual(a.body, START_BODY);
  assert.equal(f.sent.length, 1);
  assert.equal(f.sent[0].url, 'https://api.resend.com/emails');
  assert.equal(f.sent[0].headers.Authorization, 'Bearer rk');
  assert.equal(f.sent[0].json.from, 'The Blueprint <login@bptrade.co>');
  assert.equal(f.sent[0].json.subject, 'Your Blueprint login code: 123456');
  assert.ok(f.sent[0].json.text && f.sent[0].json.html);
  assert.ok(!/<img|href=/i.test(f.sent[0].json.html)); // no tracking pixels, no links
  assert.ok(!store.m.get('otp:sam@gmail.com').includes('123456')); // only the hash is stored
  assert.ok(!store.m.has('otp:nobody@example.com'));

  // verify issues a cookie that opens paid pages; the code is single-use
  const v = await verifyLogin('sam@gmail.com', '123456', L(store), NOW);
  assert.deepEqual([v.status, v.body.tier], [200, 'all']);
  assert.match(v.cookie, /^bp_session=.*HttpOnly/); assert.match(v.cookie, new RegExp(`Max-Age=${SESSION_TTL_S}`));
  const hdr = v.cookie.split(';')[0];
  assert.ok(await allowed('modules', hdr, { GATE_SECRET: SECRET, ENTITLEMENTS: store }, NOW));
  assert.equal((await verifyLogin('sam@gmail.com', '123456', L(store), NOW)).status, 403);

  // /api/me gives the masked email and tier; a cancelled entitlement with a valid cookie is refused
  const me = await meRoute({ request: new Request('https://bptrade.co/api/me', { headers: { Cookie: hdr } }), env: { GATE_SECRET: SECRET, ENTITLEMENTS: store } });
  assert.deepEqual(await me.json(), { signedIn: true, tier: 'all', email: 'S***@Gmail.com' });
  const gone = mem({ ...base(), 'cust:5': { status: 'expired', product_id: 1472366, user_email: 'sam@gmail.com' } });
  assert.equal((await activeSession(hdr, { GATE_SECRET: SECRET, ENTITLEMENTS: gone }, NOW)), null);
  assert.equal((await call(`/modules/${paidId}.html`, hdr.replace(/^/, ''), { ENTITLEMENTS: gone })).status, 302);
  const meOut = await meRoute({ request: new Request('https://bptrade.co/api/me'), env: { GATE_SECRET: SECRET, ENTITLEMENTS: store } });
  assert.equal((await meOut.json()).signedIn, false);
  assert.equal(maskEmail('sam@gmail.com'), 's***@gmail.com');
  assert.match((await logoutRoute()).headers.get('Set-Cookie'), /Max-Age=0/);
}
{
  // wrong code 5 times kills it, even the right one afterwards
  const store = mem(base());
  await startLogin('sam@gmail.com', 'ip', L(store), mailer(), NOW, () => '111111');
  for (let i = 0; i < 4; i++) assert.equal((await verifyLogin('sam@gmail.com', '000000', L(store), NOW)).status, 403);
  assert.ok(store.m.has('otp:sam@gmail.com'));
  assert.equal((await verifyLogin('sam@gmail.com', '000000', L(store), NOW)).status, 403);
  assert.ok(!store.m.has('otp:sam@gmail.com'));
  assert.equal((await verifyLogin('sam@gmail.com', '111111', L(store), NOW)).status, 403);
}
{
  // expired code fails
  const store = mem(base());
  await startLogin('sam@gmail.com', 'ip', L(store), mailer(), NOW, () => '222222');
  assert.equal((await verifyLogin('sam@gmail.com', '222222', L(store), NOW + 601e3)).status, 403);
  // bad shape
  assert.equal((await verifyLogin('sam@gmail.com', '12ab56', L(store), NOW)).status, 403);
}
{
  // rate limits: 3 sends per email, 10 per IP, per 15 minutes; the answer never changes
  const store = mem(base()); const f = mailer();
  for (let i = 0; i < 5; i++) assert.deepEqual((await startLogin('sam@gmail.com', 'ipA', L(store), f, NOW + i, () => '333333')).body, START_BODY);
  assert.equal(f.sent.length, 3);
  assert.equal((await startLogin('sam@gmail.com', 'ipA', L(store), f, NOW + 16 * 60e3, () => '333333')).status, 200);
  assert.equal(f.sent.length, 4); // window passed
  const store2 = mem(base()); const f2 = mailer();
  for (let i = 0; i < 12; i++) await startLogin(`u${i}@x.com`, 'ipB', L(store2), f2, NOW, () => '1');
  const store3 = mem({ ...base() }); // 10 IP hits used up by other addresses, then a real customer
  const f3 = mailer();
  for (let i = 0; i < 10; i++) await startLogin(`u${i}@x.com`, 'ipC', L(store3), f3, NOW, () => '1');
  await startLogin('sam@gmail.com', 'ipC', L(store3), f3, NOW, () => '1');
  assert.equal(f3.sent.length, 0);
}
{
  // 503 without the Resend key, via the route as well
  const r = await startLogin('sam@gmail.com', 'ip', { GATE_SECRET: SECRET, ENTITLEMENTS: mem(base()) }, mailer(), NOW);
  assert.deepEqual([r.status, r.body.error], [503, 'email_not_configured']);
  const rr = await startRoute({ request: new Request('https://bptrade.co/api/login/start', { method: 'POST', body: JSON.stringify({ email: 'a@b.co' }) }), env: { ENTITLEMENTS: mem() } });
  assert.equal(rr.status, 503);
  // a lapsed customer gets the same answer and no mail
  const f = mailer();
  const lapsed = mem({ ...base(), 'cust:5': { status: 'expired', product_id: 1472366, user_email: 'sam@gmail.com' } });
  assert.deepEqual((await startLogin('sam@gmail.com', 'ip', L(lapsed), f, NOW)).body, START_BODY);
  assert.equal(f.sent.length, 0);
}
{
  // backfill route: auth, then writes missing indexes only
  const store = mem({ 'cust:7': { user_email: ' Pat@X.com ' }, 'cust:8': { status: 'active' }, 'cust:9': { user_email: 'ok@x.com' }, 'email:ok@x.com': '9' });
  const call2 = (auth) => backfillRoute({ request: new Request('https://bptrade.co/api/admin/backfill-emails', { method: 'POST', headers: auth ? { Authorization: auth } : {} }), env: { ADMIN_TOKEN: 'adm', ENTITLEMENTS: store } });
  assert.equal((await call2(null)).status, 401);
  assert.equal((await call2('Bearer nope')).status, 401);
  const ok = await call2('Bearer adm');
  assert.deepEqual(await ok.json(), { ok: true, scanned: 3, written: 1 });
  assert.equal(store.m.get('email:pat@x.com'), '7');
}
{
  // webhook writes the email index on every event that writes a customer record
  const { onRequestPost: hook } = await import('../functions/api/ls-webhook.ts');
  const { createHmac } = await import('node:crypto');
  const store = mem(); store.get = async (k, t) => { const v = store.m.get(k) ?? null; return t === 'json' && v ? JSON.parse(v) : v; };
  const fire = async (event, id, attrs) => {
    const body = JSON.stringify({ meta: { event_name: event, webhook_id: id }, data: { id: '1', attributes: attrs } });
    const sig = createHmac('sha256', 'whs').update(body).digest('hex');
    return hook({ request: new Request('https://bptrade.co/api/ls-webhook', { method: 'POST', headers: { 'X-Signature': sig }, body }), env: { LS_WEBHOOK_SECRET: 'whs', ENTITLEMENTS: store } });
  };
  assert.equal((await fire('subscription_created', 'w1', { customer_id: 11, user_email: ' New@Buyer.com ', status: 'active', product_id: 1472366 })).status, 200);
  assert.equal(store.m.get('email:new@buyer.com'), '11');
  assert.equal((await fire('license_key_created', 'w2', { customer_id: 12, user_email: 'Key@Buyer.com' })).status, 200);
  assert.equal(store.m.get('email:key@buyer.com'), '12');
}
console.log('gate: all tests passed');
