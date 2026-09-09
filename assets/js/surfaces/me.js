/* ============================================================
   ME — progress first, six blocks, mission last.

   Trajectory · Aims · What I know · You · People · Mission

   Nothing on this page is a daily chore. The numbers count
   themselves, the aims read their own progress out of the record,
   and the only things you ever touch are events (an urge, a use,
   reaching someone) and the occasional question.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store, lib, D, insight, aims } = LO;

  let qAt = 0;

  LO.machine.register({
    id: 'me',
    name: 'Me',

    render(s) {
      const v = store.vitals();
      const clear = store.daysClear();
      const c = s.clarity;
      const recent = x => D.daysBetween(x.date, D.today()) < 14;
      const rode = c.urges.filter(u => recent(u) && u.rode).length;
      const proven = insight.truths(s);
      const facts = (s.identity.facts || []).slice(0, 4);
      const qs = insight.questions(s);
      const q = qs.length ? qs[qAt % qs.length] : null;
      const name = s.meta.name || 'you';

      const lvl = LO.level.stats();
      const port = insight.portrait(s);

      return `
        <!-- 0 · WHO -->
        <div class="profile">
          ${LO.companion.playerStats()}
          <div class="bigcrest"><img src="assets/icons/lumen-512.png" alt="Lumen glass companion"><b>${lvl.level}</b></div>
          <h1 class="pname">${ui.esc(cap(name))}</h1>
          <div class="plvl">Level ${lvl.level}  ·  ${lvl.into} / ${lvl.need}</div>
          <div class="meter" style="max-width:220px;margin:10px auto 0"><i style="width:${lvl.pct}%"></i></div>
          <div class="plvl" style="margin-top:8px">${lvl.total} points earned  ·  ${verdict(v)}</div>
        </div>
        <div class="portrait">${port.lines.map(l => `<p>${ui.esc(l)}</p>`).join('')}</div>
        ${LO.companion.guidancePanel()}

        <!-- 1 · TRAJECTORY -->
        <div class="lbl" style="margin-top:30px">Trajectory<span class="r">${verdict(v)}</span></div>
        <div class="stats">
          <div class="stat2"><b>${v.index}</b><span>Alignment</span></div>
          <div class="stat2"><b>${clear === null ? '—' : clear}</b><span>Days clear</span></div>
          <div class="stat2"><b>${store.winStreak()}</b><span>Day streak</span></div>
          <div class="stat2"><b>${s.chronicle.length}</b><span>Entries</span></div>
        </div>
        <div class="panel" style="margin-top:14px">
          ${ui.spark(store.indexSeries(30).map(p => p.v), { min: 0, max: 100 })}
          <p class="note" style="margin:8px auto 0">Counts itself. Last 30 days.</p>
        </div>
        <div class="clearbar" style="margin-top:12px">
          ${clear === null ? `<button class="fullbtn hot" data-dayone>Start the clear count</button>` : ''}
          <button class="fullbtn" data-urge>An urge just hit</button>
          <button class="fullbtn warn" data-used>I smoked — reset the count</button>
        </div>
        ${rode ? `<p class="note">${rode} urge${rode === 1 ? '' : 's'} ridden out in the last fortnight.</p>` : ''}

        <!-- 2 · AIMS -->
        <div class="lbl">Aims<span class="r">measured, not guessed</span></div>
        ${aimList(s)}
        <div class="acts" style="margin-top:14px">
          <input data-goal placeholder="Add an aim" style="max-width:250px;text-align:left">
          <select data-horizon style="max-width:130px">
            ${lib.horizons.map(h => `<option value="${h.id}"${h.id === 'quarter' ? ' selected' : ''}>${h.label}</option>`).join('')}
          </select>
          <button class="flat" data-addgoal>Add</button>
        </div>

        <!-- 3 · WHAT I KNOW -->
        <div class="lbl">What I know about you<span class="ln"></span></div>
        ${proven.length ? `<div class="proven">${proven.map(t =>
            `<div class="p"><b>${ui.esc(t.claim)}</b><span>${ui.esc(t.evidence)}</span></div>`).join('')}</div>`
          : `<p class="note">Nothing proven yet. Do one thing and the first line appears here, with the number that earns it.</p>`}
        ${facts.length ? `<div class="rows" style="margin-top:12px">${facts.map(f => `
          <div class="row-l" style="align-items:flex-start">
            <span class="t">${ui.esc(f.a)}<em>${ui.esc(f.q)}</em></span>
            <button class="x" data-delfact="${f.id}">×</button>
          </div>`).join('')}</div>` : ''}

        <!-- 4 · YOU -->
        <div class="lbl">You<span class="ln"></span></div>
        <div class="ns" contenteditable="true" data-ns spellcheck="false">${
          ui.esc(s.identity.northStar || 'Write what all of this is for.')}</div>
        <div class="rows" style="margin-top:16px">
          ${s.identity.statements.map(x => `<div class="row-l">
            <span class="t">${ui.esc(x.text)}</span>
            <button class="x" data-delst="${x.id}">×</button></div>`).join('')}
          ${s.identity.avoid.map(x => `<div class="row-l">
            <span class="t" style="color:var(--ink-2)">Done with: ${ui.esc(x.text)}</span>
            <button class="x" data-delav="${x.id}">×</button></div>`).join('')}
        </div>
        <div class="acts" style="margin-top:12px">
          <input data-st placeholder="I am someone who…" style="max-width:250px;text-align:left">
          <button class="flat" data-addst>Add</button>
        </div>
        <div class="acts" style="margin-top:8px">
          <input data-av placeholder="Done with…" style="max-width:250px;text-align:left">
          <button class="flat" data-addav>Add</button>
        </div>

        <!-- 5 · PEOPLE -->
        <div class="lbl">People<span class="r">${s.people.length || 'none yet'}</span></div>
        <button class="flat" data-friends>Open my circle · birthdays & plans ↗</button>
        ${people(s)}
        <div class="acts" style="margin-top:12px">
          <input data-person placeholder="Add a name" style="max-width:200px;text-align:left">
          <select data-cadence style="max-width:140px">
            <option value="7">Every week</option>
            <option value="14" selected>Every fortnight</option>
            <option value="30">Every month</option>
            <option value="90">Every few months</option>
          </select>
          <button class="flat" data-addperson>Add</button>
        </div>

        <!-- 6 · THE QUESTION -->
        <div class="lbl">One question at a time<span class="r">${(s.identity.facts || []).length} answered</span></div>
        ${q ? `
          <div class="ask">
            <h3>${ui.esc(q.q)}</h3>
            <textarea data-answer rows="3" placeholder="As long or short as you like."></textarea>
            <div class="acts">
              <button class="go" data-saveq="${q.id}">Answer</button>
              <button class="flat" data-nextq>A different one</button>
            </div>
            <p class="note" style="margin-top:12px">Everything you answer here becomes part of the
              portrait at the top of this page. There is always another question.</p>
          </div>` : ''}

        <!-- 7 · MISSION -->
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
        </div>`;
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

      const dayone = root.querySelector('[data-dayone]');
      if (dayone) dayone.onclick = () => { store.markClear(); ui.toast('Day one. It counts itself from here.'); redraw(); };
      root.querySelector('[data-urge]').onclick = () => LO.machine.quick('urge');
      root.querySelector('[data-used]').onclick = () => LO.machine.quick('used');

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
        // the answered question leaves the queue, so the cursor already
        // points at a new one — advancing it again would skip a question
        ui.toast('Kept');
        redraw();
      };
      const nq = root.querySelector('[data-nextq]');
      if (nq) nq.onclick = () => { qAt++; redraw(); };
      root.querySelectorAll('[data-delfact]').forEach(b => {
        b.onclick = () => { store.drop('identity.facts', b.dataset.delfact); redraw(); };
      });

      const addGoal = () => {
        const i = root.querySelector('[data-goal]');
        const title = i.value.trim();
        if (!title) return i.focus();
        const horizon = root.querySelector('[data-horizon]').value;
        const track = aims.detect(title, 'craft');
        store.add('goals', {
          title, domain: 'craft', horizon, why: '', metric: '', due: '',
          progress: 0, status: 'live', milestones: [], created: D.today(), track
        });
        ui.toast(track.kind === 'manual' ? 'Added — I cannot measure that one yet' : 'Added, and I will measure it');
        redraw();
      };
      root.querySelector('[data-addgoal]').onclick = addGoal;
      root.querySelector('[data-goal]').onkeydown = e => { if (e.key === 'Enter') addGoal(); };
      root.querySelectorAll('[data-delgoal]').forEach(b => {
        b.onclick = () => { store.drop('goals', b.dataset.delgoal); redraw(); };
      });
      root.querySelectorAll('[data-manual]').forEach(sl => {
        sl.oninput = () => { sl.closest('.aim').querySelector('.aim-pct').textContent = sl.value + '%'; };
        sl.onchange = () => {
          store.patch('goals', sl.dataset.manual, {
            progress: +sl.value, status: +sl.value >= 100 ? 'done' : 'live'
          });
          LO.machine.paintStatus();
        };
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

  function aimList(s) {
    const live = s.goals.filter(g => g.status !== 'parked');
    if (!live.length) return '<p class="note">Nothing set. One aim for the next 90 days is enough.</p>';

    return live.map(g => {
      const p = aims.progress(g, s);
      return `<div class="aim">
        <div class="aim-top">
          <span class="aim-t">${p.pct >= 100 ? '✓ ' : ''}${ui.esc(g.title)}</span>
          <span class="aim-pct">${p.pct}%</span>
          <button class="x" data-delgoal="${g.id}">×</button>
        </div>
        <div class="meter"><i style="width:${p.pct}%"></i></div>
        <div class="aim-m">${ui.esc(p.label)}${p.auto ? '' : ' · not measurable yet'}</div>
        ${p.auto ? '' : `<input type="range" min="0" max="100" step="5" value="${+g.progress || 0}"
          data-manual="${g.id}" style="width:100%;margin-top:8px">`}
      </div>`;
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
        <span class="r">${p.lastContact ? d + 'd' : 'never'}</span>
        <button class="flat" style="padding:8px 12px;font-size:11.5px" data-touch="${p.id}" data-how="text">Messaged</button>
        <button class="flat" style="padding:8px 12px;font-size:11.5px" data-touch="${p.id}" data-how="saw">Saw</button>
        <button class="x" data-delperson="${p.id}">×</button>
      </div>`;
    }).join('')}</div>`;
  }
})(window.LO);
