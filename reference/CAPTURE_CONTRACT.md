# The Blueprint — NT8 Capture Contract

Version 1.0 · 2026-10-05
Status: SPEC. This is the document the NinjaTrader 8 capture addon builds against. This repo
holds the contract, not the addon; no addon code lives here.

**Division of sources — read this before building anything.**

| File | Role |
| --- | --- |
| `data/journal-schema.json` | **The contract.** Every record the addon writes must validate against it, exactly, with no extra fields. |
| `reference/TAXONOMY.md` | Vocabulary and field semantics (sections 1–5), version stamping (section 0), grade and execution rubrics (5.1, 5.2). |
| `js/journal/schema.js` | The machine-readable enums and `validate()` the journal itself runs; `TAXONOMY_VERSION` lives here. |
| This file | How NT8 produces those records: file layout, capture tiers, copier dedup, post-exit reconciliation, prohibitions. |

**Precedence:** schema → TAXONOMY → this document. Where they disagree, the schema wins and this
document gets fixed. The NT8 project must run `validate()` (or an equivalent JSON Schema 2020-12
check) on every emitted record in its own build.

---

## 1. What the addon writes

- **One JSON file per trade**, written into a **user-configured folder** — the same folder the
  journal (`journal.html`, File System Access backend) is granted. The user points both tools at
  one directory; the file format is what makes them compatible.
- File name: `<id>.json`, where `id` is the record's own `id` and the stem must equal it exactly.
- **`id` format** (the storage layer assigns ids on `put`, but a file in the folder must carry its
  own): the session date plus a 4–12 character suffix of `[0-9a-z]`, e.g.
  `2026-10-06-k3f9a2qm`. Recommended: 8 characters of base36 from a CSPRNG, regenerated on a
  collision with an existing file name. Ids sort by session date; the suffix only separates
  same-day trades.
- **Shape:** exactly the properties in `journal-schema.json`. `additionalProperties: false` is
  part of the contract — the addon never adds a field. Anything the addon must remember that the
  schema has no field for goes under `nt8/` (below), never into the record.
- **Writes are atomic:** write to a temporary name, then replace. The journal must never observe
  a half-written record.
- **Append-only JSONL as an intermediate is acceptable** — a crash between fill and flush must
  not lose a trade. The steady state of the configured folder is still **one file per trade at
  the top level**. The JSONL lives under `nt8/`, never at the top level.
- **Subfolder `nt8/` is the addon's space.** The journal scans only top-level `*.json` files and
  skips anything that is not a valid record; subfolders are invisible to it. Everything that is
  not a trade record — the JSONL intermediate, audit sidecars, pending zero-touch records, local
  logs — lives under `nt8/`.
- **Life cycle:** the file appears when the position opens (with `r_multiple`, `exit_time`,
  `execution_mark` null) and is updated in place when the position closes and again when
  reconciliation (section 5) completes. One decision, one id, one file, from open to final.

## 2. Record semantics the addon must get right

- **`taxonomy_version`** is stamped at write time with the version in force (TAXONOMY 0). The
  addon ships a constant, synced from `js/journal/schema.js` at release. A record stamped newer
  than the journal supports is rejected outright; an addon release that bumps TAXONOMY ships in
  step with the journal.
- **`environment`** is derived from the account, never defaulted blank: Sim101 → `sim`,
  Market Replay → `replay`, everything else → `live`.
- **`entry_time` / `exit_time`** are ISO 8601 **with an explicit UTC offset** (machine-local plus
  offset, or converted to `Z`). A naive local timestamp is invalid and will be rejected.
- **`session_date`** is the RTH session the trade belongs to, not the calendar date of the fill:
  an ETH fill between 18:00 and 24:00 ET belongs to the **next** day's session date (proposed
  convention — Q6).
- **`instrument`** is the root symbol only, uppercase: `MNQ`, `MES`, `MGC`, `MCL`. No expiry
  suffix. The analysis layer prices risk by root symbol; `MNQ 12-26` reads as an unknown
  instrument and the trade goes `unpriced`.
- **Prices are in points** (for MNQ one tick = 0.25 points), `size` is whole contracts ≥ 1 —
  the **leader account's** size (section 4).
