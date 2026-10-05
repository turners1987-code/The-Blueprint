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

// Version of this journal schema (not of the taxonomy).
export const SCHEMA_VERSION = 1;

// TAXONOMY version this schema covers. Stamped on every record.
export const TAXONOMY_VERSION = '1.3';

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
const EXECUTION_MARKS = ['Pass', 'Fail'];

// TAXONOMY lists no direction values; long and short.
const DIRECTIONS = ['long', 'short'];

const slugs = (list) => list.map(e => e.slug);

// ── Field rules ───────────────────────────────────────────────

const REQUIRED = [
  'taxonomy_version', 'setup', 'location', 'grade', 'environment',
  'instrument', 'direction', 'session_date', 'entry_time',
];

const NUMBER_FIELDS = {
  // field: minimum (null = unbounded)
  intended_price: null, actual_fill: null, stop_price: null, target_price: null,
  r_multiple: null, mae: null, mfe: null,
  time_in_trade: 0, commissions: 0,
};

const KNOWN_FIELDS = new Set([
  ...REQUIRED,
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

// ── validate ──────────────────────────────────────────────────

// Returns { valid, errors }. Each error is { field, message }.
export function validate(record) {
  const errors = [];
  const fail = (field, message) => errors.push({ field, message });

  if (record === null || typeof record !== 'object' || Array.isArray(record)) {
    fail('(record)', 'must be an object');
    return { valid: false, errors };
  }

  for (const key of Object.keys(record)) {
    if (!KNOWN_FIELDS.has(key)) fail(key, 'unknown field');
  }

  for (const key of REQUIRED) {
    if (isBlank(record[key])) fail(key, 'is required');
  }

  const checkEnum = (key, allowed) => {
    const v = record[key];
    if (isBlank(v)) return; // required-ness handled above
    if (!allowed.includes(v)) fail(key, `must be one of: ${allowed.join(', ')}`);
  };

  if (!isBlank(record.taxonomy_version) && record.taxonomy_version !== TAXONOMY_VERSION) {
    fail('taxonomy_version', `must be "${TAXONOMY_VERSION}"`);
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

  return { valid: errors.length === 0, errors };
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
    mae: null,
    mfe: null,
    time_in_trade: null,
    commissions: null,
  };
}
