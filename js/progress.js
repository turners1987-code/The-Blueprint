/* ============================================================
   THE BLUEPRINT — Progress Tracking System
   Module list lives in data/modules.json (single source of truth).
   Uses localStorage — no login, no backend required
   ============================================================ */

const STORAGE_KEY = 'blueprint_progress';

// Shape of stored progress: { version, completed: [moduleId], lastVisited }.
const SCHEMA_VERSION = 1;

// MIGRATIONS[n] maps old module ids to new ones, applied when stored
// progress is upgraded to schema version n. Seed empty; it is for the
// upcoming curriculum renumber. Example:
//   2: { '05-order-types': '04-order-types' }
// Ids that appear in no map are left as they are, and so are ids that
// match no known module. They may belong to a past or future schema.
const MIGRATIONS = {};

let MODULES = [];

// Resolve data/modules.json relative to this script so it works
// from both the repo root and pages inside modules/.
const DATA_URL = (document.currentScript && document.currentScript.src)
  ? new URL('../data/modules.json', document.currentScript.src).href
  : (window.location.pathname.includes('/modules/') ? '../data/modules.json' : 'data/modules.json');

const modulePath = (m) => `modules/${m.number}-${m.slug}.html`;

const defaultProgress = () => ({ version: SCHEMA_VERSION, completed: [], lastVisited: null });

// Upgrade a stored object from schema `from` to SCHEMA_VERSION.
// 0 -> 1 only adds the version key; completed is carried over unchanged.
const migrate = (raw, from) => {
  let completed = Array.isArray(raw.completed) ? raw.completed.slice() : [];
  let lastVisited = typeof raw.lastVisited === 'string' ? raw.lastVisited : null;
  for (let v = from + 1; v <= SCHEMA_VERSION; v++) {
    const map = MIGRATIONS[v];
    if (!map) continue;
    const remap = (id) => (Object.prototype.hasOwnProperty.call(map, id) ? map[id] : id);
    completed = [...new Set(completed.map(remap))];
    if (lastVisited) lastVisited = remap(lastVisited);
  }
  return { version: SCHEMA_VERSION, completed, lastVisited };
};

const Progress = {
  // Resolves with the module list once data/modules.json is loaded.
  ready: fetch(DATA_URL)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(list => { MODULES = list; return list; }),

  // Load saved progress from localStorage, migrating older schemas
  // to the current version and writing the result back.
  load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { /* fall through */ }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaultProgress();

    const stored = Number.isInteger(raw.version) ? raw.version : 0;
    // Written by a newer schema: leave it untouched rather than downgrade it.
    if (stored >= SCHEMA_VERSION) return raw;

    const data = migrate(raw, stored);
    this.save(data);
    return data;
  },

  // Save progress
  save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  // Stored progress as a JSON string, for backup or transfer.
  export() {
    return JSON.stringify(this.load());
  },

  // Validate a JSON string from export() and replace stored progress with it.
  // Throws on invalid input and leaves stored progress unchanged.
  import(json) {
    let obj;
    try { obj = JSON.parse(json); } catch { throw new Error('Progress import: not valid JSON.'); }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('Progress import: expected an object.');
    }
    if (obj.version !== undefined && !(Number.isInteger(obj.version) && obj.version >= 0)) {
      throw new Error('Progress import: invalid version.');
    }
    if (obj.version > SCHEMA_VERSION) {
      throw new Error(`Progress import: version ${obj.version} is newer than supported (${SCHEMA_VERSION}).`);
    }
    if (!Array.isArray(obj.completed) || !obj.completed.every(id => typeof id === 'string')) {
      throw new Error('Progress import: completed must be an array of module ids.');
    }
    if (obj.lastVisited != null && typeof obj.lastVisited !== 'string') {
      throw new Error('Progress import: lastVisited must be a string or null.');
    }
    const data = migrate(obj, obj.version === undefined ? 0 : obj.version);
    this.save(data);
    this.updateUI();
    return data;
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
