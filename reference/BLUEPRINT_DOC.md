# BLUEPRINT_DOC — The Blueprint eLearning Platform

Version 4.4 · 2026-10-31
Replaces every earlier BLUEPRINT_DOC. Where an older copy disagrees with this file,
this file wins. Delete the old copies rather than keeping two sources.

**Live:** https://bptrade.co (Cloudflare Pages)
**Fallback:** GitHub Pages, kept for now
**Short link:** https://bit.ly/TheBlueprint_Trade
**Repo:** https://github.com/turners1987-code/The-Blueprint
**Local path:** `C:\Blueprint\The-Blueprint` (both laptops, cloned from git — never in Google Drive)

---

## 1. What this is

A progressive eLearning platform teaching an intraday trading framework, built and illustrated on
futures, with a free tier and a paid tier called Full Access. The reader builds their own framework
from it. It is built as a progressive framework rather than levelled
content. The audience is NinjaTrader 8 users on Windows: the journal and the tools assume NT8.

**Offer.** Free to read the Start and Process modules, glossary, card deck, Dial In and
reference pages. Full Access adds the Blueprint modules, the capstone, the journal, the NT8
tools and the cockpit cards.

**Pricing.** $47/month list, $7/month opening rate. The opening rate is locked for as long as
the membership stays active; cancel and rejoin and the current rate applies. The pricing page
states plainly that Full Access pays for work still being finished.

**Payment.** Lemon Squeezy, store "The Blueprint." under Shane Turner LLC. The store is
approved and in test mode. `js/unlock.js` validates codes against the Lemon Squeezy License
API; it no longer accepts any non-empty code. The checkout link on `pricing.html` stays a
placeholder until go-live.

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
| `reference/MODULE_STANDARD.md` | How every lesson page is built — spine, devices, voice, page checklist |
| `reference/TradingStats_Source_of_Truth.txt` | NQ base rates, 3,163 sessions |
| `reference/golden-samples/` | Sample capture records for the NT8 contract |
| `reference/DECISIONS.md` | Step-12 decisions (D1–D58) that lessons must follow |
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
glossary.html         rendered from data/glossary.json, inline search
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
       progress.js    localStorage progress, schema v4, migration map; position
                      (lastVisited) is separate from completion; unmark control
       modules.js     renders the module grid from data/modules.json
       module-toc.js  section index on module pages
       tools.js       renders tools.html from data/tools.json
       gate.js        access gate: hasAccess(), locked state for gated pages
       unlock.js      access code entry (placeholder validation)
       main.js        scroll reveals, quizzes, misc page behaviour
       cards.json     32-card flashcard deck
       glossary.js    renders glossary.html from data/glossary.json; search over
                      term, aliases and definition
       journal/       schema, analysis, storage (+ -common, -local, -fs), ui, ui-analysis
data/  modules.json   25 modules, the curriculum source of truth (status, tier)
       tools.json     10 tools, status and file per tool
       glossary.json  74 terms: term, aliases, definition, module(s), optional tags
       journal-schema.json, journal-example.json
       import/        README only; personal trade exports are git-ignored
modules/  00-welcome, 01-evidence-standard, 12-journaling, 13-toothbrush-therapy,
          dial-in, flashcards
assets/   favicon.svg, ai-seal.svg, icon-192/512 (+maskable), og-image, screenshots
scripts/  check, validate-journal, test-storage, test-analysis, test-progress, smoke,
          import-turtlemetrics
reference/  the source material listed in section 1, plus DECISIONS.md and MODULE_STANDARD.md
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
14. Every `data/glossary.json` entry has a non-empty term and definition, and terms are unique;
    every `.definition-box` term on a published module page has an entry (missing ones warn)

0-byte HTML files are listed as STUB and skipped; `--strict` audits them.

**Current state: all six green. `check` reports 0 errors and 1 warning** (`js/ls-config.js`
unreferenced).

---

## 6. Curriculum — 25 modules, seven parts

