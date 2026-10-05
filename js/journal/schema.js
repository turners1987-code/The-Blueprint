/* ============================================================
   THE BLUEPRINT — Journal schema (js/journal/schema.js)
   ============================================================
   Trade record vocabulary and validation. No dependencies.

   Source of truth: reference/TAXONOMY.md (field model 1.1/1.2,
   vocabularies 2-5). Slugs are immutable (TAXONOMY section 0);
   labels are display text and may change. data/journal-schema.json
   is the JSON Schema for the same record, and
   scripts/validate-journal.mjs checks that the two agree.
   ============================================================ */

// Two version numbers, independent of each other:
//   JOURNAL_SCHEMA_VERSION tracks the record SHAPE: which fields exist,
//     their names, types and units. Bump it when a field is added,
//     renamed or re-typed, or a unit changes.
//   taxonomy_version (TAXONOMY_VERSION here) tracks the VOCABULARY: the
//     slugs and rules in reference/TAXONOMY.md. Bump it when TAXONOMY does.
// A new taxonomy version need not change the record shape, and a shape
// change need not touch the vocabulary. Every record carries
// taxonomy_version; the journal schema version belongs to this module.
// v2: added the optional id field (assigned by the storage layer).
// v3: setup, location and grade are nullable, so a zero-touch capture
//     (reference/CAPTURE_CONTRACT.md section 3) validates before the trader
//     classifies it. The keys must still be PRESENT (null, never absent),
//     and validate() still requires all three to be non-null when the
//     record is a closed live trade. Migration: none. This only widens what
//     is accepted, so every v1 and v2 record is a valid v3 record unchanged,
//     and no stored record is rewritten. A v3 export imported into a v2
//     journal is rejected there if it contains an unclassified record.
export const JOURNAL_SCHEMA_VERSION = 3;

// The TAXONOMY version in force: the single source for it in this repo.
// New records are stamped with it. Bump it whenever reference/TAXONOMY.md
// changes the enums or the field names. Records stamped with an older
// version stay valid (validate() only warns); one stamped newer is an error.
export const TAXONOMY_VERSION = '1.4';

// ── Units of every numeric field ──────────────────────────────
//   intended_price, actual_fill, stop_price, target_price
//                         price points of the instrument (for MNQ one
//                         tick = 0.25 points)
//   size                  whole contracts
//   r_multiple            R, a multiple of the planned risk (stop distance)
//   mae_ticks, mfe_ticks  ticks, as a positive magnitude: how far price
//                         went against (mae_ticks) or for (mfe_ticks) the trade
//                         from the fill
//   time_in_trade_seconds seconds, entry to exit
//   commissions           US dollars, the total for the whole trade
//                         (all contracts, both sides)

// ── Vocabularies (TAXONOMY sections 2-5) ──────────────────────

// Section 2. Retired setups (Second Chance Entry, Opening Range
// Breakout, ...) are not selectable; section 2.6.
export const SETUPS = [
  { slug: 'trend-continuation', label: 'Trend Continuation' },
  { slug: 'range-rejection',    label: 'Range Rejection' },
  { slug: 'gap-fill',           label: 'Gap Fill' },
  { slug: 'gap-n-go',           label: 'Gap N Go' },
  { slug: 'no-setup',           label: 'No Setup' },
];

