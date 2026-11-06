# The Blueprint — Finance and Options tracks

Version 1.0 · 2026-11-06. Approved in principle by Shane Nov 6 ("do whatever we can without
stopping the current rollout, then get these on the books"). Decision D75 planned both tracks
for December behind the Florida compliance answer; that answer is in (J-20261103-04) and is
folded into section 2 below. Syllabi in sections 4 and 5 are drafts for Shane to edit; the
runners build in the listed order and Shane can reorder or strike modules at any time.

Everything in MODULE_STANDARD.md, LESSON_STANDARD.md and BLUEPRINT_DOC section 7 applies to
every track module exactly as it applies to the futures modules: same page spine, same video
layer, same voice, soundtrack rule and slide kit, same content rules.

---

## 1. Site structure

- Three tracks under one site: **Futures** (the existing 25 modules), **Finance**, **Options**.
- Nav: the Modules item becomes a track switcher, or two new top-level items ("Finance",
  "Options") next to Modules; the runner picks whichever fits the nav at 360 px without a
  second row and records the choice in DECISIONS.md.
- Each track has its own list file (`data/finance.json`, `data/options.json`, same shape as
  `data/modules.json` plus a `track` field), its own index page (`finance.html`,
  `options.html`, same pattern as the modules index), its own module folder
  (`finance/F01-….html`, `options/O01-….html`), its own numbering (F01…, O01…), and its own
  progress keys (`bp-progress-finance`, `bp-progress-options`) so a student's futures progress
  is untouched.
- Module pages: copy `modules/01-evidence-standard.html` exactly (nav root, header with Copy
  for your AI, TOC, lesson content with h2s, one key-concept box, mark-complete, module nav,
  footer with the AI seal). Path rules for a first-level subdirectory already exist
  (`guides/`); `check.mjs` must accept `finance/` and `options/`.
- Lessons: `data/lessons/F01-….json` and `O01-….json` built with the slide kit, audio under
  `assets/audio/F01/` and `assets/audio/O01/`. The soundtrack rule uses the module's number
  within its track.
- Glossary, card deck, Dial In, Sources, sw.js shell list, sitemap and llms.txt all gain the
  new modules the same way the futures modules were added.
- Tiers (D-level, recorded already): Finance is on the $7 tier; Options is on the premium tier
  (D75 / ideas-backlog). The gate map in `js/tiers.js` gets the two tracks; the middleware
  gate covers `/finance/` and `/options/` paths the same way it covers paid modules.

## 2. Compliance rules for both tracks (content rules addendum, section 7b)

From `reference/research/crawl/blueprint-edu-compliance-findings.md` (Oct 31 and Nov 3 runs).
Educational summaries for a lawyer to confirm, not legal advice; the lawyer question is under
Needs Shane. These rules bind the runners now.

**Both tracks**
- General-audience education only: concepts, mechanics, products and risks. Never "you
  should", never "the advisability of" buying, selling or holding anything, never anything
  tailored to a reader's own portfolio, income, age or situation. Second person is still the
  voice, but about mechanics ("when you sell a covered call, the shares are the collateral"),
  never about choices ("you should sell covered calls").
- No interactive tailoring: no calculators that output "what you should do", no quizzes that
  end in a product recommendation. Worked examples use invented people with invented
  numbers, labelled as illustrations.
- Statistics carry their n and source as always; no performance promises; no "beat the
  market"; no past-results claims of any kind (site rule 7 already).
- Every track module opens with the scope block (one `.key-concept`-style box, not a wall):
  "General financial education about concepts and publicly available products. Not a
  recommendation to buy or sell anything, and not tailored to your objectives, financial
  situation or needs. Rules and limits change; the figures here carry their source and date."
  Runner writes it once in `js/track-notice.js` and includes it, never retypes it.
- Numbers that change yearly (contribution limits, phase-outs, HSA figures) are shown with
  their tax year and IRS source line, and live in one data file (`data/finance-limits.json`)
  so the November refresh is one edit. The limits table in the finance findings is the seed.

**Finance track, extra**
- Insurance pages teach what a product is, how it works, and the trade-offs, in the abstract.
  No product comparisons, no "which policy fits you", no insurer, agent or affiliate link, no
  paid advice. (Fla. Stat. 626.112(1)(b) solicitation line; 626.7315(4) fee advice.)
- Tax pages describe rules with their IRS publication and tax year; they never compute a
  reader's own tax.
- Florida: ch. 517 has no publisher exclusion; the posture above (general education, no
  personal advice) is the safeguard. Shane's call, Nov 6: nothing to wait on; the Finance
  track publishes as each module clears review.

**Options track, extra**
- Every options module carries the ODD block: options involve substantial risk; read OCC's
  "Characteristics and Risks of Standardized Options" (June 2024 edition, link to theocc.com)
  before trading; your broker provides it when your account is approved for options. One
  component (`js/odd-notice.js`), link checked when a new ODD edition issues.
- OIC/OCC material is paraphrased with attribution and a link, never redisplayed (OIC terms bar
  commercial reproduction). Short definitions only.
- The same 4.41(b) rule as futures: any simulated or hypothetical result carries the verbatim
  statement next to it. Videos show no entries and no outcomes.

## 3. Sources already on disk (read these; request a crawl only for what is missing)

- Compliance: `reference/research/crawl/blueprint-edu-compliance-findings.md`.
- Finance: `reference/research/crawl/finance-education-reference-findings.md` (Roth, traditional,
  conversions and ladders, SEP, solo 401(k), TSP, HSA, backdoor and mega backdoor, tax-loss
  harvesting and wash sales, Section 1256, trader tax status and 475(f), lazy vs active,
  insurance as an investment, rules of thumb, the 2026/2027 limits table; trader tax and
  prop-firm payouts; insurance, affordability, account protection, fee drag; federal benefits
  and retirement income; TSP withdrawals and FERS; HSA with FEHB).
- Options: Crawl folder `options-education` (Drive folder id 1FCeenFJ5tJrt7EAYsXPu_B8_v9Dc46ng):
  `findings.md` (file id 1BIzQ8-sHvF6Zp_FJAXXiBqfujNCl_MIy: exercise and assignment, early
  exercise, expiration by exception, Greeks, pricing, pin risk gap, ODD edition, licensing
  table) and `strategies.csv` (file id 1_ZUiK3f0HxAhyeOdZeBmkKqjAofEC6Wi: all 48 OIC
  strategies with legs, outlook, max gain, max loss, breakeven, volatility and time effect,
  assignment risk, page URL). Read with the Google Drive connector; read only.
- Equities mechanics: Crawl folder `investing-equities-mechanics` `findings.md` (file id
  1ea3IdTzQ5nfdHLYm9megL9sVPASXIc-3: T+1, cash-account freezes, PDT replacement status, Reg T,
  order types, Rule 606, Reg SHO, fund fees).
- Also in the library: `cme-specs` (index and futures options specs, options on futures by
  platform, Section 1256 chain), `prop-rules`, `blueprint-prop-instruments`.
- The content map `reference/content-maps/OPTIONS.md` (step 10) is the Blueprint-side view of
  what the options track must say about the futures framework.

## 4. Finance track syllabus (draft, Shane edits)

Track name on the site: **Finance**. Tagline: money outside the trading account. 12 modules,
free-path tier ($7). Order is teaching order; each is one page plus 3 to 6 videos.

| # | Title | One line |
|---|---|---|
| F01 | Money Is Fungible | The one idea under everything else: every dollar is the same dollar, so the question is always the account with the best rules, taught through the HSA. |
| F02 | The Accounts | Roth IRA, traditional IRA, 401(k) and solo 401(k), SEP, TSP, HSA, taxable: what each is, who can use it, the contribution and phase-out limits with their tax year. |
| F03 | Roth Conversions And Ladders | What a conversion is, the five-year clocks, the ladder, when the math is worth running (described, never computed for the reader). |
| F04 | Backdoor And Mega Backdoor | The two moves, the pro-rata rule, what a plan has to allow. |
| F05 | Lazy Investing | Three-fund and lazy portfolios, index funds vs active, expense ratios and fee drag, rebalancing, the set-and-forget routine. |
| F06 | Taxes On Investing | Capital gains, tax-loss harvesting and wash sales, Section 1256 60/40, what a trader's tax picture looks like (trader tax status, 475(f)), prop-firm payouts. |
| F07 | Insurance As A Financial Tool | Term vs permanent, cash value, what the policy actually is, the costs and trade-offs; in the abstract only (section 2 rules). |
| F08 | Federal Employees And Service Members | TSP funds and withdrawals, FERS, the supplement, matching, the benefits that are money. |
| F09 | Rules Of Thumb | Housing-to-income, car-to-income, emergency fund, savings rate, from official sources with their dates. |
| F10 | Account Protection And Fees | SIPC and FDIC, what is and is not covered, how fees compound, reading a fee table. |
| F11 | The Independent Trader's Finances | Separating business from life money, the tax accounts a self-employed trader can use, the yearly calendar (limits refresh, estimated taxes). |
| F12 | The Yearly Review | One sheet: accounts, limits used, fees paid, the November refresh. The track's assignment and summary. |

## 5. Options track syllabus (draft, Shane edits)

Track name on the site: **Options**. 10 modules, premium tier. Taught on index and
equity options with the OIC library as the mechanics source, and on options on futures where
the Blueprint framework meets options.

| # | Title | One line |
|---|---|---|
| O01 | What An Option Is | Calls, puts, strike, expiration, premium, intrinsic and time value, the contract multiplier; the ODD block. |
| O02 | Exercise, Assignment And Expiration | American vs European, early exercise, exercise by exception, pin risk, the Monday-after problem. |
| O03 | The Greeks | Delta, gamma, theta, vega, rho, what each one does to a position, in plain words with one chart each. |
| O04 | Pricing And Implied Volatility | What moves a premium, IV vs realized, why IV crush happens. |
| O05 | The Dealer Well | The dealer-hedging story from Module 04 told from the options side: gamma exposure, forced flows, what it means for the futures trader's levels. |
| O06 | Single-Leg Strategies | Long call, long put, covered call, cash-secured put, protective put, collar: legs, outlook, max gain, max loss, breakeven, assignment risk. |
| O07 | Spreads | Verticals, calendars, ratios: the same six fields per strategy, when each structure is the wrong tool. |
| O08 | Volatility Structures | Straddles, strangles, butterflies, condors, long and short. |
| O09 | Options On Futures | Where NT8 and the brokers allow them, Section 1256, the differences from equity options, and the Blueprint setups with an options expression where one fits (the per-setup sections from the ideas backlog). |
| O10 | Reading An Options Chain | How to read a chain and a risk graph on a platform, the approval levels, the platform guides; the track's assignment and summary. |

## 6. Build order (runner items)

1. Track scaffolding (one item): structure in section 1, the two notice components, the
   limits data file, check.mjs rules, tests. No modules yet.
2. Finance modules F01 to F12, then Options O01 to O10, one module per run, each as A (build
   page + lesson) and B (fresh review), the same two-step the futures rollout uses (item 20).
   The page is written from the sources in section 3 under the rules in section 2; the lesson
   follows LESSON_STANDARD.md.
3. Audio: Shane's local batch, per track, after review.
4. Publishing: both tracks publish as each module clears review.

Runner items 22 to 24 in BACKLOG.md carry this. Item 20 (futures lessons) finishes first; the
runners take the track items after it, so nothing here slows the current rollout.
