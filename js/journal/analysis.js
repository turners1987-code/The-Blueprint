/* ============================================================
   THE BLUEPRINT — Journal analysis (js/journal/analysis.js)
   ============================================================
   Pure functions over an array of trade records. No storage, no
   DOM, no I/O: records in, data out.

   The rules of reference/TAXONOMY.md section 6 are enforced here,
   not left to the caller:

   1. SIM RULE (6.4). Sim and replay trades are never pooled into any
      expectancy figure. Every function returns one series per
      environment: `live` carries the statistics; `sim` and `replay`
      carry occurrence counts only (n, sessions, dimmed, expectancy
      null), because sim counts occurrences and never measures edge.
      The only code that computes R-based figures, cohortStats(),
      throws if it is handed a record that is not live, so there is
      no path by which a sim trade reaches an expectancy.
   2. DISPLAY FLOOR (6.4). Every cohort carries { n, sessions, dimmed };
      dimmed is true when n < 30 OR distinct sessions < 20. Dimmed
      cohorts are returned, never dropped.
   3. TWO DIMENSIONS AT MOST (6.4). A request for three throws.
   4. MIXED VERSIONS (section 0). Every result has a mixedVersions
      report, and each cohort says whether it spans taxonomy versions.

   Every cohort counts closed trades only (a numeric r_multiple); open
   trades are reported in `open`.

   R figures are NET of commissions where that can be worked out
   (Gate 2 is "after commissions", 6.2): commissions in dollars are
   divided by the trade's risk in dollars (distance from fill to stop
   x point value x size). Where it cannot (unknown instrument, missing
   stop or size, commissions not recorded) the trade's gross R is used
   and the cohort's `unpriced` counts it, so a figure never silently
   overstates itself.
   ============================================================ */

import { SETUPS, TRIGGERS } from './schema.js';

// ── Constants ─────────────────────────────────────────────────

// Section 6.4: cohorts are capped at two dimensions.
export const MAX_DIMENSIONS = 2;

// Section 6.4: dim a cohort below this many trades OR below this many
// distinct sessions. Dim means shown with a warning, never suppressed.
export const DISPLAY_FLOOR = { minTrades: 30, minSessions: 20 };

// Section 6.2, Gate 2: own execution.
export const GATE2 = { minLiveTrades: 30, minSessions: 20, minExpectancyR: 0.3 };

export const DIMENSIONS = [
  'setup', 'location', 'trigger', 'confirmation', 'grade', 'execution_mark', 'time_bucket',
];

// Contract specifications, used to turn ticks and dollars into R. Pass
// { instruments } to any function to add or override entries.
export const INSTRUMENTS = {
  MNQ: { tickSize: 0.25, pointValue: 2 },
  MES: { tickSize: 0.25, pointValue: 5 },
  MGC: { tickSize: 0.1,  pointValue: 10 },
  MCL: { tickSize: 0.01, pointValue: 100 },
};

const ENVIRONMENTS = ['live', 'sim', 'replay'];
const BUCKET_MINUTES = 30;
const EXCHANGE_TZ = 'America/New_York';

// ── Small numeric helpers ─────────────────────────────────────

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const mean = (xs) => (xs.length ? sum(xs) / xs.length : null);

// Linear-interpolated percentile (p in 0..1) of a list of numbers.
function percentile(xs, p) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

const distinct = (xs) => new Set(xs).size;

// ── Record helpers ────────────────────────────────────────────

const isClosed = (rec) => isNum(rec && rec.r_multiple);

const envOf = (rec) => (rec && ENVIRONMENTS.includes(rec.environment) ? rec.environment : null);

// Splits records by environment. Records with a missing or unknown
// environment are analysed nowhere and only counted.
function partition(records) {
  if (!Array.isArray(records)) throw new TypeError('records must be an array');
  const out = { live: [], sim: [], replay: [], unknown: 0 };
  for (const rec of records) {
    const env = envOf(rec);
    if (env) out[env].push(rec); else out.unknown++;
  }
  return out;
}

const spec = (rec, instruments) => (instruments || INSTRUMENTS)[rec.instrument] || null;

// Distance in price points from the fill to the stop, or null.
function riskPoints(rec) {
  const fill = isNum(rec.actual_fill) ? rec.actual_fill : rec.intended_price;
  if (!isNum(fill) || !isNum(rec.stop_price)) return null;
  const pts = Math.abs(fill - rec.stop_price);
  return pts > 0 ? pts : null;
}

