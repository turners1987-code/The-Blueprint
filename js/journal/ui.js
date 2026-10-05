/* ============================================================
   THE BLUEPRINT — Journal page UI (js/journal/ui.js)
   ============================================================
   The page behind journal.html: log a trade, edit it, back it up.

   ARCHITECTURE (enforced by scripts/check.mjs, check 10): this
   file imports only js/journal/schema.js, js/journal/analysis.js
   and js/journal/storage.js. It never opens a browser store of its
   own and it never names a concrete backend — every read and write
   goes through the storage facade, awaited. That is what lets a
   hosted backend replace the adapters later without touching this
   file.
   ============================================================ */

import * as storage from './storage.js';
import {
  validate, emptyRecord, TAXONOMY_VERSION,
  SETUPS, LOCATIONS, TRIGGERS, CONFIRMATIONS, GRADES, ENVIRONMENTS,
  EXECUTION_MARKS, DIRECTIONS,
} from './schema.js';
import { INSTRUMENTS } from './analysis.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const RECENT_LIMIT = 30;
const EXPORT_WARN_DAYS = 7;

// slug -> display label, for anything rendered back to the page.
const LABELS = {};
for (const list of [SETUPS, LOCATIONS, TRIGGERS, CONFIRMATIONS, GRADES, ENVIRONMENTS]) {
  for (const entry of list) LABELS[entry.slug] = entry.label;
}
const label = (slug, dash = '—') =>
  (slug === null || slug === undefined || slug === '') ? dash : (LABELS[slug] || slug);

const GRADE_BADGE = { 'A+': 'badge--green', 'A': 'badge--green', 'B': 'badge--gold', 'C': 'badge--red' };

let editingId = null; // id of the record loaded into the form, or null

// ── Populating the form from the schema's own vocabularies ────

function fillSelect(select, entries, placeholder) {
  for (const { slug, label: text } of entries) {
    select.add(new Option(text, slug));
  }
  select.insertBefore(new Option(placeholder, ''), select.options[0]);
}

function populateForm() {
  fillSelect($('f-setup'), SETUPS, '— choose —');
  fillSelect($('f-location'), LOCATIONS, '— choose —');
  fillSelect($('f-trigger'), TRIGGERS, '— none —');
  fillSelect($('f-grade'), GRADES, '— choose —');
  fillSelect($('f-environment'), ENVIRONMENTS, '— choose —');
  fillSelect($('f-direction'), DIRECTIONS.map((d) => ({ slug: d, label: d[0].toUpperCase() + d.slice(1) })), '— choose —');
  fillSelect($('f-execution-mark'), EXECUTION_MARKS.map((m) => ({ slug: m, label: m })), '— unmarked —');
  $('instrument-list').append(...Object.keys(INSTRUMENTS).map((sym) => new Option(sym)));
  $('f-confirmation').append(...CONFIRMATIONS.map(({ slug, label: text }) => {
    const lab = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.value = slug;
    lab.append(box, document.createTextNode(` ${text}`));
    return lab;
  }));
}

// ── Form <-> record ───────────────────────────────────────────

