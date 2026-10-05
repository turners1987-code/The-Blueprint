#!/usr/bin/env node
/* ============================================================
   THE BLUEPRINT — TurtleMetrics CSV importer
   (scripts/import-turtlemetrics.mjs)
   ============================================================
   Node only. No dependencies.

   Run:  npm run import:tm
         node scripts/import-turtlemetrics.mjs [input.csv] [output.json]

   Reads data/import/turtle-metrics-export-2026-10-04.csv and writes
     data/import/imported-trades.json   the records, for review
     data/import/import-report.txt      the same report this prints
     data/import/no-setup-audit.json    rows for the TAXONOMY OPEN #5 re-tag audit

   It does NOT touch the journal store. Nothing is written anywhere
   except those two files.

   The mapping follows reference/TAXONOMY.md section 9 and the import
   instructions:
     taxonomy_version  "1.4" on every record
     environment       account name containing "Sim" -> sim, else live
     setup             No Set Up -> no-setup
                       Range Rejection -> range-rejection
                       Trend Continuation -> trend-continuation
                       Breakout/Breakdown -> range-rejection (TAXONOMY 9)
                       blank -> null, flagged for manual review (never guessed)
     location          not in the CSV: null, every record flagged
     trigger           not recorded: null
     grade             not in the CSV: null (never inferred from outcome)
     execution_mark    not in the CSV: null
     mae_ticks/mfe_ticks   MAE/MFE points x 4 (MNQ: 4 ticks per point)
     commissions       Fees
     entry_time/exit_time  Date + Open Time / Close Time, America/New_York
     time_in_trade_seconds exit_time minus entry_time
     actual_fill       Entry Price; stop_price Stop Loss; r_multiple Realized R

   Every record is run through validate() from js/journal/schema.js.
   One that fails is listed under `rejected` with the reasons, never
   forced through with an invented value. The Tags column is not
   mapped: it is kept verbatim beside each record under `source`.
   ============================================================ */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validate, emptyRecord, TAXONOMY_VERSION } from '../js/journal/schema.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = path.resolve(ROOT, process.argv[2] || 'data/import/turtle-metrics-export-2026-10-04.csv');
const OUTPUT = path.resolve(ROOT, process.argv[3] || 'data/import/imported-trades.json');
const REPORT = path.join(path.dirname(OUTPUT), 'import-report.txt');
const AUDIT = path.join(path.dirname(OUTPUT), 'no-setup-audit.json');

const TIMEZONE = 'America/New_York';
const TICKS_PER_POINT = { MNQ: 4 }; // tick size 0.25
const EXPECTED_COLUMNS = [
  'Date', 'Account', 'Symbol', 'Side', 'Entry Price', 'Exit Price', 'Stop Loss', 'Net P&L', 'Fees',
  'MAE (pts)', 'MFE (pts)', 'P&L @ +5min', 'P&L @ +10min', 'P&L @ +15min', 'Setup', 'Tags',
  'Realized R', 'Open Time', 'Close Time',
];

// TAXONOMY section 9, applied to the Setup column.
const SETUP_MAP = {
  'No Set Up': 'no-setup',
  'Range Rejection': 'range-rejection',
  'Trend Continuation': 'trend-continuation',
  'Breakout/Breakdown': 'range-rejection',
};

// Tag names that name an entry method. Reported, not applied: trigger is
// "not recorded" for this import, and TAXONOMY section 9 needs a human call.
const ENTRY_METHOD_TAGS = new Set([
  '9 EMA Pullback Entry', 'Big Orders Entry', 'Resting Limit Order at Level',
  'Level Reclaim (5-min close)', 'Delta Divergence on Approach', 'Pause n Go',
]);
const GRADE_TAGS = new Set(['A+', 'A', 'B', 'C']);

// ── CSV ───────────────────────────────────────────────────────

// RFC 4180-style: quoted fields may hold commas, doubled quotes, newlines.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      rows.push(row); row = [];
    } else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

