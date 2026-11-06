/* ============================================================
   THE BLUEPRINT — Lesson player core (lesson-core.js)
   Pure functions, no DOM. Used by js/lesson-player.js and tested
   by scripts/test-lesson.mjs.

   Lesson config (data/lessons/<module-id>.json):
   {
     "module": "<module id>",
     "segments": [{
       "id": "s1", "title": "…",
       "sections": ["h2 text", …],          // lesson h2s that belong here
       "duration": 120,                      // seconds, optional
       "audio": "path.mp3" | null,           // null = placeholder, timer clock
       "slides": [{ "id": "a", "start": 0, "title": "…", "svg": "<svg…>" }],
       "cues":   [{ "start": 0, "text": "caption line" }],
       "check":  [{ "q": "…", "options": ["…"], "answer": 1, "why": "…" }]  // 3 to 4, pass at 75%
     }],
     "quiz": { "title": "Module quiz", "questions": [ …same shape, 4 or more… ] }
   }
   Slides and cues are ordered by `start` (seconds). Both are
   optional: a segment without them renders as plain lesson text.
   ============================================================ */

// Index of the last item whose start <= t, or -1 before the first.
export function activeIndex(items, t) {
  let lo = 0;
  let hi = items.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (items[mid].start <= t) { found = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return found;
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Returns an array of problems; empty means the config is usable.
export function validateConfig(config) {
  const errs = [];
  if (!config || !Array.isArray(config.segments) || config.segments.length === 0) {
    return ['config needs a non-empty segments array'];
  }
  const ids = new Set();
  const claimed = new Set();
  for (const seg of config.segments) {
    if (!seg.id || ids.has(seg.id)) errs.push(`segment id missing or duplicated: ${seg.id}`);
    ids.add(seg.id);
    if (!Array.isArray(seg.sections) || seg.sections.length === 0) {
      errs.push(`segment ${seg.id}: sections must be a non-empty array`);
    } else {
      for (const h of seg.sections) {
        if (claimed.has(h)) errs.push(`section "${h}" is in more than one segment`);
        claimed.add(h);
      }
    }
    if (seg.check !== undefined) errs.push(...validateQuestions(`segment ${seg.id} check`, seg.check, 3, 4));
    for (const key of ['slides', 'cues']) {
      const list = seg[key] || [];
      for (let i = 0; i < list.length; i++) {
        if (typeof list[i].start !== 'number' || list[i].start < 0) {
          errs.push(`segment ${seg.id}: ${key}[${i}].start must be a number >= 0`);
        } else if (i > 0 && list[i].start < list[i - 1].start) {
          errs.push(`segment ${seg.id}: ${key} are not in start order at ${i}`);
        }
      }
    }
  }
  if (config.quiz !== undefined) errs.push(...validateQuestions('quiz', config.quiz.questions, 4, 20));
  return errs;
}

// Checks: a set of multiple-choice questions passed at 75% (3 of 4).
export const PASS_RATIO = 0.75;

export function validateQuestions(label, list, min, max) {
  const errs = [];
  if (!Array.isArray(list) || list.length < min || list.length > max) {
    return [`${label}: needs ${min} to ${max} questions`];
  }
  list.forEach((q, i) => {
    const at = `${label} q${i + 1}`;
    if (!q || typeof q.q !== 'string' || !q.q) errs.push(`${at}: q missing`);
    else {
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.some((o) => typeof o !== 'string' || !o)) errs.push(`${at}: needs 2+ text options`);
      else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) errs.push(`${at}: answer out of range`);
      if (typeof q.why !== 'string' || !q.why) errs.push(`${at}: why missing`);
    }
  });
  return errs;
}

// picks[i] is the chosen option index (or null/undefined if unanswered).
export function scoreCheck(questions, picks) {
  const total = questions.length;
  const correct = questions.reduce((n, q, i) => n + (picks[i] === q.answer ? 1 : 0), 0);
  const need = Math.ceil(total * PASS_RATIO);
  return { correct, total, need, passed: total > 0 && correct >= need };
}

// Map each h2 text to a segment index. Headings that no segment claims
// join the segment before them (the first segment if none), so a heading
// added to the lesson later is never lost from view.
export function assignSections(headings, segments) {
  const owner = new Map();
  segments.forEach((seg, i) => seg.sections.forEach((h) => owner.set(h, i)));
  let current = 0;
  return headings.map((h) => {
    if (owner.has(h)) current = owner.get(h);
    return current;
  });
}