// Gross and net R for one closed trade. `priced` says whether the net
// figure really reflects commissions.
function rValues(rec, instruments) {
  const gross = rec.r_multiple;
  const fee = rec.commissions;
  if (!isNum(fee)) return { gross, net: gross, priced: false };
  if (fee === 0) return { gross, net: gross, priced: true };
  const s = spec(rec, instruments);
  const pts = riskPoints(rec);
  if (!s || pts === null || !isNum(rec.size) || rec.size < 1) return { gross, net: gross, priced: false };
  const riskDollars = pts * s.pointValue * rec.size;
  return { gross, net: gross - fee / riskDollars, priced: true };
}

// MFE or MAE in R, or null when it cannot be worked out.
function ticksToR(rec, ticks, instruments) {
  const s = spec(rec, instruments);
  const pts = riskPoints(rec);
  if (!s || pts === null || !isNum(ticks)) return null;
  return (ticks * s.tickSize) / pts;
}

// "09:30-10:00": the 30-minute bucket of the entry time, in exchange
// (New York) time whatever offset the record was written with.
const tzFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: EXCHANGE_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
function timeBucket(entryTime) {
  const ms = Date.parse(entryTime);
  if (!isNum(ms)) return 'unknown';
  const parts = Object.fromEntries(tzFormat.formatToParts(new Date(ms)).map(p => [p.type, p.value]));
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const start = Math.floor(minutes / BUCKET_MINUTES) * BUCKET_MINUTES;
  const end = start + BUCKET_MINUTES;
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return `${hhmm(start)}-${hhmm(end)}`;
}

// ── Mixed taxonomy versions ───────────────────────────────────

const parseVersion = (v) => {
  const m = typeof v === 'string' ? /^([0-9]+)[.]([0-9]+)$/.exec(v) : null;
  return m ? [Number(m[1]), Number(m[2])] : null;
};
const compareVersions = (a, b) => (a[0] - b[0]) || (a[1] - b[1]);

// { mixed, newest, versions: { "1.4": 12, ... }, flagged: [ids] }.
// `flagged` lists the records whose taxonomy_version differs from the
// newest in the set (by id, or by position when a record has no id).
export function mixedVersions(records) {
  const versions = {};
  let newest = null;
  for (const rec of records) {
    const v = rec && rec.taxonomy_version;
    versions[v] = (versions[v] || 0) + 1;
    const p = parseVersion(v);
    if (p && (newest === null || compareVersions(p, parseVersion(newest)) > 0)) newest = v;
  }
  const flagged = [];
  records.forEach((rec, i) => {
    if (rec && rec.taxonomy_version !== newest) flagged.push(rec.id || `#${i + 1}`);
  });
  return { mixed: Object.keys(versions).length > 1, newest, versions, flagged };
}

const spansVersions = (recs) => distinct(recs.map(r => r.taxonomy_version)) > 1;

// ── Cohort statistics ─────────────────────────────────────────

const withFloor = (n, sessions) => ({
  n,
  sessions,
  dimmed: n < DISPLAY_FLOOR.minTrades || sessions < DISPLAY_FLOOR.minSessions,
});

// Statistics for LIVE closed trades. This is the only function in this
// module that computes expectancy, and it refuses anything that is not
// live: sim and replay can never reach it.
export function cohortStats(records, { instruments } = {}) {
  for (const rec of records) {
    if (!rec || rec.environment !== 'live') {
      throw new Error(`cohortStats() takes live trades only (got environment "${rec && rec.environment}"). Sim and replay are never pooled into an expectancy.`);
    }
  }
  const closed = records.filter(isClosed);
  const values = closed.map(r => rValues(r, instruments));
  const net = values.map(v => v.net);
  const gross = values.map(v => v.gross);
  const wins = net.filter(x => x > 0);
  const losses = net.filter(x => x < 0);
  const lossSum = Math.abs(sum(losses));
  const n = closed.length;
  return {
    ...withFloor(n, distinct(closed.map(r => r.session_date))),
    wins: wins.length,
    losses: losses.length,
    breakeven: n - wins.length - losses.length,
    winRate: n ? wins.length / n : null,
    expectancy: mean(net),
    grossExpectancy: mean(gross),
    totalR: n ? sum(net) : null,
    grossTotalR: n ? sum(gross) : null,
    profitFactor: n && lossSum > 0 ? sum(wins) / lossSum : null,
    avgWinR: mean(wins),
    avgLossR: mean(losses),
    unpriced: values.filter(v => !v.priced).length,
    mixedVersions: spansVersions(closed),
  };
}

