// Builds the Module 06 slide visuals (backlog 9f) and writes them into
// data/lessons/06-what-counts-as-a-level.json. Slide count, titles and start
// times are kept; only each slide's svg changes. Chart snippets use the
// synthetic bars already shipped with the level drill (no real market data).
// Run: node scripts/build-lesson-slides.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/lessons/06-what-counts-as-a-level.json');
const cfg = JSON.parse(readFileSync(FILE, 'utf8'));
const BARS = cfg.segments.find((s) => s.drill).drill.rounds[0].bars; // synthetic, high 24,186.50 at index 35

const W = 640, H = 360;
const STYLE = `<style>
.sv-t{fill:var(--text-primary);font-family:var(--font-body,sans-serif)}
.sv-m{fill:var(--text-secondary);font-family:var(--font-body,sans-serif)}
.sv-d{fill:var(--text-muted);font-family:var(--font-body,sans-serif)}
.sv-n{font-family:var(--font-mono,monospace)}
.sv-card{fill:var(--bg-card);stroke:var(--border-light);stroke-width:1}
.sv-rv{animation:sv-in .6s ease both}
.sv-dr{animation:sv-draw .9s ease both}
@keyframes sv-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes sv-draw{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.sv-rv,.sv-dr{animation:none}}
</style>`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rv = (d, inner, cls = 'sv-rv') => `<g class="${cls}" style="animation-delay:${Math.max(0, d).toFixed(1)}s">${inner}</g>`;
const text = (x, y, s, { size = 16, cls = 'sv-t', anchor = 'start', weight = 400, fill = '' } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" class="${cls}"${fill ? ` style="fill:${fill}"` : ''}>${esc(s)}</text>`;
const rect = (x, y, w, h, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 4}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.sw || 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op ? ` opacity="${o.op}"` : ''}/>`;
const line = (x1, y1, x2, y2, stroke, o = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${o.sw || 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const chip = (x, y, w, label, color, d) => rv(d,
  rect(x, y, w, 30, { fill: 'var(--bg-card)', stroke: color, sw: 1.5, rx: 15 }) + text(x + w / 2, y + 20, label, { size: 14, anchor: 'middle' }));
const title = (s, sub) => text(32, 40, s, { size: 24, weight: 700 }) + (sub ? text(32, 62, sub, { size: 14, cls: 'sv-m' }) : '');
const credit = text(W - 24, H - 14, 'Composite chart. Invented prices, synthetic bars.', { size: 11, cls: 'sv-d', anchor: 'end' });
const svg = (label, body) =>
  `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label)}">${STYLE}${body}</svg>`;

// Candles from the synthetic bars. Returns markup plus a price->y function.
function candles(from, to, box, d0 = 0) {
  const sl = BARS.slice(from, to);
  const hi = Math.max(...sl.map((b) => b[2])) + 4, lo = Math.min(...sl.map((b) => b[3])) - 4;
  const y = (p) => box.y + (hi - p) / (hi - lo) * box.h;
  const step = box.w / sl.length, bw = Math.max(3, step * 0.62);
  const out = sl.map((b, i) => {
    const x = box.x + i * step + step / 2, up = b[4] >= b[1];
    const c = up ? 'var(--green)' : 'var(--red)';
    const top = y(Math.max(b[1], b[4])), bot = y(Math.min(b[1], b[4]));
    return line(x, y(b[2]), x, y(b[3]), c, { sw: 1.4 }) + rect(x - bw / 2, top, bw, Math.max(1.5, bot - top), { fill: c, rx: 0 });
  }).join('');
  const xi = (i) => box.x + (i - from) * step + step / 2;
  return { svg: rv(d0, out, 'sv-dr'), y, xi, right: box.x + box.w };
}

const HI = 24186.5, NEAR = 24180.25;
const S = {};

