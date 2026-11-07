// Rewrites the "Lesson music" credit lines on ai.html from every lesson JSON's
// segment "music" blocks: one line per distinct track, in order of first use.
// Run: node scripts/build-credits.mjs   (check only: node scripts/build-credits.mjs --check)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data/lessons');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function creditLines() {
  const seen = new Map();
  for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json')).sort()) {
    const cfg = JSON.parse(readFileSync(path.join(DIR, f), 'utf8'));
    for (const seg of cfg.segments) {
      const m = seg.music;
      if (m && !seen.has(m.url)) seen.set(m.url, m);
    }
  }
  return [...seen.values()].map((m) =>
    `          <p>${esc(m.title)} by ${esc(m.producer)}, from Pixabay (<a href="${esc(m.url)}">${esc(m.url)}</a>), used under the Pixabay Content License.</p>`);
}

export function applyCredits(html) {
  // Windows checkouts carry CRLF line endings; match either and write back the same.
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  const re = /(<h3 class="mt-sm">Lesson music<\/h3>\r?\n)((?:[ \t]*<p>[^\r\n]*<\/p>\r?\n)+)/;
  if (!re.test(html)) throw new Error('ai.html: "Lesson music" heading with credit lines not found');
  const lines = creditLines();
  if (!lines.length) throw new Error('no music blocks in any lesson JSON');
  return html.replace(re, (_, h) => `${h}${lines.join(nl)}${nl}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = path.join(ROOT, 'ai.html');
  const before = readFileSync(file, 'utf8');
  const after = applyCredits(before);
  if (process.argv.includes('--check')) { console.log(before === after ? 'credits current' : 'credits out of date'); process.exit(before === after ? 0 : 1); }
  if (before !== after) writeFileSync(file, after);
  console.log(before === after ? 'ai.html credits already current' : `ai.html credits rewritten (${creditLines().length} tracks)`);
}
