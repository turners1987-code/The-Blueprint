// Drawing primitives for lesson slides: 640 x 360, design-system tokens only.
export const W = 640, H = 360;

export const STYLE = `<style>
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

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// tone name -> CSS colour token
export const TONES = ['cyan', 'gold', 'green', 'red'];
export const col = (tone) => {
  if (!tone || tone === 'line') return 'var(--border-light)';
  if (tone === 'muted') return 'var(--text-muted)';
  if (tone === 'text') return 'var(--text-primary)';
  if (tone === 'second') return 'var(--text-secondary)';
  if (tone === 'card') return 'var(--bg-card)';
  if (TONES.includes(tone)) return `var(--${tone})`;
  throw new Error(`unknown tone "${tone}"`);
};

export const rv = (d, inner, cls = 'sv-rv') =>
  `<g class="${cls}" style="animation-delay:${Math.max(0, d).toFixed(1)}s">${inner}</g>`;

// cls: t (primary), m (secondary), d (muted); mono adds the number font
export const text = (x, y, s, { size = 16, cls = 'sv-t', anchor = 'start', weight = 400, fill = '' } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" class="${cls}"${fill ? ` style="fill:${fill}"` : ''}>${esc(s)}</text>`;

export const rect = (x, y, w, h, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 4}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.sw || 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op ? ` opacity="${o.op}"` : ''}/>`;

export const line = (x1, y1, x2, y2, stroke, o = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${o.sw || 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;

export const title = (s, sub) => text(32, 40, s, { size: 24, weight: 700 }) + (sub ? text(32, 62, sub, { size: 14, cls: 'sv-m' }) : '');

export const CREDIT = 'Composite chart. Invented prices, synthetic bars.';
export const credit = (s = CREDIT) => text(W - 24, H - 14, s, { size: 11, cls: 'sv-d', anchor: 'end' });

export const svg = (label, body) =>
  `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label)}">${STYLE}${body}</svg>`;

// Text class from a short name: t, m, d; "n" adds the mono face.
export const cls = (c = 't') => c.split(' ').map((x) => (x === 'n' ? 'sv-n' : `sv-${x}`)).join(' ');

// A card: bordered box with an optional head and lines.
export function card(c) {
  const [x, y, w, h] = c.box;
  const tone = c.tone, sw = c.sw || 1;
  let out = rect(x, y, w, h, { fill: 'var(--bg-card)', stroke: col(tone), sw, rx: c.rx });
  const center = c.align === 'center';
  const tx = center ? x + w / 2 : x + (c.hx ?? 14);
  const anchor = center ? 'middle' : 'start';
  if (c.head) {
    out += text(tx, y + (c.hy ?? 24), c.head, {
      size: c.headSize ?? 13, weight: c.headWeight ?? 700, anchor,
      cls: cls(c.headCls || 't'), fill: c.headTone ? col(c.headTone) : '',
    });
  }
  (c.lines || []).forEach((l, i) => {
    out += text(tx, y + (c.lead ?? 46) + i * (c.pitch ?? 18), l, { size: c.size ?? 12, cls: cls(c.cls || 'm'), anchor });
  });
  if (c.art === 'overlap') {
    out += rect(x + 16, y + 36, 90, 22, { fill: 'var(--gold)', op: 0.35, rx: 0 }) + rect(x + 52, y + 48, 90, 22, { fill: 'var(--cyan)', op: 0.35, rx: 0 });
  }
  return out;
}
