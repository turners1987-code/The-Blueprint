#!/usr/bin/env node
/* Tests for functions/_lib/reset.ts with a fake fetch and fake KV. Run: npm run test:reset */
import assert from 'node:assert/strict';
import { resetActivations } from '../functions/_lib/reset.ts';

const kv = () => {
  const m = new Map();
  return { m, get: async (k) => m.get(k) ?? null, put: async (k, v) => { m.set(k, v); }, delete: async (k) => { m.delete(k); } };
};
const ok = (b) => ({ ok: true, status: 200, json: async () => b });

function fakeFetch({ valid = true, instances = ['11', '22'], failDeactivate = false } = {}) {
  const calls = [];
  const f = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith('/licenses/validate')) {
      return ok(valid ? { valid: true, license_key: { id: 7, status: 'active' } } : { valid: false, license_key: { id: 7, status: 'disabled' } });
    }
    if (String(url).includes('/license-key-instances')) return ok({ data: instances.map((id) => ({ id })) });
    if (String(url).endsWith('/licenses/deactivate')) return ok({ deactivated: !failDeactivate });
    throw new Error('unexpected ' + url);
  };
  f.calls = calls;
  return f;
}

// missing / bad input
assert.equal((await resetActivations('', { LS_API_KEY: 'x', ENTITLEMENTS: kv() }, fakeFetch())).status, 400);
assert.equal((await resetActivations(5, { LS_API_KEY: 'x', ENTITLEMENTS: kv() }, fakeFetch())).status, 400);
// secret not set: no upstream call
{ const f = fakeFetch(); const r = await resetActivations('KEY', { ENTITLEMENTS: kv() }, f); assert.equal(r.status, 503); assert.equal(f.calls.length, 0); }
// unknown key
assert.equal((await resetActivations('KEY', { LS_API_KEY: 'x', ENTITLEMENTS: kv() }, fakeFetch({ valid: false }))).status, 404);

// success: both instances deactivated, secret only on the list call
{
  const f = fakeFetch(); const store = kv();
  const r = await resetActivations(' KEY-1 ', { LS_API_KEY: 'secret', ENTITLEMENTS: store }, f);
  assert.deepEqual([r.status, r.body.deactivated], [200, 2]);
  const list = f.calls.find((c) => c.url.includes('license-key-instances'));
  assert.ok(list.url.includes('filter[license_key_id]=7'));
  assert.equal(list.init.headers.Authorization, 'Bearer secret');
  assert.equal(f.calls.filter((c) => c.url.endsWith('/deactivate')).length, 2);
  assert.ok(f.calls.filter((c) => !c.url.includes('license-key-instances')).every((c) => !JSON.stringify(c.init).includes('secret')));
  // second reset within 24h is refused, and does not call out to deactivate
  const f2 = fakeFetch();
  const again = await resetActivations('KEY-1', { LS_API_KEY: 'secret', ENTITLEMENTS: store }, f2);
  assert.equal(again.status, 429);
  assert.ok(Number(again.headers['Retry-After']) > 0);
  assert.equal(f2.calls.filter((c) => c.url.endsWith('/deactivate')).length, 0);
  // a different key is not limited
  assert.equal((await resetActivations('KEY-2', { LS_API_KEY: 'secret', ENTITLEMENTS: store }, fakeFetch())).status, 200);
  // the limiter stores a hash, never the key
  assert.ok([...store.m.keys()].every((k) => !k.includes('KEY-1')));
}
// partial failure frees the limiter so the customer can retry
{
  const store = kv();
  const r = await resetActivations('KEY', { LS_API_KEY: 's', ENTITLEMENTS: store }, fakeFetch({ failDeactivate: true }));
  assert.equal(r.status, 502);
  assert.equal(store.m.size, 0);
}
// no instances: still ok
assert.equal((await resetActivations('KEY', { LS_API_KEY: 's', ENTITLEMENTS: kv() }, fakeFetch({ instances: [] }))).body.deactivated, 0);
console.log('reset: all tests passed');