Source of truth is `data/modules.json`. Status is `published`, `drafting`, or `planned`.
Tier is `free` or `paid` and is independent of status. Planned modules render as
non-clickable "Coming soon" cards; paid modules carry a lock marker.

| # | Module | Part | Tier | Status |
| --- | --- | --- | --- | --- |
| 00 | Welcome & Orientation | Start | free | published |
| 01 | How We Know What We Know | Start | free | published |
| 02 | The Hard Rules | Rules Before Reps | free | planned |
| 03 | The Instrument: Futures Mechanics | Rules Before Reps | free | planned |
| 04 | Who Is Forced To Trade | Why Price Moves | paid | planned |
| 05 | The Auction | Why Price Moves | paid | planned |
| 06 | What Counts As A Level | Why Price Moves | paid | planned |
| 07 | Reading Order Flow | Why Price Moves | paid | planned |
| 08 | The Three Tiers | The Blueprint | paid | planned |
| 09 | Idea Generation | The Blueprint | paid | planned |
| 10 | Trend Continuation | The Blueprint | paid | planned |
| 11 | Range Rejection | The Blueprint | paid | planned |
| 12 | The Gap Setups | The Blueprint | paid | planned |
| 13 | Triggers | The Blueprint | paid | planned |
| 14 | Trade Construction | The Blueprint | paid | planned |
| 15 | Writing The Plan | The Blueprint | paid | planned |
| 16 | The Pre-Market Routine | Process | free | planned |
| 17 | The Session And The Close | Process | free | planned |
| 18 | Journaling & Review | Process | free | published |
| 19 | Toothbrush Therapy | Process | free | published |
| 20 | The Trader's Mind | Process | free | planned |
| 21 | Reading A Probability | Evidence | paid | planned |
| 22 | How To Test An Edge | Evidence | paid | planned |
| 23 | Building Your Own PlayBook | Capstone | paid | planned |
| 24 | How Ideas Fail A Test | Capstone | paid | planned |

Four are written: 00, 01, 18 (Journaling & Review, file modules/12-journaling.html) and 19 (Toothbrush Therapy, file modules/13-toothbrush-therapy.html). Published pages keep their original file paths through the `file` field in data/modules.json; js/progress.js migrates stored progress from the 17-module ids (schema v3).

Also published outside the numbered course: Dial In, the card deck, the glossary.

Decided 2026-10-31 (reference/DECISIONS.md D1–D4): rules first and free; mechanics (03), order flow (07) and the trader's mind (20) return in narrow, framework-only form; commodity basics go to a reading-list page. Forced flow (04) is taught as concepts only, with no forced-flow statistic until one passes Gate 1. ORB and Second Chance appear only as examples in Module 24, How Ideas Fail A Test, and as glossary terms.

Each module is drafted from its content map (G:\My Drive\Blueprint Review\content-maps\NN-*.md), METHODOLOGY_v2, TAXONOMY, MODULE_STANDARD and DECISIONS. A module that needs an undecided 'real choice' in DECISIONS.md stops and asks.

---

## 7. Content rules

- **No beginner/advanced labels anywhere.** Enforced by check rule 6.
- **R, never dollar income claims.** Public educational site.
- **No claim of a track record, mastery, proven edge or results.** The site does not state the method's
  validation status in either direction (§7).
- **No status badges, n-counts or expectancy figures on public pages.** The gates are
  internal; lessons teach them as a tool for the reader's own record.
- Every directional statement follows Blueprint framing: conditional if/then with a named
  level, a named behaviour, an invalidation, and a conviction level.
- **No validation status on the site.** The site teaches a framework and how to test one. It never states whether the framework, a setup, a trigger or a rule is validated, candidate, untested or killed, and it never says the method is unproven, being tested, or that nothing is validated. Evidence vocabulary and the two gates are taught as tools (Modules 01, 21, 22) for the reader to apply to their own journal and register. The site makes no results claim in either direction; the rules against track-record, income and 'this works' language stand, and 4.41 text stays beside any hypothetical case.
- Any statistic that does appear is tied to a specific setup, rule or routine, never presented
  as a signal, and carries its sample size (check rule 9).
