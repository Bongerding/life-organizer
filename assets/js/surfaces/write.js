/* ============================================================
   WRITE — one box for everything, sorted for you.
   You type; it works out whether that was a task, a chore, an
   activity, a plan, a feeling or a thought, and says why. Tap a
   different one and it remembers the correction.
   Tasks and chores appear on Do. Everything is kept, in order.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store, classify, D } = LO;

  const FILTERS = [
    { id: 'mine',     label: 'Everything I wrote', types: ['task', 'chore', 'activity', 'plan', 'feeling', 'thought', 'entry', 'note'] },
    { id: 'task',     label: 'Tasks',      types: ['task', 'done'] },
    { id: 'chore',    label: 'Chores',     types: ['chore'] },
    { id: 'activity', label: 'Activities', types: ['activity'] },
    { id: 'plan',     label: 'Plans',      types: ['plan'] },
    { id: 'feeling',  label: 'Feelings',   types: ['feeling', 'state'] },
    { id: 'thought',  label: 'Thoughts',   types: ['thought', 'entry', 'note'] },
    { id: 'all',      label: 'All activity', types: null }
  ];

  let kind = 'thought';
  let auto = true;        // the kind still comes from the guess
  let why = '';
  let filter = 'mine';
  let query = '';
  let shown = 14;

  LO.machine.register({
    id: 'write',
    name: 'Write',

    render(s) {
      const counts = {};
      FILTERS[0].types.forEach(t => { counts[t] = 0; });
      s.chronicle.forEach(e => { if (counts[e.type] !== undefined) counts[e.type]++; });
      const mine = Object.values(counts).reduce((a, b) => a + b, 0);

      return `
        <h1 class="hd">Write it down.</h1>
        <p class="lede">One box for all of it. I will work out what it was.</p>

        <textarea id="writebox" placeholder="A task, a chore, something you did, a plan, how you feel, or just a thought."></textarea>
        <div data-guess>${guessRow(s)}</div>
        ${kind === 'feeling' ? feelingPanel() : ''}
        <div class="writefoot">
          <button class="go" data-save>Save</button>
          <span class="hint">Ctrl + Enter</span>
        </div>

        <div class="lbl">Your record<span class="r">${mine} written</span></div>
        <div class="chips2">
          ${FILTERS.map(f => `<button class="kpill ${f.id === filter ? 'on' : ''}" data-filter="${f.id}">${f.label}</button>`).join('')}
          <input data-search value="${ui.esc(query)}" placeholder="Search">
        </div>
        ${stream(s)}`;
    },

    mount(root) {
      const self = LO.machine.get('write');
      const redraw = () => self.refresh();
      const box = root.querySelector('#writebox');

      /* re-guess as he types, without redrawing the box he is typing in */
      let t;
      const reguess = () => {
        if (!auto) return;
        const g = classify.guess(box.value, store.state);
        if (g.kind !== kind || g.why !== why) {
          kind = g.kind; why = g.why;
          paintGuess();
        }
      };
      box.oninput = () => { clearTimeout(t); t = setTimeout(reguess, 220); };
      box.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save(); };

      function paintGuess() {
        const host = root.querySelector('[data-guess]');
        host.innerHTML = guessRow(store.state);
        bindPills();
        // the feeling sliders appear and disappear with the kind
        const has = !!root.querySelector('[data-feel]');
        if (kind === 'feeling' && !has) host.insertAdjacentHTML('afterend', feelingPanel());
        if (kind !== 'feeling' && has) root.querySelector('[data-feel]').remove();
      }

      function bindPills() {
        root.querySelectorAll('[data-kind]').forEach(b => {
          b.onclick = () => {
            const wrong = kind;
            kind = b.dataset.kind;
            auto = false;
            why = '';
            if (wrong !== kind) {
              classify.learn(box.value, kind, wrong, store.state);
              store.save();
            }
            paintGuess();
            box.focus();
          };
        });
      }
      bindPills();

      function save() {
        const text = box.value.trim();
        if (text.length < 2) return box.focus();
        store.write(kind, text);
        if (kind === 'feeling') {
          const panel = root.querySelector('[data-feel]');
          if (panel) {
            const d = ui.read(panel);
            store.setLog('mind.logs', {
              mood: +d.mood, energy: +d.energy, clarity: +d.clarity, stress: +d.stress,
              grateful: '', note: text
            });
          }
        }
        store.win('write', labelFor(kind), 0, 'write_' + kind);
        ui.toast(classify.kind(kind).actionable ? 'Added to Do' : 'Saved');
        kind = 'thought'; auto = true; why = '';
        redraw();
        const nb = document.querySelector('#writebox');
        if (nb) nb.focus();
      }
      root.querySelector('[data-save]').onclick = save;

      root.querySelectorAll('[data-filter]').forEach(b => {
        b.onclick = () => { filter = b.dataset.filter; shown = 14; redraw(); };
      });
      const search = root.querySelector('[data-search]');
      search.oninput = () => { query = search.value; shown = 14; paintStream(); };
      search.onkeydown = e => { if (e.key === 'Escape') { query = ''; redraw(); } };

      function paintStream() {
        root.querySelector('[data-stream]').outerHTML = stream(store.state);
        bindStream();
      }
      function bindStream() {
        const more = root.querySelector('[data-more]');
        if (more) more.onclick = () => { shown += 21; redraw(); };
        root.querySelectorAll('[data-del]').forEach(b => {
          b.onclick = () => {
            const ev = store.state.chronicle.find(x => x.id === b.dataset.del);
            if (ev && ev.meta && ev.meta.ref) store.drop('scribe.entries', ev.meta.ref);
            const i = store.state.chronicle.findIndex(x => x.id === b.dataset.del);
            if (i > -1) store.state.chronicle.splice(i, 1);
            store.save(); redraw();
          };
        });
      }
      bindStream();
    }
  });

  function guessRow(s) {
    const k = classify.kind(kind);
    return `
      <div class="kinds">
        ${classify.KINDS.map(x => `
          <button class="kpill ${x.id === kind ? 'on' : ''}" data-kind="${x.id}" title="${ui.esc(x.hint)}">${x.label}</button>`).join('')}
      </div>
      <p class="note" style="margin:0 0 4px">${
        auto && why ? 'Looks like ' + art(k.label) + ' <b style="color:var(--accent)">' + k.label.toLowerCase() + '</b> — ' + ui.esc(why) + '. Tap another if that is wrong.'
        : auto ? 'Pick one, or just write and I will guess.'
        : 'Filed as <b style="color:var(--accent)">' + k.label.toLowerCase() + '</b>. Noted for next time.'}</p>`;
  }

  function art(w) { return /^[aeiou]/i.test(w) ? 'an' : 'a'; }

  function feelingPanel() {
    return `<div class="panel" data-feel style="margin-top:12px;text-align:left">
      <div class="lbl" style="margin:0 0 10px">How you are right now</div>
      ${ui.field('mood', 'Mood', { type: 'range', min: 1, max: 10, value: 6 })}
      ${ui.field('energy', 'Energy', { type: 'range', min: 1, max: 10, value: 6 })}
      ${ui.field('clarity', 'Clarity', { type: 'range', min: 1, max: 10, value: 5 })}
      ${ui.field('stress', 'Stress', { type: 'range', min: 1, max: 10, value: 5 })}
    </div>`;
  }

  function labelFor(k) {
    return ({ task: 'Wrote a task', chore: 'Wrote a chore', activity: 'Logged an activity',
      plan: 'Wrote a plan', feeling: 'Wrote how you feel' })[k] || 'Wrote something down';
  }

  function stream(s) {
    const f = FILTERS.find(x => x.id === filter);
    const q = query.trim().toLowerCase();
    let evs = s.chronicle;
    if (f && f.types) evs = evs.filter(e => f.types.includes(e.type));
    if (q) evs = evs.filter(e => (e.text || '').toLowerCase().includes(q));

    if (!evs.length) {
      return `<div data-stream><p class="note">${q ? 'Nothing matches that.'
        : 'Nothing here yet. Write one line above.'}</p></div>`;
    }

    const byDay = new Map();
    for (const e of evs) {
      if (!byDay.has(e.date)) byDay.set(e.date, []);
      byDay.get(e.date).push(e);
    }
    const days = [...byDay.keys()].sort().reverse();
    for (const d of days) byDay.get(d).sort((a, b) => (b.ts || 0) - (a.ts || 0));

    const WRITTEN = ['task', 'chore', 'activity', 'plan', 'feeling', 'thought', 'entry', 'note'];
    return `<div data-stream>
      ${days.slice(0, shown).map((d, i) => {
        const ago = D.daysBetween(d, D.today());
        return `<div class="dayblock" style="--d:${Math.min(i, 8) * 40}ms">
          <div class="dayhead">${ago === 0 ? 'Today' : ago === 1 ? 'Yesterday'
            : D.label(d) + ' ' + D.pretty(d)}</div>
          ${byDay.get(d).map(e => {
            const written = WRITTEN.includes(e.type);
            return `<div class="entry ${written ? '' : 'thin'}">
              <div class="meta"><span class="k">${LABELS[e.type] || e.type}</span><span class="tm">${time(e.ts)}</span></div>
              <div class="body">${ui.esc(e.text)}</div>
              ${written ? `<button class="x" data-del="${e.id}" title="Delete">×</button>` : ''}
            </div>`;
          }).join('')}
        </div>`;
      }).join('')}
      ${days.length > shown ? `<div class="acts"><button class="flat" data-more">Show more</button></div>` : ''}
    </div>`;
  }

  const LABELS = {
    task: 'task', chore: 'chore', activity: 'activity', plan: 'plan', feeling: 'feeling',
    thought: 'thought', done: 'done', entry: 'written', note: 'written', step: 'did',
    habit: 'habit', person: 'person', urge: 'urge', use: 'smoked', clear: 'clear',
    state: 'mood', body: 'body', rep: 'practice', goal: 'aim', rewire: 'target',
    insight: 'answer', advice: 'advice', system: 'system'
  };
  function time(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
})(window.LO);
