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

import { activeIndex, formatTime, validateConfig, assignSections, loadResume, saveResume, scoreCheck, loadNotes, saveNotes, notesToMarkdown, musicGains, voiceStemUrl, loadMusicLevel, saveMusicLevel } from './lesson-core.js';
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
    const nextSeg = nav_segs[i + 1];
    const onNext = nextSeg ? { title: nextSeg.title, go: () => { show(i + 1); panels[i + 1]?.scrollIntoView({ block: 'start', behavior: 'smooth' }); } } : null;
    player = createPlayer(seg, state.positions[seg.id] || 0, (t) => {
      state.positions[seg.id] = t;
      persist();
    }, onNext);
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

function createPlayer(seg, startAt, onPosition, onNext = null) {
  const slides = seg.slides || [];
  const cues = seg.cues || [];
  const duration = seg.duration || Math.max(0, ...slides.map((s) => s.start), ...cues.map((c) => c.start)) + 5;

  const stage = el('div', { class: 'lesson-stage', role: 'img', 'aria-label': 'Slide' });
  const caption = el('p', { class: 'lesson-caption', 'aria-live': 'off' });
  const playBtn = el('button', { type: 'button', class: 'btn btn--ghost btn--sm' }, 'Play');
  const RESTART = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>';
  const restartBtn = el('button', { type: 'button', class: 'btn btn--ghost btn--sm lesson-restart', 'aria-label': 'Back to the start', title: 'Back to the start' });
  restartBtn.innerHTML = RESTART;
  const nextBtn = el('button', { type: 'button', class: 'btn btn--primary btn--sm lesson-next', hidden: '' }, onNext ? `Next: ${onNext.title} \u2192` : '');
  if (onNext) nextBtn.addEventListener('click', () => onNext.go());
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

  // Music control: moves only the music. The voice stays the same.
  const music = loadMusicLevel(store());
  const NOTE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
  const noteIcon = el('span', { class: 'lesson-music-icon' });
  noteIcon.innerHTML = NOTE;
  const musicRange = el('input', { type: 'range', min: '0', max: '100', step: '1', class: 'lesson-music-range', 'aria-label': 'Music volume (voice stays the same)' });
  const muteBtn = el('button', { type: 'button', class: 'btn btn--ghost btn--sm lesson-music-mute', 'aria-pressed': 'false' }, 'Mute');
  const musicBox = el('div', { class: 'lesson-music', role: 'group', 'aria-label': 'Music volume (voice stays the same)' },
    noteIcon, el('span', { class: 'lesson-music-label' }, 'Music'), musicRange, muteBtn,
    el('small', { class: 'lesson-music-hint' }, 'Voice stays the same'));
  musicBox.hidden = !seg.audio;

  const root = el('div', { class: 'lesson-player' },
    el('div', { class: 'lesson-controls' }, restartBtn, playBtn, range, clock), musicBox, stage, nextBtn, caption, details);
  if (!slides.length) stage.hidden = true;
  if (!cues.length) { caption.hidden = true; details.hidden = true; }

  // Playback. 'web': two stems decoded to AudioBuffers and started on the same
  // context time, so they stay sample-locked (mix gain g, voice gain 1 - g).
  // 'el': one <audio> element playing the mix (fallback, no music control).
  // 'timer': no audio file.
  let mode = seg.audio ? 'web' : 'timer';
  const ver = seg.audio_v ? `?v=${encodeURIComponent(seg.audio_v)}` : ''; // a new render gets a new URL
  const mixUrl = seg.audio ? new URL(seg.audio + ver, document.baseURI) : null;
  const voiceUrl = seg.audio ? new URL(voiceStemUrl(seg.audio) + ver, document.baseURI) : null;
  let ctx = null;
  let mixGain = null;
  let voiceGain = null;
  let buffers = null;
  let loading = null;
  let sources = [];
  let startedAt = 0;
  let offset = 0;
  let elAudio = null;
  let destroyed = false;
  let t = Math.min(startAt, duration);
  let playing = false;
  let raf = 0;
  let last = 0;
  let shownSlide = -2;
  let shownCue = -2;

  function applyGains() {
    if (!ctx || !mixGain) return;
    const g = musicGains(music.level, music.muted);
    const now = ctx.currentTime;
    mixGain.gain.setTargetAtTime(g.mix, now, 0.015);
    voiceGain.gain.setTargetAtTime(g.voice, now, 0.015);
  }
  function paintMusic() {
    musicRange.value = String(music.muted ? 0 : music.level);
    muteBtn.textContent = music.muted ? 'Unmute' : 'Mute';
    muteBtn.setAttribute('aria-pressed', String(music.muted));
    applyGains();
  }
  musicRange.addEventListener('input', () => {
    music.level = Number(musicRange.value);
    music.muted = false;
    saveMusicLevel(store(), music);
    paintMusic();
  });
  muteBtn.addEventListener('click', () => {
    music.muted = !music.muted;
    saveMusicLevel(store(), music);
    paintMusic();
  });

  function openContext() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* unsupported */ }
    try {
      ctx = new AC();
      mixGain = ctx.createGain();
      voiceGain = ctx.createGain();
      mixGain.connect(ctx.destination);
      voiceGain.connect(ctx.destination);
      const g = musicGains(music.level, music.muted);
      mixGain.gain.value = g.mix;
      voiceGain.gain.value = g.voice;
      return true;
    } catch { ctx = null; return false; }
  }
  async function fetchBuffer(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`audio ${r.status}`);
    return ctx.decodeAudioData(await r.arrayBuffer());
  }
  function loadBuffers() {
    if (!loading) loading = Promise.all([fetchBuffer(mixUrl), fetchBuffer(voiceUrl)]).then((b) => { buffers = b; });
    return loading;
  }
  function stopSources() {
    for (const s of sources) { try { s.onended = null; s.stop(); s.disconnect(); } catch { /* already stopped */ } }
    sources = [];
  }
  function startSources(from) {
    stopSources();
    if (!ctx || !buffers) return;
    const when = ctx.currentTime + 0.06;
    const [mix, voice] = buffers;
    [[mix, mixGain], [voice, voiceGain]].forEach(([buf, gain]) => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(gain);
      src.start(when, Math.min(from, buf.duration));
      sources.push(src);
    });
    offset = from;
    startedAt = when;
  }
  function startElement(from) {
    if (!elAudio) elAudio = new Audio(mixUrl);
    elAudio.currentTime = from;
    elAudio.play().catch(() => {});
  }
  function useElement() {
    mode = 'el';
    musicBox.hidden = true;
    stopSources();
    if (ctx) { ctx.close().catch(() => {}); ctx = null; }
  }
  function position() {
    if (mode === 'web') return sources.length ? Math.min(duration, offset + Math.max(0, ctx.currentTime - startedAt)) : t;
    if (mode === 'el') return elAudio ? elAudio.currentTime : t;
    return t;
  }

  function atEnd() { return t >= duration - 1; } // the position slider steps in whole seconds
  function label() {
    playBtn.textContent = playing ? 'Pause' : (atEnd() ? 'Replay' : 'Play');
    nextBtn.hidden = !(onNext && !playing && atEnd());
  }
  function render() {
    label();
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
    if (mode === 'timer') t = Math.min(duration, t + (now - last) / 1000);
    else t = position(); // the audio clock; holds still while the stems load
    last = now;
    render();
    onPosition(t);
    if (t >= duration) { pause(); return; }
    raf = requestAnimationFrame(tick);
  }
  function play() {
    if (atEnd()) t = 0;
    playing = true;
    label();
    last = performance.now();
    if (mode === 'web' && !ctx && !openContext()) useElement(); // context is made on the Play tap
    if (mode === 'web') {
      ctx.resume().catch(() => {});
      if (buffers) startSources(t);
      else {
        loadBuffers().then(() => { if (playing && !destroyed) startSources(t); })
          .catch(() => { if (destroyed) return; useElement(); if (playing) startElement(t); });
      }
    } else if (mode === 'el') {
      startElement(t);
    }
    raf = requestAnimationFrame(tick);
  }
  function pause() {
    if (playing) t = position();
    playing = false;
    label();
    cancelAnimationFrame(raf);
    stopSources();
    if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
    elAudio?.pause();
    render();
    onPosition(t);
  }
  function seek(to) {
    t = Math.max(0, Math.min(duration, to));
    if (playing) {
      if (mode === 'web' && buffers) startSources(t); // both stems restart from the same offset
      else if (mode === 'el') elAudio.currentTime = t;
    }
    render();
    onPosition(t);
  }

  playBtn.addEventListener('click', () => (playing ? pause() : play()));
  restartBtn.addEventListener('click', () => { seek(0); if (!playing) play(); });
  range.addEventListener('input', () => seek(Number(range.value)));
  paintMusic();
  render();

  return {
    root,
    destroy() {
      destroyed = true;
      playing = false;
      cancelAnimationFrame(raf);
      stopSources();
      elAudio?.pause();
      if (ctx) { ctx.close().catch(() => {}); ctx = null; }
    },
  };
}
