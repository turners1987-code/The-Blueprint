/* ============================================================
   THE BLUEPRINT — Journal storage: localStorage adapter
   (js/journal/storage-local.js)
   ============================================================
   The default store, for anyone without File System Access.

   Layout, under a key prefix:
     <prefix>rec:<id>   one JSON record per key
     <prefix>index      { v, entries: { <id>: { d: session_date, t: entry_time } } }
     <prefix>meta       UI-level settings (e.g. the last-export time);
                       written lazily, so a store that never called
                       setMeta() has no meta key

   The index lets list() and stats() avoid parsing every record. If it
   is missing or damaged, init() rebuilds it from the record keys.

   A write that would exceed the browser's quota throws
   StorageError('quota') and leaves the store as it was.
   ============================================================ */

import {
  StorageError, prepare, newestFirst, rangeFilter,
  buildExport, parseImport, byteLength, summarise,
} from './storage-common.js';

const DEFAULT_PREFIX = 'blueprint_journal:';

const isQuotaError = (e) => !!e && (
  e.name === 'QuotaExceededError' ||
  e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
  e.code === 22 || e.code === 1014
);

const QUOTA_MESSAGE =
  'Browser storage is full, so this change was not saved. Export your journal, ' +
  'free some space (delete old records or other site data), then try again.';

// A stored meta value is an object, or unreadable garbage reads as none.
const parseMetaValue = (raw) => {
  if (raw === null || raw === undefined) return {};
  try {
    const v = JSON.parse(raw);
    return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
  } catch { return {}; }
};