- TradingStats cited by name. Their gap definition differs from the Blueprint's, so their
  gap-fill rate is **never** quoted as Blueprint evidence.
- Source books (Bellafiore, Dalton, Trader Dale) taught as concepts in Shane's words. Never
  reproduce their text or figures.
- **A framework for intraday traders, built and illustrated on futures.** The framework (levels, reads, triggers, construction, rules, routines, evidence) is written to carry across futures instruments; MNQ is the illustration instrument for worked cases, tick arithmetic and base rates (TradingStats figures are NQ data and are cited as such). No page says another instrument is outside the framework, and no page claims the framework works on any instrument; the reader's record decides. Stocks and options are later tracks, not part of the current course.
- **The reader is the trader.** Every page is written in second person to the reader building their own framework. There is no author voice: no 'one trader's', 'the author', 'I', 'my record', 'personal framework'. Worked cases are composites and belong to no one. The page asks for records, counts and rehearsed routines, never for belief.
- Grades are A+ / A / B / C everywhere.
- Any backtest or hypothetical result shown carries CFTC Rule 4.41 language.
- Lessons are written from `METHODOLOGY_v2.md` and `TAXONOMY.md`, never from the old
  seven-setup book.
- Lessons follow `reference/DECISIONS.md`. The site tagline is 'The Setup is the plan. Discipline is the execution. Everything else is noise.' — no page claims an edge.

---

## 8. Build order

Decided 2026-10-05: content comes after the research and compiling are reviewed. Lessons are
now being written in the order below, from the methodology as it stands.

1. ~~Site foundation~~ — done
2. ~~Journal and analysis~~ — built; data stays local; gated client-side only (`js/gate.js`)
3. ~~Commercial pages~~ — pricing, tools, unlock, ai built; payment not live
4. ~~Modules 00, 01, 12, 13~~ — written
5. **Payment live** — payment plumbing is built and verified in test mode; go-live is the
   remaining step (see the go-live checklist under Payments & licensing)
6. **Tool downloads** — KeyLevels first; the rest as they ship (`data/tools.json`)
7. **NT8 capture contract** — specced in `CAPTURE_CONTRACT.md`, built in the NT8 project
8. **Remaining modules** — step 10 (content maps for all 25 modules, OPTIONS and NT8-Setup) and step 12 (decisions) done 2026-10-31. Writing order: the free path first — 02, 03, 16, 17, 20 — then 05–07, then the paid Blueprint modules 08–15 (10–14 need worked cases from MNQ chart history; 13 waits on D8, Pause N Go's definition), then 04 and 21–24.

**Blocked elsewhere:** the NT8 tools themselves, ChartSnap and journal capture (planned),
and NinjaTrader's commercial distribution rules (unread crawl target — must be read before
anything ships with a price).

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
- The `sw.js` shell list includes `js/gate.js` but not `pricing.html`, `tools.html`,
  `unlock.html`, their CSS, `js/tools.js` or `js/unlock.js`. Verify what offline should cover.
- The `drafting` card rendering has never been exercised in a browser; no module carries that
  status.
- NT8's built-in risk and loss limits apply to sim accounts only (step-10 NT8-Setup map). The $400 kill switch in METHODOLOGY_v2 must be enforced at broker or prop-firm level; how is a pending crawl (nt8-onboarding). Module 02 cannot state the enforcement step until it returns (D29).
- Seven of ten tools are `in-development` and three `planned`; none has a download, so
  `tools.html` has nothing available.

---

## Payments & licensing — Lemon Squeezy (updated 2026-10-25)

Store: The Blueprint. (store_id 491360), under Shane Turner LLC. Account approved 10/12/26. Currently TEST MODE.
Product: "The Blueprint. All Access" — product_id 1472366, variant_id 2295842, $7/mo, no trial, license keys on, activation_limit 2.
Test checkout: https://bptrade.lemonsqueezy.com/checkout/buy/008fd078-cac4-4fa8-9b3d-3659a4617fbc
Pricing decision: $7 is the opening rate; raise the variant price to $47 later. Existing subscribers keep $7 automatically. No discount codes, no fake reference price.