// ---- Segment 1: the test --------------------------------------------------
S['The test'] = (t) => svg('The stop-structure test',
  title('A level has a reason behind it', 'The stop-structure test') +
  rv(0, rect(32, 90, 270, 200, { fill: 'var(--bg-card)', stroke: 'var(--border-light)' }) +
    line(52, 200, 282, 200, 'var(--gold)', { dash: '6 5' }) +
    text(167, 130, 'A line you drew', { size: 16, anchor: 'middle' }) +
    text(167, 156, 'Where does the stop go?', { size: 14, cls: 'sv-m', anchor: 'middle' })) +
  rv(t[1] - t[0], text(167, 240, '?', { size: 40, weight: 700, anchor: 'middle', fill: 'var(--gold)' }) +
    text(167, 268, 'Two ticks too tight. Twenty points too wide.', { size: 12, cls: 'sv-m', anchor: 'middle' })) +
  rv(t[3] - t[0], rect(330, 90, 278, 90, { fill: 'var(--bg-card)', stroke: 'var(--green)', sw: 1.5 }) +
    text(346, 118, 'Something already happened there', { size: 15, weight: 700 }) +
    text(346, 142, 'A price beyond it ends the reason', { size: 14, cls: 'sv-m' }) +
    text(346, 164, 'A level: the stop sits behind it', { size: 14, fill: 'var(--green)' })) +
  rv(t[4] - t[0], rect(330, 196, 278, 94, { fill: 'var(--bg-card)', stroke: 'var(--red)', sw: 1.5 }) +
    text(346, 224, 'Nothing you can name', { size: 15, weight: 700 }) +
    text(346, 248, 'No job for a stop to do', { size: 14, cls: 'sv-m' }) +
    text(346, 270, 'Not a level', { size: 14, fill: 'var(--red)' })));

S['One sentence'] = (t) => {
  const c = candles(20, 44, { x: 32, y: 84, w: 340, h: 230 });
  return svg('Six bars turned at the high; the stop goes behind it',
    title('The stop goes behind the high', 'Invented prior-day high 24,186.50') + c.svg +
    rv(t[0] - t[0], line(32, c.y(HI), 380, c.y(HI), 'var(--cyan)', { sw: 1.5, dash: '5 4' }) +
      text(386, c.y(HI) + 5, '24,186.50', { size: 13, cls: 'sv-n', fill: 'var(--cyan)' })) +
    rv(0.4, text(372, 300, 'Six bars up into it, then turned', { size: 12, cls: 'sv-m', anchor: 'end' })) +
    rv(t[1] - t[0], rect(32, c.y(HI) - 22, 340, 14, { fill: 'var(--red)', op: 0.22, rx: 2 }) +
      text(386, c.y(HI) - 12, 'Stop behind', { size: 12, fill: 'var(--red)' })) +
    rv(t[3] - t[0], rect(470, 90, 150, 112, { fill: 'var(--bg-card)', stroke: 'var(--border-light)' }) +
      text(482, 114, 'Write one sentence', { size: 13, weight: 700 }) +
      text(482, 136, 'The stop goes behind', { size: 12, cls: 'sv-m' }) +
      text(482, 154, '[price] because', { size: 12, cls: 'sv-m' }) +
      text(482, 172, '[what happened', { size: 12, cls: 'sv-m' }) +
      text(482, 190, 'there].', { size: 12, cls: 'sv-m' })) +
    rv(t[4] - t[0], rect(470, 214, 150, 76, { fill: 'var(--bg-card)', stroke: 'var(--red)' }) +
      text(482, 238, 'Getting it wrong', { size: 13, weight: 700, fill: 'var(--red)' }) +
      text(482, 258, 'A stop chosen after', { size: 12, cls: 'sv-m' }) +
      text(482, 276, 'the entry', { size: 12, cls: 'sv-m' })) + credit);
};

