#!/usr/bin/env node
/* ============================================================
   THE BLUEPRINT — journal schema check (scripts/validate-journal.mjs)
   ============================================================
   Node only. No dependencies.

   Run:  npm run check:journal

   1. Validates every record in data/journal-example.json against
      data/journal-schema.json (a small built-in JSON Schema
      checker covering the keywords the schema uses) AND against
      validate() in js/journal/schema.js. Both must accept.
   2. Checks that the enums in the two schema sources agree.
   3. Runs negative controls: records that break a schema rule
      must be rejected by both, so a checker that accepts
      everything cannot pass.

   Exit code 1 on any failure, 0 otherwise.
   ============================================================ */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  JOURNAL_SCHEMA_VERSION, TAXONOMY_VERSION,
  SETUPS, LOCATIONS, TRIGGERS, CONFIRMATIONS, GRADES, ENVIRONMENTS,
  validate, emptyRecord,
} from '../js/journal/schema.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));

const schema = readJson('data/journal-schema.json');
const examples = readJson('data/journal-example.json');

// ── Minimal JSON Schema (2020-12) checker ─────────────────────
// Supports: type (string or array), enum, const, required, properties,
// additionalProperties:false, pattern, minLength, minimum, items,
// uniqueItems. Throws on any other keyword so the checker cannot
// silently ignore a rule the schema starts to use.

const SUPPORTED = new Set([
  '$schema', '$id', 'title', 'description', '$comment',
  'type', 'enum', 'const', 'required', 'properties', 'additionalProperties',
  'pattern', 'minLength', 'minimum', 'items', 'uniqueItems',
]);

const typeOf = (v) => {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v; // string, boolean, object
};

const typeMatches = (v, t) => {
  const actual = typeOf(v);
  return actual === t || (t === 'number' && actual === 'integer');
};

function check(value, node, where, errors) {
  for (const key of Object.keys(node)) {
    if (!SUPPORTED.has(key)) throw new Error(`validate-journal: unsupported schema keyword "${key}" at ${where}`);
  }
  if ('const' in node && value !== node.const) errors.push(`${where}: must be ${JSON.stringify(node.const)}`);
  if ('enum' in node && !node.enum.some(e => e === value)) errors.push(`${where}: not one of ${JSON.stringify(node.enum)}`);
  if ('type' in node) {
    const types = Array.isArray(node.type) ? node.type : [node.type];
    if (!types.some(t => typeMatches(value, t))) {
      errors.push(`${where}: expected ${types.join('|')}, got ${typeOf(value)}`);
      return; // keyword checks below assume the type is right
    }
  }
  if (typeof value === 'string') {
    if ('pattern' in node && !new RegExp(node.pattern).test(value)) errors.push(`${where}: does not match pattern`);
    if ('minLength' in node && value.length < node.minLength) errors.push(`${where}: shorter than ${node.minLength}`);
  }
  if (typeof value === 'number' && 'minimum' in node && value < node.minimum) {
    errors.push(`${where}: below minimum ${node.minimum}`);
  }
  if (Array.isArray(value)) {
    if (node.uniqueItems && new Set(value.map(v => JSON.stringify(v))).size !== value.length) {
      errors.push(`${where}: items must be unique`);
    }
    if (node.items) value.forEach((v, i) => check(v, node.items, `${where}[${i}]`, errors));
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of node.required || []) {
      if (!(key in value)) errors.push(`${where}.${key}: is required`);
    }
    for (const [key, sub] of Object.entries(node.properties || {})) {
      if (key in value) check(value[key], sub, `${where}.${key}`, errors);
    }
    if (node.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in (node.properties || {}))) errors.push(`${where}.${key}: unknown field`);
      }
    }
  }
}

const validateAgainstJsonSchema = (record) => {
  const errors = [];
  check(record, schema, '(record)', errors);
  return errors;
};

// ── Run ───────────────────────────────────────────────────────

const failures = [];
const fail = (msg) => failures.push(msg);

