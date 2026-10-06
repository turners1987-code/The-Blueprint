# The Blueprint — Canonical Taxonomy

Version 1.4.1 · 2026-10-06 (document revision; `TAXONOMY_VERSION` in `js/journal/schema.js` stays "1.4")
Status: APPROVED structure. Four items remain OPEN (#2, #5, #7, #8); none block the build.

This file freezes the **vocabulary and the record structure**. The journal schema, the
TurtleMetrics tag set, and every lesson build against these exact names. Changing a name after
content ships means re-tagging trades and rewriting lessons.

**Division of sources — read this before editing anything.**

| This file is the source of truth for | It is NOT the source of truth for |
| --- | --- |
| Field model, slugs, definitions, status vocabulary, thresholds, display rules | Evidence. Every R-number, n, expectancy and hit rate lives in `hypothesis-register.md` |

Evidence moves every time a test runs. A copy of a number in this file is a copy that will be
wrong within months, with no way to tell which copy is current. So items below carry a
**register ID and a badge, never the numbers behind them.** Where a number is load-bearing for a
*lesson caution* rather than for evidence, it is marked `[cite register]` and the lesson pulls it
live.

Companion files: `METHODOLOGY_v2.md` (what the method is), `setup-definitions.txt` (Shane's own
wording, verbatim), `review-questions.txt` (the discipline checklist), `hypothesis-register.md`
(Gate 1 evidence), `session-open-base-rates.md` (open-type touch rates).

---

## 0. Versioning and migration

- **Every trade record stores `taxonomy_version`**, stamped at write time from the version in
  force when the trade is tagged.
- **No back-filling, with one exception:** records created before versioning existed are stamped
  once, at import, with the version in force when they were tagged. That stamp is itself recorded
  as an import event. After import, a record's version never changes.
- **Slugs are immutable.** Display names may change freely; a slug never does. Retiring or
  splitting a concept creates a *new* slug plus a `superseded_by` entry in section 9, never an
  edit in place.
- **Every version bump ships a migration note** in section 10: old value → new field + value, or
  "no change." A version with no migration note is not a valid version.
- **Analysis cohorts must not silently mix versions.** Any cohort spanning a version boundary
  where the definition changed is flagged in the UI, not averaged quietly.

---

## 1. Field model

Every trade records these independently. This is the single most important structural change from
the TurtleMetrics model, which allowed only ONE setup tag and had no location field.

### 1.1 Classification fields

| Field | Cardinality | Purpose |
| --- | --- | --- |
| `taxonomy_version` | exactly 1 | Which version of this file the trade was tagged under. |
| `setup` | exactly 1 | The read. What price is doing. |
| `location` | exactly 1 | Where it happened. The named level or level type. |
| `trigger` | 0 or 1 | The entry event. A **price event**. Blank if nothing fired. |
| `confirmation` | 0 or many | Order-flow evidence supporting the entry. Carries the aggression sub-forms (3.4). |
| `grade` | exactly 1 | A+ / A / B / C — plan compliance at entry only. See 5.1. |
| `execution_mark` | exactly 1 | Pass / Fail — did the exit follow the plan. See 5.2. |
| `environment` | exactly 1 | `live` / `sim` / `replay` |
| `tags` | 0 or many | Process and behavioral tags, by category. |

`trigger_subform` was removed in 1.3. OPEN #1 resolved to confirmation, so the sub-forms live in
`confirmation`. Because `confirmation` was already frozen as nullable in 1.2, this is a data
change, not a schema migration.

### 1.2 Measurement fields

| Field | Unit | Purpose |
| --- | --- | --- |
| `instrument` · `direction` · `session_date` · `entry_time` · `exit_time` | not numeric: text; `session_date` is YYYY-MM-DD; times are ISO 8601 with a UTC offset | Identity and time context. |
| `intended_price` | price points | Where the plan said to get filled. |
| `actual_fill` | price points | Where the fill happened. `actual_fill − intended_price` is the fill-placement gap — the known skill gap, measured instead of merely noted. |
| `stop_price` · `target_price` | price points | Plan geometry, for grade evaluation. |
| `size` | contracts | Plan geometry, for grade evaluation. |
| `r_multiple` | R (a multiple of the planned risk) | Outcome. |
| `mae_ticks` · `mfe_ticks` | ticks | Outcome. Maximum adverse and maximum favorable excursion; journal must-haves. |
| `time_in_trade_seconds` | seconds | Outcome. Time from entry to exit; a journal must-have. |
| `commissions` | US dollars | Gate 2 expectancy is after commissions. |

A price point is one index point; for MNQ one tick is 0.25 points.

`mae_ticks` and `mfe_ticks` are **positive magnitudes regardless of direction**: how far price went
against the trade (`mae_ticks`) or for it (`mfe_ticks`) from the fill, never a signed value, on
longs and shorts alike. `commissions` is **US dollars for the entire trade** — both sides, all
contracts — not per contract and not per side.

Renamed in 1.4 from `mae`, `mfe` and `time_in_trade` so the unit is in the name.

Classification answers "what was this." Measurement answers "what happened." Grade draws only on
the plan, never on `r_multiple` (see 5.1).

### 1.3 Why location is its own field

Under the one-setup-tag rule, a Stacked Imbalance trade forced a choice between Stacked Imbalance
and Trend Continuation. They are not alternatives — one is *where*, the other is *what*. The same
constraint left in-session levels untracked at n=0, and pushed real trades into the No Setup
bucket because the taxonomy had nowhere to put them.

---

## 2. Setups

Price at a key level either holds or fails. Holds = Trend Continuation. Fails = Range Rejection.
Same analysis, opposite outcomes. Gaps get their own setups because the gap changes why price is
moving. A gap exists only when RTH opens outside the prior day's range.

### 2.1 Trend Continuation
- **Slug:** `trend-continuation` · **Register ID:** R1 · **Badge:** CANDIDATE
- **Type:** Core read — level holds
- **Definition (APPROVED 2026-10-04, locked):**
  > Price tests a level and is accepted beyond it — a 5-minute close beyond the level within 15
  > minutes of first touch. The trade goes in the direction of acceptance, with the stop behind
  > the level. At PDH/PDL in the first 90 minutes this is R1 and carries R1's tested stop, target
  > and numbers. At every other level it is n=0.
- **Gate 1:** CANDIDATE. Below the n and per-year requirements; the sample is a 2026 partial-year
  run. Full-history run is register queue item #1. `[cite register]`
- **Gate 2:** below threshold; live/sim split required before any count displays. `[cite register]`
- **R1 tested form:** first 9:30–11:00 test of PDH/PDL; 5-min close beyond the level within 15
  minutes of first touch; enter at that close. Stop = level −/+ 5% of the 14-day average range.
  Target 2R.
- **HARD RULE:** R1's numbers publish only with R1's tested stop and target. The 78-tick floor and
  structural targeting are separate, untested rules and must never be attached to R1's expectancy.

### 2.2 Range Rejection
- **Slug:** `range-rejection` · **Register ID:** R5 · **Badge:** WATCH
- **Type:** Core read — level fails
- **Variant:** Failed Breakdown / Failed Breakout (stop-run / manipulation form). Not a separate
  setup. Trapped Traders is its footprint confirmation.
- **Gate 1:** WATCH. **This is a CONTEXT READ, not a tradeable entry.** Cite it as the mirror of
  R1, never as a trade result. `[cite register]`
- **Gate 2:** count VERIFIED as Shane's own (OPEN #4 resolved 2026-10-04). Live/sim split still
  required before display. `[cite register]`
- **Known gap:** R6 (fade at the 15-minute mark) KILLED. The rejection *entry* is unsolved. The
  lesson must say so rather than imply an entry exists. Reopen condition in section 8.

### 2.3 Gap Fill
- **Slug:** `gap-fill` · **Register ID:** R10 (fade entry); R7 (supporting)
- **Badge:** UNTESTED (retargeted setup) / KILLED (R10 entry)
- **Gate 1:** R10's entry method KILLED; cause was a stop inside the noise. Retargeted form (PD
  range edge) is UNTESTED as a trade. `[cite register]`
