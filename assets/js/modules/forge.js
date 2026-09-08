/* ============================================================
   FORGE — habits and positive reinforcement.
   The reinforcement is deliberate: variable praise on each rep,
   escalating recognition at streak milestones, and the identity
   line replayed back at you every time you strike the cell.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store, D } = LO;

  const PRAISE = [
    'Logged. That is a vote for the person you are building.',
    'Struck. The chain does not care how you felt about it.',
    'Rep banked. Nobody saw it and it still counts.',
    'Done. Boring days are where this compounds.',
    'On the board. Momentum is cheaper than restarting.',
    'Held the line.',
    'That is the standard, not the mood.'
  ];
  const MILESTONE = {
    3: 'Three in a row — the pattern is forming.',
    7: 'Seven straight. This is now a thing you do.',
    14: 'Two weeks. Your baseline just moved.',
    21: 'Twenty-one. It costs less than it used to, doesn\'t it.',
    30: 'Thirty days. This is identity now, not effort.',
    50: 'Fifty. Most people never see this number.',
    75: 'Seventy-five straight days.',
    100: 'One hundred. You are a different person than the one who started.'
  };

  LO.app.register({
    id: 'forge',
    name: 'Forge',
    glyph: '⬢',
    accent: 'var(--c-forge)',
    accentSoft: 'rgba(255,177,84,.14)',
    tagline: 'Habits, streaks, and the reinforcement that locks them in',

    metric(s) {
      if (!s.habits.length) return 'no habits';
      const t = D.today();
      const done = s.habits.filter(h => h.log && h.log[t]).length;
      return done + '/' + s.habits.length + ' today';
    },

    render(s) {
      const t = D.today();
      const days = D.lastDays(14);
      const doneToday = s.habits.filter(h => h.log && h.log[t]).length;
      const pct = s.habits.length ? Math.round(doneToday / s.habits.length * 100) : 0;
      const best = s.habits.map(h => ({ h, k: store.streakOf(h) })).sort((a, b) => b.k - a.k)[0];

      return `<div class="grid wide">

        ${ui.card('Today', `
          <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
            ${ui.ring(pct, 96, doneToday + '/' + s.habits.length)}
            <div style="flex:1;min-width:140px">
              <div class="sub" style="margin-top:0">${
                !s.habits.length ? 'Add your first habit below.'
                : pct === 100 ? 'Clean sweep. Nothing owed.'
                : pct >= 50 ? 'Most of the board is struck. Finish it.'
                : 'The day is still winnable.'}</div>
              ${best && best.k > 0 ? `<div class="tags" style="margin-top:10px">
                <span class="tag hot">◆ ${best.k}d · ${ui.esc(best.h.name)}</span></div>` : ''}
            </div>
          </div>`, { delay: 0 })}

        ${ui.card('Momentum', `
          ${ui.spark(D.lastDays(28).map(d =>
            s.habits.length ? Math.round(s.habits.filter(h => h.log && h.log[d]).length / s.habits.length * 100) : null
          ), { min: 0, max: 100 })}
          <div class="sub">Share of the board struck, last 28 days.</div>`, { delay: 60 })}

        ${ui.card('New Habit', `
          <div data-form>
            ${ui.field('name', 'Habit', { ph: 'Train, Read 20 pages, Cold shower…' })}
            ${ui.field('identity', 'Identity line', { ph: 'I am someone who trains regardless' })}
            <div class="row">
              ${ui.field('domain', 'Domain', { type: 'select', options: ui.domainOptions() })}
              ${ui.field('target', 'Days / week', { type: 'number', value: 7, min: 1 })}
            </div>
            <div class="row">
              ${ui.field('cue', 'Cue', { ph: 'After coffee' })}
              ${ui.field('reward', 'Reward', { ph: 'Log it, then espresso' })}
            </div>
            <button class="btn primary" data-add>Forge It</button>
          </div>`, { delay: 120 })}

        ${ui.card('The Board', s.habits.length ? `
          <div class="stack">
            ${s.habits.map(h => {
              const streak = store.streakOf(h);
              const adh = store.adherence(h, 28);
              return `<div style="border:1px solid var(--line);border-radius:var(--r-sm);padding:12px;background:rgba(7,10,17,.45)">
                <div style="display:flex;gap:10px;align-items:baseline;flex-wrap:wrap">
                  <b style="font-size:14px;color:var(--ink-0)">${ui.esc(h.name)}</b>
                  <span class="tag ${streak > 0 ? 'hot' : ''}">◆ ${streak}d streak</span>
                  <span class="tag">${adh}% / 28d</span>
                  <span class="tag">${ui.domainLabel(h.domain)}</span>
                  <button class="x" data-del="${h.id}" style="margin-left:auto">×</button>
                </div>
                ${h.identity ? `<div class="sub" style="color:var(--ink-2);font-style:italic">“${ui.esc(h.identity)}”</div>` : ''}
                ${h.cue || h.reward ? `<div class="sub">${h.cue ? 'Cue: ' + ui.esc(h.cue) : ''}${h.cue && h.reward ? ' · ' : ''}${h.reward ? 'Reward: ' + ui.esc(h.reward) : ''}</div>` : ''}
                <div class="hexrow" style="margin-top:11px">
                  ${days.map(d => `
                    <button class="hexcell ${h.log && h.log[d] ? 'done' : ''} ${d === t ? 'today' : ''}"
                      data-hit="${h.id}" data-date="${d}" title="${D.pretty(d)}">
                      <span>${new Date(d + 'T12:00:00').getDate()}</span>
                    </button>`).join('')}
                </div>
              </div>`;
            }).join('')}
          </div>` : ui.empty('The board is empty. One habit, seven days — that is the whole starting move.'),
          { delay: 180, span: true })}
      </div>`;
    },

    mount(root) {
      const self = LO.app.get('forge');
      const form = root.querySelector('[data-form]');

      root.querySelector('[data-add]').onclick = () => {
        const d = ui.read(form);
        if (!d.name.trim()) return ui.toast('Name it');
        store.add('habits', {
          name: d.name.trim(), identity: d.identity.trim(), domain: d.domain,
          target: +d.target || 7, cue: d.cue.trim(), reward: d.reward.trim(),
          log: {}, created: D.today()
        });
        ui.toast('Forged. Strike it today.'); self.refresh();
      };

      root.querySelectorAll('[data-hit]').forEach(b => {
        b.onclick = () => {
          const id = b.dataset.hit, date = b.dataset.date;
          const on = store.toggleHabit(id, date);
          const h = store.state.habits.find(x => x.id === id);
          if (on) {
            const streak = store.streakOf(h);
            const line = MILESTONE[streak] ||
              (h.identity ? '“' + h.identity + '”' : PRAISE[Math.floor(Math.random() * PRAISE.length)]);
            ui.toast(line, MILESTONE[streak] ? 3400 : 2100);
          }
          self.refresh();
        };
      });

      root.querySelectorAll('[data-del]').forEach(b => {
        b.onclick = () => {
          if (!confirm('Remove this habit and its history?')) return;
          store.drop('habits', b.dataset.del); self.refresh();
        };
      });
    }
  });
})(window.LO);
