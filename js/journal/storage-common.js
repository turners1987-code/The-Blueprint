/* ============================================================
   THE BLUEPRINT — Journal storage: shared pieces
   (js/journal/storage-common.js)
   ============================================================
   Errors, id generation, validation-on-write, ordering and the
   export envelope, used by both adapters so they behave the same.
   ============================================================ */

import { JOURNAL_SCHEMA_VERSION, ID_RE, validate } from './schema.js';

// ── Errors ────────────────────────────────────────────────────
// StorageError.code is one of:
//   quota        the browser's storage is full
//   unavailable  the store cannot be used at all (blocked, unsupported)
//   permission   folder access was revoked or needs to be re-granted
//   not-ready    init() has not succeeded
//   bad-argument the call itself was wrong
//   bad-import   importAll() was given something that is not an export
//   io           any other read or write failure
//   invalid      a record failed validation (ValidationError)

export class StorageError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = 'StorageError';
    this.code = code;
  }
}

// Thrown by put() and importAll() for invalid records. `errors` is a list
// of { field, message }; for importAll() each also names the record via
// `record` (its position and id, when it has one).
export class ValidationError extends StorageError {
  constructor(errors, what = 'Record') {
    const shown = errors.slice(0, 5)
      .map(e => `${e.record ? e.record + ': ' : ''}${e.field} ${e.message}`).join('; ');
    const more = errors.length > 5 ? ` (+${errors.length - 5} more)` : '';
    super('invalid', `${what} is invalid: ${shown}${more}`);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// ── Ids ───────────────────────────────────────────────────────

const DATE_ONLY = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

// Session date plus a 5-character random suffix: 2026-09-29-k3f9a.
// Sorts by session date; the suffix only separates trades on the same day.
export function makeId(sessionDate) {
  const bytes = new Uint8Array(5);
  globalThis.crypto.getRandomValues(bytes);
  let suffix = '';
  for (const b of bytes) suffix += ALPHABET[b % ALPHABET.length];
  return `${sessionDate}-${suffix}`;
}

export const isId = (id) => typeof id === 'string' && ID_RE.test(id);

// ── Validation on write ───────────────────────────────────────

// Returns a copy of `record` with an id (when it lacks one and has a usable
// session_date), or throws ValidationError. Never mutates its argument.
// `taken(id)` says whether an id is already in use, so a freshly generated
// id never collides.
export async function prepare(record, taken = async () => false) {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) {
    throw new ValidationError([{ field: '(record)', message: 'must be an object' }]);
  }
  const copy = JSON.parse(JSON.stringify(record));
  if (copy.id === undefined || copy.id === null) {
    if (typeof copy.session_date === 'string' && DATE_ONLY.test(copy.session_date)) {
      let id;
      let tries = 0;
      do {
        id = makeId(copy.session_date);
        if (++tries > 20) throw new StorageError('io', 'Could not generate an unused record id.');
      } while (await taken(id));
      copy.id = id;
    } else {
      delete copy.id; // validate() reports the missing session_date
    }
  }
  // Schema v4 migration: a record from an older journal has no exit_price key.
  if (copy.exit_price === undefined) copy.exit_price = null;
  const { valid, errors } = validate(copy);
  if (!valid) throw new ValidationError(errors);
  return copy;
}

// ── Ordering and ranges ───────────────────────────────────────

// Records are keyed for ordering by { id, d: session_date, t: entry_time }.
// Newest first: later session date, then later entry time, then id.
export const newestFirst = (a, b) =>
  (a.d < b.d ? 1 : a.d > b.d ? -1 : 0) ||
  ((a.t || '') < (b.t || '') ? 1 : (a.t || '') > (b.t || '') ? -1 : 0) ||
  (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);

// Validates a { from, to } range of YYYY-MM-DD dates (both optional,
// inclusive) and returns a predicate over session dates.
export function rangeFilter({ from, to } = {}) {
  for (const [name, v] of [['from', from], ['to', to]]) {
    if (v !== undefined && v !== null && !(typeof v === 'string' && DATE_ONLY.test(v))) {
      throw new StorageError('bad-argument', `list(): "${name}" must be a YYYY-MM-DD date.`);
    }
  }
  return (d) => (!from || d >= from) && (!to || d <= to);
}

// ── Export / import envelope ──────────────────────────────────

export const EXPORT_FORMAT = 'blueprint-journal';

export function buildExport(records) {
  return JSON.stringify({
    format: EXPORT_FORMAT,
    journal_schema_version: JOURNAL_SCHEMA_VERSION,
    exported: new Date().toISOString(),
    records,
  }, null, 2);
}

// Parses importAll() input and validates every record BEFORE anything is
// written. Accepts the export envelope or a bare array of records.
// Returns the prepared records (ids assigned) or throws.
export async function parseImport(json) {
  let data;
  try { data = JSON.parse(json); } catch {
    throw new StorageError('bad-import', 'Import is not valid JSON.');
  }
  const list = Array.isArray(data) ? data
    : (data && data.format === EXPORT_FORMAT && Array.isArray(data.records)) ? data.records
    : null;
  if (!list) {
    throw new StorageError('bad-import', 'Import is not a Blueprint journal export (expected a records array).');
  }

  const errors = [];
  const out = [];
  const seen = new Set();
  const taken = async (id) => seen.has(id);
  for (let i = 0; i < list.length; i++) {
    try {
      const rec = await prepare(list[i], taken);
      if (seen.has(rec.id)) {
        errors.push({ record: `record ${i + 1}`, field: 'id', message: `"${rec.id}" appears more than once` });
        continue;
      }
      seen.add(rec.id);
      out.push(rec);
    } catch (e) {
      if (!(e instanceof ValidationError)) throw e;
      const label = `record ${i + 1}${list[i] && list[i].id ? ` (${list[i].id})` : ''}`;
      for (const err of e.errors) errors.push({ record: label, ...err });
    }
  }
  if (errors.length) throw new ValidationError(errors, 'Import');
  return out;
}

// ── Misc ──────────────────────────────────────────────────────

export const byteLength = (str) => new TextEncoder().encode(str).length;

// Summarises { d } index entries for stats().
export function summarise(entries, bytes) {
  let oldest = null;
  let newest = null;
  for (const { d } of entries) {
    if (oldest === null || d < oldest) oldest = d;
    if (newest === null || d > newest) newest = d;
  }
  return { count: entries.length, oldest, newest, bytes };
}