// Section 4. The london-* and asia-* slugs are reserved but INACTIVE
// (4.1, 4.4), so they are not selectable and not listed here.
export const LOCATIONS = [
  // 4.1 Pre-marked
  { slug: 'pd-high',         label: 'PD High' },
  { slug: 'pd-low',          label: 'PD Low' },
  { slug: 'pd-vah',          label: 'PD VAH' },
  { slug: 'pd-val',          label: 'PD VAL' },
  { slug: 'pd-vpoc',         label: 'PD VPOC' },
  { slug: 'settlement',      label: 'Settlement' },
  { slug: 'on-high',         label: 'ON High' },
  { slug: 'on-low',          label: 'ON Low' },
  { slug: 'on-poc',          label: 'ON POC' },
  { slug: 'prior-week-high', label: 'Prior Week High' },
  { slug: 'prior-week-low',  label: 'Prior Week Low' },
  { slug: 'htf-hvn',         label: 'HTF HVN' },
  { slug: 'htf-lvn',         label: 'HTF LVN' },
  // 4.2 In-session
  { slug: 'or-high',                label: 'OR High' },
  { slug: 'or-low',                 label: 'OR Low' },
  { slug: 'defended-pullback-high', label: 'Defended Pullback High' },
  { slug: 'defended-pullback-low',  label: 'Defended Pullback Low' },
  { slug: 'developing-vpoc',        label: 'Developing VPOC' },
  { slug: 'developing-vah',         label: 'Developing VAH' },
  { slug: 'developing-val',         label: 'Developing VAL' },
  { slug: 'unfinished-business',    label: 'Unfinished Business' },
  { slug: 'stacked-imbalance',      label: 'Stacked Imbalance' },
  // 4.3 No named level
  { slug: 'mid-range', label: 'Mid-range' },
];

// Section 3. Triggers are price events. aggression-fails is NOT a
// trigger; it is a confirmation (3.4). `none` is the explicit
// no-trigger slug (3.6); an absent or null trigger means the same.
export const TRIGGERS = [
  { slug: 'pause-n-go',    label: 'Pause N Go' },
  { slug: 'resting-limit', label: 'Resting Limit at Level' },
  { slug: 'ema-pullback',  label: '9 EMA Pullback' },
  { slug: 'level-reclaim', label: 'Level Reclaim' },
  { slug: 'none',          label: 'No Trigger' },
];

// Section 3.4. Order-flow evidence, never a trigger. A sub-form is
// required whenever aggression-fails is used, so each entry here is
// one of its four sub-forms. Trapped Traders and Trader Dale's four
// have no slugs in TAXONOMY yet and are not listed.
export const CONFIRMATIONS = [
  { slug: 'big-orders',         label: 'Aggression fails: big orders' },
  { slug: 'failing-delta',      label: 'Aggression fails: failing delta' },
  { slug: 'delta-divergence',   label: 'Aggression fails: delta divergence' },
  { slug: 'two-bar-exhaustion', label: 'Aggression fails: two-bar exhaustion' },
];

// Section 5.1. Entry-plan compliance only; never reads the outcome.
export const GRADES = [
  { slug: 'A+', label: 'A+' },
  { slug: 'A',  label: 'A' },
  { slug: 'B',  label: 'B' },
  { slug: 'C',  label: 'C' },
];

// Section 1.1. Sim is never pooled into expectancy (6.4).
export const ENVIRONMENTS = [
  { slug: 'live',   label: 'Live' },
  { slug: 'sim',    label: 'Sim' },
  { slug: 'replay', label: 'Replay' },
];

// Section 5.2. Exit-plan compliance, separate from grade.
export const EXECUTION_MARKS = ['Pass', 'Fail'];

// TAXONOMY lists no direction values; long and short.
export const DIRECTIONS = ['long', 'short'];

const slugs = (list) => list.map(e => e.slug);

// ── Field rules ───────────────────────────────────────────────

const REQUIRED = [
  'taxonomy_version', 'setup', 'location', 'grade', 'environment',
  'instrument', 'direction', 'session_date', 'entry_time',
];

// Nullable since v3, but never absent. Null is an error only on a closed live
// trade (see validate()).
const CLASSIFICATION = ['setup', 'location', 'grade'];

const NUMBER_FIELDS = {
  // field: minimum (null = unbounded)
  intended_price: null, actual_fill: null, stop_price: null, target_price: null,
  r_multiple: null, mae_ticks: 0, mfe_ticks: 0,
  time_in_trade_seconds: 0, commissions: 0,
};