- **Gate 2:** n=0 under current definition.
- **Target:** the PD range edge, **NOT** the prior close. PD High/Low touch rates exceed
  prior-close touch rates on both gap directions; R7 (WATCH) supports targeting the PD level only.
  `[cite register, session-open-base-rates.md]`
- **Lesson caution:** a touch rate measured from the open is not trade expectancy. A
  high-probability magnet still loses money if the entry sits in the wrong place. State this on
  the page.
- **Superseded:** "trade from the open til the gap fills" → What I Got Wrong.

### 2.4 Gap N Go
- **Slug:** `gap-n-go` · **Register ID:** R11 · **Badge:** KILLED (tested form)
- **Gate 1:** KILLED in the tested form; the sample splits positive early and negative late, which
  is instability, not edge. Other Gap N Go definitions are untested. `[cite register]`
- **Gate 2:** n=0 under current definition.
- Goes to What I Got Wrong alongside the old Gap Fill target.

### 2.5 No Setup
- **Slug:** `no-setup` · Honest tag. Exists so the other tags mean something.
- Shane's definition: "Trading based off feel. Gambling."
- **AUDIT REQUIRED before publishing any count — OPEN #5.** Some trades landed here only because
  the taxonomy had nowhere else to put them: Level Reclaim had no slot, in-session levels were
  untracked. A trade at a real level with a real trigger is a taxonomy gap, not gambling. Re-tag
  what the section 9 mapping allows; publish what remains. The Trigger Without Location trades
  stay in the count: mid-range, nothing under the stop, all in the first 20 minutes.