// `storage` is injectable so the adapter can be tested without a browser.
export function createLocalStorageAdapter({ storage = globalThis.localStorage, prefix = DEFAULT_PREFIX } = {}) {
  const INDEX_KEY = `${prefix}index`;
  const META_KEY = `${prefix}meta`;
  const RECORD_PREFIX = `${prefix}rec:`;
  const recordKey = (id) => `${RECORD_PREFIX}${id}`;

  let index = { v: 1, entries: {} };
  let ready = false;

  // Wraps a storage call: quota becomes a clear StorageError, anything else io.
  const guard = (fn) => {
    try { return fn(); } catch (e) {
      if (e instanceof StorageError) throw e;
      if (isQuotaError(e)) throw new StorageError('quota', QUOTA_MESSAGE, { cause: e });
      throw new StorageError('io', `Could not access browser storage: ${e && e.message ? e.message : e}`, { cause: e });
    }
  };

  const allKeys = () => {
    const keys = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k !== null && k.startsWith(prefix)) keys.push(k);
    }
    return keys;
  };

  const requireReady = () => {
    if (!ready) throw new StorageError('not-ready', 'Journal storage has not been initialised. Call init() first.');
  };

  const saveIndex = () => storage.setItem(INDEX_KEY, JSON.stringify(index));

  const parseRecord = (raw) => {
    try {
      const rec = JSON.parse(raw);
      return rec && typeof rec === 'object' ? rec : null;
    } catch { return null; }
  };

  const rebuildIndex = () => {
    const entries = {};
    for (const key of allKeys()) {
      if (!key.startsWith(RECORD_PREFIX)) continue;
      const rec = parseRecord(storage.getItem(key));
      if (rec && typeof rec.id === 'string' && typeof rec.session_date === 'string') {
        entries[rec.id] = { d: rec.session_date, t: rec.entry_time || '' };
      }
    }
    index = { v: 1, entries };
    saveIndex();
  };

  const loadIndex = () => {
    const raw = storage.getItem(INDEX_KEY);
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.v === 1 && parsed.entries && typeof parsed.entries === 'object') {
          index = parsed;
          return;
        }
      } catch { /* fall through to rebuild */ }
    }
    rebuildIndex();
  };

  const entryList = () => Object.entries(index.entries).map(([id, e]) => ({ id, d: e.d, t: e.t }));

  return {
    name: 'local',

    async init() {
      if (!storage) return { ok: false, reason: 'localStorage is not available in this browser.' };
      try {
        const probe = `${prefix}__probe`;
        storage.setItem(probe, '1');
        storage.removeItem(probe);
      } catch (e) {
        return {
          ok: false,
          reason: isQuotaError(e)
            ? 'Browser storage is full. Free some space and reload.'
            : 'localStorage is blocked in this browser (private mode or a site-data setting).',
        };
      }
      try { loadIndex(); } catch (e) {
        return { ok: false, reason: `Could not read the journal index: ${e && e.message ? e.message : e}` };
      }
      ready = true;
      return { ok: true, reason: null };
    },

    async list(range = {}) {
      requireReady();
      const inRange = rangeFilter(range);
      return guard(() => entryList()
        .filter(e => inRange(e.d))
        .sort(newestFirst)
        .map(e => parseRecord(storage.getItem(recordKey(e.id))))
        .filter(Boolean));
    },

    async get(id) {
      requireReady();
      if (typeof id !== 'string' || !id) throw new StorageError('bad-argument', 'get(): id must be a non-empty string.');
      return guard(() => {
        const raw = storage.getItem(recordKey(id));
        return raw === null ? null : parseRecord(raw);
      });
    },

    // Creates or updates. Validates first; rejects with ValidationError.
    async put(record) {
      requireReady();
      const rec = await prepare(record, async (id) => id in index.entries);
      const key = recordKey(rec.id);
      guard(() => {
        const previousRecord = storage.getItem(key);
        const previousIndex = index.entries[rec.id];
        storage.setItem(key, JSON.stringify(rec));
        index.entries[rec.id] = { d: rec.session_date, t: rec.entry_time || '' };
        try {
          saveIndex();
        } catch (e) {
          // Keep the record and the index consistent: undo the record write.
          if (previousRecord === null) storage.removeItem(key); else storage.setItem(key, previousRecord);
          if (previousIndex === undefined) delete index.entries[rec.id]; else index.entries[rec.id] = previousIndex;
          throw e;
        }
      });
      return rec;
    },

    async remove(id) {
      requireReady();
      if (typeof id !== 'string' || !id) throw new StorageError('bad-argument', 'remove(): id must be a non-empty string.');
      return guard(() => {
        const existed = id in index.entries || storage.getItem(recordKey(id)) !== null;
        if (!existed) return false;
        const previous = index.entries[id];
        delete index.entries[id];
        try {
          saveIndex();
        } catch (e) {
          if (previous !== undefined) index.entries[id] = previous;
          throw e;
        }
        storage.removeItem(recordKey(id));
        return true;
      });
    },

    async exportAll() {
      requireReady();
      const records = await this.list({});
      return buildExport(records);
    },

    // Validates every record first; nothing is touched if any is invalid.
    // Then replaces the whole journal. If a write fails part-way (quota),
    // the previous contents are restored.
    async importAll(json) {
      requireReady();
      const records = await parseImport(json);
      guard(() => {
        const snapshot = allKeys().map(k => [k, storage.getItem(k)]);
        const previousIndex = index;
        try {
          // Records and the index go; settings (the meta key) stay.
          for (const [k] of snapshot) if (k !== META_KEY) storage.removeItem(k);
          index = { v: 1, entries: {} };
          for (const rec of records) {
            storage.setItem(recordKey(rec.id), JSON.stringify(rec));
            index.entries[rec.id] = { d: rec.session_date, t: rec.entry_time || '' };
          }
          saveIndex();
        } catch (e) {
          // Put back exactly what was there before.
          for (const k of allKeys()) storage.removeItem(k);
          for (const [k, v] of snapshot) storage.setItem(k, v);
          index = previousIndex;
          throw e;
        }
      });
      return { count: records.length };
    },

    // bytes: UTF-8 size of the stored records plus the index.
    async stats() {
      requireReady();
      return guard(() => {
        let bytes = byteLength(storage.getItem(INDEX_KEY) || '');
        for (const { id } of entryList()) bytes += byteLength(storage.getItem(recordKey(id)) || '');
        return summarise(entryList(), bytes);
      });
    },

    // UI-level settings (e.g. the last-export time). Settings are not
    // records: they need no init() and are never touched by importAll().
    async getMeta() {
      return guard(() => parseMetaValue(storage.getItem(META_KEY)));
    },

    async setMeta(partial) {
      if (partial === null || typeof partial !== 'object' || Array.isArray(partial)) {
        throw new StorageError('bad-argument', 'setMeta(): expected an object of settings.');
      }
      return guard(() => {
        const next = { ...parseMetaValue(storage.getItem(META_KEY)), ...partial };
        storage.setItem(META_KEY, JSON.stringify(next));
        return next;
      });
    },
  };
}
