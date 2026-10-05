# BLUEPRINT_DOC — The Blueprint eLearning Platform

Version 3.0 · 2026-10-05
Replaces every earlier BLUEPRINT_DOC. Where an older copy disagrees with this file,
this file wins. Delete the old copies rather than keeping two sources.

**Live:** https://turners1987-code.github.io/The-Blueprint
**Short link:** https://bit.ly/TheBlueprint_Trade
**Repo:** https://github.com/turners1987-code/The-Blueprint
**Local path:** `C:\Blueprint\The-Blueprint` (both laptops, cloned from git — never in Google Drive)

---

## 1. What this is

A free, progressive eLearning platform teaching Shane's intraday futures framework. Built as a
progressive framework rather than levelled content. Friends and family first, then students and
site users.

Planned monetization: a bundle at roughly $7/month covering the NT8 tools (order entry, levels),
the journal, the chart-capture tool, and the course. The aim is cheap tools for traders who
can't afford the usual prices.

**Owner:** Shane. Not a developer — Claude Code does the building, this project does
architecture, specs, and handoff prompts.

**Division of sources:**

| File | Owns |
| --- | --- |
| This file | The site: stack, architecture, conventions, build state |
| `reference/TAXONOMY.md` | Vocabulary and record structure — setups, triggers, locations, grades, gates |
| `reference/METHODOLOGY_v2.md` | What the method is — the content source for lessons |
| `reference/setup-definitions.txt` | Shane's own setup wording, verbatim from TurtleMetrics |
| `reference/review-questions.txt` | The six-question discipline checklist |
| `reference/TradingStats_Source_of_Truth.txt` | NQ base rates, 3,163 sessions |
| Hypothesis Register (Future project) | All evidence: n, expectancy, hit rates |

Nothing in this file states a statistic. Evidence lives in the register and goes stale; a copy
here would be a copy that is wrong within months.

---

## 2. Stack and hosting

- Pure HTML / CSS / JS. **No framework, no bundler, no build step.**
- Native ES modules (`<script type="module">`) — works on GitHub Pages directly.
- Hosted free on GitHub Pages from `main`. Deploys take 1–10 minutes.
- Content lives in `data/*.json`; code renders it.
- PWA: installable, offline-capable via service worker.

**Migration target:** Cloudflare Pages. GitHub Pages' terms prohibit sites primarily
facilitating commercial transactions, so the day the bundle sells, the site moves. Moving a
static site is one afternoon. Don't pre-migrate; know where the exit is.

---

## 3. Design system

`css/main.css` is the single source of truth. Page-specific CSS lives in `css/<page>.css`.
No `<style>` blocks in HTML — the check script enforces this.

```
--black:#02070d  --bg:#071426  --bg-card:#0a1d33  --bg-elevated:#0e2a48  --bg-hover:#143a5e
--border:rgba(56,217,255,0.18)  --border-light:rgba(180,232,255,0.34)
--text-primary:#f3fbff  --text-secondary:#b8cad8  --text-muted:#6f8ba0
--gold:#f5b94c  --gold-dark:#b98222  --cyan:#38d9ff  --cyan-dark:#0a8fb0
--green:#31e08b  --red:#ff4d63
--grade-a:#31e08b  --grade-b:#f5b94c  --grade-c:#ff4d63
--font-display:'Barlow Condensed'  --font-body:'Barlow'  --font-mono:'Share Tech Mono'
--space-xs:4 --space-sm:8 --space-md:16 --space-lg:24 --space-xl:40 --space-2xl:64 --space-3xl:96
--radius-sm:2 --radius-md:4 --radius-lg:6
--max-content:900px --max-wide:1200px
```

Known as "Blueprint Navy" v2. Any older doc describing a near-black palette with `#f0a500` gold
is wrong and predates the v2 theme.

**Path rules:** root pages use `css/` and `js/`; module pages use `../css/` and `../js/`.
Enforced by the check script.

---

## 4. File structure

```
index.html              landing page, module grid rendered from data
glossary.html           20 terms, inline search
404.html                uses <base href="/The-Blueprint/"> — BREAKS on a custom domain
sitemap.xml  robots.txt  manifest.json  sw.js  package.json
css/   main.css, modules.css, index.css, glossary.css, dial-in.css,
       flashcards.css, toothbrush-therapy.css, 404.css
js/    nav.js       injects the shared nav on every page; registers the service worker
       progress.js  localStorage progress, schema v2, migration map
       modules.js   renders the module grid from data/modules.json
       main.js      scroll reveals, quizzes, misc page behaviour
       cards.json   32-card flashcard deck
       glossary.js  EMPTY — orphan, delete when the glossary is rebuilt
data/  modules.json  17 modules, the curriculum source of truth
modules/  00-welcome.html, 13-toothbrush-therapy.html, dial-in.html, flashcards.html
assets/   favicon.svg, icon-192/512 (+maskable), og-image, screenshots
scripts/  check.mjs    repo validation
reference/  the source material listed in section 1
```

---

## 5. The check script

`npm run check` — Node only, no dependencies. Exits non-zero on any error. Every build prompt
ends with it.

1. Every link, script, img and internal href resolves, with correct `../` depth
2. Exactly one `<h1>` per page
3. Non-empty `<title>` and `<meta name="description">`
4. No `<style>` blocks
5. Page has `<div id="nav-root">` and loads `js/nav.js`
6. No banned positioning phrases — "complete beginner(s)", "for beginners",
   "beginner-friendly", "no experience required", "we assume you know nothing",
   "beginner/advanced" as a level label, "newbie". Plain descriptive "advanced" passes.
