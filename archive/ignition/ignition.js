/* ============================================================
   IGNITION — the phone app.
   Same four tabs as the desk: Do, Write, Advice, Me. Same store,
   same engines, same words. What differs here is the size of the
   tap targets and the fact that Do deals you exactly one thing.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  const store = LO.store, D = LO.D, ui = LO.ui;
  const esc = s => LO.ui.esc(s);

  const TABS = [
    { id: 'do',     glyph: '◆', label: 'Do' },
    { id: 'write',  glyph: '✎', label: 'Write' },
    { id: 'advice', glyph: '◇', label: 'Advice' },
    { id: 'me',     glyph: '◉', label: 'Me' }
  ];

  const FILTERS = [
    { id: 'mine',     label: 'Mine',       types: ['task', 'chore', 'activity', 'plan', 'feeling', 'thought', 'entry', 'note'] },
    { id: 'task',     label: 'Tasks',      types: ['task', 'done'] },
    { id: 'chore',    label: 'Chores',     types: ['chore'] },
    { id: 'activity', label: 'Activities', types: ['activity'] },
    { id: 'plan',     label: 'Plans',      types: ['plan'] },
    { id: 'feeling',  label: 'Feelings',   types: ['feeling', 'state'] },
    { id: 'thought',  label: 'Thoughts',   types: ['thought', 'entry', 'note'] },
    { id: 'all',      label: 'All',        types: null }
  ];

  const CADENCE = [
    { id: 7, label: 'Weekly' }, { id: 14, label: 'Fortnightly' },
    { id: 30, label: 'Monthly' }, { id: 90, label: 'Quarterly' }
  ];

  const PRAISE = ["That's one.", 'Done.', 'On the board.', 'Started and finished.'];
  const STOP = [
    'One is a full day by the rules you set.',
    'Nothing else is owed. Close the app.',
    'That was the hard part. The rest of today is yours.'
  ];
  const CLOSE_LINES = ['Closed. That attention comes back to you.', 'Off the list.', 'Done.'];

  const app = {
    tab: 'do',
    action: null,
    won: null,
    timer: { id: null, endAt: 0, total: 0, action: null },
    kind: 'thought',
    auto: true,
    why: '',
    filter: 'mine',
    shown: 8,
    openSit: null,
    drill: null,
    drillDone: false,
    qAt: 0,
    newCadence: 14,

    /* ---------------- boot ---------------- */
    async boot() {
      await store.load();
      const fresh = store.seed();
      ui.startField(document.getElementById('field'));
      this.deal();
      this.render();
      this.bindChrome();
      setTimeout(() => document.getElementById('veil').classList.add('gone'), 420);
      if (fresh) ui.toast('Set up from what you told me', 3000);
    },

    bindChrome() {
      document.getElementById('tabs').onclick = e => {
        const b = e.target.closest('.tab');
        if (b) this.go(b.dataset.tab);
      };
      document.getElementById('gear').onclick = () => this.sheet('settings');
      document.getElementById('sheet').onclick = e => {
        if (e.target.id === 'sheet') this.closeSheet();
      };
    },

    go(tab) { this.tab = tab; this.render(); },

    paintTabs() {
      const open = store.tasks().length;
      document.getElementById('tabs').innerHTML = TABS.map(t => `
        <button class="tab ${t.id === this.tab ? 'on' : ''}" data-tab="${t.id}">
          <i>${t.glyph}</i><b>${t.label}</b>
          ${t.id === 'do' && open ? `<span class="badge">${open}</span>` : ''}
        </button>`).join('');
    },

    render() {
      const s = store.state;
      this.renderTop(s);
      document.querySelectorAll('.screen').forEach(el =>
        el.classList.toggle('on', el.dataset.screen === this.tab));
      const host = document.querySelector(`.screen[data-screen="${this.tab}"]`);
      host.innerHTML = ({
        do: () => this.viewDo(s),
        write: () => this.viewWrite(s),
        advice: () => this.viewAdvice(s),
        me: () => this.viewMe(s)
      })[this.tab]();
      this.bind(host);
      host.scrollTop = 0;
      this.paintTabs();
    },

    renderTop(s) {
      const streak = store.winStreak();
      document.getElementById('who').innerHTML = `
        <b>${streak ? 'Day ' + streak + ' of starting' : 'Start the count'}</b>
        <span>${esc(s.identity.northStar || 'Tap the gear to set your north star')}</span>`;
    },

    eyebrow(right) {
      return `<div class="eyebrow"><span>${LO.actions.slot()}</span><span class="sp"></span>
        <span>${right}</span></div>`;
    },

    /* ---------------- DO ---------------- */
    viewDo(s) {
      const wins = store.winsOn();

      if (this.won) {
        return `
          ${this.eyebrow('today <b>' + wins.length + '</b>')}
          <div class="won">
            <div class="tick">✓</div>
            <h1>${esc(this.won.praise)}</h1>
            <div class="did">${esc(this.won.label)}</div>
            <div class="stop">${esc(this.won.stop)}</div>
            <div class="alt" style="margin-top:18px">
              <button class="gold" data-act="again">One more</button>
              <button class="quiet" data-act="close">Done for now</button>
            </div>
          </div>
          ${this.winsHtml(wins)}`;
      }

      const a = this.action;
      const tasks = store.tasks();
      const t = D.today();

      return `
        ${this.eyebrow('today <b>' + wins.length + '</b>')}
        <div class="act">
          <div class="kind">${esc(a.kind)}</div>
          <h1>${esc(a.label)}</h1>
          <p>${esc(a.sub || '')}</p>
          ${a.minutes ? `<div class="mins"><i></i>${a.minutes} MINUTE${a.minutes === 1 ? '' : 'S'}</div>` : ''}
          ${a.id === 'nothing' ? '' : `
            <button class="go" data-act="start">${a.tab || a.sheet ? 'Open it' : 'Start'}</button>
            <div class="alt">
              <button data-act="skip">Not this</button>
              <button data-act="did">Already did it</button>
            </div>`}
        </div>
        <div class="sos">
          <button class="spin" data-act="spin"><b>I'm spinning</b><span>rumination</span></button>
          <button class="urge" data-act="urge"><b>I want to smoke</b><span>ride it out</span></button>
        </div>
        ${this.winsHtml(wins)}

        <h4 class="sec">Your tasks${tasks.length ? ' · ' + tasks.length : ''}</h4>
        ${tasks.length ? tasks.map(l => `
          <div class="row-item">
            <button class="strike" data-close="${l.id}">○</button>
            <div class="meat"><b>${esc(l.title)}</b><span>written ${D.pretty(l.created)}</span></div>
            <button class="kill" data-killtask="${l.id}">×</button>
          </div>`).join('')
        : `<div class="empty">Nothing open. Write tasks on the Write tab and they land here.</div>`}

        ${s.habits.length ? `<h4 class="sec">Habits · ${
          s.habits.filter(h => h.log && h.log[t]).length}/${s.habits.length}</h4>
          ${s.habits.map(h => {
            const on = !!(h.log && h.log[t]);
            const k = store.streakOf(h);
            return `<div class="row-item">
              <button class="strike ${on ? 'hit' : ''}" data-habit="${h.id}">${on ? '✓' : '○'}</button>
              <div class="meat"><b>${esc(h.name)}</b>${k ? `<span>${k} day streak</span>` : ''}</div>
            </div>`;
          }).join('')}` : ''}`;
    },

    winsHtml(wins) {
      if (!wins.length) return '';
      return `<h4 class="sec">Done today</h4><div class="wins">${wins.map(w =>
        `<span class="w"><i></i>${esc(w.label)}</span>`).join('')}</div>`;
    },

    /* ---------------- WRITE ---------------- */
    viewWrite(s) {
      const mine = s.chronicle.filter(e => FILTERS[0].types.includes(e.type)).length;

      return `
        ${this.eyebrow(mine + ' written')}
        <textarea id="writebox" rows="5" placeholder="A task, a chore, something you did, a plan, how you feel, or just a thought."></textarea>
        <div data-guess>${this.guessRow()}</div>
        ${this.kind === 'feeling' ? this.feelBox() : ''}
        <button class="go" data-act="save" style="margin-top:14px">Save</button>

        <h4 class="sec">Your record</h4>
        <div class="chips2">
          ${FILTERS.map(f => `<button class="kpill sm ${f.id === this.filter ? 'on' : ''}" data-filter="${f.id}">${f.label}</button>`).join('')}
        </div>
        ${this.stream(s)}`;
    },

    guessRow() {
      const k = LO.classify.kind(this.kind);
      return `
        <div class="kinds" style="margin-top:12px">
          ${LO.classify.KINDS.map(x =>
            `<button class="kpill sm ${x.id === this.kind ? 'on' : ''}" data-kind="${x.id}">${x.label}</button>`).join('')}
        </div>
        <div class="quiet" style="margin:8px 0 0">${
          this.auto && this.why
            ? 'Looks like ' + art(k.label) + ' <b style="color:var(--accent)">' + k.label.toLowerCase() + '</b> — ' + esc(this.why) + '.'
            : this.auto ? 'Write it and I will work out what it is.'
            : 'Filed as <b style="color:var(--accent)">' + k.label.toLowerCase() + '</b>. Noted for next time.'}</div>`;
    },

    feelBox() {
      return `<div class="feelbox" data-feel>
        ${ui.field('mood', 'Mood', { type: 'range', min: 1, max: 10, value: 6 })}
        ${ui.field('energy', 'Energy', { type: 'range', min: 1, max: 10, value: 6 })}
        ${ui.field('clarity', 'Clarity', { type: 'range', min: 1, max: 10, value: 5 })}
        ${ui.field('stress', 'Stress', { type: 'range', min: 1, max: 10, value: 5 })}
      </div>`;
    },

    stream(s) {
      const f = FILTERS.find(x => x.id === this.filter);
      let evs = s.chronicle;
      if (f && f.types) evs = evs.filter(e => f.types.includes(e.type));
      if (!evs.length) return `<div class="empty">Nothing here yet. Write one line above.</div>`;

      const byDay = new Map();
      for (const e of evs) {
        if (!byDay.has(e.date)) byDay.set(e.date, []);
        byDay.get(e.date).push(e);
      }
      const days = [...byDay.keys()].sort().reverse();
      for (const d of days) byDay.get(d).sort((a, b) => (b.ts || 0) - (a.ts || 0));
      const WRITTEN = ['task', 'feeling', 'plan', 'thought', 'entry', 'note'];

      return days.slice(0, this.shown).map(d => {
        const ago = D.daysBetween(d, D.today());
        return `<div class="dayblock">
          <div class="dayhead">${ago === 0 ? 'Today' : ago === 1 ? 'Yesterday' : D.label(d) + ' ' + D.pretty(d)}</div>
          ${byDay.get(d).map(e => `
            <div class="entry ${WRITTEN.includes(e.type) ? '' : 'thin'}">
              <div class="emeta"><span class="k">${LABELS[e.type] || e.type}</span><span class="tm">${time(e.ts)}</span></div>
              <div class="ebody">${esc(e.text)}</div>
            </div>`).join('')}
        </div>`;
      }).join('') +
      (days.length > this.shown ? `<button class="fullbtn" data-act="more">Show more</button>` : '');
    },

    /* ---------------- ADVICE ---------------- */
    viewAdvice(s) {
      const tip = LO.advice.today(s);
      const noticed = LO.insight.messages(s).filter(m => m.tone !== 'quiet').slice(0, 3);
      const sit = this.openSit ? LO.advice.situation(this.openSit) : null;
      if (!this.drill) this.drill = dealDrill(s);

      if (sit) {
        return `
          ${this.eyebrow('protocol')}
          <div class="proto">
            <h1>${esc(sit.label)}</h1>
            <div class="what">${esc(sit.what)}</div>
            <ol>${sit.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
            <div class="after">${esc(sit.after)}</div>
            <button class="go" data-act="didit" style="margin-top:18px">I did this</button>
            <div class="alt">
              ${sit.id === 'urge' ? `<button data-act="urge">Ride it out</button>` : ''}
              <button data-act="backsit">Back</button>
            </div>
          </div>`;
      }

      return `
        ${this.eyebrow('today')}
        ${tip ? `<div class="adv">
          <h2>${esc(tip.title)}</h2>
          <p>${esc(tip.body)}</p>
        </div>` : ''}

        ${noticed.length ? `<h4 class="sec">What I noticed</h4>
          ${noticed.map(m => `<div class="row-item"><div class="meat"><b>${esc(m.text)}</b></div></div>`).join('')}` : ''}

        <h4 class="sec">Right now I feel</h4>
        <div class="sits">
          ${LO.advice.SITUATIONS.map(x =>
            `<button class="sit" data-sit="${x.id}"><i>${x.icon}</i>${esc(x.label)}</button>`).join('')}
        </div>

        <h4 class="sec">Practice · ${s.rewire.reps.length} done</h4>
        <div class="practice">
          <div class="kind-line">${esc(this.drill.kind)} · ${esc(traitLabel(this.drill.trait))}</div>
          <b>${esc(this.drill.title)}</b>
          <p>${esc(this.drill.situation)}</p>
          <div class="askline">${esc(this.drill.ask)}</div>
          ${this.drillDone
            ? `<div class="reinforce">${esc(this.drill.reinforce)}</div>
               <button class="fullbtn" data-act="newdrill" style="margin-top:12px">Another</button>`
            : `<textarea data-drill rows="4" placeholder="Write the answer."></textarea>
               <button class="go" data-act="commit" style="margin-top:12px">Save it</button>
               <button class="fullbtn" data-act="newdrill" style="margin-top:9px">Another</button>`}
        </div>`;
    },

    /* ---------------- ME ---------------- */
    viewMe(s) {
      const v = store.vitals();
      const clear = store.daysClear();
      const c = s.clarity;
      const recent = x => D.daysBetween(x.date, D.today()) < 14;
      const rode = c.urges.filter(u => recent(u) && u.rode).length;
      const used = c.uses.filter(recent).length;
      const proven = LO.insight.truths(s);
      const qs = LO.insight.questions(s);
      const q = qs.length ? qs[this.qAt % qs.length] : null;
      const clearHabit = s.habits.find(h => h.name === 'Clear day');
      const markedToday = clearHabit && clearHabit.log && clearHabit.log[D.today()];
      const aims = s.goals.filter(g => g.status !== 'parked');

      return `
        ${this.eyebrow('day ' + (D.daysBetween(s.meta.created, D.today()) + 1))}
        <div class="mehead">
          <h1>${esc(cap(s.meta.name || 'You'))}</h1>
          <div class="ns">${esc(s.identity.northStar || 'Tap the gear to write what this is all for.')}</div>
        </div>

        <div class="statrow">
          <div><b>${v.index}</b><span>Alignment</span></div>
          ${clear !== null ? `<div><b>${clear}</b><span>Days clear</span></div>` : ''}
          <div><b>${store.winStreak()}</b><span>Streak</span></div>
          <div><b>${s.chronicle.length}</b><span>Entries</span></div>
        </div>

        <h4 class="sec">Clear</h4>
        ${clear === null
          ? `<button class="fullbtn hot" data-act="dayone">Today is day one</button>`
          : `<button class="fullbtn ${markedToday ? '' : 'hot'}" data-act="markclear">
               ${markedToday ? 'Today already marked clear' : 'Mark today clear'}</button>`}
        <button class="fullbtn" data-act="urge">An urge just hit</button>
        <button class="fullbtn warn" data-act="used">I smoked — reset the count</button>
        ${clear !== null || rode || used ? `<div class="quiet">
          ${rode} urge${rode === 1 ? '' : 's'} ridden out in the last fortnight${used ? ', ' + used + ' used' : ''}.
          Best run ${c.best || 0} days. A use resets the count and nothing else.</div>` : ''}

        <h4 class="sec">What is true</h4>
        ${proven.length ? proven.map(t => `
          <div class="row-item"><div class="meat"><b>${esc(t.claim)}</b><span>${esc(t.evidence)}</span></div></div>`).join('')
        : `<div class="empty">Nothing proven yet. Do one thing and the first line appears here.</div>`}

        ${q ? `<h4 class="sec">One question</h4>
          <div class="askbox">
            <b>${esc(q.q)}</b>
            <textarea data-answer rows="3" placeholder="As long or short as you like."></textarea>
            <button class="go" data-saveq="${q.id}" style="margin-top:12px">Answer</button>
            <button class="fullbtn" data-act="nextq" style="margin-top:9px">Different question</button>
          </div>` : ''}

        <h4 class="sec">People${s.people.length ? ' · ' + s.people.length : ''}</h4>
        ${s.people.length ? [...s.people].sort((a, b) =>
            (store.daysSince(b) - (b.cadence || 21)) - (store.daysSince(a) - (a.cadence || 21)))
          .map(p => {
            const d = store.daysSince(p);
            const late = d > (p.cadence || 21);
            return `<div class="row-item ${late ? 'overdue' : ''}">
              <button class="strike ${late ? '' : 'hit'}" data-touch="${p.id}">${late ? '!' : '✓'}</button>
              <div class="meat"><b>${esc(p.name)}</b>
                <span>${p.lastContact ? d + ' days ago' : 'never logged'} · every ${p.cadence} days</span></div>
              <button class="kill" data-killperson="${p.id}">×</button>
            </div>`;
          }).join('')
        : `<div class="empty">Add the people you do not want to lose touch with.</div>`}
        <div class="capture">
          <input data-person placeholder="Name" autocomplete="off" enterkeyhint="done">
          <button data-act="addperson">+</button>
        </div>
        <div class="seg" data-seg="cadence" style="margin-bottom:18px">
          ${CADENCE.map(x => `<button type="button" data-val="${x.id}" class="${x.id === this.newCadence ? 'on' : ''}">${x.label}</button>`).join('')}
        </div>

        <h4 class="sec">Aims</h4>
        ${aims.length ? aims.map(g => `
          <div class="row-item"><div class="meat"><b>${g.status === 'done' ? '✓ ' : ''}${esc(g.title)}</b>
            <span>${horizonLabel(g.horizon)} · ${+g.progress || 0}%</span></div></div>`).join('')
        : `<div class="empty">Nothing set. Add aims on the desk version.</div>`}`;
    },

    /* ---------------- events ---------------- */
    bind(host) {
      const self = this;
      const redraw = () => self.render();

      host.querySelectorAll('[data-seg] button').forEach(b => {
        b.onclick = () => {
          const seg = b.closest('[data-seg]');
          seg.querySelectorAll('button').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
          if (seg.dataset.seg === 'cadence') self.newCadence = +b.dataset.val;
        };
      });

      const acts = {
        /* --- Do --- */
        start: () => {
          const a = self.action;
          if (a.tab) return self.go(a.tab === 'loops' ? 'write' : a.tab === 'clear' ? 'me' : a.tab);
          if (a.sheet) return self.go('write');
          self.focus(a);
        },
        skip: () => { self.deal(self.action && self.action.id); redraw(); },
        did: () => self.bank(self.action),
        again: () => { self.won = null; self.deal(); redraw(); },
        close: () => { self.won = null; self.deal(); redraw(); },
        spin: () => { self.openSit = 'spinning'; self.go('advice'); },
        urge: () => self.sheet('urge'),

        /* --- Write --- */
        save: () => {
          const box = host.querySelector('#writebox');
          const text = box.value.trim();
          if (text.length < 2) return box.focus();
          store.write(self.kind, text);
          if (self.kind === 'feeling') {
            const fb = host.querySelector('[data-feel]');
            if (fb) {
              const d = ui.read(fb);
              store.setLog('mind.logs', {
                mood: +d.mood, energy: +d.energy, clarity: +d.clarity, stress: +d.stress,
                grateful: '', note: text
              });
            }
          }
          store.win('write', WROTE[self.kind] || 'Wrote something down', 0, 'write_' + self.kind);
          ui.toast(LO.classify.kind(self.kind).actionable ? 'Added to Do' : 'Saved');
          self.kind = 'thought'; self.auto = true; self.why = '';
          redraw();
        },
        more: () => { self.shown += 10; redraw(); },

        /* --- Advice --- */
        backsit: () => { self.openSit = null; redraw(); },
        didit: () => {
          const sit = LO.advice.situation(self.openSit);
          store.log('advice', 'Used the protocol for "' + sit.label + '"', { sit: self.openSit });
          store.win('advice', sit.label, 0, 'sit_' + self.openSit);
          ui.toast('Logged');
          self.openSit = null;
          redraw();
        },
        commit: () => {
          const box = host.querySelector('[data-drill]');
          const text = box.value.trim();
          if (text.length < 12) { ui.toast('Write a bit more'); return box.focus(); }
          store.add('rewire.reps', { date: D.today(), drillId: self.drill.id, trait: self.drill.trait, response: text });
          store.win('practice', self.drill.title, 0, 'drill_' + self.drill.id);
          self.drillDone = true;
          ui.toast('Saved');
          redraw();
        },
        newdrill: () => { self.drill = dealDrill(store.state, self.drill && self.drill.id); self.drillDone = false; redraw(); },

        /* --- Me --- */
        dayone: () => { store.markClear(); ui.toast('Day one. The number exists now.'); redraw(); },
        markclear: () => {
          const h = store.state.habits.find(x => x.name === 'Clear day');
          if (h && !(h.log && h.log[D.today()])) {
            store.toggleHabit(h.id);
            store.win('clarity', 'Marked today clear', 1, 'clear_mark');
            ui.toast('Clear day logged');
          }
          redraw();
        },
        used: () => self.sheet('used'),
        nextq: () => { self.qAt++; redraw(); },
        addperson: () => {
          const i = host.querySelector('[data-person]');
          const v = i.value.trim();
          if (!v) return i.focus();
          store.add('people', { name: v, cadence: self.newCadence, lastContact: '', note: '', created: D.today() });
          ui.toast(v + ' is on the list');
          redraw();
        }
      };
      host.querySelectorAll('[data-act]').forEach(b => { b.onclick = () => acts[b.dataset.act](); });

      const bindPills = () => {
        host.querySelectorAll('[data-kind]').forEach(b => {
          b.onclick = () => {
            const wrong = self.kind;
            self.kind = b.dataset.kind;
            self.auto = false;
            self.why = '';
            const bx = host.querySelector('#writebox');
            if (wrong !== self.kind && bx) {
              LO.classify.learn(bx.value, self.kind, wrong, store.state);
              store.save();
            }
            paintGuess();
            if (bx) bx.focus();
          };
        });
      };
      const paintGuess = () => {
        const g = host.querySelector('[data-guess]');
        if (!g) return;
        g.innerHTML = self.guessRow();
        bindPills();
        const has = !!host.querySelector('[data-feel]');
        if (self.kind === 'feeling' && !has) g.insertAdjacentHTML('afterend', self.feelBox());
        if (self.kind !== 'feeling' && has) host.querySelector('[data-feel]').remove();
      };
      bindPills();

      const wb = host.querySelector('#writebox');
      if (wb) {
        let tg;
        wb.oninput = () => {
          clearTimeout(tg);
          tg = setTimeout(() => {
            if (!self.auto) return;
            const g = LO.classify.guess(wb.value, store.state);
            if (g.kind !== self.kind || g.why !== self.why) {
              self.kind = g.kind; self.why = g.why;
              paintGuess();
            }
          }, 220);
        };
      }
      host.querySelectorAll('[data-filter]').forEach(b => {
        b.onclick = () => { self.filter = b.dataset.filter; self.shown = 8; redraw(); };
      });
      host.querySelectorAll('[data-sit]').forEach(b => {
        b.onclick = () => { self.openSit = b.dataset.sit; redraw(); };
      });

      const box = host.querySelector('#writebox');
      if (box) box.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) acts.save(); };
      const person = host.querySelector('[data-person]');
      if (person) person.onkeydown = e => { if (e.key === 'Enter') acts.addperson(); };

      const sq = host.querySelector('[data-saveq]');
      if (sq) sq.onclick = () => {
        const a = host.querySelector('[data-answer]').value.trim();
        if (a.length < 2) return;
        const q = LO.insight.BANK.find(x => x.id === sq.dataset.saveq);
        store.state.identity.facts.unshift({ id: store.id('fact'), qid: q.id, q: q.q, a, date: D.today() });
        if (q.id === 'name') store.state.meta.name = a.split(/[\s,]/)[0];
        store.log('insight', a, { q: q.q });
        store.save();
        ui.toast('Kept');
        redraw();
      };

      host.querySelectorAll('[data-close]').forEach(b => {
        b.onclick = () => {
          b.classList.add('hit'); b.textContent = '✓';
          buzz(18);
          const task = store.tasks().find(x => x.id === b.dataset.close);
          store.closeTask(b.dataset.close);
          store.win('task', task ? task.title : 'A task', 0, 'task_' + b.dataset.close);
          ui.toast(CLOSE_LINES[Math.floor(Math.random() * CLOSE_LINES.length)]);
          setTimeout(redraw, 340);
        };
      });
      host.querySelectorAll('[data-habit]').forEach(b => {
        b.onclick = () => { buzz(14); store.toggleHabit(b.dataset.habit); redraw(); };
      });
      host.querySelectorAll('[data-touch]').forEach(b => {
        b.onclick = () => {
          b.classList.add('hit'); b.textContent = '✓';
          buzz(18);
          const p = store.state.people.find(x => x.id === b.dataset.touch);
          store.contacted(b.dataset.touch);
          store.win('bonds', 'Reached ' + p.name, 0, 'manual_touch');
          ui.toast('Logged');
          setTimeout(redraw, 340);
        };
      });
      host.querySelectorAll('[data-killtask]').forEach(b => {
        b.onclick = () => { store.drop('mind.load', b.dataset.killtask); redraw(); };
      });
      host.querySelectorAll('[data-killperson]').forEach(b => {
        b.onclick = () => { store.drop('people', b.dataset.killperson); redraw(); };
      });
    },

    /* ---------------- the action loop ---------------- */
    deal(avoid) {
      this.action = LO.actions.pick(store.state, avoid);
      this.won = null;
    },

    bank(a) {
      if (a.done) a.done();
      store.win(a.winKind || 'step', a.label, a.minutes || 0, a.id);
      this.won = {
        praise: PRAISE[Math.floor(Math.random() * PRAISE.length)],
        label: a.label,
        stop: STOP[Math.floor(Math.random() * STOP.length)]
      };
      this.timer.action = null;
      buzz([20, 40, 20]);
      this.tab = 'do';
      this.render();
    },

    /** full-screen countdown. The timer running out is the win. */
    focus(a) {
      const el = document.getElementById('focus');
      const total = Math.max(1, a.minutes || 1) * 60;
      this.timer.action = a;
      this.timer.total = total;
      this.timer.endAt = Date.now() + total * 1000;

      const R = 112, C = 2 * Math.PI * R;
      el.innerHTML = `
        <div class="inner">
          <div class="clock">
            <div class="ring-pulse"></div>
            <svg viewBox="0 0 236 236">
              <circle class="bg" cx="118" cy="118" r="${R}"/>
              <circle class="fg" cx="118" cy="118" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="0" data-arc/>
            </svg>
            <div class="read"><b data-clock>${fmt(total)}</b><span>remaining</span></div>
          </div>
          <h2>${esc(a.label)}</h2>
          <p class="hint">${esc(a.hint || 'Put the phone down. When this runs out, it counted.')}</p>
          <button class="go" data-done>Done</button>
          <div class="alt"><button data-stop>Stop</button></div>
        </div>`;
      el.hidden = false;
      buzz(24);

      const arc = el.querySelector('[data-arc]');
      const clock = el.querySelector('[data-clock]');
      const tick = () => {
        const left = Math.max(0, Math.round((this.timer.endAt - Date.now()) / 1000));
        clock.textContent = fmt(left);
        arc.setAttribute('stroke-dashoffset', String(C * (1 - left / total)));
        if (left <= 0) { this.stopTimer(); buzz([40, 60, 40]); this.finish(true); }
      };
      tick();
      this.timer.id = setInterval(tick, 1000);

      el.querySelector('[data-done]').onclick = () => { this.stopTimer(); this.finish(true); };
      el.querySelector('[data-stop]').onclick = () => {
        this.stopTimer();
        el.hidden = true;
        ui.toast('Stopped. It is still there when you want it.');
      };
    },

    stopTimer() {
      if (this.timer.id) clearInterval(this.timer.id);
      this.timer.id = null;
    },

    finish(bankIt) {
      document.getElementById('focus').hidden = true;
      const a = this.timer.action || this.action;
      if (bankIt) this.bank(a); else this.render();
    },

    /* ---------------- sheets ---------------- */
    sheet(kind) {
      const el = document.getElementById('sheet');
      const s = store.state;
      const body = {

        settings: () => `
          <h2>Settings</h2>
          <p class="lede">Everything is stored on this phone. Nothing leaves unless you send it.</p>
          <label class="fld"><span>Your name</span>
            <input data-name value="${esc(s.meta.name)}" placeholder="Your name"></label>
          <label class="fld"><span>North star</span>
            <textarea data-ns rows="4">${esc(s.identity.northStar)}</textarea></label>
          <button class="fullbtn hot" data-s="save">Save</button>
          <h4 class="sec">Data</h4>
          ${window.LO_STANDALONE ? `
            <button class="fullbtn" data-s="copyout">Copy my data out</button>
            <button class="fullbtn" data-s="pastein">Paste data in</button>
            <textarea data-json rows="4" placeholder="Your data appears here to copy, or paste a backup in and hit Restore." style="margin-bottom:9px"></textarea>
            <button class="fullbtn" data-s="restore">Restore from the box</button>
          ` : `
            <button class="fullbtn" data-s="export">Export JSON</button>
            <button class="fullbtn" data-s="import">Import JSON</button>
            <input type="file" accept="application/json" data-file hidden>
          `}
          <button class="fullbtn warn" data-s="wipe">Wipe everything</button>
          <h4 class="sec">The full system</h4>
          ${window.LO_STANDALONE
            ? `<div class="quiet">This is the standalone phone build. The desk version runs the same four tabs
                 on a bigger screen. Move data between them with the buttons above.</div>`
            : `<button class="fullbtn" data-s="desk">Open the desk version</button>`}
          <div class="kv" style="margin-top:14px"><span>Entries</span><b>${s.chronicle.length}</b></div>
          <div class="kv"><span>Start streak</span><b>${store.winStreak()}d</b></div>
          <div class="kv"><span>Since</span><b>${D.pretty(s.meta.created)}</b></div>`,

        urge: () => `
          <h2>Ride it out</h2>
          <p class="lede">Ten minutes. The wave peaks and drops on its own. You only have to outlast it.</p>
          ${ui.field('intensity', 'How strong', { type: 'range', min: 1, max: 10, value: 6 })}
          <button class="fullbtn hot" data-s="surf">Start ten minutes</button>
          <button class="fullbtn" data-s="logurge">Just log it, no timer</button>
          <div class="quiet">Get out of the room, drink water, move. Do not argue with it in your head.
            Change what your body is doing instead.</div>`,

        used: () => `
          <h2>Log it and move on</h2>
          <p class="lede">The day count restarts. Your best run stays. That is the whole consequence.</p>
          ${ui.field('note', 'What was going on', { ph: 'Optional' })}
          <button class="fullbtn warn" data-s="saveused">Log it</button>
          <button class="fullbtn" data-s="cancel">Cancel</button>`
      }[kind]();

      el.querySelector('.body').innerHTML =
        `<button class="grab" data-sclose aria-label="Close"></button>` + body;
      el.hidden = false;
      this.bindSheet(el);
    },

    closeSheet() { document.getElementById('sheet').hidden = true; },

    bindSheet(el) {
      const self = this;
      const root = el.querySelector('.body');
      const file = root.querySelector('[data-file]');

      const acts = {
        cancel: () => self.closeSheet(),
        sclose: () => self.closeSheet(),

        save: () => {
          store.state.meta.name = root.querySelector('[data-name]').value.trim();
          store.state.identity.northStar = root.querySelector('[data-ns]').value.trim();
          store.save(); ui.toast('Saved'); self.closeSheet(); self.render();
        },
        export: async () => {
          await store.flush();
          const blob = new Blob([store.export()], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'life-organizer-' + D.today() + '.json';
          a.click(); URL.revokeObjectURL(a.href);
          store.markBackup();
          ui.toast('Exported');
        },
        import: () => file.click(),
        copyout: async () => {
          await store.flush();
          const json = store.export();
          const box = root.querySelector('[data-json]');
          box.value = json;
          try {
            await navigator.clipboard.writeText(json);
            store.markBackup();
            ui.toast('Copied. Paste it somewhere safe.', 3000);
          } catch (e) { box.select(); ui.toast('Select the box and copy it', 3000); }
        },
        pastein: async () => {
          const box = root.querySelector('[data-json]');
          try { box.value = await navigator.clipboard.readText(); ui.toast('Pasted. Check it, then Restore.'); }
          catch (e) { box.focus(); ui.toast('Paste your backup into the box'); }
        },
        restore: () => {
          const box = root.querySelector('[data-json]');
          if (!box.value.trim()) return box.focus();
          if (!confirm('Replace everything on this phone with the data in the box?')) return;
          try { store.import(box.value); ui.toast('Restored'); location.reload(); }
          catch (e) { ui.toast('That did not parse as a backup'); }
        },
        wipe: () => {
          if (!confirm('Erase everything? Copy your data out first if you want it back.')) return;
          store.wipe();
          if (window.indexedDB) indexedDB.deleteDatabase('life-organizer');
          setTimeout(() => location.reload(), 200);
        },
        desk: () => { location.href = '../index.html'; },

        surf: () => {
          const intensity = +ui.read(root).intensity;
          self.closeSheet();
          self.action = {
            id: 'urge_surf', kind: 'ride it out', label: 'Ten minutes, then decide',
            sub: '', minutes: 10, winKind: 'clarity',
            hint: 'Out of the room. Water. Move. Do not negotiate with it, outlast it.',
            done() { store.logUrge({ intensity, rode: true, instead: '' }); }
          };
          self.won = null;
          self.openSit = null;
          self.focus(self.action);
        },
        logurge: () => {
          store.logUrge({ intensity: +ui.read(root).intensity, rode: false, instead: '' });
          ui.toast('Logged'); self.closeSheet(); self.render();
        },
        saveused: () => {
          store.logUse((ui.read(root).note || '').trim());
          ui.toast('Logged. Tomorrow is day one.', 3000);
          self.closeSheet(); self.render();
        }
      };

      root.querySelectorAll('[data-s]').forEach(b => { b.onclick = () => acts[b.dataset.s](); });
      const x = root.querySelector('[data-sclose]');
      if (x) x.onclick = () => self.closeSheet();

      if (file) file.onchange = () => {
        const f = file.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try { store.import(r.result); ui.toast('Restored'); location.reload(); }
          catch (e) { ui.toast('That file did not parse'); }
        };
        r.readAsText(f);
      };
    }
  };

  /* ---------------- helpers ---------------- */
  const WROTE = {
    task: 'Wrote a task', chore: 'Wrote a chore', activity: 'Logged an activity',
    plan: 'Wrote a plan', feeling: 'Wrote how you feel', thought: 'Wrote a thought'
  };

  const LABELS = {
    task: 'task', chore: 'chore', activity: 'activity',
    done: 'done', feeling: 'feeling', plan: 'plan', thought: 'thought',
    entry: 'written', note: 'written', step: 'did', habit: 'habit', person: 'person',
    urge: 'urge', use: 'smoked', clear: 'clear', state: 'mood', body: 'body',
    rep: 'practice', goal: 'aim', rewire: 'target', insight: 'answer',
    advice: 'advice', system: 'system'
  };

  function art(w) { return /^[aeiou]/i.test(w) ? 'an' : 'a'; }

  function dealDrill(s, avoid) {
    const bank = LO.lib.drills;
    const wanted = s.rewire.targets.map(t => t.trait);
    const recent = s.rewire.reps.slice(0, 10).map(r => r.drillId);
    const scored = bank.map(d => {
      let w = 1;
      if (wanted.includes(d.trait)) w += 4;
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
  function traitLabel(id) { const t = LO.lib.traits.find(x => x.id === id); return t ? t.label : id; }
  function horizonLabel(id) { const h = LO.lib.horizons.find(x => x.id === id); return h ? h.label : id; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function fmt(sec) { return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
  function time(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  LO.ignition = app;
})(window.LO);
