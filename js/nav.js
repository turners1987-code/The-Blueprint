/* ============================================================
   THE BLUEPRINT — Shared Navigation (js/nav.js)
   ============================================================
   Injects the same nav markup into every page so the nav only
   has to be maintained here — never per-page.

   Usage:
     1. Put <div id="nav-root"></div> where the nav belongs.
     2. Load this script as a module (order relative to other
        scripts does not matter):
          root pages:   <script type="module" src="js/nav.js"></script>
          modules/ pages: <script type="module" src="../js/nav.js"></script>

   The mobile menu is injected as a SIBLING of <nav>, never a
   child of it — nesting it inside <nav> creates a stacking
   context that breaks position:fixed in Safari.
   ============================================================ */

import { Progress } from './progress.js';

function initNav() {
  const root = document.getElementById('nav-root');
  if (!root) return;

  // ── Where are we? ──────────────────────────────────────────
  const path = window.location.pathname;
  // A <base href> (404.html) already anchors every relative URL at the
  // site root, so no ../ prefix is needed there.
  const hasBase = !!document.querySelector('base');
  const prefix = !hasBase && path.includes('/modules/') ? '../' : '';
  const page = hasBase ? '404.html' : (path.substring(path.lastIndexOf('/') + 1) || 'index.html');

  // With a <base href>, a bare "#main-content" would navigate to the base.
  const skipHref = (hasBase ? window.location.pathname + window.location.search : '') + '#main-content';

  // ── The single link set (desktop + mobile) ─────────────────
  const LINKS = [
    { key: 'modules',  label: 'Modules',   href: 'index.html#course' },
    { key: 'glossary', label: 'Glossary',  href: 'glossary.html' },
    { key: 'deck',     label: 'Card Deck', href: 'modules/flashcards.html' },
    { key: 'dial',     label: 'Dial In',   href: 'modules/dial-in.html' },
    { key: 'home',     label: 'Home',      href: 'index.html' },
  ];

  // Which link is active here? Exact page match wins; any other
  // page inside modules/ is course content → Modules.
  const EXACT = {
    'glossary.html': 'glossary',
    'flashcards.html': 'deck',
    'dial-in.html': 'dial',
    'index.html': 'home',
  };
  const activeKey = EXACT[page] || (prefix ? 'modules' : null);

  const listItems = () => LINKS.map(l => {
    const active = l.key === activeKey ? ' class="active" aria-current="page"' : '';
    return `<li><a href="${prefix}${l.href}"${active}>${l.label}</a></li>`;
  }).join('\n        ');

  // ── Optional CTA, rendered after the link set ──────────────
  // index.html promotes the course; every other page points home.
  const CTA = (page === 'index.html')
    ? { label: 'Start Course', href: 'modules/00-welcome.html', btn: 'btn--primary', id: ' id="continue-btn"' }
    : { label: '← Home',       href: 'index.html',              btn: 'btn--ghost',   id: '' };

  // ── Inject ─────────────────────────────────────────────────
  root.insertAdjacentHTML('beforebegin', `
  <a class="skip-link" href="${skipHref}">Skip to content</a>
  <nav class="site-nav">
    <div class="container container--wide">
      <a href="${prefix}index.html" class="nav-logo">The <span>Blueprint</span></a>
      <ul class="nav-links">
        ${listItems()}
        <li><a href="${prefix}${CTA.href}"${CTA.id} class="btn ${CTA.btn} btn--sm">${CTA.label}</a></li>
      </ul>
      <button class="nav-hamburger" id="nav-hamburger" aria-label="Menu" aria-expanded="false" aria-controls="nav-mobile-menu">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="nav-progress-bar"></div>
  </nav>

  <div class="nav-mobile-menu" id="nav-mobile-menu">
    <ul class="nav-mobile-links">
      ${listItems()}
    </ul>
    <div class="nav-mobile-cta">
      <a href="${prefix}${CTA.href}" class="btn btn--primary">${CTA.label}</a>
    </div>
  </div>
  `.trim());
  root.remove();

  // ── Hamburger behavior ─────────────────────────────────────
  const toggle = document.getElementById('nav-hamburger');
  const menu = document.getElementById('nav-mobile-menu');

  const isOpen = () => menu.classList.contains('open');

  const openMenu = () => {
    menu.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // lock page scroll
  };

  const closeMenu = () => {
    menu.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  // nav.js owns the hamburger.
  toggle.addEventListener('click', () => {
    isOpen() ? closeMenu() : openMenu();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      closeMenu();
      toggle.focus();
    }
  });

  // Close on click outside the menu (and outside the button)
  document.addEventListener('click', (e) => {
    if (isOpen() && !menu.contains(e.target) && !toggle.contains(e.target)) closeMenu();
  });

  // Close when a menu link is picked, so navigation never leaves
  // the page with a locked body (bfcache restores it on Back)
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  // The progress bar and Continue button now exist; sync them in case
  // progress.js finished its own pass before the nav was injected.
  Progress.updateUI();
  Progress.updateContinueBtn();
}

// Module scripts are deferred, so the DOM is normally parsed already.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNav);
else initNav();
