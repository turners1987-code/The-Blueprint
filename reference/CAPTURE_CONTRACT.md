# The Blueprint — NT8 Capture Contract

Version 1.9 · 2026-10-06
Status: SPEC. This is the single written document the NinjaTrader 8 capture addon builds against;
every accepted change is rolled into it, not carried as an amendment. This repo holds the
contract, not the addon; no addon code lives here.

**Journal schema v5.** The schema has `account`, `account_type` and `target_2`, each nullable and
required as a key. `additionalProperties: false` still applies. The addon writes `account` and
`account_type` on every record, and `target_2` on rich-tier records when the plan uses two
targets (null otherwise). `target_price` stays the first target, the one R:R is measured against.

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
  own): the session date plus a 4–12 character suffix of `[0-9a-z]`. Ids sort by session date;
  the suffix only separates same-day trades.
  - **Rich tier:** `<session_date>-<decision_id>`, e.g. `2026-10-06-k3f9a2qm7x4d`. The
    `decision_id` (section 4) is 12 base36 characters, so it fits the suffix rule and makes the
    record id traceable to its decision with no lookup.
  - **Zero-touch:** `<session_date>-<random suffix>`, 8 characters of base36 from a CSPRNG,
    regenerated on a collision with an existing file name. There is no `decision_id` to use.
- **One trade = flat-to-flat on one account and one instrument.** A trade opens when the
  position leaves flat and closes when it returns to flat; scale-ins and partial exits inside
  that span belong to the one trade. A different account or a different instrument is a
  different trade.
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
  not a trade record — the JSONL intermediate, audit sidecars, local
  logs — lives under `nt8/`.
- **Life cycle:** the file appears when the position opens (with `r_multiple`, `exit_price`, `exit_time`,
  `execution_mark` null) and is updated in place when the position closes and again when
  reconciliation (section 5) completes. One decision, one id, one file, from open to final.

## 2. Record semantics the addon must get right

- **`taxonomy_version`** is stamped at write time with the version in force (TAXONOMY 0). The
  addon ships a constant, synced from `js/journal/schema.js` at release. A record stamped newer
  than the journal supports is rejected outright; an addon release that bumps TAXONOMY ships in
  step with the journal.
- **`environment`** is derived from the **connection**, never defaulted blank: a Market Replay
  connection → `replay`, Sim101 → `sim`, live connections → `live`. Detection must come from
  the connection, not the account name — **Market Replay fills land in Sim101**, so
  account-name detection would mislabel every replay trade as `sim`. Under the settled account
  model (section 4) the record account is Sim101 on a live data feed, so every record the addon
  writes is `sim` (or `replay` on a replay connection); none is `live`.
- **`entry_time` / `exit_time`** are ISO 8601 **with an explicit UTC offset** (machine-local plus
  offset, or converted to `Z`). A naive local timestamp is invalid and will be rejected.
- **`session_date`** is the session the trade belongs to, not the calendar date of the fill, and
  it is **derived from the instrument's Trading Hours template** — its session boundaries and
  trading-day convention (Q6, answered) — never from a hardcoded 18:00 ET rule. A fill in the
  overnight portion of the template's session carries that session's date.
- **`instrument`** is the root symbol only, uppercase: `MNQ`, `MES`, `MGC`, `MCL`. No expiry
  suffix. The analysis layer prices risk by root symbol; `MNQ 12-26` reads as an unknown
  instrument and the trade goes `unpriced`.
- **Prices are in points** (for MNQ one tick = 0.25 points), `size` is whole contracts ≥ 1 —
  the **leader account's** size (section 4).
- **`r_multiple` is gross of commissions.** The analysis layer computes net expectancy itself
  from the `commissions` field; the addon never nets fees into R.
  `R = (average exit price − actual_fill) × dir / |actual_fill − stop_price|`, where `dir` is
  +1 long / −1 short, across all partial exits.
