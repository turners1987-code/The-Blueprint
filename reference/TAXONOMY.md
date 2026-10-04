# The Blueprint — Canonical Taxonomy

Version 1.2 · 2026-10-04
Status: DRAFT — seven items marked OPEN require Shane's decision before this freezes.

This file freezes the **vocabulary and the record structure**. The journal schema, the
TurtleMetrics tag set, and every lesson build against these exact names. Changing a name after
content ships means re-tagging trades and rewriting lessons, so nothing downstream starts until
this is approved.

**Division of sources — read this before editing anything.**

| This file is the source of truth for | It is NOT the source of truth for |
| --- | --- |
| Field model, slugs, definitions, status vocabulary, thresholds, display rules | Evidence. Every R-number, n, expectancy and hit rate lives in `hypothesis-register.md` |

Evidence moves every time a test runs. A copy of a number in this file is a copy that will be
wrong within months, with no way to tell which copy is current. So items below carry a
**register ID and a badge, never the numbers behind them.** Where a number is load-bearing for
a *lesson caution* rather than for evidence, it is marked `[cite register]` and the lesson
pulls it live.

Companion files: `METHODOLOGY_v2.md` (what the method is), `setup-definitions.txt` (Shane's own
wording, verbatim), `review-questions.txt` (the discipline checklist), `hypothesis-register.md`
(Gate 1 evidence), `session-open-base-rates.md` (open-type touch rates).

---

## 0. Versioning and migration

Three OPEN items remain, so this taxonomy will change at least once more. These rules make that
survivable.

- **Every trade record stores `taxonomy_version`** (e.g. `1.2`), stamped at write time and never
  back-filled. Without it, a trade tagged `pause-n-go` is ambiguous between the
  absorption-inclusive definition and whatever OPEN #1 leaves behind.
- **Slugs are immutable.** Display names may change freely; a slug never does. Retiring or
  splitting a concept creates a *new* slug plus a `superseded_by` entry in section 9, never an
  edit in place.
- **Every version bump ships a migration note** in section 10: old value → new field + value, or
  "no change." A version with no migration note is not a valid version.
- **Analysis cohorts must not silently mix versions.** Any cohort spanning a version boundary
  where the definition changed is flagged in the UI, not averaged quietly.

---

## 1. Field model

Every trade records these independently. This is the single most important structural change
from the TurtleMetrics model, which allowed only ONE setup tag and had no location field.

### 1.1 Classification fields

| Field | Cardinality | Purpose |
| --- | --- | --- |
| `taxonomy_version` | exactly 1 | Which version of this file the trade was tagged under. |
| `setup` | exactly 1 | The read. What price is doing. |
| `location` | exactly 1 | Where it happened. The named level or level type. |
| `trigger` | 0 or 1 | The entry event. Blank if nothing fired. |
| `trigger_subform` | 0 or 1 | Required when `trigger` = `aggression-fails` **and** OPEN #1 resolves to "trigger." |
| `confirmation` | 0 or many | Order-flow evidence supporting the entry. Frozen as nullable now; OPEN #1 decides only which values land here vs in `trigger`. |
| `grade` | exactly 1 | A+ / A / B / C — plan compliance only. See 5.1. |
| `environment` | exactly 1 | `live` / `sim` / `replay` |
| `tags` | 0 or many | Process and behavioral tags, by category. |

`confirmation` is deliberately **not** contingent in v1.2. Shipping a field whose existence
depends on an open decision means a schema migration later; shipping it nullable means OPEN #1
becomes a data decision instead. That takes a rewrite off the critical path.

### 1.2 Measurement fields (assumed present; named here so the schema can't omit them)

| Field | Purpose |
| --- | --- |
| `instrument` · `direction` · `session_date` · `entry_time` · `exit_time` | Identity and time context. |
| `intended_price` | Where the plan said to get filled. |
| `actual_fill` | Where the fill happened. `actual_fill − intended_price` is the fill-placement gap named in section 6's sim rule — the known skill gap, measured instead of merely noted. |
| `stop_price` · `target_price` · `size` | Plan geometry, for grade evaluation. |
| `r_multiple` · `mae` · `mfe` · `time_in_trade` | Outcome. MAE/MFE and time-in-trade are journal must-haves. |
| `commissions` | Gate 2 expectancy is after commissions. |

