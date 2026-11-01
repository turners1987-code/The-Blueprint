/* ============================================================
   THE BLUEPRINT — Glossary page (js/glossary.js)
   Renders the entries from data/glossary.json, A–Z under letter
   headers, and filters them as you type. The search matches the
   term, its aliases and its definition.
   ============================================================ */

const DATA_URL = new URL('../data/glossary.json', import.meta.url);

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const byTerm = (a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' });

// The small line under the definition: the entry's tags, then the
// module(s) that define it.
function tagLine(entry) {
  const parts = [...(entry.tags || [])];
  const mods = entry.module || [];
  if (mods.length) parts.push(`${mods.length > 1 ? 'Modules' : 'Module'} ${mods.join(', ')}`);
  return parts.join(' · ');
}

function entryNode(entry) {
  const n = el('div', 'glossary-entry');
  n.dataset.search = [entry.term, ...(entry.aliases || []), entry.definition].join(' ').toLowerCase();
  n.append(el('div', 'glossary-entry-term', entry.term));
  n.append(el('div', 'glossary-entry-def', entry.definition));
  const tags = tagLine(entry);
  if (tags) n.append(el('div', 'glossary-entry-tag', tags));
  return n;
}

const countText = (shown, total) =>
  shown === total ? `${total} terms` : `${shown} of ${total} terms`;

function render(root, entries) {
  root.replaceChildren();
  let letter = null;
  for (const e of [...entries].sort(byTerm)) {
    const first = e.term[0].toUpperCase();
    if (first !== letter) {
      letter = first;
      root.append(el('div', 'glossary-letter', letter));
    }
    root.append(entryNode(e));
  }
}

function wireSearch(root, input, count, total) {
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    let shown = 0;
    root.querySelectorAll('.glossary-entry').forEach(entry => {
      const hide = Boolean(q) && !entry.dataset.search.includes(q);
      entry.classList.toggle('hidden', hide);
      if (!hide) shown++;
    });
    // Hide letter headers with no visible entries
    root.querySelectorAll('.glossary-letter').forEach(letter => {
      let next = letter.nextElementSibling;
      let hasVisible = false;
      while (next && !next.classList.contains('glossary-letter')) {
        if (!next.classList.contains('hidden')) hasVisible = true;
        next = next.nextElementSibling;
      }
      letter.style.display = (!q || hasVisible) ? '' : 'none';
    });
    if (count) count.textContent = countText(shown, total);
  });
}

async function init() {
  const root = document.getElementById('glossary-container');
  const input = document.getElementById('glossary-search');
  const count = document.getElementById('glossary-count');
  if (!root) return;
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const entries = await res.json();
    render(root, entries);
    if (count) count.textContent = countText(entries.length, entries.length);
    if (input) wireSearch(root, input, count, entries.length);
  } catch (err) {
    console.warn('Blueprint: could not load the glossary.', err);
    root.replaceChildren(el('p', 'glossary-error', 'The glossary could not be loaded. Try reloading the page.'));
  }
}

init();