- **`stop_price` is the draft stop that sizing used, frozen at submission.** It is never updated
  by a breakeven or drag move. The order-entry tool places two stops staggered 1 tick apart; the
  draft stop is the reference and the one recorded, so R stays the risk the trade was sized on.
- **`mae_ticks` / `mfe_ticks`** are positive magnitudes regardless of direction, measured from
  `actual_fill`, in instrument ticks. Their only source is reconciliation (section 5) — never
  NinjaTrader's per-trade MAE/MFE.
- **`commissions`** is US dollars for the **entire trade** — all contracts, both sides — summed
  from `Execution.Commission` per execution (Q7, answered). That property requires a
  **Commission template configured on the account**; without one it comes back empty and
  `commissions` stays null (and Gate 2 rows will not declare themselves met, by design).
- **`grade`** (rich tier only) follows the 5.1 rubric, is assigned before the outcome is known,
  and **comes from which BP Draft tool was used** (Q9, answered) — the tool carries its rubric
  context at submission. The A+ fill tolerance (within 2 ticks of `intended_price`) resolves
  when the fill returns — still pre-outcome.
- **`execution_mark`** is journal-owned (7.1): the addon writes it null and never sets it. A
  mechanical exit (stop, target, planned scale, session end) is a signal the journal can use,
  but the trader makes the call.

## 3. Two capture tiers

| | Rich tier | Zero-touch tier |
| --- | --- | --- |
| Source | Trades placed through **Shane's own order-entry tool**, which knows the plan at submission | Any other fill: Chart Trader, hotkeys, any third-party tool |
| Tier test | The **opening execution** carries a Cockpit `decision_id` | The opening execution carries none |
| `setup`, `location`, `trigger`, `confirmation` | as submitted | **null** |
| `grade` | as submitted (5.1) | **null** |
| `intended_price`, `stop_price`, `target_price` | as submitted | **null** |
| `target_2` | as submitted when the plan uses two targets, else **null** | **null** |
| `account`, `account_type` | the configured record account (4.1): `Sim101`, `sim` | the configured record account (4.1): `Sim101`, `sim` |
| `instrument`, `direction`, `session_date`, `entry_time`, `environment`, `size`, `actual_fill` | captured | captured |
| `exit_time`, `exit_price`, `mae_ticks`, `mfe_ticks`, `time_in_trade_seconds`, `commissions` | post-exit | post-exit |
| `r_multiple` | computed (stop known) | **null** — no stop, no R; the journal computes it once the trader supplies the stop (7.1) |
| `tags` | as submitted | carries the reserved tag `zero-touch` |

- **Tier is set once, by the opening execution** (trade boundary, section 1). A Cockpit
  `decision_id` on that execution means rich tier, for the life of the trade. This covers a
  Cockpit entry closed via Chart Trader: the closing fills carry no `decision_id`, and the trade
  stays rich.
- A zero-touch record is **written with the plan fields null and flagged for completion in the
  journal UI** (the `zero-touch` tag plus null plan fields is the flag; surfacing them in the UI
  is journal-side work, referenced here so the contract is complete).
- **Schema v3 (shipped; current schema is v5).** `setup`, `location` and `grade` are nullable in
  `journal-schema.json` v3 (Q2), so a zero-touch record validates and the journal's folder scan
  picks it up. The keys are still always present (7.2), and `validate()` still requires all
  three to be non-null once a **live** trade is **closed** (`if`/`then` in the schema, 7.5): an unclassified zero-touch capture is
  not an error, an unclassified closed live trade is. The addon's own self-validation never
  blocks its writes on that rule (7.5). The addon writes zero-touch records to the
  top level like any other; `nt8/pending/` is retired. A journal older than schema v3 skips
  such a file silently, so the journal must be upgraded before the addon's zero-touch tier is
  enabled. The analysis layer already buckets null `setup`/`location`/`grade` as `unknown`
  cohorts.

## 4. Account model and copier dedup

### 4.1 Account model (settled)

- **The record account is Sim101, configured by name** (Q4), running on a **live data feed and
  live market** as the copier leader.
