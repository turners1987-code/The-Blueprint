/* ============================================================
   THE BLUEPRINT — Module Index Grid (js/modules.js)
   Renders the module table on index.html from the module list
   in data/modules.json (loaded by js/progress.js).

   Published modules render as clickable rows linking to their
   page. Planned modules render as non-clickable rows marked
   "Coming soon" — no link to an empty page.
   ============================================================ */

(function () {
  const table = document.getElementById('module-table');
  if (!table) return;

  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const row = (m) => {
    const published = m.status === 'published';
    const head = `
          <div class="module-cell module-num">${escapeHtml(m.number)}</div>
          <div class="module-cell">
            <div class="module-title">${escapeHtml(m.title)}</div>
            <div class="module-desc">${escapeHtml(m.summary)}</div>
          </div>`;

    if (published) {
      const done = typeof Progress !== 'undefined' && Progress.isComplete(m.id);
      return `<a href="modules/${m.number}-${m.slug}.html" class="module-row${done ? ' completed' : ''}" data-module-id="${escapeHtml(m.id)}">${head}
          <div class="module-cell module-status">
            <div class="module-status-label">Status</div>
            <div class="module-status-value">Published</div>
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

  if (typeof Progress === 'undefined') return;

  Progress.ready
    .then((modules) => {
      table.innerHTML = modules.map(row).join('\n            ');
      Progress.updateUI();
    })
    .catch(() => {
      table.innerHTML = '<div class="module-cell">Module list unavailable.</div>';
    });
})();
