/* ============================================================
   THE BLUEPRINT — Journal analysis page UI (js/journal/ui-analysis.js)
   ============================================================
   The page behind journal-analysis.html: reads the journal through
   the storage facade and renders what js/journal/analysis.js
   computes. Read-only — nothing here writes a record.

   ARCHITECTURE (enforced by scripts/check.mjs, check 10): this
   file imports only js/journal/schema.js, js/journal/analysis.js
   and js/journal/storage.js, never a concrete backend, and every
   call on the storage facade is awaited.
   ============================================================ */

import * as storage from './storage.js';
import * as A from './analysis.js';
import { SETUPS, LOCATIONS, TRIGGERS, GRADES } from './schema.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// slug -> label, so the page speaks the taxonomy's display names.
const LABELS = {};
for (const list of [SETUPS, LOCATIONS, TRIGGERS, GRADES]) {
  for (const entry of list) LABELS[entry.slug] = entry.label;
}
const label = (slug) => (slug === null || slug === undefined || slug === '' ? '—' : LABELS[slug] || slug);

// ── Formatting ────────────────────────────────────────────────
// A percentage always carries its own n, per the repo's rule that no
// statistic publishes without its sample size.

const fmtR = (x) => (x === null || x === undefined ? '—' : `${x >= 0 ? '+' : ''}${x.toFixed(2)}R`);
const rSpan = (x) => (x === null || x === undefined
  ? '<span class="num">—</span>'
  : `<span class="${x >= 0 ? 'text-green' : 'text-red'}">${fmtR(x)}</span>`);
const pct = (x, n) => (x === null || x === undefined
  ? '—'
  : `${(x * 100).toFixed(1)}% <span class="n-note">n ${n}</span>`);
const fmtDur = (s) => {
  if (s === null || s === undefined) return '—';
  const m = Math.round(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m}m`;
};
const orDash = (x) => (x === null || x === undefined || Number.isNaN(x) ? '—' : x);

// "occurrences only — not edge": the label every sim/replay series wears.
const OCC_NOTE = 'occurrences only — not edge';

// ── Small table builders ──────────────────────────────────────

const DIM_TITLE = { row: 'Sample too small to trust (under 30 trades or 20 sessions). Shown, never hidden.' };

function cohortTable(cohorts, keyName, firstCol, firstColTitle) {
  const rows = cohorts.map((c) => `
      <tr class="${c.dimmed ? 'dimmed' : ''}"${c.dimmed ? ` title="${esc(DIM_TITLE.row)}"` : ''}>
        <td>${esc(firstCol(c.keys[keyName]))}</td>
        <td class="num">${c.n}</td>
        <td class="num">${c.sessions}</td>
        <td class="num">${rSpan(c.expectancy)}</td>
        <td class="num">${pct(c.winRate, c.n)}</td>
        <td class="num">${orDash(c.totalR === null ? null : +c.totalR.toFixed(1))}</td>
      </tr>`);
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>${esc(firstColTitle)}</th><th class="num">n</th><th class="num">Sessions</th>
          <th class="num">Expectancy</th><th class="num">Win rate</th><th class="num">Total R</th>
        </tr></thead>
        <tbody>${rows.join('') || `<tr><td colspan="6">No closed live trades yet.</td></tr>`}</tbody>
      </table>
    </div>`;
}

// Sim and replay for one dimension: counts side by side, labelled.
// Even one sim trade shows here; none yet is said out loud, not blank.
function occurrencesTable(result, keyName, firstCol) {
  const keys = [...new Set([
    ...result.sim.map((c) => c.keys[keyName]),
    ...result.replay.map((c) => c.keys[keyName]),
  ])];
  if (!keys.length) {
    return `<p class="field-hint">No sim or replay trades in this view yet — ${esc(OCC_NOTE)}.</p>`;
  }
  const find = (list, k) => { const c = list.find((x) => x.keys[keyName] === k); return c ? c.n : 0; };
  const rows = keys.map((k) => `
      <tr>
        <td>${esc(firstCol(k))}</td>
        <td class="num">${find(result.sim, k)}</td>
        <td class="num">${find(result.replay, k)}</td>
      </tr>`);
  return `
    <div class="table-wrap mt-md">
      <table class="data-table">
        <caption>Sim &amp; replay — ${esc(OCC_NOTE)}</caption>
        <thead><tr><th>Cohort</th><th class="num">Sim n</th><th class="num">Replay n</th></tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>`;
}

