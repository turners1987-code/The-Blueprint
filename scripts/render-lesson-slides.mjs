// Renders every slide of a lesson JSON at its final reveal state (animations
// off, everything visible) to PNG, and reports text-vs-rect overlap per slide.
// Run: node scripts/render-lesson-slides.mjs <lesson.json> <outDir>
// Used for the before/after compare of a kit change and for item B reviews.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findOverlaps } from './lesson-slides/overlap.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

export async function renderSlides(lessonFile, outDir, { shots = true } = {}) {
  const { chromium } = require('playwright');
  const cfg = JSON.parse(readFileSync(lessonFile, 'utf8'));
  const css = readFileSync(path.join(ROOT, 'css/main.css'), 'utf8');
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 1 });
  const report = [];
  for (const seg of cfg.segments) {
    for (const [i, slide] of seg.slides.entries()) {
      await page.setContent(`<!doctype html><style>${css}
        html,body{margin:0;background:var(--bg-primary,#0b0f14)}svg{display:block;width:640px;height:360px}
        *{animation:none!important}</style>${slide.svg}`);
      const name = `${seg.id}-${i + 1}`;
      if (shots) await page.screenshot({ path: path.join(outDir, `${name}.png`) });
      const boxes = await page.evaluate(() => {
        const svg = document.querySelector('svg');
        const rel = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
        return {
          texts: [...svg.querySelectorAll('text')].map((t) => ({ s: t.textContent, ...rel(t) })),
          rects: [...svg.querySelectorAll('rect')].filter((r) => r.getAttribute('fill') !== 'none' || r.getAttribute('stroke') !== 'none').map(rel),
        };
      });
      report.push({ name, title: slide.title, overlaps: findOverlaps(boxes) });
    }
  }
  await browser.close();
  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [file, out] = process.argv.slice(2);
  if (!file || !out) { console.error('usage: node scripts/render-lesson-slides.mjs <lesson.json> <outDir>'); process.exit(2); }
  const rep = await renderSlides(path.resolve(file), path.resolve(out));
  writeFileSync(path.join(out, 'report.json'), JSON.stringify(rep, null, 2));
  for (const r of rep) console.log(r.name, r.title, r.overlaps.length ? `OVERLAP ${JSON.stringify(r.overlaps)}` : 'ok');
}