// What sim and replay get: occurrence counts, and nothing that measures edge.
export function occurrenceStats(records, series) {
  const closed = records.filter(isClosed);
  return {
    ...withFloor(closed.length, distinct(closed.map(r => r.session_date))),
    series,
    expectancy: null,
    note: 'Occurrence count only. Sim and replay never measure edge and are never pooled into an expectancy.',
    mixedVersions: spansVersions(closed),
  };
}

// Behaviour and occurrence for SIM closed trades: the mirror image of
// cohortStats(). It refuses live records, so the two are mutually exclusive
// by construction. It carries no win rate, win/loss count, R total or
// expectancy: NinjaTrader fills sim limits on touch, so sim outcomes
// overstate edge and only occurrence and behaviour are meaningful.
// Count objects are keyed by value; unclassified records land under the
// key "null" (what a null property key becomes in an object).
export function simStats(records, { instruments } = {}) {
  for (const rec of records) {
    if (!rec || rec.environment === 'live') {
      throw new Error('simStats() takes sim and replay trades only (got a live record). Live trades go through cohortStats(); the two are never mixed.');
    }
  }
  const closed = records.filter(isClosed);
  const countBy = (field) => {
    const out = {};
    for (const r of closed) {
      const k = r[field] ?? null;
      out[k] = (out[k] || 0) + 1;
    }
    return out;
  };
  const medianOf = (field) => percentile(closed.map(r => r[field]).filter(isNum), 0.5);

  // Positive = a worse fill than intended (long paid up, short sold down).
  const slips = [];
  for (const r of closed) {
    const s = spec(r, instruments);
    if (!s || !isNum(r.intended_price) || !isNum(r.actual_fill)) continue;
    if (r.direction !== 'long' && r.direction !== 'short') continue;
    const points = r.direction === 'long' ? r.actual_fill - r.intended_price : r.intended_price - r.actual_fill;
    slips.push(points / s.tickSize);
  }

  return {
    ...withFloor(closed.length, distinct(closed.map(r => r.session_date))),
    counts: {
      setup: countBy('setup'),
      location: countBy('location'),
      grade: countBy('grade'),
      instrument: countBy('instrument'),
      direction: countBy('direction'),
    },
    unclassified: closed.filter(r => r.setup == null || r.location == null || r.grade == null).length,
    maeTicksMedian: medianOf('mae_ticks'),
    mfeTicksMedian: medianOf('mfe_ticks'),
    timeInTradeSecondsMedian: medianOf('time_in_trade_seconds'),
    slippage: {
      n: slips.length,
      medianTicks: percentile(slips, 0.5),
      worstTicks: slips.length ? Math.max(...slips) : null,
    },
    expectancy: null,
    note: 'Occurrence and behaviour only. Sim never measures edge and is never pooled into an expectancy.',
    mixedVersions: spansVersions(closed),
  };
}

const statsFor = (env, records, options) =>
  (env === 'live' ? cohortStats(records, options) : occurrenceStats(records, env));

// Runs build(recordsOfOneEnvironment, env) once per environment and
// labels each series. The series are never merged.
function perEnvironment(records, build) {
  const p = partition(records);
  const open = records.filter(r => r && !isClosed(r)).length;
  return {
    live: build(p.live, 'live'),
    sim: build(p.sim, 'sim'),
    replay: build(p.replay, 'replay'),
    open,
    unknownEnvironment: p.unknown,
    mixedVersions: mixedVersions(records),
  };
}

// ── Grouping by dimension ─────────────────────────────────────

// The values a record takes on a dimension (an array: confirmation can
// hold several, so confirmation cohorts overlap).
function valuesOf(rec, dim) {
  switch (dim) {
    case 'setup': return [rec.setup ?? 'unknown'];
    case 'location': return [rec.location ?? 'unknown'];
    case 'trigger': return [rec.trigger ?? 'none']; // blank and "none" mean the same (3.6)
    case 'confirmation':
      return Array.isArray(rec.confirmation) && rec.confirmation.length ? rec.confirmation : ['none'];
    case 'grade': return [rec.grade ?? 'unknown'];
    case 'execution_mark': return [rec.execution_mark ?? 'unmarked'];
    case 'time_bucket': return [timeBucket(rec.entry_time)];
    default: throw new Error(`Unknown dimension "${dim}". Use one of: ${DIMENSIONS.join(', ')}.`);
  }
}

