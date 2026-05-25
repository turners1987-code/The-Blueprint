/* ============================================================
   THE BLUEPRINT — Main JS Utilities
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Mobile nav toggle ──────────────────────────────────────
  const navToggle = document.getElementById('nav-hamburger');
const navMenu   = document.getElementById('nav-mobile-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => navMenu.classList.toggle('open'));
  }

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
      }
    });
  });

});

// ── Scroll reveal CSS (added dynamically) ─────────────────────
const style = document.createElement('style');
style.textContent = `
  .scroll-reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .scroll-reveal.visible { opacity: 1; transform: translateY(0); }
`;
document.head.appendChild(style);
