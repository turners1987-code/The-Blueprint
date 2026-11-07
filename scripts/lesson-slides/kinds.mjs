// The slide kinds. Each kind is a function (data, ctx) -> svg body.
// ctx: { at(k) -> reveal delay of cue k inside this slide's window, cfg, chart? }
// Every reveal is keyed to a cue index. "stagger" spaces items that share one cue.
import { rv, text, rect, line, title as titleEl, credit, col, cls, card, CREDIT } from './kit.mjs';
import { candles } from './chart.mjs';

const delay = (ctx, cue, i = 0, stagger = 0) => ctx.at(cue) + i * stagger;

// ---- blocks: pieces any kind can append after its core ---------------------
export const BLOCKS = {
  card: (b, ctx) => rv(delay(ctx, b.cue), card(b)),

  note: (b, ctx) => {
    const lines = b.lines || [b.text];
    return rv(delay(ctx, b.cue), lines.map((l, i) => text(b.x, b.y + i * (b.pitch ?? 22), l, {
      size: b.size ?? 13, cls: cls(b.cls || 'm'), anchor: b.anchor || 'start', weight: b.weight ?? 400, fill: b.tone ? col(b.tone) : '',
    })).join(''));
  },

  chips: (b, ctx) => b.items.map((l, i) => rv(delay(ctx, b.cue, i, b.stagger),
    rect(b.x, b.y + i * (b.pitch ?? 36), b.w, 30, { fill: 'var(--bg-card)', stroke: col(b.tone), sw: 1.5, rx: 15 }) +
    text(b.x + b.w / 2, b.y + i * (b.pitch ?? 36) + 20, l, { size: 14, anchor: 'middle' }))).join(''),

  // numbered or plain rows; each item is a string or { text, tone, cue }
  rows: (b, ctx) => b.items.map((it, i) => {
    const o = typeof it === 'string' ? { text: it } : it;
    const tone = o.tone || b.tone, y = b.y + i * (b.pitch ?? 44);
    const sw = b.sw ?? 1;
    const lead = b.numbered
      ? text(b.x + 16, y + 23, `${i + 1}`, { size: 15, cls: 'sv-n', fill: col(tone) }) + text(b.x + 44, y + 23, o.text, { size: b.size ?? 16 })
      : text(b.x + 12, y + 23, o.text, { size: b.size ?? 12 });
    return rv(delay(ctx, o.cue ?? b.cue, o.cue === undefined ? i : 0, b.stagger),
      rect(b.x, y, b.w, b.h ?? 36, { fill: 'var(--bg-card)', stroke: col(tone), sw }) + lead);
  }).join(''),

  // clock rows: { time, text, cue }
  steps: (b, ctx) => b.items.map((it, i) => rv(delay(ctx, it.cue),
    rect(32, b.y + i * 40, 576, 32, { fill: 'var(--bg-card)', stroke: 'var(--border-light)' }) +
    text(46, b.y + 21 + i * 40, it.time, { size: 14, cls: 'sv-n', fill: 'var(--gold)' }) + text(124, b.y + 21 + i * 40, it.text, { size: 14 }))).join(''),

  // two-column grid of head + sub cells
  grid: (b, ctx) => b.items.map((it, i) => {
    const x = b.x + (i % b.cols) * b.pitchX, y = b.y + Math.floor(i / b.cols) * b.pitchY;
    return rv(delay(ctx, it.cue),
      rect(x, y, b.w, b.h, { fill: 'var(--bg-card)', stroke: 'var(--border-light)' }) +
      text(x + 14, y + 21, it.head, { size: 14, weight: 700, fill: 'var(--gold)' }) + text(x + 14, y + 38, it.sub, { size: 12, cls: 'sv-m' }));
  }).join(''),

  // boxed labels in a row: the "1st touch" strip
  tags: (b, ctx) => rv(delay(ctx, b.cue),
    b.items.map((l, i) => rect(b.x + i * 110, b.y, 100, 26, { stroke: 'var(--border-light)' }) + text(b.x + 50 + i * 110, b.y + 18, l, { size: 12, anchor: 'middle' })).join('')),

  // ---- chart layers (need a chart) ----
  level: (b, ctx) => {
    const y = ctx.chart.y(b.price);
    return rv(delay(ctx, b.cue),
      line(b.x1 ?? 32, y, b.x2 ?? 380, y, col(b.tone || 'cyan'), { sw: 1.5, dash: '5 4' }) +
      text(b.labelX ?? 386, y + 5, b.label, { size: 13, cls: 'sv-n', fill: col(b.tone || 'cyan') }));
  },
  zone: (b, ctx) => {
    const yN = ctx.chart.y(b.near), yF = ctx.chart.y(b.far);
    return rv(delay(ctx, b.cue), rect(b.x ?? 32, yF, b.w ?? 400, yN - yF, { fill: col(b.tone || 'gold'), op: b.op ?? 0.22, rx: 0 }));
  },
  edges: (b, ctx) => {
    const yN = ctx.chart.y(b.near), yF = ctx.chart.y(b.far);
    return rv(delay(ctx, b.cue),
      line(b.x1 ?? 32, yN, b.x2 ?? 440, yN, 'var(--cyan)') + line(b.x1 ?? 32, yF, b.x2 ?? 440, yF, 'var(--cyan)') +
      text(52, yN + 17, b.nearLabel, { size: 12, cls: 'sv-n', fill: 'var(--cyan)' }) + text(52, yF - 6, b.farLabel, { size: 12, cls: 'sv-n', fill: 'var(--cyan)' }));
  },
  bracket: (b, ctx) => {
    const yN = ctx.chart.y(b.near), yF = ctx.chart.y(b.far);
    return rv(delay(ctx, b.cue), line(40, yN, 40, yF, 'var(--gold)', { sw: 3 }) + text(52, (yN + yF) / 2 + 5, b.text, { size: 12, fill: 'var(--gold)' }));
  },
  // a strip a fixed number of pixels above a price: where the stop sits
  strip: (b, ctx) => {
    const y = ctx.chart.y(b.price);
    return rv(delay(ctx, b.cue),
      rect(b.x ?? 32, y - 22, b.w ?? 340, 14, { fill: col(b.tone || 'red'), op: 0.22, rx: 2 }) +
      text(b.labelX ?? 386, y - 12, b.label, { size: 12, fill: col(b.tone || 'red') }));
  },
};