function checkDimensions(dims) {
  if (!Array.isArray(dims) || dims.length < 1) throw new Error('At least one dimension is required.');
  if (dims.length > MAX_DIMENSIONS) {
    throw new Error(`Cohorts are capped at ${MAX_DIMENSIONS} dimensions (got ${dims.length}: ${dims.join(', ')}). Three-way cells are too small to mean anything (TAXONOMY 6.4).`);
  }
  if (new Set(dims).size !== dims.length) throw new Error('A dimension can only appear once.');
  for (const d of dims) if (!DIMENSIONS.includes(d)) throw new Error(`Unknown dimension "${d}". Use one of: ${DIMENSIONS.join(', ')}.`);
}

// Cohorts of one environment's closed trades over 1 or 2 dimensions.
function groupCohorts(records, dims, env, options) {
  const groups = new Map();
  for (const rec of records.filter(isClosed)) {
    let combos = [[]];
    for (const dim of dims) {
      combos = combos.flatMap(prefix => valuesOf(rec, dim).map(v => [...prefix, v]));
    }
    for (const combo of combos) {
      const key = combo.join(' | ');
      if (!groups.has(key)) groups.set(key, { combo, recs: [] });
      groups.get(key).recs.push(rec);
    }
  }
  return [...groups.values()]
    .map(({ combo, recs }) => ({
      keys: Object.fromEntries(dims.map((d, i) => [d, combo[i]])),
      ...statsFor(env, recs, options),
    }))
    .sort((a, b) => (b.n - a.n) || JSON.stringify(a.keys).localeCompare(JSON.stringify(b.keys)));
}

// General entry point: cohorts over an array of 1 or 2 dimensions.
// Throws for more than two.
export function cohorts(records, dims, options = {}) {
  checkDimensions(dims);
  return {
    dimensions: dims,
    ...perEnvironment(records, (recs, env) => groupCohorts(recs, dims, env, options)),
  };
}

export function byDimension(records, dim, options = {}) {
  return cohorts(records, Array.isArray(dim) ? dim : [dim], options);
}

// The trailing rest parameter exists so a third dimension is refused loudly
// instead of being ignored.
export function byTwo(records, dimA, dimB, ...extra) {
  if (extra.length) checkDimensions([dimA, dimB, ...extra]);
  return cohorts(records, [dimA, dimB]);
}

// ── summary ───────────────────────────────────────────────────

// Count, win rate, expectancy in R, profit factor and total R for live
// trades; occurrence counts for sim and replay.
export function summary(records, options = {}) {
  return perEnvironment(records, (recs, env) => statsFor(env, recs, options));
}

// ── stopSurvival ──────────────────────────────────────────────

const describeSpread = (xs) => ({
  median: percentile(xs, 0.5),
  p90: percentile(xs, 0.9),
  max: xs.length ? Math.max(...xs) : null,
});

// MAE (in ticks) for winners and losers separately, bucketed so the
// overlap between them is visible. Breakeven trades are in neither.
// `losersWithinWinnerRange` is the share of losers whose MAE did not
// exceed the winners' 90th percentile: a high share means winners and
// losers cannot be told apart by how far they went against you.
export function stopSurvival(records, { bucketTicks = 4, instruments } = {}) {
  if (!(isNum(bucketTicks) && bucketTicks > 0)) throw new Error('bucketTicks must be a positive number.');
  return perEnvironment(records, (recs, env) => {
    if (env !== 'live') return occurrenceStats(recs, env);
    const closed = recs.filter(r => isClosed(r) && isNum(r.mae_ticks) && r.mae_ticks >= 0);
    const net = (r) => rValues(r, instruments).net;
    const winners = closed.filter(r => net(r) > 0);
    const losers = closed.filter(r => net(r) < 0);
    const wMae = winners.map(r => r.mae_ticks);
    const lMae = losers.map(r => r.mae_ticks);
    const top = Math.max(0, ...wMae, ...lMae);
    const buckets = [];
    for (let from = 0; from <= top; from += bucketTicks) {
      const to = from + bucketTicks;
      const inBucket = (x) => x >= from && x < to;
      buckets.push({ fromTicks: from, toTicks: to, winners: wMae.filter(inBucket).length, losers: lMae.filter(inBucket).length });
    }
    const wP90 = percentile(wMae, 0.9);
    return {
      bucketTicks,
      buckets,
      winners: { ...withFloor(winners.length, distinct(winners.map(r => r.session_date))), ...describeSpread(wMae) },
      losers: { ...withFloor(losers.length, distinct(losers.map(r => r.session_date))), ...describeSpread(lMae) },
      losersWithinWinnerRange: wP90 === null || !lMae.length ? null : lMae.filter(x => x <= wP90).length / lMae.length,
      mixedVersions: spansVersions(closed),
    };
  });
}