// ---- Segment 2: zones and the far edge --------------------------------------
S['Zones'] = (t) => svg('A level is a zone with a near edge and a far edge',
  title('A level is a zone', 'A price band with two edges') +
  rv(0, rect(190, 120, 260, 70, { fill: 'var(--gold)', op: 0.2, rx: 0 }) + text(320, 162, 'The zone', { size: 16, anchor: 'middle' })) +
  rv(t[1] - t[0], line(170, 120, 470, 120, 'var(--cyan)', { sw: 2.5 }) + line(170, 190, 470, 190, 'var(--cyan)', { sw: 2.5 }) +
    text(480, 125, 'Far edge', { size: 15, weight: 700, fill: 'var(--cyan)' }) +
    text(480, 195, 'Near edge', { size: 15, weight: 700, fill: 'var(--cyan)' })) +
  rv(t[2] - t[0], `<path d="M320 300 V200" stroke="var(--text-secondary)" stroke-width="2.5" fill="none" marker-end="url(#a)"/>
    <defs><marker id="a" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--text-secondary)"/></marker></defs>` +
    text(334, 285, 'Price arrives from underneath', { size: 13, cls: 'sv-m' }) +
    rect(170, 96, 300, 14, { fill: 'var(--red)', op: 0.25, rx: 2 }) +
    text(480, 107, 'The stop goes behind it', { size: 13, fill: 'var(--red)' })));

S['Example zone'] = (t) => {
  const c = candles(20, 44, { x: 32, y: 84, w: 340, h: 230 });
  const yN = c.y(NEAR), yF = c.y(HI);
  return svg('Zone from 24,180.25 to 24,186.50',
    title('Invented example: prior-day high', 'Zone 24,180.25 to 24,186.50, six and a quarter points') + c.svg +
    rv(0, rect(32, yF, 400, yN - yF, { fill: 'var(--gold)', op: 0.22, rx: 0 })) +
    rv(t[1] - t[0], line(32, yN, 440, yN, 'var(--cyan)') + line(32, yF, 440, yF, 'var(--cyan)') +
      text(52, yN + 17, 'Near edge 24,180.25', { size: 12, cls: 'sv-n', fill: 'var(--cyan)' }) +
      text(52, yF - 6, 'Far edge 24,186.50', { size: 12, cls: 'sv-n', fill: 'var(--cyan)' })) +
    rv(t[2] - t[0], line(40, yN, 40, yF, 'var(--gold)', { sw: 3 }) + text(52, (yN + yF) / 2 + 5, 'Width is part of your risk', { size: 12, fill: 'var(--gold)' })) +
    rv(t[3] - t[0], rect(468, 90, 152, 62, { fill: 'var(--bg-card)', stroke: 'var(--border-light)' }) +
      text(480, 112, 'One construction', { size: 13, weight: 700 }) + text(480, 132, 'per level type', { size: 13, cls: 'sv-m' })) +
    rv(t[4] - t[0], rect(468, 166, 152, 112, { fill: 'var(--bg-card)', stroke: 'var(--cyan)' }) +
      text(480, 188, 'Overlap = one zone', { size: 13, weight: 700 }) +
      rect(484, 202, 90, 22, { fill: 'var(--gold)', op: 0.35, rx: 0 }) + rect(520, 214, 90, 22, { fill: 'var(--cyan)', op: 0.35, rx: 0 }) +
      text(480, 262, 'It names every slug in it', { size: 12, cls: 'sv-m' })) + credit);
};

