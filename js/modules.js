/* ============================================================
   THE BLUEPRINT — Module Index Grid (js/modules.js)
   Renders the module table on index.html from the module list
   in data/modules.json (loaded by js/progress.js).

   Published modules render as clickable rows linking to their
   page. Planned modules render as non-clickable rows marked
   "Coming soon" — no link to an empty page.

   Tier is independent of status. A paid module that has a page
   (published or drafting) carries a small lock marker; a planned
   module never does — an unwritten module is not locked, it is
   unwritten. A row shows "Coming soon" or the lock, never both.
   ============================================================ */

import { Progress } from './progress.js';

const table = document.getElementById('module-table');
if (table) {

  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Inline SVG so it inherits colour; the text label is for screen readers.
  const LOCK = `<span class="module-lock" title="Full Access"><svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-.5V4.5A3.5 3.5 0 0 0 8 1zm-2 3.5a2 2 0 1 1 4 0V6H6V4.5z"/></svg><span class="sr-only">Full Access</span></span>`;

  const row = (m) => {
    // Published and drafting modules both have a page and link to it;
    // drafting ones carry a "Being revised" marker. Only planned ones don't.
    const drafting = m.status === 'drafting';
    const published = m.status === 'published' || drafting;
    const head = `
          <div class="module-cell module-num">${escapeHtml(m.number)}</div>
          <div class="module-cell">
            <div class="module-title">${escapeHtml(m.title)}</div>
            <div class="module-desc">${escapeHtml(m.summary)}</div>
          </div>`;

    if (published) {
      const done = Progress.isComplete(m.id);
      return `<a href="modules/${m.number}-${m.slug}.html" class="module-row${done ? ' completed' : ''}${drafting ? ' module-row--drafting' : ''}" data-module-id="${escapeHtml(m.id)}">${head}
          <div class="module-cell module-status">
            <div class="module-status-label">Status</div>
            <div class="module-status-value">${drafting ? 'Being revised' : 'Published'}${m.tier === 'paid' ? LOCK : ''}</div>
          </div>
          <div class="module-cell module-grade">
            <div class="module-grade-label">Grade</div>
            <div class="module-grade-value">—</div>
          </div>
          <div class="module-cell module-arrow">→</div>
          </a>`;
    }
    return `<div class="module-row module-row--planned" data-module-id="${escapeHtml(m.id)}">${head}
          <div class="module-cell module-status">
            <div class="module-status-value">Coming soon</div>
          </div>
          <div class="module-cell module-arrow"></div>
          </div>`;
  };

  // Group the grid by part, in this order, each with a heading.
  const PARTS = [
    { id: 'start',     label: 'Start' },
    { id: 'blueprint', label: 'The Blueprint' },
    { id: 'process',   label: 'Process' },
    { id: 'capstone',  label: 'Capstone' },
  ];

  const grid = (modules) => {
    const known = new Set(PARTS.map(p => p.id));
    // A part missing from PARTS still renders, after the known ones.
    const extra = [...new Set(modules.map(m => m.part))].filter(id => !known.has(id))
      .map(id => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }));
    return [...PARTS, ...extra].map(part => {
      const rows = modules.filter(m => m.part === part.id);
      if (!rows.length) return '';
      return `<h3 class="module-group-heading" data-part="${escapeHtml(part.id)}">${escapeHtml(part.label)}</h3>
            ${rows.map(row).join('\n            ')}`;
    }).filter(Boolean).join('\n            ');
  };

  Progress.ready
    .then((modules) => {
      table.innerHTML = grid(modules);
      Progress.updateUI();
    })
    .catch(() => {
      table.innerHTML = '<div class="module-cell">Module list unavailable.</div>';
    });
}
