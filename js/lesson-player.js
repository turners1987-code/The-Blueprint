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

import { activeIndex, formatTime, validateConfig, assignSections, loadResume, saveResume, scoreCheck, loadNotes, saveNotes, notesToMarkdown } from './lesson-core.js';
import { Progress } from './progress.js';
import { createDrill } from './level-drill.js';

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
  // The module quiz is one more panel and sidebar entry after the segments.
  const quizSeg = config.quiz ? { id: 'quiz', title: config.quiz.title || 'Module quiz' } : null;
  const nav_segs = quizSeg ? [...segs, quizSeg] : segs;
  if (quizSeg) panels.push(el('section', { class: 'lesson-segment', 'data-segment': 'quiz', hidden: '' }));
  lesson.replaceChildren(...panels);

  const stateLabel = { 'not-started': '', attempted: 'Attempted', passed: 'Passed' };
  const checkSets = nav_segs.map((s, i) => (i < segs.length ? s.check : config.quiz?.questions));
  const buttons = [];
  function paintStates() {
    nav_segs.forEach((s, i) => {
      if (!checkSets[i]) return;
      const st = Progress.segmentState(config.module, s.id);
      const mark = buttons[i].querySelector('.lesson-state');
      mark.textContent = stateLabel[st];
      buttons[i].dataset.state = st;
    });
  }
  checkSets.forEach((qs, i) => {
    if (!qs) return;
    const heading = i < segs.length ? 'Check: three of four to pass' : 'Module quiz: pass at 75%';
    panels[i].append(createCheck(qs, heading, (passed) => {
      Progress.recordSegmentTry(config.module, nav_segs[i].id, passed);
      paintStates();
    }));
  });

  // Drills sit above the segment's check.
  segs.forEach((seg, i) => {
    const d = seg.drill && createDrill(seg.drill);
    if (d) panels[i].insertBefore(d, panels[i].querySelector('.lesson-check'));
  });

  // Notes: one textarea per lesson segment, saved in this browser, exportable as .md.
  const notes = loadNotes(store(), config.module);
  const moduleTitle = (document.querySelector('h1')?.textContent || config.module).trim();
  segs.forEach((seg, i) => {
    const id = `notes-${seg.id}`;
    const area = el('textarea', { id, class: 'lesson-notes-input', rows: '4', placeholder: 'Your notes for this segment. Saved in this browser only.' });
    area.value = notes[seg.id] || '';
    area.addEventListener('input', () => { notes[seg.id] = area.value; saveNotes(store(), config.module, notes); });
    const dl = el('button', { type: 'button', class: 'btn btn--ghost btn--sm lesson-notes-export' }, 'Export all notes (.md)');
    dl.addEventListener('click', () => {
      const blob = new Blob([notesToMarkdown(moduleTitle, segs, notes)], { type: 'text/markdown' });
      const a = el('a', { href: URL.createObjectURL(blob), download: `${config.module}-notes.md` });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    panels[i].append(el('div', { class: 'lesson-notes' }, el('label', { for: id, class: 'lesson-notes-label' }, 'Your notes'), area, dl));
  });

  const saved = loadResume(store(), config.module, nav_segs.length);
  const state = { segment: saved.segment, positions: saved.positions };
  const persist = () => saveResume(store(), config.module, state);

  // Sidebar
  const nav = el('nav', { class: 'lesson-sidebar', 'aria-label': 'Lesson segments' });
  const list = el('ol', { class: 'lesson-sidebar-list' });
  nav_segs.forEach((s, i) => {
    const b = el('button', { type: 'button', class: 'lesson-sidebar-btn' }, s === quizSeg ? s.title : `${i + 1}. ${s.title}`, el('span', { class: 'lesson-state' }));
    b.addEventListener('click', () => show(i));
    list.append(el('li', {}, b));
    buttons.push(b);
  });
  paintStates();
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
    if (!seg || !(seg.slides?.length || seg.cues?.length)) return;
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

function createCheck(questions, heading, onResult) {
  const root = el('div', { class: 'lesson-check' });
  const uid = `chk${Math.random().toString(36).slice(2, 8)}`;

  function renderForm() {
    const form = el('form', { class: 'lesson-check-form' }, el('h3', { class: 'lesson-check-title' }, heading));
    questions.forEach((q, qi) => {
      const fs = el('fieldset', { class: 'lesson-q' }, el('legend', {}, `${qi + 1}. ${q.q}`));
      q.options.forEach((o, oi) => {
        const input = el('input', { type: 'radio', name: `${uid}-${qi}`, value: String(oi) });
        fs.append(el('label', { class: 'lesson-opt' }, input, ` ${o}`));
      });
      form.append(fs);
    });
    const msg = el('p', { class: 'lesson-check-msg', role: 'status' });
    form.append(el('button', { type: 'submit', class: 'btn btn--primary btn--sm' }, 'Check answers'), msg);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const picks = questions.map((_, qi) => {
        const c = form.querySelector(`input[name="${uid}-${qi}"]:checked`);
        return c ? Number(c.value) : null;
      });
      if (picks.some((p) => p === null)) { msg.textContent = 'Answer every question first.'; return; }
      renderResult(picks);
    });
    root.replaceChildren(form);
  }

  function renderResult(picks) {
    const r = scoreCheck(questions, picks);
    onResult(r.passed);
    const box = el('div', { class: 'lesson-check-result', role: 'status' },
      el('h3', { class: 'lesson-check-title' }, `${r.correct} of ${r.total}: ${r.passed ? 'passed' : `not passed (${r.need} needed)`}`));
    questions.forEach((q, qi) => {
      const right = picks[qi] === q.answer;
      box.append(el('p', { class: right ? 'lesson-right' : 'lesson-wrong' },
        el('strong', {}, `${qi + 1}. ${right ? 'Correct' : 'Not quite'}. `),
        right ? '' : `Answer: ${q.options[q.answer]}. `, q.why));
    });
    const again = el('button', { type: 'button', class: 'btn btn--ghost btn--sm' }, 'Try again');
    again.addEventListener('click', renderForm);
    box.append(again);
    root.replaceChildren(box);
  }

  renderForm();
  return root;
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

  return { root, destroy() { pause(); root.remove(); } };
}