// ---- Segment 3: the two lists ----------------------------------------------
const PRE = [
  ['Prior-day high and low', 'var(--cyan)'], ['Prior-day value edges and VPOC', 'var(--cyan)'], ['Settlement', 'var(--cyan)'],
  ['Overnight high, low and POC', 'var(--gold)'], ['Prior-week high and low', 'var(--gold)'], ['Multi-session profile nodes', 'var(--gold)'],
];
S['Pre-marked list'] = (t) => svg('The list you mark before the session',
  title('The list you mark before the session', 'Fixed, and built from finished data') +
  PRE.map(([l, col], i) => rv(5.5 + i * 1.8 - t[0],
    rect(32, 84 + i * 44, 440, 36, { fill: 'var(--bg-card)', stroke: col, sw: 1.5 }) +
    text(48, 107 + i * 44, `${i + 1}`, { size: 15, cls: 'sv-n', fill: col }) + text(76, 107 + i * 44, l, { size: 16 }))).join('') +
  rv(0.5, rect(496, 84, 112, 256, { fill: 'var(--bg-card)', stroke: 'var(--border-light)' }) + text(552, 214, '09:25', { size: 26, weight: 700, anchor: 'middle', fill: 'var(--gold)' }) +
    text(552, 240, 'list closes', { size: 13, cls: 'sv-m', anchor: 'middle' })));

S['Session scope'] = (t) => svg('Session scope and the 16:00 boundary',
  title('Each level has a session scope', 'The bars that build it, in Eastern time') +
  rv(0, rect(32, 100, 330, 50, { fill: 'var(--cyan)', op: 0.22, rx: 0 }) + text(197, 130, 'Regular session 09:30 to 16:00', { size: 14, anchor: 'middle' }) +
    rect(362, 100, 246, 50, { fill: 'var(--gold)', op: 0.22, rx: 0 }) + text(485, 130, 'Overnight 16:00 to 09:30', { size: 14, anchor: 'middle' })) +
  rv(6, line(362, 86, 362, 214, 'var(--text-primary)', { sw: 2.5 }) + text(362, 232, '16:00', { size: 16, cls: 'sv-n', anchor: 'middle', fill: 'var(--gold)' })) +
  rv(39.7 - t[0], rect(400, 166, 208, 30, { fill: 'var(--bg-card)', stroke: 'var(--gold)', rx: 4 }) + text(504, 186, 'A 16:40 high is overnight', { size: 13, anchor: 'middle' })) +
  rv(51.8 - t[0], rect(32, 262, 276, 56, { fill: 'var(--bg-card)', stroke: 'var(--cyan)' }) + text(46, 286, 'Two saved templates', { size: 14, weight: 700 }) +
    text(46, 306, 'Regular and full, both end at 16:00', { size: 12, cls: 'sv-m' })) +
  rv(59.3 - t[0], rect(330, 262, 278, 56, { fill: 'var(--bg-card)', stroke: 'var(--border-light)' }) + text(344, 286, 'Prior week', { size: 14, weight: 700 }) +
    text(344, 306, 'Sunday 18:00 to Friday 16:00', { size: 12, cls: 'sv-m' })));

S['In-session list'] = (t) => {
  const types = ['Opening range, once your window has closed', 'Defended pullback high or low', 'Developing VPOC and value edges, at the trigger',
    'Unfinished business', 'Stacked imbalance, as a location only'];
  const c = candles(36, 60, { x: 32, y: 84, w: 250, h: 150 });
  return svg('The in-session list: levels that form in front of you',
    title('The in-session list', 'Counts once finished forming, and only if your plan named the type') + c.svg +
    rv(74.7 - t[0], rect(32, 252, 250, 56, { fill: 'var(--bg-card)', stroke: 'var(--gold)', sw: 1.5 }) +
      text(46, 276, 'Before it finishes forming', { size: 13, weight: 700 }) + text(46, 296, 'It is a moving price', { size: 12, cls: 'sv-m' })) +
    types.map((l, i) => rv(88.3 - t[0] + i * 2.2, rect(310, 84 + i * 44, 298, 36, { fill: 'var(--bg-card)', stroke: 'var(--cyan)' }) +
      text(322, 107 + i * 44, l, { size: 12 }))).join('') +
    rv(104.8 - t[0], text(310, 318, 'Wrong: the range high at 09:38 on a 09:45 window', { size: 12, fill: 'var(--red)' })) + credit);
};