Classification answers "what was this." Measurement answers "what happened." Lessons and badges
draw on both; grade draws only on the plan, never on `r_multiple` (see 5.1).

### 1.3 Why location is its own field

Under the one-setup-tag rule, a Stacked Imbalance trade forced a choice between Stacked Imbalance
and Trend Continuation. They are not alternatives — one is *where*, the other is *what*. The same
constraint left in-session levels (OR high/low, developing VPOC/VAH/VAL) untracked at n=0, and
pushed real trades into the No Setup bucket because the taxonomy had nowhere to put them.

---

## 2. Setups

The organizing idea: price at a key level either holds or fails.
Holds = Trend Continuation. Fails = Range Rejection. Same analysis, opposite outcomes.
Gaps get their own setups because the gap changes why price is moving. A gap exists only when
RTH opens outside the prior day's range.

### 2.1 Trend Continuation
- **Slug:** `trend-continuation`
- **Type:** Core read — level holds
- **Register ID:** R1 (PD Level Acceptance Continuation) · **Badge:** CANDIDATE
- **Gate 1:** CANDIDATE. Below the n and per-year requirements; the sample is a 2026 partial-year
  run. Full-history run is register queue item #1. `[cite register]`
- **Gate 2:** below threshold; live/sim split required before any count displays. `[cite register]`
- **R1 tested form:** first 9:30–11:00 test of PDH/PDL; 5-min close beyond the level within 15
  minutes of first touch; enter at that close. Stop = level −/+ 5% of the 14-day average range.
  Target 2R.
- **HARD RULE:** R1's numbers publish only with R1's tested stop and target. The 78-tick floor and
  structural targeting are separate, untested rules and must never be attached to R1's expectancy.
- **Generic form:** the read applies at any level in section 4, using R1's acceptance test as the
  standard. Every level other than PDH/PDL inherits the test at n=0.
- **OPEN #3** — wording.

### 2.2 Range Rejection
- **Slug:** `range-rejection`
- **Type:** Core read — level fails
- **Variant:** Failed Breakdown / Failed Breakout (stop-run / manipulation form). Not a separate
  setup. Trapped Traders is its footprint confirmation.
- **Register ID:** R5 (unaccepted test → rejection) · **Badge:** WATCH
- **Gate 1:** WATCH. **This is a CONTEXT READ, not a tradeable entry.** Cite it as the mirror of
  R1, never as a trade result. `[cite register]`
- **Gate 2:** VERIFY — see OPEN #4. The recorded own-trade count equals R5's market-data count
  exactly, which is the signature of a copy. Nothing displays until that is settled.
- **Known gap:** R6 (fade at the 15-minute mark) KILLED. The rejection *entry* is unsolved. The
  lesson must say so rather than imply an entry exists. Reopen condition in section 8.

### 2.3 Gap Fill
- **Slug:** `gap-fill`
- **Type:** Gap setup
- **Register ID:** R10 (fade entry); R7 (supporting) · **Badge:** UNTESTED (retargeted setup) /
  KILLED (R10 entry)
- **Gate 1:** R10's entry method KILLED; cause was a stop inside the noise. Retargeted form (PD
  range edge) is UNTESTED as a trade. `[cite register]`
- **Gate 2:** n=0 under current definition.
- **Target:** the PD range edge, **NOT** the prior close. PD High/Low touch rates exceed
  prior-close touch rates on both gap directions; R7 (WATCH) supports targeting the PD level only.
  `[cite register, session-open-base-rates.md]`
- **Lesson caution:** a touch rate measured from the open is not trade expectancy. A high-probability
  magnet still loses money if the entry sits in the wrong place. State this on the page.
- **Superseded:** "trade from the open til the gap fills" → What I Got Wrong.