- **`r_multiple` is gross of commissions.** The analysis layer computes net expectancy itself
  from the `commissions` field; the addon never nets fees into R.
  `R = (average exit price − actual_fill) × dir / |actual_fill − stop_price|`, where `dir` is
  +1 long / −1 short, across all partial exits.
- **`mae_ticks` / `mfe_ticks`** are positive magnitudes regardless of direction, measured from
  `actual_fill`, in instrument ticks. Their only source is reconciliation (section 5) — never
  NinjaTrader's per-trade MAE/MFE.
- **`commissions`** is US dollars for the **entire trade** — all contracts, both sides — summed
  from per-execution commission data (Q7).
- **`grade`** (rich tier only) follows the 5.1 rubric and is assigned before the outcome is
  known. The A+ fill tolerance (within 2 ticks of `intended_price`) resolves when the fill
  returns — still pre-outcome.
- **`execution_mark`** is written only when the exit was mechanical — stop, target, planned
  scale, or session end (5.2 Pass conditions the platform can see). A manual flatten leaves it
  null for the trader to judge in the journal.

## 3. Two capture tiers

| | Rich tier | Zero-touch tier |
| --- | --- | --- |
| Source | Trades placed through **Shane's own order-entry tool**, which knows the plan at submission | Any other fill: Chart Trader, hotkeys, any third-party tool |
| `setup`, `location`, `trigger`, `confirmation` | as submitted | **null** |
| `grade` | as submitted (5.1) | **null** |
| `intended_price`, `stop_price`, `target_price` | as submitted | **null** |
| `instrument`, `direction`, `session_date`, `entry_time`, `environment`, `size`, `actual_fill` | captured | captured |
| `exit_time`, `mae_ticks`, `mfe_ticks`, `time_in_trade_seconds`, `commissions` | post-exit | post-exit |
| `r_multiple` | computed (stop known) | **null** — no stop, no R; the trader supplies the plan on completion |
| `tags` | as submitted | carries the reserved tag `zero-touch` |

- A zero-touch record is **written with the plan fields null and flagged for completion in the
  journal UI** (the `zero-touch` tag plus null plan fields is the flag; surfacing them in the UI
  is journal-side work, referenced here so the contract is complete).
- **Prerequisite, stated plainly:** `journal-schema.json` v2 requires non-null `setup`,
  `location` and `grade`. Writing them null — as this tier must — requires **journal schema v3**
  making those three nullable for unclassified captures (Q2). Until v3 ships, a zero-touch file
  fails validation and the journal's folder scan **silently skips it**. Sequencing rule: until
  the journal validates null classification, the addon parks zero-touch captures under
  `nt8/pending/` and writes nothing at the top level for them. The analysis layer already
  buckets null `setup`/`location`/`grade` as `unknown` cohorts, so v3 is a schema and validator
  change, not an analysis change.

## 4. Copier dedup

One decision produces fills across multiple accounts. The addon must record **one trade**, not
one per account.

- **The unit of record is the leader account trade.** Exactly one `<id>.json` per decision.
- **`decision_id`** is generated at submission by the order-entry tool — a UUID v4, lowercase —
  and stamped on every order in the decision, such that the copier propagates it and every
  follower execution carries it back (transport: Q3).
- **Do NOT match by time and price.** Two fills at the same price in the same second are two
  trades until a shared `decision_id` says otherwise; time-and-price matching is how copied
  trades get silently merged with genuinely distinct ones. This is a hard rule, not a default.
- **Follower fills are a slippage audit, never separate trades.** Each appends to
  `nt8/audit/<decision_id>.json`: account, fill price, size, slippage versus the leader fill in
  ticks, timestamps. Analysis never reads these files; they exist to answer "what did copying
  this decision cost across accounts."
- The leader record carries the link in-band as the tag `decision:<uuid>` (tags are free-form
  strings the analysis layer never cohorts on), so the pairing survives the loss of a sidecar.

## 5. MAE/MFE: derivation and post-exit reconciliation

### 5.1 NinjaTrader's own per-trade MAE/MFE is unusable here

Stated plainly: **NinjaTrader support has confirmed that where trades have multiple exits, the
MAE and MFE reported for both trades will be those of the last exit.** Shane's half-at-2R
structure means nearly every trade has multiple exits. The platform's per-trade MAE/MFE is
therefore wrong for almost every record this journal needs, and the addon must not read it —
not as a value, not as a fallback, not as a tiebreaker.

