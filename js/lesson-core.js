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
       "cues":   [{ "start": 0, "text": "caption line" }]
     }]
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
  return errs;
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
