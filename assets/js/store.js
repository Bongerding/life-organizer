/* ============================================================
   STORE — the single source of truth.

   Everything the system knows about you is one JSON object.
   It is written to IndexedDB (hundreds of megabytes of headroom,
   and eligible for persistent storage so the browser will not
   evict it) with localStorage kept as a mirror and a fallback.
   Existing localStorage data is adopted on first load, so nothing
   is lost by the upgrade.

   Built for a decade: the `chronicle` array is append-only, so a
   schema change can never rewrite your history — new shapes are
   added alongside, old events stay exactly as they were written.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  const KEY = 'life-organizer.core';       // localStorage mirror + fallback
  const DB = 'life-organizer';
  const DOCS = 'docs';
  const DOCKEY = 'core';
  const SCHEMA = 4;

  /* ---------- IndexedDB, promise-wrapped and optional ---------- */
  let dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('no indexedDB'));
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => {
        if (!r.result.objectStoreNames.contains(DOCS)) r.result.createObjectStore(DOCS);
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error('blocked'));
    });
    return dbp;
  }
  function tx(mode, fn) {
    return open().then(db => new Promise((res, rej) => {
      const t = db.transaction(DOCS, mode);
      const req = fn(t.objectStore(DOCS));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    }));
  }
  const idbGet = () => tx('readonly', s => s.get(DOCKEY));
  const idbPut = v => tx('readwrite', s => s.put(v, DOCKEY));

  /* ---------- date helpers ---------- */
  const D = {
    today() { return D.key(new Date()); },
    key(d) {
      const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return z.toISOString().slice(0, 10);
    },
    shift(days, from) {
      const d = from ? new Date(from + 'T12:00:00') : new Date();
      d.setDate(d.getDate() + days);
      return D.key(d);
    },
    lastDays(n) {
      const out = [];
      for (let i = n - 1; i >= 0; i--) out.push(D.shift(-i));
      return out;
    },
    dow(k) { return new Date(k + 'T12:00:00').getDay(); },      // 0=Sun
    label(k) { return new Date(k + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' }); },
    pretty(k) { return new Date(k + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); },
    daysBetween(a, b) {
      return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
    },
    minsNow() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); },
    hhmm(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); },
    mins(hhmm) { const [h, m] = String(hhmm).split(':').map(Number); return (h || 0) * 60 + (m || 0); }
  };

  /* ---------- blank state ---------- */
  function blank() {
    return {
      meta: {
        schema: SCHEMA, created: D.today(), lastOpen: D.today(),
        opens: 0, streak: 0, seeded: false, lastBackup: null, name: ''
      },

      // CHRONICLE — append-only. Every event, in order, forever.
      // This is the logbook, and it is the one array nothing may rewrite.
      chronicle: [],         // [{id,ts,date,type,text,meta}]
      guidance: { enabled: true, feedback: [], interests: ['springs'], motion: true },

      // WHO — the reference frame every other number is judged against
      identity: {
        name: '',
        northStar: '',
        values: [],          // [{id,word,why}]
        statements: [],      // [{id,text}] "I am the kind of person who..."
        avoid: [],           // [{id,text}] patterns being retired
        facts: []            // [{id,q,a,date}] answers to what the system has asked you
      },

      // WHERE — goals across horizons
      goals: [],             // [{id,title,domain,horizon,why,metric,target,current,due,progress,status,milestones:[{id,text,done}]}]

      // WHEN — the week's architecture
      rhythm: {
        blocks: [],          // [{id,days:[0-6],start:'06:30',end:'07:15',label,domain,anchor}]
        rules: []            // [{id,text}] non-negotiables
      },

      // REPS — habits and their reinforcement
      habits: [],            // [{id,name,domain,identity,cue,ritual,reward,target,log:{'YYYY-MM-DD':1},created}]

      // REWIRE — patterns being reprogrammed + drill history
      rewire: {
        targets: [],         // [{id,from,to,trait,created}]
        reps: []             // [{id,date,drillId,trait,response,rating}]
      },

      // BODY
      vessel: {
        targets: { weight: null, sleep: 7.5, steps: 8000, train: 4, water: 3 },
        logs: [],            // [{date,weight,sleep,steps,water,trained,kcal,note}]
        sessions: []         // [{id,date,type,load,rpe,note}]
      },

      // MIND
      mind: {
        logs: [],            // [{date,mood,energy,clarity,stress,note,grateful}]
        load: []             // [{id,title,weight,kind,status,created}]
      },

      // PEOPLE — the friendships that quietly decay if nothing tracks them
      people: [],            // [{id,name,cadence,lastContact,note,created}]

      // CLARITY — the substance you are getting out from under, tracked without judgement
      clarity: {
        substance: '',
        clearSince: null,    // 'YYYY-MM-DD' | null
        best: 0,             // longest clear run, in days
        urges: [],           // [{id,date,intensity,rode,instead,note}]
        uses: []             // [{id,date,note}]
      },

      // WINS — the first-step ledger. Every started-and-finished small thing.
      wins: [],              // [{id,date,kind,label,minutes}]

      // SCRIBE — journal + what the system has learned about you
      scribe: {
        entries: [],         // [{id,date,prompt,text,tags}]
        insights: []         // [{id,date,text,source}]
      },

      // CLASSIFIER — what it has learned about how you write
      classifier: { weights: {}, corrections: 0 },

      settings: { reduceMotion: false, weekStart: 1 }
    };
  }

  /* ---------- deep merge so new schema fields appear without wiping data ---------- */
  function graft(base, saved) {
    if (Array.isArray(base)) return Array.isArray(saved) ? saved : base;
    if (base && typeof base === 'object') {
      const out = Array.isArray(saved) ? {} : Object.assign({}, base);
      if (saved && typeof saved === 'object') {
        for (const k of Object.keys(saved)) {
          out[k] = k in base ? graft(base[k], saved[k]) : saved[k];
        }
      }
      return out;
    }
    return saved === undefined ? base : saved;
  }

  /* how each kind of new record reads in the chronicle */
  const ADDED = {
    'goals':           { type: 'goal',   text: r => 'Set a goal: ' + r.title },
    'habits':          { type: 'habit',  text: r => 'Started tracking: ' + r.name },
    'people':          { type: 'person', text: r => 'Added ' + r.name + ' to the people you keep' },
    'mind.load':       { type: 'task',   text: r => r.title, quiet: true },
    'scribe.entries':  { type: 'entry',  text: r => r.text, kindFrom: true },
    'scribe.insights': { type: 'insight', text: r => r.text },
    'rewire.targets':  { type: 'rewire', text: r => 'New target: ' + r.from + ' → ' + r.to },
    'rewire.reps':     { type: 'rep',    text: r => r.response },
    'vessel.sessions': { type: 'body',   text: r => 'Trained: ' + r.type + (r.load ? ' · ' + r.load : '') }
  };

  const store = {
    D,
    state: blank(),
    listeners: [],

    backend: 'memory',
    persisted: null,

    /** async: IndexedDB first, adopting any existing localStorage data */
    async load() {
      let raw = null;
      try {
        raw = await idbGet();
        this.backend = 'indexeddb';
      } catch (e) {
        this.backend = 'localstorage';
      }
      if (!raw) {
        try {
          const ls = localStorage.getItem(KEY);
          if (ls) raw = JSON.parse(ls);
        } catch (e) { /* nothing to adopt */ }
      }
      this.state = raw ? graft(blank(), raw) : blank();

      // ask the browser not to evict us — this is what makes ten years plausible
      try {
        if (navigator.storage && navigator.storage.persist) {
          this.persisted = await navigator.storage.persisted();
          if (!this.persisted) this.persisted = await navigator.storage.persist();
        }
      } catch (e) { /* unsupported, carry on */ }

      this.touch();
      return this.state;
    },

    /** synchronous for callers; the write itself is debounced and async */
    save() {
      this._dirty = true;
      if (!this._flush) {
        this._flush = setTimeout(() => { this._flush = null; this.flush(); }, 120);
      }
      this.listeners.forEach(fn => { try { fn(this.state); } catch (_) {} });
      if (LO.sync) LO.sync.maybe();
    },

    flush() {
      if (!this._dirty) return Promise.resolve();
      this._dirty = false;
      const snap = this.state;
      // localStorage stays a mirror so an old bookmark or a dead IDB still works;
      // once history outgrows its ~5MB it simply stops mirroring, which is fine.
      try { localStorage.setItem(KEY, JSON.stringify(snap)); }
      catch (e) { this.mirrorFull = true; }
      return idbPut(snap).catch(e => {
        if (this.mirrorFull) console.warn('[store] both stores failing', e);
      });
    },

    /** what the browser will tell us about durability and headroom */
    async storageInfo() {
      const out = { backend: this.backend, persisted: !!this.persisted, mirrorFull: !!this.mirrorFull };
      out.bytes = new Blob([JSON.stringify(this.state)]).size;
      out.events = this.state.chronicle.length;
      try {
        if (navigator.storage && navigator.storage.estimate) {
          const est = await navigator.storage.estimate();
          out.quota = est.quota; out.usage = est.usage;
        }
      } catch (e) { /* ignore */ }
      return out;
    },

    on(fn) { this.listeners.push(fn); },

    /** register today's open, keeping a visit streak */
    touch() {
      const m = this.state.meta, t = D.today();
      if (m.lastOpen !== t) {
        m.streak = m.lastOpen === D.shift(-1) ? (m.streak || 0) + 1 : 1;
        m.lastOpen = t;
      } else if (!m.streak) m.streak = 1;
      m.opens = (m.opens || 0) + 1;
      this.save();
    },

    id(p) { return (p || 'x') + '_' + Math.random().toString(36).slice(2, 9); },

    /* ---------- the chronicle ----------
       Append-only. Never edited, never reordered, never migrated.
       Every surface that shows you your own history reads this. */
    visibleChronicle() {
      const hidden = new Set();
      this.state.chronicle.forEach(e => {
        if (e.type === 'entry-hidden') hidden.add(e.meta.ref);
        if (e.type === 'entry-restored') hidden.delete(e.meta.ref);
      });
      return this.state.chronicle.filter(e => !hidden.has(e.id) && !['entry-hidden', 'entry-restored'].includes(e.type));
    },
    hideEntry(id, restore) {
      if (!this.state.chronicle.some(e => e.id === id)) return;
      this.log(restore ? 'entry-restored' : 'entry-hidden', restore ? 'Restored a journal entry' : 'Removed a journal entry from view', { ref: id });
      this.save();
    },
    log(type, text, meta, date) {
      const now = new Date();
      this.state.chronicle.push({
        id: this.id('ev'), ts: now.getTime(), date: date || D.key(now),
        type, text, meta: meta || null
      });
      return this.state.chronicle[this.state.chronicle.length - 1];
    },
    /** events for one day, newest first */
    dayEvents(date) {
      return this.state.chronicle.filter(e => e.date === date).slice().reverse();
    },
    /** the days that have anything on them, newest first */
    activeDays(limit) {
      const seen = [];
      for (let i = this.state.chronicle.length - 1; i >= 0; i--) {
        const d = this.state.chronicle[i].date;
        if (seen[seen.length - 1] !== d && !seen.includes(d)) seen.push(d);
        if (limit && seen.length >= limit) break;
      }
      return seen;
    },

    /* ---------- generic collection helpers ---------- */
    /** path like 'goals' or 'mind.load' */
    at(path) {
      return path.split('.').reduce((o, k) => o[k], this.state);
    },
    add(path, obj) {
      const arr = this.at(path);
      const rec = Object.assign({ id: this.id(path.split('.').pop()) }, obj);
      arr.unshift(rec);
      const note = ADDED[path];
      if (note && !note.quiet) {
        this.log(note.kindFrom && rec.kind ? rec.kind : note.type, note.text(rec), { ref: rec.id });
      }
      this.save();
      return rec;
    },
    patch(path, id, obj) {
      const rec = this.at(path).find(r => r.id === id);
      if (!rec) return rec;
      Object.assign(rec, obj);
      if (path === 'mind.load' && obj.status === 'closed') {
        this.log('done', rec.title, { ref: id, weight: rec.weight });
      }
      if (path === 'goals' && obj.progress != null) {
        if (obj.progress >= 100) this.log('goal', 'Finished: ' + rec.title, { ref: id });
        else this.log('goal', rec.title + ' → ' + obj.progress + '%', { ref: id, quiet: true });
      }
      this.save();
      return rec;
    },
    drop(path, id) {
      const arr = this.at(path);
      const i = arr.findIndex(r => r.id === id);
      if (i > -1) { arr.splice(i, 1); this.save(); }
    },

    /** upsert a dated log row in an array keyed by `date` */
    logFor(path, date) {
      const arr = this.at(path), d = date || D.today();
      let row = arr.find(r => r.date === d);
      if (!row) { row = { date: d }; arr.push(row); arr.sort((a, b) => a.date < b.date ? 1 : -1); }
      return row;
    },
    setLog(path, fields, date) {
      const d = date || D.today();
      const kind = path === 'mind.logs' ? 'state' : path === 'vessel.logs' ? 'body' : null;
      // one chronicle entry per day per kind; editing the same day does not re-log it
      const first = kind && !this.state.chronicle.some(e => e.date === d && e.type === kind);
      Object.assign(this.logFor(path, d), fields);
      if (first) {
        if (path === 'mind.logs') {
          this.log('state', 'Mood ' + fields.mood + ' · energy ' + fields.energy +
            ' · clarity ' + fields.clarity + ' · stress ' + fields.stress,
            Object.assign({}, fields), d);
        }
        if (path === 'vessel.logs') {
          const bits = [];
          if (fields.sleep) bits.push(fields.sleep + 'h sleep');
          if (fields.steps) bits.push(Math.round(fields.steps) + ' steps');
          if (fields.weight) bits.push(fields.weight + ' weight');
          if (bits.length) this.log('body', bits.join(' · '), Object.assign({}, fields), d);
        }
      }
      this.save();
    },

    /* ---------- writing ----------
       One entry point for everything he writes. `kind` is one of
       task | feeling | plan | thought. A task also becomes something
       to do, linked back to the entry it came from. */
    write(kind, text, extra) {
      const rec = this.add('scribe.entries', Object.assign({
        date: D.today(), kind: kind || 'thought', prompt: '', text, tags: []
      }, extra || {}));
      // tasks and chores become things to do; an activity is already done
      if (kind === 'task' || kind === 'chore') {
        const e = kind === 'chore' ? 1 : LO.level.estimate(text);
        this.state.mind.load.unshift({
          id: this.id('task'), title: text, kind, weight: e, effort: e,
          status: 'open', created: D.today(), ts: Date.now(), from: rec.id
        });
      }
      if (kind === 'activity') {
        this.win('activity', text, 0, 'logged_activity', LO.level.tier(2).points, true);
      }
      this.save();
      return rec;
    },
    note(text, tags) { return this.write('thought', text, { tags: tags || [] }); },

    /** open tasks, heaviest first, hiding anything deferred */
    tasks() {
      const t = D.today();
      return this.state.mind.load
        .filter(l => l.status !== 'closed' && (!l.defer || l.defer <= t))
        .sort((a, b) => (+b.weight || 1) - (+a.weight || 1));
    },
    closeTask(id) {
      this.patch('mind.load', id, { status: 'closed', closedOn: D.today() });
    },

    /* ---------- the day's list ----------
       What he wrote on the Do tab, plus anything captured on Write.
       Closed items stay until midnight so the day reads as 4 of 5,
       and so the line struck through them is visible for a while. */
    capture(title, effort) {
      const e = Math.max(1, Math.min(3, +effort || 2));
      const entry = this.add('scribe.entries', {
        date: D.today(), kind: 'task', prompt: '', text: title, tags: []
      });
      const rec = {
        id: this.id('task'), title, kind: 'task', weight: e, effort: e,
        status: 'open', created: D.today(), ts: Date.now(), from: entry.id
      };
      this.state.mind.load.unshift(rec);
      this.save();
      return rec;
    },
    /** oldest first, so a finished list reads top to bottom */
    dayList() {
      const t = D.today();
      return this.state.mind.load
        .filter(l => (l.status !== 'closed' && (!l.defer || l.defer <= t)) || l.closedOn === t)
        .slice().reverse();
    },
    /** the bonus for clearing everything you set — paid once a day */
    dayCleared() {
      return this.state.wins.some(w => w.date === D.today() && w.ref === 'day');
    },
    awardDay(n) {
      if (this.dayCleared()) return 0;
      return this.win('day', 'Cleared the whole list', 0, 'day', LO.level.dayBonus(n));
    },

    /** call after a successful export so the system can nag about backups */
    markBackup() {
      this.state.meta.lastBackup = D.today();
      this.log('system', 'Backed the whole record up');
      this.save();
    },
    daysSinceBackup() {
      return this.state.meta.lastBackup ? D.daysBetween(this.state.meta.lastBackup, D.today()) : null;
    },

    /* ---------- habit mechanics ---------- */
    toggleHabit(id, date) {
      const h = this.state.habits.find(x => x.id === id);
      if (!h) return;
      const d = date || D.today();
      h.log = h.log || {};
      if (h.log[d]) delete h.log[d]; else h.log[d] = 1;
      const ref = 'habit_' + id;
      if (h.log[d]) {
        this.log('habit', h.name, { ref: id, streak: this.streakOf(h) });
        // pays once a day however many times it is toggled
        if (!this.state.wins.some(w => w.date === d && w.ref === ref)) {
          this.win('habit', h.name, 0, ref, 10, true);
        }
      } else {
        // unticking is a correction, not a day's work — the points go back.
        // The chronicle keeps both events; only the ledger is adjusted.
        const i = this.state.wins.findIndex(w => w.date === d && w.ref === ref);
        if (i > -1) this.state.wins.splice(i, 1);
      }
      this.save();
      return !!h.log[d];
    },
    streakOf(h) {
      let n = 0, d = D.today();
      if (!h.log || !h.log[d]) d = D.shift(-1);          // today still open — don't break the chain
      while (h.log && h.log[d]) { n++; d = D.shift(-1, d); }
      return n;
    },
    adherence(h, days) {
      const win = D.lastDays(days || 28);
      const hit = win.filter(d => h.log && h.log[d]).length;
      return Math.round((hit / win.length) * 100);
    },

    /* ---------- derived scores ---------- */
    /** 0..100 per pillar + weighted alignment index */
    vitals() {
      const s = this.state;

      // REPS — 14-day habit adherence
      const reps = s.habits.length
        ? Math.round(s.habits.reduce((a, h) => a + this.adherence(h, 14), 0) / s.habits.length)
        : null;

      // AIM — average live goal progress
      const live = s.goals.filter(g => g.status !== 'done' && g.status !== 'parked');
      // A goal measured *by* the alignment index cannot also feed it — that is a
      // loop, and it would be double counting even if it terminated.
      let aim = null;
      if (live.length) {
        const feeds = !LO.aims ? live : live.filter(g => {
          const t = g.track || LO.aims.detect(g.title, g.domain);
          return t.kind !== 'index' && t.kind !== 'pillar';
        });
        if (feeds.length) {
          aim = Math.round(feeds.reduce((a, g) =>
            a + (LO.aims ? LO.aims.progress(g, s).pct : (Number(g.progress) || 0)), 0) / feeds.length);
        }
      }

      // BODY — sleep / steps / training vs targets over 7 days
      const t = s.vessel.targets, vl = s.vessel.logs.filter(r => D.daysBetween(r.date, D.today()) < 7);
      let body = null;
      if (vl.length) {
        const avg = k => vl.reduce((a, r) => a + (Number(r[k]) || 0), 0) / vl.length;
        const parts = [];
        if (t.sleep) parts.push(Math.min(1, avg('sleep') / t.sleep));
        if (t.steps) parts.push(Math.min(1, avg('steps') / t.steps));
        const trained = s.vessel.sessions.filter(x => D.daysBetween(x.date, D.today()) < 7).length;
        if (t.train) parts.push(Math.min(1, trained / t.train));
        body = Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
      }

      // MIND — mood/energy/clarity up, stress down, over 7 days
      const ml = s.mind.logs.filter(r => D.daysBetween(r.date, D.today()) < 7);
      let mind = null;
      if (ml.length) {
        const avg = k => ml.reduce((a, r) => a + (Number(r[k]) || 0), 0) / ml.length;
        mind = Math.round(((avg('mood') + avg('energy') + avg('clarity') + (10 - avg('stress'))) / 40) * 100);
      }

      // LOAD — open loops drag the index down
      const openLoad = s.mind.load.filter(l => l.status !== 'closed');
      const loadWeight = openLoad.reduce((a, l) => a + (Number(l.weight) || 1), 0);
      const load = Math.max(0, 100 - loadWeight * 6);

      // REWIRE — reps logged in the last 14 days
      const recentReps = s.rewire.reps.filter(r => D.daysBetween(r.date, D.today()) < 14).length;
      const rewire = s.rewire.targets.length ? Math.min(100, Math.round(recentReps / (s.rewire.targets.length * 7) * 100)) : null;

      // CLEAR — days clear weighted with how urges actually went, 21 days = full marks
      const clear = this.clarityScore();

      // BONDS — share of people contacted inside their own cadence
      const bonds = s.people.length
        ? Math.round(s.people.filter(p => this.daysSince(p) <= (p.cadence || 21)).length / s.people.length * 100)
        : null;

      // load alone is not evidence of alignment — it only counts once
      // something real is being tracked, otherwise an empty system reads 100
      const signal = [reps, aim, body, mind, rewire, clear, bonds].filter(v => v !== null).length;
      const pillars = { reps, aim, body, mind, clear, bonds, rewire, load: signal ? load : null };
      const w = { reps: 1.4, aim: 1.2, body: 1, mind: 1.2, clear: 1.3, bonds: .9, rewire: .8, load: .6 };
      let num = 0, den = 0;
      for (const k in pillars) if (pillars[k] !== null) { num += pillars[k] * w[k]; den += w[k]; }
      const index = signal ? Math.round(num / den) : 0;

      return { pillars, index, signal, openLoad: openLoad.length };
    },

    /* ---------- clarity ---------- */
    daysClear() {
      const c = this.state.clarity;
      return c.clearSince ? D.daysBetween(c.clearSince, D.today()) : null;
    },
    clarityScore() {
      const c = this.state.clarity;
      const recent = x => D.daysBetween(x.date, D.today()) < 14;
      const urges = c.urges.filter(recent);
      const uses = c.uses.filter(recent);
      if (!c.clearSince && !urges.length && !uses.length) return null;
      const days = this.daysClear() || 0;
      const streakScore = Math.min(100, Math.round(days / 21 * 100));
      const rode = urges.filter(u => u.rode).length;
      const faced = rode + uses.length;
      if (!faced) return streakScore;
      const resist = Math.round(rode / faced * 100);
      return Math.round(streakScore * 0.6 + resist * 0.4);
    },
    /** start (or restart) the clear count — a use resets the day, never the system */
    markClear(date) {
      const c = this.state.clarity;
      const days = this.daysClear();
      if (days && days > (c.best || 0)) c.best = days;
      c.clearSince = date || D.today();
      this.log('clear', 'Started the clear count');
      this.save();
    },
    logUse(note) {
      const c = this.state.clarity;
      const days = this.daysClear();
      if (days && days > (c.best || 0)) c.best = days;
      c.uses.unshift({ id: this.id('use'), date: D.today(), note: note || '' });
      c.clearSince = D.shift(1);   // the count restarts tomorrow, not from zero-shame today
      this.log('use', note ? 'Smoked — ' + note : 'Smoked', { ran: days || 0 });
      this.save();
    },
    logUrge(fields) {
      this.state.clarity.urges.unshift(Object.assign({ id: this.id('urge'), date: D.today() }, fields));
      this.log('urge', fields.rode ? 'Rode out an urge' : 'Logged an urge',
        { intensity: fields.intensity, rode: !!fields.rode });
      this.save();
    },

    /* ---------- people ---------- */
    daysSince(p) {
      return p.lastContact ? D.daysBetween(p.lastContact, D.today()) : 999;
    },
    /** most overdue relative to their own cadence, or null */
    mostOverdue() {
      const ranked = this.state.people
        .filter(p => !p.nextReach || p.nextReach <= D.today())
        .map(p => ({ p, over: p.nextReach ? D.daysBetween(p.nextReach, D.today()) : this.daysSince(p) - (p.cadence || 21) }))
        .filter(x => x.over >= 0)
        .sort((a, b) => b.over - a.over);
      return ranked.length ? ranked[0].p : null;
    },
    contacted(id, how) {
      const p = this.state.people.find(x => x.id === id);
      const gap = p ? this.daysSince(p) : null;
      this.patch('people', id, { lastContact: D.today(), nextReach: D.shift(p ? p.cadence || 14 : 14) });
      if (p) this.log('person', (how === 'saw' ? 'Saw ' : 'Reached ') + p.name,
        { ref: id, gap: gap === 999 ? null : gap });
    },

    /* ---------- wins (the first-step ledger) ---------- */
    win(kind, label, minutes, ref, points, quiet) {
      const pts = typeof points === 'number' ? points : 15;
      this.state.wins.unshift({
        id: this.id('win'), date: D.today(), kind, label,
        minutes: minutes || 0, ref: ref || '', points: pts
      });
      // any first step also strikes the meta-habit, if it exists
      const meta = this.state.habits.find(h => h.name === 'One first step');
      if (meta && !(meta.log && meta.log[D.today()])) {
        meta.log = meta.log || {}; meta.log[D.today()] = 1;
      }
      if (!quiet) this.log('step', label, { kind, minutes: minutes || 0, ref: ref || '', points: pts });
      this.save();
      return pts;
    },
    winsOn(date) { return this.state.wins.filter(w => w.date === (date || D.today())); },
    winStreak() {
      const set = new Set(this.state.wins.map(w => w.date));
      let n = 0, d = D.today();
      if (!set.has(d)) d = D.shift(-1);
      while (set.has(d)) { n++; d = D.shift(-1, d); }
      return n;
    },

    /** index recomputed as of a past date, for the trajectory line */
    indexSeries(days) {
      const s = this.state, out = [];
      for (const d of D.lastDays(days || 30)) {
        const win = [];
        for (let i = 0; i < 14; i++) win.push(D.shift(-i, d));
        const reps = s.habits.length
          ? s.habits.reduce((a, h) => a + win.filter(x => h.log && h.log[x]).length / win.length, 0) / s.habits.length * 100
          : null;
        const ml = s.mind.logs.filter(r => r.date <= d && D.daysBetween(r.date, d) < 7);
        const mind = ml.length
          ? ((ml.reduce((a, r) => a + (+r.mood || 0), 0) / ml.length) +
             (ml.reduce((a, r) => a + (+r.energy || 0), 0) / ml.length) +
             (ml.reduce((a, r) => a + (+r.clarity || 0), 0) / ml.length) +
             (10 - ml.reduce((a, r) => a + (+r.stress || 0), 0) / ml.length)) / 40 * 100
          : null;
        const vals = [reps, mind].filter(v => v !== null);
        out.push({ date: d, v: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null });
      }
      return out;
    },

    /* ---------- first-run ----------
       Deliberately generic. Personal calibration — your north star, your
       goals, your patterns — is data, not code, so it never travels in a
       public repository. Restore yours from a backup, or let the app ask
       you for it on the Me tab. */
    seed() {
      const s = this.state;
      if (s.meta.seeded) return false;
      if (s.identity.northStar || s.goals.length || s.habits.length) {
        s.meta.seeded = true; this.save(); return false;
      }

      s.identity.statements.push({
        id: this.id('t'), text: 'I am the kind of person who starts before he feels ready.'
      });

      // one habit, because the whole system is built on starting
      s.habits.push({
        id: this.id('habit'), name: 'One first step',
        domain: 'order', identity: 'I start before I feel ready',
        target: 7, cue: 'Open the app', reward: '', log: {}, created: D.today()
      });

      s.meta.seeded = true;
      this.log('system', 'Started the record');
      this.save();
      return true;
    },

    /* ---------- portability ---------- */
    /** the whole record as JSON, with the sync token stripped — a backup
        must never carry the credential that wrote it */
    export() {
      const copy = JSON.parse(JSON.stringify(this.state));
      if (copy.settings && copy.settings.sync) copy.settings.sync.token = '';
      return JSON.stringify(copy, null, 2);
    },
    import(json) {
      const parsed = JSON.parse(json);
      const token = this.state.settings && this.state.settings.sync
        ? this.state.settings.sync.token : '';
      this.state = graft(blank(), parsed);
      if (token) {
        this.state.settings.sync = this.state.settings.sync || {};
        this.state.settings.sync.token = token;
      }
      this.save();
    },
    wipe() { localStorage.removeItem(KEY); this.state = blank(); this.save(); }
  };

  LO.store = store;
  LO.D = D;
})(window.LO);
