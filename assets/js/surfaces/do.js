/* ============================================================
   DO — the day's paper.
   The list is the front door now: capture, see, and strike the
   work without passing through a generated action first. The
   emergency timer still lives here when another surface opens it.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store, D } = LO;

  let timer = null;   // { endAt, total, id, action }
  let suppressTaskClickUntil = 0;

  LO.machine.register({
    id: 'do',
    name: 'Do',

    render(s) {
      if (timer) return timerView();
      const list = store.dayList();
      const t = D.today();
      const q = LO.quotes.today();
      const struck = s.habits.filter(h => h.log && h.log[t]).length;
      const open = list.filter(l => l.status !== 'closed').length;
      const done = list.length - open;

      return `
        <section class="day-paper${list.length ? '' : ' empty'}" aria-labelledby="day-paper-title">
          <header class="paper-head">
            <div>
              <span class="paper-kicker">${ui.esc(D.pretty(t))}</span>
              <h1 id="day-paper-title">Today's list</h1>
            </div>
            <span class="paper-count">${done}/${list.length}</span>
          </header>

          <form class="capture paper-capture" data-capture>
            <input data-newtask type="text" autocomplete="off" enterkeyhint="done"
                   maxlength="140" placeholder="What can be done today?">
            <button type="submit" class="capture-go" aria-label="Add it">+</button>
          </form>

          ${list.length
            ? `<div class="todo" aria-label="Today's tasks">${list.map(taskRow).join('')}</div>`
            : `<div class="paper-empty"><b>The page is open.</b><span>Add only what belongs to today.</span></div>`}

          <footer class="paper-foot">
            <span>${open ? open + ' open' : list.length ? 'page cleared' : 'nothing owed yet'}</span>
            <span>${todayLine(list)}</span>
          </footer>
        </section>

        <figure class="quote" data-quoteswipe>
          <blockquote>${ui.esc(q.text)}</blockquote>
          <figcaption><a href="https://en.wikipedia.org/wiki/${encodeURIComponent(q.who.replace(/ /g, '_'))}" target="_blank" rel="noopener noreferrer">${ui.esc(q.who)}</a></figcaption>
        </figure>

        ${s.habits.length ? `
          <div class="lbl">Habits<span class="r">${struck}/${s.habits.length}</span></div>
          <div class="hrow">
            ${s.habits.map(h => {
              const on = !!(h.log && h.log[t]);
              return `<button class="hchip ${on ? 'on' : ''}" data-habit="${h.id}">
                <i></i><b>${ui.esc(h.name)}</b></button>`;
            }).join('')}
          </div>` : ''}`;
    },

    mount(root) {
      const self = LO.machine.get('do');
      const redraw = () => self.refresh();

      if (timer) { mountTimer(root, redraw); return; }

      swipeable(root.querySelector('[data-quoteswipe]'), function () {
        LO.quotes.next();
        redraw();
      });

      const cap = root.querySelector('[data-capture]');
      if (cap) {
        const box = cap.querySelector('[data-newtask]');
        cap.onsubmit = e => {
          e.preventDefault();
          const title = box.value.trim();
          if (!title) return box.focus();
          store.capture(title, LO.level.estimate(title));
          box.value = '';
          ui.toast('Added to today');
          redraw();
          const fresh = document.querySelector('.pane[data-pane="do"] [data-newtask]');
          if (fresh) fresh.focus();
        };
      }

      root.querySelectorAll('[data-hit]').forEach(b => {
        b.onclick = () => {
          if (Date.now() < suppressTaskClickUntil) return;
          const row = b.closest('.td');
          if (row && row.classList.contains('done')) {
            store.reopenTask(b.dataset.hit);
            ui.toast('Marked open');
            redraw();
          } else strike(b.dataset.hit, b, redraw);
        };
      });
      root.querySelectorAll('[data-eff]').forEach(b => {
        b.onclick = e => {
          e.stopPropagation();
          const l = store.state.mind.load.find(x => x.id === b.dataset.eff);
          if (!l || l.status === 'closed') return;
          const next = ((+l.effort || 2) % 3) + 1;
          store.patch('mind.load', l.id, { effort: next, weight: next });
          ui.toast(LO.level.tier(next).name + ' effort · +' + LO.level.tier(next).points);
          redraw();
        };
      });
      root.querySelectorAll('[data-fold]').forEach(b => {
        b.onclick = () => {
          if (Date.now() < suppressTaskClickUntil) return;
          store.togglePlan(b.dataset.fold); redraw();
        };
      });
      root.querySelectorAll('[data-step]').forEach(b => {
        b.onclick = () => {
          const [planId, stepId] = b.dataset.step.split(':');
          const li = b.closest('.td-step');
          const wasDone = li.classList.contains('done');
          li.classList.toggle('done', !wasDone);
          setTimeout(() => {
            const plan = store.stepDone(planId, stepId);
            if (plan && !wasDone && plan.steps.every(x => x.done)) {
              // every step struck is the plan finished — bank it like any task
              const row = root.querySelector(`[data-row="${planId}"]`);
              if (row) strike(planId, row.querySelector('.td-head'), redraw);
              else redraw();
              return;
            }
            redraw();
          }, 300);
        };
      });
      root.querySelectorAll('[data-open]').forEach(b => {
        b.onclick = () => {
          const l = store.state.mind.load.find(x => x.id === b.dataset.open);
          if (l) LO.scratch.focus(l.nodes);
        };
      });
      root.querySelectorAll('[data-drop]').forEach(b => {
        b.onclick = () => { store.removeTask(b.dataset.drop); ui.toast('Removed from today'); redraw(); };
      });
      root.querySelectorAll('[data-habit]').forEach(b => {
        b.onclick = () => { store.toggleHabit(b.dataset.habit); ui.toast('Habit updated'); redraw(); };
      });
      holdableTasks(root);
    }
  });

  /* ----------------------------------------------------------
     One horizontal swipe, either direction, on a card. Vertical
     wins early so the page still scrolls under your thumb, and the
     card follows the finger so the gesture is visible while it
     happens rather than only in its result.
     ---------------------------------------------------------- */
  function swipeable(card, onSwipe) {
    if (!card) return;
    let sx = 0, sy = 0, dx = 0, live = false, decided = false;

    card.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a,button')) return;
      sx = e.clientX; sy = e.clientY; dx = 0; live = true; decided = false;
    }, { passive: true });

    card.addEventListener('pointermove', function (e) {
      if (!live) return;
      const mx = e.clientX - sx, my = e.clientY - sy;
      if (!decided) {
        if (Math.abs(my) > 12 && Math.abs(my) > Math.abs(mx)) { live = false; return; }
        if (Math.abs(mx) < 10) return;
        decided = true;
        card.classList.add('swiping');
      }
      dx = mx;
      card.style.transform = 'translateX(' + dx + 'px)';
      card.style.opacity = String(Math.max(0.25, 1 - Math.abs(dx) / 260));
    }, { passive: true });

    const end = function () {
      if (!live) return;
      live = false;
      card.classList.remove('swiping');
      const far = Math.abs(dx) > Math.min(110, window.innerWidth * 0.22);
      card.style.transform = '';
      card.style.opacity = '';
      if (decided && far) onSwipe(dx < 0 ? 'left' : 'right');
      decided = false;
    };
    card.addEventListener('pointerup', end, { passive: true });
    card.addEventListener('pointercancel', end, { passive: true });
  }

  /** A deliberate hold opens task management without making every row noisy. */
  function holdableTasks(root) {
    root.querySelectorAll('[data-row]').forEach(row => {
      let timerId = null, sx = 0, sy = 0;
      const cancel = () => {
        clearTimeout(timerId);
        timerId = null;
        row.classList.remove('holding');
      };
      row.addEventListener('pointerdown', e => {
        if (e.target.closest('[data-eff],[data-drop],[data-open],[data-step]')) return;
        sx = e.clientX; sy = e.clientY;
        timerId = setTimeout(() => {
          timerId = null;
          row.classList.add('holding');
          suppressTaskClickUntil = Date.now() + 700;
          if (navigator.vibrate) navigator.vibrate(12);
          LO.machine.taskMenu(row.dataset.row);
        }, 560);
      }, { passive: true });
      row.addEventListener('pointermove', e => {
        if (timerId && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) cancel();
      }, { passive: true });
      row.addEventListener('pointerup', cancel, { passive: true });
      row.addEventListener('pointercancel', cancel, { passive: true });
      row.addEventListener('contextmenu', e => {
        e.preventDefault();
        cancel();
        suppressTaskClickUntil = Date.now() + 700;
        LO.machine.taskMenu(row.dataset.row);
      });
    });
  }

  /* ---------------- the day's list ---------------- */
  function taskRow(l) {
    const done = l.status === 'closed';
    const eff = +l.effort || +l.weight || 2;
    const pts = LO.level.tier(eff).points;
    // a plan carries the shape it was circled out of, and one line
    // written from the kinds on the paper. Tapping the map goes back to it.
    const plan = l.kind === 'plan' && l.nodes && l.nodes.length;
    const steps = plan && l.steps && l.steps.length ? l.steps : null;
    const struck = steps ? steps.filter(x => x.done).length : 0;

    if (!plan) {
      return `<div class="td${done ? ' done' : ''}" data-row="${l.id}">
        <button class="td-hit" data-hit="${l.id}" title="Hold for options">
          <span class="td-t">${ui.esc(l.title)}</span>
        </button>
        <button class="td-p" data-eff="${l.id}" title="${LO.level.tier(eff).name} — tap to change">+${pts}</button>
        <button class="td-x" data-drop="${l.id}" aria-label="Delete from today">×</button>
        <button class="td-box" data-hit="${l.id}" aria-label="${done ? 'Mark open again' : 'Mark done'}"></button>
      </div>`;
    }

    // A plan is a folder, not a line. The title opens it; the steps inside
    // are what you actually tick, in the order the arrows said they go.
    return `<div class="td plan${done ? ' done' : ''}${l.open ? ' open' : ''}" data-row="${l.id}">
      <div class="td-head">
        <button class="td-open" data-open="${l.id}" aria-label="Open on the paper"
          >${LO.scratch.thumb(l.nodes)}</button>
        <button class="td-hit" data-fold="${l.id}" aria-expanded="${l.open ? 'true' : 'false'}">
          <span class="td-t">${ui.esc(l.title)}</span>
          <span class="td-sub">${steps
            ? `${struck}/${steps.length} done  ·  ${ui.esc(nextStep(steps))}`
            : ui.esc(LO.scratch.describe(l.nodes))}</span>
        </button>
        <span class="td-p plainp">+${pts}</span>
        <button class="td-x" data-drop="${l.id}" aria-label="Delete from today">×</button>
        <span class="td-fold" aria-hidden="true"></span>
      </div>
      ${steps && l.open ? `<ol class="td-steps">${steps.map((st, i) => `
        <li class="td-step${st.done ? ' done' : ''}">
          <button class="td-step-hit" data-step="${l.id}:${st.id}">
            <span class="td-n">${i + 1}</span>
            <span class="td-st">${ui.esc(st.text)}</span>
            <span class="td-tick"></span>
          </button>
        </li>`).join('')}</ol>` : ''}
    </div>`;
  }

  /** the first thing still open — what the folder should say it is waiting on */
  function nextStep(steps) {
    const n = steps.find(x => !x.done);
    return n ? 'next: ' + n.text : 'all steps struck';
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
      const result = store.completeTask(id);
      const bonus = result.bonus;

      const after = LO.level.stats().level;
      const levelled = after > before;
      if (levelled) LO.machine.crestPulse();

      if (bonus) {
        ui.toast('Page cleared · +' + (result.points + bonus), 3600);
      } else if (levelled) {
        ui.toast('Level ' + after, 3200);
      } else {
        ui.toast('+' + result.points);
      }
      redraw();
    }, 430);
  }

  function bank(a, redraw) {
    if (a.done) a.done();
    const before = LO.level.stats().level;
    const pts = store.win(a.winKind || 'step', a.label, a.minutes || 0, a.id,
      Math.min(60, 10 + (a.minutes || 0) * 2));
    const levelled = LO.level.stats().level > before;
    if (levelled) LO.machine.crestPulse();
    ui.toast(levelled ? 'Level ' + LO.level.stats().level : '+' + pts, 3200);
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