// Record id: the session date plus a short random suffix, e.g.
// 2026-09-29-k3f9a. Sorts by date. Assigned by js/journal/storage.js on put.
export const ID_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9a-z]{4,12}$/;

const KNOWN_FIELDS = new Set([
  ...REQUIRED,
  'id',
  'trigger', 'confirmation', 'execution_mark', 'tags',
  'exit_time', 'size', ...Object.keys(NUMBER_FIELDS),
]);

const DATE_RE = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
const DATETIME_RE = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})([.][0-9]+)?(Z|[+-]([0-9]{2}):([0-9]{2}))$/;

const isRealDate = (y, m, d) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

const isRealDateTime = (str) => {
  const m = DATETIME_RE.exec(str);
  if (!m) return false;
  const [y, mo, d, h, mi, s] = m.slice(1, 7).map(Number);
  if (!isRealDate(y, mo, d) || h > 23 || mi > 59 || s > 59) return false;
  if (m[8] !== undefined && (Number(m[9]) > 23 || Number(m[10]) > 59)) return false;
  return true;
};

const isBlank = (v) => v === undefined || v === null;

// "major.minor" -> [major, minor], or null when malformed.
const VERSION_RE = /^([0-9]+)[.]([0-9]+)$/;
const parseVersion = (v) => {
  const m = typeof v === 'string' ? VERSION_RE.exec(v) : null;
  return m ? [Number(m[1]), Number(m[2])] : null;
};
// negative if a < b, 0 if equal, positive if a > b
const compareVersions = (a, b) => (a[0] - b[0]) || (a[1] - b[1]);

// ── validate ──────────────────────────────────────────────────

