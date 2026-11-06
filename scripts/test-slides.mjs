// Lesson slide kit checks: every kind renders, no text overlaps, slides are the
// kit's output (not hand-edited), cue indexes stay inside each slide's window,
// and Module 06 keeps its 16 slides.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSlide } from './lesson-slides/index.mjs';
import { KIND_NAMES } from './lesson-slides/kinds.mjs';
import { overlapsOfSvg, findOverlaps } from './lesson-slides/overlap.mjs';
import { makeBars } from './synth-bars.mjs';
import { applyCredits } from './build-credits.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data/lessons');
let failed = 0;
const eq = (name, got, want) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) { failed++; console.error(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
};

const used = new Set();
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json')).sort()) {
  const cfg = JSON.parse(readFileSync(path.join(DIR, f), 'utf8'));
  for (const seg of cfg.segments) {
    seg.slides.forEach((slide, i) => {
      const name = `${f} ${seg.id} "${slide.title}"`;
      eq(`${name} has kind and data`, [typeof slide.kind, typeof slide.data], ['string', 'object']);
      let built;
      try { built = buildSlide(cfg, seg, i); } catch (e) { eq(`${name} builds`, e.message, 'ok'); return; }
      used.add(slide.kind);
      eq(`${name} svg is the kit's output`, slide.svg === built, true);
      eq(`${name} text overlap`, overlapsOfSvg(built), []);
      eq(`${name} is an svg`, built.startsWith('<svg') && built.endsWith('</svg>'), true);
    });
  }
}

// Every kind in the kit is rendered by at least one shipped lesson.
eq('every kind renders in a shipped lesson', KIND_NAMES.filter((k) => !used.has(k)), []);

// Module 06 keeps its 16 slides.
const m06 = JSON.parse(readFileSync(path.join(DIR, '06-what-counts-as-a-level.json'), 'utf8'));
eq('module 06 slide count', m06.segments.reduce((n, s) => n + s.slides.length, 0), 16);

// The overlap check itself: it must catch a straddled card edge and colliding text.
eq('overlap catches collision', findOverlaps({ texts: [{ s: 'a', x: 10, y: 10, w: 50, h: 14 }, { s: 'b', x: 40, y: 12, w: 50, h: 14 }], rects: [] }).length, 1);
eq('overlap catches straddle', findOverlaps({ texts: [{ s: 'a', x: 90, y: 10, w: 40, h: 14 }], rects: [{ x: 0, y: 0, w: 100, h: 40, opaque: true }] }).length, 1);
eq('overlap allows contained', findOverlaps({ texts: [{ s: 'a', x: 10, y: 10, w: 40, h: 14 }], rects: [{ x: 0, y: 0, w: 100, h: 40, opaque: true }] }), []);

// A bad cue index is a build error, not a silent mistime.
{
  const seg = m06.segments[0];
  const bad = structuredClone(m06);
  bad.segments[0].slides[0].data.banner.cue = 99;
  let msg = '';
  try { buildSlide(bad, bad.segments[0], 0); } catch (e) { msg = e.message; }
  eq('cue outside window is an error', /outside this slide/.test(msg), true);
  eq('seg untouched', seg.id, 's1');
}

// Chart stories are data: same story, same bars; bad regimes are rejected.
const story = { seed: 5, start: 100, regimes: [{ kind: 'approach', n: 5, drift: 1, vol: 0.5 }] };
eq('story is deterministic', JSON.stringify(makeBars(story)), JSON.stringify(makeBars(story)));
eq('story length', makeBars(story).length, 5);
let thrown = false; try { makeBars({ ...story, regimes: [{ kind: 'test', n: 3, drift: 0, vol: 1 }] }); } catch { thrown = true; }
eq('test regime needs cap', thrown, true);
for (const r of m06.segments.find((s) => s.drill).drill.rounds) {
  eq(`drill ${r.id} bars match its story`, JSON.stringify(makeBars(r.story)), JSON.stringify(r.bars));
}

// ai.html music credits match the lesson music blocks.
const ai = readFileSync(path.join(ROOT, 'ai.html'), 'utf8');
eq('ai.html credits current', applyCredits(ai) === ai, true);

if (failed) { console.error(`${failed} slide check(s) failed`); process.exit(1); }
console.log(`slide checks passed (${used.size} kinds)`);
