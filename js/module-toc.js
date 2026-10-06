/* ============================================================
   THE BLUEPRINT — Module section index (module-toc.js)
   Renders a jump list of a lesson's section headings into
   [data-module-toc]. Pure DOM: nothing is listed per page.

   Opt in by placing <nav class="module-toc" data-module-toc
   aria-label="On this page"></nav> above .lesson-content. No
   container, or fewer than MIN_SECTIONS headings, renders nothing.

   Section headings are the lesson's h2s; a lesson that has none
   (the current modules go h1 straight to h3) uses its h3s.
   ============================================================ */

const MIN_SECTIONS = 3;

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function sectionHeadings(lesson) {
  const h2 = lesson.querySelectorAll('h2');
  return h2.length ? [...h2] : [...lesson.querySelectorAll('h3')];
}

function ensureIds(headings) {
  const used = new Set([...document.querySelectorAll('[id]')].map((el) => el.id));
  for (const h of headings) {
    if (h.id) continue;
    const base = slugify(h.textContent);
    let id = base;
    for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
    used.add(id);
    h.id = id;
  }
}

function render(container, headings) {
  const label = document.createElement('p');
  label.className = 'module-toc-label';
  label.textContent = 'In this module';

  const list = document.createElement('ul');
  list.className = 'module-toc-list';
  for (const h of headings) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${h.id}`;
    a.textContent = h.textContent;
    li.append(a);
    list.append(li);
  }
  container.replaceChildren(label, list);
}

// Mark the link for the section the reader is in. The observation band
// is a strip below the fixed nav; the last heading to cross into it wins.
function trackCurrent(container, headings) {
  if (!('IntersectionObserver' in window)) return;
  const links = new Map(
    [...container.querySelectorAll('a')].map((a) => [a.getAttribute('href').slice(1), a])
  );
  let current = null;
  const setCurrent = (id) => {
    if (id === current) return;
    current = id;
    for (const [key, a] of links) {
      if (key === id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) setCurrent(entry.target.id);
    }
  }, { rootMargin: '-80px 0px -70% 0px' });
  headings.forEach((h) => observer.observe(h));
}

function init() {
  const container = document.querySelector('[data-module-toc]');
  const lesson = document.querySelector('.lesson-content');
  if (!container || !lesson) return;

  const headings = sectionHeadings(lesson);
  if (headings.length < MIN_SECTIONS) return;

  ensureIds(headings);
  render(container, headings);
  trackCurrent(container, headings);
}

init();