const blocks = (list = [], ctx) => list.map((b) => {
  const f = BLOCKS[b.type];
  if (!f) throw new Error(`unknown block type "${b.type}"`);
  if (['level', 'zone', 'edges', 'bracket', 'strip'].includes(b.type) && !ctx.chart) throw new Error(`block "${b.type}" needs a chart`);
  return f(b, ctx);
}).join('');

const head = (d) => titleEl(d.title, d.subtitle);
const axisLabel = (l) => text(l.x, 230, l.text, { size: 15, anchor: 'middle', fill: 'var(--cyan)' });
const tail = (d, ctx) => blocks(d.blocks, ctx) + (d.credit ? credit(d.credit === true ? CREDIT : d.credit) : '');

// ---- kinds -----------------------------------------------------------------
export const KINDS = {
  // A situation: a line, price arriving, a question, the problem in one banner.
  scenario: (d, ctx) => head(d) +
    rv(0, rect(32, 90, 576, 200, { fill: 'var(--bg-card)', stroke: 'var(--border-light)' }) +
      line(72, 150, 568, 150, 'var(--gold)', { dash: '6 5' }) +
      text(320, 128, d.panel.label, { size: 16, anchor: 'middle' }) +
      line(140, 262, 140, 172, 'var(--cyan)', { sw: 2 }) + '<polygon points="132,178 140,164 148,178" fill="var(--cyan)"/>' +
      text(158, 250, d.panel.note, { size: 13, cls: 'sv-m' })) +
    rv(delay(ctx, d.question.cue), text(430, 215, d.question.mark, { size: 40, weight: 700, anchor: 'middle', fill: 'var(--gold)' }) +
      text(430, 245, d.question.head, { size: 14, anchor: 'middle' }) +
      text(430, 268, d.question.sub, { size: 12, cls: 'sv-m', anchor: 'middle' })) +
    rv(delay(ctx, d.banner.cue), rect(32, 304, 576, 36, { fill: 'var(--bg-card)', stroke: col(d.banner.tone), sw: 1.5 }) +
      text(320, 328, d.banner.text, { size: 15, weight: 700, anchor: 'middle', fill: col(d.banner.tone) })) + tail(d, ctx),

  // Numbered parts of a test, then pass / fail verdicts. A verdict may carry its
  // own "cue" so it reveals when it is spoken; without one, all reveal on verdicts.cue.
  cards: (d, ctx) => head(d) +
    d.parts.map((p, i) => {
      const x = 32 + i * 298;
      return rv(delay(ctx, p.cue), rect(x, 90, 278, 110, { fill: 'var(--bg-card)', stroke: 'var(--cyan)', sw: 1.5 }) +
        text(x + 16, 116, p.n, { size: 22, weight: 700, cls: 'sv-n', fill: 'var(--cyan)' }) +
        text(x + 44, 116, p.head, { size: 15, weight: 700 }) +
        p.lines.map((l, k) => text(x + 44, 140 + k * 20, l, { size: 13, cls: 'sv-m' })).join('') +
        text(x + 44, 186, p.foot, { size: 12, cls: 'sv-d' }));
    }).join('') +
    d.verdicts.items.map((v, i) => {
      const x = 32 + i * 298;
      return rv(delay(ctx, v.cue ?? d.verdicts.cue), rect(x, 222, 278, 80, { fill: 'var(--bg-card)', stroke: col(v.tone), sw: 1.5 }) +
        text(x + 16, 250, v.head, { size: 15, weight: 700, fill: col(v.tone) }) + text(x + 16, 274, v.text, { size: 13, cls: 'sv-m' }));
    }).join('') + tail(d, ctx),

  // Candles from a story, with layers (level, zone, edges, strip) and side cards.
  chart: (d, ctx) => {
    ctx.chart = candles(d.chart, ctx.cfg);
    return head(d) + ctx.chart.svg + tail(d, ctx);
  },

  // The zone diagram: two edges, price arriving, the stop behind the far edge.
  zone: (d, ctx) => head(d) +
    rv(0, rect(190, 120, 260, 70, { fill: 'var(--gold)', op: 0.2, rx: 0 }) + text(320, 162, d.zone, { size: 16, anchor: 'middle' })) +
    rv(delay(ctx, d.edges.cue), line(170, 120, 470, 120, 'var(--cyan)', { sw: 2.5 }) + line(170, 190, 470, 190, 'var(--cyan)', { sw: 2.5 }) +
      text(480, 125, d.edges.far, { size: 15, weight: 700, fill: 'var(--cyan)' }) +
      text(480, 195, d.edges.near, { size: 15, weight: 700, fill: 'var(--cyan)' })) +
    rv(delay(ctx, d.arrival.cue), '<path d="M320 300 V200" stroke="var(--text-secondary)" stroke-width="2.5" fill="none" marker-end="url(#a)"/>' +
      '<defs><marker id="a" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--text-secondary)"/></marker></defs>' +
      text(334, 285, d.arrival.text, { size: 13, cls: 'sv-m' }) +
      rect(170, 96, 300, 14, { fill: 'var(--red)', op: 0.25, rx: 2 }) +
      text(480, 107, d.arrival.stop, { size: 13, fill: 'var(--red)' })) + tail(d, ctx),

  // A centred statement with lines that arrive as they are spoken. For quiet,
  // unhurried segments (the welcome) where a card grid would shout.
  hero: (d, ctx) => {
    const y = d.y ?? 128;
    return rv(0, text(320, y, d.title, { size: d.size ?? 34, weight: 700, anchor: 'middle' }) +
      (d.subtitle ? text(320, y + 34, d.subtitle, { size: 16, cls: 'sv-m', anchor: 'middle' }) : '')) +
      (d.lines || []).map((l, i) => rv(delay(ctx, l.cue), text(320, y + 84 + i * 34, l.text, {
        size: l.size ?? 17, anchor: 'middle', fill: l.tone ? col(l.tone) : '', cls: l.muted ? 'sv-m' : 'sv-t',
      }))).join('') + tail(d, ctx);
  },

  // Title, subtitle and free blocks only.
  calm: (d, ctx) => head(d) + tail(d, ctx),

  // Numbered rows revealed one per cue, with an optional side panel.
  list: (d, ctx) => head(d) +
    BLOCKS.rows({ ...d.rows, x: 32, y: 84, w: 440, numbered: true, sw: 1.5, size: 16 }, ctx) +
    (d.aside ? rv(delay(ctx, d.aside.cue), rect(496, 84, 112, 256, { fill: 'var(--bg-card)', stroke: 'var(--border-light)' }) +
      text(552, 214, d.aside.head, { size: d.aside.size ?? 26, weight: 700, anchor: 'middle', fill: 'var(--gold)' }) +
      text(552, 240, d.aside.sub, { size: 13, cls: 'sv-m', anchor: 'middle' })) : '') + tail(d, ctx),

  // A boundary on a time axis: bands either side, or a bare axis with a marker.
  // An axis label may carry its own "cue" so it reveals when it is spoken.
  timeline: (d, ctx) => head(d) + (d.bands ? rv(0, d.bands.map((b) =>
    rect(b.x, b.y, b.w, b.h, { fill: col(b.tone), op: 0.22, rx: 0 }) + text(b.x + b.w / 2, b.y + b.h / 2 + 5, b.label, { size: 14, anchor: 'middle' })).join('')) : '') +
    (d.boundary ? rv(delay(ctx, d.boundary.cue ?? 0), line(d.boundary.x, d.boundary.y1, d.boundary.x, d.boundary.y2, 'var(--text-primary)', { sw: 2.5 }) +
      text(d.boundary.x, d.boundary.labelY, d.boundary.label, { size: d.boundary.labelSize ?? 16, cls: 'sv-n', anchor: 'middle', fill: 'var(--gold)' })) : '') +
    (d.axis ? rv(0, line(40, 170, 600, 170, 'var(--text-muted)', { sw: 3 }) + line(d.axis.x, 140, d.axis.x, 200, 'var(--gold)', { sw: 4 }) +
      text(d.axis.x, 128, d.axis.time, { size: 22, cls: 'sv-n', anchor: 'middle', fill: 'var(--gold)' }) +
      d.axis.labels.filter((l) => l.cue === undefined).map(axisLabel).join('')) +
      d.axis.labels.filter((l) => l.cue !== undefined).map((l) => rv(delay(ctx, l.cue), axisLabel(l))).join('') : '') + tail(d, ctx),

  // Two columns: what each is, then what it is for. A line may carry its own
  // "cue" so it reveals when it is spoken, after its column has appeared.
  compare: (d, ctx) => head(d) +
    d.columns.map((c, i) => {
      const x = 32 + i * 296;
      return rv(delay(ctx, c.cue ?? 0), rect(x, 84, 280, 190, { fill: 'var(--bg-card)', stroke: col(c.tone), sw: 1.5 }) +
        text(x + 16, 112, c.head, { size: 20, weight: 700, fill: col(c.tone) }) +
        c.lines.map((l) => {
          const t = text(x + 16, 84 + l.y, l.text, { size: l.size ?? 13, cls: cls(l.cls || 'm'), weight: l.weight ?? 400, fill: l.tone ? col(l.tone) : '' });
          return l.cue === undefined ? t : rv(delay(ctx, l.cue), t);
        }).join('') +
        (c.art === 'stop' ? rect(x + 16, 190, 248, 30, { fill: 'var(--cyan)', op: 0.25, rx: 0 }) + rect(x + 16, 226, 248, 8, { fill: 'var(--red)', op: 0.4, rx: 0 }) : ''));
    }).join('') + tail(d, ctx),

  // Score circles, then verdict rows by score band.
  score: (d, ctx) => head(d) +
    Array.from({ length: d.points }, (_, i) => rv(delay(ctx, d.cue ?? 0, i, 0.35),
      `<circle cx="${80 + i * 80}" cy="130" r="22" fill="var(--bg-card)" stroke="var(--cyan)" stroke-width="2"/>` +
      text(80 + i * 80, 137, String(i + 1), { size: 18, cls: 'sv-t sv-n', anchor: 'middle' }))).join('') +
    d.verdicts.items.map((v, i) => rv(v.cue === undefined ? delay(ctx, d.verdicts.cue, i, d.verdicts.stagger ?? 7) : delay(ctx, v.cue),
      rect(32, 190 + i * 50, 576, 40, { fill: 'var(--bg-card)', stroke: col(v.tone), sw: 1.5 }) +
      text(48, 216 + i * 50, v.score, { size: 16, weight: 700, fill: col(v.tone) }) + text(150, 216 + i * 50, v.text, { size: 15 }))).join('') + tail(d, ctx),

  // One row of fields: the assignment.
  assignment: (d, ctx) => head(d) +
    d.fields.map((f, i) => rv(delay(ctx, d.cue, i, 1.3),
      rect(32 + i * 97, 110, 93, 70, { fill: 'var(--bg-card)', stroke: 'var(--cyan)', sw: 1.5 }) +
      text(78 + i * 97, 150, f, { size: 12, weight: 700, anchor: 'middle' }))).join('') +
    rv(delay(ctx, d.cue), text(32, 230, d.line1, { size: 14, cls: 'sv-m' }) + text(32, 254, d.line2, { size: 16 })) + tail(d, ctx),

  // The statement, then a grid of links to other modules.
  summary: (d, ctx) => head(d) +
    rv(0, rect(32, 84, 576, 50, { fill: 'var(--bg-card)', stroke: 'var(--cyan)', sw: 1.5 }) + text(48, 115, d.statement, { size: 14 })) +
    BLOCKS.grid({ items: d.links, cols: 2, x: 32, y: 154, w: 284, h: 48, pitchX: 292, pitchY: 58 }, ctx) + tail(d, ctx),

  // Clock rows, one per cue.
  steps: (d, ctx) => head(d) + BLOCKS.steps({ items: d.items, y: d.y ?? 90 }, ctx) + tail(d, ctx),

  // Empty space between zones, and the lines that are not levels.
  stack: (d, ctx) => head(d) +
    rv(0, rect(32, 84, 400, 46, { fill: 'var(--cyan)', op: 0.25, rx: 0 }) + text(46, 113, d.zone, { size: 14 }) +
      rect(32, 290, 400, 46, { fill: 'var(--cyan)', op: 0.25, rx: 0 }) + text(46, 319, d.zone, { size: 14 }) +
      rect(32, 130, 400, 160, { stroke: 'var(--text-muted)', dash: '6 6', rx: 0 }) +
      text(232, 215, d.gap.head, { size: 22, weight: 700, anchor: 'middle', fill: 'var(--gold)' }) +
      text(232, 240, d.gap.sub, { size: 13, cls: 'sv-m', anchor: 'middle' })) + tail(d, ctx),
};

export const KIND_NAMES = Object.keys(KINDS);
