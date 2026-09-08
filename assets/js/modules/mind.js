/* ============================================================
   MIND — state and mental load.
   Two jobs: a fast daily read on how you actually are, and an
   inventory of open loops. Open loops are weighted and drag the
   Alignment Index down, because that is what they do in real life.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store, D } = LO;

  const KINDS = [
    { id: 'loop', label: 'Open loop' },
    { id: 'commit', label: 'Commitment' },
    { id: 'worry', label: 'Worry' },
    { id: 'decision', label: 'Decision' }
  ];
  const CLOSE_LINES = [
    'Closed. That attention comes back to you now.',
    'Off the list. That is real capacity recovered.',
    'Loop shut. Notice how much quieter it is.',
    'Done. You were paying rent on that one.'
  ];

  LO.app.register({
    id: 'mind',
    name: 'Mind',
    glyph: '◉',
    accent: 'var(--c-mind)',
    accentSoft: 'rgba(110,231,245,.14)',
    tagline: 'Daily state, mental load, and what to close next',

    metric(s) {
      const row = s.mind.logs.find(r => r.date === D.today());
      const open = s.mind.load.filter(l => l.status !== 'closed').length;
      return (row ? 'mood ' + row.mood : 'no check-in') + ' · ' + open + ' loops';
    },

    render(s) {
      const M = s.mind, today = D.today();
      const row = M.logs.find(r => r.date === today) || {};
      const open = M.load.filter(l => l.status !== 'closed');
      const closed = M.load.filter(l => l.status === 'closed');
      const weight = open.reduce((a, l) => a + (+l.weight || 1), 0);
      const days = D.lastDays(21);
      const byDate = d => M.logs.find(r => r.date === d) || {};
      const heaviest = [...open].sort((a, b) => (+b.weight || 1) - (+a.weight || 1))[0];

      return `<div class="grid wide">

        ${ui.card('Check In · ' + D.pretty(today), `
          <div data-form>
            ${ui.field('mood', 'Mood', { type: 'range', min: 1, max: 10, value: row.mood || 6 })}
            ${ui.field('energy', 'Energy', { type: 'range', min: 1, max: 10, value: row.energy || 6 })}
            ${ui.field('clarity', 'Clarity', { type: 'range', min: 1, max: 10, value: row.clarity || 6 })}
            ${ui.field('stress', 'Stress', { type: 'range', min: 1, max: 10, value: row.stress || 4 })}
            ${ui.field('grateful', 'One good thing', { ph: 'Specific beats profound', value: row.grateful || '' })}
            ${ui.field('note', 'What is actually going on', { type: 'textarea', rows: 2, value: row.note || '' })}
            <button class="btn primary" data-save>${row.mood ? 'Update Today' : 'Log State'}</button>
          </div>`, { delay: 0, span: true })}

        ${ui.card('State Trend', M.logs.length > 1 ? `
          <div style="font-size:9.5px;letter-spacing:.2em;color:var(--ink-3);margin-bottom:4px">MOOD · 21 DAYS</div>
          ${ui.spark(days.map(d => +byDate(d).mood || null), { min: 1, max: 10 })}
          <div style="font-size:9.5px;letter-spacing:.2em;color:var(--ink-3);margin:12px 0 4px">ENERGY</div>
          ${ui.spark(days.map(d => +byDate(d).energy || null), { min: 1, max: 10 })}
          <div style="font-size:9.5px;letter-spacing:.2em;color:var(--ink-3);margin:12px 0 4px">STRESS</div>
          ${ui.spark(days.map(d => +byDate(d).stress || null), { min: 1, max: 10 })}`
          : ui.empty('Check in a few days running and the trend lines appear here.'), { delay: 60 })}

        ${ui.card('Mental Load', `
          <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
            ${ui.ring(Math.max(0, 100 - weight * 6), 88, String(weight))}
            <div style="flex:1;min-width:130px">
              <div class="sub" style="margin-top:0">${open.length} open · total weight ${weight}</div>
              ${heaviest ? `<div class="sub">Heaviest: <b style="color:var(--ink-0)">${ui.esc(heaviest.title)}</b></div>` : ''}
              ${closed.length ? `<div class="sub">${closed.length} closed all-time</div>` : ''}
            </div>
          </div>
          <div class="hr"></div>
          <div class="sub" style="margin-top:0">Every open loop is drawing power whether you are thinking about it or not.</div>`,
          { delay: 120 })}

        ${ui.card('Capture a Loop', `
          <div data-lform>
            ${ui.field('title', 'What is open', { ph: 'The thing you keep half-remembering' })}
            ${ui.field('kind', 'Kind', { type: 'select', options: KINDS })}
            ${ui.field('weight', 'How heavy', { type: 'range', min: 1, max: 5, value: 2 })}
            <button class="btn primary" data-addl>Capture</button>
          </div>
          <div class="sub">Capturing is not solving. Get it out of your head first.</div>`, { delay: 180 })}

        ${ui.card('Open Loops', open.length ? `
          <div class="list">${open.sort((a, b) => (+b.weight || 1) - (+a.weight || 1)).map(l => `
            <div class="item">
              <button class="hexcell" data-close="${l.id}" title="Close this loop" style="width:22px;height:25px"></button>
              <div class="t">${ui.esc(l.title)}
                <em>${kindLabel(l.kind)} · weight ${l.weight} · ${D.pretty(l.created)}</em></div>
              <button class="x" data-dell="${l.id}">×</button>
            </div>`).join('')}</div>`
          : ui.empty('Nothing open. Rare and worth noticing.'), { delay: 240, span: true })}

        ${closed.length ? ui.card('Closed', `
          <div class="list">${closed.slice(0, 10).map(l => `
            <div class="item" style="opacity:.6">
              <span style="color:var(--ok)">✓</span>
              <div class="t">${ui.esc(l.title)}<em>${kindLabel(l.kind)}</em></div>
              <button class="x" data-dell="${l.id}">×</button>
            </div>`).join('')}</div>`, { delay: 300 }) : ''}
      </div>`;
    },

    mount(root) {
      const self = LO.app.get('mind');

      root.querySelector('[data-save]').onclick = () => {
        const d = ui.read(root.querySelector('[data-form]'));
        store.setLog('mind.logs', {
          mood: +d.mood, energy: +d.energy, clarity: +d.clarity, stress: +d.stress,
          grateful: d.grateful.trim(), note: d.note.trim()
        });
        ui.toast('State logged'); self.refresh();
      };

      root.querySelector('[data-addl]').onclick = () => {
        const d = ui.read(root.querySelector('[data-lform]'));
        if (!d.title.trim()) return ui.toast('Name the loop');
        store.add('mind.load', {
          title: d.title.trim(), kind: d.kind, weight: +d.weight,
          status: 'open', created: D.today()
        });
        ui.toast('Captured — out of your head'); self.refresh();
      };

      root.querySelectorAll('[data-close]').forEach(b => {
        b.onclick = () => {
          store.patch('mind.load', b.dataset.close, { status: 'closed', closedOn: D.today() });
          ui.toast(CLOSE_LINES[Math.floor(Math.random() * CLOSE_LINES.length)]);
          self.refresh();
        };
      });
      root.querySelectorAll('[data-dell]').forEach(b => {
        b.onclick = () => { store.drop('mind.load', b.dataset.dell); self.refresh(); };
      });
    }
  });

  function kindLabel(id) { const k = KINDS.find(x => x.id === id); return k ? k.label : id; }
})(window.LO);
