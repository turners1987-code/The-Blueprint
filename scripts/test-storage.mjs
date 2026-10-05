#!/usr/bin/env node
/* ============================================================
   THE BLUEPRINT — journal storage tests (scripts/test-storage.mjs)
   ============================================================
   Node only. No dependencies.

   Run:  npm run test:storage

   Exercises the localStorage adapter (js/journal/storage-local.js)
   and the storage.js facade against an in-memory localStorage shim.
   The File System Access adapter needs a browser and is not covered
   here.

   Exit code 1 if any test fails, 0 otherwise.
   ============================================================ */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createLocalStorageAdapter } from '../js/journal/storage-local.js';
import { StorageError, ValidationError } from '../js/journal/storage-common.js';
import { ID_RE } from '../js/journal/schema.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const examples = JSON.parse(readFileSync(path.join(ROOT, 'data', 'journal-example.json'), 'utf8'));
const [winner, loser, open] = examples;

// ── In-memory localStorage shim ───────────────────────────────
// quotaBytes (optional) makes setItem throw QuotaExceededError once the
// total size of keys plus values would exceed it, like a real browser.
function makeShim({ quotaBytes = Infinity } = {}) {
  const map = new Map();
  const size = () => [...map].reduce((n, [k, v]) => n + k.length + v.length, 0);
  return {
    quota: quotaBytes,
    used: size,
    get length() { return map.size; },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem(k, v) {
      const next = size() - (map.has(k) ? k.length + map.get(k).length : 0) + k.length + String(v).length;
      if (next > this.quota) throw new DOMException('quota', 'QuotaExceededError');
      map.set(k, String(v));
    },
    removeItem: (k) => { map.delete(k); },
    clear: () => map.clear(),
    _map: map,
  };
}

const fresh = async (opts) => {
  const shim = makeShim(opts);
  const store = createLocalStorageAdapter({ storage: shim });
  const init = await store.init();
  assert.equal(init.ok, true, `init failed: ${init.reason}`);
  return { shim, store };
};

const rejects = async (fn, check) => {
  try { await fn(); } catch (e) { check(e); return; }
  assert.fail('expected a rejection');
};

// ── Tests ─────────────────────────────────────────────────────

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('init reports ok and an empty store', async () => {
  const { store } = await fresh();
  const s = await store.stats();
  assert.deepEqual({ count: s.count, oldest: s.oldest, newest: s.newest }, { count: 0, oldest: null, newest: null });
  assert.deepEqual(await store.list({}), []);
});

test('init reports a blocked localStorage clearly', async () => {
  const broken = makeShim();
  broken.setItem = () => { throw new DOMException('blocked', 'SecurityError'); };
  const r = await createLocalStorageAdapter({ storage: broken }).init();
  assert.equal(r.ok, false);
  assert.match(r.reason, /blocked/i);
});

test('put assigns a sortable id: session date plus a short random suffix', async () => {
  const { store } = await fresh();
  const saved = await store.put(winner);
  assert.match(saved.id, ID_RE);
  assert.equal(saved.id.slice(0, 10), winner.session_date);
  assert.equal(winner.id, undefined, 'put must not mutate its argument');
  const other = await store.put(winner);
  assert.notEqual(other.id, saved.id, 'two puts of a record without an id make two records');
});

test('put keeps an existing id and updates in place', async () => {
  const { store } = await fresh();
  const saved = await store.put(winner);
  const updated = await store.put({ ...saved, tags: ['revisited'] });
  assert.equal(updated.id, saved.id);
  assert.deepEqual((await store.get(saved.id)).tags, ['revisited']);
  assert.equal((await store.stats()).count, 1);
});

test('get returns the record, or null when there is none', async () => {
  const { store } = await fresh();
  const saved = await store.put(loser);
  assert.deepEqual(await store.get(saved.id), saved);
  assert.equal(await store.get('2026-01-01-zzzzz'), null);
});

test('list returns newest first and honours an inclusive date range', async () => {
  const { store } = await fresh();
  const a = await store.put(winner); // 2026-09-29
  const b = await store.put(loser);  // 2026-09-30
  const c = await store.put(open);   // 2026-10-02
  assert.deepEqual((await store.list()).map(r => r.id), [c.id, b.id, a.id]);
  assert.deepEqual((await store.list({ from: '2026-09-30' })).map(r => r.id), [c.id, b.id]);
  assert.deepEqual((await store.list({ to: '2026-09-30' })).map(r => r.id), [b.id, a.id]);
  assert.deepEqual((await store.list({ from: '2026-09-30', to: '2026-09-30' })).map(r => r.id), [b.id]);
  assert.deepEqual(await store.list({ from: '2027-01-01' }), []);
  await rejects(() => store.list({ from: 'yesterday' }), e => assert.equal(e.code, 'bad-argument'));
});