function statsCell(c) {
  return `${c.n} trades · ${c.sessions} sessions · ${rSpan(c.expectancy)}`;
}

// ── Sections ──────────────────────────────────────────────────

function summarySection(s) {
  const live = s.live;
  const cards = `
    <div class="stat-row">
      <div class="card stat-card${live.dimmed ? ' dimmed' : ''}">
        <div class="stat-value ${live.expectancy !== null && live.expectancy < 0 ? 'text-red' : ''}">${fmtR(live.expectancy)}</div>
        <div class="stat-label">Expectancy (net)</div>
        <div class="stat-sub">n ${live.n} · ${live.sessions} sessions${live.dimmed ? ' · small sample' : ''}</div>
      </div>
      <div class="card stat-card${live.dimmed ? ' dimmed' : ''}">
        <div class="stat-value">${pct(live.winRate, live.n)}</div>
        <div class="stat-label">Win rate</div>
        <div class="stat-sub">${live.wins}W / ${live.losses}L / ${live.breakeven}BE</div>
      </div>
      <div class="card stat-card${live.dimmed ? ' dimmed' : ''}">
        <div class="stat-value">${live.profitFactor === null ? '—' : live.profitFactor.toFixed(2)}</div>
        <div class="stat-label">Profit factor</div>
        <div class="stat-sub">n ${live.n} · total ${fmtR(live.totalR)}</div>
      </div>
    </div>`;

  const noLive = live.n === 0
    ? '<p class="field-hint">No closed live trades yet — that is a result, not a missing page. Every live figure is blank until a live trade closes with an R multiple.</p>'
    : '';
  const openLine = `<p class="field-hint">Open trades: <strong>${s.open}</strong> — open trades are counted and never analysed. A blank figure above means either no closed live trade yet, or a trade still waiting on its exit.</p>`;

  const notes = [];
  if (live.unpriced) notes.push(`${live.unpriced} trade${live.unpriced === 1 ? '' : 's'} without commissions applied — those figures are gross R`);
  if (s.unknownEnvironment) notes.push(`${s.unknownEnvironment} record${s.unknownEnvironment === 1 ? '' : 's'} with no usable environment, counted only`);
  const simLine = ['sim', 'replay']
    .map((name) => {
      const v = s[name];
      return `${name}: ${v.n} occurrence${v.n === 1 ? '' : 's'} across ${v.sessions} session${v.sessions === 1 ? '' : 's'}`;
    })
    .join(' · ');

  return `
    <h2>Summary — live trades</h2>
    ${cards}
    ${noLive}
    ${openLine}
    <p class="field-hint"><span class="badge badge--cyan">${esc(OCC_NOTE)}</span> ${esc(simLine)}</p>
    ${notes.length ? `<p class="field-hint">${notes.map(esc).join(' · ')}</p>` : ''}`;
}