// 2. Enum parity between data/journal-schema.json and schema.js
const enumOf = (field) => {
  const prop = schema.properties[field];
  const list = prop.enum || prop.items.enum;
  return list.filter(v => v !== null);
};
const sameSet = (a, b) => a.length === b.length && a.every(v => b.includes(v));
const PARITY = {
  setup: SETUPS, location: LOCATIONS, trigger: TRIGGERS,
  confirmation: CONFIRMATIONS, grade: GRADES, environment: ENVIRONMENTS,
};
for (const [field, list] of Object.entries(PARITY)) {
  if (!sameSet(enumOf(field), list.map(e => e.slug))) fail(`enum mismatch for "${field}" between journal-schema.json and schema.js`);
}
if (!new RegExp(schema.properties.taxonomy_version.pattern).test(TAXONOMY_VERSION)) fail('TAXONOMY_VERSION does not match the taxonomy_version pattern in journal-schema.json');
if (schema.properties.taxonomy_version.const !== undefined) fail('taxonomy_version must not be a const in journal-schema.json');
for (const f of schema.required) {
  if (!(f in emptyRecord())) fail(`emptyRecord() is missing required field "${f}"`);
}
if (!sameSet(Object.keys(emptyRecord()), Object.keys(schema.properties))) fail('emptyRecord() fields differ from the schema properties');

// 1. Examples must validate under both checkers
if (!Array.isArray(examples) || examples.length === 0) fail('data/journal-example.json must be a non-empty array');
(Array.isArray(examples) ? examples : []).forEach((rec, i) => {
  for (const e of validateAgainstJsonSchema(rec)) fail(`example[${i}] (JSON Schema): ${e}`);
  for (const e of validate(rec).errors) fail(`example[${i}] (schema.js): ${e.field} ${e.message}`);
  if (rec.environment !== 'sim') fail(`example[${i}]: environment must be "sim"`);
});

// 3. Negative controls: each must be rejected by both checkers
const base = examples[0];
const without = (key) => { const r = { ...base }; delete r[key]; return r; };
const NEGATIVE = {
  'missing environment': without('environment'),
  'null environment': { ...base, environment: null },
  'missing grade': without('grade'),
  'unknown grade A-': { ...base, grade: 'A-' },
  'grade holding an exit mark': { ...base, grade: 'Pass' },
  'execution_mark holding a grade': { ...base, execution_mark: 'A' },
  'aggression-fails used as a trigger': { ...base, trigger: 'aggression-fails' },
  'order-flow sub-form used as a trigger': { ...base, trigger: 'big-orders' },
  'price trigger used as a confirmation': { ...base, confirmation: ['pause-n-go'] },
  'confirmation not an array': { ...base, confirmation: 'big-orders' },
  'inactive location london-high': { ...base, location: 'london-high' },
  'retired setup': { ...base, setup: 'opening-range-breakout' },
  'malformed id': { ...base, id: 'trade-1' },
  'id without a session date': { ...base, id: 'k3f9a' },
  'numeric id': { ...base, id: 12345 },
  'malformed taxonomy_version "1.x"': { ...base, taxonomy_version: '1.x' },
  'malformed taxonomy_version "1"': { ...base, taxonomy_version: '1' },
  'malformed taxonomy_version "v1.4"': { ...base, taxonomy_version: 'v1.4' },
  'malformed taxonomy_version "1.4.0"': { ...base, taxonomy_version: '1.4.0' },
  'numeric taxonomy_version': { ...base, taxonomy_version: 1.4 },
  'invented field': { ...base, trigger_subform: 'big-orders' },
  'bad entry_time': { ...base, entry_time: '2026-09-29 09:52' },
  'size zero': { ...base, size: 0 },
  'negative commissions': { ...base, commissions: -1 },
  'old field name mae': { ...base, mae: 14 },
  'old field name time_in_trade': { ...base, time_in_trade: 2280 },
  'negative mae_ticks': { ...base, mae_ticks: -1 },
  'negative time_in_trade_seconds': { ...base, time_in_trade_seconds: -1 },
};
for (const [name, rec] of Object.entries(NEGATIVE)) {
  if (validateAgainstJsonSchema(rec).length === 0) fail(`negative control "${name}" was accepted by the JSON Schema checker`);
  if (validate(rec).valid) fail(`negative control "${name}" was accepted by schema.js validate()`);
}
// A date that fits the pattern but is not on the calendar: JSON Schema's
// pattern cannot tell, so only schema.js is expected to reject it.
if (validate({ ...base, session_date: '2026-02-30' }).valid) fail('schema.js accepted the impossible date 2026-02-30');
// A version newer than the supported one also fits the pattern; only
// schema.js can compare versions, so only it is expected to reject it.
const [maj, min] = TAXONOMY_VERSION.split('.').map(Number);
for (const newer of [`${maj}.${min + 1}`, `${maj + 1}.0`]) {
  if (validate({ ...base, taxonomy_version: newer }).valid) fail(`schema.js accepted taxonomy_version "${newer}", newer than ${TAXONOMY_VERSION}`);
}