// ---- Segment 4: what is not a level -------------------------------------------
S['Mid-range'] = (t) => svg('Mid-range is empty space outside every zone',
  title('Mid-range', 'Outside every zone on your list') +
  rv(0, rect(32, 84, 400, 46, { fill: 'var(--cyan)', op: 0.25, rx: 0 }) + text(46, 113, 'Zone on your list', { size: 14 }) +
    rect(32, 290, 400, 46, { fill: 'var(--cyan)', op: 0.25, rx: 0 }) + text(46, 319, 'Zone on your list', { size: 14 }) +
    rect(32, 130, 400, 160, { stroke: 'var(--text-muted)', dash: '6 6', rx: 0 }) + text(232, 215, 'Mid-range', { size: 22, weight: 700, anchor: 'middle', fill: 'var(--gold)' }) +
    text(232, 240, 'Empty space, tagged so it is counted', { size: 13, cls: 'sv-m', anchor: 'middle' })) +
  ['VWAP', 'Pivots', 'Moving averages', 'Fibonacci', 'Round numbers', 'Fair value gaps', 'Trendlines'].map((l, i) =>
    chip(452, 84 + i * 36, 156, l, 'var(--red)', 18.9 - t[0] + i * 1.8)).join('') +
  rv(32.2 - t[0], text(32, 354, 'Where one of these sits inside a real zone, the zone is the level', { size: 11, cls: 'sv-m' })));

S['Location or target'] = (t) => svg('Location or target',
  title('Same level, two jobs', 'Its job in the trade is what changes') +
  rv(0, rect(32, 84, 280, 190, { fill: 'var(--bg-card)', stroke: 'var(--cyan)', sw: 1.5 }) + text(48, 112, 'Location', { size: 20, weight: 700, fill: 'var(--cyan)' }) +
    text(48, 140, 'Where a trade happens', { size: 14 }) + text(48, 162, 'The stop sits behind the far edge', { size: 13, cls: 'sv-m' }) +
    rect(48, 190, 248, 30, { fill: 'var(--cyan)', op: 0.25, rx: 0 }) + rect(48, 226, 248, 8, { fill: 'var(--red)', op: 0.4, rx: 0 })) +
  rv(8, rect(328, 84, 280, 190, { fill: 'var(--bg-card)', stroke: 'var(--gold)', sw: 1.5 }) + text(344, 112, 'Target', { size: 20, weight: 700, fill: 'var(--gold)' }) +
    text(344, 140, 'Where a trade aims', { size: 14 }) + text(344, 162, 'Written before entry', { size: 13, cls: 'sv-m' }) +
    text(344, 200, 'Never a reason to enter', { size: 15, weight: 700, fill: 'var(--gold)' })) +
  rv(88.9 - t[0], text(32, 306, 'Every trade at a level also records its test number:', { size: 13, cls: 'sv-m' }) +
    ['1st touch', '2nd touch', '3rd touch'].map((l, i) => rect(32 + i * 110, 316, 100, 26, { stroke: 'var(--border-light)' }) + text(82 + i * 110, 334, l, { size: 12, anchor: 'middle' })).join('')));

S['List closes'] = (t) => svg('The list closes at 09:25',
  title('The list closes at 09:25', 'Nothing else becomes a level') +
  rv(0, line(40, 170, 600, 170, 'var(--text-muted)', { sw: 3 }) + line(300, 140, 300, 200, 'var(--gold)', { sw: 4 }) +
    text(300, 128, '09:25', { size: 22, cls: 'sv-n', anchor: 'middle', fill: 'var(--gold)' }) +
    text(160, 230, 'List fixed', { size: 15, anchor: 'middle', fill: 'var(--cyan)' }) +
    text(450, 230, 'In-session types only', { size: 15, anchor: 'middle', fill: 'var(--cyan)' })) +
  rv(107.2 - t[0], rect(330, 244, 270, 40, { fill: 'var(--bg-card)', stroke: 'var(--cyan)' }) + text(344, 269, 'Only types your plan named', { size: 13 })) +
  rv(118.8 - t[0], rect(32, 290, 568, 46, { fill: 'var(--bg-card)', stroke: 'var(--gold)', sw: 1.5 }) +
    text(48, 318, 'End-of-day mark-up: count the lines added after 09:25, write the number down', { size: 14 })));

