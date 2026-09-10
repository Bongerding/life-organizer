/* ============================================================
   ADVICE — daily, and for whatever state you are in.
   One thing worth hearing today, then a menu of situations. Pick
   the one that matches and you get three or four steps, all of
   them physical or written. Nothing asks you to feel different first.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store, lib, D, advice, insight } = LO;

  let open = null;      // situation id currently showing
  let questLocked = false;
  let lockedQuest = null;
  let questDone = false;
  let sticks = freshSticks();

  LO.machine.register({
    id: 'advice',
    name: 'Advice',

    render(s) {
      const tip = advice.today(s);
      const noticed = insight.messages(s).filter(m => m.tone !== 'quiet').slice(0, 3);
      const sit = open ? advice.situation(open) : null;
      const shaped = lockedQuest || advice.quest(sticks, s);

      return `
        <h1 class="hd">${sit ? ui.esc(sit.label) : 'Find your next spark.'}</h1>
        <p class="lede">${sit ? 'Three or four steps. Do them in order.'
          : 'A little curiosity. A small challenge. Room for how you feel.'}</p>

        ${sit ? `
          <div class="proto">
            <div class="what">${ui.esc(sit.what)}</div>
            <ol>${sit.steps.map(x => `<li>${ui.esc(x)}</li>`).join('')}</ol>
            <div class="after">${ui.esc(sit.after)}</div>
            <div class="acts">
              <button class="go" data-didit>I did this</button>
              ${sit.go ? `<button class="flat" data-goto="${sit.go}">Open ${sit.go === 'ignition' ? 'Ignition' : sit.go}</button>` : ''}
              <button class="flat" data-back>Back</button>
            </div>
          </div>`
        : `
          ${tip ? `<div class="adv">
            <h2>${ui.esc(tip.title)}</h2>
            <p>${ui.esc(tip.body)}</p>
            ${tip.go ? `<div class="acts"><button class="flat" data-goto="${tip.go}">Open ${tip.go}</button></div>` : ''}
          </div>` : ''}

          ${noticed.length ? `
            <div class="lbl">What I noticed<span class="ln"></span></div>
            <div class="rows">
              ${noticed.map(m => `<div class="row-l">
                <span class="t">${ui.esc(m.text)}</span>
                ${m.go ? `<button class="flat" style="padding:8px 12px;font-size:12px" data-goto="${m.go}">Go</button>` : ''}
              </div>`).join('')}
            </div>` : ''}

          <div class="lbl">Right now I feel<span class="ln"></span></div>
          <div class="sits">
            ${advice.moods().map(x =>
              `<button class="sit" data-sit="${x.id}"><i>${x.icon}</i>${ui.esc(x.label)}</button>`).join('')}
          </div>
          <details class="all-moods"><summary>All feelings</summary><div class="sits">${advice.SITUATIONS.map(x => `<button class="sit" data-sit="${x.id}"><i>${x.icon}</i>${ui.esc(x.label)}</button>`).join('')}</div></details>

          <div class="lbl">The practice arcade<span class="r">${s.rewire.reps.length} completed</span></div>
          <div class="panel practice-card" style="text-align:left">
            <div class="eyebrow">✦ Steer a real-world rep · ${LO.adaptive.analyze(s).mode}</div>
            ${questDone
              ? `<div class="quest-complete"><b>Quest banked.</b><p>${ui.esc(shaped.title)}</p></div>
                 <div class="acts" style="justify-content:flex-start"><button class="flat" data-feedback="yes">That helped ☀</button><button class="flat" data-feedback="no">Change the method</button><button class="flat" data-newquest>Next quest →</button></div>`
              : questLocked
                ? `${questCard(shaped)}<div class="acts" style="justify-content:flex-start"><button class="go" data-finishquest>I did it ✦</button><button class="flat" data-resteer>Re-steer</button></div>`
                : `<p class="stick-instruction">Choose the arena with the left stick and the method with the right. The quest changes under your hands.</p>
                   <div class="stick-deck">
                     ${stick('sense', 'Arena', 'settle', 'activate', 'self', 'work')}
                     ${stick('move', 'Method', 'solo', 'together', 'prepare', 'do')}
                   </div>
                   <div data-stickquest aria-live="polite">${questCard(shaped)}</div>
                   <div class="acts" style="justify-content:flex-start">
                     <button class="go" data-choosequest disabled>Choose this quest</button>
                   </div>`}
          </div>`}`;
    },

    openAt(id) { open = id; },

    mount(root) {
      const self = LO.machine.get('advice');
      const redraw = () => self.refresh();

      root.querySelectorAll('[data-goto]').forEach(b => {
        b.onclick = () => {
          if (b.dataset.goto === 'ignition') location.href = 'mobile/index.html';
          else if (b.dataset.goto === 'settings') LO.machine.sheet();
          else LO.machine.go(b.dataset.goto);
        };
      });

      root.querySelectorAll('[data-sit]').forEach(b => {
        b.onclick = () => { open = b.dataset.sit; redraw(); };
      });
      const back = root.querySelector('[data-back]');
      if (back) back.onclick = () => { open = null; redraw(); };

      const didit = root.querySelector('[data-didit]');
      if (didit) didit.onclick = () => {
        const sit = advice.situation(open);
        store.log('advice', 'Used the protocol for "' + sit.label + '"', { sit: open });
        store.win('advice', sit.label, 0, 'sit_' + open);
        ui.toast('Logged');
        open = null;
        redraw();
      };

      root.querySelectorAll('[data-feedback]').forEach(b => b.onclick = () => {
        LO.adaptive.feedback(lockedQuest.kind, b.dataset.feedback === 'yes');
        root.querySelectorAll('[data-feedback]').forEach(x => { x.disabled = true; });
        ui.toast('Noted. This shapes future practices.');
      });
      const choose = root.querySelector('[data-choosequest]');
      if (choose) {
        bindSticks(root, choose);
        choose.onclick = () => {
          if (!sticks.sense.touched || !sticks.move.touched) return ui.toast('Move both sticks to choose a quest');
          lockedQuest = advice.quest(sticks, store.state);
          questLocked = true;
          redraw();
        };
      }
      const finish = root.querySelector('[data-finishquest]');
      if (finish) finish.onclick = () => {
        store.add('rewire.reps', {
          date: D.today(), drillId: lockedQuest.id, trait: lockedQuest.trait, response: lockedQuest.title,
          action: { steps: lockedQuest.steps.slice(), minutes: lockedQuest.minutes },
          signal: { sense: { x: sticks.sense.x, y: sticks.sense.y }, move: { x: sticks.move.x, y: sticks.move.y } }
        });
        store.win('practice', lockedQuest.title, lockedQuest.minutes, 'quest_' + lockedQuest.id);
        questDone = true;
        ui.toast('Quest completed');
        redraw();
      };
      const resteer = root.querySelector('[data-resteer]');
      if (resteer) resteer.onclick = () => { questLocked = false; lockedQuest = null; redraw(); };
      root.querySelectorAll('[data-newquest]').forEach(b => {
        b.onclick = () => { questLocked = false; lockedQuest = null; questDone = false; sticks = freshSticks(); redraw(); };
      });
    }
  });
  function freshSticks() {
    return { sense: { x: 0, y: 0, touched: false }, move: { x: 0, y: 0, touched: false } };
  }
  function stick(id, title, top, bottom, left, right) {
    const p = sticks[id];
    return `<div class="stick-wrap"><div class="stick-title">${title}</div>
      <div class="joystick" data-stick="${id}" tabindex="0" role="slider" aria-label="${title}" aria-valuemin="-100" aria-valuemax="100" aria-valuenow="0" aria-valuetext="center" style="--jx:${(p.x * 38).toFixed(1)}px;--jy:${(p.y * 38).toFixed(1)}px">
        <span class="stick-label top">${top}</span><span class="stick-label bottom">${bottom}</span>
        <span class="stick-label left">${left}</span><span class="stick-label right">${right}</span>
        <i class="stick-knob"></i>
      </div></div>`;
  }
  function questCard(q) {
    return `<div class="stick-answer quest-card"><span>${ui.esc(q.kind)} · about ${q.minutes} min</span><p data-questtitle>${ui.esc(q.title)}</p><ol>${q.steps.map(x => `<li>${ui.esc(x)}</li>`).join('')}</ol><small>${ui.esc(q.reason)}</small></div>`;
  }
  function bindSticks(root, commit) {
    const host = root.querySelector('[data-stickquest]');
    const update = (pad, x, y) => {
      const mag = Math.hypot(x, y) || 1;
      if (mag > 1) { x /= mag; y /= mag; }
      const p = sticks[pad.dataset.stick];
      p.x = Math.round(x * 100) / 100; p.y = Math.round(y * 100) / 100; p.touched = true;
      pad.style.setProperty('--jx', (p.x * 38).toFixed(1) + 'px');
      pad.style.setProperty('--jy', (p.y * 38).toFixed(1) + 'px');
      pad.setAttribute('aria-valuenow', String(Math.round(p.x * 100)));
      pad.setAttribute('aria-valuetext', 'horizontal ' + Math.round(p.x * 100) + ', vertical ' + Math.round(-p.y * 100));
      host.innerHTML = questCard(advice.quest(sticks, store.state));
      commit.disabled = !sticks.sense.touched || !sticks.move.touched;
    };
    root.querySelectorAll('[data-stick]').forEach(pad => {
      const point = e => {
        const r = pad.getBoundingClientRect();
        update(pad, (e.clientX - r.left - r.width / 2) / (r.width * .32), (e.clientY - r.top - r.height / 2) / (r.height * .32));
      };
      pad.onpointerdown = e => { pad.setPointerCapture(e.pointerId); pad.dataset.dragging = '1'; point(e); };
      pad.onpointermove = e => { if (pad.dataset.dragging) point(e); };
      pad.onpointerup = pad.onpointercancel = e => { delete pad.dataset.dragging; if (pad.hasPointerCapture(e.pointerId)) pad.releasePointerCapture(e.pointerId); };
      pad.onkeydown = e => {
        const p = sticks[pad.dataset.stick], step = e.shiftKey ? .25 : .12;
        const next = { x: p.x, y: p.y };
        if (e.key === 'ArrowLeft') next.x -= step; else if (e.key === 'ArrowRight') next.x += step;
        else if (e.key === 'ArrowUp') next.y -= step; else if (e.key === 'ArrowDown') next.y += step; else return;
        e.preventDefault(); update(pad, next.x, next.y);
      };
    });
  }
})(window.LO);
