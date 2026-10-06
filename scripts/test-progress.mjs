#!/usr/bin/env node
/* ============================================================
   THE BLUEPRINT — progress tests (scripts/test-progress.mjs)
   ============================================================
   Node only. No dependencies.

   Run:  npm run test:progress

   Completion and position are separate: lastVisited decides where
   "Continue" goes, completed decides the checkmarks and the
   percentage. Runs js/progress.js against an in-memory localStorage
   and a fixed module list, so it does not depend on which modules
   are published today.

   Exit code 1 if any test fails, 0 otherwise.
   ============================================================ */

import assert from 'node:assert/strict';

// ── Browser shims, set before progress.js loads ───────────────
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};
globalThis.window = { location: { pathname: '/' } };
globalThis.document = {
  readyState: 'complete',
  querySelector: () => null,
  querySelectorAll: () => [],
};

const mod = (n, slug, status = 'published') => ({ id: `${n}-${slug}`, number: n, slug, status });
const FIXTURE = [
  mod('00', 'welcome'), mod('01', 'evidence'), mod('02', 'tiers'), mod('03', 'levels'),
  mod('04', 'trend'), mod('05', 'range', 'planned'),
];
globalThis.fetch = async () => ({ ok: true, json: async () => FIXTURE });

const { Progress } = await import('../js/progress.js');
await Progress.ready;

let passed = 0;
let failed = 0;
const test = (name, fn) => {
  store.clear();
  try { fn(); passed++; console.log(`✓ ${name}`); }
  catch (e) { failed++; console.log(`✗ ${name}\n    ${e.message}`); }
};
const target = () => Progress.getContinueInfo().path;

test('mark 00 and 01, visit 03, unmark 00: continue stays based on 03', () => {
  Progress.markComplete('00-welcome');
  Progress.markComplete('01-evidence');
  Progress.recordVisit('/modules/03-levels.html');
  assert.equal(target(), 'modules/04-trend.html');
  Progress.unmarkComplete('00-welcome');
  assert.equal(target(), 'modules/04-trend.html', 'must not jump back to 00');
  assert.equal(Progress.load().lastVisited, '03-levels');
  assert.deepEqual(Progress.load().completed, ['01-evidence']);
});

test('unmarking removes the checkmark and nothing else', () => {
  Progress.markComplete('00-welcome');
  Progress.recordVisit('/modules/02-tiers.html');
  const before = Progress.load();
  Progress.unmarkComplete('00-welcome');
  const after = Progress.load();
  assert.deepEqual(after.completed, []);
  assert.equal(after.lastVisited, before.lastVisited);
});

test('marking complete does not move position', () => {
  Progress.recordVisit('/modules/03-levels.html');
  Progress.markComplete('00-welcome');
  assert.equal(Progress.load().lastVisited, '03-levels');
});

test('percentage counts completed modules, regardless of position', () => {
  Progress.markComplete('00-welcome');
  Progress.markComplete('01-evidence');
  Progress.recordVisit('/modules/04-trend.html');
  assert.equal(Progress.getPercent(), 40);
  Progress.unmarkComplete('00-welcome');
  assert.equal(Progress.getPercent(), 20);
});

test('every module page load sets lastVisited; other pages do not', () => {
  Progress.recordVisit('/modules/01-evidence.html');
  assert.equal(Progress.load().lastVisited, '01-evidence');
  Progress.recordVisit('/index.html');
  Progress.recordVisit('/modules/not-a-module.html');
  assert.equal(Progress.load().lastVisited, '01-evidence');
});

test('no lastVisited: falls back to the first incomplete module', () => {
  Progress.markComplete('00-welcome');
  assert.equal(Progress.load().lastVisited, null);
  assert.equal(target(), 'modules/01-evidence.html');
});

test('older stored data without lastVisited falls back the same way', () => {
  store.set('blueprint_progress', JSON.stringify({ version: 2, completed: ['00-welcome', '01-evidence'] }));
  assert.equal(target(), 'modules/02-tiers.html');
});

test('first visit: Start The Course at the first module', () => {
  const info = Progress.getContinueInfo();
  assert.equal(info.text, 'Start The Course');
  assert.equal(info.path, 'modules/00-welcome.html');
});

test('lastVisited set: Continue Learning, even with nothing completed', () => {
  Progress.recordVisit('/modules/01-evidence.html');
  const info = Progress.getContinueInfo();
  assert.equal(info.text, 'Continue Learning');
  assert.equal(info.path, 'modules/02-tiers.html');
});

test('at the last published module, continue stays on it', () => {
  Progress.recordVisit('/modules/04-trend.html');
  assert.equal(target(), 'modules/04-trend.html');
});

test('a retired lastVisited id falls back to the first incomplete module', () => {
  store.set('blueprint_progress', JSON.stringify({ version: 2, completed: ['00-welcome'], lastVisited: '99-gone' }));
  assert.equal(target(), 'modules/01-evidence.html');
});

console.log('─'.repeat(40));
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
