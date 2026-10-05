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
  const completeBtn = document.getElementById('mark-complete-btn');
  if (completeBtn) {
    const moduleId = completeBtn.dataset.moduleId;
    if (Progress.isComplete(moduleId)) {
      completeBtn.textContent = '✓ Completed';
      completeBtn.classList.add('btn--ghost');
      completeBtn.classList.remove('btn--primary');
    }
    completeBtn.addEventListener('click', () => {
      Progress.markComplete(moduleId);
      completeBtn.textContent = '✓ Completed';
      completeBtn.classList.add('btn--ghost');
      completeBtn.classList.remove('btn--primary');
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

// ── Offline support ────────────────────────────────────────────
// sw.js lives at the site root; its folder is the scope.
if ('serviceWorker' in navigator) {
  const register = () => navigator.serviceWorker
    .register(new URL('../sw.js', import.meta.url))
    .catch(err => console.warn('Blueprint: service worker registration failed.', err));
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
}
