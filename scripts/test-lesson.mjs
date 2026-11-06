// Lesson player core: timing lookup, config validation, section
// assignment and per-segment resume. Pure functions, no browser.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { activeIndex, formatTime, validateConfig, assignSections, loadResume, saveResume } from '../js/lesson-core.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { failed++; console.error(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
};

const cues = [{ start: 0 }, { start: 5 }, { start: 12 }];
eq('before first', activeIndex([{ start: 2 }], 1), -1);
eq('at start', activeIndex(cues, 0), 0);
eq('between', activeIndex(cues, 11.9), 1);
eq('on boundary', activeIndex(cues, 12), 2);
eq('past end', activeIndex(cues, 999), 2);
eq('empty', activeIndex([], 3), -1);
eq('format', [formatTime(0), formatTime(65), formatTime(-4), formatTime(NaN)], ['0:00', '1:05', '0:00', '0:00']);

const good = { segments: [{ id: 'a', sections: ['X'] }, { id: 'b', sections: ['Y', 'Z'] }] };
eq('valid', validateConfig(good), []);
eq('empty config', validateConfig({}).length, 1);
eq('dup section', validateConfig({ segments: [{ id: 'a', sections: ['X'] }, { id: 'b', sections: ['X'] }] }).length, 1);
eq('dup id', validateConfig({ segments: [{ id: 'a', sections: ['X'] }, { id: 'a', sections: ['Y'] }] }).length, 1);
eq('cue order', validateConfig({ segments: [{ id: 'a', sections: ['X'], cues: [{ start: 5 }, { start: 2 }] }] }).length, 1);

eq('unclaimed joins previous', assignSections(['X', 'New', 'Y', 'Z'], good.segments), [0, 0, 1, 1]);
eq('unclaimed first', assignSections(['New', 'X'], good.segments), [0, 0]);

const mem = () => { const m = {}; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = v; } }; };
const s = mem();
eq('fresh resume', loadResume(s, 'm', 3), { segment: 0, positions: {} });
saveResume(s, 'm', { segment: 2, positions: { a: 41 } });
eq('round trip', loadResume(s, 'm', 3), { segment: 2, positions: { a: 41 } });
eq('segment out of range', loadResume(s, 'm', 2).segment, 0);
s.setItem('blueprint_lesson_bad', '{not json');
eq('corrupt store', loadResume(s, 'bad', 3), { segment: 0, positions: {} });
eq('throwing store', saveResume({ setItem() { throw new Error('x'); } }, 'm', {}), false);

// The shipped Module 06 config must be valid and claim real headings.
const cfg = JSON.parse(readFileSync(path.join(ROOT, 'data/lessons/06-what-counts-as-a-level.json'), 'utf8'));
eq('module 06 config valid', validateConfig(cfg), []);
const html = readFileSync(path.join(ROOT, 'modules/06-what-counts-as-a-level.html'), 'utf8');
const h2s = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map((m) => m[1].replace(/<[^>]*>/g, '').trim());
const claimed = cfg.segments.flatMap((x) => x.sections);
eq('every claimed section exists', claimed.filter((c) => !h2s.includes(c)), []);
eq('every h2 is claimed', h2s.filter((h) => !claimed.includes(h)), []);

// 9b: every segment carries narration cues and slides, in order, inside its duration.
for (const seg of cfg.segments) {
  const ordered = (a) => a.every((x, i) => i === 0 || x.start >= a[i - 1].start);
  eq(`${seg.id} has cues`, seg.cues?.length > 0, true);
  eq(`${seg.id} has slides`, seg.slides?.length > 0, true);
  eq(`${seg.id} slides start at 0`, seg.slides?.[0]?.start, 0);
  eq(`${seg.id} slides ordered`, ordered(seg.slides || []), true);
  eq(`${seg.id} within duration`, [...seg.cues, ...seg.slides].every((x) => x.start < seg.duration), true);
  eq(`${seg.id} slide svg`, seg.slides.every((x) => x.svg.startsWith('<svg') && x.svg.endsWith('</svg>')), true);
}
const narration = cfg.segments.flatMap((x) => x.cues.map((c) => c.text)).join(' ');
eq('no banned wording', /beginner|advanced|validated|unproven|\bkilled\b|\$\d/i.test(narration), false);
eq('stat carries n', /82\.4%[\s\S]{0,160}n=994/.test(narration), true);

if (failed) { console.error(`${failed} lesson check(s) failed`); process.exit(1); }
console.log('lesson: all checks passed');