### 2.4 Gap N Go
- **Slug:** `gap-n-go`
- **Type:** Gap setup
- **Register ID:** R11 (gap untouched through IB) · **Badge:** KILLED (tested form)
- **Gate 1:** KILLED in the tested form; the sample splits positive early and negative late, which
  is instability, not edge. Other Gap N Go definitions are untested. `[cite register]`
- **Gate 2:** n=0 under current definition.
- Goes to What I Got Wrong alongside the old Gap Fill target.

### 2.5 No Setup
- **Slug:** `no-setup`
- **Type:** Honest tag. Exists so the other tags mean something.
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
| Pause N Go (as setup) | MOVED | Became a trigger. 5/30 OBS review: nearly every entry was a Pause N Go regardless of context |
| Stacked Imbalance (as setup) | MOVED | Became a location. Shane: "the read/location, not the trigger itself" |

Machine-readable mapping for all six: section 9.

---

## 3. Triggers

Governing rule (9/2): something must happen at the level before entry, but that event may be
order-flow based and does not have to be a bar close. **OPEN #1 may reword this rule.**

No trigger has a register entry, so **every trigger is UNTESTED at Gate 1.** Own-trade expectancy
comparisons between triggers sit below the display minimum (6.4) and are never stated as rankings.

### 3.1 Pause N Go
- **Slug:** `pause-n-go` · **Badge:** UNTESTED · **Status:** primary trigger, most-used
- Shane's definition: "price shows absorption in the footprint — or — blue orders holding it up
  (long) or pink holding it down (short) — before continuing in the direction toward the next
  target."
- **Overlap flag:** the absorption clause describes the same observation as the `big-orders`
  sub-form (3.4). As written, one trade can legitimately carry either. Resolved by OPEN #1.
- **OPEN #2** — needs a tested definition.

### 3.2 Resting Limit at Level (after displacement)
- **Slug:** `resting-limit` · **Badge:** UNTESTED · In use.
- Also the direct fix for the Best Available Fill gap — and the reason `intended_price` exists
  (1.2).

### 3.3 9 EMA Pullback
- **Slug:** `ema-pullback` · **Badge:** UNTESTED
- Continuation-only. An EMA reclaim against the move is NOT this trigger.
- The wick-entry vs wait-for-close comparison in the record is **a single observation**. It
  illustrates the rule; it does not measure it. Never quoted as expectancy. `[cite register]`

### 3.4 Aggression Fails at the Level
- **Slug:** `aggression-fails` · **Badge:** UNTESTED
- Footprint-based, so Gate 1 is **blocked on tick data** (6.3) — a data block, not a failed test.
- Consolidates four previously separate tags that were splitting a small sample four ways.
- The sub-form is **required** whenever this value is used, in whichever field OPEN #1 puts it.
  The four are not the same event and the distinction must stay recoverable:

| Sub-form | What it is |
| --- | --- |
| `big-orders` | Passive absorption — size sitting at the level |
| `failing-delta` | Aggression drying up on approach |
| `delta-divergence` | Divergence on approach, not arrival |
| `two-bar-exhaustion` | Timing pattern — large negative min delta + close near the high, or the mirror |

- **OPEN #1.**

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
`on-poc` · `london-high`* · `london-low`* · `asia-high`* · `asia-low`* · `prior-week-high`† ·
`prior-week-low`† · `htf-hvn` · `htf-lvn`

\* INACTIVE — shelved off the live chart (4.4). Slugs reserved; not selectable until the NT8 fix
ships.
† Convention flag — OPEN #6.

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
- PWH/PWL is currently RTH-only while other levels are ETH — OPEN #6, owned by the NT8 project.

---

## 5. Tags and grading

Carried from TurtleMetrics. Tags are many-per-trade, grouped by category.

| Category | Purpose |
| --- | --- |
| Grades | A+ / A / B / C. One per trade, in the `grade` field. Impulsive is NOT a grade — it is a Negative tag. |
| Entries | `legacy_` prefixed. Superseded by the `trigger` field; retained for history, **not selectable on new trades**. |
| Technical | Session and volume context, T1/T2 targets. |
| Positive | Process-success tags. |
| Negative | Emotion and rule-break tags, split Entry/Exit. |

