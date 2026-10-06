/* ============================================================
   THE BLUEPRINT — Service worker (sw.js)
   Caches the app shell and the published module pages so the
   course can be read offline. Registered from js/main.js.

   To ship a change to cached files, bump CACHE_VERSION. The old
   cache is deleted when the new worker activates.
   ============================================================ */

const CACHE_VERSION = 'v3';
const CACHE_NAME = `blueprint-${CACHE_VERSION}`;

// App shell: paths are relative to this file (the site root).
const SHELL = [
  './',
  'index.html',
  '404.html',
  'glossary.html',
  'journal.html',
  'journal-analysis.html',
  'modules/flashcards.html',
  'modules/dial-in.html',
  'css/main.css',
  'css/index.css',
  'css/glossary.css',
  'css/journal.css',
  'css/modules.css',
  'css/flashcards.css',
  'css/dial-in.css',
  'css/toothbrush-therapy.css',
  'css/404.css',
  'js/main.js',
  'js/nav.js',
  'js/progress.js',
  'js/modules.js',
  'js/journal/schema.js',
  'js/journal/analysis.js',
  'js/journal/storage.js',
  'js/journal/storage-common.js',
  'js/journal/storage-local.js',
  'js/journal/storage-fs.js',
  'js/journal/ui.js',
  'js/journal/ui-analysis.js',
  'js/cards.json',
  'data/modules.json',
  'manifest.json',
  'assets/favicon.svg',
];

// Module pages that exist (published, or drafting and linked) come from
// data/modules.json, so nothing needs editing here when one is published.
const modulePages = async (cache) => {
  const res = await cache.match('data/modules.json');
  if (!res) return [];
  const list = await res.json();
  return list
    .filter(m => m.status === 'published' || m.status === 'drafting')
    .map(m => `modules/${m.number}-${m.slug}.html`);
};

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SHELL);
    // Best effort: one missing module page should not fail the install.
    await Promise.all((await modulePages(cache)).map(url => cache.add(url).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(n => n.startsWith('blueprint-') && n !== CACHE_NAME)
      .map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

// Network first, so edits show up as soon as the user is online;
// the cache answers when the network does not.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;
      if (req.mode === 'navigate') return cache.match('index.html');
      return Response.error();
    }
  })());
});