// "2026-10-05T09:52" (a datetime-local value, the user's wall clock)
// -> "2026-10-05T09:52:00-04:00", with this browser's offset.
function isoFromLocal(value) {
  if (!value) return null;
  let v = value;
  if (v.length === 16) v += ':00';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const off = d.getTimezoneOffset(); // minutes WEST of UTC
  const sign = off <= 0 ? '+' : '-';
  const abs = Math.abs(off);
  const pad = (n) => String(n).padStart(2, '0');
  return `${v}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function readForm() {
  const rec = emptyRecord(); // fresh each time: nothing stale survives an edit
  rec.id = $('f-id').value || null;
  rec.session_date = $('f-session-date').value || null;
  rec.instrument = $('f-instrument').value.trim() || null;
  rec.direction = $('f-direction').value || null;
  rec.environment = $('f-environment').value || null;
  rec.entry_time = isoFromLocal($('f-entry-time').value);
  rec.exit_time = isoFromLocal($('f-exit-time').value);
  rec.setup = $('f-setup').value || null;
  rec.location = $('f-location').value || null;
  rec.trigger = $('f-trigger').value || null;
  rec.confirmation = [...$('f-confirmation').querySelectorAll('input:checked')].map((cb) => cb.value);
  rec.grade = $('f-grade').value || null;
  rec.intended_price = num($('f-intended-price').value);
  rec.actual_fill = num($('f-actual-fill').value);
  rec.stop_price = num($('f-stop-price').value);
  rec.target_price = num($('f-target-price').value);
  rec.size = num($('f-size').value);
  rec.r_multiple = num($('f-r-multiple').value);
  rec.mae_ticks = num($('f-mae-ticks').value);
  rec.mfe_ticks = num($('f-mfe-ticks').value);
  rec.time_in_trade_seconds = num($('f-time-in-trade').value);
  rec.commissions = num($('f-commissions').value);
  rec.execution_mark = $('f-execution-mark').value || null;
  rec.tags = $('f-tags').value.split(',').map((t) => t.trim()).filter(Boolean);

  // Time in trade can be worked out; do not make the trader subtract clocks.
  if (rec.time_in_trade_seconds === null && rec.entry_time && rec.exit_time) {
    const seconds = (Date.parse(rec.exit_time) - Date.parse(rec.entry_time)) / 1000;
    if (Number.isFinite(seconds) && seconds > 0) rec.time_in_trade_seconds = Math.round(seconds);
  }
  return rec;
}

function fillForm(rec) {
  $('f-id').value = rec.id || '';
  $('f-session-date').value = rec.session_date || '';
  $('f-instrument').value = rec.instrument || '';
  $('f-direction').value = rec.direction || '';
  $('f-environment').value = rec.environment || '';
  // Wall time as recorded; saving re-stamps it with today's offset.
  $('f-entry-time').value = rec.entry_time ? rec.entry_time.slice(0, 16) : '';
  $('f-exit-time').value = rec.exit_time ? rec.exit_time.slice(0, 16) : '';
  $('f-setup').value = rec.setup || '';
  $('f-location').value = rec.location || '';
  $('f-trigger').value = rec.trigger || '';
  for (const cb of $('f-confirmation').querySelectorAll('input')) {
    cb.checked = Array.isArray(rec.confirmation) && rec.confirmation.includes(cb.value);
  }
  $('f-grade').value = rec.grade || '';
  $('f-intended-price').value = rec.intended_price ?? '';
  $('f-actual-fill').value = rec.actual_fill ?? '';
  $('f-stop-price').value = rec.stop_price ?? '';
  $('f-target-price').value = rec.target_price ?? '';
  $('f-size').value = rec.size ?? '';
  $('f-r-multiple').value = rec.r_multiple ?? '';
  $('f-mae-ticks').value = rec.mae_ticks ?? '';
  $('f-mfe-ticks').value = rec.mfe_ticks ?? '';
  $('f-time-in-trade').value = rec.time_in_trade_seconds ?? '';
  $('f-commissions').value = rec.commissions ?? '';
  $('f-execution-mark').value = rec.execution_mark || '';
  $('f-tags').value = Array.isArray(rec.tags) ? rec.tags.join(', ') : '';
}

// ── Validation display: per field, never one blob ──────────────

const baseField = (field) => field.replace(/\[.*$/, '');

function clearErrors() {
  for (const el of document.querySelectorAll('.field-error')) el.textContent = '';
  for (const el of form.elements) el.removeAttribute('aria-invalid');
}

function showErrors(errors) {
  const elsewhere = [];
  for (const { field, message } of errors) {
    const el = $(`err-${baseField(field)}`);
    if (el) {
      el.textContent = el.textContent ? `${el.textContent} ${message}` : message;
      const input = form.querySelector(`[name="${baseField(field)}"]`);
      if (input) input.setAttribute('aria-invalid', 'true');
    } else {
      elsewhere.push(`${field} ${message}`);
    }
  }
  return elsewhere;
}

function message(text, kind = 'cyan') {
  const box = $('form-messages');
  if (!text) { box.hidden = true; box.textContent = ''; return; }
  box.className = `callout ${kind === 'red' ? 'callout--red' : kind === 'green' ? 'callout--green' : 'callout--cyan'}`;
  box.textContent = text;
  box.hidden = false;
}

// ── Storage status line ────────────────────────────────────────

const BACKEND_LABEL = {
  local: 'Browser storage — this browser, this device',
  fs: 'Journal folder — one JSON file per trade',
};

async function renderStatus() {
  const line = $('storage-line');
  const text = $('storage-text');
  const facts = $('storage-facts');
  let info = null;
  try { info = await storage.init(); } catch (e) { info = { ok: false, reason: e && e.message }; }

  const which = (info && info.backend) || (await storage.backend());
  const friendly = BACKEND_LABEL[which] || 'No store yet';
  line.classList.toggle('is-bad', !(info && info.ok));
  text.textContent = info && info.ok ? friendly : `${friendly} — ${info && info.reason ? info.reason : 'not available'}`;

  // Buttons: the folder store needs a gesture to pick or re-grant.
  const needsGrant = which === 'fs' && info && !info.ok &&
    ['permission-prompt', 'permission-denied'].includes(info.code);
  $('btn-regrant').hidden = !needsGrant;
  $('btn-folder').hidden = which !== 'fs';
  $('btn-usefs').hidden = !(which === 'local' && (await storage.fsSupported()));

  try {
    const s = await storage.stats();
    const kb = s.bytes ? ` · ${(s.bytes / 1024).toFixed(1)} KB` : '';
    const range = s.count ? ` · ${s.oldest} → ${s.newest}` : '';
    facts.textContent = s.count ? `${s.count} trade${s.count === 1 ? '' : 's'}${range}${kb}` : 'empty';
  } catch { facts.textContent = ''; }
}

// ── Last export ────────────────────────────────────────────────

function fmtWhen(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

async function renderExportStatus() {
  const el = $('export-status');
  let meta = {};
  try { meta = await storage.getMeta(); } catch { /* unreadable is "never" */ }
  const when = meta.lastExport;
  if (!when) {
    el.innerHTML = '<div class="callout callout--cyan">No export yet. Keep a copy outside this store.</div>';
    return;
  }
  const age = (Date.now() - Date.parse(when)) / 86400000;
  if (Number.isFinite(age) && age > EXPORT_WARN_DAYS) {
    el.innerHTML = `<div class="callout callout--red"><div class="callout-title">Last export ${esc(fmtWhen(when))} — more than ${EXPORT_WARN_DAYS} days ago</div>Export a fresh copy. This store is the only place these trades exist.</div>`;
  } else {
    el.innerHTML = `<p class="field-hint">Last export: ${esc(fmtWhen(when))}.</p>`;
  }
}

// ── Recent trades ──────────────────────────────────────────────

const fmtR = (x) => (x === null || x === undefined ? '' : `${x >= 0 ? '+' : ''}${x.toFixed(2)}R`);

function tradeRow(rec) {
  const time = rec.entry_time ? rec.entry_time.slice(11, 16) : '';
  const grade = rec.grade
    ? `<span class="badge ${GRADE_BADGE[rec.grade] || 'badge--cyan'}" title="Grade (the plan)">${esc(rec.grade)}</span>` : '';
  const env = rec.environment && rec.environment !== 'live'
    ? `<span class="badge badge--cyan">${esc(rec.environment)}</span>` : '';
  const outcome = rec.r_multiple === null || rec.r_multiple === undefined
    ? '<span class="badge badge--gold">open</span>'
    : `<span class="trade-r ${rec.r_multiple >= 0 ? 'text-green' : 'text-red'}">${fmtR(rec.r_multiple)}</span>`;
  return `
    <button type="button" class="trade-item${rec.id === editingId ? ' editing' : ''}" data-id="${esc(rec.id)}">
      <span class="trade-when">${esc(rec.session_date)}${time ? ` <span>${esc(time)}</span>` : ''}</span>
      <span class="trade-what"><strong>${esc(label(rec.setup))}</strong> · ${esc(label(rec.location))} · ${esc(rec.direction || '—')}${rec.instrument ? ` · ${esc(rec.instrument)}` : ''}</span>
      ${grade}${env}${outcome}
    </button>`;
}

async function renderList() {
  const host = $('trade-list');
  let records;
  try {
    records = await storage.list();
  } catch (e) {
    host.innerHTML = `<div class="callout callout--red"><div class="callout-title">The journal could not be read</div>${esc(e && e.message ? e.message : String(e))}</div>`;
    return;
  }
  if (!records.length) {
    host.innerHTML = '<p class="field-hint">No trades yet. The first one goes in above.</p>';
    return;
  }
  const shown = records.slice(0, RECENT_LIMIT);
  const rest = records.length - shown.length;
  host.innerHTML = shown.map(tradeRow).join('') +
    (rest > 0 ? `<p class="field-hint">… ${rest} older trade${rest === 1 ? '' : 's'} not shown. Export for the full history.</p>` : '');
}

// ── Save / edit / delete ───────────────────────────────────────

let form;

function setEditing(rec) {
  editingId = rec.id || null;
  fillForm(rec);
  clearErrors();
  message('');
  $('btn-delete').hidden = !editingId;
  $('form-status').textContent = '';
}

function resetForm() {
  setEditing(emptyRecord());
}

async function refresh() {
  await Promise.all([renderStatus(), renderList(), renderExportStatus()]);
}

function wireForm() {
  form = $('trade-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    message('');
    const rec = readForm();
    const { valid, errors, warnings } = validate(rec);
    const elsewhere = showErrors(errors);
    if (warnings.length) {
      message(warnings.map((w) => `${w.field}: ${w.message}`).join(' · '), 'cyan');
    }
    if (!valid) {
      if (elsewhere.length) message(elsewhere.join(' · '), 'red');
      $('form-status').textContent = 'Fix the highlighted fields.';
      return;
    }
    try {
      const saved = await storage.put(rec);
      resetForm();
      $('form-status').textContent = `Saved ${saved.id}`;
      await refresh();
    } catch (err) {
      if (err && Array.isArray(err.errors)) {
        const left = showErrors(err.errors);
        if (left.length) message(left.join(' · '), 'red');
        $('form-status').textContent = 'The store rejected the record.';
      } else {
        message(err && err.message ? err.message : String(err), 'red');
      }
    }
  });

  $('btn-new').addEventListener('click', () => {
    resetForm();
    $('f-session-date').focus();
  });

  $('btn-delete').addEventListener('click', async () => {
    if (!editingId) return;
    if (!window.confirm(`Delete trade ${editingId}? This cannot be undone.`)) return;
    try {
      await storage.remove(editingId);
      resetForm();
      $('form-status').textContent = `Deleted ${editingId}`;
      await refresh();
    } catch (err) {
      message(err && err.message ? err.message : String(err), 'red');
    }
  });

  $('trade-list').addEventListener('click', async (e) => {
    const item = e.target.closest('.trade-item');
    if (!item) return;
    try {
      const rec = await storage.get(item.dataset.id);
      if (!rec) { await renderList(); return; }
      setEditing(rec);
      $('trade-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('f-session-date').focus();
    } catch (err) {
      message(err && err.message ? err.message : String(err), 'red');
    }
  });
}

// ── Export / import ────────────────────────────────────────────

function wireBackup() {
  $('btn-export').addEventListener('click', async () => {
    try {
      const json = await storage.exportAll();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blueprint-journal-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      await storage.setMeta({ lastExport: new Date().toISOString() });
      await renderExportStatus();
      await renderStatus();
    } catch (err) {
      message(err && err.message ? err.message : String(err), 'red');
    }
  });

  $('btn-import').addEventListener('click', () => $('import-file').click());

  $('import-file').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // let the same file be picked again
    if (!file) return;
    if (!window.confirm('Import replaces every trade in this store with the file’s contents. Continue?')) return;
    try {
      const text = await file.text();
      const { count } = await storage.importAll(text);
      resetForm();
      $('form-status').textContent = `Imported ${count} trade${count === 1 ? '' : 's'}`;
      await refresh();
    } catch (err) {
      if (err && Array.isArray(err.errors)) {
        const lines = err.errors.slice(0, 8).map((x) => `${x.record ? `${x.record}: ` : ''}${x.field} ${x.message}`);
        const more = err.errors.length > 8 ? ` (+${err.errors.length - 8} more)` : '';
        message(`Nothing was imported — the file has invalid records. ${lines.join(' · ')}${more}`, 'red');
      } else {
        message(err && err.message ? err.message : String(err), 'red');
      }
    }
  });
}

// ── Storage buttons (folder pick / re-grant) ───────────────────

function wireStorageButtons() {
  $('btn-regrant').addEventListener('click', async () => {
    const r = await storage.requestAccess();
    if (!r.ok) message(r.reason || 'Access was not granted.', 'red');
    await refresh();
  });

  $('btn-folder').addEventListener('click', async () => {
    const r = await storage.chooseFolder();
    if (!r.ok && r.code !== 'cancelled') message(r.reason || 'No folder was chosen.', 'red');
    await refresh();
  });

  $('btn-usefs').addEventListener('click', async () => {
    const r = await storage.useFileSystem();
    if (!r.ok && r.code !== 'cancelled') message(r.reason || 'No folder was chosen.', 'red');
    await refresh();
  });
}

// ── Boot ───────────────────────────────────────────────────────

function init() {
  populateForm();
  wireForm();
  wireBackup();
  wireStorageButtons();
  resetForm();
  refresh();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