// ── exitEfficiency ────────────────────────────────────────────

// Realized R against MFE in R, per setup. Realized and MFE are both
// gross of commissions so the ratio compares price movement only.
//   efficiency = total realized R / total MFE R (trades with MFE > 0)
//   givenBackR = mean of (MFE R - realized R)
// Trades without MFE, a stop, or a known instrument are left out and
// counted in `unconverted`.
export function exitEfficiency(records, { instruments } = {}) {
  return perEnvironment(records, (recs, env) => {
    if (env !== 'live') return occurrenceStats(recs, env);
    const bySetup = new Map();
    let unconverted = 0;
    for (const rec of recs.filter(isClosed)) {
      const mfeR = ticksToR(rec, rec.mfe_ticks, instruments);
      if (mfeR === null) { unconverted++; continue; }
      const key = rec.setup ?? 'unknown';
      if (!bySetup.has(key)) bySetup.set(key, []);
      bySetup.get(key).push({ rec, realized: rec.r_multiple, mfeR });
    }
    const rows = [...bySetup.entries()].map(([setup, items]) => {
      const realized = items.map(i => i.realized);
      const mfe = items.map(i => i.mfeR);
      const mfeTotal = sum(mfe);
      return {
        setup,
        ...withFloor(items.length, distinct(items.map(i => i.rec.session_date))),
        meanRealizedR: mean(realized),
        meanMfeR: mean(mfe),
        efficiency: mfeTotal > 0 ? sum(realized) / mfeTotal : null,
        givenBackR: mean(items.map(i => i.mfeR - i.realized)),
        mixedVersions: spansVersions(items.map(i => i.rec)),
      };
    }).sort((a, b) => (b.n - a.n) || a.setup.localeCompare(b.setup));
    return { bySetup: rows, unconverted };
  });
}

// ── durationSignature ─────────────────────────────────────────

const describeDuration = (items) => ({
  ...withFloor(items.length, distinct(items.map(r => r.session_date))),
  meanSeconds: mean(items.map(r => r.time_in_trade_seconds)),
  medianSeconds: percentile(items.map(r => r.time_in_trade_seconds), 0.5),
  p25Seconds: percentile(items.map(r => r.time_in_trade_seconds), 0.25),
  p75Seconds: percentile(items.map(r => r.time_in_trade_seconds), 0.75),
  mixedVersions: spansVersions(items),
});

// Time in trade, winners against losers. `loserToWinnerMedian` above 1
// means losers are held longer than winners.
export function durationSignature(records, { instruments } = {}) {
  return perEnvironment(records, (recs, env) => {
    if (env !== 'live') return occurrenceStats(recs, env);
    const closed = recs.filter(r => isClosed(r) && isNum(r.time_in_trade_seconds));
    const winners = closed.filter(r => rValues(r, instruments).net > 0);
    const losers = closed.filter(r => rValues(r, instruments).net < 0);
    const w = describeDuration(winners);
    const l = describeDuration(losers);
    return {
      winners: w,
      losers: l,
      loserToWinnerMedian: w.medianSeconds && l.medianSeconds !== null ? l.medianSeconds / w.medianSeconds : null,
    };
  });
}

// ── sequenceEffects ───────────────────────────────────────────

const ordinalKey = (n) => (n >= 4 ? '4+' : String(n));

