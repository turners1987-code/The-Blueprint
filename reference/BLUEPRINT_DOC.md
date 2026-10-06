# BLUEPRINT_DOC — The Blueprint eLearning Platform

Version 4.0 · 2026-10-06
Replaces every earlier BLUEPRINT_DOC. Where an older copy disagrees with this file,
this file wins. Delete the old copies rather than keeping two sources.

**Live:** https://bptrade.co (Cloudflare Pages)
**Fallback:** GitHub Pages, kept for now
**Short link:** https://bit.ly/TheBlueprint_Trade
**Repo:** https://github.com/turners1987-code/The-Blueprint
**Local path:** `C:\Blueprint\The-Blueprint` (both laptops, cloned from git — never in Google Drive)

---

## 1. What this is

A progressive eLearning platform teaching Shane's intraday futures framework, with a free tier
and a paid tier called Full Access. It is built as a progressive framework rather than levelled
content. The audience is NinjaTrader 8 users on Windows: the journal and the tools assume NT8.

**Offer.** Free to read the Start and Process modules, glossary, card deck, Dial In and
reference pages. Full Access adds the Blueprint modules, the capstone, the journal, the NT8
tools and the cockpit cards.

**Pricing.** $47/month list, $7/month opening rate. The opening rate is locked for as long as
the membership stays active; cancel and rejoin and the current rate applies. The pricing page
states plainly that Full Access pays for work still being finished.

**Payment.** Lemon Squeezy, store "The Blueprint." under Shane Turner LLC. Verification is
pending. Until it clears, the checkout link on `pricing.html` is a placeholder and
`js/unlock.js` accepts any non-empty code.

**Owner:** Shane. Not a developer — Claude Code does the building, this project does
architecture, specs, and handoff prompts.

**Public posture.** Nothing on the site claims a track record, mastery, a proven edge or
results. A full honest-copy pass was run. The public status badge system (status plus n) was
removed entirely: no badges, no n-counts and no expectancy figures appear on any public page.
The two gates in `METHODOLOGY_v2.md` remain an internal standard and a teaching principle
(Module 01), not something the site displays.

**Division of sources:**

| File | Owns |
| --- | --- |
| This file | The site: stack, architecture, conventions, build state |
| `reference/TAXONOMY.md` | Vocabulary and record structure — setups, triggers, locations, grades, gates |
| `reference/METHODOLOGY_v2.md` | What the method is — the content source for lessons |
| `reference/CAPTURE_CONTRACT.md` | The NT8 capture addon spec (v1.7); the addon itself is built elsewhere |
| `reference/setup-definitions.txt` | Shane's own setup wording, verbatim from TurtleMetrics |
| `reference/review-questions.txt` | The six-question discipline checklist |
| `reference/TradingStats_Source_of_Truth.txt` | NQ base rates, 3,163 sessions |
| `reference/golden-samples/` | Sample capture records for the NT8 contract |
| Hypothesis Register (Future project) | All evidence: n, expectancy, hit rates |

Nothing in this file states a statistic. Evidence lives in the register and goes stale; a copy
here would be a copy that is wrong within months.

---

## 2. Stack and hosting

- Pure HTML / CSS / JS. **No framework, no bundler, no build step.**
- Native ES modules (`<script type="module">`).
- Hosted on **Cloudflare Pages** at bptrade.co. GitHub Pages remains as a fallback for now; its
  terms prohibit sites primarily facilitating commercial transactions, so it is not a long-term
  home for a paid site. Retire it once Cloudflare has proven stable.
- Content lives in `data/*.json`; code renders it.
- PWA: installable and offline-capable via `sw.js` (cache version in the file; bump
  `CACHE_VERSION` to ship changes to cached files). Published module pages are added to the
  cache from `data/modules.json`.
- Journal data stays on the user's machine: browser storage or a chosen folder. There is no
  backend and no account.
- Access is a code stored in `localStorage` (`js/unlock.js`), checked by `js/gate.js`. It is
  not an account and not real protection. See known issues.

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

**Module page pattern** (copy `modules/01-evidence-standard.html`): nav root, `.module-header`,
`<nav class="module-toc" data-module-toc>`, `.lesson-content` with **h2** section headings,
one `.key-concept`, `.module-complete-zone` with `#mark-complete-btn[data-module-id]`,
`.module-nav`, footer with the AI seal. `js/module-toc.js` builds the section index from the
page's h2s only. No h3 without an h2.

**Footer:** every page carries `assets/ai-seal.svg`, linking to `ai.html`.

---

## 4. File structure

