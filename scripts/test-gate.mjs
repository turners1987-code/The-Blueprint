#!/usr/bin/env node
/* Tests for functions/_lib/gate.ts and the middleware, with a fake fetch and fake KV. Run: npm run test:gate */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathNeed, signSession, verifySession, readCookie, entitlementActive, allowed, createSession } from '../functions/_lib/gate.ts';
import { onRequest } from '../functions/_middleware.ts';

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
console.log('gate: all tests passed');
