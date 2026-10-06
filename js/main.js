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

  // ── Module completion button ────────────────────────────────
  // After completion the zone shows where to go next, read from
  // data/modules.json: a link to the next module when it has a page,
  // otherwise a quiet "Marked complete" (the module-nav below still
  // shows what is coming). A completed module opens in the same state.
  const completeBtn = document.getElementById('mark-complete-btn');
  if (completeBtn) {
    const moduleId = completeBtn.dataset.moduleId;
    const zone = completeBtn.parentElement;

    const showQuiet = () => {
      completeBtn.textContent = '✓ Marked complete';
      completeBtn.classList.add('btn--ghost');
      completeBtn.classList.remove('btn--primary');
      completeBtn.disabled = true;
    };

    // Published and drafting modules both have a page (as in js/modules.js).
    const showDone = (modules, moveFocus) => {
      const i = modules ? modules.findIndex(m => m.id === moduleId) : -1;
      const next = i >= 0 ? modules[i + 1] : null;
      if (!next || (next.status !== 'published' && next.status !== 'drafting')) {
        showQuiet();
        return;
      }
      const note = document.createElement('p');
      note.className = 'module-complete-note';
      note.setAttribute('role', 'status');
      note.textContent = '✓ Marked complete';
      const link = document.createElement('a');
      link.className = 'btn btn--primary btn--lg';
      link.href = `${next.number}-${next.slug}.html`;
      link.textContent = `Next: ${next.title} →`;
      zone.replaceChildren(note, link);
      if (moveFocus) link.focus({ preventScroll: true });
    };

    // Completed on arrival: show the quiet state at once, then upgrade
    // to the next-module link when the module list has loaded.
    if (Progress.isComplete(moduleId)) {
      showQuiet();
      Progress.ready.then(modules => showDone(modules, false)).catch(() => {});
    }
    completeBtn.addEventListener('click', () => {
      Progress.markComplete(moduleId);
      showQuiet();
      Progress.ready.then(modules => showDone(modules, true)).catch(() => {});
    });
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