// Per-segment resume. `store` is anything with getItem/setItem
// (localStorage, or a stub in tests). All calls tolerate failure.
export function storageKey(moduleId) { return `blueprint_lesson_${moduleId}`; }

export function loadResume(store, moduleId, segmentCount) {
  const empty = { segment: 0, positions: {} };
  try {
    const raw = JSON.parse(store.getItem(storageKey(moduleId)) || 'null');
    if (!raw || typeof raw !== 'object') return empty;
    const seg = Number.isInteger(raw.segment) && raw.segment >= 0 && raw.segment < segmentCount ? raw.segment : 0;
    const positions = {};
    for (const [k, v] of Object.entries(raw.positions || {})) {
      if (typeof v === 'number' && v >= 0) positions[k] = v;
    }
    return { segment: seg, positions };
  } catch { return empty; }
}

export function saveResume(store, moduleId, state) {
  try { store.setItem(storageKey(moduleId), JSON.stringify(state)); return true; } catch { return false; }
}

// Level-marking drill (item 9d). Pure scoring, no browser.
// An "edge" round is hit when the picked price is within `tolerance`
// points of the answer; a "judge" round is right when the choice matches.
export function scoreEdge(pick, answer, tolerance) {
  const off = Math.abs(pick - answer);
  return { hit: off <= tolerance, off };
}

export function scoreJudge(choice, isLevel) {
  return { hit: choice === isLevel };
}

export function validateDrill(drill) {
  const errs = [];
  if (!drill || !Array.isArray(drill.rounds) || drill.rounds.length === 0) return ['drill: no rounds'];
  const ids = new Set();
  for (const r of drill.rounds) {
    const w = `drill ${r.id}`;
    if (ids.has(r.id)) errs.push(`${w}: duplicate id`);
    ids.add(r.id);
    if (!r.prompt || !r.why) errs.push(`${w}: prompt and why are required`);
    if (!Array.isArray(r.bars) || r.bars.length < 20) { errs.push(`${w}: needs at least 20 bars`); continue; }
    let prevT = -Infinity;
    for (const b of r.bars) {
      const [t, o, h, l, c] = b;
      if (b.length !== 5 || !b.every(Number.isFinite)) { errs.push(`${w}: malformed bar`); break; }
      if (t <= prevT) { errs.push(`${w}: bar times must increase`); break; }
      if (h < Math.max(o, c) || l > Math.min(o, c)) { errs.push(`${w}: bar high/low does not contain open/close`); break; }
      prevT = t;
    }
    if (r.kind === 'edge') {
      if (!Number.isFinite(r.answer) || !(r.tolerance > 0)) errs.push(`${w}: edge round needs answer and tolerance`);
    } else if (r.kind === 'judge') {
      if (!Number.isFinite(r.line) || typeof r.isLevel !== 'boolean') errs.push(`${w}: judge round needs line and isLevel`);
    } else errs.push(`${w}: unknown kind`);
  }
  return errs;
}

// ---- Per-segment notes (item 9e) -------------------------------------
export function notesKey(moduleId) { return `blueprint_notes_${moduleId}`; }

export function loadNotes(store, moduleId) {
  try {
    const raw = JSON.parse(store.getItem(notesKey(moduleId)) || '{}');
    const out = {};
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      for (const [k, v] of Object.entries(raw)) if (typeof v === 'string') out[k] = v;
    }
    return out;
  } catch { return {}; }
}

export function saveNotes(store, moduleId, notes) {
  try { store.setItem(notesKey(moduleId), JSON.stringify(notes)); return true; } catch { return false; }
}

// Markdown export: one heading per segment that has a note, in lesson order.
export function notesToMarkdown(moduleTitle, segments, notes) {
  const parts = [`# ${moduleTitle}: my notes`];
  segments.forEach((s, i) => {
    const text = (notes[s.id] || '').trim();
    if (text) parts.push(`## ${i + 1}. ${s.title}\n\n${text}`);
  });
  if (parts.length === 1) parts.push('No notes yet.');
  return parts.join('\n\n') + '\n';
}
