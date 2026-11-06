// Lesson player core: timing lookup, config validation, section
// assignment and per-segment resume. Pure functions, no browser.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { activeIndex, formatTime, validateConfig, assignSections, loadResume, saveResume, scoreCheck, validateQuestions, scoreEdge, scoreJudge, validateDrill, loadNotes, saveNotes, notesToMarkdown, musicGains, voiceStemUrl, loadMusicLevel, saveMusicLevel, DEFAULT_MUSIC_LEVEL, MUSIC_KEY } from '../js/lesson-core.js';

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
// 9f: designed slide visuals, with reveals timed to cues, no external assets.
eq('9f slide count unchanged', cfg.segments.map((x) => x.slides.length), [2, 2, 3, 3, 3, 2]);
eq('9f every slide has a reveal and a 16:9 viewBox', cfg.segments.every((x) => x.slides.every((sl) => sl.svg.includes('sv-rv') && sl.svg.includes('viewBox="0 0 640 360"'))), true);
eq('9f slides load nothing external', cfg.segments.some((x) => x.slides.some((sl) => /<image|<script|href=|url\(http|https?:/.test(sl.svg.replace('xmlns="http://www.w3.org/2000/svg"', '')))), false);
eq('9f slide text: no banned wording', /beginner|advanced|validated|unproven|\bkilled\b|\$\d/i.test(cfg.segments.flatMap((x) => x.slides.map((sl) => sl.svg)).join(' ')), false);
const narration = cfg.segments.flatMap((x) => x.cues.map((c) => c.text)).join(' ');
eq('no banned wording', /beginner|advanced|validated|unproven|\bkilled\b|\$\d/i.test(narration), false);
eq('stat carries n', /82\.4%[\s\S]{0,160}n=994/.test(narration), true);

// 9c: checks and quiz.
const mkq = (a) => ({ q: 'x', options: ['a', 'b', 'c'], answer: a, why: 'y' });
const four = [mkq(0), mkq(1), mkq(2), mkq(0)];
eq('3 of 4 passes', scoreCheck(four, [0, 1, 2, 1]), { correct: 3, total: 4, need: 3, passed: true });
eq('2 of 4 fails', scoreCheck(four, [0, 1, 0, 1]).passed, false);
eq('unanswered fails', scoreCheck(four, [null, null, null, null]).correct, 0);
eq('8-question quiz needs 6', scoreCheck(Array(8).fill(mkq(0)), Array(8).fill(0)).need, 6);
eq('bad answer index', validateQuestions('t', [mkq(5), mkq(0), mkq(0)], 3, 4).length, 1);
eq('too few questions', validateQuestions('t', [mkq(0)], 3, 4).length, 1);
for (const seg of cfg.segments) {
  eq(`${seg.id} has a 3-4 question check`, validateQuestions(seg.id, seg.check, 3, 4), []);
}
eq('module quiz valid', validateQuestions('quiz', cfg.quiz?.questions, 4, 20), []);
const qtext = JSON.stringify([cfg.segments.map((x) => x.check), cfg.quiz]);
eq('checks: no banned wording', /beginner|advanced|validated|unproven|\bkilled\b|\$\d/i.test(qtext), false);
eq('checks: stat carries n', /82\.4%[\s\S]{0,60}n=994/.test(qtext), true);
eq('checks: answers spread', new Set(cfg.segments.flatMap((x) => x.check.map((c) => c.answer))).size > 1, true);

// 9d: level-marking drill.
eq('edge hit', scoreEdge(24186, 24186.5, 1.5).hit, true);
eq('edge miss', scoreEdge(24180, 24186.5, 1.5).hit, false);
eq('judge right', scoreJudge(false, false).hit, true);
eq('judge wrong', scoreJudge(true, false).hit, false);
const drill = cfg.segments.find((x) => x.drill)?.drill;
eq('module 06 drill valid', validateDrill(drill), []);
eq('drill has edge and judge rounds', [...new Set(drill.rounds.map((r) => r.kind))].sort(), ['edge', 'judge']);
eq('edge answers equal the extreme of their bars', drill.rounds.filter((r) => r.kind === 'edge').map((r) => {
  const hi = Math.max(...r.bars.map((b) => b[2])); const lo = Math.min(...r.bars.map((b) => b[3]));
  return r.answer === hi || r.answer === lo;
}), [true, true]);
eq('drill: no bars from a real session', /real|exported/i.test(drill.intro) && !/not|invented|synthetic/i.test(drill.intro), false);
eq('drill: bad bar rejected', validateDrill({ rounds: [{ id: 'x', kind: 'edge', prompt: 'p', why: 'w', answer: 1, tolerance: 1, bars: Array(25).fill([1, 5, 4, 3, 4]) }] }).length > 0, true);
eq('drill: no banned wording', /beginner|advanced|validated|unproven|\bkilled\b|\$\d/i.test(JSON.stringify(drill.rounds.map((r) => [r.prompt, r.why]))), false);
eq('vendor notice kept', /TradingView/.test(readFileSync(path.join(ROOT, 'js/vendor/NOTICE-lightweight-charts.txt'), 'utf8')), true);
eq('vendor license kept', /Apache License/.test(readFileSync(path.join(ROOT, 'js/vendor/LICENSE-lightweight-charts.txt'), 'utf8')), true);

// 9e: notes
const ns = mem();
eq('fresh notes', loadNotes(ns, 'm'), {});
saveNotes(ns, 'm', { a: 'one', b: '  ' });
eq('notes round trip', loadNotes(ns, 'm'), { a: 'one', b: '  ' });
ns.setItem('blueprint_notes_bad', '[1,2]');
eq('bad notes shape', loadNotes(ns, 'bad'), {});
eq('throwing notes store', saveNotes({ setItem() { throw new Error('x'); } }, 'm', {}), false);
const segsN = [{ id: 'a', title: 'First' }, { id: 'b', title: 'Second' }, { id: 'c', title: 'Third' }];
eq('markdown export', notesToMarkdown('Mod', segsN, { a: 'one', b: ' ', c: 'three' }), '# Mod: my notes\n\n## 1. First\n\none\n\n## 3. Third\n\nthree\n');
eq('markdown empty', notesToMarkdown('Mod', segsN, {}), '# Mod: my notes\n\nNo notes yet.\n');

// Music-only volume: two stems per segment, same length, default g = 0.5.
function mp3Seconds(file) {
  const b = readFileSync(file);
  let i = 0;
  if (b.toString('latin1', 0, 3) === 'ID3') i = 10 + ((b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9]);
  const rates = { 0: 22050, 1: 24000, 2: 16000 };
  const kbps = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
  let samples = 0;
  while (i + 4 <= b.length) {
    if (b[i] === 0xff && (b[i + 1] & 0xfe) === 0xf2) { // MPEG-2, layer III
      const br = kbps[b[i + 2] >> 4] * 1000; const sr = rates[(b[i + 2] >> 2) & 3];
      if (!br || !sr) break;
      const len = Math.floor(72 * br / sr) + ((b[i + 2] >> 1) & 1);
      samples += 576; i += len;
    } else i++;
  }
  return samples / 24000;
}
for (const seg of cfg.segments) {
  const mixFile = path.join(ROOT, 'assets/audio/06', `${seg.id}.mp3`);
  const voiceFile = path.join(ROOT, 'assets/audio/06', `${seg.id}.voice.mp3`);
  eq(`${seg.id} audio field points at the mix`, seg.audio, `../assets/audio/06/${seg.id}.mp3`);
  eq(`${seg.id} voice stem path`, voiceStemUrl(seg.audio), `../assets/audio/06/${seg.id}.voice.mp3`);
  eq(`${seg.id} has mix and voice files`, [existsSync(mixFile), existsSync(voiceFile)], [true, true]);
  if (existsSync(mixFile) && existsSync(voiceFile)) {
    const a = mp3Seconds(mixFile); const v = mp3Seconds(voiceFile);
    eq(`${seg.id} stems match within 0.05 s`, Math.abs(a - v) <= 0.05, true);
    eq(`${seg.id} stem length matches duration within 0.2 s`, Math.abs(a - seg.duration) <= 0.2, true);
  }
}
eq('no music-only file on the site', readdirSync(path.join(ROOT, 'assets/audio/06')).filter((f) => /music|bed|beat/i.test(f)), []);
eq('default music level is 50', DEFAULT_MUSIC_LEVEL, 50);
eq('default g = 0.5', musicGains(DEFAULT_MUSIC_LEVEL), { mix: 0.5, voice: 0.5 });
eq('g = 0 is the voice stem alone', musicGains(0), { mix: 0, voice: 1 });
eq('mute sets g to 0', musicGains(70, true), { mix: 0, voice: 1 });
eq('g = 1 is the full mix', musicGains(100), { mix: 1, voice: 0 });
eq('mix and voice gains always sum to 1', [0, 25, 50, 80, 100].every((l) => { const g = musicGains(l); return Math.abs(g.mix + g.voice - 1) < 1e-12; }), true);
eq('bad level falls back to 50', musicGains('x'), { mix: 0.5, voice: 0.5 });
const ms = mem();
eq('fresh music level', loadMusicLevel(ms), { level: 50, muted: false });
saveMusicLevel(ms, { level: 30, muted: true });
eq('music level round trip', [MUSIC_KEY, loadMusicLevel(ms)], ['bp_music_level', { level: 30, muted: true }]);
ms.setItem(MUSIC_KEY, '{oops');
eq('corrupt music level', loadMusicLevel(ms), { level: 50, muted: false });
ms.setItem(MUSIC_KEY, JSON.stringify({ level: 900 }));
eq('out of range music level', loadMusicLevel(ms).level, 50);
eq('throwing music store', [loadMusicLevel({ getItem() { throw new Error('x'); } }), saveMusicLevel({ setItem() { throw new Error('x'); } }, { level: 1 })], [{ level: 50, muted: false }, false]);
eq('service worker never caches audio', /assets\/audio\//.test(readFileSync(path.join(ROOT, 'sw.js'), 'utf8')) && !/assets\/audio[^']*'\s*,/.test(readFileSync(path.join(ROOT, 'sw.js'), 'utf8')), true);

if (failed) { console.error(`${failed} lesson check(s) failed`); process.exit(1); }
console.log('lesson: all checks passed');