// ---- Segment 5: marking a blank chart -----------------------------------------
const STEPS = [
  [11.2, '08:50', 'Templates: regular and full, both end at 16:00'],
  [21.2, '09:00', 'Collect the data by scope'],
  [64.1, '09:10', 'Write each level as a zone with its far edge'],
  [77.4, '09:15', 'Everything outside the eleven rows is mid-range'],
  [84.7, '09:18', 'Considered and struck: four lines fail the test'],
  [98.4, '09:20', 'Write the in-session line'],
  [110.5, '09:22', 'Targets in their own column; list closes at 09:25'],
];
const stepRows = (t0, from, to, y0) => STEPS.slice(from, to).map(([s, tm, l], i) => rv(s - t0,
  rect(32, y0 + i * 40, 576, 32, { fill: 'var(--bg-card)', stroke: 'var(--border-light)' }) + text(46, y0 + 21 + i * 40, tm, { size: 14, cls: 'sv-n', fill: 'var(--gold)' }) + text(110, y0 + 21 + i * 40, l, { size: 14 }))).join('');

S['Worked case'] = (t) => svg('Worked case: a blank chart, marked by 09:25',
  title('Worked case: blank chart', 'Invented prices. It stops at 09:25: no entry, no outcome') + stepRows(t[0], 0, 2, 90) +
  rv(25, text(32, 230, 'Prior-day high 24,186.50', { size: 14, cls: 'sv-n', fill: 'var(--cyan)' }) + text(32, 252, 'Prior-day low 24,032.00', { size: 14, cls: 'sv-n', fill: 'var(--cyan)' }) +
    text(32, 274, 'Value area 24,071.00 to 24,148.00', { size: 14, cls: 'sv-n', fill: 'var(--cyan)' }) + text(32, 296, 'VPOC 24,112.00   Settlement 24,131.50', { size: 14, cls: 'sv-n', fill: 'var(--cyan)' })));

S['The 16:00 boundary'] = (t) => svg('The 16:00 boundary',
  title('The 16:00 boundary', 'A 16:12 print belongs to the overnight range') +
  rv(0, rect(32, 80, 330, 40, { fill: 'var(--cyan)', op: 0.22, rx: 0 }) + text(197, 105, 'Regular session', { size: 14, anchor: 'middle' }) +
    rect(362, 80, 246, 40, { fill: 'var(--gold)', op: 0.22, rx: 0 }) + text(485, 105, 'Overnight', { size: 14, anchor: 'middle' }) +
    line(362, 72, 362, 130, 'var(--text-primary)', { sw: 2.5 }) + text(362, 146, '16:00', { size: 13, cls: 'sv-n', anchor: 'middle', fill: 'var(--gold)' })) +
  rv(0.4, text(32, 146, 'High 24,186.50', { size: 12, cls: 'sv-n', fill: 'var(--cyan)' }) + text(608, 146, 'High 24,190.00 at 16:12', { size: 12, cls: 'sv-n', anchor: 'end', fill: 'var(--gold)' })) +
  rv(t[1] - t[0] - 2, rect(32, 162, 576, 26, { fill: 'var(--bg-card)', stroke: 'var(--gold)' }) + text(46, 180, 'Overlapping zones merge: one row, far edge 24,190.00', { size: 13 }), 'sv-rv') +
  stepRows(t[0], 2, 4, 200) +
  rv(84.7 - t[0], text(32, 300, 'Struck: overnight VWAP, 24,100.00, a Fibonacci line, a trendline', { size: 13, fill: 'var(--red)' })) +
  rv(121.5 - t[0], text(32, 328, 'The time went on scope and edges, not on finding more lines', { size: 13, cls: 'sv-m' })));

