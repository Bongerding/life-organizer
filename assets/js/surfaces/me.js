/* ============================================================
   ME — the page about you, and it keeps itself.
   What it can prove, one thing it wants to ask, what you have
   told it, what you are aiming at, who you are drifting from.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store, lib, D, insight } = LO;

  let qAt = 0;

  LO.machine.register({
    id: 'me',
    name: 'Me',

    render(s) {
      const proven = insight.truths(s);
      const qs = insight.questions(s);
      const q = qs.length ? qs[qAt % qs.length] : null;
      const facts = (s.identity.facts || []).slice(0, 5);
      const v = store.vitals();
      const clear = store.daysClear();
      const name = s.meta.name || 'you';
      const c = s.clarity;
      const recent = x => D.daysBetween(x.date, D.today()) < 14;
      const rode = c.urges.filter(u => recent(u) && u.rode).length;
      const used = c.uses.filter(recent).length;

      return `
        <div class="lbl" style="margin-top:8px">Trajectory<span class="r">${verdict(v)}</span></div>
        <div class="stats">
          <div class="stat2"><b>${v.index}</b><span>Alignment</span></div>
          ${clear !== null ? `<div class="stat2"><b>${clear}</b><span>Days clear</span></div>` : ''}
          <div class="stat2"><b>${store.winStreak()}</b><span>Day streak</span></div>
          <div class="stat2"><b>${s.chronicle.length}</b><span>Entries</span></div>
        </div>
        <div class="panel" style="margin-top:14px">
          ${ui.spark(store.indexSeries(30).map(p => p.v), { min: 0, max: 100 })}
          <p class="note" style="margin:8px auto 0">Alignment, last 30 days.</p>
        </div>

        <div class="lbl">The mission<span class="ln"></span></div>
        <div class="mission">
          <p>Build the life you described, not the one you drift into.</p>
          <p>I keep the record so you do not have to remember it. I read what actually
             happened rather than what you meant to do, and I say it plainly. I give you
             one thing to start, because starting is the part that costs you.</p>
          <p>I will not flatter you. Every claim on this page carries the number that
             earns it. When something is drifting I say so once and hand you a protocol,
             not a lecture.</p>
          <p class="m-end">One measure: better than yesterday, by the data.</p>
        </div>

        <div class="lbl">You<span class="ln"></span></div>
        <h1 class="hd" style="margin-bottom:12px">${ui.esc(cap(name))}</h1>
        <div class="ns" contenteditable="true" data-ns spellcheck="false">${
          ui.esc(s.identity.northStar || 'Write what all of this is for.')}</div>

        <div class="lbl">Clear<span class="r">${clear === null ? 'not started' : 'best ' + (s.clarity.best || 0) + 'd'}</span></div>
        <div class="clearbar">
          ${clear === null ? `<button class="fullbtn hot" data-dayone>Today is day one</button>` : ''}
          <button class="fullbtn" data-urge>An urge just hit</button>
          <button class="fullbtn warn" data-used>I smoked — reset the count</button>
        </div>
        <p class="note">${clear === null
          ? 'Start the count and it runs on its own. You never mark a day.'
          : 'This counts itself. You only touch it when something happens.'}</p>
        ${clear !== null || rode || used ? `<p class="note">${rode} urge${rode === 1 ? '' : 's'} ridden out in the
          last fortnight${used ? ', ' + used + ' used' : ''}. A use resets the count and nothing else.</p>` : ''}

        <div class="lbl">What is true<span class="ln"></span></div>
        ${proven.length ? `<div class="proven">${proven.map(t =>
            `<div class="p"><b>${ui.esc(t.claim)}</b><span>${ui.esc(t.evidence)}</span></div>`).join('')}</div>`
          : `<p class="note">Nothing proven yet. Do one thing on the Do tab and the first line appears here, with the number that earns it.</p>`}

        ${q ? `
          <div class="lbl">One question<span class="r">${qs.length} left</span></div>
          <div class="ask">
            <h3>${ui.esc(q.q)}</h3>
            <textarea data-answer rows="3" placeholder="As long or short as you like."></textarea>
            <div class="acts">
              <button class="go" data-saveq="${q.id}">Answer</button>
              <button class="flat" data-nextq>Different question</button>
            </div>
          </div>` : ''}

        ${facts.length ? `
          <div class="lbl">What you have told me<span class="ln"></span></div>
          <div class="rows">${facts.map(f => `
            <div class="row-l" style="align-items:flex-start">
              <span class="t">${ui.esc(f.a)}<em>${ui.esc(f.q)} · ${D.pretty(f.date)}</em></span>
              <button class="x" data-delfact="${f.id}">×</button>
            </div>`).join('')}</div>` : ''}

        <div class="lbl">Aims<span class="ln"></span></div>
        ${aims(s)}
        <div class="acts" style="margin-top:12px">
          <input data-goal placeholder="Add an aim" style="max-width:280px;text-align:left">
          <select data-horizon style="max-width:140px">
            ${lib.horizons.map(h => `<option value="${h.id}"${h.id === 'quarter' ? ' selected' : ''}>${h.label}</option>`).join('')}
          </select>
          <button class="flat" data-addgoal>Add</button>
        </div>

        <div class="lbl">People<span class="r">${s.people.length || 'none yet'}</span></div>
        ${people(s)}
        <div class="acts" style="margin-top:12px">
          <input data-person placeholder="Add a name" style="max-width:220px;text-align:left">
          <select data-cadence style="max-width:150px">
            <option value="7">Every week</option>
            <option value="14" selected>Every fortnight</option>
            <option value="30">Every month</option>
            <option value="90">Every few months</option>
          </select>
          <button class="flat" data-addperson>Add</button>
        </div>

        <div class="lbl">Who you are becoming<span class="ln"></span></div>
        <div class="rows">
          ${s.identity.statements.map(x => `<div class="row-l"><span class="t">${ui.esc(x.text)}</span>
            <button class="x" data-delst="${x.id}">×</button></div>`).join('') ||
            '<p class="note">Nothing written.</p>'}
        </div>
        <div class="acts" style="margin-top:12px">
          <input data-st placeholder="I am someone who…" style="max-width:340px;text-align:left">
          <button class="flat" data-addst>Add</button>
        </div>

        <div class="lbl">What you are done with<span class="ln"></span></div>
        <div class="rows">
          ${s.identity.avoid.map(x => `<div class="row-l"><span class="t">${ui.esc(x.text)}</span>
            <button class="x" data-delav="${x.id}">×</button></div>`).join('') ||
            '<p class="note">Nothing written.</p>'}
        </div>
        <div class="acts" style="margin-top:12px">
          <input data-av placeholder="The thing I am done with" style="max-width:340px;text-align:left">
          <button class="flat" data-addav>Add</button>
        </div>

        <p class="note" style="margin-top:26px">Everything here is yours and stays on this
          device. The gear icon backs it all up.</p>`;
    },

    mount(root) {
      const self = LO.machine.get('me');
      const redraw = () => self.refresh();

      const ns = root.querySelector('[data-ns]');
      ns.onblur = () => {
        const t = ns.textContent.trim();
        if (t && t !== 'Write what all of this is for.') {
          store.state.identity.northStar = t;
          store.save();
          ui.toast('Saved');
        }
      };

      const sq = root.querySelector('[data-saveq]');
      if (sq) sq.onclick = () => {
        const box = root.querySelector('[data-answer]');
        const a = box.value.trim();
        if (a.length < 2) return box.focus();
        const q = insight.BANK.find(x => x.id === sq.dataset.saveq);
        store.state.identity.facts.unshift({
          id: store.id('fact'), qid: q.id, q: q.q, a, date: D.today()
        });
        if (q.id === 'name') store.state.meta.name = a.split(/[\s,]/)[0];
        store.log('insight', a, { q: q.q });
        store.save();
        ui.toast('Kept');
        redraw();
      };
      const dayone = root.querySelector('[data-dayone]');
      if (dayone) dayone.onclick = () => { store.markClear(); ui.toast('Day one. The number exists now.'); redraw(); };
      const ub = root.querySelector('[data-urge]');
      if (ub) ub.onclick = () => LO.machine.quick('urge');
      const usedb = root.querySelector('[data-used]');
      if (usedb) usedb.onclick = () => LO.machine.quick('used');

      const nq = root.querySelector('[data-nextq]');
      if (nq) nq.onclick = () => { qAt++; redraw(); };

      root.querySelectorAll('[data-delfact]').forEach(b => {
        b.onclick = () => { store.drop('identity.facts', b.dataset.delfact); redraw(); };
      });

      root.querySelectorAll('[data-prog]').forEach(sl => {
        sl.oninput = () => { sl.closest('.row-l').querySelector('.r').textContent = sl.value + '%'; };
        sl.onchange = () => {
          store.patch('goals', sl.dataset.prog, {
            progress: +sl.value, status: +sl.value >= 100 ? 'done' : 'live'
          });
          LO.machine.paintStatus();
        };
      });

      const addGoal = () => {
        const i = root.querySelector('[data-goal]');
        if (!i.value.trim()) return i.focus();
        store.add('goals', {
          title: i.value.trim(), domain: 'craft',
          horizon: root.querySelector('[data-horizon]').value,
          why: '', metric: '', due: '', progress: 0, status: 'live', milestones: [], created: D.today()
        });
        ui.toast('Added'); redraw();
      };
      root.querySelector('[data-addgoal]').onclick = addGoal;
      root.querySelector('[data-goal]').onkeydown = e => { if (e.key === 'Enter') addGoal(); };
      root.querySelectorAll('[data-delgoal]').forEach(b => {
        b.onclick = () => { store.drop('goals', b.dataset.delgoal); redraw(); };
      });

      const addPerson = () => {
        const i = root.querySelector('[data-person]');
        if (!i.value.trim()) return i.focus();
        store.add('people', {
          name: i.value.trim(), cadence: +root.querySelector('[data-cadence]').value,
          lastContact: '', note: '', created: D.today()
        });
        ui.toast('Added'); redraw();
      };
      root.querySelector('[data-addperson]').onclick = addPerson;
      root.querySelector('[data-person]').onkeydown = e => { if (e.key === 'Enter') addPerson(); };
      root.querySelectorAll('[data-touch]').forEach(b => {
        b.onclick = () => { store.contacted(b.dataset.touch, b.dataset.how); ui.toast('Logged'); redraw(); };
      });
      root.querySelectorAll('[data-delperson]').forEach(b => {
        b.onclick = () => { store.drop('people', b.dataset.delperson); redraw(); };
      });

      const adder = (path, sel, btn) => {
        const i = root.querySelector(sel);
        const go = () => {
          if (!i.value.trim()) return i.focus();
          store.at(path).push({ id: store.id('t'), text: i.value.trim() });
          store.save(); ui.toast('Added'); redraw();
        };
        root.querySelector(btn).onclick = go;
        i.onkeydown = e => { if (e.key === 'Enter') go(); };
      };
      adder('identity.statements', '[data-st]', '[data-addst]');
      adder('identity.avoid', '[data-av]', '[data-addav]');
      root.querySelectorAll('[data-delst]').forEach(b => {
        b.onclick = () => { store.drop('identity.statements', b.dataset.delst); redraw(); };
      });
      root.querySelectorAll('[data-delav]').forEach(b => {
        b.onclick = () => { store.drop('identity.avoid', b.dataset.delav); redraw(); };
      });
    }
  });

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function verdict(v) {
    if (!v.signal) return 'no signal yet';
    return v.index >= 80 ? 'compounding' : v.index >= 60 ? 'holding'
      : v.index >= 35 ? 'drifting' : 'cold';
  }

  function aims(s) {
    const live = s.goals.filter(g => g.status !== 'parked');
    if (!live.length) return '<p class="note">Nothing set. One aim for the next 90 days is enough.</p>';
    return lib.horizons.map(h => {
      const list = live.filter(g => g.horizon === h.id);
      if (!list.length) return '';
      return `<div class="lbl" style="margin:16px 0 4px;font-size:9.5px">${h.label}</div>
        <div class="rows">${list.map(g => `
          <div class="row-l" style="flex-wrap:wrap">
            <span class="t">${g.status === 'done' ? '✓ ' : ''}${ui.esc(g.title)}</span>
            <span class="r">${+g.progress || 0}%</span>
            <button class="x" data-delgoal="${g.id}">×</button>
            <input type="range" min="0" max="100" step="5" value="${+g.progress || 0}" data-prog="${g.id}"
                   style="flex:1 1 100%;margin-top:6px">
          </div>`).join('')}</div>`;
    }).join('');
  }

  function people(s) {
    if (!s.people.length) return '<p class="note">Add the people you do not want to lose touch with. This counts the days so you do not have to.</p>';
    const ranked = [...s.people].sort((a, b) =>
      (store.daysSince(b) - (b.cadence || 21)) - (store.daysSince(a) - (a.cadence || 21)));
    return `<div class="rows">${ranked.map(p => {
      const d = store.daysSince(p);
      const late = d > (p.cadence || 21);
      return `<div class="row-l ${late ? 'late' : ''}">
        <span class="t">${ui.esc(p.name)}</span>
        <span class="r">${p.lastContact ? d + 'd ago' : 'never'}</span>
        <button class="flat" style="padding:7px 11px;font-size:11.5px" data-touch="${p.id}" data-how="text">Messaged</button>
        <button class="flat" style="padding:7px 11px;font-size:11.5px" data-touch="${p.id}" data-how="saw">Saw them</button>
        <button class="x" data-delperson="${p.id}">×</button>
      </div>`;
    }).join('')}</div>`;
  }
})(window.LO);
