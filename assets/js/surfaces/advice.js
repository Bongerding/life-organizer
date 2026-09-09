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
  let drill = null;
  let drillDone = false;

  LO.machine.register({
    id: 'advice',
    name: 'Advice',

    render(s) {
      const tip = advice.today(s);
      const noticed = insight.messages(s).filter(m => m.tone !== 'quiet').slice(0, 3);
      const sit = open ? advice.situation(open) : null;
      if (!drill) drill = dealDrill(s);

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

          <div class="lbl">The practice arcade<span class="r">${s.rewire.reps.length} explored</span></div>
          <div class="panel practice-card" style="text-align:left">
            <div class="eyebrow">✦ A small quest · ${LO.adaptive.analyze(s).mode}</div>
            <div class="lbl" style="margin:0 0 10px;justify-content:flex-start">
              ${ui.esc(drill.kind)} · ${ui.esc(traitLabel(drill.trait))}</div>
            <div style="font-size:17px;color:var(--ink-0);font-weight:600;margin-bottom:10px">${ui.esc(drill.title)}</div>
            <div class="note" style="max-width:58ch;margin:0 0 14px">${ui.esc(drill.situation)}</div>
            <div style="font-size:14px;color:var(--accent);margin-bottom:10px">${ui.esc(drill.ask)}</div>
            ${drillDone
              ? `<div class="note" style="border-top:1px solid var(--line);padding-top:14px;color:var(--ink-1);margin:0">
                   ${ui.esc(drill.reinforce)}</div>
                 <div class="acts" style="justify-content:flex-start"><button class="flat" data-feedback="yes">That helped ☀</button><button class="flat" data-feedback="no">Try a different approach</button><button class="flat" data-newdrill>Next quest →</button></div>`
              : `<textarea data-drill rows="3" placeholder="Try one honest sentence. You can build on it."></textarea>
                 <div class="acts" style="justify-content:flex-start">
                   <button class="go" data-commit>Complete this quest ✦</button>
                   <button class="flat" data-newdrill>Deal another ↻</button>
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

      const commit = root.querySelector('[data-commit]');
      root.querySelectorAll('[data-feedback]').forEach(b => b.onclick = () => {
        LO.adaptive.feedback(drill.kind, b.dataset.feedback === 'yes');
        root.querySelectorAll('[data-feedback]').forEach(x => { x.disabled = true; });
        ui.toast('Noted. This shapes future practices.');
      });
      if (commit) commit.onclick = () => {
        const box = root.querySelector('[data-drill]');
        const text = box.value.trim();
        if (text.length < 3) { ui.toast('One small thought is enough'); return box.focus(); }
        store.add('rewire.reps', { date: D.today(), drillId: drill.id, trait: drill.trait, response: text });
        store.win('practice', drill.title, 0, 'drill_' + drill.id);
        drillDone = true;
        ui.toast('Saved');
        redraw();
      };
      root.querySelectorAll('[data-newdrill]').forEach(b => {
        b.onclick = () => { drill = dealDrill(store.state, drill && drill.id); drillDone = false; redraw(); };
      });
    }
  });

  function dealDrill(s, avoid) {
    const bank = lib.drills;
    const wanted = s.rewire.targets.map(t => t.trait);
    const recent = s.rewire.reps.slice(0, 10).map(r => r.drillId);
    const scored = bank.map(d => {
      let w = LO.adaptive.preference(d.kind, s);
      if (wanted.includes(d.trait)) w *= 5;
      const mode = LO.adaptive.analyze(s).mode;
      if (mode === 'gentle') w *= /exposure/i.test(d.kind) ? 0.6 : 1.4;
      if (recent.includes(d.id)) w *= 0.12;
      if (avoid && d.id === avoid) w = 0;
      return { d, w };
    }).filter(x => x.w > 0);
    if (!scored.length) return bank[0];
    const total = scored.reduce((a, x) => a + x.w, 0);
    let r = Math.random() * total;
    for (const x of scored) { r -= x.w; if (r <= 0) return x.d; }
    return scored[0].d;
  }
  function traitLabel(id) { const t = lib.traits.find(x => x.id === id); return t ? t.label : id; }
})(window.LO);
