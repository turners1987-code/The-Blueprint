#!/usr/bin/env node
/* ============================================================
   THE BLUEPRINT — journal analysis tests (scripts/test-analysis.mjs)
   ============================================================
   Node only. No dependencies.

   Run:  npm run test:analysis

   Hand-computed fixtures for js/journal/analysis.js. Each test says
   how its expected numbers were worked out. Includes the proof that
   sim records cannot reach an expectancy figure and that a request
   for three dimensions throws.

   Exit code 1 if any test fails, 0 otherwise.
   ============================================================ */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as A from '../js/journal/analysis.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── Fixture helpers ───────────────────────────────────────────

let counter = 0;
const day = (i) => new Date(Date.UTC(2026, 8, 1 + i)).toISOString().slice(0, 10); // 2026-09-01 + i

// A closed live MNQ trade: 10-point stop (fill 24000, stop 23990), 1
// contract, no commissions, taxonomy 1.4. Override anything.
const rec = (o = {}) => {
  const session_date = o.session_date || '2026-09-01';
  return {
    id: `${session_date}-t${String(++counter).padStart(4, '0')}`,
    taxonomy_version: '1.4',
    setup: 'trend-continuation',
    location: 'pd-high',
    trigger: 'pause-n-go',
    confirmation: [],
    grade: 'A',
    execution_mark: 'Pass',
    environment: 'live',
    instrument: 'MNQ',
    direction: 'long',
    session_date,
    entry_time: `${session_date}T09:45:00-04:00`,
    actual_fill: 24000,
    stop_price: 23990,
    size: 1,
    commissions: 0,
    r_multiple: 1,
    ...o,
  };
};
const live = (r, o = {}) => rec({ r_multiple: r, ...o });
const many = (n, make) => Array.from({ length: n }, (_, i) => make(i));