Architecture:
- Site gate (js/gate.js) validates keys client-side against the License API (validate only, no instance_id, so no activation slots consumed). Config in js/ls-config.js. 24h background revalidate, 7-day grace.
- Webhook: Cloudflare Pages Function at /api/ls-webhook, HMAC-verified, idempotent by meta.webhook_id, writes one record per customer to KV namespace bptrade-entitlements (cust:<customer_id>). Admin lookup at /api/entitlement (X-Admin-Token). Secrets LS_WEBHOOK_SECRET and ADMIN_TOKEN live in Cloudflare, never in repo.
- NT8 indicators: C# License API client built in the NT8 project (activate/validate/deactivate, instance per machine). Handoff sent 10/25.
- NinjaTrader Vendor Program: deferred; only for an Ecosystem listing. Gianluca Vaccari reply (10/14) unanswered by decision.

Verified 10/25: test purchase → key → unlock page → journal open; 5 webhook deliveries 200; KV row correct.
Commits: 7b4e521, b6ca898, 53a0a80, 55ce34b, 3e5da94.

Go-live checklist (also in js/ls-config.js header): recreate product in live mode; append live product_id to LS_PRODUCT_IDS; set LS_CHECKOUT_URL; set LS_ACCEPT_TEST_KEYS=false; register live-mode webhook with same URL/secret; resolve the "application received" banner with LS support if still showing.

Deferred: downloads page; privacy policy payments section (+ sw.js/llms.txt listing); confirmation-modal copy ("key is on your order page and in your receipt"); housekeeping (unlock.js in SW shell, smoke GRACE_MS import, package-lock.json decision); reply to Gianluca.

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
- Four open items in `TAXONOMY.md`: Pause N Go's tested definition, the No Setup re-tag audit,
  the PWH/PWL session convention, the Stacked Imbalance ratio.
- The 21 'real choices' listed in reference/DECISIONS.md, each decided when its module is drafted.

---

## 12. Content pipeline and model use (updated 2026-10-31)

- **Corpus read complete (10/29–10/31).** Every trading and market file Shane collected (the Crawl library, the Market Research digests, his own project docs and the SMB blog) was read by GLM and turned into 33,590 concept cards. An independent sample check found the numbers 93.6% accurate and none invented outright; value scores, model commentary and false conflicts were then fixed by script, with every change logged.
- **Consolidated for writing.** Value-3 cards are kept whole per module (`consolidation\core\`). Value-2 cards are digested per module with every claim traced to its cards (`consolidation\digest\`, plain reading copies in `digest-read\`). Cross-cuts: `conflicts.md`, `statistics.md`, `options-layer.md`. Everything lives in `G:\My Drive\Blueprint Review\`; the handoff is the project doc `claude/HANDOFF_step10_consolidation.md`.
- **Step 10 and 12 done (2026-10-31).** Content maps for all 25 modules plus OPTIONS and NT8-Setup, and SUMMARY.md (decision list, gap list, syllabus v3, statistics inventory, coverage), are in `G:\My Drive\Blueprint Review\content-maps\`. Syllabus v3 is the v2 order, now live in `data/modules.json` and section 6. Decisions are in `reference/DECISIONS.md`.
- **Next.** Step 11 gap-fill crawls on the GLM crawl box (nt8-onboarding first: it blocks Module 02's kill-switch enforcement), and module writing in the section 8 order.
- **Model use.** Opus for judgment and module drafting. Sonnet for repo edits, supervision, checking and scheduled tasks. GLM (`claude-glm`, `extract.py`, `digest.py`) for bulk reading; it shares one quota with the crawl box. Fable is not used for this project from 2026-10-31.
- **Instruction format.** Every Claude Code instruction to Shane: /clear first or same session → model → inputs → action items → one time estimate → the prompt last.