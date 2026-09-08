/* ============================================================
   TRAJECTORY — the core node.
   Rolls every pillar into one Alignment Index, shows the 30-day
   line, projects it forward, and owns data portability.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store, D } = LO;

  const PILLARS = [
    { k: 'reps',   label: 'Reps',    hint: '14-day habit adherence' },
    { k: 'aim',    label: 'Aim',     hint: 'average live goal progress' },
    { k: 'body',   label: 'Body',    hint: 'sleep · steps · training vs target' },
    { k: 'mind',   label: 'Mind',    hint: 'mood · energy · clarity · stress' },
    { k: 'clear',  label: 'Clear',   hint: 'days clear, weighted by how urges went' },
    { k: 'bonds',  label: 'Bonds',   hint: 'people contacted inside their own cadence' },
    { k: 'rewire', label: 'Rewire',  hint: 'reprogramming reps logged' },
    { k: 'load',   label: 'Load',    hint: 'open loops, inverted' }
  ];

  LO.app.register({
    id: 'trajectory',
    name: 'Trajectory',
    glyph: '◈',
    accent: 'var(--c-core)',
    accentSoft: 'rgba(77,226,192,.14)',
    tagline: 'Where this is actually heading',

    metric(s) { const v = store.vitals(); return v.signal ? v.index + ' idx' : 'no signal'; },

    render(s) {
      const v = store.vitals();
      const series = store.indexSeries(30);
      const vals = series.map(p => p.v);
      const known = vals.filter(x => x !== null);
      // slope from the last fortnight only — early days are start-up artefact
      const tail = known.slice(-14);
      const trend = tail.length > 3 ? tail[tail.length - 1] - tail[0] : 0;
      const perDay = tail.length > 3 ? trend / (tail.length - 1) : 0;
      const proj90 = Math.max(0, Math.min(100, Math.round(v.index + perDay * 90)));

      const verdict = v.index >= 80 ? 'Compounding. Protect the machine.'
        : v.index >= 60 ? 'Holding. One pillar is doing the work.'
        : v.index >= 35 ? 'Drifting. The floor needs raising, not the ceiling.'
        : known.length ? 'Cold start. Pick one pillar and only that.'
        : 'No signal yet — feed any module once and this comes alive.';

      const weakest = PILLARS.filter(p => v.pillars[p.k] !== null)
        .sort((a, b) => v.pillars[a.k] - v.pillars[b.k])[0];

      return `<div class="grid wide">

        ${ui.card('Alignment Index', `
          <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
            ${ui.ring(v.index, 112)}
            <div style="flex:1;min-width:170px">
              <div style="font-size:15px;color:var(--ink-0);line-height:1.5">${ui.esc(verdict)}</div>
              <div class="tags" style="margin-top:11px">
                <span class="tag ${trend >= 0 ? 'hot' : ''}">${trend >= 0 ? '▲' : '▼'} ${Math.abs(trend)} / 14d</span>
                <span class="tag">90d at this slope · ${proj90}</span>
                <span class="tag">${v.signal} of 7 pillars live</span>
              </div>
            </div>
          </div>
          <div class="hr"></div>
          ${ui.spark(vals, { min: 0, max: 100 })}
          <div style="display:flex;justify-content:space-between;font-size:9.5px;letter-spacing:.14em;color:var(--ink-3);margin-top:4px">
            <span>${D.pretty(series[0].date)}</span><span>TODAY</span>
          </div>`, { span: true })}

        ${ui.card('Pillars', PILLARS.map(p => {
          const val = v.pillars[p.k];
          return `<div style="margin-bottom:11px">
            <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:5px">
              <span style="color:var(--ink-1);letter-spacing:.08em">${p.label}</span>
              <b class="mono" style="color:${val == null ? 'var(--ink-3)' : 'var(--ink-0)'}">${val == null ? '—' : val}</b>
            </div>
            ${ui.meter(val || 0)}
            <div style="font-size:9.5px;color:var(--ink-3);margin-top:4px">${p.hint}</div>
          </div>`;
        }).join(''), { delay: 60 })}

        ${ui.card('The One Lever', weakest ? `
          <div class="big" style="font-size:22px">${weakest.label}</div>
          <div class="sub">Lowest pillar at <b class="mono">${v.pillars[weakest.k]}</b>. Moving this moves the index more than anything else you could do today.</div>
          <div class="hr"></div>
          <div class="btn-row">
            <button class="btn sm" data-jump="${leverTarget(weakest.k)}">Go there</button>
          </div>` : ui.empty('Log anything once and the system will start naming your bottleneck.'),
          { delay: 120 })}

        ${ui.card('Inventory', `
          <div class="kv"><span>Goals live</span><b>${s.goals.filter(g => g.status !== 'done' && g.status !== 'parked').length}</b></div>
          <div class="kv"><span>Habits tracked</span><b>${s.habits.length}</b></div>
          <div class="kv"><span>Rewire targets</span><b>${s.rewire.targets.length}</b></div>
          <div class="kv"><span>Reps logged</span><b>${s.rewire.reps.length}</b></div>
          <div class="kv"><span>Journal entries</span><b>${s.scribe.entries.length}</b></div>
          <div class="kv"><span>Open loops</span><b>${v.openLoad}</b></div>
          <div class="kv"><span>First steps banked</span><b>${s.wins.length}</b></div>
          <div class="kv"><span>Start streak</span><b>${store.winStreak()}d</b></div>
          <div class="kv"><span>People tracked</span><b>${s.people.length}</b></div>
          <div class="kv"><span>Days clear</span><b>${store.daysClear() === null ? '—' : store.daysClear()}</b></div>
          <div class="kv"><span>Day streak</span><b>${s.meta.streak || 0}</b></div>
          <div class="kv"><span>Since</span><b>${D.pretty(s.meta.created)}</b></div>`, { delay: 180 })}

        ${ui.card('Core Data', `
          <div class="sub" style="margin-top:0">Everything lives in one JSON object in this browser. Export is your backup and your bridge to the app and iOS build.</div>
          <div class="btn-row" style="margin-top:12px">
            <button class="btn sm primary" data-jump="ignition">Open Ignition</button>
          </div>
          <div class="btn-row" style="margin-top:8px">
            <button class="btn sm" data-act="export">Export JSON</button>
            <button class="btn sm" data-act="import">Import</button>
            <button class="btn sm danger" data-act="wipe">Wipe</button>
          </div>
          <input type="file" accept="application/json" data-file hidden>
          <div class="hr"></div>
          <div class="kv"><span>Schema</span><b>v${s.meta.schema}</b></div>
          <div class="kv"><span>Sessions</span><b>${s.meta.opens}</b></div>`, { delay: 240 })}
      </div>`;
    },

    mount(root) {
      root.querySelectorAll('[data-jump]').forEach(b => {
        b.onclick = () => {
          if (b.dataset.jump === 'ignition') location.href = '../index.html';
          else location.hash = b.dataset.jump;
        };
      });

      const file = root.querySelector('[data-file]');
      const act = {
        export() {
          const blob = new Blob([store.export()], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'life-organizer-' + D.today() + '.json';
          a.click();
          URL.revokeObjectURL(a.href);
          ui.toast('Snapshot exported');
        },
        import() { file.click(); },
        wipe() {
          if (!confirm('Erase all Life Organizer data in this browser? Export first if you want it back.')) return;
          store.wipe();
          ui.toast('Wiped clean');
          location.hash = ''; location.reload();
        }
      };
      root.querySelectorAll('[data-act]').forEach(b => { b.onclick = () => act[b.dataset.act](); });

      file.onchange = () => {
        const f = file.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try { store.import(r.result); ui.toast('Data restored'); location.reload(); }
          catch (e) { ui.toast('That file did not parse'); }
        };
        r.readAsText(f);
      };
    }
  });

  /* clear and bonds are captured in Ignition, so the lever sends you there */
  function leverTarget(k) {
    return { reps: 'forge', aim: 'compass', body: 'vessel', mind: 'mind',
             rewire: 'rewire', load: 'mind', clear: 'ignition', bonds: 'ignition' }[k] || 'hub';
  }
})(window.LO);
