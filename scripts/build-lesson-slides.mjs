// Builds the slide visuals for a lesson from the kind + data on each slide
// (scripts/lesson-slides/). A module author writes data; svg is generated.
// Slide count, titles and start times are kept; only each slide's svg changes.
// Run: node scripts/build-lesson-slides.mjs [NN | path/to/lesson.json ...]
//   no argument: every lesson in data/lessons/
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLesson } from './lesson-slides/index.mjs';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/lessons');
const all = readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
const args = process.argv.slice(2);
const files = args.length === 0 ? all.map((f) => path.join(DIR, f)) : args.map((a) => {
  if (a.endsWith('.json')) return path.resolve(a);
  const hit = all.find((f) => f.startsWith(`${String(a).padStart(2, '0')}-`));
  if (!hit) throw new Error(`no lesson for "${a}"`);
  return path.join(DIR, hit);
});
for (const file of files) {
  const cfg = JSON.parse(readFileSync(file, 'utf8'));
  const n = buildLesson(cfg);
  writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
  console.log(`${path.basename(file)}: wrote ${n} slides`);
}
