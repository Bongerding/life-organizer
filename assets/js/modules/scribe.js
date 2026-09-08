/* ============================================================
   SCRIBE — the record and the memory.
   Journal entries carry the prompt they answered, so the archive
   stays searchable by question rather than by date alone.
   Insights are the distilled layer: things now known about you.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store, lib, D } = LO;

  let promptIndex = null;

  LO.app.register({
    id: 'scribe',
    name: 'Scribe',
    glyph: '✎',
    accent: 'var(--c-scribe)',
    accentSoft: 'rgba(226,201,139,.14)',
    tagline: 'The written record, and what it has taught the system',

    metric(s) {
      const n = s.scribe.entries.length;
      const wrote = s.scribe.entries.some(e => e.date === D.today());
      return n + ' entr' + (n === 1 ? 'y' : 'ies') + (wrote ? ' ✓' : '');
    },

    render(s) {
      const S = s.scribe;
      if (promptIndex === null) promptIndex = dayPrompt();
      const prompt = lib.prompts[promptIndex];
      const wroteToday = S.entries.some(e => e.date === D.today());
      const streak = writeStreak(S.entries);
      const words = S.entries.reduce((a, e) => a + (e.text || '').split(/\s+/).filter(Boolean).length, 0);

      return `<div class="grid wide">

        ${ui.card('Tonight\'s Prompt', `
          <div style="font-size:17px;line-height:1.5;color:var(--ink-0);margin-bottom:14px">${ui.esc(prompt)}</div>
          <textarea data-entry rows="6" placeholder="No audience. No editing. Just what is true."></textarea>
          <div class="btn-row" style="margin-top:12px">
            <button class="btn primary" data-save>Commit Entry</button>
            <button class="btn ghost" data-next>Different Prompt</button>
            <button class="btn ghost" data-free>Free Write</button>
          </div>
          ${wroteToday ? '<div class="sub">You have already written today. Another entry is fine.</div>' : ''}`,
          { span: true })}

        ${ui.card('Record', `
          <div class="kv"><span>Entries</span><b>${S.entries.length}</b></div>
          <div class="kv"><span>Words</span><b>${words.toLocaleString()}</b></div>
          <div class="kv"><span>Writing streak</span><b>${streak}d</b></div>
          <div class="kv"><span>Insights held</span><b>${S.insights.length}</b></div>
          <div class="hr"></div>
          ${ui.spark(D.lastDays(28).map(d =>
            S.entries.filter(e => e.date === d).reduce((a, e) => a + (e.text || '').split(/\s+/).filter(Boolean).length, 0) || null
          ))}
          <div class="sub">Words per day, last 28.</div>`, { delay: 60 })}

        ${ui.card('Insights', `
          <div class="sub" style="margin-top:0">Things now known about how you work. This is the layer the mentor reads first.</div>
          <div class="list" style="margin:12px 0">
            ${S.insights.length ? S.insights.map(i => `
              <div class="item" style="align-items:flex-start">
                <div class="t">${ui.esc(i.text)}<em>${D.pretty(i.date)}</em></div>
                <button class="x" data-deli="${i.id}">×</button>
              </div>`).join('') : ui.empty('Nothing distilled yet.')}
          </div>
          <div class="row">
            <input data-insight placeholder="I do my best work when…">
            <button class="btn sm" data-addi style="flex:0 0 auto">Hold</button>
          </div>`, { delay: 120 })}

        ${ui.card('Archive', S.entries.length ? `
          <div class="row" style="margin-bottom:12px">
            <input data-search placeholder="Search the archive…">
          </div>
          <div class="stack" data-archive>
            ${S.entries.slice(0, 30).map(e => entryHtml(e)).join('')}
          </div>` : ui.empty('The archive fills itself. Write one entry.'), { delay: 180, span: true })}
      </div>`;
    },

    mount(root) {
      const self = LO.app.get('scribe');
      const box = root.querySelector('[data-entry]');

      root.querySelector('[data-save]').onclick = () => {
        const text = box.value.trim();
        if (text.length < 4) { ui.toast('Write something first'); box.focus(); return; }
        store.add('scribe.entries', {
          date: D.today(),
          prompt: root.querySelector('[data-free-mode]') ? '' : lib.prompts[promptIndex],
          text, tags: []
        });
        promptIndex = (promptIndex + 7) % lib.prompts.length;
        ui.toast('Entered into the record');
        self.refresh();
      };

      root.querySelector('[data-next]').onclick = () => {
        promptIndex = (promptIndex + 1) % lib.prompts.length;
        self.refresh();
      };

      root.querySelector('[data-free]').onclick = () => {
        const card = box.closest('.card');
        card.querySelector('div').textContent = 'Free write — no prompt.';
        const m = document.createElement('span');
        m.setAttribute('data-free-mode', '1');
        m.hidden = true;
        card.appendChild(m);
        box.focus();
      };

      const ins = root.querySelector('[data-insight]');
      const addIns = () => {
        if (!ins.value.trim()) return;
        store.add('scribe.insights', { date: D.today(), text: ins.value.trim(), source: 'self' });
        ui.toast('Held'); self.refresh();
      };
      root.querySelector('[data-addi]').onclick = addIns;
      ins.onkeydown = e => { if (e.key === 'Enter') addIns(); };

      root.querySelectorAll('[data-deli]').forEach(b => {
        b.onclick = () => { store.drop('scribe.insights', b.dataset.deli); self.refresh(); };
      });

      const search = root.querySelector('[data-search]');
      if (search) {
        search.oninput = () => {
          const q = search.value.trim().toLowerCase();
          const hits = store.state.scribe.entries.filter(e =>
            !q || (e.text + ' ' + (e.prompt || '')).toLowerCase().includes(q));
          root.querySelector('[data-archive]').innerHTML =
            hits.length ? hits.slice(0, 40).map(e => entryHtml(e)).join('') : ui.empty('No entries match.');
          bindDeletes(root, self);
        };
      }
      bindDeletes(root, self);
    }
  });

  function bindDeletes(root, self) {
    root.querySelectorAll('[data-dele]').forEach(b => {
      b.onclick = () => { store.drop('scribe.entries', b.dataset.dele); self.refresh(); };
    });
  }

  function entryHtml(e) {
    return `<div style="border:1px solid var(--line);border-radius:var(--r-sm);padding:12px;background:rgba(7,10,17,.45)">
      <div style="display:flex;gap:10px;align-items:baseline">
        <span class="mono" style="font-size:10px;color:var(--accent);letter-spacing:.1em">${D.pretty(e.date)}</span>
        <button class="x" data-dele="${e.id}" style="margin-left:auto">×</button>
      </div>
      ${e.prompt ? `<div style="font-size:11.5px;color:var(--ink-3);font-style:italic;margin:5px 0 7px">${ui.esc(e.prompt)}</div>` : ''}
      <div style="font-size:13px;line-height:1.68;white-space:pre-wrap;color:var(--ink-1)">${ui.esc(e.text)}</div>
    </div>`;
  }

  /** prompt rotates by day so it feels like a daily question, not a shuffle */
  function dayPrompt() {
    const d = new Date();
    const n = Math.floor(d.getTime() / 86400000);
    return n % LO.lib.prompts.length;
  }

  function writeStreak(entries) {
    const set = new Set(entries.map(e => e.date));
    let n = 0, d = D.today();
    if (!set.has(d)) d = D.shift(-1);
    while (set.has(d)) { n++; d = D.shift(-1, d); }
    return n;
  }
})(window.LO);
