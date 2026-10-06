/* ============================================================
   THE BLUEPRINT — Main JS Utilities
   ============================================================ */

import { Progress } from './progress.js';

const init = () => {

  // ── Quiz logic ─────────────────────────────────────────────
  document.querySelectorAll('.quiz-block').forEach(quiz => {
    const options  = quiz.querySelectorAll('.quiz-option');
    const feedback = quiz.querySelector('.quiz-feedback');
    const correct  = quiz.dataset.correct;

    options.forEach(opt => {
      opt.addEventListener('click', () => {
        if (quiz.dataset.answered) return;
        quiz.dataset.answered = 'true';

        options.forEach(o => {
          o.disabled = true;
          if (o.dataset.value === correct) o.classList.add('correct');
          else if (o === opt) o.classList.add('incorrect');
        });

        if (feedback) {
          feedback.style.display = 'block';
          feedback.classList.add('animate-fade-in');
        }
      });
    });
  });

  // ── Scroll-triggered fade-ins ──────────────────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));

  // ── Module completion zone ──────────────────────────────────
  // Three states, each rebuilt from scratch by render():
  //   open  — the Mark Complete button
  //   next  — "Marked complete", a link to the next module, and a quiet
  //           "Mark as not complete" control
  //   quiet — as above without a next-module link (the next module has
  //           no page yet; the module-nav below shows what is coming)
  // The next module and its status come from data/modules.json. A
  // completed module opens in its completed state.
  const completeBtn = document.getElementById('mark-complete-btn');
  if (completeBtn) {
    const moduleId = completeBtn.dataset.moduleId;
    const zone = completeBtn.parentElement;
    const openLabel = completeBtn.textContent.trim();

    // Published and drafting modules both have a page (as in js/modules.js).
    const nextWithPage = (modules) => {
      const i = modules ? modules.findIndex(m => m.id === moduleId) : -1;
      const next = i >= 0 ? modules[i + 1] : null;
      return next && (next.status === 'published' || next.status === 'drafting') ? next : null;
    };

    const render = (state, next, moveFocus) => {
      if (state === 'open') {
        const btn = document.createElement('button');
        btn.id = 'mark-complete-btn';
        btn.className = 'btn btn--primary btn--lg';
        btn.dataset.moduleId = moduleId;
        btn.textContent = openLabel;
        btn.addEventListener('click', onComplete);
        zone.replaceChildren(btn);
        if (moveFocus) btn.focus({ preventScroll: true });
        return;
      }
      const note = document.createElement('p');
      note.className = 'module-complete-note';
      note.setAttribute('role', 'status');
      note.textContent = '✓ Marked complete';
      const undo = document.createElement('button');
      undo.type = 'button';
      undo.className = 'module-complete-undo';
      undo.textContent = 'Mark as not complete';
      undo.addEventListener('click', onUndo);
      if (state === 'next') {
        const link = document.createElement('a');
        link.className = 'btn btn--primary btn--lg';
        link.href = `${next.number}-${next.slug}.html`;
        link.textContent = `Next: ${next.title} →`;
        zone.replaceChildren(note, link, undo);
        if (moveFocus) link.focus({ preventScroll: true });
      } else {
        zone.replaceChildren(note, undo);
      }
    };

    const showCompleted = (moveFocus) => {
      // Quiet at once; upgrade to the next-module link when the list loads.
      render('quiet', null, false);
      Progress.ready
        .then(modules => {
          const next = nextWithPage(modules);
          // Skip if the reader has already unmarked in the meantime.
          if (next && Progress.isComplete(moduleId)) render('next', next, moveFocus);
        })
        .catch(() => {});
    };

    function onComplete() {
      Progress.markComplete(moduleId);
      showCompleted(true);
    }
    function onUndo() {
      Progress.unmarkComplete(moduleId);
      render('open', null, true);
    }

    completeBtn.addEventListener('click', onComplete);
    if (Progress.isComplete(moduleId)) showCompleted(false);
  }

  // ── Smooth anchor scroll ────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Move keyboard focus too (skip link); only if the target can take it.
        if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
      }
    });
  });

};

// Module scripts are deferred, so the DOM is normally parsed already.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

// ── Scroll reveal CSS (added dynamically) ─────────────────────
const style = document.createElement('style');
style.textContent = `
  .scroll-reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .scroll-reveal.visible { opacity: 1; transform: translateY(0); }
`;
document.head.appendChild(style);