- **Every record is `environment: sim`.** No records come from live accounts.
- **No follower records and no slippage sidecar for now.** The follower-audit mechanism below
  (4.2) is deferred, not built.
- **Gate 2 stays live-only and therefore reads zero.** Sim statistics are computed and displayed
  **separately** on the analysis page, clearly labelled, and **never pooled with live**.
- **Door left open, not built now:** execution records from a real account, linked to the Sim101
  decision records by `decision_id`. Nothing in this contract may block it — which is why
  `decision_id` stays on every rich record (the `decision:` tag), and why the trade boundary
  (section 1) is per account.
- **`account` is the configured record account name (`Sim101`) and `account_type` is `sim`, on
  every record.** The addon writes both at creation, from its configuration, never detected.

### 4.2 Copier dedup

One decision produces fills across multiple accounts. The addon must record **one trade**, not
one per account.

- **The unit of record is the leader account trade.** Exactly one `<id>.json` per decision.
- **`decision_id`** is generated at submission by the order-entry tool — **12 base36 characters**
  (`[0-9a-z]`, lowercase) — and stamped on every order in the decision, such that the copier
  propagates it and every follower execution carries it back (transport: Q3; copier propagation
  is unverified).
- **Do NOT match by time and price.** Two fills at the same price in the same second are two
  trades until a shared `decision_id` says otherwise; time-and-price matching is how copied
  trades get silently merged with genuinely distinct ones. This is a hard rule, not a default.
- **Follower fills are a slippage audit, never separate trades.** *Deferred (4.1): not built
  now.* When built, each appends to `nt8/audit/<decision_id>.json`: account, fill price, size,
  slippage versus the leader fill in ticks, timestamps. Analysis never reads these files; they
  exist to answer "what did copying this decision cost across accounts." Until then follower
  fills are ignored, never recorded as trades.
