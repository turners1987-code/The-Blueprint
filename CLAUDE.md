# CLAUDE.md

Static site (no framework). Node 22. Run `npm test` before every PR.

## Source of truth

Read these before writing or editing anything. They override this file.

- `reference/BLUEPRINT_DOC.md` — the product, architecture, build order, content rules (section 7)
- `reference/DECISIONS.md` — decisions already made; do not re-litigate
- `reference/MODULE_STANDARD.md` — how a module is built and checked
- `reference/TradingStats_Source_of_Truth.txt` — the only source for statistics

## Content rules (BLUEPRINT_DOC section 7, short form)

- No beginner/advanced labels anywhere.
- No track-record, results or income claims. Use R, never dollars.
- No validation status. Never say a setup, trigger or rule is validated,
  candidate, untested, killed, proven or unproven.
- Reader-is-the-trader voice: second person. No author voice
  ("I", "my record", "the author", "one trader's").
- Every statistic carries its n.
- No statistic from outside `reference/TradingStats_Source_of_Truth.txt`.
- Any backtest or hypothetical result carries CFTC Rule 4.41 language.
- Grades are A+ / A / B / C.

## Working rules

- One task per branch and PR.
- Tests green before opening a PR: `npm test` (six checks, all must pass).
- Every report opens with a FETCH FAILURES section: each file or source you
  could not read, or "none".
- Stop and ask when an input is missing. Do not guess or invent it.
- Never edit the Google Drive Crawl files.
- Tasks that need files on the G: drive run locally, not in the cloud.
- Do not touch secrets, `wrangler.toml` or `functions/` unless the task says so.

## Backlog

`reference/BACKLOG.md` lists the build queue in order.
