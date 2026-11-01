/* ============================================================
   THE BLUEPRINT — Copy for your AI (js/copy-page.js)
   Turns a lesson page into Markdown, for pasting into an AI
   assistant or saving as a .md file. Pure DOM, no dependencies.

   Opt in by placing this inside the page's header container:
     <div class="copy-page" data-copy-page>
       <button type="button" class="btn btn--ghost btn--sm copy-page-btn"
         data-copy-page-btn aria-describedby="copy-page-hint">Copy for your AI</button>
       <button type="button" class="copy-page-download" data-copy-page-download>Download .md</button>
       <span class="copy-page-hint" id="copy-page-hint" role="tooltip">…</span>
     </div>
   The block sits inside the page's [data-gate] container, so a
   locked page hides it with the lesson (css/main.css).

   What is read: the header (.module-header, or the first header in
   .module-page) and the lesson (.lesson-content, the container
   js/module-toc.js reads; .module-body on pages without one).
   Nav, the section index, the mark-complete zone, the module nav
   and the footer are never part of it.
   ============================================================ */

const SITE = 'https://bptrade.co';
const CLOSING = `\n\n---\nFrom The Blueprint, ${SITE}. Educational content; no trading results and no recommendation.`;

const SKIP = [
  'nav', 'footer', 'script', 'style', 'img', 'svg', 'picture', 'button', 'dialog', 'input', 'textarea',
  '.module-toc', '.module-complete-zone', '.module-nav', '.copy-page', '.habit-icon', '.tb-decoration',
].join(',');