### 2.6 Taxonomy dispositions

These are **taxonomy states**, not evidence states (section 6). An item can be RETIRED and still
carry a Gate 1 result — Opening Range Breakout is both.

| State | Meaning |
| --- | --- |
| RETIRED | No longer a selectable value. May survive in another field. |
| FOLDED | Absorbed into another value; history re-maps to it. |
| MOVED | Same concept, different field. |

| Name | Disposition | Reason |
| --- | --- | --- |
| Second Chance Entry | RETIRED | A legitimate re-entry is the same setup plus a fresh trigger |
| Opening Range Breakout | RETIRED as setup | R8 KILLED. OR high/low survives as a LOCATION |
| Breakout/Breakdown | FOLDED | Never defined (empty description), n=1. Folds into Range Rejection |
| Failed Breakdown/Breakout | FOLDED | Now a variant of Range Rejection |
| Pause N Go (as setup) | MOVED | Became a trigger |
| Stacked Imbalance (as setup) | MOVED | Became a location. Shane: "the read/location, not the trigger itself" |

Machine-readable mapping for all six: section 9.

---

## 3. Triggers and confirmations

**Governing rule (reworded 2026-10-04, superseding the 9/2 version):** something must happen at
the level before entry, and that event is a **price event**. Order flow confirms the entry; it
does not replace the trigger.

No trigger has a register entry, so **every trigger is UNTESTED at Gate 1.** Own-trade expectancy
comparisons between triggers sit below the display minimum (6.4) and are never stated as rankings.

### 3.1 Pause N Go
- **Slug:** `pause-n-go` · **Badge:** UNTESTED · **Status:** primary trigger, most-used
- **Definition (1.3):** price pauses at the level and then resumes in the direction of the read.
  The pause-then-resume is the trigger.
- The absorption clause was removed from this definition in 1.3 and moved to the `big-orders`
  confirmation (3.4), resolving the overlap flagged in 1.1.
- **OPEN #2** — still needs a tested definition, now narrower.

### 3.2 Resting Limit at Level (after displacement)
- **Slug:** `resting-limit` · **Badge:** UNTESTED · In use.
- The fill is the trigger. Also the direct fix for the Best Available Fill gap — and the reason
  `intended_price` exists (1.2).

### 3.3 9 EMA Pullback
- **Slug:** `ema-pullback` · **Badge:** UNTESTED
- The close back on the trend side is the trigger. Continuation-only. An EMA reclaim against the
  move is NOT this trigger.
- The wick-entry vs wait-for-close comparison in the record is **a single observation**. It
  illustrates the rule; it does not measure it. Never quoted as expectancy. `[cite register]`

### 3.4 Confirmations — aggression fails at the level
- **Slug:** `aggression-fails` · **Badge:** UNTESTED
- **Not a trigger.** OPEN #1 resolved 2026-10-04: order-flow events are confirmation. A price
  trigger from 3.1–3.3 or 3.5 must also be present.
- Footprint-based, so Gate 1 is **blocked on tick data** (6.3) — a data block, not a failed test.
- **A sub-form is required whenever this confirmation is used.** The four are not the same event
  and the distinction must stay recoverable:

| Sub-form | What it is |
| --- | --- |
| `big-orders` | Passive absorption — size sitting at the level |
| `failing-delta` | Aggression drying up on approach |
| `delta-divergence` | Divergence on approach, not arrival |
| `two-bar-exhaustion` | Timing pattern — large negative min delta + close near the high, or the mirror |