```
index.html            landing page, module grid rendered from data
glossary.html         20 terms, inline search
journal.html          trade journal: pre-entry plan, post-exit record, export/import
journal-analysis.html read-only analysis of the journal
pricing.html          Free vs Full Access, the opening rate, the checkout link
tools.html            NT8 tools, rendered from data/tools.json
unlock.html           access code entry
ai.html               how AI is used on the site
404.html              relative paths; no <base> tag
llms.txt  sitemap.xml  robots.txt  manifest.json  sw.js  package.json
css/   main, modules, index, glossary, journal, pricing, tools, unlock, ai,
       dial-in, flashcards, toothbrush-therapy, 404
js/    nav.js         shared nav on every page; registers the service worker
       progress.js    localStorage progress, schema v2, migration map; position
                      (lastVisited) is separate from completion; unmark control
       modules.js     renders the module grid from data/modules.json
       module-toc.js  section index on module pages
       tools.js       renders tools.html from data/tools.json
       gate.js        access gate: hasAccess(), locked state for gated pages
       unlock.js      access code entry (placeholder validation)
       main.js        scroll reveals, quizzes, misc page behaviour
       cards.json     32-card flashcard deck
       glossary.js    EMPTY — orphan
       journal/       schema, analysis, storage (+ -common, -local, -fs), ui, ui-analysis
data/  modules.json   17 modules, the curriculum source of truth (status, tier)
       tools.json     10 tools, status and file per tool
       journal-schema.json, journal-example.json
       import/        README only; personal trade exports are git-ignored
modules/  00-welcome, 01-evidence-standard, 12-journaling, 13-toothbrush-therapy,
          dial-in, flashcards
assets/   favicon.svg, ai-seal.svg, icon-192/512 (+maskable), og-image, screenshots
scripts/  check, validate-journal, test-storage, test-analysis, test-progress, smoke,
          import-turtlemetrics
reference/  the source material listed in section 1
```

---

## 5. The checks

`npm test` runs six checks in sequence and stops at the first failure. Every build prompt ends
with it.

| # | Script | What it does |
| --- | --- | --- |
| 1 | `npm run check` | Repo validation (rules below) |
| 2 | `npm run check:journal` | Validates journal data and example against the schema |
| 3 | `npm run test:storage` | Journal storage layer |
| 4 | `npm run test:analysis` | Journal analysis maths |
| 5 | `npm run test:progress` | Progress, position vs completion, continue logic |
| 6 | `npm run test:smoke` | Serves the site and loads every page, plus 404 behaviour, in headless Chrome. Seeds an access code so gated pages open, and adds no-code cases that assert the locked state renders (the journal pages, and any paid module page) |

**Rules enforced by `check.mjs`:**

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
10. The journal UI reaches storage only through `js/journal/storage.js`, awaited
11. Every `data/tools.json` entry has a valid status; `available` requires a file
12. A module page may not contain an h3 without an h2
13. A page with `data-gate` loads `js/gate.js`; a paid module page must carry `data-gate="tier"`

0-byte HTML files are listed as STUB and skipped; `--strict` audits them.

**Current state: all six green. `check` reports 0 errors and 1 warning** (`js/glossary.js`
unreferenced).

---

## 6. Curriculum — 17 modules, four parts

Source of truth is `data/modules.json`. Status is `published`, `drafting`, or `planned`.
Tier is `free` or `paid` and is independent of status. Planned modules render as
non-clickable "Coming soon" cards; paid modules carry a lock marker.

| # | Module | Part | Tier | Status |
| --- | --- | --- | --- | --- |
| 00 | Welcome & Orientation | start | free | published |
| 01 | How We Know What We Know | start | free | published |
| 02 | The Three Tiers | blueprint | paid | planned |
| 03 | What Counts As A Level | blueprint | paid | planned |
| 04 | Trend Continuation | blueprint | paid | planned |
| 05 | Range Rejection | blueprint | paid | planned |
| 06 | The Gap Setups | blueprint | paid | planned |
| 07 | Triggers | blueprint | paid | planned |
| 08 | Trade Construction | blueprint | paid | planned |
| 09 | The Hard Rules | blueprint | paid | planned |
| 10 | The Pre-Market Routine | process | free | planned |
| 11 | The Post-Session Routine | process | free | planned |
| 12 | Journaling & Review | process | free | published |
| 13 | Toothbrush Therapy | process | free | published |
| 14 | Reading A Probability | capstone | paid | planned |
| 15 | Building Your Own PlayBook | capstone | paid | planned |
| 16 | What I Got Wrong | capstone | paid | planned |

Four are written: 00, 01, 12 and 13. Module 12 is written against `TAXONOMY.md` 5.1 and 5.2
(grade at entry, execution mark after exit) and matches the journal as built.

Also published outside the numbered course: Dial In, the card deck, the glossary.

Cut deliberately: market basics, chart reading, order types, tools, psychology. Commodity
content available free elsewhere; becomes a curated reading-list page if wanted. ORB and
Second Chance are retired and appear only in What I Got Wrong (and as a glossary term).

---

## 7. Content rules

- **No beginner/advanced labels anywhere.** Enforced by check rule 6.
- **R, never dollar income claims.** Public educational site.
- **No claim of a track record, mastery, proven edge or results.** The framework is described
  as being built and tested in the open.
- **No status badges, n-counts or expectancy figures on public pages.** The gates stay
  internal; lessons may teach them as principle.