test('list orders same-day trades by entry time, newest first', async () => {
  const { store } = await fresh();
  const early = await store.put({ ...winner, entry_time: '2026-09-29T09:40:00-04:00' });
  const late = await store.put({ ...winner, entry_time: '2026-09-29T10:20:00-04:00' });
  assert.deepEqual((await store.list()).map(r => r.id), [late.id, early.id]);
});

test('remove deletes one record and reports whether it existed', async () => {
  const { store } = await fresh();
  const a = await store.put(winner);
  const b = await store.put(loser);
  assert.equal(await store.remove(a.id), true);
  assert.equal(await store.get(a.id), null);
  assert.equal(await store.remove(a.id), false);
  assert.deepEqual((await store.list()).map(r => r.id), [b.id]);
});

test('an invalid record is rejected with the validation errors, and nothing is stored', async () => {
  const { store, shim } = await fresh();
  const before = shim._map.size;
  await rejects(() => store.put({ ...winner, environment: null, grade: 'A-' }), (e) => {
    assert.ok(e instanceof ValidationError);
    assert.equal(e.code, 'invalid');
    const fields = e.errors.map(x => x.field);
    assert.ok(fields.includes('environment') && fields.includes('grade'), `errors: ${fields}`);
  });
  await rejects(() => store.put(null), e => assert.ok(e instanceof ValidationError));
  await rejects(() => store.put({ ...winner, id: 'not-an-id' }), e => assert.ok(e.errors.some(x => x.field === 'id')));
  assert.equal(shim._map.size, before);
  assert.equal((await store.stats()).count, 0);
});

test('the localStorage layout is one key per record plus an index key', async () => {
  const { store, shim } = await fresh();
  const a = await store.put(winner);
  const keys = [...shim._map.keys()].sort();
  assert.deepEqual(keys, [`blueprint_journal:index`, `blueprint_journal:rec:${a.id}`].sort());
});

test('stats reports count, oldest, newest and bytes', async () => {
  const { store } = await fresh();
  await store.put(winner);
  await store.put(open);
  const s = await store.stats();
  assert.equal(s.count, 2);
  assert.equal(s.oldest, '2026-09-29');
  assert.equal(s.newest, '2026-10-02');
  assert.ok(s.bytes > 0);
});

test('exportAll returns a JSON string holding every record', async () => {
  const { store } = await fresh();
  await store.put(winner);
  await store.put(loser);
  const json = await store.exportAll();
  assert.equal(typeof json, 'string');
  const data = JSON.parse(json);
  assert.equal(data.format, 'blueprint-journal');
  assert.equal(data.records.length, 2);
});

test('importAll replaces everything', async () => {
  const { store } = await fresh();
  const old = await store.put(winner);
  const json = JSON.stringify(examples.slice(1)); // a bare array is accepted too
  const r = await store.importAll(json);
  assert.equal(r.count, 2);
  assert.equal(await store.get(old.id), null, 'old records are gone');
  assert.equal((await store.list()).length, 2);
});

test('round trip: export from one store, import into another, records match', async () => {
  const a = await fresh();
  for (const rec of examples) await a.store.put(rec);
  const exported = await a.store.exportAll();
  const b = await fresh();
  await b.store.importAll(exported);
  assert.deepEqual(await b.store.list(), await a.store.list());
  assert.equal(await b.store.exportAll().then(j => JSON.parse(j).records.length), 3);
  // and the index works in the new store
  assert.equal((await b.store.stats()).count, 3);
  assert.equal((await b.store.list({ from: '2026-10-01' })).length, 1);
});

test('importAll with one invalid record rejects it all and leaves the store untouched', async () => {
  const { store } = await fresh();
  const kept = await store.put(winner);
  const bad = JSON.stringify([loser, { ...open, setup: 'opening-range-breakout' }]);
  await rejects(() => store.importAll(bad), (e) => {
    assert.ok(e instanceof ValidationError);
    assert.ok(e.errors.some(x => x.field === 'setup' && /record 2/.test(x.record)), JSON.stringify(e.errors));
  });
  assert.deepEqual((await store.list()).map(r => r.id), [kept.id]);
  await rejects(() => store.importAll('not json'), e => assert.equal(e.code, 'bad-import'));
  await rejects(() => store.importAll('{"hello":1}'), e => assert.equal(e.code, 'bad-import'));
  const dup = JSON.stringify([{ ...winner, id: '2026-09-29-aaaaa' }, { ...loser, id: '2026-09-29-aaaaa' }]);
  await rejects(() => store.importAll(dup), e => assert.ok(e.errors.some(x => /more than once/.test(x.message))));
  assert.deepEqual((await store.list()).map(r => r.id), [kept.id]);
});

test('quota exceeded gives a clear error and leaves the store consistent', async () => {
  const { shim, store } = await fresh();
  const kept = await store.put(winner);
  shim.quota = shim.used() + 150; // room for the first record, not a second
  const before = new Map(shim._map);
  await rejects(() => store.put(loser), (e) => {
    assert.ok(e instanceof StorageError);
    assert.equal(e.code, 'quota');
    assert.match(e.message, /storage is full/i);
  });
  assert.deepEqual([...shim._map], [...before], 'a failed put changes nothing');
  assert.deepEqual((await store.list()).map(r => r.id), [kept.id]);
});

