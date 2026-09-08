/* ============================================================
   REWIRE — the reprogramming engine.
   You name a pattern you are moving away from and the state you
   are moving toward. The engine then deals you *situations* —
   rehearsals, reframes, implementation intentions, exposures —
   weighted toward the traits your targets need, avoiding drills
   you have run recently. Each completed rep is banked, and the
   reinforcement lands only after you have actually responded.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store, lib, D } = LO;

  let current = null;      // drill currently on the table
  let revealed = false;    // has reinforcement been earned this rep
  let lastResponse = '';   // what was committed, kept visible with the reinforcement

  LO.app.register({
    id: 'rewire',
    name: 'Rewire',
    glyph: '⟳',
    accent: 'var(--c-rewire)',
    accentSoft: 'rgba(255,107,139,.14)',
    tagline: 'Situations that reprogram the pattern, one rep at a time',

    metric(s) {
      const recent = s.rewire.reps.filter(r => D.daysBetween(r.date, D.today()) < 7).length;
      return recent + ' reps / 7d';
    },

    render(s) {
      const R = s.rewire;
      const recent = R.reps.filter(r => D.daysBetween(r.date, D.today()) < 14);

      if (!current) current = deal(s);

      return `<div class="grid wide">

        ${ui.card('On The Table', current ? `
          <div class="drill">
            <div class="kind">${ui.esc(current.kind)} · ${ui.esc(traitLabel(current.trait))}</div>
            <h2>${ui.esc(current.title)}</h2>
            <div class="situation">${ui.esc(current.situation)}</div>
            <div class="ask">${ui.esc(current.ask)}</div>
            ${revealed
              ? `<div style="font-size:13.5px;line-height:1.7;white-space:pre-wrap;color:var(--ink-1);
                   border:1px solid var(--line);border-radius:var(--r-sm);padding:12px;background:rgba(7,10,17,.55)">${ui.esc(lastResponse)}</div>
                 <div class="reinforce">${ui.esc(current.reinforce)}</div>
                 <div class="btn-row" style="margin-top:14px">
                   <button class="btn primary" data-deal>Next Situation</button>
                 </div>`
              : `<textarea data-response rows="4" placeholder="Answer it properly. Half-answers do not rewire anything."></textarea>
                 <div class="btn-row" style="margin-top:12px">
                   <button class="btn primary" data-commit>Commit Rep</button>
                   <button class="btn ghost" data-deal>Deal Another</button>
                 </div>`}
          </div>` : ui.empty('Drill bank empty.'), { span: true })}

        ${ui.card('New Target', `
          <div class="sub" style="margin-top:0">Name the move. The engine weights your drills toward it.</div>
          <div data-form style="margin-top:12px">
            ${ui.field('from', 'Moving away from', { ph: 'Reacting from stress' })}
            ${ui.field('to', 'Moving toward', { ph: 'Answering from calm' })}
            ${ui.field('trait', 'Axis', { type: 'select', options: lib.traits.map(t => ({ id: t.id, label: t.label })) })}
            <button class="btn primary" data-add>Set Target</button>
          </div>`, { delay: 60 })}

        ${ui.card('Targets', R.targets.length ? `
          <div class="list">${R.targets.map(t => {
            const reps = recent.filter(r => r.trait === t.trait).length;
            return `<div class="item" style="align-items:flex-start">
              <div class="t">${ui.esc(t.from)} <span style="color:var(--accent)">→</span> ${ui.esc(t.to)}
                <em>${traitLabel(t.trait)} · ${reps} rep${reps === 1 ? '' : 's'} / 14d · since ${D.pretty(t.created)}</em>
                <div style="margin-top:7px">${ui.meter(Math.min(100, reps / 7 * 100))}</div>
              </div>
              <button class="x" data-del="${t.id}">×</button>
            </div>`;
          }).join('')}</div>`
          : ui.empty('No targets yet. Drills will be dealt from the full bank until you set one.'), { delay: 120 })}

        ${ui.card('Trait Load', `
          <div class="sub" style="margin-top:0">Reps in the last 14 days, by axis.</div>
          <div style="margin-top:12px">
            ${lib.traits.map(t => {
              const n = recent.filter(r => r.trait === t.id).length;
              return `<div style="display:flex;align-items:center;gap:9px;margin-bottom:7px">
                <span style="font-size:10px;letter-spacing:.1em;color:var(--ink-3);width:74px">${t.label.toUpperCase()}</span>
                <div style="flex:1">${ui.meter(Math.min(100, n * 20))}</div>
                <b class="mono" style="font-size:10.5px;width:18px;text-align:right;color:${n ? 'var(--ink-0)' : 'var(--ink-3)'}">${n}</b>
              </div>`;
            }).join('')}
          </div>`, { delay: 180 })}

        ${ui.card('Rep Log', R.reps.length ? `
          <div class="kv"><span>Total reps</span><b>${R.reps.length}</b></div>
          <div class="kv"><span>Last 14 days</span><b>${recent.length}</b></div>
          <div class="hr"></div>
          <div class="list">${R.reps.slice(0, 12).map(r => `
            <div class="item" style="align-items:flex-start">
              <div class="t">${ui.esc(drillTitle(r.drillId))}
                <em>${D.pretty(r.date)} · ${traitLabel(r.trait)}</em>
                ${r.response ? `<em style="color:var(--ink-2);white-space:pre-wrap">${ui.esc(clip(r.response, 220))}</em>` : ''}
              </div>
              <button class="x" data-delrep="${r.id}">×</button>
            </div>`).join('')}</div>`
          : ui.empty('No reps banked yet. Answer the situation on the table and commit it.'), { delay: 240, span: true })}
      </div>`;
    },

    mount(root) {
      const self = LO.app.get('rewire');

      const commit = root.querySelector('[data-commit]');
      if (commit) {
        commit.onclick = () => {
          const box = root.querySelector('[data-response]');
          const text = box.value.trim();
          if (text.length < 12) { ui.toast('Answer it properly first'); box.focus(); return; }
          store.add('rewire.reps', {
            date: D.today(), drillId: current.id, trait: current.trait, response: text
          });
          revealed = true;
          lastResponse = text;
          ui.toast('Rep banked');
          self.refresh();
        };
      }

      const dealBtn = root.querySelector('[data-deal]');
      if (dealBtn) {
        dealBtn.onclick = () => {
          current = deal(store.state, current && current.id);
          revealed = false;
          self.refresh();
        };
      }

      const form = root.querySelector('[data-form]');
      root.querySelector('[data-add]').onclick = () => {
        const d = ui.read(form);
        if (!d.from.trim() || !d.to.trim()) return ui.toast('Both sides of the move');
        store.add('rewire.targets', {
          from: d.from.trim(), to: d.to.trim(), trait: d.trait, created: D.today()
        });
        current = deal(store.state);
        revealed = false;
        ui.toast('Target set — drills now weighted to it');
        self.refresh();
      };

      root.querySelectorAll('[data-del]').forEach(b => {
        b.onclick = () => { store.drop('rewire.targets', b.dataset.del); self.refresh(); };
      });
      root.querySelectorAll('[data-delrep]').forEach(b => {
        b.onclick = () => { store.drop('rewire.reps', b.dataset.delrep); self.refresh(); };
      });
    }
  });

  /* ---------- the dealer ----------
     Weighted pick: traits you are targeting score highest, drills
     run in the last 10 reps are suppressed, and the drill currently
     on the table is never dealt twice in a row. */
  function deal(s, avoidId) {
    const bank = lib.drills;
    if (!bank.length) return null;
    const wanted = s.rewire.targets.map(t => t.trait);
    const recentIds = s.rewire.reps.slice(0, 10).map(r => r.drillId);

    const scored = bank.map(dr => {
      let w = 1;
      if (wanted.includes(dr.trait)) w += 4;
      if (recentIds.includes(dr.id)) w *= 0.12;
      if (avoidId && dr.id === avoidId) w = 0;
      return { dr, w };
    }).filter(x => x.w > 0);

    if (!scored.length) return bank[Math.floor(Math.random() * bank.length)];
    const total = scored.reduce((a, x) => a + x.w, 0);
    let r = Math.random() * total;
    for (const x of scored) { r -= x.w; if (r <= 0) return x.dr; }
    return scored[0].dr;
  }

  function traitLabel(id) { const t = lib.traits.find(x => x.id === id); return t ? t.label : id; }
  function drillTitle(id) { const d = lib.drills.find(x => x.id === id); return d ? d.title : 'Retired drill'; }
  function clip(s, n) { return s.length > n ? s.slice(0, n) + '…' : s; }
})(window.LO);