**Tagging rules:** a correctly built plan trade that lost gets no negative tag. Positive and
negative tags never contradict. Platform liquidations get no exit tags.

### 5.1 Grade rubric — plan compliance only

Grade must never read the outcome. Without a written rubric, grade becomes a mood ring: winners
get A, losers get C, and every grade cohort stops meaning anything. Five checks, all answerable
before the trade resolves:

1. `location` is a named level from section 4 (not `mid-range`).
2. `trigger` is present and fired before entry.
3. Stop is behind structure, not inside noise.
4. Size matches the plan for that stop distance.
5. Exit followed the plan (target, invalidation, or time stop) rather than feel.

| Grade | Rule |
| --- | --- |
| A+ | All five, and the fill landed where intended (`actual_fill` ≈ `intended_price`). |
| A | All five. |
| B | Four of five, with no breach of 3 or 4. |
| C | Three or fewer, or any breach of 3 or 4. |

A losing A+ is normal and expected. A winning C is a warning, not a result.

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
item (Aggression Fails, Stacked Imbalance, the absorption clause of Pause N Go) cannot meet the
per-year requirement without purchased tick data. Those items stay UNTESTED at Gate 1 until that
data exists. **This is a data block, not a failed test**, and the lesson pages must say which one
they are looking at.

### 6.4 Sim rule and display rules

**Sim rule.** Sim trades are counted and reported separately and are NEVER pooled into any
expectancy figure. NT8 sim fills limits on touch, and fill placement inside the level is the known
skill gap — sim is biased on exactly the variable that decides outcomes. Sim counts occurrences;
it never measures edge. **The analysis module must refuse the pooling, not merely discourage it.**
Every Gate 2 count displays its live/sim split.

**Minimum n for display.** Dim any cohort below n=30 **and** below 20 distinct sessions — the
session floor matters because 30 trades from four sessions is one week's mood, not a sample. Cap
cohorts at two dimensions. At roughly three trades a day, setup × trigger × time bucket produces
cells of n=2 and turns the analysis page into a recency-bias generator.

**Mixed-version cohorts** are flagged, per section 0.

**As of this version, nothing is VALIDATED.** The entire method is candidate-grade or below. Every
setup and trigger page must display its badge and its n.

---

## 7. OPEN — requires Shane's decision

Every unresolved item has an ID, a blocks line and an owner. An item without an ID gets forgotten.

### OPEN #1 — Is "Aggression Fails at the Level" a trigger or a confirmation?
If standalone trigger: it can fire an entry alone, and the sub-form sits in `trigger_subform`. If
confirmation: a price trigger is still required, `trigger` records that, and the sub-form moves to
`confirmation`.
**Linked conflict:** Pause N Go's definition contains absorption — the same observation as the
`big-orders` sub-form. Whichever way #1 resolves, the overlap resolves with it.
**Recommended resolution (not decided):** triggers are price events (Pause N Go's pause-then-resume,
EMA pullback close, level reclaim close, resting limit fill); order-flow events are confirmation.
Pause N Go's absorption clause then moves into the `big-orders` confirmation. This matches the 7/13
early-session note (footprint usable as confirmation later, not at the open). It conflicts with the
9/2 governing rule, which allows an order-flow event to be the trigger — choosing it means rewording
9/2.
**Blocks:** trigger taxonomy; which field the sub-form writes to. **Does not block** the schema
(1.1 freezes both fields now). **Owner:** Shane, from the trade record in the Future project.

### OPEN #2 — Pause N Go needs a tested definition
The primary trigger and the weakest-defined item in the stack. No register entry exists. The early
vs mid/late session split (flagged 7/13) was never written: in the first minutes of RTH the trigger
runs off price action and delta only; footprint reads become usable as confirmation later. Depends
on OPEN #1 for whether absorption stays in the definition.
**Blocks:** the Pause N Go lesson, and the Failed Breakdown chain that ends in it. **Owner:** Shane.

