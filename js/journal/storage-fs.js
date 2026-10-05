/* ============================================================
   THE BLUEPRINT — Journal storage: File System Access adapter
   (js/journal/storage-fs.js)
   ============================================================
   Chrome and Edge. One JSON file per trade (<id>.json) in a folder
   the user chose.

   The FileSystemDirectoryHandle is saved in IndexedDB so the choice
   survives a reload; without that the user would re-pick the folder
   on every visit. A saved handle does NOT carry its permission across
   sessions, so init() checks queryPermission() and, when needed,
   requestPermission(). Browsers only allow requestPermission() from a
   user gesture, so on a bare page load init() reports
   code 'permission-prompt'; call requestAccess() from a click handler
   to re-grant.
   ============================================================ */

import {
  StorageError, prepare, newestFirst, rangeFilter, isId,
  buildExport, parseImport, summarise,
} from './storage-common.js';

const DB_NAME = 'blueprint-journal';
const STORE = 'handles';   // holds the folder handle, and UI settings under META_KEY
const HANDLE_KEY = 'journal-folder';
const META_KEY = 'meta';
const MODE = { mode: 'readwrite' };

// ── Support and stored handle (IndexedDB) ─────────────────────

export const fsSupported = () => typeof globalThis.showDirectoryPicker === 'function';

