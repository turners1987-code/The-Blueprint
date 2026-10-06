/* ============================================================
   THE BLUEPRINT — Progress Tracking System
   Module list lives in data/modules.json (single source of truth).
   Uses localStorage — no login, no backend required
   ============================================================ */

const STORAGE_KEY = 'blueprint_progress';

// Shape of stored progress: { version, completed: [moduleId], lastVisited }.
// Completion and position are separate: `completed` is what the reader has
// marked done (and drives the percentage); `lastVisited` is where they have
// got to (and drives "Continue"). Marking or unmarking never moves position.
const SCHEMA_VERSION = 2;

// MIGRATIONS[n] maps old module ids to new ones, applied when stored
// progress is upgraded to schema version n. A string value is the new id;
// null means the module was retired and the id is dropped. Ids that appear
// in no map are left as they are, so unknown ids (from a past or future
// schema) are kept rather than discarded.
const MIGRATIONS = {
  // v2: the 19-module curriculum became the 17-module structure
  // (parts: start, blueprint, process, capstone).
  2: {
    '00-welcome': '00-welcome',
    '08-range-rejection': '05-range-rejection',
    '09-failed-breakdown': '05-range-rejection',
    '11-gap-n-go': '06-gap-setups',
    '12-gap-fill': '06-gap-setups',
    '10-pause-n-go': '07-triggers',
    '15-routines': '10-premarket-routine',
    '16-journaling': '12-journaling',
    '07-playbook-intro': '02-three-tiers',
    '06-risk-and-psychology': '08-trade-construction',
    // Retired: no equivalent in the new structure.
    '01-market-foundation': null,
    '02-reading-charts': null,
    '03-market-concepts': null,
    '04-tools-of-the-trade': null,
    '05-order-types': null,
    '13-orb': null,
    '14-second-chance': null,
    '17-putting-it-together': null,
    '18-beyond-mnq': null,
  },
};

let MODULES = [];

// Resolve data/modules.json relative to this module so it works
// from both the repo root and pages inside modules/.
const DATA_URL = new URL('../data/modules.json', import.meta.url).href;

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
    completed = [...new Set(completed.map(remap).filter(id => id !== null))];
    if (lastVisited) lastVisited = remap(lastVisited);
  }
  return { version: SCHEMA_VERSION, completed, lastVisited };
};

export const Progress = {
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
    this.save(data);
    this.updateUI();
  },

  // Remove a module's checkmark. Nothing else changes: lastVisited stays.
  unmarkComplete(moduleId) {
    const data = this.load();
    data.completed = data.completed.filter(id => id !== moduleId);
    this.save(data);
    this.updateUI();
  },

  // Record where the reader is. Called on every module page load.
  setLastVisited(moduleId) {
    const data = this.load();
    if (data.lastVisited === moduleId) return;
    data.lastVisited = moduleId;
    this.save(data);
  },

  // Set lastVisited from the page's file name (modules/<number>-<slug>.html),
  // so every module page counts without per-page markup. Needs the module
  // list; a page that is not a module in modules.json is ignored.
  recordVisit(pathname) {
    if (!pathname.includes('/modules/')) return;
    const file = pathname.split('/').pop();
    const mod = MODULES.find(m => `${m.number}-${m.slug}.html` === file);
    if (mod) this.setLastVisited(mod.id);
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

  // Where "Continue" goes: lastVisited while it is not marked complete,
  // then the first published module after it (or lastVisited itself when
  // nothing published follows). Without a usable lastVisited (first visit,
  // older stored data, a retired id) it falls back to the first incomplete
  // published module.
  getNextModule() {
    const data = this.load();
    const published = MODULES.filter(m => m.status === 'published');
    const at = data.lastVisited ? MODULES.findIndex(m => m.id === data.lastVisited) : -1;
    if (at >= 0) {
      if (MODULES[at].status === 'published' && !data.completed.includes(MODULES[at].id)) return MODULES[at];
      return MODULES.slice(at + 1).find(m => m.status === 'published') || MODULES[at];
    }
    return published.find(m => !data.completed.includes(m.id))
      || published[published.length - 1]
      || MODULES[0];
  },

  // Get continue/start button text and link
  getContinueInfo() {
    const data = this.load();
    const first = MODULES.find(m => m.status === 'published') || MODULES[0];
    if ((data.completed.length === 0 && !data.lastVisited) || !first) {
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
      if (el) el.classList.toggle('completed', this.isComplete(mod.id));
    });
  },

  // Point every course CTA (data-continue-btn — the nav renders one
  // in the desktop bar and one in the mobile menu) at the right
  // module. Safe to call before the module list has loaded; it
  // re-runs when it arrives.
  updateContinueBtn() {
    const btns = document.querySelectorAll('[data-continue-btn]');
    if (!btns.length) return;
    const info = this.getContinueInfo();
    // Determine correct path prefix based on current page location
    const prefix = window.location.pathname.includes('/modules/') ? '../' : '';
    btns.forEach(btn => {
      btn.textContent = info.text;
      btn.href = prefix + info.path;
    });
  },

  // Reset all progress (for testing)
  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.updateUI();
  }
};

// Re-sync the UI once the module list has loaded
Progress.ready
  .then(() => {
    Progress.recordVisit(window.location.pathname);
    Progress.updateUI();
    Progress.updateContinueBtn();
  })
  .catch(() => console.warn('Blueprint: data/modules.json could not be loaded.'));

// Auto-update UI on page load. Module scripts are deferred, so the DOM
// is normally parsed already; handle both cases.
const onReady = () => {
  Progress.updateUI();
  Progress.updateContinueBtn();

  // Interactive checklists
  document.querySelectorAll('.checklist li').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('checked');
    });
  });
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
else onReady();
