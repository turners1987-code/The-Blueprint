/* ============================================================
   THE BLUEPRINT — Tools page (js/tools.js)
   Renders cards from data/tools.json, grouped by category.
   ============================================================ */

const DATA_URL = new URL('../data/tools.json', import.meta.url);

const STATUS = {
  'available':      { label: 'Available',      badge: 'badge--green' },
  'in-development': { label: 'In development', badge: 'badge--gold' },
  'planned':        { label: 'Planned',        badge: 'badge--cyan' },
};

// Section headings, keyed by category. Unlisted categories render as-is.
const CATEGORY_LABELS = { addons: 'Add-ons' };

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

function card(tool) {
  const c = el('article', 'card tool-card');

  const head = el('div', 'tool-card-head');
  head.append(el('h3', null, tool.display_name || tool.name));
  if (tool.version) head.append(el('span', 'tool-version', `v${tool.version}`));
  c.append(head);

  // The exact NinjaScript name, as it appears in NT8 after import.
  // Skipped when it would only repeat the heading.
  if (tool.display_name && tool.display_name !== tool.name) c.append(el('code', 'tool-ns-name', tool.name));

  const badges = el('div', 'tool-badges');
  const s = STATUS[tool.status];
  badges.append(el('span', `badge ${s.badge}`, s.label));
  if (tool.requires_orderflow) badges.append(el('span', 'badge badge--red', 'Order Flow+ required'));
  c.append(badges);

  c.append(el('p', 'tool-summary', tool.summary));
  if (tool.notes) c.append(el('p', 'tool-note', tool.notes));

  const actions = el('div', 'tool-actions');
  if (tool.file) {
    const a = el('a', 'btn btn--primary btn--sm', 'Download');
    a.href = tool.file;
    a.setAttribute('download', '');
    actions.append(a);
  } else {
    const b = el('button', 'btn btn--ghost btn--sm', 'Coming soon');
    b.type = 'button';
    b.disabled = true;
    actions.append(b);
  }
  if (tool.guide) {
    const g = el('a', 'btn btn--ghost btn--sm', 'Guide');
    g.href = tool.guide;
    actions.append(g);
  }
  c.append(actions);
  return c;
}

async function init() {
  const root = document.getElementById('tools-root');
  if (!root) return;
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const tools = await res.json();

    const groups = new Map();
    for (const t of tools) {
      if (!groups.has(t.category)) groups.set(t.category, []);
      groups.get(t.category).push(t);
    }
    root.replaceChildren();
    for (const [category, list] of groups) {
      const sec = el('section', 'tools-category');
      sec.append(el('h2', null, CATEGORY_LABELS[category] || category));
      const grid = el('div', 'tools-grid');
      list.forEach(t => grid.append(card(t)));
      sec.append(grid);
      root.append(sec);
    }
  } catch (err) {
    console.warn('Blueprint: could not load tools.', err);
    root.replaceChildren(el('p', 'tools-error', 'The tools list could not be loaded. Try reloading the page.'));
  }
}

init();
