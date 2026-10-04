# The Blueprint — v2 Methodology (content source of truth)

Exported 2026-10-04 from the v2 Review Doc (2026-09-22), plus decisions settled since.
This file is the methodology Claude Code must write lessons from. Where this file and the
old BLUEPRINT_DOC disagree, this file wins. Do not write any lesson content from the
seven-setup book.

## Governance — two gates

**Gate 1 — Market data (Hypothesis Register).** Rule written and locked before data is
opened. Tested against a null (same rule on 1-min returns shuffled within 30-min blocks).
Must be positive in both halves and in each calendar year, plus a 2023–2026 recency check.
Reported in R with n, win %, expectancy, null expectancy. Threshold: **n >= 100**.

**Gate 2 — Own execution.** **n >= 30 live trades, across >= 20 distinct sessions,
expectancy >= +0.3R after commissions.** Sim trades are counted and reported separately and
are NEVER pooled into an expectancy figure — NT8 sim fills limits on touch, and fill
placement inside the level is the known skill gap, so sim is biased on exactly the variable
that decides outcomes. Sim counts occurrences; it never measures edge.

**VALIDATED requires both gates.** Either alone keeps the item CANDIDATE.

Status vocabulary: UNTESTED / WATCH / CANDIDATE / VALIDATED / KILLED.
**Nothing is presented as settled until VALIDATED.** Candidates publish with a status badge
showing status and n. As of this export, nothing is VALIDATED. The whole method is
candidate-grade and every page must say so.

## Tier structure

Every trade traces up through three tiers, in order:
1. **Idea Generation** — macro and catalyst, producing a thesis, an invalidation, a
   conviction level (strong / moderate / thin).
2. **Setup** — the location / the read.
3. **Trigger** — the entry event.

## Tier 2 — Setups (current working set)

Organizing idea: price at a key level either holds or fails.
**Holds = Trend Continuation. Fails = Range Rejection.** Same analysis, opposite outcomes.
Gaps get their own setups because the gap changes why price is moving.