const BLOCK = new Set(['P', 'DIV', 'UL', 'OL', 'TABLE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'BLOCKQUOTE', 'SECTION', 'HEADER', 'ARTICLE', 'ASIDE', 'PRE', 'FIGURE', 'HR', 'DL']);

// ── Page facts ─────────────────────────────────────────────────
const pageTitle = () => document.title.replace(/\s+[—-]\s+The Blueprint\s*$/, '').trim();

// The public URL: the page's og:url where it has one, so a copy made
// on a preview server still points at the live page.
function pageUrl() {
  const og = document.querySelector('meta[property="og:url"]');
  const u = new URL((og && og.content) || location.href);
  u.hash = '';
  return u.href;
}

const slug = () => location.pathname.split('/').pop().replace(/\.html?$/, '') || 'lesson';

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ── Inline content ─────────────────────────────────────────────
function inline(node, base) {
  let out = '';
  for (const n of node.childNodes) {
    if (n.nodeType === Node.TEXT_NODE) { out += n.textContent.replace(/\s+/g, ' '); continue; }
    if (n.nodeType !== Node.ELEMENT_NODE || n.matches(SKIP)) continue;
    const tag = n.tagName;
    if (tag === 'BR') { out += '\n'; continue; }
    const inner = inline(n, base);
    const t = inner.trim();
    if (!t) { out += inner; continue; }
    // Keep the spaces around an inline element outside its markers.
    const lead = inner.match(/^\s*/)[0] ? ' ' : '';
    const trail = inner.match(/\s*$/)[0] ? ' ' : '';
    if (tag === 'STRONG' || tag === 'B') out += `${lead}**${t}**${trail}`;
    else if (tag === 'EM' || tag === 'I') out += `${lead}*${t}*${trail}`;
    else if (tag === 'CODE') out += `${lead}\`${t}\`${trail}`;
    else if (tag === 'A' && n.getAttribute('href')) out += `${lead}[${t}](${new URL(n.getAttribute('href'), base).href})${trail}`;
    else out += inner;
  }
  return out;
}

const clean = (s) => s.split('\n').map((l) => l.replace(/ {2,}/g, ' ').trim()).join('\n').trim();
const text = (node, base) => clean(inline(node, base));
const oneLine = (node, base) => text(node, base).replace(/\n+/g, ' ');

// ── Blocks ─────────────────────────────────────────────────────
const quote = (blocks) => blocks.join('\n\n').split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n');

function list(el, base, depth = 0) {
  const ordered = el.tagName === 'OL';
  const pad = '   '.repeat(depth);
  return [...el.children].filter((li) => li.tagName === 'LI').map((li, i) => {
    const marker = ordered ? `${i + 1}. ` : '- ';
    const nested = [...li.children].filter((c) => c.tagName === 'UL' || c.tagName === 'OL');
    const copy = li.cloneNode(true);
    copy.querySelectorAll(':scope > ul, :scope > ol').forEach((c) => c.remove());
    const body = text(copy, base).replace(/\n/g, `\n${pad}   `);
    return [`${pad}${marker}${body}`, ...nested.map((c) => list(c, base, depth + 1))].join('\n');
  }).join('\n');
}

function table(el, base) {
  const rows = [...el.querySelectorAll('tr')].map((tr) =>
    [...tr.children].map((c) => oneLine(c, base).replace(/\|/g, '\\|')));
  if (!rows.length) return '';
  const width = Math.max(...rows.map((r) => r.length));
  const line = (r) => `| ${Array.from({ length: width }, (_, i) => r[i] || '').join(' | ')} |`;
  return [line(rows[0]), line(Array(width).fill('---')), ...rows.slice(1).map(line)].join('\n');
}

// Children of a container, as blocks. Runs of inline content
// between block elements become paragraphs.
function children(el, base, skip = null) {
  const out = [];
  let run = document.createElement('span');
  const flush = () => { const t = text(run, base); if (t) out.push(t); run = document.createElement('span'); };
  for (const n of el.childNodes) {
    if (n.nodeType === Node.ELEMENT_NODE && (n.matches(SKIP) || (skip && n.matches(skip)))) continue;
    if (n.nodeType === Node.ELEMENT_NODE && BLOCK.has(n.tagName)) { flush(); out.push(...blocks(n, base)); }
    else run.append(n.cloneNode(true));
  }
  flush();
  return out;
}

function blocks(el, base) {
  if (el.matches(SKIP)) return [];
  const tag = el.tagName;
  const cls = el.classList;

  if (/^H[1-6]$/.test(tag)) {
    const t = oneLine(el, base);
    return t ? [`${'#'.repeat(Math.min(Number(tag[1]), 4))} ${t}`] : [];
  }
  if (tag === 'UL' || tag === 'OL') return [list(el, base)];
  if (tag === 'TABLE') return [table(el, base)];
  if (tag === 'HR') return ['---'];
  if (tag === 'PRE') return ['```\n' + el.textContent.replace(/\n$/, '') + '\n```'];
  if (tag === 'BLOCKQUOTE') return [quote(children(el, base))];

  if (cls.contains('definition-box')) {
    const term = el.querySelector('.definition-term');
    const def = el.querySelector('.definition-text');
    return [`**${term ? oneLine(term, base) : ''}** — ${def ? text(def, base) : ''}`];
  }
  if (cls.contains('key-concept')) return [quote(['**Key concept**', ...children(el, base)])];
  if (cls.contains('example-box')) {
    const label = el.querySelector('.example-label');
    return ['### Worked case', ...(label ? [`*${oneLine(label, base)}*`] : []), ...children(el, base, '.example-label')];
  }
  if (cls.contains('apply-now')) return ['### Apply this now', ...children(el, base, '.apply-now-header')];
  if (cls.contains('callout')) {
    const title = el.querySelector('.callout-title');
    return [quote([...(title ? [`**${oneLine(title, base)}**`] : []), ...children(el, base, '.callout-title')])];
  }
  if (cls.contains('habit-card')) {
    const name = el.querySelector('.habit-name');
    const desc = el.querySelector('.habit-desc');
    return [`### ${name ? oneLine(name, base) : ''}`, ...(desc ? [text(desc, base)] : [])];
  }
  if (tag === 'P') { const t = text(el, base); return t ? [t] : []; }
  return children(el, base);
}

// ── The whole page ─────────────────────────────────────────────
function header(base, title) {
  const h = document.querySelector('.module-header') || document.querySelector('.module-page header');
  if (!h) return [];
  const out = [];
  const meta = h.querySelector('.module-meta');
  if (meta) out.push([...meta.children].map((c) => oneLine(c, base)).filter(Boolean).join(' · '));
  const rest = h.cloneNode(true);
  rest.querySelectorAll('.module-meta').forEach((m) => m.remove());
  for (const b of children(rest, base)) {
    // The h1 usually repeats the page title already at the top.
    if (/^# /.test(b) && b.slice(2).toLowerCase() === title.toLowerCase()) continue;
    out.push(b);
  }
  return out;
}

export function pageMarkdown() {
  const title = pageTitle();
  const url = pageUrl();
  const lesson = document.querySelector('.lesson-content') || document.querySelector('.module-body');
  const body = [...header(url, title), ...(lesson ? blocks(lesson, url) : [])];
  return `# ${title} — The Blueprint\nSource: ${url}\nCopied: ${today()}\n\n${body.join('\n\n')}${CLOSING}`;
}

// ── UI ─────────────────────────────────────────────────────────
const LABEL = 'Copy for your AI';

// Shown when the clipboard refuses (no permission, file://): the
// Markdown in a dialog, already selected, to copy by hand.
function showFallback(md, opener) {
  const dlg = document.createElement('dialog');
  dlg.className = 'copy-page-dialog';
  dlg.setAttribute('aria-labelledby', 'copy-page-dialog-title');
  const title = document.createElement('p');
  title.className = 'copy-page-dialog-title';
  title.id = 'copy-page-dialog-title';
  title.textContent = 'Copy this lesson by hand';
  const note = document.createElement('p');
  note.className = 'copy-page-dialog-note';
  note.textContent = 'The clipboard is not available here. The text below is selected: press Ctrl+C (or ⌘C), then paste it into your AI assistant.';
  const pre = document.createElement('pre');
  pre.className = 'copy-page-dialog-text';
  pre.tabIndex = 0;
  pre.textContent = md;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'btn btn--ghost btn--sm';
  close.textContent = 'Close';
  close.addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => { dlg.remove(); opener.focus(); });
  dlg.append(title, note, pre, close);
  document.body.append(dlg);
  dlg.showModal();
  pre.focus();
  const range = document.createRange();
  range.selectNodeContents(pre);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function download(md) {
  const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug()}.md`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function init() {
  const root = document.querySelector('[data-copy-page]');
  if (!root) return;
  const btn = root.querySelector('[data-copy-page-btn]');
  const dl = root.querySelector('[data-copy-page-download]');
  const status = document.createElement('span');
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  root.append(status);
  let timer = null;

  btn?.addEventListener('click', async () => {
    const md = pageMarkdown();
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('no clipboard');
      await navigator.clipboard.writeText(md);
      btn.textContent = 'Copied';
      status.textContent = 'Lesson copied to the clipboard as Markdown.';
      clearTimeout(timer);
      timer = setTimeout(() => { btn.textContent = LABEL; status.textContent = ''; }, 2000);
    } catch {
      showFallback(md, btn);
    }
  });
  dl?.addEventListener('click', () => download(pageMarkdown()));
}

init();
