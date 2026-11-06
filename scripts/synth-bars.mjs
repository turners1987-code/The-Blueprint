// Synthetic 5-minute bars for the Module 06 drill and slide snippets.
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
// Run: node scripts/synth-bars.mjs  (rewrites rounds[].bars in the lesson JSON)
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/lessons/06-what-counts-as-a-level.json');
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
function walk(seed, start, regimes) {
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
function pin(bars, i, { high, low, open, close }) {
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

const cfg = JSON.parse(readFileSync(FILE, 'utf8'));
const drill = cfg.segments.find((s) => s.drill).drill;
const rounds = Object.fromEntries(drill.rounds.map((r) => [r.id, r]));

// d1: a grind up into 24,186.50, a test with upper wicks, then the turn. The
// slide snippet (bars 20..44) needs the turn bar at index 35 with high 24,186.50
// and a body top of 24,180.25.
{
  const HI = 24186.5;
  let b = walk(11, 24124, [
    { n: 12, drift: 1.6, vol: 0.5 },
    { n: 10, drift: 2.4, vol: 0.65 },
    { n: 8, drift: 2.2, vol: 0.55 },
    { n: 5, drift: 1.6, vol: 0.6, cap: { price: HI - 1.25, side: 'above' } }, // pressing under it
    { fixed: { open: 'prev', high: HI, low: 24175.5, close: 24180.25 } },       // index 35: the print
    { fixed: { open: 'prev', high: 24183.25, low: 24174.75, close: 24175.75 } }, // the turn
    { n: 23, drift: -1.7, vol: 0.65 },
  ]);
  b = pin(b, 35, { high: HI });
  rounds.d1.bars = b; rounds.d1.answer = HI;
}

// d2: a sell-off into 24,032.00, a test of the low, then the long side takes it.
{
  const LO = 24032;
  let b = walk(23, 24090, [
    { n: 12, drift: -1.5, vol: 0.55 },
    { n: 10, drift: -2.1, vol: 0.7 },
    { n: 7, drift: -0.5, vol: 0.6, cap: { price: LO + 1.25, side: 'below' } },
    { fixed: { open: 'prev', high: 24038.0, low: LO, close: 24035.0 } },       // index 29: the print
    { fixed: { open: 'prev', high: 24041.5, low: 24034.0, close: 24040.75 } },
    { n: 29, drift: 1.1, vol: 0.6 },
  ]);
  b = pin(b, 29, { low: LO });
  rounds.d2.bars = b; rounds.d2.answer = LO;
}

// d3: chop across 24,100.00 with nothing behind it (a round number, not a level).
{
  const b = walk(37, 24101.5, [
    { n: 60, drift: 0, vol: 0.85, center: 24100 },
  ]);
  rounds.d3.bars = b; rounds.d3.line = 24100;
}

// d4: a defended high at 24,161.00: two touches, two turns.
{
  const HI = 24161;
  let b = walk(53, 24114, [
    { n: 16, drift: 1.7, vol: 0.55 },
    { n: 7, drift: 0.5, vol: 0.65, cap: { price: HI - 0.75, side: 'above' } },
    { fixed: { open: 'prev', high: HI, low: 24153.5, close: 24157.5 } },        // index 23: the print
    { n: 9, drift: -1.3, vol: 0.6 },
    { n: 8, drift: 1.1, vol: 0.6, cap: { price: HI - 0.5, side: 'above' } },   // a second poke, a tick short
    { n: 19, drift: -1.5, vol: 0.65 },
  ]);
  b = pin(b, 23, { high: HI });
  rounds.d4.bars = b; rounds.d4.line = HI;
}

for (const r of drill.rounds) {
  const cols = r.bars.map((x) => (x[4] >= x[1] ? 'G' : 'R')).join('');
  const hi = Math.max(...r.bars.map((x) => x[2])), lo = Math.min(...r.bars.map((x) => x[3]));
  console.log(r.id, r.kind, 'hi', hi, 'lo', lo, cols);
}
writeFileSync(FILE, JSON.stringify(cfg, null, 2) + '\n');
console.log('wrote drill bars');