// ── Values ────────────────────────────────────────────────────

const blank = (v) => v === undefined || v === null || String(v).trim() === '';
const num = (v) => {
  if (blank(v)) return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : NaN;
};
const clean = (x) => Math.round(x * 1e6) / 1e6; // strips float noise from x * 4

const tzParts = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE, hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

// The UTC offset (+/-HH:MM) New York has at a given local date and time.
// Tries -04:00 and -05:00 and keeps the one that reads back as that local
// time, so daylight saving is handled by the tz database, not by hand.
function nyOffset(date, time) {
  for (const off of ['-04:00', '-05:00']) {
    const ms = Date.parse(`${date}T${time}${off}`);
    if (!Number.isFinite(ms)) continue;
    const p = Object.fromEntries(tzParts.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
    if (`${p.year}-${p.month}-${p.day}` === date && `${p.hour}:${p.minute}:${p.second}` === time) return off;
  }
  return null;
}

const addDay = (date) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

const DATE_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const TIME_RE = /^[0-9]{2}:[0-9]{2}:[0-9]{2}$/;

// ── Read ──────────────────────────────────────────────────────

let text;
try { text = readFileSync(INPUT, 'utf8').replace(/^﻿/, ''); } catch (e) {
  console.error(`import-turtlemetrics: cannot read ${path.relative(ROOT, INPUT)}: ${e.message}`);
  process.exit(1);
}

const headerComments = [];
const all = parseCsv(text).filter(r => !(r.length === 1 && r[0].trim() === ''));
const table = [];
for (const r of all) {
  if (r[0].startsWith('#')) headerComments.push(r.join(',').replace(/^#\s?/, ''));
  else table.push(r);
}
const columns = table.shift() || [];
if (columns.join('|') !== EXPECTED_COLUMNS.join('|')) {
  console.error('import-turtlemetrics: the CSV columns are not the expected ones.');
  console.error(`  expected: ${EXPECTED_COLUMNS.join(', ')}`);
  console.error(`  found:    ${columns.join(', ')}`);
  process.exit(1);
}
const declared = headerComments.map(c => /^Total trades:\s*([0-9]+)/.exec(c)).find(Boolean);

// ── Map ───────────────────────────────────────────────────────

const imported = [];
const rejected = [];

table.forEach((cells, index) => {
  const rowNumber = index + 1;
  const row = Object.fromEntries(columns.map((c, i) => [c, (cells[i] ?? '').trim()]));
  const flags = [];
  const problems = []; // reasons the row cannot be turned into a record at all

  // environment
  const environment = /sim/i.test(row.Account) ? 'sim' : 'live';

  // setup (TAXONOMY 9). Blank is never guessed.
  let setup = null;
  if (blank(row.Setup)) flags.push('setup-blank: needs manual review');
  else if (SETUP_MAP[row.Setup]) setup = SETUP_MAP[row.Setup];
  else flags.push(`setup-unmapped: "${row.Setup}" is not in the TAXONOMY section 9 mapping`);

  flags.push('location-needed: the CSV has no location column');

  // instrument, side
  const instrument = (/^[A-Za-z0-9]+/.exec(row.Symbol) || [''])[0].toUpperCase();
  if (!instrument) problems.push({ field: 'instrument', message: `cannot read a symbol from "${row.Symbol}"` });
  const direction = { long: 'long', short: 'short' }[row.Side.toLowerCase()];
  if (!direction) problems.push({ field: 'direction', message: `unrecognised side "${row.Side}"` });

  // numbers
  const read = (col, field) => {
    const v = num(row[col]);
    if (Number.isNaN(v)) { problems.push({ field, message: `"${row[col]}" in ${col} is not a number` }); return null; }
    return v;
  };
  const entry = read('Entry Price', 'actual_fill');
  const stop = read('Stop Loss', 'stop_price');
  const fees = read('Fees', 'commissions');
  const mae = read('MAE (pts)', 'mae_ticks');
  const mfe = read('MFE (pts)', 'mfe_ticks');
  const realizedR = read('Realized R', 'r_multiple');
  if (stop === null) flags.push('no-stop-loss');
  if (realizedR === null) flags.push('no-realized-r');

  const tpp = TICKS_PER_POINT[instrument];
  if ((mae !== null || mfe !== null) && !tpp) {
    problems.push({ field: 'mae_ticks', message: `no ticks-per-point known for ${instrument}` });
  }

  // times (America/New_York)
  let entryTime = null;
  let exitTime = null;
  if (!DATE_RE.test(row.Date)) problems.push({ field: 'session_date', message: `"${row.Date}" is not YYYY-MM-DD` });
  else {
    if (!TIME_RE.test(row['Open Time'])) problems.push({ field: 'entry_time', message: `"${row['Open Time']}" is not HH:MM:SS` });
    else {
      const off = nyOffset(row.Date, row['Open Time']);
      if (!off) problems.push({ field: 'entry_time', message: `${row.Date} ${row['Open Time']} is not a valid ${TIMEZONE} time` });
      else entryTime = `${row.Date}T${row['Open Time']}${off}`;
    }
    if (!blank(row['Close Time'])) {
      if (!TIME_RE.test(row['Close Time'])) problems.push({ field: 'exit_time', message: `"${row['Close Time']}" is not HH:MM:SS` });
      else {
        // A close earlier on the clock than the open means it closed after midnight.
        const closeDate = row['Close Time'] < row['Open Time'] ? addDay(row.Date) : row.Date;
        const off = nyOffset(closeDate, row['Close Time']);
        if (!off) problems.push({ field: 'exit_time', message: `${closeDate} ${row['Close Time']} is not a valid ${TIMEZONE} time` });
        else exitTime = `${closeDate}T${row['Close Time']}${off}`;
      }
    }
  }

  const tags = row.Tags.split(',').map(t => t.trim()).filter(Boolean);
  const source = {
    row: rowNumber,
    raw: { ...row },
    date: row.Date,
    account: row.Account,
    symbol: row.Symbol,
    setup: row.Setup,
    netPnl: num(row['Net P&L']),
    tags,
  };
  if (tags.some(t => ENTRY_METHOD_TAGS.has(t))) flags.push('tags-name-an-entry-method: not mapped to trigger');
  if (tags.some(t => GRADE_TAGS.has(t))) flags.push('tags-hold-a-grade-letter: grade left null');

  if (problems.length) {
    rejected.push({ source, flags, errors: problems, record: null });
    return;
  }

  const record = emptyRecord();
  Object.assign(record, {
    taxonomy_version: '1.4',
    setup,
    location: null,
    trigger: null,
    grade: null,
    execution_mark: null,
    environment,
    instrument,
    direction,
    session_date: row.Date,
    entry_time: entryTime,
    exit_time: exitTime,
    actual_fill: entry,
    stop_price: stop,
    r_multiple: realizedR,
    mae_ticks: mae === null ? null : clean(mae * tpp),
    mfe_ticks: mfe === null ? null : clean(mfe * tpp),
    commissions: fees,
    time_in_trade_seconds: entryTime && exitTime ? Math.round((Date.parse(exitTime) - Date.parse(entryTime)) / 1000) : null,
  });
  delete record.id; // the storage layer assigns ids on put

  const { valid, errors } = validate(record);
  if (valid) imported.push({ source, flags, record });
  else rejected.push({ source, flags, errors, record });
});

// ── Report ────────────────────────────────────────────────────

const tally = (items, keyFn) => {
  const m = new Map();
  for (const it of items) for (const k of [].concat(keyFn(it))) m.set(k, (m.get(k) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
};
const everything = [...imported, ...rejected];
const withRecord = everything.filter(x => x.record);
const pad = (s, n) => String(s).padEnd(n);

const dates = everything.map(x => x.source.date).sort();
const byEnv = (env) => withRecord.filter(x => x.record.environment === env).length;
const stopCount = withRecord.filter(x => x.record.stop_price !== null).length;
const setupCount = withRecord.filter(x => x.record.setup !== null).length;
const locationNeeded = everything.filter(x => x.flags.some(f => f.startsWith('location-needed'))).length;
const awaiting = rejected.filter(x => x.errors.every(e => ['setup', 'location', 'grade'].includes(e.field)));
const hardRejects = rejected.filter(x => !x.errors.every(e => ['setup', 'location', 'grade'].includes(e.field)));
const zeroFees = withRecord.filter(x => x.record.commissions === 0).length;
const noR = withRecord.filter(x => x.record.r_multiple === null).length;

const lines = [];
const out = (s = '') => lines.push(s);
out('TurtleMetrics import report');
out('='.repeat(60));
out(`Source:   ${path.relative(ROOT, INPUT)}`);
out(`Output:   ${path.relative(ROOT, OUTPUT)}`);
out(`Range:    ${dates[0] || 'n/a'} to ${dates[dates.length - 1] || 'n/a'}`);
out(`Taxonomy: 1.4 (schema.js is at ${TAXONOMY_VERSION})`);
out('The journal store was not touched.');
out();
out('Rows');
out(`  total rows in the CSV:        ${everything.length}${declared ? `  (file header says ${declared[1]})` : ''}`);
out(`  imported (pass validate()):   ${imported.length}`);
out(`  rejected:                     ${rejected.length}`);
out(`    only because setup/location/grade are blank, awaiting manual assignment: ${awaiting.length}`);
out(`    for any other reason:       ${hardRejects.length}`);
out();
out('Rejection reasons (a row can have several)');
if (!rejected.length) out('  none');
for (const [reason, n] of tally(rejected, x => x.errors.map(e => `${e.field}: ${e.message}`))) out(`  ${pad(n, 5)} ${reason}`);
out();
out('Rejected rows by the set of fields that failed');
for (const [combo, n] of tally(rejected, x => [...new Set(x.errors.map(e => e.field))].sort().join(' + '))) out(`  ${pad(n, 5)} ${combo}`);
out();
out('Environment (all rows that produced a record)');
out(`  live: ${byEnv('live')}    sim: ${byEnv('sim')}`);
for (const [acct, n] of tally(everything, x => x.source.account)) out(`    ${pad(n, 5)} ${acct}`);
out();
out('Coverage (all rows)');
out(`  with a stop loss:                    ${stopCount} of ${everything.length}`);
out(`  with a setup tag (mapped):           ${setupCount} of ${everything.length}`);
out(`  blank setup, flagged for review:     ${everything.filter(x => x.flags.some(f => f.startsWith('setup-blank'))).length}`);
out(`  need manual location assignment:     ${locationNeeded} of ${everything.length}`);
out(`  with a realized R:                   ${everything.length - noR} of ${everything.length}`);
out();
out('Setup column -> setup');
for (const [name, n] of tally(everything, x => (blank(x.source.setup) ? '(blank)' : x.source.setup))) {
  out(`  ${pad(n, 5)} ${pad(name, 20)} -> ${name === '(blank)' ? 'null (manual review)' : SETUP_MAP[name] || 'UNMAPPED'}`);
}
out();
out('Things to know before using this file');
out(`  - Fees are 0.00 on all ${zeroFees} rows with a record. TurtleMetrics may simply not have recorded them. They were imported`);
out('    as commissions: 0, which analysis.js treats as "recorded", so net R would equal gross R.');
out(`  - Realized R is blank on ${noR} rows (no stop was set). Those keep r_multiple null, so analysis.js counts them as open trades.`);
out(`  - Tags are not mapped (the record's tags stay empty); they sit verbatim under source.tags.`);
out(`      ${everything.filter(x => x.flags.some(f => f.startsWith('tags-name-an-entry-method'))).length} rows carry an entry-method tag (for example Pause n Go, Big Orders Entry) that TAXONOMY section 9 could map to trigger / confirmation.`);
out(`      ${everything.filter(x => x.flags.some(f => f.startsWith('tags-hold-a-grade-letter'))).length} rows carry a grade letter (A+, A, B or C) in Tags. Grade was left null as instructed.`);
out('  - size is not in the CSV and was not derived, so it is null. execution_mark, trigger and intended_price are null too.');
out('  - The contract month (09-26 / 12-26) is dropped: records only hold the instrument, MNQ.');
out('  - time_in_trade_seconds is computed as exit_time minus entry_time.');

const reportText = lines.join('\n') + '\n';

// ── Write ─────────────────────────────────────────────────────

// The raw CSV row goes to the audit file only; the archive keeps its original shape.
const withoutRaw = ({ source: { raw, ...source }, ...rest }) => ({ source, ...rest });

const file = {
  source: path.relative(ROOT, INPUT).split(path.sep).join('/'),
  taxonomy_version: '1.4',
  note: 'For review. Not written to the journal store. Each entry pairs a record with its CSV row (`source`) and review flags. Records under `rejected` are what would have been imported, with the reasons validate() refused them.',
  counts: {
    rows: everything.length,
    imported: imported.length,
    rejected: rejected.length,
    rejectedAwaitingManualFields: awaiting.length,
    rejectedOther: hardRejects.length,
    live: byEnv('live'),
    sim: byEnv('sim'),
    withStopLoss: stopCount,
    withSetup: setupCount,
    needLocation: locationNeeded,
  },
  imported: imported.map(withoutRaw),
  rejected: rejected.map(withoutRaw),
};
writeFileSync(OUTPUT, JSON.stringify(file, null, 2) + '\n');
writeFileSync(REPORT, reportText);
// TAXONOMY OPEN #5 input: rows tagged "No Set Up", plus any row whose Tags
// name an entry method or hold a grade letter. Each carries its raw CSV row.
const auditRows = everything
  .map(x => {
    const matched = [];
    if (x.source.setup === 'No Set Up') matched.push('no-set-up');
    if (x.source.tags.some(t => ENTRY_METHOD_TAGS.has(t))) matched.push('entry-method-tag');
    if (x.source.tags.some(t => GRADE_TAGS.has(t))) matched.push('grade-letter');
    return { x, matched };
  })
  .filter(({ matched }) => matched.length)
  .map(({ x, matched }) => ({
    row: x.source.row,
    matched,
    environment: /sim/i.test(x.source.account) ? 'sim' : 'live',
    entryMethodTags: x.source.tags.filter(t => ENTRY_METHOD_TAGS.has(t)),
    gradeLetters: x.source.tags.filter(t => GRADE_TAGS.has(t)),
    csv: x.source.raw,
  }));
const countMatched = (m) => auditRows.filter(r => r.matched.includes(m)).length;
writeFileSync(AUDIT, JSON.stringify({
  source: path.relative(ROOT, INPUT).split(path.sep).join('/'),
  purpose: 'Input to TAXONOMY OPEN #5 (No Setup re-tag audit). Re-tag using the section 9 mapping and publish what remains.',
  selection: 'Rows whose Setup is "No Set Up", plus any row whose Tags name an entry method or hold a grade letter (A+, A, B, C).',
  entryMethodTags: [...ENTRY_METHOD_TAGS],
  counts: {
    rows: auditRows.length,
    noSetUp: countMatched('no-set-up'),
    entryMethodTag: countMatched('entry-method-tag'),
    gradeLetter: countMatched('grade-letter'),
    live: auditRows.filter(r => r.environment === 'live').length,
    sim: auditRows.filter(r => r.environment === 'sim').length,
  },
  rows: auditRows,
}, null, 2) + '\n');

process.stdout.write(reportText);
console.log(`\nWrote ${path.relative(ROOT, OUTPUT)}, ${path.relative(ROOT, REPORT)} and ${path.relative(ROOT, AUDIT)} (${auditRows.length} audit rows).`);