test('a quota failure during importAll restores the previous journal', async () => {
  const { shim, store } = await fresh();
  const kept = await store.put(winner);
  shim.quota = shim.used() + 150;
  const before = new Map(shim._map);
  await rejects(() => store.importAll(JSON.stringify(examples)), e => assert.equal(e.code, 'quota'));
  assert.deepEqual([...shim._map].sort(), [...before].sort());
  assert.deepEqual((await store.list()).map(r => r.id), [kept.id]);
});

test('a damaged index is rebuilt from the record keys on init', async () => {
  const { shim, store } = await fresh();
  const a = await store.put(winner);
  const b = await store.put(loser);
  shim.setItem('blueprint_journal:index', '{ not json');
  const again = createLocalStorageAdapter({ storage: shim });
  assert.equal((await again.init()).ok, true);
  assert.deepEqual((await again.list()).map(r => r.id), [b.id, a.id]);
});

test('operations before init() fail with not-ready', async () => {
  const store = createLocalStorageAdapter({ storage: makeShim() });
  await rejects(() => store.list(), e => assert.equal(e.code, 'not-ready'));
});

test('meta: settings merge, survive a re-init, and are never records', async () => {
  const { store, shim } = await fresh();
  assert.deepEqual(await store.getMeta(), {});
  await store.setMeta({ lastExport: '2026-10-05T12:00:00.000Z' });
  await store.setMeta({ note: 'backup drive' });
  assert.deepEqual(await store.getMeta(), { lastExport: '2026-10-05T12:00:00.000Z', note: 'backup drive' });
  assert.deepEqual((await store.list()).length, 0, 'a setting is not a trade');
  assert.equal((await store.stats()).count, 0, 'a setting is not counted');
  const again = createLocalStorageAdapter({ storage: shim });
  assert.equal((await again.init()).ok, true);
  assert.equal((await again.getMeta()).lastExport, '2026-10-05T12:00:00.000Z');
});

test('meta: a damaged value reads as empty and can be replaced', async () => {
  const { store, shim } = await fresh();
  shim.setItem('blueprint_journal:meta', '{ not json');
  assert.deepEqual(await store.getMeta(), {});
  assert.deepEqual(await store.setMeta({ lastExport: 'x' }), { lastExport: 'x' });
  assert.deepEqual(JSON.parse(shim.getItem('blueprint_journal:meta')), { lastExport: 'x' });
});

test('importAll keeps settings: they are not records', async () => {
  const { store } = await fresh();
  await store.put(winner);
  await store.setMeta({ lastExport: '2026-10-05T12:00:00.000Z' });
  await store.importAll(await store.exportAll());
  assert.equal((await store.getMeta()).lastExport, '2026-10-05T12:00:00.000Z');
});

test('setMeta rejects a non-object', async () => {
  const { store } = await fresh();
  await rejects(() => store.setMeta('nope'), e => assert.equal(e.code, 'bad-argument'));
  await rejects(() => store.setMeta(['nope']), e => assert.equal(e.code, 'bad-argument'));
});

test('storage.js picks localStorage without a stored folder, and exposes switching', async () => {
  globalThis.localStorage = makeShim();
  const api = await import('../js/journal/storage.js');
  assert.equal(api.fsSupported(), false, 'node has no File System Access API');
  const r = await api.init();
  assert.deepEqual({ ok: r.ok, backend: r.backend }, { ok: true, backend: 'local' });
  const saved = await api.put(winner);
  assert.deepEqual(await api.get(saved.id), saved);
  assert.equal((await api.list()).length, 1);
  assert.equal((await api.stats()).count, 1);
  assert.equal((JSON.parse(await api.exportAll())).records.length, 1);
  assert.equal(await api.remove(saved.id), true);
  const fsTry = await api.useFileSystem();
  assert.equal(fsTry.ok, false);
  assert.equal(fsTry.code, 'unsupported');
  assert.equal(api.backend(), 'local', 'a failed switch leaves the current backend selected');
  assert.equal((await api.useLocal()).backend, 'local');
  // UI settings ride behind the same facade, whatever the backend.
  assert.deepEqual(await api.getMeta(), {});
  await api.setMeta({ lastExport: '2026-10-05T12:00:00.000Z' });
  assert.equal((await api.getMeta()).lastExport, '2026-10-05T12:00:00.000Z');
});

// ── Run ───────────────────────────────────────────────────────

let failed = 0;
for (const [name, fn] of tests) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${name}\n    ${String(e && e.message ? e.message : e).split('\n').join('\n    ')}`);
  }
}
console.log('─'.repeat(40));
console.log(`${tests.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