### TREND CONTINUATION — core read
Written definition (Shane's own words, thin): "Entry placed bullish, above pink orders, in a
pull back, stop below low of forming swing... Or vice versa for bearish."

Mechanical form: **R1 PD Level Acceptance.** First 9:30–11:00 test of PDH/PDL, 5-min close
beyond the level within 15 minutes of first touch -> enter at that close. Tested at 2R with a
stop of level -/+ 5% of the 14-day average range. **+0.55R, n=20, null -0.04R.** 22 of 27
variants beat null in both halves. CANDIDATE.

Lesson rule: write the read **generically**, using R1's acceptance test as the standard
(5-min close beyond the level within 15 min of first touch). Then present R1 as the one
version with history behind it. Every other level inherits the acceptance test at n=0.

**HARD RULE:** publish R1 at the stop and target it was TESTED with. The 78-tick floor and
structural targeting are separate, untested rules and must NOT be attached to R1's numbers.

### RANGE REJECTION — core read
Includes Failed Breakdown / Failed Breakout as its variant.
Written definition: "Fade a push into a named range extreme (ON High, PD High, VAH) when
price opens inside prior day range and value area. Confirmed by shooting star candle(s) at
the level, dominant pink footprint, minimal blue orders on pullback, and bullish candle with
wick piercing 9 EMA closing below it as entry signal. Entry at break of that candle's low.
Stop above candle high. Target 2R."

**R5 is the mirror of R1:** an unaccepted PD test rejected back through the level, 11/11.
WATCH, and it is a **CONTEXT READ, not a trade**. Cite it as such.
R6 (fade at the 15-min mark) KILLED. The rejection entry is the unsolved piece.

### FAILED BREAKDOWN / BREAKOUT — variant of Range Rejection, not its own setup
"Failed Breakdown is Bearish. Failed Breakout is Bullish. Price puts in some sort of
manipulation below a level, exact criteria is 2 closes on the 1 min chart... then buys back
above. Enter on a pause n go."
Trapped Traders is its footprint confirmation.

### GAP FILL — kept, target changed
Written definition is **DEAD**: "trade from the open til the gap fills."
Correct target is the **PD range edge**, not the prior close. After a gap up, PD High is
touched 64.1% and the prior close 46.7%. After a gap down, PD Low 67.0% and prior close
45.9%.
**CAUTION for the lesson:** a touch rate measured from the open is not trade expectancy. A
64% magnet still loses money if the entry sits in the wrong place.
R10 (the gap-fill fade) KILLED at -0.15R; cause was a stop inside the noise. Retest with the
R4 stop is queued. Badge the entry method unvalidated.

### GAP N GO — kept, entry method dead
R11 scored 0.00R overall across 57 sessions; positive July–August, negative September.
Badge the entry method unvalidated. Goes on the "what I got wrong" page alongside the old
Gap Fill target.

### NO SETUP — a legitimate tag
Shane's own definition: "Trading based off feel. Gambling."
**Before publishing any count of No Setup trades, audit them.** Some were tagged No Setup
only because the taxonomy had nowhere else to put them — Level Reclaim had no slot and
in-session levels were untracked. A trade at a real level with a real trigger is a taxonomy
gap, not gambling. Re-tag what can be re-tagged; publish what is left. The four "Trigger
Without Location" trades stay in the count: mid-range, nothing under the stop.

### RETIRED
Second Chance Entry — a legitimate re-entry is just the same setup + a fresh trigger.
Opening Range Breakout as a setup — R8 killed it (15-min ORB follow-through 51% vs null 48%).
OR high/low remains a LOCATION once the window closes.

## What counts as a level

Pre-marked: PD High/Low, PD VAH/VAL/VPOC, settlement, ON High/Low/POC, London/Asia, prior
week, HTF HVN/LVN.
In-session: OR high/low once the window closes, a defended pullback high/low, developing
VPOC/VAH/VAL, Unfinished Business lines. In-session location is n=0 and tagged until counted.
D12 (CANDIDATE) supports Unfinished Business as targets: poor highs/lows get taken out next
day 59% vs 46% for clean extremes.
The level test is whether the stop has structure behind it, not whether price is touching a
line. **Levels are zones; the stop goes behind the far edge.**

**STACKED IMBALANCE is a LOCATION, not a setup.** Shane's own words: "Stacked Imbalance is
the read/location, not the trigger itself." 5-min footprint shows a stacked imbalance
cluster — multiple adjacent price levels with sustained one-sided imbalance (current
settings: ratio 5, min delta 15) plus sustained bar delta / cumulative delta trending one
way.
**OPEN ITEM for the lesson:** ratio 5 was chosen for screen clarity, never tested on MNQ.

**GAP DEFINITION (locked 6/5):** RTH opens outside the prior day's range. Nothing else is a
gap. TradingStats' ~60% fill rate uses a different definition and is NEVER quoted for a
Blueprint gap trade.

## Tier 3 — Entry triggers

Governing rule (9/2): something must happen at the level before entry, but that event can be
order-flow based (absorption, trapped traders, delta failing on approach,
indecision-then-hammer) and does not have to be a bar close.

**PAUSE N GO** — primary trigger, best expectancy of the tracked triggers.
"price shows absorption in the footprint — or — blue orders holding it up (long) or pink
holding it down (short) — before continuing in the direction toward the next target."
GAP: Pause N Go has no tested definition of its own, and the early vs mid/late session split
page was never written. It is the weakest link in an otherwise clean chain.

**RESTING LIMIT AT LEVEL (after displacement)** — second best expectancy. Also the direct fix
for the Best Available Fill problem.

**9 EMA PULLBACK ENTRY** — candidate, n=1. Continuation-only. An EMA reclaim against the move
is not this trigger. Wick entry -0.8R vs waiting for the close +3.4R at the same location.

**AGGRESSION FAILS AT THE LEVEL** — ONE trigger with four required sub-forms. Consolidates
what were four separate tags (Failing Delta, Big Orders, Delta Divergence on Approach,
two-bar exhaustion) that were splitting a small sample four ways.
The **sub-form MUST be recorded on every trade** so it stays possible to learn which one
works. They are not the same event: Big Orders is passive absorption, Failing Delta is
aggression drying up, two-bar exhaustion is a timing pattern.
Carry Big Orders' n=2 into the combined count.
**OPEN QUESTION, must be settled before this publishes:** is "aggression fails at the level"
a standalone trigger, or confirmation that still requires a 1-min trigger?

**LEVEL RECLAIM (5-min close)** — weakest tracked trigger. Keep tagging it so the comparison
stays honest. It has no TurtleMetrics slot, which is part of the No Setup over-count problem.

## Trade construction and risk

**Sequence: level -> stop -> risk -> size -> entry.**
The structural target is picked first. The stop goes behind the far edge of the structure
being traded against. A wider stop reduces size, never risk. If the math doesn't clear 2:1,
no trade. **2R is a filter, not the default target.**

Base R = $200. Daily max loss $400 = 2R, enforced at the platform.
Position size = R / (stop ticks x $0.50). MNQ: 1 tick = 0.25 pts = $0.50; 1 pt = $2.00.

Stop floor: **78 ticks (19.50 pts)**. UNDER REVIEW for the opening block.
R4 (CANDIDATE): median random-entry adverse move is 208 ticks at 9:30–9:45, 124 at
10:30–11:00, 79 after 11:00. 79% of 9:30–9:45 entries see >= 78 ticks against within 15 min.
At $200 R a 208-tick stop is $104/contract, so opening-block trades built properly run
1 contract, not 5.

Targets are set before entry and untouchable. The one legitimate scale is planned: half off
at 2R, runner to the structural level. **Auto breakeven is OFF.**
Widening a stop = Broke Rule. Tightening mid-flight = Too Early, except tightening to a
thesis-invalidation level set at entry.

## Hard rules

- **1-min chart:** no execution outside the trading window. Window 6am–4pm ET, focus
  9:30–11:00.
- **Kill switch:** $400, platform enforced. Note it once, close the platform, step away.
- **Post-Loss Reset:** feet flat, one long exhale, 3–4 rounds box breathing, then aloud —
  What's the chart telling me? Are any setups forming? What would need to happen for a setup
  to present itself? Can't answer clearly = not ready.
- **News Tier One** (CPI, PPI, PCE, NFP, FOMC + presser, Retail Sales): flat 5 min before, no
  entries until 2 min after.
- **News Tier Two** (home sales, EIA, sentiment, JOLTS, Fedspeak): stay aware, manage
  through, never exit a working position for it.
- **Manual flatten — only four reasons:** stop hit, tier-one event within 5 min, thesis
  broken on a candle close, session over.

## Killed by data — do NOT teach these as edges

- 15-min ORB follow-through (R8: 51% vs null 48%)
- Prior-close gap fill as the default target (46–47% coin flip)
- Gap N Go after an untouched gap (R11: 0.00R over 57 sessions)
- Gap-fill fade with a first-bar stop (R10: -0.15R)
- Dalton open types as edge
- Desk day-type calls as an input (R16: 13 hits of 54 graded vs 12.0 expected)
- Overnight inventory correction, compression -> expansion, cross-market leads
- Second Chance Entry as a standalone setup
- Auto-trail (removed 6/4)
- The 6-week break cycle (retired 8/17–8/23)

## Base rates (targets only — never triggers, never direction)

Source: TradingStats, NQ, 3,163 sessions. Always cite as TradingStats data with sample size.
- Prior VPOC touch: 82.4% on an in-value open vs 35.0% on a gap up
- Once a value edge is touched on an in-value open, VPOC follows 87.4% from either side
- IB breaks in 95%+ of sessions. Containment is not a plan
- Gap up: PD High 64.1%, prior close 46.7%. Gap down: PD Low 67.0%, prior close 45.9%

## Execution findings (about Shane, not the market — keep separate from the market read)

The read is usually right; the leak is in execution. Three forms, each narrower:
1. **Re-entry loop after the first win.** Addressed by the platform kill switch and reset
   protocol.
2. **Trading without a trigger or a location.** Trigger Without Location n=4: all mid-range,
   nothing under the stop, all in the first 20 minutes.
3. **Best Available Fill** — the current primary gap. Direction right, level right, position
   inside the level decides the outcome. 9/9 replay: filling at 29141 instead of resting at
   ON Low 29083 turned an ~80-tick stop into 265 ticks and a 6.6R trade into 2R.
   Shane's own line: *"when the stop starts looking impossible, the entry drifted."*

## Content guardrails for the site

- Use R. Never dollar income claims.
- Every directional statement follows Blueprint framing: conditional if/then with a named
  level, a named behavior, an invalidation, and a conviction level.
- Source books (Bellafiore, Dalton, Trader Dale) are taught as concepts in Shane's words.
  Never reproduce their text or figures.
- Every setup and trigger page carries its status badge and its n.
- No beginner/advanced labels anywhere. No "complete beginners", no "no experience required".
- MNQ is where Shane trades, not what the method is. Framework first.
- Grades are A+/A/B/C everywhere — site, journal, book.
- Any backtest or hypothetical result shown on the site carries CFTC Rule 4.41
  hypothetical-performance language.
