/* ============================================================
   THE BLUEPRINT — Lesson player and segment layout (lesson-player.js)
   Opt in with data-lesson="<url of lesson config>" on .module-body.
   See js/lesson-core.js for the config shape.

   Layout: the lesson's h2 sections are grouped into segments; a
   sidebar lists them and one segment shows at a time. The last
   segment and the position inside it are remembered per module.
   Player: a segment with slides/cues gets slides, captions and a
   clickable transcript driven by one clock. With no audio file the
   clock is a timer, so the pilot works before narration exists.
   Without JS, or if the config fails to load, the whole lesson shows.
   ============================================================ */

import { activeIndex, formatTime, validateConfig, assignSections, loadResume, saveResume } from './lesson-core.js';

const body = document.querySelector('.module-body[data-lesson]');
const lesson = document.querySelector('.lesson-content');
if (body && lesson) init(body, lesson).catch(() => { /* leave the full lesson visible */ });

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v; else n.setAttribute(k, v);
  }
  n.append(...kids);
  return n;
}

function store() {
  try { return window.localStorage; } catch { return { getItem: () => null, setItem: () => {} }; }
}

async function init(body, lesson) {
  const res = await fetch(new URL(body.dataset.lesson, document.baseURI));
  if (!res.ok) return;
  const config = await res.json();
  if (validateConfig(config).length) return;

  const segs = config.segments;
  const headings = [...lesson.querySelectorAll(':scope > h2')];
  const owners = assignSections(headings.map((h) => h.textContent.trim()), segs);

  // Group the lesson's children into one <section> per segment.
  const panels = segs.map((s) => el('section', { class: 'lesson-segment', 'data-segment': s.id, hidden: '' }));
  let owner = 0;
  for (const child of [...lesson.children]) {
    const hi = headings.indexOf(child);
    if (hi >= 0) owner = owners[hi];
    panels[owner].append(child);
  }
  lesson.replaceChildren(...panels);

  const saved = loadResume(store(), config.module, segs.length);
  const state = { segment: saved.segment, positions: saved.positions };
  const persist = () => saveResume(store(), config.module, state);

  // Sidebar
  const nav = el('nav', { class: 'lesson-sidebar', 'aria-label': 'Lesson segments' });
  const list = el('ol', { class: 'lesson-sidebar-list' });
  const buttons = segs.map((s, i) => {
    const b = el('button', { type: 'button', class: 'lesson-sidebar-btn' }, `${i + 1}. ${s.title}`);
    b.addEventListener('click', () => show(i));
    list.append(el('li', {}, b));
    return b;
  });
  nav.append(el('p', { class: 'module-toc-label' }, 'Segments'), list);
  const toc = document.querySelector('[data-module-toc]');
  if (toc) toc.hidden = true; // the sidebar replaces the section index
  body.querySelector('.container').classList.add('lesson-layout');
  lesson.before(nav);

  // Player (one instance, re-pointed at the shown segment)
  let player = null;
  function mountPlayer(i) {
    player?.destroy();
    player = null;
    const seg = segs[i];
    if (!(seg.slides?.length || seg.cues?.length)) return;
    player = createPlayer(seg, state.positions[seg.id] || 0, (t) => {
      state.positions[seg.id] = t;
      persist();
    });
    panels[i].prepend(player.root);
  }

  function show(i) {
    state.segment = i;
    panels.forEach((p, k) => { p.hidden = k !== i; });
    buttons.forEach((b, k) => {
      if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    mountPlayer(i);
    persist();
  }

  // A link to a heading inside a hidden segment opens that segment.
  window.addEventListener('hashchange', openHash);
  function openHash() {
    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    const panel = target?.closest('.lesson-segment');
    if (panel) show(panels.indexOf(panel));
  }

  show(saved.segment);
  openHash();
}

function createPlayer(seg, startAt, onPosition) {
  const slides = seg.slides || [];
  const cues = seg.cues || [];
  const duration = seg.duration || Math.max(0, ...slides.map((s) => s.start), ...cues.map((c) => c.start)) + 5;

  const stage = el('div', { class: 'lesson-stage', role: 'img', 'aria-label': 'Slide' });
  const caption = el('p', { class: 'lesson-caption', 'aria-live': 'off' });
  const playBtn = el('button', { type: 'button', class: 'btn btn--ghost btn--sm' }, 'Play');
  const range = el('input', { type: 'range', min: '0', max: String(duration), step: '1', value: '0', 'aria-label': 'Position' });
  const clock = el('span', { class: 'lesson-clock' }, '0:00');
  const transcript = el('ol', { class: 'lesson-transcript' });
  const cueItems = cues.map((c) => {
    const b = el('button', { type: 'button', class: 'lesson-cue' }, c.text);
    b.addEventListener('click', () => seek(c.start));
    const li = el('li', {}, b);
    transcript.append(li);
    return b;
  });
  const details = el('details', { class: 'lesson-transcript-wrap' }, el('summary', {}, 'Transcript'), transcript);
  const root = el('div', { class: 'lesson-player' },
    el('div', { class: 'lesson-controls' }, playBtn, range, clock), stage, caption, details);
  if (!slides.length) stage.hidden = true;
  if (!cues.length) { caption.hidden = true; details.hidden = true; }

  const audio = seg.audio ? new Audio(new URL(seg.audio, document.baseURI)) : null;
  let t = Math.min(startAt, duration);
  let playing = false;
  let raf = 0;
  let last = 0;
  let shownSlide = -2;
  let shownCue = -2;

  function render() {
    range.value = String(t);
    clock.textContent = `${formatTime(t)} / ${formatTime(duration)}`;
    const si = activeIndex(slides, t);
    if (si !== shownSlide) {
      shownSlide = si;
      stage.innerHTML = si >= 0 ? (slides[si].svg || '') : '';
      stage.setAttribute('aria-label', si >= 0 ? (slides[si].title || 'Slide') : 'Slide');
    }
    const ci = activeIndex(cues, t);
    if (ci !== shownCue) {
      shownCue = ci;
      caption.textContent = ci >= 0 ? cues[ci].text : '';
      cueItems.forEach((b, k) => { if (k === ci) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    }
  }

  function tick(now) {
    if (!playing) return;
    t = audio ? audio.currentTime : Math.min(duration, t + (now - last) / 1000);
    last = now;
    render();
    onPosition(t);
    if (t >= duration) { pause(); return; }
    raf = requestAnimationFrame(tick);
  }
  function play() {
    if (t >= duration) t = 0;
    playing = true;
    playBtn.textContent = 'Pause';
    if (audio) { audio.currentTime = t; audio.play().catch(() => {}); }
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  function pause() {
    playing = false;
    playBtn.textContent = 'Play';
    cancelAnimationFrame(raf);
    audio?.pause();
    onPosition(t);
  }
  function seek(to) {
    t = Math.max(0, Math.min(duration, to));
    if (audio) audio.currentTime = t;
    render();
    onPosition(t);
  }

  playBtn.addEventListener('click', () => (playing ? pause() : play()));
  range.addEventListener('input', () => seek(Number(range.value)));
  render();

  return { root, destroy() { pause(); } };
}