// Positive controls: records stamped with an older taxonomy version must
// still validate under both checkers; schema.js warns but does not error.
const OLDER = [`${maj}.${Math.max(min - 1, 0)}`, '1.0', '0.9'].filter(v => v !== TAXONOMY_VERSION);
for (const v of OLDER) {
  const rec = { ...base, taxonomy_version: v };
  for (const e of validateAgainstJsonSchema(rec)) fail(`older taxonomy_version "${v}" rejected by JSON Schema: ${e}`);
  const r = validate(rec);
  if (!r.valid) fail(`older taxonomy_version "${v}" rejected by schema.js: ${r.errors.map(e => e.field + ' ' + e.message).join('; ')}`);
  if (!r.warnings.some(w => w.field === 'taxonomy_version')) fail(`older taxonomy_version "${v}" produced no warning`);
}
// The current version validates with no warning at all.
for (const rec of examples) {
  if (validate(rec).warnings.length) fail(`example stamped "${rec.taxonomy_version}" produced warnings under taxonomy ${TAXONOMY_VERSION}`);
}

// v3: classification may be null (zero-touch), but not absent, and not on a
// closed live trade. The last rule lives in validate() only.
{
  const open = { ...base, environment: 'sim', exit_time: null, setup: null, location: null, grade: null };
  for (const e of validateAgainstJsonSchema(open)) fail(`unclassified record rejected by JSON Schema: ${e}`);
  const r = validate(open);
  if (!r.valid) fail(`unclassified sim record rejected by schema.js: ${r.errors.map(e => e.field + ' ' + e.message).join('; ')}`);

  const live = { ...base, environment: 'live', setup: null, location: null, grade: null };
  if (!validate({ ...live, exit_time: null }).valid) fail('unclassified OPEN live record must validate (zero-touch)');
  const closed = validate(live);
  for (const k of ['setup', 'location', 'grade']) {
    if (!closed.errors.some(e => e.field === k)) fail(`unclassified CLOSED live record must fail on "${k}"`);
  }
  if (!validate({ ...live, setup: 'trend-continuation', location: 'pd-high', grade: 'A' }).valid) fail('classified closed live record must validate');
}

// A well-formed id is accepted by both checkers.
{
  const rec = { ...base, id: '2026-09-29-k3f9a' };
  for (const e of validateAgainstJsonSchema(rec)) fail(`valid id rejected by JSON Schema: ${e}`);
  const r = validate(rec);
  if (!r.valid) fail(`valid id rejected by schema.js: ${r.errors.map(e => e.field + ' ' + e.message).join('; ')}`);
}

const blank = emptyRecord();
if (validate(blank).valid) fail('emptyRecord() must not validate until the required fields are filled in');

if (failures.length) {
  console.error(`✗ journal schema check failed (${failures.length})`);
  for (const f of failures) console.error(`    ${f}`);
  process.exit(1);
}
console.log(`✓ journal schema v${JOURNAL_SCHEMA_VERSION} (taxonomy ${TAXONOMY_VERSION})`);
console.log(`✓ ${examples.length} example records validate under JSON Schema and schema.js`);
console.log(`✓ enums agree between journal-schema.json and schema.js`);
console.log(`✓ ${Object.keys(NEGATIVE).length} negative controls rejected by both checkers; impossible dates and newer taxonomy versions rejected by schema.js (a JSON Schema pattern cannot check those)`);
console.log(`✓ older taxonomy versions (${OLDER.join(', ')}) still validate, with a warning from schema.js`);
