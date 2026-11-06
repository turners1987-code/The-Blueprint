// Synthetic 5-minute bars for the lesson drills and slide chart snippets.
// Every price is invented. Nothing here comes from a real session.
//
// The bars are built the way real ones form: each bar is a short random walk of
// sub-steps (so wicks and bodies vary), per-bar volatility clusters, and the
// colour of a bar follows the walk rather than a script. A regime gives the walk
// a drift: approach the level, test it (wicks touch, nothing closes beyond it),
// then reject. The extreme of each edge round is printed by exactly one bar and
// never exceeded, which is what the drill's answer checks.
//
// Deterministic: fixed seeds, so npm test and the slides are stable.
//
// A chart's story is data: { seed, start, regimes, pin?, answer?, line? }.
//   regimes: [{ kind, n, drift, vol, cap?, center? } | { kind: 'fixed', fixed: {...} }]
//   kind is one of approach, test (needs cap), reject, chop (needs center), fixed.
//   pin: { index, high? , low?, open?, close? } makes that bar print the exact
//   extreme and keeps every other bar inside it.
// makeBars(story) is also used by scripts/lesson-slides/ for slide charts.
// Run: node scripts/synth-bars.mjs [lesson.json ...]
//   (rewrites drill.rounds[].bars from each round's story; default: every lesson)
import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TICK = 0.25, STEP = 300, T0 = 1704189000; // 09:30 ET on an invented day
const SUB = 14; // sub-steps per bar

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gauss = (r) => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const q = (p) => Math.round(p / TICK) * TICK;

// regimes: [{ n, drift (points per bar), vol (points per sub-step), cap?: { price, side } }]
// cap keeps the walk from closing beyond the level while it is being tested.
export function walk(seed, start, regimes) {
  const r = rng(seed);
  const bars = [];
  let price = start, volState = 1;
  for (const reg of regimes) {
    if (reg.fixed) { // one bar written by hand: the bar that prints the extreme
      const f = reg.fixed;
      const open = f.open === 'prev' ? q(price) : f.open; // 'prev': open where the walk left off, no gap
      bars.push([T0 + bars.length * STEP, open, Math.max(f.high, open, f.close), Math.min(f.low, open, f.close), f.close]);
      price = f.close;
      continue;
    }
    for (let i = 0; i < reg.n; i++) {
      volState = Math.max(0.5, Math.min(2, volState * Math.exp(0.25 * gauss(r)))); // volatility clustering
      const open = q(price + (r() < 0.15 ? TICK * (r() < 0.5 ? -1 : 1) : 0)); // small gaps now and then
      let p = open, hi = open, lo = open;
      for (let k = 0; k < SUB; k++) {
        p += reg.drift / SUB + reg.vol * volState * gauss(r) + (reg.center !== undefined ? (reg.center - p) * 0.02 : 0);
        if (reg.cap) {
          // the level holds: the walk may poke it, never settle beyond it
          if (reg.cap.side === 'above' && p > reg.cap.price) p = reg.cap.price - (k === SUB - 1 ? TICK * (1 + Math.floor(r() * 6)) : TICK * Math.floor(r() * 3));
          if (reg.cap.side === 'below' && p < reg.cap.price) p = reg.cap.price + (k === SUB - 1 ? TICK * (1 + Math.floor(r() * 6)) : TICK * Math.floor(r() * 3));
        }
        hi = Math.max(hi, p); lo = Math.min(lo, p);
      }
      const close = q(p);
      bars.push([T0 + bars.length * STEP, open, q(Math.max(hi, open, close)), q(Math.min(lo, open, close)), close]);
      price = close;
    }
  }
  return bars;
}

// Make one bar print the exact extreme, with the body edge the lesson names, and
// keep every other bar inside it.
export function pin(bars, i, { high, low, open, close }) {
  const b = bars[i];
  if (open !== undefined) b[1] = open;
  if (close !== undefined) b[4] = close;
  for (let k = 0; k < bars.length; k++) {
    if (k === i) continue;
    const x = bars[k];
    if (high !== undefined) { const lim = q(high - TICK * (1 + (k % 3))); x[1] = Math.min(x[1], lim); x[4] = Math.min(x[4], lim); x[2] = Math.min(x[2], lim); }
    if (low !== undefined) { const lim = q(low + TICK * (1 + (k % 3))); x[1] = Math.max(x[1], lim); x[4] = Math.max(x[4], lim); x[3] = Math.max(x[3], lim); }
  }
  if (high !== undefined) b[2] = high;
  if (low !== undefined) b[3] = low;
  for (const x of bars) { x[2] = Math.max(x[2], x[1], x[4]); x[3] = Math.min(x[3], x[1], x[4]); }
  return bars;
}


const KINDS = ['approach', 'test', 'reject', 'chop', 'fixed'];
export function makeBars(story) {
  const regimes = story.regimes.map((r) => {
    if (r.kind !== undefined && !KINDS.includes(r.kind)) throw new Error(`unknown regime kind "${r.kind}"`);
    if (r.kind === 'test' && !r.cap) throw new Error('regime "test" needs cap');
    if (r.kind === 'chop' && r.center === undefined) throw new Error('regime "chop" needs center');
    if (r.kind === 'fixed' && !r.fixed) throw new Error('regime "fixed" needs fixed');
    const { kind, ...rest } = r;
    return rest;
  });
  let bars = walk(story.seed, story.start, regimes);
  if (story.pin) { const { index, ...p } = story.pin; bars = pin(bars, index, p); }
  return bars;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/lessons');
  const files = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f));
  for (const file of files) {
    const cfg = JSON.parse(readFileSync(file, 'utf8'));
    let n = 0;
    for (const seg of cfg.segments) for (const r of seg.drill?.rounds || []) {
      if (!r.story) continue;
      r.bars = makeBars(r.story);
      if (r.story.answer !== undefined) r.answer = r.story.answer;
      if (r.story.line !== undefined) r.line = r.story.line;
      const cols = r.bars.map((x) => (x[4] >= x[1] ? 'G' : 'R')).join('');
      console.log(r.id, r.kind, 'hi', Math.max(...r.bars.map((x) => x[2])), 'lo', Math.min(...r.bars.map((x) => x[3])), cols);
      n++;
    }
    if (n) { writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n'); console.log(`wrote ${n} rounds in ${path.basename(file)}`); }
  }
}
