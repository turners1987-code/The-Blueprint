/* ============================================================
   THE BLUEPRINT — Progress Tracking System
   Module list lives in data/modules.json (single source of truth).
   Uses localStorage — no login, no backend required
   ============================================================ */

const STORAGE_KEY = 'blueprint_progress';

let MODULES = [];

// Resolve data/modules.json relative to this script so it works
// from both the repo root and pages inside modules/.
const DATA_URL = (document.currentScript && document.currentScript.src)
  ? new URL('../data/modules.json', document.currentScript.src).href
  : (window.location.pathname.includes('/modules/') ? '../data/modules.json' : 'data/modules.json');

const modulePath = (m) => `modules/${m.number}-${m.slug}.html`;

const Progress = {
  // Resolves with the module list once data/modules.json is loaded.
  ready: fetch(DATA_URL)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(list => { MODULES = list; return list; }),

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

  // Overall completion percentage — calculated against
  // PUBLISHED modules only. Planned modules don't count.
  getPercent() {
    const data = this.load();
    const published = MODULES.filter(m => m.status === 'published');
    if (!published.length) return 0;
    const done = published.filter(m => data.completed.includes(m.id));
    return Math.round((done.length / published.length) * 100);
  },

  // Get the next incomplete published module
  getNextModule() {
    const data = this.load();
    const published = MODULES.filter(m => m.status === 'published');
    return published.find(m => !data.completed.includes(m.id))
      || published[published.length - 1]
      || MODULES[0];
  },

  // Get continue/start button text and link
  getContinueInfo() {
    const data = this.load();
    const first = MODULES.find(m => m.status === 'published') || MODULES[0];
    if (data.completed.length === 0 || !first) {
      return { text: 'Start The Course', path: first ? modulePath(first) : 'modules/00-welcome.html' };
    }
    const next = this.getNextModule();
    return { text: 'Continue Learning', path: next ? modulePath(next) : 'index.html' };
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

const updateContinueBtn = () => {
  const continueBtn = document.getElementById('continue-btn');
  if (continueBtn) {
    const info = Progress.getContinueInfo();
    // Determine correct path prefix based on current page location
    const isInModules = window.location.pathname.includes('/modules/');
    const prefix = isInModules ? '../' : '';
    continueBtn.textContent = info.text;
    continueBtn.href = prefix + info.path;
  }
};

// Re-sync the UI once the module list has loaded
Progress.ready
  .then(() => { Progress.updateUI(); updateContinueBtn(); })
  .catch(() => console.warn('Blueprint: data/modules.json could not be loaded.'));

// Auto-update UI on page load
document.addEventListener('DOMContentLoaded', () => {
  Progress.updateUI();
  updateContinueBtn();

  // Interactive checklists
  document.querySelectorAll('.checklist li').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('checked');
    });
  });
});
