/* ============================================================
   THE BLUEPRINT — Level-marking drill (level-drill.js)
   Renders a drill config (see validateDrill in lesson-core.js) on
   TradingView Lightweight Charts v5.2.1 (Apache-2.0, js/vendor/).
   Bars are synthetic and ship inside the lesson config; no real
   exported bars are used. The library is loaded on first start.
   ============================================================ */

import { scoreEdge, scoreJudge, validateDrill } from './lesson-core.js';

const LIB = new URL('./vendor/lightweight-charts.standalone.production.js', import.meta.url).href;
let libPromise = null;

function loadLib() {
  if (window.LightweightCharts) return Promise.resolve(window.LightweightCharts);
  libPromise ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = LIB;
    s.onload = () => resolve(window.LightweightCharts);
    s.onerror = () => { libPromise = null; reject(new Error('chart library failed to load')); };
    document.head.append(s);
  });
  return libPromise;
}

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v; else n.setAttribute(k, v);
  }
  n.append(...kids);
  return n;
}

const fmt = (p) => p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clock = (t) => {
  const d = new Date(t * 1000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};

export function createDrill(drill) {
  if (validateDrill(drill).length) return null;
  const root = el('div', { class: 'lesson-drill' });
  const rounds = drill.rounds;
  let chart = null;

  function intro() {
    const start = el('button', { type: 'button', class: 'btn btn--primary btn--sm' }, 'Start the drill');
    start.addEventListener('click', async () => {
      start.disabled = true;
      start.textContent = 'Loading chart…';
      try { await loadLib(); } catch {
        start.textContent = 'The chart could not load. Reload the page to try again.';
        return;
      }
      run(0, 0);
    });
    root.replaceChildren(
      el('h3', { class: 'lesson-check-title' }, drill.title),
      el('p', {}, drill.intro),
      start,
      attribution());
  }

  function attribution() {
    return el('p', { class: 'lesson-drill-credit' }, 'Charts by ',
      Object.assign(el('a', { href: 'https://www.tradingview.com/', rel: 'noopener', target: '_blank' }), { textContent: 'TradingView Lightweight Charts™' }),
      ' v5.2.1 (Apache-2.0). Bars are synthetic.');
  }

  function run(i, score) {
    chart?.remove();
    chart = null;
    const round = rounds[i];
    const LW = window.LightweightCharts;
    const holder = el('div', { class: 'lesson-drill-chart' });
    const msg = el('p', { class: 'lesson-check-msg', role: 'status' });
    const next = el('button', { type: 'button', class: 'btn btn--primary btn--sm', hidden: '' }, i + 1 < rounds.length ? 'Next chart' : 'See result');
    const controls = el('div', { class: 'lesson-drill-controls' });
    root.replaceChildren(
      el('h3', { class: 'lesson-check-title' }, `${drill.title}: chart ${i + 1} of ${rounds.length}`),
      el('p', {}, round.prompt), holder, controls, msg, next, attribution());

    chart = LW.createChart(holder, {
      autoSize: true,
      height: 320,
      layout: { background: { type: 'solid', color: '#0d1117' }, textColor: '#9aa4b2' },
      grid: { vertLines: { color: '#1b222c' }, horzLines: { color: '#1b222c' } },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#2a3340' },
      rightPriceScale: { borderColor: '#2a3340' },
      localization: { timeFormatter: clock },
      handleScroll: false,
      handleScale: false,
    });
    const series = chart.addSeries(LW.CandlestickSeries, {
      upColor: '#3fb950', downColor: '#f85149', borderVisible: false,
      wickUpColor: '#3fb950', wickDownColor: '#f85149',
      priceFormat: { type: 'price', precision: 2, minMove: 0.25 },
    });
    series.setData(round.bars.map(([time, open, high, low, close]) => ({ time, open, high, low, close })));
    chart.timeScale().fitContent();

    let done = false;
    const finish = (hit, text) => {
      done = true;
      const ok = hit ? 1 : 0;
      msg.className = `lesson-check-msg ${hit ? 'lesson-right' : 'lesson-wrong'}`;
      msg.textContent = `${hit ? 'Correct' : 'Not quite'}. ${text} ${round.why}`;
      next.hidden = false;
      next.focus();
      next.onclick = () => (i + 1 < rounds.length ? run(i + 1, score + ok) : result(score + ok));
    };

    if (round.kind === 'edge') {
      msg.textContent = 'Click the chart at the price you choose.';
      chart.subscribeClick((param) => {
        if (done || !param.point) return;
        const pick = series.coordinateToPrice(param.point.y);
        if (pick === null) return;
        const r = scoreEdge(pick, round.answer, round.tolerance);
        series.createPriceLine({ price: pick, color: '#58a6ff', lineWidth: 1, lineStyle: 2, title: 'Your pick' });
        series.createPriceLine({ price: round.answer, color: r.hit ? '#3fb950' : '#f0883e', lineWidth: 2, lineStyle: 0, title: 'Far edge' });
        finish(r.hit, `You picked ${fmt(pick)}; the far edge is ${fmt(round.answer)} (within ${round.tolerance} points counts).`);
      });
    } else {
      series.createPriceLine({ price: round.line, color: '#58a6ff', lineWidth: 2, lineStyle: 0, title: fmt(round.line) });
      for (const [label, value] of [['Passes: it is a level', true], ['Fails: it is not a level', false]]) {
        const b = el('button', { type: 'button', class: 'btn btn--ghost btn--sm' }, label);
        b.addEventListener('click', () => {
          if (done) return;
          controls.querySelectorAll('button').forEach((x) => { x.disabled = true; });
          finish(scoreJudge(value, round.isLevel).hit, '');
        });
        controls.append(b);
      }
      msg.textContent = 'Choose one.';
    }
  }

  function result(score) {
    chart?.remove();
    chart = null;
    const again = el('button', { type: 'button', class: 'btn btn--ghost btn--sm' }, 'Run it again');
    again.addEventListener('click', () => run(0, 0));
    root.replaceChildren(
      el('h3', { class: 'lesson-check-title' }, `${drill.title}: ${score} of ${rounds.length}`),
      el('p', {}, score === rounds.length
        ? 'Every chart marked correctly. On your own chart, write the stop sentence for each row before you trust it.'
        : 'Run it again. For each miss, ask what already happened at the price and where the far edge sits.'),
      again, attribution());
  }

  intro();
  return root;
}
