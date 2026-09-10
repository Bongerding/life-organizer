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
      const list = store.dayList();
      const t = D.today();
      const q = LO.quotes.today();
      const struck = s.habits.filter(h => h.log && h.log[t]).length;

      return `
        <figure class="quote">
          <blockquote>${ui.esc(q.text)}</blockquote>
          <figcaption><a href="https://en.wikipedia.org/wiki/${encodeURIComponent(q.who.replace(/ /g, '_'))}" target="_blank" rel="noopener noreferrer">${ui.esc(q.who)}</a></figcaption>
        </figure>

        <div class="k">${ui.esc(action.kind)}</div>
        <h2 class="deed">${ui.esc(action.label)}</h2>
        ${action.sub ? `<p class="deed-sub">${ui.esc(action.sub)}</p>` : ''}

        ${action.id === 'nothing' ? '' : `
          <button class="bigstart" data-start>
            <b>${action.tab || action.sheet ? 'Open' : 'Start'}</b>
            ${action.minutes ? `<span>${action.minutes} min</span>` : ''}
          </button>
          <div class="textlinks">
            <button data-skip>Not this</button>
            <button data-did>Already did it</button>
          </div>`}

        <div class="sos">
          <button class="spin" data-spin><b>I'm spinning</b><span>rumination</span></button>
          <button class="urge" data-urge><b>I want to smoke</b><span>ride it out</span></button>
        </div>

        <form class="capture" data-capture>
          <input data-newtask type="text" autocomplete="off" enterkeyhint="done"
                 maxlength="140" placeholder="What can be done today?">
          <button type="submit" class="capture-go" aria-label="Add it">+</button>
        </form>

        ${list.length ? `
          <div class="todo" aria-label="Today's tasks">${list.map(taskRow).join('')}</div>
          <div class="today-summary">Today · ${todayLine(list)}</div>
          ${list.every(l => l.status === 'closed') && list.length > 1
            ? `<p class="note cleared">Everything you set for today is done.</p>` : ''}
        ` : ''}

        ${s.habits.length ? `
          <div class="lbl">Habits<span class="r">${struck}/${s.habits.length}</span></div>
          <div class="hrow">
            ${s.habits.map(h => {
              const on = !!(h.log && h.log[t]);
              return `<button class="hchip ${on ? 'on' : ''}" data-habit="${h.id}">
                <i></i><b>${ui.esc(h.name)}</b></button>`;
            }).join('')}
          </div>` : ''}${LO.companion.discovery()}`;
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
      if (start) start.onclick = async () => {
        start.disabled = true;
        await LO.companion.launch(start);
        start.disabled = false;
        if (!start.isConnected || LO.machine.current !== 'do') return;
        if (action.tab) return LO.machine.go(action.tab === 'loops' ? 'write' : action.tab);
        if (action.sheet) return LO.machine.go(action.sheet === 'line' ? 'write' : 'write');
        beginTimer(action, redraw);
      };
      const skip = root.querySelector('[data-skip]');
      if (skip) skip.onclick = () => { action = LO.actions.pick(store.state, action.id); redraw(); };
      const did = root.querySelector('[data-did]');
      if (did) did.onclick = () => { bank(action, redraw); };

      const cap = root.querySelector('[data-capture]');
      if (cap) {
        const box = cap.querySelector('[data-newtask]');
        cap.onsubmit = e => {
          e.preventDefault();
          const title = box.value.trim();
          if (!title) return box.focus();
          store.capture(title, LO.level.estimate(title));
          box.value = '';
          redraw();
          const fresh = document.querySelector('.pane[data-pane="do"] [data-newtask]');
          if (fresh) fresh.focus();
        };
      }

      root.querySelectorAll('[data-hit]').forEach(b => {
        b.onclick = () => strike(b.dataset.hit, b, redraw);
      });
      root.querySelectorAll('[data-eff]').forEach(b => {
        b.onclick = e => {
          e.stopPropagation();
          const l = store.state.mind.load.find(x => x.id === b.dataset.eff);
          if (!l || l.status === 'closed') return;
          const next = ((+l.effort || 2) % 3) + 1;
          store.patch('mind.load', l.id, { effort: next, weight: next });
          redraw();
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

  /* ---------------- the day's list ---------------- */
  function taskRow(l) {
    const done = l.status === 'closed';
    const eff = +l.effort || +l.weight || 2;
    const pts = LO.level.tier(eff).points;
    return `<div class="td${done ? ' done' : ''}" data-row="${l.id}">
      <button class="td-hit" data-hit="${l.id}"${done ? ' disabled' : ''}>
        <span class="td-t">${ui.esc(l.title)}</span>
      </button>
      <button class="td-p" data-eff="${l.id}" title="${LO.level.tier(eff).name} — tap to change">+${pts}</button>
      ${done ? '' : `<button class="td-x" data-drop="${l.id}" aria-label="Remove">×</button>`}
      <button class="td-box" data-hit="${l.id}" aria-label="Mark done"${done ? ' disabled' : ''}></button>
    </div>`;
  }

  function todayLine(list) {
    const done = list.filter(l => l.status === 'closed').length;
    const pts = LO.level.earnedOn();
    return done + '/' + list.length + (pts ? '  ·  ' + pts + ' pts' : '');
  }

  /** strike it through first, bank it after — the line is the reward */
  function strike(id, el, redraw) {
    const row = el.closest('.td');
    if (!row || row.classList.contains('done')) return;
    row.classList.add('done');
    row.querySelectorAll('button').forEach(b => { b.disabled = true; });

    const l = store.state.mind.load.find(x => x.id === id);
    const eff = l ? (+l.effort || +l.weight || 2) : 2;
    const before = LO.level.stats().level;

    setTimeout(() => {
      store.closeTask(id);
      store.win('task', l ? l.title : 'A task', 0, 'task_' + id, LO.level.tier(eff).points);

      const list = store.dayList();
      let bonus = 0;
      if (list.length > 1 && list.every(x => x.status === 'closed')) bonus = store.awardDay(list.length);

      const after = LO.level.stats().level;
      const levelled = after > before;
      if (levelled) LO.machine.crestPulse();

      if (bonus) {
        won = {
          praise: 'The whole list.',
          label: list.length + ' things, all of them done',
          stop: STOP[Math.floor(Math.random() * STOP.length)],
          points: LO.level.tier(eff).points + bonus, levelled
        };
        action = null;
      } else if (levelled) {
        ui.toast('Level ' + after, 3200);
      } else {
        ui.toast('+' + LO.level.tier(eff).points);
      }
      redraw();
    }, 430);
  }

  /* ---------------- reward ---------------- */
  function rewardView(s) {
    const streak = store.winStreak();
    const done = store.winsOn().filter(w => w.kind !== 'day' && LO.level.pointsOf(w) > 0).length;
    const lv = LO.level.stats();
    return `
      <div class="reward">
        <div class="seal">✓</div>
        <h2>${ui.esc(won.praise)}</h2>
        <div class="did">${ui.esc(won.label)}</div>
        ${won.points ? `<div class="earned">+${won.points}</div>` : ''}
        <div class="streakline">${done} today${streak ? '  ·  ' + streak + ' day streak' : ''}</div>
        <div class="lvlwrap">
          <div class="meter"><i style="width:${lv.pct}%"></i></div>
          <div class="lvlnote">${won.levelled ? 'Level ' + lv.level + ' reached' : 'Level ' + lv.level}
            &nbsp;·&nbsp; ${lv.into} / ${lv.need}</div>
        </div>
      </div>
      <button class="bigstart gold-round" data-again><b>One more</b></button>
      <div class="textlinks"><button data-stop>Stop here</button></div>
      <p class="note" style="margin-top:20px">${ui.esc(won.stop)}</p>`;
  }

  const PRAISE = ["That's one.", 'Done.', 'On the board.', 'Started and finished.'];
  const STOP = [
    'One is a full day by the rules you set. Nothing else is owed.',
    'You can close this now. Come back tomorrow.',
    'That was the hard part. The rest of today is yours.'
  ];

  function bank(a, redraw) {
    if (a.done) a.done();
    const before = LO.level.stats().level;
    const pts = store.win(a.winKind || 'step', a.label, a.minutes || 0, a.id,
      Math.min(60, 10 + (a.minutes || 0) * 2));
    const levelled = LO.level.stats().level > before;
    if (levelled) LO.machine.crestPulse();
    won = {
      praise: PRAISE[Math.floor(Math.random() * PRAISE.length)],
      label: a.label,
      stop: STOP[Math.floor(Math.random() * STOP.length)],
      points: pts, levelled
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
