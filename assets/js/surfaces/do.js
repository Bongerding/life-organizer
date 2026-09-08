/* ============================================================
   DO — one thing at a time, and a reward for it.
   Mirrors Ignition on purpose: same engine, same wins, same
   permission to stop after one. Tasks you wrote and habits you
   keep sit underneath, checkable in one tap.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store, D } = LO;

  let action = null;
  let won = null;
  let timer = null;   // { endAt, total, id, action }

  LO.machine.register({
    id: 'do',
    name: 'Do',

    render(s) {
      if (timer) return timerView();
      if (won) return rewardView(s);

      if (!action) action = LO.actions.pick(s);
      const done = store.winsOn();
      const tasks = store.tasks();
      const t = D.today();

      const q = LO.quotes.today();

      return `
        <figure class="quote">
          <blockquote>${ui.esc(q.text)}</blockquote>
          <figcaption>${ui.esc(q.who)}</figcaption>
        </figure>

        <div class="now">
          <div class="k">${ui.esc(action.kind)}</div>
          <h2>${ui.esc(action.label)}</h2>
          <p>${ui.esc(action.sub || '')}</p>
          ${action.minutes ? `<div class="mins">${action.minutes} min</div>` : ''}
          ${action.id === 'nothing' ? '' : `
            <div class="acts">
              <button class="go" data-start>${action.tab || action.sheet ? 'Open' : 'Start'}</button>
              <button class="flat" data-skip>Not this</button>
              <button class="flat" data-did>Already did it</button>
            </div>`}
        </div>

        <div class="sos">
          <button class="spin" data-spin><b>I'm spinning</b><span>rumination</span></button>
          <button class="urge" data-urge><b>I want to smoke</b><span>ride it out</span></button>
        </div>

        ${done.length ? `<div class="lbl">Done today<span class="ln"></span></div>
          <div class="rows">${done.map(w =>
            `<div class="row-l"><span class="tick on"></span><span class="t">${ui.esc(w.label)}</span>
             <span class="r">${w.minutes ? w.minutes + 'm' : ''}</span></div>`).join('')}</div>` : ''}

        <div class="lbl">Your tasks<span class="r">${tasks.length || 'none open'}</span></div>
        ${tasks.length ? `<div class="rows">${tasks.map(l => `
          <div class="row-l">
            <button class="tick" data-close="${l.id}" title="Mark done"></button>
            <span class="t">${ui.esc(l.title)}<em>written ${D.pretty(l.created)}</em></span>
            <button class="x" data-drop="${l.id}">×</button>
          </div>`).join('')}</div>`
        : `<p class="note">Nothing open. Write tasks on the <a href="#write" style="color:var(--accent);text-decoration:none">Write</a> tab and they land here.</p>`}

        ${s.habits.length ? `<div class="lbl">Habits<span class="r">${
            s.habits.filter(h => h.log && h.log[t]).length}/${s.habits.length}</span></div>
          <div class="rows">${s.habits.map(h => {
            const on = !!(h.log && h.log[t]);
            const k = store.streakOf(h);
            return `<div class="row-l">
              <button class="tick ${on ? 'on' : ''}" data-habit="${h.id}"></button>
              <span class="t">${ui.esc(h.name)}</span>
              <span class="r">${k ? k + 'd' : ''}</span>
            </div>`;
          }).join('')}</div>` : ''}`;
    },

    mount(root) {
      const self = LO.machine.get('do');
      const redraw = () => self.refresh();

      if (timer) { mountTimer(root, redraw); return; }
      if (won) {
        root.querySelector('[data-again]').onclick = () => {
          won = null; action = LO.actions.pick(store.state); redraw();
        };
        root.querySelector('[data-stop]').onclick = () => { won = null; redraw(); };
        return;
      }

      const spin = root.querySelector('[data-spin]');
      if (spin) spin.onclick = () => { LO.machine.get('advice').openAt('spinning'); LO.machine.go('advice'); };
      const urge = root.querySelector('[data-urge]');
      if (urge) urge.onclick = () => LO.machine.quick('urge');

      const start = root.querySelector('[data-start]');
      if (start) start.onclick = () => {
        if (action.tab) return LO.machine.go(action.tab === 'loops' ? 'write' : action.tab);
        if (action.sheet) return LO.machine.go(action.sheet === 'line' ? 'write' : 'write');
        beginTimer(action, redraw);
      };
      const skip = root.querySelector('[data-skip]');
      if (skip) skip.onclick = () => { action = LO.actions.pick(store.state, action.id); redraw(); };
      const did = root.querySelector('[data-did]');
      if (did) did.onclick = () => { bank(action, redraw); };

      root.querySelectorAll('[data-close]').forEach(b => {
        b.onclick = () => {
          b.classList.add('on');
          const task = store.tasks().find(x => x.id === b.dataset.close);
          store.closeTask(b.dataset.close);
          store.win('task', task ? task.title : 'A task', 0, 'task_' + b.dataset.close);
          ui.toast('Done');
          setTimeout(redraw, 260);
        };
      });
      root.querySelectorAll('[data-drop]').forEach(b => {
        b.onclick = () => { store.drop('mind.load', b.dataset.drop); redraw(); };
      });
      root.querySelectorAll('[data-habit]').forEach(b => {
        b.onclick = () => { store.toggleHabit(b.dataset.habit); redraw(); };
      });
    }
  });

  /* ---------------- reward ---------------- */
  function rewardView(s) {
    const streak = store.winStreak();
    const done = store.winsOn().length;
    return `
      <div class="reward">
        <div class="seal">✓</div>
        <h2>${ui.esc(won.praise)}</h2>
        <div class="did">${ui.esc(won.label)}</div>
        <div class="streakline">${done} today${streak ? '  ·  ' + streak + ' day streak' : ''}</div>
        <div class="acts">
          <button class="gold" data-again>One more</button>
          <button class="flat" data-stop>Stop here</button>
        </div>
      </div>
      <p class="note" style="margin-top:22px">${ui.esc(won.stop)}</p>`;
  }

  const PRAISE = ["That's one.", 'Done.', 'On the board.', 'Started and finished.'];
  const STOP = [
    'One is a full day by the rules you set. Nothing else is owed.',
    'You can close this now. Come back tomorrow.',
    'That was the hard part. The rest of today is yours.'
  ];

  function bank(a, redraw) {
    if (a.done) a.done();
    store.win(a.winKind || 'step', a.label, a.minutes || 0, a.id);
    won = {
      praise: PRAISE[Math.floor(Math.random() * PRAISE.length)],
      label: a.label,
      stop: STOP[Math.floor(Math.random() * STOP.length)]
    };
    action = null;
    redraw();
  }

  /** the ten-minute ride-out, launched from the urge sheet anywhere in the app */
  LO.machine.get('do').runUrge = function (intensity) {
    const a = {
      id: 'urge_surf', kind: 'ride it out', label: 'Ten minutes, then decide',
      sub: 'Out of the room. Water. Move. Do not negotiate with it, outlast it.',
      minutes: 10, winKind: 'clarity',
      done() { LO.store.logUrge({ intensity: intensity, rode: true, instead: '' }); }
    };
    action = a;
    won = null;
    LO.machine.go('do');
    beginTimer(a, () => LO.machine.refresh());
  };

  /* ---------------- timer ---------------- */
  function beginTimer(a, redraw) {
    const total = Math.max(1, a.minutes || 1) * 60;
    timer = { total, endAt: Date.now() + total * 1000, id: null, action: a };
    redraw();
  }

  function timerView() {
    const C = 2 * Math.PI * 62;
    return `
      <h1 class="hd">Put the screen down.</h1>
      <p class="lede">When it runs out, it counted.</p>
      <div class="now">
        <div class="timer">
          <div class="dial">
            <svg viewBox="0 0 132 132">
              <circle class="bg" cx="66" cy="66" r="62"/>
              <circle class="fg" cx="66" cy="66" r="62" stroke-dasharray="${C}" stroke-dashoffset="0" data-arc/>
            </svg>
            <div class="n" data-clock>${fmt(timer.total)}</div>
          </div>
          <div>
            <h2 style="margin-top:18px">${ui.esc(timer.action.label)}</h2>
            <div class="acts">
              <button class="go" data-done>Done</button>
              <button class="flat" data-cancel>Stop</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function mountTimer(root, redraw) {
    const C = 2 * Math.PI * 62;
    const arc = root.querySelector('[data-arc]');
    const clock = root.querySelector('[data-clock]');
    const tick = () => {
      const left = Math.max(0, Math.round((timer.endAt - Date.now()) / 1000));
      clock.textContent = fmt(left);
      arc.setAttribute('stroke-dashoffset', String(C * (1 - left / timer.total)));
      if (left <= 0) finish(true);
    };
    tick();
    if (timer.id) clearInterval(timer.id);
    timer.id = setInterval(tick, 1000);

    function finish(bankIt) {
      clearInterval(timer.id);
      const a = timer.action;
      timer = null;
      if (bankIt) bank(a, redraw); else redraw();
    }
    root.querySelector('[data-done]').onclick = () => finish(true);
    root.querySelector('[data-cancel]').onclick = () => { finish(false); ui.toast('Stopped'); };
  }

  function fmt(sec) {
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }
  function clip(s, n) { return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '… ' : s + ' '; }
})(window.LO);
