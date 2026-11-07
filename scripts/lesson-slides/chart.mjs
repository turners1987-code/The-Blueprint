// Candle chart for a slide, from synthetic bars (no real market data).
import { rv, line, rect } from './kit.mjs';
import { makeBars } from '../synth-bars.mjs';

// data.chart: { round: 'd1' } (a drill round's bars) or { story: {...} } (synth-bars story),
// plus from, to (bar indexes) and box [x, y, w, h].
export function barsFor(chart, cfg) {
  if (chart.story) return makeBars(chart.story);
  for (const seg of cfg.segments) for (const r of seg.drill?.rounds || []) if (r.id === chart.round) return r.bars;
  throw new Error(`chart: no drill round "${chart.round}" and no story`);
}

// Returns markup plus price -> y and bar index -> x helpers.
export function candles(chart, cfg, delay = 0) {
  const bars = barsFor(chart, cfg);
  const [bx, by, bw0, bh] = chart.box;
  const sl = bars.slice(chart.from, chart.to);
  // chart.hi / chart.lo (optional) pin the price range so a story's slides share one scale
  const hi = chart.hi ?? Math.max(...sl.map((b) => b[2])) + 4, lo = chart.lo ?? Math.min(...sl.map((b) => b[3])) - 4;
  const y = (p) => by + (hi - p) / (hi - lo) * bh;
  const step = bw0 / sl.length, bw = Math.max(3, step * 0.62);
  const out = sl.map((b, i) => {
    const x = bx + i * step + step / 2, up = b[4] >= b[1];
    const c = up ? 'var(--green)' : 'var(--red)';
    const top = y(Math.max(b[1], b[4])), bot = y(Math.min(b[1], b[4]));
    return line(x, y(b[2]), x, y(b[3]), c, { sw: 1.4 }) + rect(x - bw / 2, top, bw, Math.max(1.5, bot - top), { fill: c, rx: 0 });
  }).join('');
  const xi = (i) => bx + (i - chart.from) * step + step / 2;
  return { svg: rv(delay, out, 'sv-dr'), y, xi, right: bx + bw0 };
}
