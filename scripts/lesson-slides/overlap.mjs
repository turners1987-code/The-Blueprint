// Text-overlap check for slides: bounding boxes of text against other text and
// against card rectangles. Pure Node: text boxes are estimated from font size
// (see the render script for the browser-measured version of the same check).
//
// A text box may sit wholly inside a rect, or wholly outside it. It must not
// straddle a rect's edge, and two texts must not overlap.

const BOLD = 0.54, REG = 0.5, MONO = 0.6; // em per character, calibrated on the rendered Module 06 slides

export function parseSvg(svg) {
  // chart candles live in .sv-dr groups; their many small rects are not cards
  const body = svg.replace(/<g class="sv-dr"[^>]*>[\s\S]*?<\/g>/g, '').replace(/<style>[\s\S]*?<\/style>/, '');
  const attr = (tag, k) => (new RegExp(`\\s${k}="([^"]*)"`).exec(tag) || [])[1];
  const texts = [...body.matchAll(/<text\b[^>]*>[\s\S]*?<\/text>/g)].map(([tag]) => {
    const size = +attr(tag, 'font-size'), x = +attr(tag, 'x'), y = +attr(tag, 'y');
    const s = tag.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const mono = /sv-n/.test(attr(tag, 'class') || '');
    const k = mono ? MONO : +attr(tag, 'font-weight') >= 700 ? BOLD : REG;
    const w = s.length * size * k, anchor = attr(tag, 'text-anchor');
    const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    return { s, x: left, y: y - size * 0.8, w, h: size * 1.0 };
  });
  const rects = [...body.matchAll(/<rect\b[^>]*\/>/g)].map(([tag]) => ({
    x: +attr(tag, 'x'), y: +attr(tag, 'y'), w: +attr(tag, 'width'), h: +attr(tag, 'height'),
    opaque: attr(tag, 'opacity') === undefined && attr(tag, 'stroke') !== 'none',
  }));
  return { texts, rects };
}

const inter = (a, b) => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? { w, h } : null;
};
const inside = (t, r, pad) => t.x >= r.x - pad && t.y >= r.y - pad && t.x + t.w <= r.x + r.w + pad && t.y + t.h <= r.y + r.h + pad;

export function findOverlaps({ texts, rects }, { pad = 2, textTol = 2 } = {}) {
  const out = [];
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const o = inter(texts[i], texts[j]);
      if (o && o.w > textTol && o.h > textTol) out.push(`text "${texts[i].s}" overlaps text "${texts[j].s}"`);
    }
    for (const r of rects) {
      if (!r.opaque) continue;
      const o = inter(texts[i], r);
      if (o && o.w > textTol && o.h > textTol && !inside(texts[i], r, pad)) out.push(`text "${texts[i].s}" straddles a card edge`);
    }
    const t = texts[i];
    if (t.x < -1 || t.x + t.w > 641 || t.y < -1 || t.y + t.h > 361) out.push(`text "${t.s}" leaves the slide`);
  }
  return out;
}

export const overlapsOfSvg = (svg) => findOverlaps(parseSvg(svg));