### OPEN #3 — Wording of Trend Continuation's generic form
Shape agreed: write the read generically, using R1's acceptance test as the standard, then present
R1 as the one instance with history. Every other level inherits the test at n=0.
**Draft for sign-off:** "Trend Continuation: price tests a level and is accepted beyond it — a
5-minute close beyond the level within 15 minutes of first touch. The trade goes in the direction of
acceptance, with the stop behind the level. At PDH/PDL in the first 90 minutes this is R1 and carries
R1's tested stop, target and numbers. At every other level it is n=0."
**Blocks:** the Trend Continuation lesson. **Owner:** Shane.

### OPEN #4 — Range Rejection's Gate 2 count
The recorded own-trade count equals R5's market-data count exactly. Confirm from the trade record
that it is Shane's own count and not R5's copied across. If it is a copy, the Gate 2 figure is null
until recounted.
**Blocks:** any Range Rejection own-trade display. **Owner:** Shane, trade record.

### OPEN #5 — No Setup re-tag audit
Re-tag the No Setup trades using the section 9 mapping, then publish what remains. Until this runs,
no No Setup count is publishable — the current one mixes genuine feel-trades with taxonomy gaps.
**Blocks:** the No Setup lesson and every setup-distribution chart. **Owner:** Shane (judgment
calls), journal build (bulk re-tag).

### OPEN #6 — PWH/PWL session convention
PWH/PWL is RTH-only while every other level is ETH. Decide the convention, then re-derive history on
whichever side changes.
**Blocks:** prior-week location accuracy. **Owner:** NT8 build project.

### OPEN #7 — Stacked Imbalance ratio
Ratio 5 / min delta 15 was chosen for screen clarity, never tested on MNQ. Until tested, the lesson
states the setting as a working default rather than a result.
**Blocks:** Stacked Imbalance lesson precision; Gate 1 for the location (also subject to 6.3).
**Owner:** register queue.

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

Legacy entry tags keep their values with a `legacy_` prefix and are unselectable going forward.

---

## 10. Change log

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-04 | Initial. Location promoted to its own field. Four order-flow triggers consolidated with a required sub-form. Stacked Imbalance moved to location. Grades fixed at A+/A/B/C. Gate 2 thresholds set. Sim pooling prohibited. |
| 1.1 | 2026-10-04 | Badge rule added: badge cannot exceed Gate 1 status. Badges corrected — Range Rejection WATCH; Gap Fill UNTESTED / R10 KILLED; Gap N Go KILLED; all triggers UNTESTED. R1 Gate 1 shortfall stated. Range Rejection Gate 2 flagged for verification. Live/sim split required on every Gate 2 count. Trigger expectancy rankings removed. EMA example marked n=1. R7 added to Gap Fill. Pause N Go / big-orders overlap flagged and linked to OPEN #1. Contingent `confirmation` field added. Footprint Gate 1 data block stated. London/Asia slugs marked inactive. OPEN #3 draft wording added. |
| 1.2 | 2026-10-04 | **Evidence moved out.** All register numbers removed from this file; items carry register ID + badge + `[cite register]`. Source-of-truth split stated at the top. **Section 0 added:** `taxonomy_version` on every trade, immutable slugs, mandatory migration notes, mixed-version cohort flagging. **Measurement fields named (1.2)**, including `intended_price` vs `actual_fill` so the sim fill-placement gap is measured, not just described. `confirmation` frozen as nullable rather than contingent, removing a future migration. **Grade rubric written (5.1)** — plan compliance only, outcome excluded. Taxonomy dispositions (RETIRED/FOLDED/MOVED) defined and separated from evidence states. Legacy entry tags prefixed `legacy_` and made unselectable. **Section 8 added:** kill reason + reopen condition for every KILLED item. **Section 9 added:** deterministic old→new mapping for the No Setup audit and TurtleMetrics import. Display floor gains a 20-distinct-session requirement. Four prose-only issues promoted to OPEN #4–#7, each with blocks line and owner. |

**Migration 1.1 → 1.2:** no value changed. Trades tagged under 1.0/1.1 stamp as `1.1` on import;
`grade` values predating 5.1 are flagged for re-grading because they were assigned without a rubric.
