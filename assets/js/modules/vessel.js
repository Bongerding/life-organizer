/* ============================================================
   VESSEL — the body.
   Daily log, targets, training sessions. Numbers only; the
   interpretation happens in Trajectory.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store, D } = LO;

  LO.app.register({
    id: 'vessel',
    name: 'Vessel',
    glyph: '▲',
    accent: 'var(--c-vessel)',
    accentSoft: 'rgba(74,222,128,.14)',
    tagline: 'Sleep, load, training — the hardware you run on',

    metric(s) {
      const row = s.vessel.logs.find(r => r.date === D.today());
      const week = s.vessel.sessions.filter(x => D.daysBetween(x.date, D.today()) < 7).length;
      return row && row.sleep ? (+row.sleep).toFixed(1) + 'h · ' + week + ' sess' : week + ' sess / 7d';
    },

    render(s) {
      const V = s.vessel, t = V.targets, today = D.today();
      const row = V.logs.find(r => r.date === today) || {};
      const week = D.lastDays(7);
      const trained = V.sessions.filter(x => D.daysBetween(x.date, today) < 7);
      const byDate = d => V.logs.find(r => r.date === d) || {};
      const avg = k => {
        const vals = week.map(d => +byDate(d)[k]).filter(v => v > 0);
        return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      };
      const weights = V.logs.filter(r => r.weight).slice(0, 30).reverse().map(r => +r.weight);

      return `<div class="grid wide">

        ${ui.card('Log Today · ' + D.pretty(today), `
          <div data-form>
            <div class="row">
              ${ui.field('sleep', 'Sleep (h)', { type: 'number', step: '0.25', value: row.sleep || '' })}
              ${ui.field('weight', 'Weight', { type: 'number', step: '0.1', value: row.weight || '' })}
            </div>
            <div class="row">
              ${ui.field('steps', 'Steps', { type: 'number', value: row.steps || '' })}
              ${ui.field('water', 'Water (L)', { type: 'number', step: '0.25', value: row.water || '' })}
            </div>
            ${ui.field('note', 'Note', { ph: 'How the body actually felt', value: row.note || '' })}
            <button class="btn primary" data-save>Save Day</button>
          </div>`, { delay: 0 })}

        ${ui.card('7-Day Vitals', `
          <div class="kv"><span>Avg sleep</span><b>${avg('sleep').toFixed(1)}h ${bar(avg('sleep'), t.sleep)}</b></div>
          <div class="kv"><span>Avg steps</span><b>${Math.round(avg('steps')).toLocaleString()} ${bar(avg('steps'), t.steps)}</b></div>
          <div class="kv"><span>Avg water</span><b>${avg('water').toFixed(1)}L ${bar(avg('water'), t.water)}</b></div>
          <div class="kv"><span>Sessions</span><b>${trained.length}/${t.train} ${bar(trained.length, t.train)}</b></div>
          <div class="hr"></div>
          <div style="font-size:9.5px;letter-spacing:.2em;color:var(--ink-3);margin-bottom:7px">SLEEP</div>
          ${ui.bars(week.map(d => ({ label: D.label(d)[0], v: +byDate(d).sleep || 0 })), { target: t.sleep })}
          <div style="font-size:9.5px;letter-spacing:.2em;color:var(--ink-3);margin:12px 0 7px">STEPS</div>
          ${ui.bars(week.map(d => ({ label: D.label(d)[0], v: +byDate(d).steps || 0 })), { target: t.steps })}`,
          { delay: 60 })}

        ${ui.card('Weight Trend', weights.length > 1 ? `
          <div class="big">${weights[weights.length - 1]}<small>latest</small></div>
          <div class="sub">${(() => {
            const d = weights[weights.length - 1] - weights[0];
            return (d >= 0 ? '+' : '') + d.toFixed(1) + ' across ' + weights.length + ' logged days';
          })()}</div>
          ${ui.spark(weights)}` : ui.empty('Log weight on a few days to see the trend line.'), { delay: 120 })}

        ${ui.card('Targets', `
          <div data-targets>
            <div class="row">
              ${ui.field('sleep', 'Sleep (h)', { type: 'number', step: '0.25', value: t.sleep })}
              ${ui.field('steps', 'Steps', { type: 'number', value: t.steps })}
            </div>
            <div class="row">
              ${ui.field('train', 'Sessions / wk', { type: 'number', value: t.train })}
              ${ui.field('water', 'Water (L)', { type: 'number', step: '0.25', value: t.water })}
            </div>
            ${ui.field('weight', 'Goal weight', { type: 'number', step: '0.1', value: t.weight || '' })}
            <button class="btn" data-savet>Update Targets</button>
          </div>`, { delay: 180 })}

        ${ui.card('Log Session', `
          <div data-sform>
            <div class="row">
              ${ui.field('type', 'Type', { ph: 'Push, Run, Jiu-jitsu…' })}
              ${ui.field('load', 'Volume', { ph: '5x5 @ 100kg / 8km' })}
            </div>
            ${ui.field('rpe', 'Effort', { type: 'range', min: 1, max: 10, value: 7 })}
            ${ui.field('note', 'Note', { ph: 'What moved, what hurt' })}
            <button class="btn primary" data-adds>Bank Session</button>
          </div>`, { delay: 240 })}

        ${ui.card('Recent Training', V.sessions.length ? `
          <div class="list">${V.sessions.slice(0, 14).map(x => `
            <div class="item">
              <span class="mono" style="font-size:10.5px;color:var(--ink-3);min-width:56px">${D.pretty(x.date)}</span>
              <div class="t">${ui.esc(x.type)}<em>${ui.esc(x.load || '')}${x.note ? ' · ' + ui.esc(x.note) : ''}</em></div>
              <span class="tag">RPE ${x.rpe}</span>
              <button class="x" data-dels="${x.id}">×</button>
            </div>`).join('')}</div>`
          : ui.empty('No sessions banked.'), { delay: 300, span: true })}
      </div>`;
    },

    mount(root) {
      const self = LO.app.get('vessel');

      root.querySelector('[data-save]').onclick = () => {
        const d = ui.read(root.querySelector('[data-form]'));
        store.setLog('vessel.logs', {
          sleep: num(d.sleep), weight: num(d.weight), steps: num(d.steps),
          water: num(d.water), note: d.note.trim()
        });
        ui.toast('Day logged'); self.refresh();
      };

      root.querySelector('[data-savet]').onclick = () => {
        const d = ui.read(root.querySelector('[data-targets]'));
        Object.assign(store.state.vessel.targets, {
          sleep: num(d.sleep), steps: num(d.steps), train: num(d.train),
          water: num(d.water), weight: num(d.weight)
        });
        store.save(); ui.toast('Targets updated'); self.refresh();
      };

      root.querySelector('[data-adds]').onclick = () => {
        const d = ui.read(root.querySelector('[data-sform]'));
        if (!d.type.trim()) return ui.toast('What kind of session?');
        store.add('vessel.sessions', {
          date: D.today(), type: d.type.trim(), load: d.load.trim(),
          rpe: num(d.rpe), note: d.note.trim()
        });
        ui.toast('Session banked'); self.refresh();
      };

      root.querySelectorAll('[data-dels]').forEach(b => {
        b.onclick = () => { store.drop('vessel.sessions', b.dataset.dels); self.refresh(); };
      });
    }
  });

  function num(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }
  function bar(v, target) {
    if (!target) return '';
    const pct = Math.round(Math.min(1, (v || 0) / target) * 100);
    const c = pct >= 90 ? 'var(--ok)' : pct >= 60 ? 'var(--warn)' : 'var(--bad)';
    return `<span style="color:${c};font-size:10px;margin-left:6px">${pct}%</span>`;
  }
})(window.LO);