S['Chart score'] = (t) => svg('Does your chart pass?',
  title('Does your chart pass?', 'One point for each true line, out of seven') +
  Array.from({ length: 7 }, (_, i) => rv(i * 0.35, `<circle cx="${80 + i * 80}" cy="130" r="22" fill="var(--bg-card)" stroke="var(--cyan)" stroke-width="2"/>` +
    text(80 + i * 80, 137, String(i + 1), { size: 18, cls: 'sv-t sv-n', anchor: 'middle' }))).join('') +
  [[19, '7 of 7', 'Ready to plan from', 'var(--green)'], [26, '5 or 6', 'Write the missing lines before 09:25', 'var(--gold)'], [33, 'Under 5', 'No trade at a level that session', 'var(--red)']].map(([d, a, b, col], i) =>
    rv(d, rect(32, 190 + i * 50, 576, 40, { fill: 'var(--bg-card)', stroke: col, sw: 1.5 }) + text(48, 216 + i * 50, a, { size: 16, weight: 700, fill: col }) + text(150, 216 + i * 50, b, { size: 15 }))).join(''));

// ---- Segment 6: your next session -----------------------------------------------
S['One row'] = (t) => {
  const cols = ['Slug', 'Near edge', 'Far edge', 'Side', 'Session scope', 'Stop sentence'];
  return svg('One row: the assignment',
    title('Your assignment: one row', 'One level from your chart, before tomorrow\'s open') +
    cols.map((c, i) => rv(5.3 - t[0] + i * 1.3, rect(32 + i * 97, 110, 93, 70, { fill: 'var(--bg-card)', stroke: 'var(--cyan)', sw: 1.5 }) +
      text(78 + i * 97, 150, c, { size: 12, weight: 700, anchor: 'middle' }))).join('') +
    rv(12, text(32, 230, 'Slug, near edge, far edge, side, session scope, stop sentence.', { size: 14, cls: 'sv-m' }) + text(32, 254, 'One row. That is the assignment.', { size: 16 })));
};

S['Summary'] = (t) => {
  const chain = [[30.7, 'Module 07', 'Reading Order Flow'], [38.4, 'Modules 10, 11', 'The two reads at these zones'], [38.4, 'Module 13', 'The trigger, inside a zone'], [47.7, 'Module 16', 'The morning sheet'], [47.7, 'Module 15', 'Every plan branch names a zone']];
  return svg('A level is a zone of finished structure',
    title('A level is a zone of finished structure', 'With a far edge a stop can sit behind, from a fixed list') +
    rv(0, rect(32, 84, 576, 50, { fill: 'var(--bg-card)', stroke: 'var(--cyan)', sw: 1.5 }) + text(48, 115, 'Everything else is mid-range. A level price is expected to reach is a target.', { size: 14 })) +
    chain.map(([d, a, b], i) => rv(d - t[0], rect(32 + (i % 2) * 292, 154 + Math.floor(i / 2) * 58, 284, 48, { fill: 'var(--bg-card)', stroke: 'var(--border-light)' }) +
      text(46 + (i % 2) * 292, 175 + Math.floor(i / 2) * 58, a, { size: 14, weight: 700, fill: 'var(--gold)' }) + text(46 + (i % 2) * 292, 192 + Math.floor(i / 2) * 58, b, { size: 12, cls: 'sv-m' }))).join(''));
};

let n = 0;
for (const seg of cfg.segments) {
  seg.slides.forEach((slide, i) => {
    const make = S[slide.title];
    if (!make) throw new Error(`no visual for slide "${slide.title}"`);
    const end = seg.slides[i + 1]?.start ?? Infinity;
    // Absolute start times of the cues inside this slide's window; t[0] is the slide start.
    const t = seg.cues.map((c) => c.start).filter((c) => c >= slide.start && c < end);
    slide.svg = make(t);
    n++;
  });
}
writeFileSync(FILE, JSON.stringify(cfg, null, 2) + '\n');
console.log(`wrote ${n} slides`);
