/* ============================================================
   THE BLUEPRINT — Journal CSV export (js/journal/csv.js)
   ============================================================
   Turns journal records into the canonical trades CSV that BP Trade
   Review reads (reference/BLUEPRINT_DOC.md, NT8 tools section).
   Pure functions, no dependencies, no storage access.

   Header, exact order:
   id,instrument,entry_time,exit_time,side,entry_price,stop_price,
   target_price,qty,setup,result_pts,result_usd,q1,q2,q3,note

   Rules: RFC 4180 quoting; instrument is the root symbol, never the
   contract; times keep their ISO 8601 offset; stop_price, target_price,
   q2, q3 and note may be empty.
   Left empty on purpose: result_usd (the site reports R, never dollars),
   q1-q3 and note (the journal records have no such fields).
   ============================================================ */

export const CSV_COLUMNS = [
  'id', 'instrument', 'entry_time', 'exit_time', 'side', 'entry_price',
  'stop_price', 'target_price', 'qty', 'setup', 'result_pts', 'result_usd',
  'q1', 'q2', 'q3', 'note',
];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

// RFC 4180: quote a field holding a comma, quote or line break; double quotes.
export function csvField(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// "MNQ 12-26" or "MNQZ6" -> "MNQ". Root symbol only.
export function rootSymbol(instrument) {
  const m = /^[A-Za-z0-9]*?(?=[ ]|[FGHJKMNQUVXZ][0-9]{1,2}$|$)/.exec(String(instrument || '').trim());
  const root = m && m[0] ? m[0] : String(instrument || '').trim().split(/\s+/)[0];
  return root.toUpperCase();
}

// Points gained (negative = lost), per contract, from fill to exit.
export function resultPoints(record) {
  const entry = isNum(record.actual_fill) ? record.actual_fill : record.intended_price;
  if (!isNum(entry) || !isNum(record.exit_price)) return null;
  const sign = record.direction === 'short' ? -1 : 1;
  return Math.round(sign * (record.exit_price - entry) * 1e6) / 1e6;
}

export function recordToRow(record) {
  const entry = isNum(record.actual_fill) ? record.actual_fill : record.intended_price;
  return [
    record.id, rootSymbol(record.instrument), record.entry_time, record.exit_time,
    record.direction, entry, record.stop_price, record.target_price, record.size,
    record.setup, resultPoints(record), '', '', '', '', '',
  ];
}

export function toCanonicalCsv(records) {
  const lines = [CSV_COLUMNS.join(',')];
  for (const r of records) lines.push(recordToRow(r).map(csvField).join(','));
  return lines.join('\r\n') + '\r\n';
}
