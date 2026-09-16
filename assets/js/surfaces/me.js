/* ============================================================
   ME — identity, trajectory, and the attention inbox.

   The profile stays quiet until the crest is opened. The inbox is
   derived from real open work, reminders, notices, due people, and
   assigned tours; it is not another destination or another score.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store, lib, D, insight, aims } = LO;

  let qAt = 0;
  let inboxOpen = false;

  LO.machine.register({
    id: 'me',
    name: 'Me',

    setInbox(open) { inboxOpen = !!open; },
    attentionCount() { return attentionData(store.state).count; },

    render(s) {
      const v = store.vitals();
      const clear = store.daysClear();
      const proven = insight.truths(s);
      const facts = (s.identity.facts || []).slice(0, 4);
      const qs = insight.questions(s);
      const q = qs.length ? qs[qAt % qs.length] : null;
      const name = s.meta.name || 'you';
      const lvl = LO.level.stats();
      const port = insight.portrait(s);
      const attention = attentionData(s);
      const circleDue = attention.people.length;

      return `<div class="me-paper">
        <section class="profile" aria-label="Profile and trajectory">
          <button class="bigcrest inbox-crest" data-inbox aria-expanded="${inboxOpen}" aria-label="${inboxOpen ? 'Close' : 'Open'} inbox${attention.count ? ', ' + attention.count + ' waiting' : ''}">
            ${LO.companion.lumen('profile')}<b>${lvl.level}</b>
            ${attention.count ? `<span class="inbox-badge">${attention.count > 99 ? '99+' : attention.count}</span>` : ''}
          </button>
          <h1 class="pname">${ui.esc(cap(name))}</h1>
          <div class="plvl">Level ${lvl.level} · ${lvl.into} / ${lvl.need}</div>
          <div class="meter profile-meter"><i style="width:${lvl.pct}%"></i></div>

          <div class="profile-trajectory">
            <div class="trajectory-head"><span>Trajectory</span><b>${verdict(v)}</b></div>
            <div class="stats">
              <div class="stat2"><b>${v.index}</b><span>Alignment</span></div>
              <div class="stat2"><b>${clear === null ? '—' : clear}</b><span>Days clear</span></div>
              <div class="stat2"><b>${store.winStreak()}</b><span>Day streak</span></div>
              <div class="stat2"><b>${s.chronicle.length}</b><span>Entries</span></div>
            </div>
            <div class="trajectory-line">${ui.spark(store.indexSeries(30).map(p => p.v), { min: 0, max: 100 })}</div>
          </div>

          <button class="inbox-peek" data-inbox>
            <span><b>Inbox</b><small>${attention.count ? attentionSummary(attention) : 'Nothing needs attention'}</small></span>
            <strong>${attention.count || 'Clear'}</strong>
          </button>
        </section>

        ${inboxOpen ? inboxPanel(s, attention) : ''}

        <div class="lbl">Profile summary<span class="r">earned from the record</span></div>
        <div class="portrait">${port.lines.map(l => `<p>${ui.esc(l)}</p>`).join('')}</div>

        <details class="record-tools">
          <summary>Personal record controls</summary>
          <div class="clearbar">
            ${clear === null ? '<button class="fullbtn hot" data-dayone>Start the clear count</button>' : ''}
            <button class="fullbtn" data-urge>Log an urge</button>
            <button class="fullbtn warn" data-used>Reset the clear count</button>
          </div>
        </details>

        <div class="lbl">Aims<span class="r">measured, not guessed</span></div>
        ${aimList(s)}
        <div class="acts compact-add">
          <input data-goal placeholder="Add an aim">
          <select data-horizon>
            ${lib.horizons.map(h => `<option value="${h.id}"${h.id === 'quarter' ? ' selected' : ''}>${h.label}</option>`).join('')}
          </select>
          <button class="flat" data-addgoal>Add</button>
        </div>

        <div class="lbl">What the record proves<span class="ln"></span></div>
        ${proven.length ? `<div class="proven">${proven.map(t =>
            `<div class="p"><b>${ui.esc(t.claim)}</b><span>${ui.esc(t.evidence)}</span></div>`).join('')}</div>`
          : '<p class="note">Completed work will build this summary from evidence.</p>'}
        ${facts.length ? `<div class="rows profile-facts">${facts.map(f => `
          <div class="row-l">
            <span class="t">${ui.esc(f.a)}<em>${ui.esc(f.q)}</em></span>
            <button class="x" data-delfact="${f.id}" aria-label="Remove answer">×</button>
          </div>`).join('')}</div>` : ''}

        <div class="lbl">Direction<span class="ln"></span></div>
        <div class="ns" contenteditable="true" data-ns spellcheck="false">${
          ui.esc(s.identity.northStar || 'Write what all of this is for.')}</div>
        <div class="rows identity-lines">
          ${s.identity.statements.map(x => `<div class="row-l">
            <span class="t">${ui.esc(x.text)}</span>
            <button class="x" data-delst="${x.id}" aria-label="Remove statement">×</button></div>`).join('')}
          ${s.identity.avoid.map(x => `<div class="row-l">
            <span class="t muted-line">Done with: ${ui.esc(x.text)}</span>
            <button class="x" data-delav="${x.id}" aria-label="Remove statement">×</button></div>`).join('')}
        </div>
        <div class="acts compact-add">
          <input data-st placeholder="I am someone who…">
          <button class="flat" data-addst>Add</button>
        </div>
        <div class="acts compact-add">
          <input data-av placeholder="Done with…">
          <button class="flat" data-addav>Add</button>
        </div>

        <div class="lbl">Circle<span class="r">${circleDue ? circleDue + ' due' : s.people.length + ' kept'}</span></div>
        <button class="section-link" data-friends>
          <span><b>Friends to keep</b><small>Birthdays, plans, and contact rhythm</small></span><strong>Open</strong>
        </button>

        <div class="lbl">One question at a time<span class="r">${(s.identity.facts || []).length} answered</span></div>
        ${q ? `
          <div class="ask">
            <h3>${ui.esc(q.q)}</h3>
            <textarea data-answer rows="3" placeholder="As long or short as you like."></textarea>
            <div class="acts">
              <button class="go" data-saveq="${q.id}">Answer</button>
              <button class="flat" data-nextq>A different one</button>
            </div>
          </div>` : ''}
      </div>`;
    },

    mount(root) {
      const self = LO.machine.get('me');
      const redraw = () => self.refresh();

      if (inboxOpen) setTimeout(() => {
        const box = document.querySelector('.pane[data-pane="me"] .attention-inbox');
        if (box) box.scrollIntoView({ behavior: store.state.settings.reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }, 40);

      root.querySelectorAll('[data-inbox]').forEach(b => {
        b.onclick = () => {
          inboxOpen = !inboxOpen;
          history.replaceState(null, '', inboxOpen ? '#inbox' : '#me');
          redraw();
        };
      });

      const reminderForm = root.querySelector('[data-reminderform]');
      if (reminderForm) reminderForm.onsubmit = e => {
        e.preventDefault();
        const box = reminderForm.querySelector('[data-remindertext]');
        if (!box.value.trim()) return box.focus();
        store.addReminder(box.value.trim(), reminderForm.querySelector('[data-reminderdue]').value);
        ui.toast('Reminder added');
        redraw();
      };

      root.querySelectorAll('[data-inboxtask]').forEach(b => {
        b.onclick = () => {
          const before = LO.level.stats().level;
          const result = store.completeTask(b.dataset.inboxtask);
          if (LO.level.stats().level > before) LO.machine.crestPulse();
          ui.toast(result.bonus ? 'List cleared · +' + (result.points + result.bonus) : '+' + result.points);
          redraw();
        };
      });
      root.querySelectorAll('[data-reminderdone]').forEach(b => {
        b.onclick = () => { store.completeReminder(b.dataset.reminderdone); ui.toast('Reminder cleared'); redraw(); };
      });
      root.querySelectorAll('[data-reminderdelete]').forEach(b => {
        b.onclick = () => { store.removeReminder(b.dataset.reminderdelete); ui.toast('Reminder removed'); redraw(); };
      });
      root.querySelectorAll('[data-dismissnotice]').forEach(b => {
        b.onclick = () => { store.dismissNotice(b.dataset.dismissnotice); redraw(); };
      });
      root.querySelectorAll('[data-goto]').forEach(b => { b.onclick = () => LO.machine.go(b.dataset.goto); });
      root.querySelectorAll('[data-open-circle]').forEach(b => { b.onclick = () => LO.companion.openFriends(); });
      const fh = root.querySelector('[data-fareharbor]');
      if (fh) fh.onclick = () => LO.machine.fareharborSheet();
      const fhSync = root.querySelector('[data-fhsync]');
      if (fhSync) fhSync.onclick = async () => {
        fhSync.disabled = true;
        const r = await LO.fareharbor.sync(true);
        ui.toast(r.ok ? r.count + ' assigned tour' + (r.count === 1 ? '' : 's') : r.error, 4200);
        redraw();
      };

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
      if (dayone) dayone.onclick = () => { store.markClear(); ui.toast('Day one'); redraw(); };
      const urge = root.querySelector('[data-urge]');
      if (urge) urge.onclick = () => LO.machine.quick('urge');
      const used = root.querySelector('[data-used]');
      if (used) used.onclick = () => LO.machine.quick('used');

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
        ui.toast(track.kind === 'manual' ? 'Added — set progress as it moves' : 'Added and measurable');
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
      const friends = root.querySelector('[data-friends]');
      if (friends) friends.onclick = () => LO.companion.openFriends();
    }
  });

  function attentionData(s) {
    const tasks = store.tasks();
    const reminders = ((s.inbox && s.inbox.reminders) || []).filter(r => !r.done);
    const notices = ((s.inbox && s.inbox.notices) || []).filter(n => n.source !== 'fareharbor');
    const people = s.people.filter(p => LO.companion.due(p) <= D.today());
    const tours = LO.fareharbor ? LO.fareharbor.upcoming() : [];
    return { tasks, reminders, notices, people, tours, count: tasks.length + reminders.length + notices.length + people.length + tours.length };
  }

  function attentionSummary(a) {
    const bits = [];
    if (a.tasks.length) bits.push(a.tasks.length + ' task' + (a.tasks.length === 1 ? '' : 's'));
    if (a.reminders.length) bits.push(a.reminders.length + ' reminder' + (a.reminders.length === 1 ? '' : 's'));
    if (a.tours.length) bits.push(a.tours.length + ' tour' + (a.tours.length === 1 ? '' : 's'));
    if (a.people.length) bits.push(a.people.length + ' check-in' + (a.people.length === 1 ? '' : 's'));
    if (a.notices.length) bits.push(a.notices.length + ' update' + (a.notices.length === 1 ? '' : 's'));
    return bits.slice(0, 3).join(' · ');
  }

  function inboxPanel(s, a) {
    const fh = LO.fareharbor.cfg();
    return `<section class="attention-inbox" aria-label="Inbox">
      <header class="inbox-head">
        <div><span class="paper-kicker">Attention</span><h2>Inbox</h2></div>
        <span>${a.count ? a.count + ' waiting' : 'clear'}</span>
      </header>

      <form class="reminder-capture" data-reminderform>
        <input data-remindertext maxlength="140" placeholder="Add a reminder">
        <input data-reminderdue type="date" aria-label="Reminder date">
        <button type="submit" aria-label="Add reminder">+</button>
      </form>

      ${a.tours.length ? inboxGroup('Tours', a.tours.map(t => `
        <div class="inbox-row tour-row">
          <span class="attention-mark tour-mark">FH</span>
          <span class="inbox-copy"><b>${ui.esc(t.title)}</b><small>${ui.esc(formatTour(t))}</small></span>
          ${t.url ? `<a class="row-action" href="${ui.esc(t.url)}" target="_blank" rel="noopener noreferrer">Open</a>` : `<span class="row-status">${ui.esc(t.status)}</span>`}
        </div>`).join('')) : ''}

      ${a.tasks.length ? inboxGroup('Open work', a.tasks.map(t => `
        <div class="inbox-row">
          <button class="attention-check" data-inboxtask="${t.id}" aria-label="Complete ${ui.esc(t.title)}"></button>
          <span class="inbox-copy"><b>${ui.esc(t.title)}</b><small>${t.origin === 'do' ? 'Today\'s list' : 'Open task'} · ${LO.level.tier(+t.effort || +t.weight || 2).name} effort</small></span>
          <button class="row-action" data-goto="do">Do</button>
        </div>`).join('')) : ''}

      ${a.reminders.length ? inboxGroup('Reminders', a.reminders.map(r => `
        <div class="inbox-row${r.due && r.due < D.today() ? ' overdue' : ''}">
          <button class="attention-check" data-reminderdone="${r.id}" aria-label="Clear ${ui.esc(r.text)}"></button>
          <span class="inbox-copy"><b>${ui.esc(r.text)}</b><small>${r.due ? dueLabel(r.due) : 'No date'}</small></span>
          <button class="row-delete" data-reminderdelete="${r.id}" aria-label="Delete reminder">×</button>
        </div>`).join('')) : ''}

      ${a.people.length ? inboxGroup('Circle', a.people.map(p => `
        <div class="inbox-row">
          <span class="attention-mark">♡</span>
          <span class="inbox-copy"><b>${ui.esc(p.name)}</b><small>${p.lastContact ? store.daysSince(p) + ' days since contact' : 'No contact logged yet'}</small></span>
          <button class="row-action" data-open-circle>Open</button>
        </div>`).join('')) : ''}

      ${a.notices.length ? inboxGroup('Updates', a.notices.map(n => `
        <div class="inbox-row">
          <span class="attention-mark">•</span>
          <span class="inbox-copy"><b>${ui.esc(n.title)}</b><small>${ui.esc(n.body)}</small></span>
          <button class="row-delete" data-dismissnotice="${n.id}" aria-label="Dismiss update">×</button>
        </div>`).join('')) : ''}

      ${a.count ? '' : '<div class="inbox-empty"><b>Nothing waiting.</b><span>The inbox fills from real work and real events.</span></div>'}

      <div class="integration-row">
        <span class="integration-logo">FH</span>
        <span><b>FareHarbor</b><small>${LO.fareharbor.configured() ? (fh.lastError ? fh.lastError : fh.lastSync ? 'Synced ' + relativeSync(fh.lastSync) : 'Ready to sync') : 'Connect assigned tours'}</small></span>
        ${LO.fareharbor.configured() ? '<button class="row-action" data-fhsync>Refresh</button>' : ''}
        <button class="row-action" data-fareharbor>${LO.fareharbor.configured() ? 'Manage' : 'Connect'}</button>
      </div>
    </section>`;
  }

  function inboxGroup(title, body) {
    return `<div class="inbox-group"><h3>${title}</h3>${body}</div>`;
  }

  function formatTour(t) {
    if (!t.start || Number.isNaN(Date.parse(t.start))) return t.assignedTo || t.status;
    return new Date(t.start).toLocaleString([], {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }) + (t.assignedTo ? ' · ' + t.assignedTo : '');
  }

  function dueLabel(date) {
    const days = D.daysBetween(D.today(), date);
    if (days < 0) return Math.abs(days) + ' day' + (days === -1 ? '' : 's') + ' overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return D.pretty(date);
  }

  function relativeSync(iso) {
    const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
    return mins < 1 ? 'just now' : mins < 60 ? mins + 'm ago' : Math.round(mins / 60) + 'h ago';
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function verdict(v) {
    if (!v.signal) return 'no signal yet';
    return v.index >= 80 ? 'compounding' : v.index >= 60 ? 'holding'
      : v.index >= 35 ? 'drifting' : 'cold';
  }

  function aimList(s) {
    const live = s.goals.filter(g => g.status !== 'parked');
    if (!live.length) return '<p class="note">No aims set.</p>';

    return live.map(g => {
      const p = aims.progress(g, s);
      return `<div class="aim">
        <div class="aim-top">
          <span class="aim-t">${p.pct >= 100 ? '✓ ' : ''}${ui.esc(g.title)}</span>
          <span class="aim-pct">${p.pct}%</span>
          <button class="x" data-delgoal="${g.id}" aria-label="Remove aim">×</button>
        </div>
        <div class="meter"><i style="width:${p.pct}%"></i></div>
        <div class="aim-m">${ui.esc(p.label)}${p.auto ? '' : ' · manual'}</div>
        ${p.auto ? '' : `<input type="range" min="0" max="100" step="5" value="${+g.progress || 0}" data-manual="${g.id}">`}
      </div>`;
    }).join('');
  }
})(window.LO);
