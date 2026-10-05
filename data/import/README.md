# TurtleMetrics history: archive, not imported

This folder holds the trade history exported from TurtleMetrics on 2026-10-04, and what the
importer made of it. **None of it is in the journal.** It is kept as an archive.

## What is here

| File | What it is |
| --- | --- |
| `turtle-metrics-export-2026-10-04.csv` | The source export. 156 trades, 2026-08-11 to 2026-10-02, all MNQ. |
| `imported-trades.json` | What `npm run import:tm` produced: each CSV row mapped to a journal record, with its review flags. All 156 are under `rejected`; none passed `validate()`. |
| `import-report.txt` | The importer's report: row counts, rejection reasons, live/sim split, coverage. |
| `no-setup-audit.json` | The input to TAXONOMY OPEN #5 (the No Setup re-tag audit): 49 rows, each with its raw CSV row. See below. |

Regenerate any of the three outputs with `npm run import:tm`. The script
(`scripts/import-turtlemetrics.mjs`) follows the TAXONOMY section 9 legacy mapping and never writes to
the journal store.

## Why it was not imported

The journal schema requires `setup`, `location` and `grade` on every record. The schema was not
relaxed to fit this data, so no row passes. Filling those fields in would mean inventing them, and the
data does not support that:

- **No stops on live trades.** All 46 rows with a stop loss are sim. None of the 23 live trades has
  one, so none has a realized R, and a trade with no planned risk has no R-multiple to analyse.
- **No setup tags on live trades.** All 50 rows with a setup tag are sim. None of the 23 live trades
  has one.
- **85% sim.** 133 of 156 trades are sim (two sim accounts); the other 23 come from one live account. TAXONOMY 6.4 says sim is counted
  and reported separately and never measures edge, because sim fills limits on touch and fill
  placement is the known skill gap.

Also missing from the CSV: location, trigger, grade, execution mark and size. Fees are 0.00 on every
row, which probably means they were not recorded.

## Gate 2 counting starts fresh

Nothing in this archive counts toward Gate 2 (TAXONOMY 6.2: at least 30 live trades, across at least
20 distinct sessions, expectancy at least +0.3R after commissions). Gate 2 counts begin at zero with the
first trade logged in the journal, live, with a stop, a setup, a location and a grade assigned at
entry.

## The No Setup audit (OPEN #5)

`no-setup-audit.json` holds only the rows needed to re-tag the No Setup bucket:

- every row whose Setup is "No Set Up" (29), plus
- any row whose Tags name an entry method (13) or hold a grade letter A+, A, B or C (35).

Together that is 49 rows, all sim. Each carries its raw CSV row and notes which of the three reasons
selected it. Re-tag them with the TAXONOMY section 9 mapping and publish what remains; until then no
No Setup count is publishable. Because every audit row is sim, the audit informs the taxonomy; it
cannot produce a live count.