// Returns { valid, errors, warnings }. Each entry is { field, message }.
// warnings never affect valid. A record stamped with an older
// taxonomy_version is checked against the CURRENT vocabulary and gets a
// warning; a value that has since been retired will still fail as an error.
export function validate(record) {
  const errors = [];
  const warnings = [];
  const fail = (field, message) => errors.push({ field, message });

  if (record === null || typeof record !== 'object' || Array.isArray(record)) {
    fail('(record)', 'must be an object');
    return { valid: false, errors, warnings };
  }

  for (const key of Object.keys(record)) {
    if (!KNOWN_FIELDS.has(key)) fail(key, 'unknown field');
  }

  for (const key of REQUIRED) {
    if (CLASSIFICATION.includes(key)) {
      if (record[key] === undefined) fail(key, 'is required');
    } else if (isBlank(record[key])) {
      fail(key, 'is required');
    }
  }
  // An unclassified zero-touch capture is fine; an unclassified closed live
  // trade is not. Closed means exit_time is set.
  if (record.environment === 'live' && !isBlank(record.exit_time)) {
    for (const key of CLASSIFICATION) {
      if (record[key] === null) fail(key, 'is required once a live trade is closed');
    }
  }

  const checkEnum = (key, allowed) => {
    const v = record[key];
    if (isBlank(v)) return; // required-ness handled above
    if (!allowed.includes(v)) fail(key, `must be one of: ${allowed.join(', ')}`);
  };

  if (!isBlank(record.taxonomy_version)) {
    const stamped = parseVersion(record.taxonomy_version);
    if (!stamped) {
      fail('taxonomy_version', 'must be a version number such as "1.4"');
    } else {
      const order = compareVersions(stamped, parseVersion(TAXONOMY_VERSION));
      if (order > 0) {
        fail('taxonomy_version', `"${record.taxonomy_version}" is newer than the supported "${TAXONOMY_VERSION}"`);
      } else if (order < 0) {
        warnings.push({
          field: 'taxonomy_version',
          message: `"${record.taxonomy_version}" is older than the current "${TAXONOMY_VERSION}"; checked against the current vocabulary`,
        });
      }
    }
  }
  checkEnum('setup', slugs(SETUPS));
  checkEnum('location', slugs(LOCATIONS));
  checkEnum('trigger', slugs(TRIGGERS));
  checkEnum('grade', slugs(GRADES));
  checkEnum('execution_mark', EXECUTION_MARKS);
  checkEnum('environment', slugs(ENVIRONMENTS));
  checkEnum('direction', DIRECTIONS);

  // confirmation: 0 or many, unique, each a known sub-form. Separate from trigger.
  if (!isBlank(record.confirmation)) {
    if (!Array.isArray(record.confirmation)) {
      fail('confirmation', 'must be an array');
    } else {
      const allowed = slugs(CONFIRMATIONS);
      record.confirmation.forEach((c, i) => {
        if (!allowed.includes(c)) fail(`confirmation[${i}]`, `must be one of: ${allowed.join(', ')}`);
      });
      if (new Set(record.confirmation).size !== record.confirmation.length) {
        fail('confirmation', 'must not contain duplicates');
      }
    }
  }

  // tags: 0 or many, unique, non-empty strings.
  if (!isBlank(record.tags)) {
    if (!Array.isArray(record.tags)) {
      fail('tags', 'must be an array');
    } else {
      record.tags.forEach((t, i) => {
        if (typeof t !== 'string' || t.length === 0) fail(`tags[${i}]`, 'must be a non-empty string');
      });
      if (new Set(record.tags).size !== record.tags.length) fail('tags', 'must not contain duplicates');
    }
  }

  if (!isBlank(record.id) && !(typeof record.id === 'string' && ID_RE.test(record.id))) {
    fail('id', 'must look like YYYY-MM-DD-xxxxx (session date plus a short random suffix)');
  }

  if (!isBlank(record.instrument) && (typeof record.instrument !== 'string' || record.instrument.length === 0)) {
    fail('instrument', 'must be a non-empty string');
  }

  if (!isBlank(record.session_date)) {
    const m = typeof record.session_date === 'string' && DATE_RE.exec(record.session_date);
    if (!m || !isRealDate(Number(m[1]), Number(m[2]), Number(m[3]))) {
      fail('session_date', 'must be a real date, YYYY-MM-DD');
    }
  }
  for (const key of ['entry_time', 'exit_time']) {
    if (!isBlank(record[key]) && !(typeof record[key] === 'string' && isRealDateTime(record[key]))) {
      fail(key, 'must be an ISO 8601 date-time with a UTC offset');
    }
  }

  if (!isBlank(record.size) && !(Number.isInteger(record.size) && record.size >= 1)) {
    fail('size', 'must be an integer of at least 1');
  }

  for (const [key, min] of Object.entries(NUMBER_FIELDS)) {
    const v = record[key];
    if (isBlank(v)) continue;
    if (typeof v !== 'number' || !Number.isFinite(v)) fail(key, 'must be a number');
    else if (min !== null && v < min) fail(key, `must be at least ${min}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ── emptyRecord ───────────────────────────────────────────────

// A blank record. taxonomy_version is stamped. Every other required
// field is null on purpose: setup, location, grade, environment,
// instrument, direction, session_date and entry_time are choices the
// trader must make, and a default would mislabel trades (a default
// environment of "live" would be worst). validate() fails until they
// are filled in. Optional fields start empty, since a trade can be
// logged before it closes.
export function emptyRecord() {
  return {
    id: null,
    taxonomy_version: TAXONOMY_VERSION,
    setup: null,
    location: null,
    trigger: null,
    confirmation: [],
    grade: null,
    execution_mark: null,
    environment: null,
    tags: [],
    instrument: null,
    direction: null,
    session_date: null,
    entry_time: null,
    exit_time: null,
    intended_price: null,
    actual_fill: null,
    stop_price: null,
    target_price: null,
    size: null,
    r_multiple: null,
    mae_ticks: null,
    mfe_ticks: null,
    time_in_trade_seconds: null,
    commissions: null,
  };
}
