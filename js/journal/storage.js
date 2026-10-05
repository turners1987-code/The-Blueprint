/* ============================================================
   THE BLUEPRINT — Journal storage (js/journal/storage.js)
   ============================================================
   One async interface over two stores:
     storage-local.js  browser localStorage (the default)
     storage-fs.js     a folder of JSON files, via the File System
                       Access API (Chrome and Edge)

   Interface (each backend implements all of it):
     init()               -> { ok, reason }
     list({ from, to })   -> records in a session-date range, newest first
     get(id)              -> record, or null
     put(record)          -> stored record; validates first and rejects
                             with ValidationError (err.errors)
     remove(id)           -> true if something was removed
     exportAll()          -> JSON string of every record
     importAll(json)      -> { count }; validates everything, then replaces
     stats()              -> { count, oldest, newest, bytes }
     getMeta()            -> UI-level settings object ({} when none), e.g.
                             the last-export time
     setMeta(partial)     -> the merged settings object

   Which backend: File System Access if the browser has it AND a
   folder handle is already stored, otherwise localStorage. Use
   useLocal() / useFileSystem() to switch explicitly.

   Switching never copies data. To move a journal between stores,
   exportAll() on one, switch, importAll() on the other.

   If the stored folder's permission was revoked, init() reports it and
   the file-system store stays selected rather than quietly falling back
   to localStorage, which would split the journal across two places.
   Call requestAccess() from a click to re-grant, or useLocal() to leave.
   ============================================================ */

import { createLocalStorageAdapter } from './storage-local.js';
import { createFileSystemAdapter, fsSupported, hasStoredHandle } from './storage-fs.js';
import { StorageError } from './storage-common.js';

export { StorageError, ValidationError } from './storage-common.js';
export { fsSupported } from './storage-fs.js';

let local = null;
let fs = null;
let active = null;     // the selected adapter
let initResult = null; // result of the last init of `active`

const localAdapter = () => (local ||= createLocalStorageAdapter());
const fsAdapter = () => (fs ||= createFileSystemAdapter());

const withBackend = (adapter, result) => ({ ...result, backend: adapter.name });

// Picks the default backend (if none is selected yet) and initialises it.
export async function init() {
  if (!active) {
    active = (fsSupported() && await hasStoredHandle()) ? fsAdapter() : localAdapter();
  }
  initResult = withBackend(active, await active.init());
  return initResult;
}

// The name of the selected backend: 'local', 'fs', or null before init().
export const backend = () => (active ? active.name : null);

// Switch to browser localStorage.
export async function useLocal() {
  active = localAdapter();
  return init();
}

// Switch to a folder of JSON files. With no folder stored yet this opens
// the folder picker, which needs a user gesture (call it from a click).
// Pass { pickFolder: false } to use only an already-stored folder.
export async function useFileSystem({ pickFolder = true } = {}) {
  if (!fsSupported()) {
    return { ok: false, backend: 'fs', code: 'unsupported', reason: 'This browser cannot save to a folder. Use Chrome or Edge.' };
  }
  const adapter = fsAdapter();
  const had = await hasStoredHandle();
  if (!had && !pickFolder) {
    return { ok: false, backend: 'fs', code: 'no-folder', reason: 'No journal folder has been chosen yet.' };
  }
  if (!had) {
    const picked = await adapter.chooseFolder();
    if (!picked.ok) return withBackend(adapter, picked); // cancelled: stay on the current backend
  }
  active = adapter;
  return init();
}

// Choose (or change) the journal folder; needs a user gesture.
export async function chooseFolder() {
  if (!fsSupported()) {
    return { ok: false, backend: 'fs', code: 'unsupported', reason: 'This browser cannot save to a folder. Use Chrome or Edge.' };
  }
  const adapter = fsAdapter();
  const result = withBackend(adapter, await adapter.chooseFolder());
  if (result.ok) { active = adapter; initResult = result; }
  return result;
}

// Re-grant access to a stored folder after a reload; needs a user gesture.
export async function requestAccess() {
  if (!active || active.name !== 'fs') {
    return { ok: false, backend: backend(), code: 'bad-state', reason: 'The folder store is not selected.' };
  }
  initResult = withBackend(active, await active.requestAccess());
  return initResult;
}

// ── The interface, delegated to the selected backend ──────────

const ready = async () => {
  if (!initResult) await init();
  if (!initResult.ok) {
    throw new StorageError(initResult.code === 'unavailable' ? 'unavailable' : 'not-ready', initResult.reason);
  }
  return active;
};

export const list = async (range) => (await ready()).list(range);
export const get = async (id) => (await ready()).get(id);
export const put = async (record) => (await ready()).put(record);
export const remove = async (id) => (await ready()).remove(id);
export const exportAll = async () => (await ready()).exportAll();
export const importAll = async (json) => (await ready()).importAll(json);
export const stats = async () => (await ready()).stats();

// ── UI-level settings ─────────────────────────────────────────
// Small facts the pages want to remember (today: the last-export time).
// They live wherever the active backend keeps them, so a page never
// reaches for a browser store directly. Settings are not records:
// importAll() does not touch them, and they are readable even when
// init() did not succeed (the last-export date is still worth showing).
const activeAdapter = async () => { if (!active) await init(); return active; };
export const getMeta = async () => (await activeAdapter()).getMeta();
export const setMeta = async (partial) => (await activeAdapter()).setMeta(partial);
