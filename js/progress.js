/* ============================================================
   THE BLUEPRINT — Progress Tracking System
   Uses localStorage — no login, no backend required
   ============================================================ */

const STORAGE_KEY = 'blueprint_progress';

const MODULES = [
  { id: '00-welcome',            title: 'Welcome',               path: 'modules/00-welcome.html' },
  { id: '01-market-foundation',  title: 'Market Foundation',     path: 'modules/01-market-foundation.html' },
  { id: '02-reading-charts',     title: 'Reading Charts',        path: 'modules/02-reading-charts.html' },
  { id: '03-market-concepts',    title: 'Market Concepts',       path: 'modules/03-market-concepts.html' },
  { id: '04-tools-of-the-trade', title: 'Tools of the Trade',   path: 'modules/04-tools-of-the-trade.html' },
  { id: '05-order-types',        title: 'Order Types',           path: 'modules/05-order-types.html' },
  { id: '06-risk-and-psychology','title': 'Risk & Psychology',   path: 'modules/06-risk-and-psychology.html' },
  { id: '07-playbook-intro',     title: 'PlayBook Intro',        path: 'modules/07-playbook-intro.html' },
  { id: '08-range-rejection',    title: 'Range Rejection',       path: 'modules/08-range-rejection.html' },
  { id: '09-failed-breakdown',   title: 'Failed Breakdown',      path: 'modules/09-failed-breakdown.html' },
  { id: '10-pause-n-go',         title: 'Pause N Go',            path: 'modules/10-pause-n-go.html' },
  { id: '11-gap-n-go',           title: 'Gap N Go',              path: 'modules/11-gap-n-go.html' },
  { id: '12-gap-fill',           title: 'Gap Fill',              path: 'modules/12-gap-fill.html' },
  { id: '13-orb',                title: 'Opening Range Breakout',path: 'modules/13-orb.html' },
  { id: '14-second-chance',      title: 'Second Chance Entry',   path: 'modules/14-second-chance.html' },
  { id: '15-routines',           title: 'The Routines',          path: 'modules/15-routines.html' },
  { id: '16-journaling',         title: 'Journaling',            path: 'modules/16-journaling.html' },
  { id: '17-putting-it-together','title':'Putting It Together',  path: 'modules/17-putting-it-together.html' },
  { id: '18-beyond-mnq',         title: 'Beyond MNQ',            path: 'modules/18-beyond-mnq.html' },
];

const Progress = {
  // Load saved progress from localStorage
  load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { completed: [], lastVisited: null };
    } catch { return { completed: [], lastVisited: null }; }
  },

  // Save progress
  save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  // Mark a module as complete
  markComplete(moduleId) {
    const data = this.load();
    if (!data.completed.includes(moduleId)) {
      data.completed.push(moduleId);
    }
    data.lastVisited = moduleId;
    this.save(data);
    this.updateUI();
  },

  // Check if a module is complete
  isComplete(moduleId) {
    return this.load().completed.includes(moduleId);
  },

  // Get overall completion percentage
  getPercent() {
    const data = this.load();
    return Math.round((data.completed.length / MODULES.length) * 100);
  },

  // Get the next incomplete module
  getNextModule() {
    const data = this.load();
    return MODULES.find(m => !data.completed.includes(m.id)) || MODULES[MODULES.length - 1];
  },

  // Get continue/start button text and link
  getContinueInfo() {
    const data = this.load();
    if (data.completed.length === 0) {
      return { text: 'Start The Course', path: MODULES[0].path };
    }
    const next = this.getNextModule();
    return { text: 'Continue Learning', path: next.path };
  },

  // Update all UI elements that reflect progress
  updateUI() {
    const pct = this.getPercent();

    // Nav progress bar
    const bar = document.querySelector('.nav-progress-bar');
    if (bar) bar.style.width = pct + '%';

    // Any progress percentage displays
    document.querySelectorAll('[data-progress]').forEach(el => {
      el.textContent = pct + '%';
    });

    // Module completion badges
    MODULES.forEach(mod => {
      const el = document.querySelector(`[data-module-id="${mod.id}"]`);
      if (el && this.isComplete(mod.id)) {
        el.classList.add('completed');
      }
    });
  },

  // Reset all progress (for testing)
  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.updateUI();
  }
};

// Auto-update UI on page load
document.addEventListener('DOMContentLoaded', () => {
  Progress.updateUI();

  // Update continue button on landing page
  const continueBtn = document.getElementById('continue-btn');
  if (continueBtn) {
    const info = Progress.getContinueInfo();
    // Determine correct path prefix based on current page location
    const isInModules = window.location.pathname.includes('/modules/');
    const prefix = isInModules ? '../' : '';
    continueBtn.textContent = info.text;
    continueBtn.href = prefix + info.path;
  }

  // Interactive checklists
  document.querySelectorAll('.checklist li').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('checked');
    });
  });
});
