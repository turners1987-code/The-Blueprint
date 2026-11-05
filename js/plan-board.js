/* Plan Board v1: a stacked list of plans, each a chain of eight blocks.
   Stored in this browser only (localStorage). */
const KEY = 'bp-plan-board-v1';
const BLOCKS = [
  ['context', 'Context', 'Where the session opens: prior day range, gap, overnight range, scheduled news.'],
  ['level', 'Level', 'The named level you will act at.'],
  ['behavior', 'Behavior', 'What price must do at the level before you act.'],
  ['trigger', 'Trigger', 'The exact event that puts you in.'],
  ['invalidation', 'Invalidation', 'The price where the read is wrong.'],
  ['target', 'Target', 'Where you take profit.'],
  ['risk', 'Risk', 'Stop distance and size, in R.'],
  ['conviction', 'Conviction', 'Grade A+, A, B or C, with the reason.']
];

function load() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; }
  catch { return []; }
}
function save(plans) {
  try { localStorage.setItem(KEY, JSON.stringify(plans)); return true; }
  catch { return false; }
}

let plans = load();
const root = document.getElementById('pb-root');

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v);
  }
  for (const k of kids) n.append(k);
  return n;
}

function planText(p) {
  return [p.title || 'Untitled plan', ...BLOCKS.map(([id, label]) => `${label}: ${p.blocks[id] || ''}`)].join('\n');
}

function render() {
  root.replaceChildren();
  if (!plans.length) root.append(el('p', { class: 'pb-hint' }, 'No plans yet. Choose New plan.'));
  plans.forEach((p, i) => {
    const status = el('span', { class: 'pb-status' });
    const title = el('input', { type: 'text', 'aria-label': 'Plan title', placeholder: 'Plan title, e.g. date and instrument', value: p.title || '' });
    title.addEventListener('input', () => { p.title = title.value; save(plans); });
    const list = el('ol', { class: 'pb-blocks' });
    for (const [id, label, hint] of BLOCKS) {
      const ta = el('textarea', { id: `pb-${p.id}-${id}`, rows: '2' });
      ta.value = p.blocks[id] || '';
      ta.addEventListener('input', () => { p.blocks[id] = ta.value; save(plans); });
      list.append(el('li', { class: 'pb-block' },
        el('label', { for: ta.id }, label), el('span', { class: 'pb-hint' }, hint), ta));
    }
    const copy = el('button', { type: 'button', class: 'btn', onclick: async () => {
      try { await navigator.clipboard.writeText(planText(p)); status.textContent = 'Copied.'; }
      catch { status.textContent = 'Copy failed.'; }
    } }, 'Copy plan');
    const del = el('button', { type: 'button', class: 'btn', onclick: () => {
      if (!confirm('Delete this plan from this device?')) return;
      plans.splice(i, 1); save(plans); render();
    } }, 'Delete plan');
    root.append(el('section', { class: 'pb-plan' },
      el('div', { class: 'pb-plan-head' }, title), list, el('div', { class: 'pb-actions' }, copy, del, status)));
  });
}

document.getElementById('pb-add').addEventListener('click', () => {
  plans.unshift({ id: Date.now().toString(36), title: '', blocks: {} });
  save(plans); render();
});
render();