// Expectancy by trade number within a session (1, 2, 3, 4+), and by what
// the previous trade of the same session did: afterWin, afterLoss,
// afterBreakeven, plus firstOfSession. Trades are ordered by entry time
// within a session; a trade whose predecessor is still open (or has no
// outcome) is in neither "after" cohort.
export function sequenceEffects(records, options = {}) {
  return perEnvironment(records, (recs, env) => {
    if (env !== 'live') return occurrenceStats(recs, env);
    const sessions = new Map();
    for (const rec of recs) {
      if (!sessions.has(rec.session_date)) sessions.set(rec.session_date, []);
      sessions.get(rec.session_date).push(rec);
    }
    const byNumber = new Map();
    const bucket = { firstOfSession: [], afterWin: [], afterLoss: [], afterBreakeven: [] };
    for (const list of sessions.values()) {
      list.sort((a, b) => (Date.parse(a.entry_time) - Date.parse(b.entry_time)) || String(a.id).localeCompare(String(b.id)));
      list.forEach((rec, i) => {
        if (!isClosed(rec)) return;
        const key = ordinalKey(i + 1);
        if (!byNumber.has(key)) byNumber.set(key, []);
        byNumber.get(key).push(rec);
        if (i === 0) { bucket.firstOfSession.push(rec); return; }
        const prev = list[i - 1];
        if (!isClosed(prev)) return;
        const r = rValues(prev, options.instruments).net;
        (r > 0 ? bucket.afterWin : r < 0 ? bucket.afterLoss : bucket.afterBreakeven).push(rec);
      });
    }
    return {
      byTradeNumber: ['1', '2', '3', '4+']
        .filter(k => byNumber.has(k))
        .map(k => ({ tradeNumber: k, ...cohortStats(byNumber.get(k), options) })),
      firstOfSession: cohortStats(bucket.firstOfSession, options),
      afterWin: cohortStats(bucket.afterWin, options),
      afterLoss: cohortStats(bucket.afterLoss, options),
      afterBreakeven: cohortStats(bucket.afterBreakeven, options),
    };
  });
}

// ── disciplineCohorts ─────────────────────────────────────────

// Expectancy split by grade (entry-plan compliance) and by execution
// mark (exit compliance), and the two together. `aPlusFail` is the cell
// TAXONOMY 5.2 calls the most instructive: right plan, wrong finish.
export function disciplineCohorts(records, options = {}) {
  return perEnvironment(records, (recs, env) => {
    const grid = groupCohorts(recs, ['grade', 'execution_mark'], env, options);
    const cell = grid.find(c => c.keys.grade === 'A+' && c.keys.execution_mark === 'Fail');
    return {
      byGrade: groupCohorts(recs, ['grade'], env, options),
      byExecutionMark: groupCohorts(recs, ['execution_mark'], env, options),
      grid,
      aPlusFail: cell || { keys: { grade: 'A+', execution_mark: 'Fail' }, ...statsFor(env, [], options) },
    };
  });
}

// ── gateTwoStatus ─────────────────────────────────────────────

// Per setup and per trigger: live trades, distinct sessions, expectancy
// (after commissions) and whether Gate 2 is met (6.2): at least 30 live
// trades, across at least 20 distinct sessions, expectancy of at least
// +0.3R. Sim and replay counts sit beside each row, labelled, and are
// never part of the live figures (6.4: every Gate 2 count shows its
// live/sim split).
//
// `met` is strict: it is true only when all three thresholds hold AND
// every live trade in the row had its commissions applied. If any did
// not (`unpriced` > 0) the expectancy may be overstated, so the gate is
// not declared met and `reasons` says why.
export function gateTwoStatus(records, options = {}) {
  const p = partition(records);
  const closed = (list) => list.filter(isClosed);

  const row = (dim, key) => {
    const inRow = (r) => valuesOf(r, dim).includes(key);
    const live = closed(p.live).filter(inRow);
    const stats = cohortStats(live, options);
    const reasons = [];
    if (stats.n < GATE2.minLiveTrades) reasons.push(`${stats.n} live trades, need ${GATE2.minLiveTrades}`);
    if (stats.sessions < GATE2.minSessions) reasons.push(`${stats.sessions} distinct sessions, need ${GATE2.minSessions}`);
    // The epsilon keeps a mean of exactly +0.3R from failing on float rounding.
    if (stats.n && !(stats.expectancy >= GATE2.minExpectancyR - 1e-9)) {
      reasons.push(`expectancy ${stats.expectancy.toFixed(2)}R, need ${GATE2.minExpectancyR}R`);
    }
    if (!stats.n) reasons.push('no live trades');
    if (stats.unpriced > 0) reasons.push(`${stats.unpriced} trade(s) without commissions applied; expectancy may be overstated`);
    return {
      key,
      ...stats,
      commissionsComplete: stats.unpriced === 0,
      met: reasons.length === 0,
      reasons,
      // Separate, labelled, and never added to the live figures above.
      simTrades: closed(p.sim).filter(inRow).length,
      replayTrades: closed(p.replay).filter(inRow).length,
    };
  };

  return {
    gate: GATE2,
    bySetup: SETUPS.map(s => row('setup', s.slug)),
    byTrigger: TRIGGERS.map(t => row('trigger', t.slug)),
    open: records.filter(r => r && !isClosed(r)).length,
    unknownEnvironment: p.unknown,
    mixedVersions: mixedVersions(records),
  };
}