- The leader record carries the link in-band as the tag `decision:<decision_id>` (tags are free-form
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
- When the position goes flat, the addon runs reconciliation **immediately** — the tick request
  returns data only about 2 seconds behind real time (Q1), so there is no need to wait. It uses a
  **tick `BarsRequest` for the full trading day** of the trade (the session from the
  instrument's Trading Hours template), then **clamps to `[entry_time, exit_time]` in code** —
  the request is never trusted to return only the window. It re-derives MAE/MFE from
  `actual_fill` (direction-aware, positive magnitudes, instrument ticks) and **overwrites** the
  record's values with the post-hoc result. Requesting the whole day absorbs clock skew between
  the execution engine and the tick stream; the clamp in code is what defines the window.
- **One tick request per instrument per session — REQUIRED, not an optimisation.** The
  full-day tick data is requested once per instrument (contract traded) per session, cached, and
  **shared across all of that session's trades**; it is not re-requested per trade. A full MNQ
  day returns **1.3–3.1 million ticks**, so a request per trade is not workable.
- **MergePolicy (REQUIRED).** The reconciliation `BarsRequest` **must set
  `MergePolicy = DoNotMerge` and request the exact contract traded.** Reason: the global setting
  is *Merge back adjusted*, which shifts pre-roll prices. Run through that setting, a pre-roll
  trade's ticks no longer sit at the prices the trade filled at, so MAE/MFE (measured from
  `actual_fill`) would be silently corrupted — **no error is raised**. Never rely on the global
  setting.
- **Disposal.** The `BarsRequest` is disposed on every path — success, empty result, timeout,
  exception. A leaked request holds a data subscription open.
- **Contract selection.** The request is made against the specific contract the trade filled on
  (the `instrument` root plus the expiry actually traded), **including across a roll** — a trade
  entered on the expiring contract is reconciled on that contract's ticks, not the front month's
  at reconciliation time. Pre-roll trades therefore pick the pre-roll contract; the root-only
  `instrument` field is for the record, not for the request. The cache above is keyed on that
  contract, so a roll inside a session yields one cached request per contract.
- The live-tracked pair and its delta versus the post-hoc pair are written to
  `nt8/audit/<id>.json`. A disagreement beyond 2 ticks is recorded there as a data-quality flag.
  **The post-hoc values win every time.**
- Why: the live values freeze whatever definition the code had at trade time. Deriving from a
  bounded tick window means the definition can change later and history can be re-derived
  without losing data.
- If tick data is not available for the window (connection depth — Q1: ticks resolve to roughly
  10–12 months back), `mae_ticks`/`mfe_ticks` stay **null**, the gap is noted in the audit sidecar, and NinjaTrader's per-trade values are
  still not substituted (5.1).
- The update replaces the same `<id>.json` atomically. One record, refined in place.

## 6. What NT8 must NOT do

1. **No calls to external servers or third parties.** No telemetry, no update checks of its own,
   no "phoning home." The addon talks to the local filesystem and to NinjaTrader itself.
   **Exempt:** NinjaTrader's own data requests over its existing connections — the section 5.2
   `BarsRequest` reconciliation is such a request and is permitted. The addon opens no
   connection of its own.
2. **No database.** No embedded DB engine, no sqlite file, no external process. Files only.
3. **No writing outside the configured folder.** The addon's only file output is the configured
   folder (including its `nt8/` subfolder). Its own settings go through NT8's native settings
   mechanisms, which is NT8 persisting configuration, not the addon writing files.
4. **No blocking the order path.** Capture subscribes to execution events, queues what it sees,
   and writes from a background thread. A capture failure is logged under `nt8/` and never
   thrown into an order or execution handler. A capture problem must never delay, reject, or
   alter an order — the journal can tolerate a missing trade; the account cannot tolerate a
   mangled one.
5. **The configured folder must be local — never OneDrive, Google Drive, or any synced or
   network location.** Sync clients lock, delay, and conflict-copy files, which breaks atomic
   replace (section 2) and can hand the journal a half-synced record. The addon refuses to start
   capture if the folder resolves into a known sync root or a network path.

---

## 7. Two writers, one file

The addon and the journal both write `<id>.json`. The addon writes it at open, at close and again
after reconciliation; the journal writes it when the trader completes a zero-touch record or edits
anything. Without a rule, a reconciliation write landing after a user edit silently erases the
edit. The rule is **field-level ownership**.

### 7.1 Field ownership

| Owner | Fields |
| --- | --- |
| **Addon** — anything the platform observes | `id`, `taxonomy_version`, `environment`, `account`, `account_type`, `instrument`, `direction`, `session_date`, `entry_time`, `exit_time`, `actual_fill`, `exit_price`, `r_multiple`, `mae_ticks`, `mfe_ticks`, `time_in_trade_seconds`, `commissions` |
| **Journal** — anything the trader decides | `setup`, `location`, `trigger`, `confirmation`, `grade`, `execution_mark`, `tags` (and `notes`, if the schema ever gains it — see below) |
| **Shared, addon-first** | `intended_price`, `stop_price`, `target_price`, `target_2`, `size` |

**The rule.** Each writer **reads the current file, changes only the fields it owns, and writes
the whole record back**. Neither clears, nulls, reformats or "refreshes" a field it does not own.
The write is still atomic (section 1).

- **Creation write.** The record's first write may populate journal-owned fields, but only with
  what the trader submitted in the BP Draft tool (rich tier, section 3). From then on those
  fields are the journal's: every later addon write carries them through untouched. A zero-touch
  record is created with them null. `execution_mark` is never written by the addon — the trader
  judges the exit in the journal.
- **Shared fields.** The addon writes `intended_price`, `stop_price`, `target_price`, `target_2` and
  `size` when the rich tier knows them at submission (`target_2` stays null when the plan has one target). For zero-touch records the journal fills them. The
  addon **never overwrites a non-null value it did not write**: it records in
  `nt8/audit/<id>.json` which shared fields it wrote and with what value, and later touches a
  shared field only if the file still holds exactly that value (or null).
- **Reserved tags.** `tags` is journal-owned with one exception: the addon sets the reserved tags
  (7.4) at creation. Neither writer ever removes them.
- **`exit_price`** is the size-weighted average exit price, observed by the platform, so the addon
  owns it; null while the trade is open. On a record the journal itself creates, the trader
  enters it. Schema v4 added the field, so no sidecar is needed to carry it.
- **`r_multiple`** is derived, and ownership follows who can compute it:
  - **Addon-owned** when, at close, the addon has both a `stop_price` (non-null in the file) and
    an `exit_price`. It computes the value and writes `"r_multiple_source": "addon"` to
    `nt8/audit/<id>.json`.
  - **Journal-computed otherwise.** When `r_multiple` is null, `exit_time` is set and both
    `stop_price` and `exit_price` are non-null — the zero-touch case, once the trader supplies
    the stop — the journal derives it. The journal writes nothing under `nt8/`; a non-null
    `r_multiple` with no `"r_multiple_source": "addon"` marker in the sidecar is, by
    definition, not the addon's.
  - **Formula** (both writers), read from the record: direction-signed
    `(exit_price − actual_fill)` divided by `|actual_fill − stop_price|`, rounded per 7.3.
  - **Later writes.** The addon re-derives `r_multiple` only when its own marker is present; it
    leaves any other non-null value alone. A null stays null until one of the two can compute it.
- **Lost-update guard.** A read-modify-write is not atomic across two processes. Before replacing
  the file, a writer checks that the file's last-modified time is unchanged since its read; if it
  changed, the writer re-reads and redoes the merge.
- **Not in the schema:** `notes`. `journal-schema.json` has no such field and
  `additionalProperties: false` rejects it. It is listed as journal-owned so that adding it later
  needs no ownership decision, but until the schema gains it, neither writer may emit it.

### 7.2 Null representation

Every nullable schema field is **present with the value `null`, never absent**, in every record
either writer emits. This applies to both writers. Required fields are never null in a record
that is meant to validate (the zero-touch exception is section 3).

### 7.3 Numeric formatting

Both writers round identically, **half away from zero**:

| Field | Format |
| --- | --- |
| `intended_price`, `actual_fill`, `stop_price`, `target_price`, `exit_price` | rounded to the instrument's **tick size**, written with the tick's decimal places (MNQ, MES: 0.25 → 2 places; MGC: 0.10 → 1; MCL: 0.01 → 2) |
| `r_multiple` | 2 decimal places |
| `commissions` | 2 decimal places (US dollars) |
| `time_in_trade_seconds` | integer |

### 7.4 Tag constraints

- At most **64 characters** per tag.
- **Lowercase alphanumeric plus hyphen and colon** only: `^[0-9a-z:-]{1,64}$`.
- **Reserved:** `zero-touch` (the exact tag) and the prefix `decision:` (section 4). Only the addon
  creates them; neither writer removes them (7.1).
- These are contract rules for tags a writer adds, and are stricter than the schema, which
  accepts any non-empty string. Tags already in a file — including `legacy_` tags, which contain
  an underscore — are preserved exactly as found, never rewritten to fit.

### 7.5 Validation decision

The addon **hand-rolls field checks generated from `data/journal-schema.json` at release time**,
with the golden sample records (`reference/golden-samples/`) as the regression test: every
fixture must produce the result recorded for it. **No external JSON Schema assembly inside
NinjaTrader.** The schema stays the contract (precedence, top of this file); the generated checks
are its in-addon enforcement.

**The generated checks must include the top-level `if`/`then` rule**: when `environment` is
`"live"` and `exit_time` is a string (a closed live trade), `setup`, `location` and `grade`
must be non-null. A generator that reads only `properties` and `required` would accept an
unclassified closed live trade, which the journal rejects. `rich-tier.json` and
`post-reconciliation.json` are classified; the regression set must also include a closed live
record with a null classification field and expect it to fail.

**Self-validation never blocks the addon's own writes.** Every zero-touch live trade is
unclassified at close, so the generated `if`/`then` check fails on the addon's own close write.
The addon therefore records an `if`/`then` failure as **"pending classification"** (in the
audit sidecar) and **writes anyway**. The regression fixture is unchanged: the closed live
record with a null classification field still expects `validate()` = **FAIL**. The failure is
real; it just is not grounds to withhold the write. (Under the account model, 4.1, no record is
`live` today, so the rule is dormant but stays in the generated checks.)

### 7.6 TAXONOMY_VERSION

The current literal is **`"1.4"`** (`TAXONOMY_VERSION` in `js/journal/schema.js`). A bump
mid-session does **not** rewrite existing records: each record keeps the version it was stamped
with, and neither writer restamps `taxonomy_version` on a later write. Only newly created
records take the new literal.

### 7.7 Golden samples

`reference/golden-samples/` holds the addon's regression fixtures:

| File | State |
| --- | --- |
| `rich-tier.json` | Rich-tier record as written at open: plan fields populated, outcome fields null |
| `zero-touch.json` | Zero-touch record at open: classification and plan null, tagged `zero-touch`. **Passes `validate()`** under journal schema v3, because it is unclassified but not a closed live trade (section 3, Q2) |
| `post-reconciliation.json` | The rich-tier trade after close and reconciliation: every field final, including `exit_price` |

## 8. Open questions for the NT8 project

Each one can change a section above. Answered questions are recorded in 8.2.

### 8.1 Open

5. **PWH/PWL session convention** — RTH-only today while every other level is ETH (TAXONOMY
   OPEN #6, already owned by the NT8 project). Location capture depends on the decision.

### 8.2 Answered

1. **Tick history depth on Shane's data connection.** *Answered; measured 2026-10-06 with a
   `TickDepthProbe` on the NinjaTrader provider.*
   - **Latency:** a tick `BarsRequest` returns data about **2 seconds behind real time**, so
     reconciliation can run immediately after the position goes flat (section 5.2).
   - **Depth:** ticks were returned at **300 days back and none at 365**. Re-derivation therefore
     reaches roughly **10–12 months**; older records cannot have MAE/MFE re-derived.
   - **Consequence:** footprint-based items cannot meet Gate 1's per-year requirement without
     **purchased tick data**. That is a **data block, not a failed test** (TAXONOMY 6.3).
2. **Journal schema v3.** Shipped. `setup`, `location` and `grade` are nullable so zero-touch
   records validate (section 3); `validate()` still requires them non-null on a closed live
   trade. Existing records need no migration. The addon's zero-touch tier needs a journal at
   schema v3 or later.
3. **`decision_id` transport through the copier.** *Partly answered; propagation is an
   unverified assumption.*
   - **Carrier (answered):** `Execution.Name` is documented as the order's name, settable at
     submission; `Account.CreateOrder` takes a name parameter. The addon stamps `decision_id`
     there.
   - **Id length (answered):** the name field may not tolerate a long id, so `decision_id` is 12
     base36 characters, generated at submission.
   - **Propagation (UNVERIFIED):** whether Replikanto carries the name through to follower fills
     is unknown and cannot be settled from documentation. It needs one Sim trade with a tagged
     name, then reading `Execution.Name` on a follower fill. Until that test is run, copier
     dedup by `decision_id` (section 4) rests on an assumption.
4. **Leader account identification.** **Configured explicitly by name (Sim101, section 4.1). Never detected.** A
   decision whose leader fill never appears writes **no top-level record at all** — follower
   fills are audit material by definition — and the orphan is noted in the audit sidecar.
6. **`session_date` convention.** Derived from the instrument's Trading Hours template — its
   session boundaries and trading-day convention — never from a hardcoded rule. A fill in the
   overnight portion of the template's session carries that session's date (section 2).
7. **Commission data availability.** Summed from `Execution.Commission` per execution. It
   requires a Commission template configured on the account; without one it comes back empty,
   `commissions` stays null, and Gate 2 rows will not declare themselves met (by design,
   TAXONOMY 6.2) (section 2).
8. **Market Replay captures.** `BarsRequest` in Playback yields bars only up to the current
   playback position, so reconciliation inside replay works only for a trade already behind the
   slider. Replay fills **are captured**, marked `environment: replay`, and **excluded from
   expectancy** — they are practice reps, not evidence.
9. **Grade capture.** The grade comes from which BP Draft tool was used; the tool carries its
   rubric context at submission (section 2).

---

## 9. Change log

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-05 | Initial. File layout and id format; record semantics; rich and zero-touch tiers; copier dedup by `decision_id`; post-exit MAE/MFE reconciliation with NinjaTrader's per-trade values ruled out; hard prohibitions; nine open questions. |
| 1.1 | 2026-10-05 | Corrections from NT8 review: `environment` from the connection (replay fills land in Sim101); `session_date` from the Trading Hours template; commissions via `Execution.Commission`; grade from the BP Draft tool; 5.2 full-trading-day `BarsRequest` clamped in code, with disposal and pre-roll contract selection; fifth prohibition (local folder only). |
| 1.2 | 2026-10-05 | Section 7 split into Open (Q1, Q2, Q5) and Answered (Q3, Q4, Q6, Q7, Q8, Q9). Q1 marked as gating 5.2. Q3 carrier answered, copier propagation recorded as unverified. |
| 1.3 | 2026-10-05 | `decision_id` is 12 base36 characters throughout (section 4, Q3); tag format `decision:<decision_id>`. |
| 1.4 | 2026-10-05 | New section 7: field-level ownership between addon and journal writers, null representation, numeric formatting, tag constraints, validation decision, TAXONOMY_VERSION rule, golden samples. Open questions renumbered to 8, change log to 9. `execution_mark` is no longer written by the addon. |
| 1.5 | 2026-10-05 | `r_multiple` ownership follows who can compute it, with the source recorded in the audit sidecar (7.1). Journal schema v3 shipped: `setup`/`location`/`grade` nullable, required non-null on a closed live trade; `nt8/pending/` retired; Q2 answered; `zero-touch.json` now passes `validate()`. |
| 1.6 | 2026-10-05 | Schema v4: `exit_price` (size-weighted average exit; nullable, required as a key). `r_multiple` is derived from `exit_price` in the record, not the sidecar; the journal-writes-under-`nt8/` exception is removed. The closed-live classification rule is an `if`/`then` in the schema and the addon's generated checks must carry it. Golden samples carry `exit_price`. |
| 1.7 | 2026-10-06 | Rolled up into one document. Self-validation never blocks the addon's writes; failures recorded as "pending classification" (7.5). No-network rule reworded to external servers and third parties, exempting NinjaTrader's own data requests (6.1). Trade boundary: flat-to-flat per account and instrument; tier set by the opening execution (1, 3). `stop_price` is the frozen draft stop (2). One cached tick request per instrument per session, required (5.2). Rich-tier id = `<session_date>-<decision_id>` (1). New 5.2 rule: `MergePolicy = DoNotMerge` on the exact contract. Q1 answered (2 s latency; ticks at 300 days, none at 365). Account model settled: Sim101, all records `sim`, no follower records, Gate 2 live-only, sim shown separately (4.1). Pending schema bump (`account`, `account_type`, `target_2`), version TBC. |
| 1.8 | 2026-10-06 | Journal schema v5 shipped: `account` (free text), `account_type` (`cash`, `apex`, `lucid`, `sim`) and `target_2`, all nullable and required as keys. The addon still writes none of them. Golden samples carry the three keys. |
| 1.9 | 2026-10-06 | Corrects 1.8, which said the addon writes none of the schema v5 fields. The addon writes `account` (the configured record account name) and `account_type` on every record: under the settled account model, `Sim101` and `sim`. The rich tier writes `target_2` when the plan uses two targets, else null; zero-touch writes null. `target_price` remains the first target and the one R:R is measured against. "Version TBC" wording removed; schema v5 stated plainly. Ownership table and golden samples updated. |