Other confirmations: Trapped Traders (Range Rejection variant), and Trader Dale's four
(absorption, limit orders, aggressive traders, delta divergence) where they do not duplicate the
sub-forms above.

### 3.5 Level Reclaim (5-min close)
- **Slug:** `level-reclaim` · **Badge:** UNTESTED
- Keep tagging so the comparison stays honest. Had no TurtleMetrics slot, which is part of the
  No Setup over-count (OPEN #5).

### 3.6 No Trigger
- **Slug:** `none`
- The trigger field is blank when nothing fired. This is data, not an absence of data — it is how
  Trigger Without Location gets counted.

---

## 4. Locations

The level test is whether the stop has structure behind it, not whether price is touching a line.
Levels are zones; the stop goes behind the far edge.

### 4.1 Pre-marked
`pd-high` · `pd-low` · `pd-vah` · `pd-val` · `pd-vpoc` · `settlement` · `on-high` · `on-low` ·
`on-poc` · `london-high`* · `london-low`* · `asia-high`* · `asia-low`* · `prior-week-high` ·
`prior-week-low` · `htf-hvn` · `htf-lvn`

\* INACTIVE — shelved off the live chart (4.4). Slugs reserved; not selectable until the NT8 fix
ships.

### 4.2 In-session
`or-high` · `or-low` (once the window closes) · `defended-pullback-high` ·
`defended-pullback-low` · `developing-vpoc` · `developing-vah` · `developing-val` ·
`unfinished-business` · `stacked-imbalance`

All in-session locations are n=0 and tagged until counted.

**D12 (CANDIDATE)** supports Unfinished Business as a target: poor highs/lows get taken out more
often than clean extremes. `[cite register]`

**Stacked Imbalance** — 5-min footprint shows a cluster of adjacent price levels with sustained
one-sided imbalance (current settings: ratio 5, min delta 15) plus bar/cumulative delta trending
one way. Ratio 5 was chosen for screen clarity and has never been tested on MNQ — **OPEN #7**.
Carry the caveat into the lesson until it resolves.

### 4.3 Mid-range
`mid-range` — no named level. Exists so Trigger Without Location is countable rather than
invisible.

### 4.4 Level integrity notes
- Asia/London session boxes are shelved off the live chart (untracked; DST drift against fixed-ET
  windows). Slugs stay reserved so history re-activates cleanly.
- **Session scope of every pre-marked level** (convention settled, OPEN #6 closed):

  | Level | Session scope |
  | --- | --- |
  | PD High/Low, POC/VA, Settlement (`pd-*`, `settlement`) | RTH, 09:30–16:00 ET |
  | PW/PM (`prior-week-*`, prior month) | Full-session week, Sun 18:00 → Fri 16:00 ET |
  | ON / Asia / London (`on-*`, `asia-*`, `london-*`) | ETH |

  The day boundary everywhere is **16:00 ET** (NYSE close), deliberately not CME's 17:00. Levels
  may differ slightly from TradingStats; accepted. The ON window itself is under question —
  OPEN #8.

---

## 5. Tags, grading and execution

| Category | Purpose |
| --- | --- |
| Grades | A+ / A / B / C. One per trade, in the `grade` field. Impulsive is NOT a grade — it is a Negative tag. |
| Entries | `legacy_` prefixed. Superseded by the `trigger` field; retained for history, **not selectable on new trades**. |
| Technical | Session and volume context, T1/T2 targets. |
| Positive | Process-success tags. |
| Negative | Emotion and rule-break tags, split Entry/Exit. |

**Tagging rules:** a correctly built plan trade that lost gets no negative tag. Positive and
negative tags never contradict. Platform liquidations get no exit tags.

### 5.1 Grade rubric — entry plan compliance only

Grade is assigned **at entry**, before the trade resolves, and never reads the outcome. Without a
written rubric, grade becomes a mood ring: winners get A, losers get C, and every grade cohort
stops meaning anything. Four checks, all answerable at entry:

1. `location` is a named level from section 4 (not `mid-range`).
2. `trigger` is present and fired before entry.
3. Stop is behind structure, not inside noise.
4. Size matches the plan for that stop distance.

| Grade | Rule |
| --- | --- |
| A+ | All four, and `actual_fill` is **within 2 ticks** of `intended_price`. |
| A | All four. |
| B | Three of four, with no breach of 3 or 4. |
| C | Two or fewer, or any breach of 3 or 4. |

A losing A+ is normal and expected. A winning C is a warning, not a result.

### 5.2 Execution mark — exit plan compliance

Assigned **after the exit**, in `execution_mark`. Kept separate from grade so grade stays immune
to outcome.

**Pass** — the exit followed the plan: target, planned scale, thesis invalidation, stop, or
session end.
**Fail** — the exit was anything else: moving a working target, tightening mid-flight for reasons
other than a pre-set invalidation, or exiting on feel.

Cohorts may be sliced by grade, by execution mark, or by both. A+/Fail is the most instructive
cell on the board — right plan, wrong finish.

---

## 6. Status vocabulary and thresholds

### 6.1 Evidence states

| Status | Meaning |
| --- | --- |
| UNTESTED | Written, not yet run against data |
| WATCH | Positive but unstable, or tiny n |
| CANDIDATE | Beats null and stable, but below a gate threshold |
| VALIDATED | Both gates passed |
| KILLED | Failed; reason and reopen condition logged (section 8) so it is never re-tested blind |

Evidence states are independent of the taxonomy dispositions in 2.6.

**Badge rule.** An item's badge can never exceed its Gate 1 status. Own-trade n and own-trade
expectancy below Gate 2 thresholds do not raise a badge. "Candidate" in the older informal sense
(an idea at n=1) maps to UNTESTED here.

### 6.2 Gates

**Gate 1 — market data.** n ≥ 100. Beats a volatility-preserving null. Positive in both halves and
in each calendar year, plus a 2023–2026 recency check.

**Gate 2 — own execution.** n ≥ 30 LIVE trades, across ≥ 20 distinct sessions, expectancy ≥ +0.3R
after commissions.

**VALIDATED requires both.** Either alone keeps the item CANDIDATE.

### 6.3 Data constraint

NT8 tick history covers about one year and Market Replay 90 days. Gate 1 for any footprint-based
item (the aggression confirmations, Stacked Imbalance) cannot meet the per-year requirement
without purchased tick data. Those items stay UNTESTED at Gate 1 until that data exists. **This is
a data block, not a failed test**, and the lesson pages must say which one they are looking at.

### 6.4 Sim rule and display rules

**Sim rule.** Sim trades are counted and reported separately and are NEVER pooled into any
expectancy figure. NT8 sim fills limits on touch, and fill placement inside the level is the known
skill gap — sim is biased on exactly the variable that decides outcomes. Sim counts occurrences;
it never measures edge. **The analysis module must refuse the pooling, not merely discourage it.**
Every Gate 2 count displays its live/sim split.

**Minimum n for display.** Dim any cohort below n=30 **and** below 20 distinct sessions — the
session floor matters because 30 trades from four sessions is one week's mood, not a sample.
**Dim means shown with a visual warning, never suppressed.** Small cohorts must stay visible;
they just must not look trustworthy. Cap cohorts at two dimensions. At roughly three trades a
day, setup × trigger × time bucket produces cells of n=2 and turns the analysis page into a
recency-bias generator.

**Mixed-version cohorts** are flagged, per section 0.

**As of this version, nothing is VALIDATED.** The entire method is candidate-grade or below.
Every setup and trigger page must display its badge and its n.

---

## 7. OPEN items

### RESOLVED
- **OPEN #1 — trigger or confirmation?** RESOLVED 2026-10-04: **confirmation.** Triggers are price
  events; order flow confirms. `trigger_subform` dropped, sub-forms moved to `confirmation`, the
  9/2 governing rule reworded (section 3), Pause N Go's absorption clause moved to `big-orders`.
- **OPEN #3 — Trend Continuation generic wording.** RESOLVED 2026-10-04: approved as written in
  2.1.
- **OPEN #4 — Range Rejection Gate 2 count.** RESOLVED 2026-10-04: verified as Shane's own trade
  count, not a copy of R5's. Live/sim split still required before display.
- **OPEN #6 — PWH/PWL session convention.** RESOLVED 2026-10-06: **full-session week, Sun 18:00 →
  Fri 16:00 ET**; the full convention is recorded in 4.4. The premise of the item was wrong —
  PWH/PWL was never RTH-only. No level changed, only this document's description of it, so no
  record's meaning changes: `TAXONOMY_VERSION` stays "1.4" and no re-derivation is owed. One
  accepted divergence: TradingStats' ETH week ends Fri 17:00 ET while the chart's ends Fri 16:00,
  so the two disagree only when a weekly extreme prints in Friday's final hour. Thinnest hour of
  the week; accepted, not chased.

### OPEN #2 — Pause N Go needs a tested definition
The primary trigger and the weakest-defined item in the stack. No register entry exists. Now
narrower after #1: absorption has moved to confirmation, so what needs defining is the price
event — what counts as a pause, and what counts as resumption. The early vs mid/late session
split (flagged 7/13) still needs writing.
**Blocks:** the Pause N Go lesson, and the Failed Breakdown chain that ends in it. **Owner:** Shane.

### OPEN #5 — No Setup re-tag audit
Re-tag the No Setup trades using the section 9 mapping, then publish what remains. Until this
runs, no No Setup count is publishable — the current one mixes genuine feel-trades with taxonomy
gaps.
**Blocks:** the No Setup lesson and every setup-distribution chart. **Owner:** Shane (judgment
calls), journal build (bulk re-tag).

### OPEN #7 — Stacked Imbalance ratio
Ratio 5 / min delta 15 was chosen for screen clarity, never tested on MNQ. Until tested, the
lesson states the setting as a working default rather than a result.
**Blocks:** Stacked Imbalance lesson precision; Gate 1 for the location (also subject to 6.3).
**Owner:** register queue.

### OPEN #8 — Overnight level window vs TradingStats OVN
**Status:** unresolved. **Owner:** NT8 build project.
The 16:00 ET day boundary puts `on-high`, `on-low` and `on-poc` on a wider window than
TradingStats' OVN module, which is 18:00 prev day → 09:30. The 16:00–17:00 ET hour falls inside
the chart's overnight but outside the tested window. This matters because the OVN module is the
most load-bearing in the dataset (95.1% OVN breakout rate; open vs OVN mid at +22pp is the
strongest single directional factor), and citing those numbers for a differently-scoped level
breaks the rule that a statistic must back the level actually traded.
**Proposal under consideration (NOT decided):** keep 16:00 as the day-labelling convention and
re-scope the ON level window to 18:00 → 09:30 to match the tested module, on the grounds that
"which day a trade belongs to" and "what window computes the overnight high" are separable
decisions.
**Version note:** resolving it the proposed way WOULD be a semantic change to `on-*` locations and
would warrant a `TAXONOMY_VERSION` bump plus re-derivation at that time.
**Blocks:** citing OVN statistics for any `on-*` location.

---

## 8. KILLED register — reason and reopen condition

Nothing is retested blind, and nothing stays dead by accident. Every KILLED item carries both
fields; the register holds the numbers.

| Item | Kill reason | Reopen condition |
| --- | --- | --- |
| R10 — Gap Fill fade entry | Stop sat inside the noise | Retest with the R4 stop (queued) |
| R11 — Gap N Go, tested form | No edge; opposite-signed halves | A different Gap N Go definition, tested from scratch |
| R6 — Range Rejection fade at 15 min | Negative expectancy | A different rejection entry; the setup's context read (R5) stands |
| R8 — Opening Range Breakout | Follow-through ≈ null | None as a setup. Survives as a location only |

---

## 9. Legacy mapping — old tag → new fields

Deterministic mapping for the OPEN #5 audit and any TurtleMetrics import. Anything not listed is a
judgment call and stays flagged for manual review.

| Old TurtleMetrics tag | `setup` | `location` | `trigger` / other |
| --- | --- | --- | --- |
| Second Chance Entry | the underlying read | as traded | fresh trigger recorded normally |
| Opening Range Breakout | `trend-continuation` or `range-rejection` by outcome at the level | `or-high` / `or-low` | as traded |
| Breakout/Breakdown | `range-rejection` | as traded | as traded |
| Failed Breakdown / Failed Breakout | `range-rejection` (variant noted in `tags`) | as traded | as traded |
| Pause N Go (as setup) | the underlying read | as traded | `pause-n-go` |
| Stacked Imbalance (as setup) | the underlying read | `stacked-imbalance` | as traded |
| Level Reclaim trades filed under No Setup | the underlying read | the level reclaimed | `level-reclaim` |
| In-session-level trades filed under No Setup | the underlying read | the section 4.2 level | as traded |
| Genuine feel trades | `no-setup` | `mid-range` | `none` |
| Any aggression-based entry tag | the underlying read | as traded | price trigger if identifiable, else `none`; aggression sub-form → `confirmation` |

Legacy entry tags keep their values with a `legacy_` prefix and are unselectable going forward.

---

## 10. Change log

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-04 | Initial. Location promoted to its own field. Four order-flow triggers consolidated with a required sub-form. Stacked Imbalance moved to location. Grades fixed at A+/A/B/C. Gate 2 thresholds set. Sim pooling prohibited. |
| 1.1 | 2026-10-04 | Badge rule added: badge cannot exceed Gate 1 status. Badges corrected. R1 Gate 1 shortfall stated. Range Rejection Gate 2 flagged. Live/sim split required. Trigger rankings removed. Footprint Gate 1 data block stated. London/Asia slugs marked inactive. |
| 1.2 | 2026-10-04 | Evidence moved out to the register; items carry register ID + badge + `[cite register]`. Section 0 versioning added. Measurement fields named. `confirmation` frozen as nullable. Grade rubric written. Taxonomy dispositions separated from evidence states. Sections 8 and 9 added. Display floor gains a 20-session requirement. OPEN #4–#7 promoted. |
| 1.3 | 2026-10-04 | **OPEN #1 RESOLVED — confirmation.** Governing rule reworded: triggers are price events, order flow confirms. `trigger_subform` removed; sub-forms moved to `confirmation`. Pause N Go's absorption clause moved to `big-orders`; its definition narrowed to pause-then-resume. Section 3 retitled "Triggers and confirmations." **OPEN #3 RESOLVED** — Trend Continuation wording approved and locked into 2.1. **OPEN #4 RESOLVED** — Range Rejection Gate 2 count verified as Shane's own. Section 0 back-fill contradiction fixed (one-time import stamp permitted and recorded). **Grade rubric split (5.1 / 5.2):** grade is entry-plan compliance, assigned before resolution; new `execution_mark` field carries exit compliance. A+ fill tolerance defined as within 2 ticks. Display floor clarified: dim means shown with a warning, never suppressed. Legacy mapping gains a row for aggression-based entry tags. |
| 1.4 | 2026-10-05 | **Field names and units aligned with the journal schema.** Section 1.2: `mae` → `mae_ticks`, `mfe` → `mfe_ticks`, `time_in_trade` → `time_in_trade_seconds`. Units column added to the measurement table (price points, contracts, R, ticks, seconds, US dollars). `mae_ticks` and `mfe_ticks` stated as positive magnitudes regardless of direction; `commissions` stated as US dollars for the entire trade, both sides, all contracts. `execution_mark` was already in the 1.1 table (Pass / Fail, 5.2); no change. No enum, gate or OPEN item changed. |
| 1.4.1 | 2026-10-06 | **Documentation correction; `TAXONOMY_VERSION` stays "1.4".** OPEN #6 closed: PWH/PWL was never RTH-only; the "RTH-only" line in 4.4 was wrong and is replaced by the session scope of every pre-marked level (RTH for PD/POC/VA/Settlement, full-session week Sun 18:00 → Fri 16:00 ET for PW/PM, ETH for ON/Asia/London; day boundary 16:00 ET). Convention dagger removed from `prior-week-high`/`prior-week-low`. OPEN #8 opened (overnight level window vs TradingStats OVN). |

**Migration 1.2 → 1.3:**
- `trigger_subform` → `confirmation`. Same values, new field. No value renames.
- Trades whose `trigger` was `aggression-fails`: the sub-form moves to `confirmation`; `trigger`
  is set to the price trigger if identifiable from the record, otherwise `none`. Flag for review.
- `execution_mark` is new and null for all existing trades. Back-fill only where the record
  states the exit reason; otherwise leave null.
- `grade` values predating 5.1 remain flagged for re-grading — they were assigned without a
  rubric, and 1.3 narrows the rubric from five checks to four.

**Migration 1.3 → 1.4:**
- No values changed; only field names. `mae` → `mae_ticks`, `mfe` → `mfe_ticks`,
  `time_in_trade` → `time_in_trade_seconds`. Same values, new names.

**Migration 1.4 → 1.4.1:**
- No change. Document correction only; no level, slug or enum changed, no record's meaning
  changes, no re-derivation owed.