### 5.2 Live tracking is the cross-check; the post-hoc pass is authoritative

- While the trade is open, the addon tracks running MAE/MFE from live market data. These values
  are a **cross-check only**.
- When the position goes flat, the addon issues a **tick `BarsRequest` covering entry time minus
  5 minutes through exit time plus 15 minutes**, re-derives MAE/MFE from `actual_fill`
  (direction-aware, positive magnitudes, instrument ticks), and **overwrites** the record's
  values with the post-hoc result. The margins exist to absorb clock skew between the execution
  engine and the tick stream; the computation itself clamps to `[entry_time, exit_time]`.
- The live-tracked pair and its delta versus the post-hoc pair are written to
  `nt8/audit/<id>.json`. A disagreement beyond 2 ticks is recorded there as a data-quality flag.
  **The post-hoc values win every time.**
- Why: the live values freeze whatever definition the code had at trade time. Deriving from a
  bounded tick window means the definition can change later and history can be re-derived
  without losing data.
- If tick data is not available for the window (connection depth — Q1), `mae_ticks`/`mfe_ticks`
  stay **null**, the gap is noted in the audit sidecar, and NinjaTrader's per-trade values are
  still not substituted (5.1).
- The update replaces the same `<id>.json` atomically. One record, refined in place.

## 6. What NT8 must NOT do

1. **No network calls.** None — no telemetry, no update checks of its own, no "phoning home."
   The addon talks to the local filesystem and nothing else.
2. **No database.** No embedded DB engine, no sqlite file, no external process. Files only.
3. **No writing outside the configured folder.** The addon's only file output is the configured
   folder (including its `nt8/` subfolder). Its own settings go through NT8's native settings
   mechanisms, which is NT8 persisting configuration, not the addon writing files.
4. **No blocking the order path.** Capture subscribes to execution events, queues what it sees,
   and writes from a background thread. A capture failure is logged under `nt8/` and never
   thrown into an order or execution handler. A capture problem must never delay, reject, or
   alter an order — the journal can tolerate a missing trade; the account cannot tolerate a
   mangled one.

---

## 7. Open questions for the NT8 project

Listed explicitly; each one can change a section above.

1. **Tick history depth on Shane's data connection.** TAXONOMY 6.3 assumes roughly a year of NT8
   tick history as a general platform limit; the depth that actually resolves on Shane's
   connection, per instrument, is unverified. It bounds how far back reconciliation (5.2) can
   run and whether historical records can be re-derived at all.
2. **Journal schema v3 sequencing.** Making `setup`/`location`/`grade` nullable so zero-touch
   records validate (section 3). The journal side ships first; the addon's zero-touch write
   stays parked in `nt8/pending/` until it does.
3. **`decision_id` transport through the copier.** Which copier product is in use, and does it
   propagate a custom stamp (order tag) from leader to follower orders? If not, what mapping
   API exposes the leader↔follower relationship?
4. **Leader account identification.** Configured account name, or detected? What happens to a
   decision whose leader fill never appears (rejected leader order, filled followers)?
5. **PWH/PWL session convention** — RTH-only today while every other level is ETH (TAXONOMY
   OPEN #6, already owned by the NT8 project). Location capture depends on the decision.
6. **`session_date` convention confirmation.** The next-session-date rule for ETH fills between
   18:00 and 24:00 ET (section 2) is proposed, not ratified.
7. **Commission data availability.** Is per-execution commission exposed on Shane's broker
   connection in a way the addon can sum? If not, `commissions` stays null and Gate 2 rows will
   not declare themselves met (by design, TAXONOMY 6.2).
8. **Market Replay captures.** The schema has an `environment: replay` value; decide whether
   the addon captures replay fills at all, given the 90-day replay window.
9. **Grade capture UX in the order-entry tool.** The 5.1 rubric's four checks: prompted,
   computed, or both? "Stop behind structure" is a judgment — who holds it, the tool or the
   trader?

---

## 8. Change log

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-05 | Initial. File layout and id format; record semantics; rich and zero-touch tiers; copier dedup by `decision_id`; post-exit MAE/MFE reconciliation with NinjaTrader's per-trade values ruled out; hard prohibitions; nine open questions. |
