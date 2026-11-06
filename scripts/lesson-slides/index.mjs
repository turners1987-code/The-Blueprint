// Builds slide SVGs for a lesson from the kind + data on each slide.
import { svg } from './kit.mjs';
import { KINDS } from './kinds.mjs';

// Absolute start times of the cues inside slide i's window; t[0] is the window's first cue.
export function windowCues(seg, i) {
  const slide = seg.slides[i], end = seg.slides[i + 1]?.start ?? Infinity;
  return seg.cues.map((c) => c.start).filter((c) => c >= slide.start && c < end);
}

export function buildSlide(cfg, seg, i) {
  const slide = seg.slides[i];
  const make = KINDS[slide.kind];
  if (!make) throw new Error(`${seg.id} slide "${slide.title}": unknown kind "${slide.kind}"`);
  if (!slide.data) throw new Error(`${seg.id} slide "${slide.title}": no data`);
  const t = windowCues(seg, i);
  const ctx = {
    cfg,
    at(k) {
      if (!Number.isInteger(k) || k < 0 || k >= t.length) throw new Error(`${seg.id} slide "${slide.title}": cue ${k} is outside this slide's ${t.length} cues`);
      return t[k] - t[0];
    },
  };
  return svg(slide.data.aria || slide.data.title || slide.title, make(slide.data, ctx));
}

export function buildLesson(cfg) {
  let n = 0;
  for (const seg of cfg.segments) {
    seg.slides.forEach((slide, i) => { slide.svg = buildSlide(cfg, seg, i); n++; });
  }
  return n;
}