const near = (actual, expected, msg) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${msg || 'value'}: expected ${expected}, got ${actual}`);

// Every numeric statistic that would measure edge.
const EDGE_KEYS = new Set([
  'expectancy', 'grossExpectancy', 'totalR', 'grossTotalR', 'winRate', 'profitFactor', 'avgWinR', 'avgLossR',
  'meanRealizedR', 'meanMfeR', 'efficiency', 'givenBackR', 'meanSeconds', 'medianSeconds', 'p25Seconds',
  'p75Seconds', 'median', 'p90', 'max', 'losersWithinWinnerRange', 'loserToWinnerMedian',
]);
const findEdgeNumbers = (node, trail = '') => {
  const hits = [];
  if (Array.isArray(node)) node.forEach((x, i) => hits.push(...findEdgeNumbers(x, `${trail}[${i}]`)));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (EDGE_KEYS.has(k) && typeof v === 'number') hits.push(`${trail}.${k}=${v}`);
      hits.push(...findEdgeNumbers(v, `${trail}.${k}`));
    }
  }
  return hits;
};

// ── Tests ─────────────────────────────────────────────────────

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// summary ---------------------------------------------------------

test('summary: win rate, expectancy, profit factor and total R match hand calculation', () => {
  // R: +2, -1, +1, -1, 0  ->  wins 2, losses 2, breakeven 1, n 5
  // winRate 2/5 = 0.4; expectancy (2-1+1-1+0)/5 = 0.2; total R 1
  // profit factor = (2+1) / |-1-1| = 1.5; avg win 1.5; avg loss -1
  const records = [2, -1, 1, -1, 0].map((r, i) => live(r, { session_date: day(i) }));
  const s = A.summary(records).live;
  assert.equal(s.n, 5);
  assert.equal(s.sessions, 5);
  assert.equal(s.wins, 2); assert.equal(s.losses, 2); assert.equal(s.breakeven, 1);
  near(s.winRate, 0.4); near(s.expectancy, 0.2); near(s.totalR, 1);
  near(s.profitFactor, 1.5); near(s.avgWinR, 1.5); near(s.avgLossR, -1);
  assert.equal(s.dimmed, true);
});

test('summary: an empty set gives nulls, not NaN', () => {
  const s = A.summary([]).live;
  assert.deepEqual([s.n, s.expectancy, s.winRate, s.profitFactor, s.totalR], [0, null, null, null, null]);
});

test('summary: profit factor is null when there are no losing trades', () => {
  assert.equal(A.summary([live(1), live(2)]).live.profitFactor, null);
});

test('summary: open trades are counted in `open`, never in n', () => {
  const open = rec({ r_multiple: undefined }); delete open.r_multiple;
  const r = A.summary([live(1), open]);
  assert.equal(r.live.n, 1);
  assert.equal(r.open, 1);
});

test('summary: records with no valid environment are counted, never analysed', () => {
  const r = A.summary([live(1), rec({ environment: 'paper', r_multiple: 99 }), rec({ environment: undefined, r_multiple: 99 })]);
  assert.equal(r.unknownEnvironment, 2);
  near(r.live.expectancy, 1);
});

test('summary: commissions are applied in R where they can be worked out', () => {
  // Trade 1: 10-point stop, 2 contracts, MNQ $2/point -> risk $40. $4 fees = 0.1R. +1R gross -> 0.9R net.
  // Trade 2: fees not recorded -> gross 0.5R used, counted as unpriced.
  // Trade 3: instrument with no point value (6E) and fees -> gross -1R used, unpriced.
  // net expectancy = (0.9 + 0.5 - 1) / 3; gross = (1 + 0.5 - 1) / 3
  const records = [
    live(1, { size: 2, commissions: 4, session_date: day(0) }),
    live(0.5, { commissions: null, session_date: day(1) }),
    live(-1, { instrument: '6E', commissions: 5, session_date: day(2) }),
  ];
  const s = A.summary(records).live;
  near(s.expectancy, 0.4 / 3, 'net expectancy');
  near(s.grossExpectancy, 0.5 / 3, 'gross expectancy');
  assert.equal(s.unpriced, 2);
});

// the sim rule ----------------------------------------------------

test('SIM RULE: cohortStats() refuses sim, replay and unlabelled records outright', () => {
  for (const environment of ['sim', 'replay', undefined, 'paper']) {
    assert.throws(() => A.cohortStats([live(1), rec({ environment, r_multiple: 5 })]), /live trades only/);
  }
  assert.doesNotThrow(() => A.cohortStats([live(1)]));
});

test('SIM RULE: sim trades never move a live expectancy', () => {
  // live R: 1, 1, 1 -> expectancy 1. Five sim trades at +10R must change nothing in live.
  const liveRecs = [1, 1, 1].map((r, i) => live(r, { session_date: day(i) }));
  const simRecs = many(5, (i) => rec({ environment: 'sim', r_multiple: 10, session_date: day(i) }));
  const s = A.summary([...liveRecs, ...simRecs]);
  assert.equal(s.live.n, 3);
  near(s.live.expectancy, 1);
  near(s.live.totalR, 3);
  assert.equal(s.sim.n, 5, 'sim is counted, separately');
  assert.equal(s.sim.expectancy, null, 'sim has no expectancy');
  assert.equal(s.replay.n, 0);
});

test('SIM RULE: for every function, live results are identical with or without sim and replay, and sim/replay series hold no edge number', () => {
  const base = [
    live(2, { session_date: day(0), mae_ticks: 4, mfe_ticks: 40, time_in_trade_seconds: 600, entry_time: '2026-09-01T09:40:00-04:00' }),
    live(-1, { session_date: day(0), mae_ticks: 20, mfe_ticks: 8, time_in_trade_seconds: 900, entry_time: '2026-09-01T10:10:00-04:00', grade: 'A+', execution_mark: 'Fail' }),
    live(1, { session_date: day(1), mae_ticks: 6, mfe_ticks: 16, time_in_trade_seconds: 1200, setup: 'range-rejection', trigger: 'resting-limit' }),
  ];
  const noise = [
    ...many(6, (i) => rec({ environment: 'sim', r_multiple: 50, mae_ticks: 1, mfe_ticks: 400, time_in_trade_seconds: 60, session_date: day(i), grade: 'A+', execution_mark: 'Fail' })),
    ...many(4, (i) => rec({ environment: 'replay', r_multiple: -50, mae_ticks: 90, mfe_ticks: 2, time_in_trade_seconds: 7000, session_date: day(i), setup: 'range-rejection' })),
  ];
  const calls = {
    summary: (r) => A.summary(r),
    byDimension: (r) => A.byDimension(r, 'setup'),
    byTwo: (r) => A.byTwo(r, 'setup', 'grade'),
    stopSurvival: (r) => A.stopSurvival(r),
    exitEfficiency: (r) => A.exitEfficiency(r),
    durationSignature: (r) => A.durationSignature(r),
    sequenceEffects: (r) => A.sequenceEffects(r),
    disciplineCohorts: (r) => A.disciplineCohorts(r),
  };
  for (const [name, call] of Object.entries(calls)) {
    const without = call(base);
    const withNoise = call([...base, ...noise]);
    assert.deepEqual(withNoise.live, without.live, `${name}: sim/replay changed the live series`);
    assert.deepEqual(findEdgeNumbers(withNoise.sim, 'sim'), [], `${name}: sim series carries an edge number`);
    assert.deepEqual(findEdgeNumbers(withNoise.replay, 'replay'), [], `${name}: replay series carries an edge number`);
  }
  // gateTwoStatus lays sim beside live; its live figures must not move either.
  const g0 = A.gateTwoStatus(base);
  const g1 = A.gateTwoStatus([...base, ...noise]);
  const strip = (g) => g.bySetup.map(({ simTrades, replayTrades, ...rest }) => rest);
  assert.deepEqual(strip(g1), strip(g0));
  assert.equal(g1.bySetup.find(r => r.key === 'range-rejection').replayTrades, 4);
  assert.equal(g1.bySetup.find(r => r.key === 'trend-continuation').simTrades, 6);
});

// simStats --------------------------------------------------------

const simRec = (o = {}) => rec({ environment: 'sim', ...o });

test('simStats: refuses live records, and cohortStats still refuses sim (mutually exclusive)', () => {
  assert.throws(() => A.simStats([simRec(), live(1)]), /sim and replay trades only/);
  assert.throws(() => A.simStats([live(1)]), /sim and replay trades only/);
  assert.doesNotThrow(() => A.simStats([simRec()]));
  assert.doesNotThrow(() => A.simStats([]));
  assert.throws(() => A.cohortStats([simRec()]), /live trades only/);
});

test('simStats: expectancy is null and no edge key appears anywhere in the result', () => {
  const r = A.simStats([simRec({ r_multiple: 9 }), simRec({ r_multiple: -3 })]);
  assert.equal(r.expectancy, null);
  for (const k of ['grossExpectancy', 'winRate', 'wins', 'losses', 'profitFactor', 'totalR', 'avgWinR', 'avgLossR']) {
    assert.ok(!(k in r), `simStats must not return ${k}`);
  }
  assert.deepEqual(findEdgeNumbers(r), []);
  assert.match(r.note, /never pooled into an expectancy/);
});

test('simStats: counts per dimension, unclassified under the null key, open trades excluded', () => {
  // 4 closed: two trend-continuation/pd-high/A, one range-rejection/or-high/B (short MES),
  // one fully unclassified. Plus one open trade (no r_multiple) that must not be counted.
  const r = A.simStats([
    simRec(),
    simRec(),
    simRec({ setup: 'range-rejection', location: 'or-high', grade: 'B', direction: 'short', instrument: 'MES' }),
    simRec({ setup: null, location: null, grade: null }),
    simRec({ r_multiple: null }),
  ]);
  assert.equal(r.n, 4);
  assert.deepEqual(r.counts.setup, { 'trend-continuation': 2, 'range-rejection': 1, null: 1 });
  assert.deepEqual(r.counts.location, { 'pd-high': 2, 'or-high': 1, null: 1 });
  assert.deepEqual(r.counts.grade, { A: 2, B: 1, null: 1 });
  assert.deepEqual(r.counts.instrument, { MNQ: 3, MES: 1 });
  assert.deepEqual(r.counts.direction, { long: 3, short: 1 });
  assert.equal(r.unclassified, 1);
  // a record with only a null grade is unclassified too
  assert.equal(A.simStats([simRec({ grade: null }), simRec()]).unclassified, 1);
});

test('simStats: medians of MAE, MFE and time in trade ignore nulls', () => {
  const r = A.simStats([
    simRec({ mae_ticks: 2, mfe_ticks: 10, time_in_trade_seconds: 60 }),
    simRec({ mae_ticks: 8, mfe_ticks: 30, time_in_trade_seconds: 300 }),
    simRec({ mae_ticks: 4, mfe_ticks: null, time_in_trade_seconds: null }),
  ]);
  assert.equal(r.maeTicksMedian, 4);              // 2, 4, 8
  assert.equal(r.mfeTicksMedian, 20);             // 10, 30 -> midpoint
  assert.equal(r.timeInTradeSecondsMedian, 180);  // 60, 300 -> midpoint
  assert.equal(A.simStats([simRec()]).maeTicksMedian, null);
});

test('simStats: slippage is signed so a worse-than-intended fill is positive, in ticks', () => {
  // MNQ tick 0.25. Long intended 24000, filled 24000.50: paid up 2 ticks = +2.
  // Long filled 23999.75: better by 1 tick = -1.
  // Short intended 24000, filled 23999.00: sold 4 ticks worse = +4.
  // Short filled 24000.25: better by 1 tick = -1. Sorted [-1,-1,2,4]: median 0.5, worst 4.
  // A record with no intended_price is left out of the slippage n.
  const r = A.simStats([
    simRec({ direction: 'long', intended_price: 24000, actual_fill: 24000.5 }),
    simRec({ direction: 'long', intended_price: 24000, actual_fill: 23999.75 }),
    simRec({ direction: 'short', intended_price: 24000, actual_fill: 23999 }),
    simRec({ direction: 'short', intended_price: 24000, actual_fill: 24000.25 }),
    simRec({ direction: 'long', intended_price: null, actual_fill: 24000 }),
  ]);
  assert.equal(r.slippage.n, 4);
  assert.equal(r.slippage.medianTicks, 0.5);
  assert.equal(r.slippage.worstTicks, 4);
  assert.deepEqual(A.simStats([simRec()]).slippage.n, 0);
  assert.equal(A.simStats([simRec()]).slippage.medianTicks, null);
});

test('simStats: slippage uses the instruments map and skips an unknown instrument', () => {
  const s = (o = {}) => simRec({ direction: 'long', intended_price: 100, actual_fill: 100.5, ...o });
  assert.equal(A.simStats([s({ instrument: 'MGC' })]).slippage.medianTicks, 5); // 0.5 pt / 0.1 tick
  assert.equal(A.simStats([s({ instrument: 'XYZ' })]).slippage.n, 0);
  assert.equal(A.simStats([s({ instrument: 'XYZ' })], { instruments: { XYZ: { tickSize: 0.5, pointValue: 1 } } }).slippage.medianTicks, 1);
});

test('simStats: carries the display floor and the mixed-version flag', () => {
  const small = A.simStats(many(29, (i) => simRec({ session_date: day(i % 25) })));
  assert.equal(small.n, 29);
  assert.equal(small.dimmed, true, 'under 30 trades');
  const fewSessions = A.simStats(many(40, (i) => simRec({ session_date: day(i % 19) })));
  assert.equal(fewSessions.sessions, 19);
  assert.equal(fewSessions.dimmed, true, 'under 20 sessions');
  const enough = A.simStats(many(40, (i) => simRec({ session_date: day(i % 20) })));
  assert.equal(enough.dimmed, false);
  assert.equal(enough.mixedVersions, false);
  assert.equal(A.simStats([simRec(), simRec({ taxonomy_version: '1.3' })]).mixedVersions, true);
});

// the display floor -----------------------------------------------

test('display floor: dimmed when n < 30 OR sessions < 20, otherwise not', () => {
  const make = (n, sessions) => many(n, (i) => live(1, { session_date: day(i % sessions) }));
  const cases = [
    [30, 20, false], // exactly at both floors
    [29, 20, true],  // one trade short
    [30, 19, true],  // one session short, enough trades
    [40, 20, false],
    [200, 5, true],  // many trades, few sessions: "one week's mood"
    [5, 5, true],
  ];
  for (const [n, sessions, dimmed] of cases) {
    const s = A.summary(make(n, sessions)).live;
    assert.deepEqual([s.n, s.sessions, s.dimmed], [n, sessions, dimmed], `n=${n} sessions=${sessions}`);
  }
});

test('display floor: every cohort in every function carries { n, sessions, dimmed }', () => {
  const recs = [live(1, { mae_ticks: 4, mfe_ticks: 8, time_in_trade_seconds: 100 }), live(-1, { session_date: day(1), mae_ticks: 9, mfe_ticks: 4, time_in_trade_seconds: 200 })];
  const hasFloor = (c) => typeof c.n === 'number' && typeof c.sessions === 'number' && typeof c.dimmed === 'boolean';
  for (const c of A.byDimension(recs, 'grade').live) assert.ok(hasFloor(c));
  for (const c of A.byTwo(recs, 'setup', 'trigger').live) assert.ok(hasFloor(c));
  const d = A.disciplineCohorts(recs).live;
  [...d.byGrade, ...d.byExecutionMark, ...d.grid, d.aPlusFail].forEach(c => assert.ok(hasFloor(c)));
  const q = A.sequenceEffects(recs).live;
  [q.firstOfSession, q.afterWin, q.afterLoss, ...q.byTradeNumber].forEach(c => assert.ok(hasFloor(c)));
  const st = A.stopSurvival(recs).live;
  assert.ok(hasFloor(st.winners) && hasFloor(st.losers));
  const du = A.durationSignature(recs).live;
  assert.ok(hasFloor(du.winners) && hasFloor(du.losers));
  A.exitEfficiency(recs).live.bySetup.forEach(c => assert.ok(hasFloor(c)));
  const g = A.gateTwoStatus(recs);
  [...g.bySetup, ...g.byTrigger].forEach(c => assert.ok(hasFloor(c)));
  assert.ok(hasFloor(A.summary(recs).sim) && hasFloor(A.summary(recs).replay));
});

test('display floor: dimmed cohorts are returned, never dropped', () => {
  const r = A.byDimension([live(1)], 'setup').live;
  assert.equal(r.length, 1);
  assert.equal(r[0].dimmed, true);
});

// two dimensions at most ------------------------------------------

test('TWO-DIMENSION CAP: a request for three dimensions throws, however it is made', () => {
  const recs = [live(1)];
  assert.throws(() => A.byDimension(recs, ['setup', 'trigger', 'location']), /capped at 2 dimensions/);
  assert.throws(() => A.byTwo(recs, 'setup', 'trigger', 'location'), /capped at 2 dimensions/);
  assert.throws(() => A.cohorts(recs, ['setup', 'trigger', 'location', 'grade']), /capped at 2 dimensions/);
  assert.doesNotThrow(() => A.byTwo(recs, 'setup', 'trigger'));
  assert.doesNotThrow(() => A.byDimension(recs, ['setup', 'trigger']));
});

test('dimensions: unknown, repeated and empty requests throw', () => {
  const recs = [live(1)];
  assert.throws(() => A.byDimension(recs, 'colour'), /Unknown dimension/);
  assert.throws(() => A.byTwo(recs, 'setup', 'setup'), /only appear once/);
  assert.throws(() => A.cohorts(recs, []), /At least one/);
});

// mixed versions --------------------------------------------------

test('mixedVersions: records whose taxonomy_version differs from the newest are flagged', () => {
  const old = live(1, { taxonomy_version: '1.3', id: '2026-09-01-old01' });
  const cur = [live(1), live(1)];
  const r = A.summary([old, ...cur]);
  assert.equal(r.mixedVersions.mixed, true);
  assert.equal(r.mixedVersions.newest, '1.4');
  assert.deepEqual(r.mixedVersions.versions, { '1.3': 1, '1.4': 2 });
  assert.deepEqual(r.mixedVersions.flagged, ['2026-09-01-old01']);
  assert.equal(r.live.mixedVersions, true, 'the cohort spanning versions says so');
});

test('mixedVersions: a single version is not flagged, and a cohort of one version says false', () => {
  const r = A.summary([live(1), live(2)]);
  assert.deepEqual([r.mixedVersions.mixed, r.mixedVersions.flagged], [false, []]);
  const split = A.byDimension([live(1, { taxonomy_version: '1.3' }), live(1), live(1, { setup: 'gap-fill' })], 'setup');
  const tc = split.live.find(c => c.keys.setup === 'trend-continuation');
  const gf = split.live.find(c => c.keys.setup === 'gap-fill');
  assert.equal(tc.mixedVersions, true);
  assert.equal(gf.mixedVersions, false);
});

test('mixedVersions: 1.10 is newer than 1.9 (numeric, not text, comparison)', () => {
  const r = A.mixedVersions([live(1, { taxonomy_version: '1.9' }), live(1, { taxonomy_version: '1.10' })]);
  assert.equal(r.newest, '1.10');
});

// byDimension / byTwo ---------------------------------------------

test('byDimension: expectancy and n per setup', () => {
  // trend-continuation: +1, +1 -> n 2, expectancy 1.  range-rejection: -1 -> n 1, expectancy -1.
  const r = A.byDimension([live(1), live(1), live(-1, { setup: 'range-rejection' })], 'setup').live;
  assert.deepEqual(r.map(c => [c.keys.setup, c.n]), [['trend-continuation', 2], ['range-rejection', 1]]);
  near(r[0].expectancy, 1); near(r[1].expectancy, -1);
});

test('byDimension: a blank trigger and "none" are one cohort (TAXONOMY 3.6)', () => {
  const r = A.byDimension([live(1, { trigger: null }), live(-1, { trigger: 'none' }), live(2, { trigger: undefined })], 'trigger').live;
  assert.equal(r.length, 1);
  assert.deepEqual([r[0].keys.trigger, r[0].n], ['none', 3]);
  near(r[0].expectancy, 2 / 3);
});

test('byDimension: confirmation cohorts overlap, and no confirmation is "none"', () => {
  // trade A holds two confirmations (+1); trade B holds none (-1).
  // big-orders n1 exp 1, failing-delta n1 exp 1, none n1 exp -1.
  const r = A.byDimension([live(1, { confirmation: ['big-orders', 'failing-delta'] }), live(-1, { confirmation: [] })], 'confirmation').live;
  const get = (k) => r.find(c => c.keys.confirmation === k);
  assert.deepEqual([get('big-orders').n, get('failing-delta').n, get('none').n], [1, 1, 1]);
  near(get('big-orders').expectancy, 1); near(get('none').expectancy, -1);
});

test('byDimension: unmarked execution_mark is its own cohort', () => {
  const r = A.byDimension([live(1, { execution_mark: null }), live(1, { execution_mark: 'Pass' })], 'execution_mark').live;
  assert.deepEqual(r.map(c => c.keys.execution_mark).sort(), ['Pass', 'unmarked']);
});

test('byDimension: 30-minute time buckets, in New York time whatever offset the record uses', () => {
  // 09:52 EDT -> 09:30-10:00.  14:05Z in September = 10:05 EDT -> 10:00-10:30.
  // 10:00 EDT is the start of its bucket -> 10:00-10:30.  15:35Z in December = 10:35 EST -> 10:30-11:00.
  const recs = [
    live(1, { entry_time: '2026-09-29T09:52:00-04:00' }),
    live(1, { entry_time: '2026-09-29T14:05:00Z' }),
    live(1, { entry_time: '2026-09-29T10:00:00-04:00' }),
    live(1, { entry_time: '2026-12-01T15:35:00Z' }),
  ];
  const r = A.byDimension(recs, 'time_bucket').live;
  const byKey = Object.fromEntries(r.map(c => [c.keys.time_bucket, c.n]));
  assert.deepEqual(byKey, { '09:30-10:00': 1, '10:00-10:30': 2, '10:30-11:00': 1 });
});

test('byTwo: expectancy per setup x grade cell', () => {
  // (TC, A): +2, +1 -> n2 exp 1.5.  (TC, B): -1 -> n1.  (RR, A): -1 -> n1.
  const recs = [live(2), live(1), live(-1, { grade: 'B' }), live(-1, { setup: 'range-rejection' })];
  const r = A.byTwo(recs, 'setup', 'grade').live;
  const cell = (s, g) => r.find(c => c.keys.setup === s && c.keys.grade === g);
  assert.equal(cell('trend-continuation', 'A').n, 2);
  near(cell('trend-continuation', 'A').expectancy, 1.5);
  assert.equal(cell('trend-continuation', 'B').n, 1);
  assert.equal(cell('range-rejection', 'A').n, 1);
  assert.equal(r.length, 3);
});

// stopSurvival ----------------------------------------------------

test('stopSurvival: MAE buckets for winners and losers, and the overlap share', () => {
  // winners MAE 2, 6, 10; losers MAE 3, 12, 20; 4-tick buckets from 0 to 24.
  // [0,4): w1 (2) l1 (3)   [4,8): w1 (6)   [8,12): w1 (10)   [12,16): l1 (12)   [16,20): none   [20,24): l1 (20)
  // winner p90 = 6 + 0.8*(10-6) = 9.2 -> only the loser at 3 is within it: 1/3.
  // A breakeven trade is in neither group.
  const recs = [
    ...[2, 6, 10].map((m, i) => live(1, { mae_ticks: m, session_date: day(i) })),
    ...[3, 12, 20].map((m, i) => live(-1, { mae_ticks: m, session_date: day(i) })),
    live(0, { mae_ticks: 5 }),
  ];
  const s = A.stopSurvival(recs).live;
  assert.deepEqual(s.buckets.map(b => [b.fromTicks, b.winners, b.losers]),
    [[0, 1, 1], [4, 1, 0], [8, 1, 0], [12, 0, 1], [16, 0, 0], [20, 0, 1]]);
  assert.equal(s.winners.n, 3); assert.equal(s.losers.n, 3);
  near(s.winners.median, 6); near(s.losers.median, 12); near(s.winners.p90, 9.2);
  near(s.losersWithinWinnerRange, 1 / 3);
});

test('stopSurvival: trades without MAE are left out; bad bucket size throws', () => {
  const s = A.stopSurvival([live(1, { mae_ticks: 2 }), live(-1)]).live;
  assert.equal(s.winners.n + s.losers.n, 1);
  assert.throws(() => A.stopSurvival([], { bucketTicks: 0 }), /positive/);
});

// exitEfficiency --------------------------------------------------

test('exitEfficiency: realized R against MFE in R, per setup', () => {
  // 4-point stop (fill 24000, stop 23996). MNQ tick 0.25 -> 16 ticks = 1R.
  // TC #1: realized +1, MFE 32 ticks = 8 pts = 2R.   TC #2: realized -1, MFE 8 ticks = 2 pts = 0.5R.
  // TC efficiency = (1 + -1) / (2 + 0.5) = 0; mean MFE 1.25; given back mean(2-1, 0.5+1) = 1.25.
  // RR: realized +2, MFE 40 ticks = 10 pts = 2.5R -> efficiency 0.8.
  // A trade with no MFE is counted in `unconverted`.
  const tight = { stop_price: 23996 };
  const recs = [
    live(1, { ...tight, mfe_ticks: 32 }),
    live(-1, { ...tight, mfe_ticks: 8, session_date: day(1) }),
    live(2, { ...tight, mfe_ticks: 40, setup: 'range-rejection' }),
    live(1, { ...tight }),
  ];
  const r = A.exitEfficiency(recs).live;
  const tc = r.bySetup.find(s => s.setup === 'trend-continuation');
  const rr = r.bySetup.find(s => s.setup === 'range-rejection');
  assert.equal(tc.n, 2);
  near(tc.efficiency, 0); near(tc.meanMfeR, 1.25); near(tc.givenBackR, 1.25); near(tc.meanRealizedR, 0);
  near(rr.efficiency, 0.8);
  assert.equal(r.unconverted, 1);
});

// durationSignature -----------------------------------------------

test('durationSignature: time in trade, winners against losers', () => {
  // winners 600, 1200, 1800 s: median 1200, p25 900, p75 1500, mean 1200.
  // losers 300, 900 s: median 600.  loser/winner median = 0.5.
  const recs = [
    ...[600, 1200, 1800].map((t) => live(1, { time_in_trade_seconds: t })),
    ...[300, 900].map((t) => live(-1, { time_in_trade_seconds: t })),
  ];
  const d = A.durationSignature(recs).live;
  near(d.winners.medianSeconds, 1200); near(d.winners.p25Seconds, 900); near(d.winners.p75Seconds, 1500); near(d.winners.meanSeconds, 1200);
  near(d.losers.medianSeconds, 600);
  near(d.loserToWinnerMedian, 0.5);
  assert.equal(d.winners.n, 3); assert.equal(d.losers.n, 2);
});

// sequenceEffects -------------------------------------------------

test('sequenceEffects: trade number within a session, and the trade after a win', () => {
  // Session A (09-01): 09:40 +1, 10:00 -1, 10:30 +2.   Session B (09-02): 09:35 -1, 09:50 +1, 11:00 open.
  // trade 1: A1 +1, B1 -1 -> n2, expectancy 0.   trade 2: A2 -1, B2 +1 -> n2, expectancy 0.
  // trade 3: A3 +2 -> n1 (B3 is open, so it has no outcome).
  // after a win: A2 (-1) -> n1, expectancy -1.   after a loss: A3 (+2), B2 (+1) -> n2, expectancy 1.5.
  // The records are passed out of order on purpose.
  const open = rec({ session_date: '2026-09-02', entry_time: '2026-09-02T11:00:00-04:00' }); delete open.r_multiple;
  const recs = [
    live(2,  { session_date: '2026-09-01', entry_time: '2026-09-01T10:30:00-04:00' }),
    live(1,  { session_date: '2026-09-02', entry_time: '2026-09-02T09:50:00-04:00' }),
    live(1,  { session_date: '2026-09-01', entry_time: '2026-09-01T09:40:00-04:00' }),
    open,
    live(-1, { session_date: '2026-09-02', entry_time: '2026-09-02T09:35:00-04:00' }),
    live(-1, { session_date: '2026-09-01', entry_time: '2026-09-01T10:00:00-04:00' }),
  ];
  const q = A.sequenceEffects(recs).live;
  const num = (k) => q.byTradeNumber.find(c => c.tradeNumber === k);
  assert.deepEqual([num('1').n, num('2').n, num('3').n], [2, 2, 1]);
  near(num('1').expectancy, 0); near(num('2').expectancy, 0); near(num('3').expectancy, 2);
  assert.equal(q.afterWin.n, 1); near(q.afterWin.expectancy, -1);
  assert.equal(q.afterLoss.n, 2); near(q.afterLoss.expectancy, 1.5);
  assert.equal(q.firstOfSession.n, 2); near(q.firstOfSession.expectancy, 0);
});

test('sequenceEffects: trades four and later share one "4+" cohort', () => {
  const times = ['09:00', '09:30', '10:00', '10:30', '11:00'];
  const recs = times.map((hhmm) => live(1, { entry_time: `2026-09-01T${hhmm}:00-04:00` }));
  const q = A.sequenceEffects(recs).live;
  assert.deepEqual(q.byTradeNumber.map(c => [c.tradeNumber, c.n]), [['1', 1], ['2', 1], ['3', 1], ['4+', 2]]);
});

// disciplineCohorts -----------------------------------------------

test('disciplineCohorts: by grade, by execution mark, and the A+/Fail cell', () => {
  // A+/Pass +2; A+/Fail -1; A+/Fail -0.5; A/Pass +1; B/Fail -1.
  // by grade: A+ n3 exp (2-1-0.5)/3; A n1 exp 1; B n1 exp -1.
  // by mark: Pass n2 exp 1.5; Fail n3 exp (-1-0.5-1)/3.   A+/Fail: n2, exp -0.75.
  const recs = [
    live(2,    { grade: 'A+', execution_mark: 'Pass' }),
    live(-1,   { grade: 'A+', execution_mark: 'Fail' }),
    live(-0.5, { grade: 'A+', execution_mark: 'Fail' }),
    live(1,    { grade: 'A',  execution_mark: 'Pass' }),
    live(-1,   { grade: 'B',  execution_mark: 'Fail' }),
  ];
  const d = A.disciplineCohorts(recs).live;
  const g = (k) => d.byGrade.find(c => c.keys.grade === k);
  const m = (k) => d.byExecutionMark.find(c => c.keys.execution_mark === k);
  assert.deepEqual([g('A+').n, g('A').n, g('B').n], [3, 1, 1]);
  near(g('A+').expectancy, 0.5 / 3); near(g('A').expectancy, 1); near(g('B').expectancy, -1);
  assert.deepEqual([m('Pass').n, m('Fail').n], [2, 3]);
  near(m('Pass').expectancy, 1.5); near(m('Fail').expectancy, -2.5 / 3);
  assert.equal(d.aPlusFail.n, 2); near(d.aPlusFail.expectancy, -0.75);
  assert.equal(d.grid.length, 4);
});

test('disciplineCohorts: with no A+/Fail trades the cell is present and empty', () => {
  const d = A.disciplineCohorts([live(1)]).live;
  assert.deepEqual([d.aPlusFail.n, d.aPlusFail.expectancy], [0, null]);
});

// gateTwoStatus ---------------------------------------------------

const gateRow = (g, dim, key) => (dim === 'setup' ? g.bySetup : g.byTrigger).find(r => r.key === key);
// n live trend-continuation trades across `sessions` sessions with the given R values.
const gateSet = (n, sessions, r) => many(n, (i) => live(typeof r === 'function' ? r(i) : r, { session_date: day(i % sessions) }));

test('gateTwoStatus: met at exactly 30 live trades, 20 sessions, +0.3R', () => {
  const row = gateRow(A.gateTwoStatus(gateSet(30, 20, 0.3)), 'setup', 'trend-continuation');
  assert.equal(row.n, 30); assert.equal(row.sessions, 20);
  near(row.expectancy, 0.3);
  assert.equal(row.met, true);
  assert.deepEqual(row.reasons, []);
});

test('gateTwoStatus: not met when any one threshold is missed', () => {
  const g = (recs) => gateRow(A.gateTwoStatus(recs), 'setup', 'trend-continuation');
  const tooFew = g(gateSet(29, 20, 0.5));
  assert.equal(tooFew.met, false); assert.match(tooFew.reasons.join(), /29 live trades, need 30/);
  const tooFewSessions = g(gateSet(30, 19, 0.5));
  assert.equal(tooFewSessions.met, false); assert.match(tooFewSessions.reasons.join(), /19 distinct sessions, need 20/);
  const tooLow = g(gateSet(30, 20, 0.29));
  assert.equal(tooLow.met, false); assert.match(tooLow.reasons.join(), /need 0.3R/);
  assert.equal(g([]).met, false);
});

test('gateTwoStatus: expectancy is after commissions, so fees can sink a row that is above 0.3R gross', () => {
  // gross +0.32R per trade; 10-point stop, 1 contract = $20 risk; $0.80 fees = 0.04R -> net 0.28R.
  const recs = gateSet(30, 20, 0.32).map(r => ({ ...r, commissions: 0.8 }));
  const row = gateRow(A.gateTwoStatus(recs), 'setup', 'trend-continuation');
  near(row.grossExpectancy, 0.32); near(row.expectancy, 0.28);
  assert.equal(row.met, false);
});

test('gateTwoStatus: not declared met when commissions are missing, even if the numbers clear', () => {
  const recs = gateSet(30, 20, 0.5).map(r => ({ ...r, commissions: null }));
  const row = gateRow(A.gateTwoStatus(recs), 'setup', 'trend-continuation');
  assert.equal(row.commissionsComplete, false);
  assert.equal(row.met, false);
  assert.match(row.reasons.join(), /commissions/);
});

test('gateTwoStatus: sim and replay trades never count toward the live n, and show beside it', () => {
  // 29 live trades just miss; 100 sim and 100 replay trades must not rescue the row.
  const recs = [
    ...gateSet(29, 20, 0.5),
    ...many(100, (i) => rec({ environment: 'sim', r_multiple: 5, session_date: day(i % 25) })),
    ...many(100, (i) => rec({ environment: 'replay', r_multiple: 5, session_date: day(i % 25) })),
  ];
  const row = gateRow(A.gateTwoStatus(recs), 'setup', 'trend-continuation');
  assert.equal(row.n, 29);
  assert.equal(row.met, false);
  assert.equal(row.simTrades, 100);
  assert.equal(row.replayTrades, 100);
});

test('gateTwoStatus: one row per setup and per trigger in the taxonomy, including empty ones', () => {
  const g = A.gateTwoStatus([live(1)]);
  assert.deepEqual(g.bySetup.map(r => r.key), ['trend-continuation', 'range-rejection', 'gap-fill', 'gap-n-go', 'no-setup']);
  assert.deepEqual(g.byTrigger.map(r => r.key), ['pause-n-go', 'resting-limit', 'ema-pullback', 'level-reclaim', 'none']);
  assert.equal(gateRow(g, 'setup', 'gap-fill').n, 0);
  assert.deepEqual(g.gate, { minLiveTrades: 30, minSessions: 20, minExpectancyR: 0.3 });
});

test('gateTwoStatus: a blank trigger counts under "none"', () => {
  assert.equal(gateRow(A.gateTwoStatus([live(1, { trigger: null })]), 'trigger', 'none').n, 1);
});

// purity ----------------------------------------------------------

test('analysis.js is pure: it imports only schema.js and touches no storage, DOM or network', () => {
  const src = readFileSync(path.join(ROOT, 'js', 'journal', 'analysis.js'), 'utf8');
  const imports = [...src.matchAll(/^import .* from '([^']+)';/gm)].map(m => m[1]);
  assert.deepEqual(imports, ['./schema.js']);
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  for (const banned of ['document', 'window', 'localStorage', 'sessionStorage', 'indexedDB', 'fetch(', 'XMLHttpRequest', 'process.', 'require(', 'Math.random', 'Date.now', 'new Date()']) {
    assert.ok(!code.includes(banned), `analysis.js must not use ${banned}`);
  }
});

test('analysis functions do not mutate the records they are given', () => {
  const recs = [live(1, { mae_ticks: 4, mfe_ticks: 8, time_in_trade_seconds: 100 }), live(-1, { session_date: day(1) })];
  const before = JSON.stringify(recs);
  A.summary(recs); A.byDimension(recs, 'setup'); A.byTwo(recs, 'setup', 'grade'); A.stopSurvival(recs);
  A.exitEfficiency(recs); A.durationSignature(recs); A.sequenceEffects(recs); A.disciplineCohorts(recs); A.gateTwoStatus(recs);
  assert.equal(JSON.stringify(recs), before);
});

test('non-array input throws a TypeError', () => {
  assert.throws(() => A.summary('nope'), TypeError);
});

// ── Run ───────────────────────────────────────────────────────

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${name}\n    ${String(e && e.message ? e.message : e).split('\n').join('\n    ')}`);
  }
}
console.log('─'.repeat(40));
console.log(`${tests.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