// Sim trades: behaviour and occurrence only. Deliberately has no R, win rate
// or expectancy figure, and is not styled as a result.
function simSection(sim) {
  const head = `
    <h2>Simulated trades — behaviour, not performance</h2>
    <div class="callout callout--cyan">
      <div class="callout-title">${esc(OCC_NOTE)}</div>
      These are simulated trades. This section counts how often things happened and describes how you traded. It is never pooled into an expectancy, and it says nothing about edge: simulated fills are more generous than live ones.
    </div>`;
  if (sim.n === 0) {
    return `${head}<p class="field-hint">No closed sim trades yet.</p>`;
  }
  const tick = (x) => (x === null || x === undefined ? '—' : `${Number.isInteger(x) ? x : x.toFixed(2)} t`);
  const countRow = (field, name, fmt) => {
    const entries = Object.entries(sim.counts[field]).sort((a, b) => b[1] - a[1]);
    const cells = entries.map(([k, c]) => `${esc(k === 'null' ? 'unclassified' : fmt(k))} <span class="n-note">${c}</span>`);
    return `<tr><td>${esc(name)}</td><td>${cells.join(' · ')}</td></tr>`;
  };
  const plain = (k) => k;
  return `
    ${head}
    <div class="stat-row mt-md">
      <div class="card stat-card${sim.dimmed ? ' dimmed' : ''}">
        <div class="stat-value">${sim.n}</div>
        <div class="stat-label">Sim trades closed</div>
        <div class="stat-sub">${sim.sessions} sessions${sim.dimmed ? ' · small sample' : ''}</div>
      </div>
      <div class="card stat-card${sim.dimmed ? ' dimmed' : ''}">
        <div class="stat-value">${sim.unclassified}</div>
        <div class="stat-label">Unclassified</div>
        <div class="stat-sub">missing a setup, location or grade</div>
      </div>
      <div class="card stat-card${sim.slippage.n === 0 || sim.dimmed ? ' dimmed' : ''}">
        <div class="stat-value">${tick(sim.slippage.medianTicks)}</div>
        <div class="stat-label">Median slippage vs intended</div>
        <div class="stat-sub">n ${sim.slippage.n} · worst ${tick(sim.slippage.worstTicks)} · positive = worse fill</div>
      </div>
    </div>
    <div class="table-wrap mt-md">
      <table class="data-table${sim.dimmed ? ' dimmed' : ''}">
        <caption>What you took — counts</caption>
        <thead><tr><th>Dimension</th><th>Trades</th></tr></thead>
        <tbody>
          ${countRow('setup', 'Setup', label)}
          ${countRow('location', 'Location', label)}
          ${countRow('grade', 'Grade', label)}
          ${countRow('instrument', 'Instrument', plain)}
          ${countRow('direction', 'Direction', plain)}
        </tbody>
      </table>
    </div>
    <div class="table-wrap mt-md">
      <table class="data-table${sim.dimmed ? ' dimmed' : ''}">
        <caption>How you traded — medians</caption>
        <thead><tr><th>Behaviour</th><th class="num">Median</th></tr></thead>
        <tbody>
          <tr><td>Heat taken (MAE)</td><td class="num">${tick(sim.maeTicksMedian)}</td></tr>
          <tr><td>Favourable excursion (MFE)</td><td class="num">${tick(sim.mfeTicksMedian)}</td></tr>
          <tr><td>Time in trade</td><td class="num">${fmtDur(sim.timeInTradeSecondsMedian)}</td></tr>
        </tbody>
      </table>
    </div>
    ${sim.mixedVersions ? '<p class="field-hint">These sim trades span taxonomy versions.</p>' : ''}
    <p class="rule-note">Sim is ${esc(OCC_NOTE)}. No win rate, R total or expectancy is shown for it, by design.</p>`;
}

function mixedSection(mv) {
  const counts = Object.entries(mv.versions).map(([v, n]) => `${v}: ${n}`).join(', ');
  if (!mv.mixed) {
    return `<p class="field-hint">All records are stamped taxonomy ${esc(mv.newest)} — no mixed versions.</p>`;
  }
  return `
    <div class="callout callout--cyan mt-lg">
      <div class="callout-title">Records span taxonomy versions (newest: ${esc(mv.newest)})</div>
      ${esc(counts)} — ${mv.flagged.length} record${mv.flagged.length === 1 ? '' : 's'} stamped with an older version. Cohorts that span versions say so below.
    </div>`;
}