- Every directional statement follows Blueprint framing: conditional if/then with a named
  level, a named behaviour, an invalidation, and a conviction level.
- Nothing is presented as settled. As of this version nothing is VALIDATED internally either.
- Any statistic that does appear is tied to a specific setup, rule or routine, never presented
  as a signal, and carries its sample size (check rule 9).
- TradingStats cited by name. Their gap definition differs from the Blueprint's, so their
  gap-fill rate is **never** quoted as Blueprint evidence.
- Source books (Bellafiore, Dalton, Trader Dale) taught as concepts in Shane's words. Never
  reproduce their text or figures.
- MNQ is where Shane trades, not what the method is. Framework first.
- Grades are A+ / A / B / C everywhere.
- Any backtest or hypothetical result shown carries CFTC Rule 4.41 language.
- Lessons are written from `METHODOLOGY_v2.md` and `TAXONOMY.md`, never from the old
  seven-setup book.

---

## 8. Build order

Decided 2026-10-05: content comes after the research and compiling are reviewed. Lessons are
now being written in the order below, from the methodology as it stands.

1. ~~Site foundation~~ — done
2. ~~Journal and analysis~~ — built; data stays local; gated client-side only (`js/gate.js`)
3. ~~Commercial pages~~ — pricing, tools, unlock, ai built; payment not live
4. ~~Modules 00, 01, 12, 13~~ — written
5. **Payment live** — Lemon Squeezy verification, real checkout link, real code validation
6. **Tool downloads** — KeyLevels first; the rest as they ship (`data/tools.json`)
7. **NT8 capture contract** — specced in `CAPTURE_CONTRACT.md`, built in the NT8 project
8. **Remaining modules** — 10 and 11 (free) before the paid Blueprint modules

**Blocked elsewhere:** the NT8 tools themselves, ChartSnap and journal capture (planned),
Lemon Squeezy verification, and NinjaTrader's commercial distribution rules (unread crawl
target — must be read before anything ships with a price).

---

## 9. Ways of working

- **Pull before starting, push when stopping.** Two laptops; this is not optional.
- Run `npm test` before every commit. All six must pass.
- Local preview: `npx serve -l 8080` in a separate cmd window. `fetch` is blocked on `file://`,
  so double-clicking an HTML file shows an empty module grid.
- Live check only when a push changed how scripts load or fetch. Hard-refresh, then F12
  console. `favicon.ico 404` is noise; anything else is real.
- Structural changes go to a branch first; content and small fixes go straight to main.
- Bump `CACHE_VERSION` in `sw.js` when cached files change, and add new pages and assets to its
  shell list.
- Verify GitHub state **by commit SHA**, not by branch ref — `raw.githubusercontent.com`
  caches branch refs for several minutes.
- Claude Code cannot see Claude Projects. Anything it needs must be in `reference/`.
- One task per prompt.

---

## 10. Known issues

- **The gate is client-side and beta-grade.** `js/gate.js` hides `journal.html`,
  `journal-analysis.html` and any module whose tier is `paid` in `data/modules.json` unless a
  code is stored in `localStorage`, and shows a locked state with links to pricing and unlock.
  It protects nothing: the files are public and the code can be set by hand. Validation is
  still a placeholder, so any non-empty code passes. Check rule 13 fails a paid module page
  that lacks `data-gate="tier"`.
- The checkout link on `pricing.html` is a placeholder.
- `js/glossary.js` is an empty orphan; the one remaining check warning.
- Glossary has 20 terms hardcoded in HTML; should move to `data/glossary.json`.
- The `sw.js` shell list includes `js/gate.js` but not `pricing.html`, `tools.html`,
  `unlock.html`, their CSS, `js/tools.js` or `js/unlock.js`. Verify what offline should cover.
- The `drafting` card rendering has never been exercised in a browser; no module carries that
  status.
- Dial In's result copy says "Your path starts with Module 01" while its CTA points at
  00-welcome.
- Module 00's text still refers to Modules 01–03 as covering "how claims are labelled";
  recheck against the modules as written.
- Seven of ten tools are `in-development` and three `planned`; none has a download, so
  `tools.html` has nothing available.

---

## 11. Open decisions

- Gating mechanism for Full Access. A static site with a code in `localStorage` cannot keep
  paid content private; the options are accepting that, or moving paid pages behind
  Cloudflare (Access, Workers) once the payment flow is live.
- Whether to enforce the journal's gate server-side. The pricing page lists the journal under
  Full Access and `js/gate.js` gates it, but only client-side, so it is gated and not
  protected. A hosted journal for paying customers would mean accounts and a backend — a
  different product.
- When to retire GitHub Pages as the fallback.
- Code validation design against the Lemon Squeezy License API, including how many browsers
  one code may activate.
- Four open items in `TAXONOMY.md`: Pause N Go's tested definition, the No Setup re-tag audit,
  the PWH/PWL session convention, the Stacked Imbalance ratio.