7. Every `data-module-id` exists in `data/modules.json`
8. Unreferenced css/js files reported as warnings
9. Any percentage inside a `.stat-block` element must carry its sample size

0-byte HTML files are listed as STUB and skipped; `--strict` audits them.

**Current state: 0 errors, 1 warning** (`js/glossary.js` unreferenced).

---

## 6. Curriculum — 17 modules, four parts

Source of truth is `data/modules.json`. Status is `published`, `drafting`, or `planned`.
Planned modules render as non-clickable "Coming soon" cards.

| # | Module | Part |
| --- | --- | --- |
| 00 | Welcome & Orientation | start |
| 01 | How We Know What We Know | start |
| 02 | The Three Tiers | blueprint |
| 03 | What Counts As A Level | blueprint |
| 04 | Trend Continuation | blueprint |
| 05 | Range Rejection | blueprint |
| 06 | The Gap Setups | blueprint |
| 07 | Triggers | blueprint |
| 08 | Trade Construction | blueprint |
| 09 | The Hard Rules | blueprint |
| 10 | The Pre-Market Routine | process |
| 11 | The Post-Session Routine | process |
| 12 | Journaling & Review | process |
| 13 | Toothbrush Therapy | process |
| 14 | Reading A Probability | capstone |
| 15 | Building Your Own PlayBook | capstone |
| 16 | What I Got Wrong | capstone |

Only 00 and 13 have content. 00 still teaches the retired seven-setup structure and needs a
rewrite against `METHODOLOGY_v2.md`.

Cut deliberately: market basics, chart reading, order types, tools, psychology. Commodity
content available free elsewhere; becomes a curated reading-list page if wanted. ORB and
Second Chance are retired and appear only in What I Got Wrong.

---

## 7. Content rules

- **No beginner/advanced labels anywhere.** Enforced by check 6.
- **R, never dollar income claims.** Public educational site.
- Every directional statement follows Blueprint framing: conditional if/then with a named
  level, a named behaviour, an invalidation, and a conviction level.
- Every setup and trigger page carries its **status badge and its n**.
- **Nothing is presented as settled until VALIDATED.** As of this version nothing is.
- Statistics live behind the explanation, never in front. Always tied to a specific setup,
  rule or routine. Never presented as a signal. Always carry sample size — enforced by check 9.
- TradingStats cited by name. Their gap definition differs from the Blueprint's, so their
  gap-fill rate is **never** quoted as Blueprint evidence.
- Source books (Bellafiore, Dalton, Trader Dale) taught as concepts in Shane's words. Never
  reproduce their text or figures.
- MNQ is where Shane trades, not what the method is. Framework first.
- Any backtest or hypothetical result shown carries CFTC Rule 4.41 language.

---

## 8. Build order

Content comes **last**, after the crawls, research and compiling are done and reviewed.
Decided 2026-10-05. Writing lessons before the research lands means rewriting them.

1. ~~Site foundation~~ — done
2. **Journal** — schema, analysis module, manual entry first
3. **Tool downloads** — KeyLevels first; BP Draft, Cockpit, ChartSnap as they ship
4. **NT8 capture contract** — specced here, built in the NT8 project
5. **Content** — once the register and crawls are in

**Blocked elsewhere:** the NT8 tools themselves, ChartSnap (planned, not built), all lesson
content, and NinjaTrader's commercial distribution rules (unread crawl target — must be read
before anything ships with a price).

---

## 9. Ways of working

- **Pull before starting, push when stopping.** Two laptops; this is not optional.
- Local preview: `npx serve -l 8080` in a separate cmd window. `fetch` is blocked on `file://`,
  so double-clicking an HTML file shows an empty module grid.
- Live check only when a push changed how scripts load or fetch. Hard-refresh, then F12
  console. `favicon.ico 404` is noise; anything else is real.
- Structural changes go to a branch first; content and small fixes go straight to main.
- Verify GitHub state **by commit SHA**, not by branch ref — `raw.githubusercontent.com`
  caches branch refs for several minutes and will serve stale content.
- Terminal is Command Prompt, not PowerShell.
- Claude Code cannot see Claude Projects. Anything it needs must be in `reference/`.
- One task per prompt. Every prompt ends with `npm run check`.

---

## 10. Known issues

- `modules/00-welcome.html` teaches seven setups — contradicts v2. Needs rewrite.
- `js/glossary.js` is an empty orphan.
- Glossary has 20 terms hardcoded in HTML; should move to `data/glossary.json`.
- `404.html` hardcodes `<base href="/The-Blueprint/">` — breaks on a custom domain.
- The `drafting` card rendering has never been exercised in a browser; no module currently
  carries that status.
- Dial In's result copy still says "Your path starts with Module 01" while the CTA points at
  00-welcome.

---

## 11. Open decisions

- Do paying customers get the localStorage journal or a hosted one? Hosted means accounts,
  payment and a backend — a different product.
- Is the student journal in scope for v1, or is v1 only Shane's?
- Custom domain (BlueprintTrading.com under consideration) — decides the `404.html` base-href
  fix and the Cloudflare migration timing.
- Four open items in `TAXONOMY.md`: Pause N Go's tested definition, the No Setup re-tag audit,
  the PWH/PWL session convention, the Stacked Imbalance ratio.