function gateSection(g) {
  const row = (r, name) => `
      <tr class="${r.dimmed ? 'dimmed' : ''}">
        <td>${esc(name)}</td>
        <td class="num">${r.n}</td>
        <td class="num">${r.sessions}</td>
        <td class="num">${rSpan(r.expectancy)}</td>
        <td>${r.met ? '<span class="badge badge--green">enough</span>' : '<span class="badge badge--cyan">not yet</span>'}${r.commissionsComplete ? '' : ' <span class="badge badge--gold">commissions incomplete</span>'}</td>
        <td class="why">${esc(r.reasons.join('; ') || '—')}</td>
        <td class="num">${r.simTrades}</td>
        <td class="num">${r.replayTrades}</td>
      </tr>`;
  const head = `
      <thead><tr>
        <th></th><th class="num">Live n</th><th class="num">Sessions</th><th class="num">Expectancy (net)</th>
        <th>Enough history</th><th>Why</th><th class="num">Sim</th><th class="num">Replay</th>
      </tr></thead>`;
  const table = (rows, caption) => `
    <div class="table-wrap mt-md">
      <table class="data-table">
        <caption>${esc(caption)}</caption>
        ${head}
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  return `
    <h2>Enough of your own history?</h2>
    <p>Shown as met at ${g.gate.minLiveTrades} live trades, across ${g.gate.minSessions} distinct sessions, with expectancy of at least +${g.gate.minExpectancyR}R after commissions — all three, and every trade priced.</p>
    ${table(g.bySetup.map((r) => row(r, label(r.key))), 'Per setup')}
    ${table(g.byTrigger.map((r) => row(r, label(r.key))), 'Per trigger')}
    ${g.open ? `<p class="field-hint">${g.open} open trade${g.open === 1 ? '' : 's'} — an open trade has no R yet, so it cannot count toward your history.</p>` : ''}
    <p class="rule-note">Sim and replay columns are ${esc(OCC_NOTE)}; they never count toward your own history.</p>`;
}

function cohortSection(title, result, keyName, firstCol, firstColTitle) {
  return `
    <h2>${esc(title)}</h2>
    ${cohortTable(result.live, keyName, firstCol, firstColTitle)}
    ${occurrencesTable(result, keyName, firstCol)}`;
}

function disciplineSection(d) {
  const byGrade = cohortTable(d.live.byGrade, 'grade', label);
  const marks = ['Pass', 'Fail', 'unmarked'];
  const cell = (grade, mark) => {
    const c = d.live.grid.find((x) => x.keys.grade === grade && x.keys.execution_mark === mark);
    if (!c) return '<td class="num">—</td>';
    return `<td class="num${c.dimmed ? ' dimmed' : ''}">${c.n} · ${fmtR(c.expectancy)} <span class="n-note">${c.sessions} sess.</span></td>`;
  };
  const grid = `
    <div class="table-wrap mt-md">
      <table class="data-table">
        <caption>Grade × execution mark</caption>
        <thead><tr><th>Grade ↓ · Exit →</th>${marks.map((m) => `<th class="num">${esc(m)}</th>`).join('')}</tr></thead>
        <tbody>
          ${GRADES.map(({ slug }) => `<tr><td>${esc(label(slug))}</td>${marks.map((m) => cell(slug, m)).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  const apf = d.live.aPlusFail;
  return `
    <h2>Discipline</h2>
    <p>Grade is entry-plan compliance; the execution mark is exit compliance. The two are never merged into one score.</p>
    ${byGrade}
    ${grid}
    <div class="card card--red mt-lg${apf.dimmed ? ' dimmed' : ''}">
      <div class="callout-title text-red">A+ with a Fail exit — right plan, wrong finish</div>
      <p>${statsCell(apf)} <span class="n-note">${apf.n === 0 ? 'none yet — the most instructive cell stays empty until one happens' : `n ${apf.n} · ${apf.sessions} sessions${apf.dimmed ? ' · small sample' : ''}`}</span></p>
    </div>`;
}

function sequenceSection(q) {
  const live = q.live;
  const byNumber = `
    <div class="table-wrap">
      <table class="data-table">
        <caption>By trade number within the session</caption>
        <thead><tr><th>Trade №</th><th class="num">n</th><th class="num">Sessions</th><th class="num">Expectancy</th><th class="num">Win rate</th></tr></thead>
        <tbody>
          ${live.byTradeNumber.map((c) => `
            <tr class="${c.dimmed ? 'dimmed' : ''}">
              <td>${esc(c.tradeNumber)}</td><td class="num">${c.n}</td><td class="num">${c.sessions}</td>
              <td class="num">${rSpan(c.expectancy)}</td><td class="num">${pct(c.winRate, c.n)}</td>
            </tr>`).join('') || '<tr><td colspan="5">No closed live trades yet.</td></tr>'}
        </tbody>
      </table>
    </div>`;
  const rows = [['First of session', live.firstOfSession], ['After a win', live.afterWin], ['After a loss', live.afterLoss], ['After a breakeven', live.afterBreakeven]];
  const after = `
    <div class="table-wrap mt-md">
      <table class="data-table">
        <caption>By what the previous trade did</caption>
        <thead><tr><th></th><th class="num">n</th><th class="num">Sessions</th><th class="num">Expectancy</th><th class="num">Win rate</th></tr></thead>
        <tbody>
          ${rows.map(([name, c]) => `
            <tr class="${c.dimmed ? 'dimmed' : ''}">
              <td>${esc(name)}</td><td class="num">${c.n}</td><td class="num">${c.sessions}</td>
              <td class="num">${rSpan(c.expectancy)}</td><td class="num">${pct(c.winRate, c.n)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  return `<h2>Sequence</h2>${byNumber}${after}`;
}

function stopSection(st) {
  const live = st.live;
  const spread = (name, s) => `
    <div class="card stat-card${s.dimmed ? ' dimmed' : ''}">
      <div class="stat-value">${s.median === null ? '—' : `${s.median} t`}</div>
      <div class="stat-label">${esc(name)} — median MAE</div>
      <div class="stat-sub">n ${s.n} · p90 ${orDash(s.p90)} t · max ${orDash(s.max)} t</div>
    </div>`;
  const overlap = live.losersWithinWinnerRange === null ? '—' : pct(live.losersWithinWinnerRange, live.losers.n);
  const noMae = live.winners.n === 0 && live.losers.n === 0
    ? '<p class="field-hint">No closed live trades with MAE yet — the cards above stay blank until trades record how far price went against them.</p>'
    : '';
  const buckets = `
    <div class="table-wrap mt-md">
      <table class="data-table">
        <caption>MAE distribution (${live.bucketTicks}-tick buckets)</caption>
        <thead><tr><th class="num">MAE ticks</th><th class="num">Winners</th><th class="num">Losers</th></tr></thead>
        <tbody>
          ${live.buckets.map((b) => `
            <tr>
              <td class="num">${b.fromTicks}–${b.toTicks}</td>
              <td class="num">${b.winners}</td><td class="num">${b.losers}</td>
            </tr>`).join('') || '<tr><td colspan="3">No closed live trades with MAE yet.</td></tr>'}
        </tbody>
      </table>
    </div>`;
  return `
    <h2>Stop survival</h2>
    <div class="stat-row">${spread('Winners', live.winners)}${spread('Losers', live.losers)}
      <div class="card stat-card">
        <div class="stat-value">${overlap === '—' ? '—' : pct(live.losersWithinWinnerRange, live.losers.n)}</div>
        <div class="stat-label">Losers within the winners’ range</div>
        <div class="stat-sub">${overlap === '—' ? 'not enough data yet' : 'share of losers whose MAE sat under the winners’ p90'}</div>
      </div>
    </div>
    ${noMae}
    ${buckets}`;
}

function exitSection(e) {
  const live = e.live;
  const rows = live.bySetup.map((r) => `
      <tr class="${r.dimmed ? 'dimmed' : ''}">
        <td>${esc(label(r.setup))}</td>
        <td class="num">${r.n}</td>
        <td class="num">${r.sessions}</td>
        <td class="num">${rSpan(r.meanRealizedR)}</td>
        <td class="num">${r.meanMfeR === null ? '—' : `+${r.meanMfeR.toFixed(2)}R`}</td>
        <td class="num">${r.efficiency === null ? '—' : pct(r.efficiency, r.n)}</td>
        <td class="num">${r.givenBackR === null ? '—' : `${r.givenBackR.toFixed(2)}R`}</td>
      </tr>`);
  return `
    <h2>Exit efficiency</h2>
    <p>Realized R against the maximum favourable excursion, both in R. Efficiency is how much of the move was kept.</p>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>Setup</th><th class="num">n</th><th class="num">Sessions</th>
          <th class="num">Mean realized</th><th class="num">Mean MFE</th><th class="num">Efficiency</th><th class="num">Given back</th>
        </tr></thead>
        <tbody>${rows.join('') || '<tr><td colspan="7">No closed live trades with MFE yet.</td></tr>'}</tbody>
      </table>
    </div>
    ${live.unconverted ? `<p class="field-hint">${live.unconverted} trade${live.unconverted === 1 ? '' : 's'} left out (no MFE, no stop, or unknown instrument).</p>` : ''}`;
}

function durationSection(d) {
  const live = d.live;
  const row = (name, s) => `
      <tr class="${s.dimmed ? 'dimmed' : ''}">
        <td>${esc(name)}</td><td class="num">${s.n}</td><td class="num">${s.sessions}</td>
        <td class="num">${fmtDur(s.medianSeconds)}</td>
        <td class="num">${s.p25Seconds === null ? '—' : fmtDur(s.p25Seconds)} – ${s.p75Seconds === null ? '—' : fmtDur(s.p75Seconds)}</td>
        <td class="num">${s.meanSeconds === null ? '—' : fmtDur(s.meanSeconds)}</td>
      </tr>`;
  const ratio = live.loserToWinnerMedian;
  const noDuration = live.winners.n === 0 && live.losers.n === 0
    ? '<p class="field-hint">No closed live trades with a time in trade yet.</p>'
    : '';
  return `
    <h2>Time in trade</h2>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th></th><th class="num">n</th><th class="num">Sessions</th><th class="num">Median</th><th class="num">Middle half</th><th class="num">Mean</th></tr></thead>
        <tbody>${row('Winners', live.winners)}${row('Losers', live.losers)}</tbody>
      </table>
    </div>
    ${noDuration}
    ${ratio !== null ? `<p class="field-hint">Losers are held ${ratio.toFixed(2)}× as long as winners (median).</p>` : ''}`;
}

// ── Boot ───────────────────────────────────────────────────────

// One section = one heading + one renderer. A section that throws
// degrades to its heading and an error note of its own; the rest of
// the page still renders. No section can blank the page.
function renderSections(sections) {
  return sections.map(({ title, render }) => {
    try {
      return render();
    } catch (e) {
      const why = e && e.message ? e.message : String(e);
      return `
        <section>
          <h2>${esc(title)}</h2>
          <div class="callout callout--red">
            <div class="callout-title">This section could not be rendered</div>
            ${esc(why)}
          </div>
        </section>`;
    }
  }).join('\n');
}

async function run() {
  const root = $('analysis-root');
  let records;
  try {
    records = await storage.list();
  } catch (err) {
    $('storage-line').classList.add('is-bad');
    $('storage-text').textContent = 'The journal could not be read.';
    root.innerHTML = `
      <div class="callout callout--red">
        <div class="callout-title">${esc(err && err.message ? err.message : String(err))}</div>
        Open <a href="journal.html">the journal page</a> to re-grant folder access or choose a different store.
      </div>`;
    return;
  }

  const which = (await storage.backend());
  $('storage-text').textContent = which === 'fs' ? 'Journal folder' : 'Browser storage';
  try {
    const s = await storage.stats();
    $('storage-facts').textContent = s.count
      ? `${s.count} trade${s.count === 1 ? '' : 's'} · ${s.oldest} → ${s.newest}`
      : 'empty';
  } catch { /* facts are optional */ }

  if (!records.length) {
    root.innerHTML = `
      <div class="callout callout--cyan">
        <div class="callout-title">No trades in the journal yet</div>
        Analysis needs records. <a href="journal.html">Log the first trade</a>.
      </div>`;
    return;
  }

  const sum = A.summary(records);
  root.innerHTML = renderSections([
    { title: 'Summary — live trades', render: () => summarySection(sum) },
    { title: 'Taxonomy versions', render: () => mixedSection(sum.mixedVersions) },
    { title: 'Simulated trades — behaviour, not performance', render: () => simSection(A.simStats(records.filter((r) => r.environment === 'sim'))) },
    { title: 'Enough of your own history?', render: () => gateSection(A.gateTwoStatus(records)) },
    { title: 'Expectancy by setup', render: () => cohortSection('Expectancy by setup', A.byDimension(records, 'setup'), 'setup', label, 'Setup') },
    { title: 'Expectancy by trigger', render: () => cohortSection('Expectancy by trigger', A.byDimension(records, 'trigger'), 'trigger', label, 'Trigger') },
    { title: 'Expectancy by grade', render: () => cohortSection('Expectancy by grade', A.byDimension(records, 'grade'), 'grade', label, 'Grade') },
    { title: 'Time of day', render: () => cohortSection('Time of day', A.byDimension(records, 'time_bucket'), 'time_bucket', (k) => k, 'Entry window (New York)') },
    { title: 'Discipline', render: () => disciplineSection(A.disciplineCohorts(records)) },
    { title: 'Sequence', render: () => sequenceSection(A.sequenceEffects(records)) },
    { title: 'Stop survival', render: () => stopSection(A.stopSurvival(records)) },
    { title: 'Exit efficiency', render: () => exitSection(A.exitEfficiency(records)) },
    { title: 'Time in trade', render: () => durationSection(A.durationSignature(records)) },
  ]);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
else run();
