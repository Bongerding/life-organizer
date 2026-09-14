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
  let kept = false;     // just answered, so the page says so once

  LO.machine.register({
    id: 'advice',
    name: 'Advice',

    render(s) {
      const tip = advice.today(s);
      const noticed = insight.messages(s).filter(m => m.tone !== 'quiet').slice(0, 3);
      const sit = open ? advice.situation(open) : null;
      const seen = LO.mirror.ask(s);
      const said = LO.mirror.recent(2);

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

          <div class="lbl">What I can prove<span class="r">${said.length ? said.length + ' kept' : 'one question'}</span></div>
          ${seen ? `
            <div class="panel mirror">
              <div class="mirror-claim">${ui.esc(seen.claim)}</div>
              <h3 class="mirror-q">${ui.esc(seen.q)}</h3>
              <textarea data-mirror rows="3" placeholder="As long or short as you like. Nobody else reads this."></textarea>
              <div class="acts">
                <button class="go" data-keepmirror>Answer</button>
                <button class="flat" data-another>Ask me something else</button>
              </div>
            </div>`
          : `<div class="panel mirror quiet">
              <p class="note" style="margin:0">Nothing in the record stands out enough to ask about today.
                That is a real answer, not an empty state — every question here has to be earned by a
                number, and today there isn't one.</p>
            </div>`}
          ${kept ? `<p class="note mirror-kept">Kept. It will show up in your portrait on Me.</p>` : ''}
          ${said.length ? `
            <div class="mirror-past">
              ${said.map(x => `<div class="mp">
                <span class="mp-q">${ui.esc(x.q)}</span>
                <span class="mp-a">${ui.esc(x.text)}</span>
              </div>`).join('')}
            </div>` : ''}
`}`;
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

      const box = root.querySelector('[data-mirror]');
      const keep = root.querySelector('[data-keepmirror]');
      if (keep) keep.onclick = () => {
        const text = box.value.trim();
        if (text.length < 2) return box.focus();
        LO.mirror.answer(LO.mirror.ask(store.state), text);
        kept = true;
        ui.toast('Kept');
        redraw();
        setTimeout(() => { kept = false; }, 1);
      };
      const another = root.querySelector('[data-another]');
      if (another) another.onclick = () => { LO.mirror.another(); kept = false; redraw(); };
    }
  });
})(window.LO);
