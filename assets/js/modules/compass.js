/* ============================================================
   COMPASS — identity and goals.
   The reference frame. Every other module is judged against
   what gets written here, so this module comes first.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store, lib, D } = LO;

  LO.app.register({
    id: 'compass',
    name: 'Compass',
    glyph: '✦',
    accent: 'var(--c-compass)',
    accentSoft: 'rgba(124,156,255,.14)',
    tagline: 'North star, values, and every horizon of goal',

    metric(s) {
      const live = s.goals.filter(g => g.status !== 'done' && g.status !== 'parked');
      if (!live.length) return 'no goals';
      const avg = Math.round(live.reduce((a, g) => a + (+g.progress || 0), 0) / live.length);
      return live.length + ' live · ' + avg + '%';
    },

    render(s) {
      const id = s.identity;

      return `<div class="grid wide">

        ${ui.card('North Star', `
          <textarea data-ns rows="2" placeholder="One sentence. The direction everything else is measured against.">${ui.esc(id.northStar)}</textarea>
          <div class="sub">Saved as you type. Rewrite it whenever it stops being true — that is data, not failure.</div>`,
          { span: true })}

        ${ui.card('Values', `
          <div class="sub" style="margin-top:0">Tap to select. These weight the trajectory engine.</div>
          <div class="tags" style="margin-top:10px">
            ${lib.valueWords.map(w => {
              const on = id.values.some(v => v.word === w);
              return `<button class="tag ${on ? 'hot' : ''}" data-val="${ui.esc(w)}" style="cursor:pointer;font-family:inherit">${ui.esc(w)}</button>`;
            }).join('')}
          </div>
          ${id.values.length ? `<div class="hr"></div><div class="kv"><span>Selected</span><b>${id.values.length}</b></div>` : ''}`,
          { delay: 60 })}

        ${ui.card('Identity Statements', `
          <div class="sub" style="margin-top:0">"I am the kind of person who…" — behaviour follows the label.</div>
          <div class="list" style="margin:12px 0">
            ${id.statements.length ? id.statements.map(x =>
              `<div class="item"><div class="t">${ui.esc(x.text)}</div>
               <button class="x" data-del-st="${x.id}">×</button></div>`).join('')
              : ui.empty('Nothing declared yet.')}
          </div>
          <div class="row">
            <input data-st placeholder="I am the kind of person who…">
            <button class="btn sm primary" data-add-st style="flex:0 0 auto">Add</button>
          </div>`, { delay: 120 })}

        ${ui.card('Patterns Being Retired', `
          <div class="sub" style="margin-top:0">Named out loud, an old pattern loses most of its grip.</div>
          <div class="list" style="margin:12px 0">
            ${id.avoid.length ? id.avoid.map(x =>
              `<div class="item"><div class="t">${ui.esc(x.text)}</div>
               <button class="x" data-del-av="${x.id}">×</button></div>`).join('')
              : ui.empty('Nothing retired yet.')}
          </div>
          <div class="row">
            <input data-av placeholder="The thing I am done with…">
            <button class="btn sm" data-add-av style="flex:0 0 auto">Add</button>
          </div>`, { delay: 180 })}

        ${ui.card('New Goal', `
          <div data-form>
            ${ui.field('title', 'Goal', { ph: 'What, specifically' })}
            <div class="row">
              ${ui.field('domain', 'Domain', { type: 'select', options: ui.domainOptions() })}
              ${ui.field('horizon', 'Horizon', { type: 'select', options: lib.horizons })}
            </div>
            ${ui.field('why', 'Why it matters', { type: 'textarea', rows: 2, ph: 'The reason that survives a bad week' })}
            <div class="row">
              ${ui.field('metric', 'Measured by', { ph: 'kg, £, sessions, shipped…' })}
              ${ui.field('due', 'Target date', { type: 'date' })}
            </div>
            <button class="btn primary" data-add-goal>Set Goal</button>
          </div>`, { delay: 240, span: true })}

        ${goalsCard(s)}
      </div>`;
    },

    mount(root) {
      const self = LO.app.get('compass');

      // north star — debounced autosave
      const ns = root.querySelector('[data-ns]');
      let t;
      ns.oninput = () => {
        clearTimeout(t);
        t = setTimeout(() => { store.state.identity.northStar = ns.value.trim(); store.save(); }, 450);
      };

      // values
      root.querySelectorAll('[data-val]').forEach(b => {
        b.onclick = () => {
          const w = b.dataset.val, vals = store.state.identity.values;
          const i = vals.findIndex(v => v.word === w);
          if (i > -1) vals.splice(i, 1); else vals.push({ id: store.id('val'), word: w });
          store.save(); self.refresh();
        };
      });

      // statements / avoid
      const addTo = (path, input, label) => {
        const val = input.value.trim();
        if (!val) return;
        store.at(path).push({ id: store.id('t'), text: val });
        store.save(); ui.toast(label); self.refresh();
      };
      const st = root.querySelector('[data-st]');
      root.querySelector('[data-add-st]').onclick = () => addTo('identity.statements', st, 'Declared');
      st.onkeydown = e => { if (e.key === 'Enter') addTo('identity.statements', st, 'Declared'); };

      const av = root.querySelector('[data-av]');
      root.querySelector('[data-add-av]').onclick = () => addTo('identity.avoid', av, 'Retired');
      av.onkeydown = e => { if (e.key === 'Enter') addTo('identity.avoid', av, 'Retired'); };

      root.querySelectorAll('[data-del-st]').forEach(b => {
        b.onclick = () => { store.drop('identity.statements', b.dataset.delSt); self.refresh(); };
      });
      root.querySelectorAll('[data-del-av]').forEach(b => {
        b.onclick = () => { store.drop('identity.avoid', b.dataset.delAv); self.refresh(); };
      });

      // new goal
      const form = root.querySelector('[data-form]');
      root.querySelector('[data-add-goal]').onclick = () => {
        const d = ui.read(form);
        if (!d.title.trim()) { ui.toast('Give it a name'); return; }
        store.add('goals', {
          title: d.title.trim(), domain: d.domain, horizon: d.horizon,
          why: d.why.trim(), metric: d.metric.trim(), due: d.due || '',
          progress: 0, status: 'live', milestones: [], created: D.today()
        });
        ui.toast('Goal set'); self.refresh();
      };

      // goal rows
      root.querySelectorAll('[data-prog]').forEach(sl => {
        sl.oninput = () => {
          sl.closest('.item').querySelector('[data-progout]').textContent = sl.value + '%';
        };
        sl.onchange = () => {
          store.patch('goals', sl.dataset.prog, { progress: +sl.value, status: +sl.value >= 100 ? 'done' : 'live' });
          LO.app.renderTopbar();
        };
      });
      root.querySelectorAll('[data-del-goal]').forEach(b => {
        b.onclick = () => { store.drop('goals', b.dataset.delGoal); self.refresh(); };
      });
      root.querySelectorAll('[data-park]').forEach(b => {
        b.onclick = () => {
          const g = store.state.goals.find(x => x.id === b.dataset.park);
          store.patch('goals', b.dataset.park, { status: g.status === 'parked' ? 'live' : 'parked' });
          self.refresh();
        };
      });
    }
  });

  function goalsCard(s) {
    if (!s.goals.length) {
      return ui.card('Goals', ui.empty('No goals yet. Start with one 90-day goal — horizons above it are easier to see once something is moving.'), { delay: 300, span: true });
    }
    const body = lib.horizons.map(h => {
      const list = s.goals.filter(g => g.horizon === h.id);
      if (!list.length) return '';
      return `<h4 class="sec">${h.label}</h4><div class="list">${list.map(g => `
        <div class="item" style="align-items:flex-start;flex-wrap:wrap">
          <div class="t" style="flex:1 1 200px">
            ${g.status === 'done' ? '✓ ' : ''}${ui.esc(g.title)}
            <em>${ui.domainLabel(g.domain)}${g.metric ? ' · ' + ui.esc(g.metric) : ''}${g.due ? ' · by ' + D.pretty(g.due) : ''}${g.status === 'parked' ? ' · PARKED' : ''}</em>
            ${g.why ? `<em style="color:var(--ink-2)">${ui.esc(g.why)}</em>` : ''}
          </div>
          <div style="flex:1 1 160px;min-width:140px">
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--ink-3);margin-bottom:2px">
              <span>progress</span><b class="mono" data-progout style="color:var(--accent)">${+g.progress || 0}%</b>
            </div>
            <input type="range" min="0" max="100" step="5" value="${+g.progress || 0}" data-prog="${g.id}">
          </div>
          <div style="display:flex;gap:4px;flex:0 0 auto">
            <button class="btn sm ghost" data-park="${g.id}" title="Park / unpark">${g.status === 'parked' ? '▶' : '❙❙'}</button>
            <button class="x" data-del-goal="${g.id}">×</button>
          </div>
        </div>`).join('')}</div>`;
    }).join('');
    return ui.card('Goals', body, { delay: 300, span: true });
  }
})(window.LO);