const openDb = (idb) => new Promise((resolve, reject) => {
  const req = idb.open(DB_NAME, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(STORE);
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const withStore = async (idb, kind, fn) => {
  const db = await openDb(idb);
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, kind);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req ? req.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
};

export const loadStoredHandle = async (idb = globalThis.indexedDB) => {
  if (!idb) return null;
  try { return (await withStore(idb, 'readonly', s => s.get(HANDLE_KEY))) || null; } catch { return null; }
};

export const saveStoredHandle = (handle, idb = globalThis.indexedDB) =>
  withStore(idb, 'readwrite', s => s.put(handle, HANDLE_KEY));

export const clearStoredHandle = async (idb = globalThis.indexedDB) => {
  if (!idb) return;
  try { await withStore(idb, 'readwrite', s => s.delete(HANDLE_KEY)); } catch { /* nothing stored */ }
};

// True when a folder handle is already stored (used by storage.js to
// decide whether this adapter should be the default).
export const hasStoredHandle = async (idb = globalThis.indexedDB) => !!(await loadStoredHandle(idb));

// ── Adapter ───────────────────────────────────────────────────

export function createFileSystemAdapter({
  indexedDB: idb = globalThis.indexedDB,
  showDirectoryPicker = globalThis.showDirectoryPicker && globalThis.showDirectoryPicker.bind(globalThis),
} = {}) {
  let dir = null;
  let ready = false;
  // id -> { d: session_date, t: entry_time, size }
  let index = new Map();
  let skipped = [];

  const fileName = (id) => `${id}.json`;

  const requireReady = () => {
    if (!ready) throw new StorageError('not-ready', 'Journal folder is not ready. Call init() first.');
  };

  // Turns a DOM exception from a file operation into a StorageError.
  const wrap = (e, doing) => {
    if (e instanceof StorageError) return e;
    const name = e && e.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      ready = false;
      return new StorageError('permission', `Access to the journal folder was revoked while ${doing}. Re-grant access to continue.`, { cause: e });
    }
    if (name === 'QuotaExceededError') {
      return new StorageError('quota', `The disk is full, so the journal could not be written while ${doing}.`, { cause: e });
    }
    if (name === 'NotFoundError') {
      ready = false;
      return new StorageError('unavailable', `The journal folder was moved or deleted while ${doing}. Choose a folder again.`, { cause: e });
    }
    return new StorageError('io', `Could not ${doing}: ${e && e.message ? e.message : e}`, { cause: e });
  };

  const readJsonFile = async (handle) => {
    const file = await handle.getFile();
    return { text: await file.text(), size: file.size };
  };

  const scan = async () => {
    const next = new Map();
    const bad = [];
    for await (const entry of dir.values()) {
      if (entry.kind !== 'file' || !entry.name.endsWith('.json')) continue;
      const id = entry.name.slice(0, -'.json'.length);
      try {
        const { text, size } = await readJsonFile(entry);
        const rec = JSON.parse(text);
        if (!rec || !isId(rec.id) || rec.id !== id || typeof rec.session_date !== 'string') throw new Error('not a journal record');
        next.set(id, { d: rec.session_date, t: rec.entry_time || '', size });
      } catch {
        bad.push(entry.name);
      }
    }
    index = next;
    skipped = bad;
  };

  const permissionState = async () => {
    const state = await dir.queryPermission(MODE);
    if (state === 'granted' || state === 'denied') return state; // denied: do not nag
    try {
      return await dir.requestPermission(MODE); // needs a user gesture
    } catch {
      return 'prompt';
    }
  };

  const finishInit = async () => {
    try {
      await scan();
    } catch (e) {
      const err = wrap(e, 'opening the folder');
      return { ok: false, code: err.code, reason: err.message };
    }
    ready = true;
    return { ok: true, code: 'ok', reason: null };
  };

  const adapter = {
    name: 'fs',

    get skipped() { return skipped.slice(); },

    // Files in the folder that are not valid journal records (ignored).
    async init() {
      if (!fsSupported() && !showDirectoryPicker) {
        return { ok: false, code: 'unsupported', reason: 'This browser cannot save to a folder. Use Chrome or Edge, or the browser-storage journal.' };
      }
      ready = false;
      dir = await loadStoredHandle(idb);
      if (!dir) return { ok: false, code: 'no-folder', reason: 'No journal folder has been chosen yet.' };

      let state;
      try { state = await permissionState(); } catch (e) {
        return { ok: false, code: 'unavailable', reason: `The saved journal folder could not be checked: ${e && e.message ? e.message : e}` };
      }
      if (state === 'denied') {
        return { ok: false, code: 'permission-denied', reason: 'Access to the journal folder was revoked. Choose the folder again, or allow access when the browser asks.' };
      }
      if (state !== 'granted') {
        return { ok: false, code: 'permission-prompt', reason: 'The browser needs you to confirm access to the journal folder again. Click to re-grant it.' };
      }
      return finishInit();
    },

    // Call from a click handler to show the permission prompt for the
    // saved folder, then finish initialising. Same result shape as init().
    async requestAccess() {
      if (!dir) dir = await loadStoredHandle(idb);
      if (!dir) return { ok: false, code: 'no-folder', reason: 'No journal folder has been chosen yet.' };
      let state;
      try { state = await dir.requestPermission(MODE); } catch (e) {
        return { ok: false, code: 'permission-prompt', reason: `The browser did not show the permission prompt: ${e && e.message ? e.message : e}` };
      }
      if (state !== 'granted') {
        return { ok: false, code: 'permission-denied', reason: 'Access to the journal folder was not granted.' };
      }
      return finishInit();
    },

    // Opens the folder picker (needs a user gesture), stores the handle in
    // IndexedDB, and finishes initialising. Cancelling the picker returns
    // { ok: false, code: 'cancelled' }.
    async chooseFolder() {
      if (!showDirectoryPicker) {
        return { ok: false, code: 'unsupported', reason: 'This browser cannot save to a folder.' };
      }
      let handle;
      try {
        handle = await showDirectoryPicker({ id: 'blueprint-journal', mode: 'readwrite' });
      } catch (e) {
        if (e && e.name === 'AbortError') return { ok: false, code: 'cancelled', reason: 'No folder was chosen.' };
        return { ok: false, code: 'unavailable', reason: `The folder picker failed: ${e && e.message ? e.message : e}` };
      }
      dir = handle;
      try { await saveStoredHandle(handle, idb); } catch (e) {
        return { ok: false, code: 'io', reason: `The folder was chosen but could not be remembered: ${e && e.message ? e.message : e}` };
      }
      if ((await dir.queryPermission(MODE)) !== 'granted' && (await dir.requestPermission(MODE)) !== 'granted') {
        return { ok: false, code: 'permission-denied', reason: 'Access to the chosen folder was not granted.' };
      }
      return finishInit();
    },

    // Forget the folder (the files stay where they are).
    async forgetFolder() {
      await clearStoredHandle(idb);
      dir = null;
      ready = false;
      index = new Map();
    },

    async list(range = {}) {
      requireReady();
      const inRange = rangeFilter(range);
      const wanted = [...index.entries()]
        .map(([id, e]) => ({ id, d: e.d, t: e.t }))
        .filter(e => inRange(e.d))
        .sort(newestFirst);
      try {
        const out = [];
        for (const { id } of wanted) {
          const rec = await adapter.get(id);
          if (rec) out.push(rec);
        }
        return out;
      } catch (e) { throw wrap(e, 'reading the journal'); }
    },

    async get(id) {
      requireReady();
      if (typeof id !== 'string' || !id) throw new StorageError('bad-argument', 'get(): id must be a non-empty string.');
      if (!isId(id)) return null;
      try {
        const handle = await dir.getFileHandle(fileName(id));
        return JSON.parse((await readJsonFile(handle)).text);
      } catch (e) {
        if (e && e.name === 'NotFoundError') return null;
        if (e instanceof SyntaxError) return null;
        throw wrap(e, 'reading a record');
      }
    },

    async put(record) {
      requireReady();
      const rec = await prepare(record, async (id) => index.has(id));
      try {
        const text = JSON.stringify(rec, null, 2);
        const handle = await dir.getFileHandle(fileName(rec.id), { create: true });
        const writable = await handle.createWritable(); // swaps in on close()
        try {
          await writable.write(text);
          await writable.close();
        } catch (e) {
          try { await writable.abort(); } catch { /* already closed */ }
          throw e;
        }
        index.set(rec.id, { d: rec.session_date, t: rec.entry_time || '', size: new Blob([text]).size });
      } catch (e) { throw wrap(e, 'saving a record'); }
      return rec;
    },

    async remove(id) {
      requireReady();
      if (typeof id !== 'string' || !id) throw new StorageError('bad-argument', 'remove(): id must be a non-empty string.');
      if (!isId(id)) return false;
      try {
        await dir.removeEntry(fileName(id));
        index.delete(id);
        return true;
      } catch (e) {
        if (e && e.name === 'NotFoundError') { index.delete(id); return false; }
        throw wrap(e, 'deleting a record');
      }
    },

    async exportAll() {
      requireReady();
      return buildExport(await adapter.list({}));
    },

    // Validates everything first. Then writes the new records and removes
    // the files that are not in the import. Writes come first so a failure
    // part-way never leaves an emptied folder; it can leave a mix of old and
    // new records, which importAll() run again will repair.
    async importAll(json) {
      requireReady();
      const records = await parseImport(json);
      const keep = new Set(records.map(r => r.id));
      for (const rec of records) await adapter.put(rec);
      try {
        for (const id of [...index.keys()]) {
          if (!keep.has(id)) await adapter.remove(id);
        }
      } catch (e) { throw wrap(e, 'replacing the journal'); }
      return { count: records.length };
    },

    // bytes: total size of the record files.
    async stats() {
      requireReady();
      const entries = [...index.entries()].map(([id, e]) => ({ id, d: e.d }));
      const bytes = [...index.values()].reduce((sum, e) => sum + e.size, 0);
      return summarise(entries, bytes);
    },

    // UI-level settings (e.g. the last-export time), kept in IndexedDB
    // beside the folder handle: they are not records, they are not files
    // in the folder (so the folder scan never sees them), and they stay
    // readable whatever the folder's permission state.
    async getMeta() {
      try { return (await withStore(idb, 'readonly', s => s.get(META_KEY))) || {}; } catch { return {}; }
    },

    async setMeta(partial) {
      if (partial === null || typeof partial !== 'object' || Array.isArray(partial)) {
        throw new StorageError('bad-argument', 'setMeta(): expected an object of settings.');
      }
      try {
        const next = { ...(await adapter.getMeta()), ...partial };
        await withStore(idb, 'readwrite', s => s.put(next, META_KEY));
        return next;
      } catch (e) { throw wrap(e, 'saving journal settings'); }
    },
  };

  return adapter;
}
