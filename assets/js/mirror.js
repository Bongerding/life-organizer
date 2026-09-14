/* ============================================================
   THE MIRROR — one question at a time, of two kinds.

   OBSERVATIONS are claims: they carry a number and they are about
   you, so they can only exist once the record has earned them.
   "You started on 9 of the last 14 days. Nothing since Thursday."
   No measurement, no observation — that rule has not moved.

   REFLECTIONS are not claims. A question asserts nothing, so it
   needs no evidence — but it does need a reason to exist, and the
   reason is the idea underneath it, which is named in the frame.
   They live in `reflections.js`; the frame describes a concept and
   never pretends to know something about him.

   Observations come first, because a thing that actually happened
   outranks an idea. They run out; the reflections do not, which is
   what keeps this from showing an empty page on a quiet Tuesday.

   The claim stays neutral. The question stays curious, never
   accusatory: "what changed on Tuesday", not "why did you stop".
   That difference is the whole tone of the product.

   Answers land in `scribe.insights`, which ARCHITECTURE already
   names as the read-first layer, and feed back into the portrait
   on Me. You are not filling in a form; you are teaching it.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  const D = LO.D;
  const COOLDOWN = 12;              // days before the same observation may return

  const within = (date, n) => date && D.daysBetween(date, D.today()) < n;
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const weekday = k => new Date(k + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long' });
  const st0 = () => LO.store;

  /* ------------------------------------------------------------
     THE OBSERVERS

     Each one looks at the record and either finds something worth
     remarking on — with the figure that makes it true — or returns
     nothing at all. `weight` is how much it wants to be asked.
     ------------------------------------------------------------ */
  const OBSERVERS = [

    /* a run of starting that has stopped */
    function (s, st) {
      const days = [...new Set(s.wins.filter(w => LO.level.pointsOf(w) > 0 && within(w.date, 14))
        .map(w => w.date))].sort();
      if (days.length < 4) return null;
      const last = days[days.length - 1];
      const gap = D.daysBetween(last, D.today());
      if (gap < 2) return null;
      return {
        key: 'gap_after_run',
        claim: 'You started something on ' + days.length + ' of the last 14 days. ' +
               'Nothing since ' + weekday(last) + '.',
        q: 'What changed on ' + weekday(last) + '?',
        weight: 9
      };
    },

    /* the day of the week the record likes least */
    function (s) {
      const wins = s.wins.filter(w => LO.level.pointsOf(w) > 0 && within(w.date, 56));
      if (wins.length < 14) return null;
      const byDow = [0, 0, 0, 0, 0, 0, 0];
      new Set(wins.map(w => w.date)).forEach(d => { byDow[D.dow(d)]++; });
      const worst = byDow.indexOf(Math.min.apply(null, byDow));
      const best = byDow.indexOf(Math.max.apply(null, byDow));
      if (byDow[best] - byDow[worst] < 3) return null;
      const name = i => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i];
      return {
        key: 'worst_dow',
        claim: 'Over eight weeks you have started on ' + byDow[best] + ' ' + name(best) + 's ' +
               'and ' + byDow[worst] + ' ' + name(worst) + 's.',
        q: 'What is different about a ' + name(worst) + '?',
        weight: 6
      };
    },

    /* clear days against the others — the correlation he cannot see unaided */
    function (s, st) {
      const uses = new Set(s.clarity.uses.map(u => u.date));
      const started = new Set(s.wins.filter(w => LO.level.pointsOf(w) > 0).map(w => w.date));
      const win30 = D.lastDays(30);
      const clear = win30.filter(d => !uses.has(d));
      const other = win30.filter(d => uses.has(d));
      if (other.length < 4 || clear.length < 8) return null;
      const a = pct(clear.filter(d => started.has(d)).length, clear.length);
      const b = pct(other.filter(d => started.has(d)).length, other.length);
      if (a - b < 18) return null;
      return {
        key: 'clear_gap',
        claim: 'You started something on ' + a + '% of your clear days this month, ' +
               'and ' + b + '% of the others.',
        q: 'What does being clear actually give you that you miss otherwise?',
        weight: 10
      };
    },

    /* something has been sitting on the list a long time */
    function (s) {
      const open = s.mind.load.filter(l => l.status !== 'closed' && l.created);
      if (!open.length) return null;
      const oldest = open.slice().sort((a, b) => (a.created < b.created ? -1 : 1))[0];
      const age = D.daysBetween(oldest.created, D.today());
      if (age < 6) return null;
      return {
        key: 'stale_task_' + oldest.id,
        claim: '“' + oldest.title + '” has been on your list for ' + age + ' days.',
        q: 'What is actually stopping it — is it the task, or the first move?',
        weight: 8
      };
    },

    /* a habit, and the shape of the days it survives */
    function (s, st) {
      if (!s.habits.length) return null;
      const h = s.habits.slice().sort((a, b) => st.adherence(b, 28) - st.adherence(a, 28))[0];
      const rate = st.adherence(h, 28);
      if (rate < 15 || rate > 92) return null;
      return {
        key: 'habit_rate_' + h.id,
        claim: 'You have struck “' + h.name + '” on ' + rate + '% of the last four weeks.',
        q: 'What does a day you strike it have that the others do not?',
        weight: 7
      };
    },

    /* urges faced, and what worked */
    function (s) {
      const recent = s.clarity.urges.filter(u => within(u.date, 30));
      const rode = recent.filter(u => u.rode).length;
      if (rode < 2) return null;
      return {
        key: 'urges_ridden',
        claim: 'You rode out ' + rode + ' of ' + recent.length + ' urges in the last month.',
        q: 'What worked the times you rode it out?',
        weight: 9
      };
    },

    /* someone going quiet */
    function (s, st) {
      const p = st.mostOverdue();
      if (!p) return null;
      const d = st.daysSince(p);
      if (d > 800) return null;
      return {
        key: 'person_' + p.id,
        claim: p.lastContact
          ? 'It has been ' + d + ' days since you spoke to ' + p.name + '.'
          : 'You have not logged reaching ' + p.name + ' yet.',
        q: 'What usually gets in the way of the message?',
        weight: 7
      };
    },

    /* an aim that stopped moving */
    function (s) {
      const live = s.goals.filter(g => g.status === 'live' && !g.progress && g.created &&
        D.daysBetween(g.created, D.today()) > 21);
      if (!live.length) return null;
      const g = live[0];
      return {
        key: 'stale_aim_' + g.id,
        claim: '“' + g.title + '” has had nothing logged against it in ' +
               D.daysBetween(g.created, D.today()) + ' days.',
        q: 'Is it still true, or did it quietly stop being?',
        weight: 8
      };
    },

    /* a plan circled on the paper and then left */
    function (s) {
      const plans = s.mind.load.filter(l => l.kind === 'plan' && l.status !== 'closed' &&
        l.steps && l.steps.length && !l.steps.some(x => x.done) &&
        D.daysBetween(l.created, D.today()) >= 4);
      if (!plans.length) return null;
      const p = plans[0];
      return {
        key: 'stalled_plan_' + p.id,
        claim: 'You mapped “' + p.title + '” into ' + p.steps.length + ' steps ' +
               D.daysBetween(p.created, D.today()) + ' days ago and none are struck.',
        q: 'Is the first step the wrong size, or the wrong step?',
        weight: 9
      };
    },

    /* the trajectory, when there is enough of it to have a shape */
    function (s, st) {
      const series = st.indexSeries(21).filter(p => p.v !== null);
      if (series.length < 10) return null;
      const first = series[0].v, last = series[series.length - 1].v;
      const move = last - first;
      if (Math.abs(move) < 8) return null;
      return {
        key: move > 0 ? 'index_up' : 'index_down',
        claim: 'Your alignment has gone from ' + first + ' to ' + last + ' over three weeks.',
        q: move > 0 ? 'What did you change that is working?'
                    : 'What started taking the time that used to go elsewhere?',
        weight: 8
      };
    },

    /* where the points actually come from */
    function (s) {
      const wins = s.wins.filter(w => within(w.date, 21) && LO.level.pointsOf(w) > 0);
      if (wins.length < 10) return null;
      const light = wins.filter(w => LO.level.pointsOf(w) <= 10).length;
      const share = pct(light, wins.length);
      if (share < 65) return null;
      return {
        key: 'all_light',
        claim: share + '% of what you have finished in three weeks was small.',
        q: 'Is that the right size for now, or are you avoiding something bigger?',
        weight: 6
      };
    },

    /* finished a lot, started nothing new */
    function (s) {
      const closed = s.mind.load.filter(l => l.status === 'closed' && within(l.closedOn, 10)).length;
      const open = s.mind.load.filter(l => l.status !== 'closed').length;
      if (closed < 5 || open > 1) return null;
      return {
        key: 'list_empty',
        claim: 'You have closed ' + closed + ' things in ten days and your list is nearly empty.',
        q: 'Is that finished, or is it that nothing new has been worth writing down?',
        weight: 7
      };
    },

    /* capture far outrunning completion */
    function (s) {
      const made = s.mind.load.filter(l => within(l.created, 14)).length;
      const done = s.mind.load.filter(l => l.status === 'closed' && within(l.closedOn, 14)).length;
      if (made < 8 || done >= made * 0.5) return null;
      return {
        key: 'capture_gap',
        claim: 'You wrote down ' + made + ' things in a fortnight and finished ' + done + '.',
        q: 'Is the list a plan or a place to put things so they stop nagging? Both are fine — which is it?',
        weight: 8
      };
    },

    /* the same thing deleted rather than done */
    function (s) {
      const habits = s.habits.filter(h => st0(s).adherence(h, 28) > 0 && st0(s).adherence(h, 28) < 12);
      if (!habits.length) return null;
      const h = habits[0];
      return {
        key: 'dead_habit_' + h.id,
        claim: '“' + h.name + '” has been struck on ' + st0(s).adherence(h, 28) + '% of the last four weeks.',
        q: 'Is this one worth keeping on the board, or is it costing you more as a reproach than it pays as a habit?',
        weight: 7
      };
    },

    /* a long run still going */
    function (s, st) {
      const streak = st.winStreak();
      if (streak < 5) return null;
      return {
        key: 'streak_live',
        claim: 'You have started something ' + streak + ' days running.',
        q: 'What is holding this run up? Name the mechanism, not the motivation — you will need it when the motivation goes.',
        weight: 9
      };
    },

    /* the record itself has been kept a while */
    function (s) {
      const days = D.daysBetween(s.meta.created, D.today());
      if (days < 30 || days % 30 > 2) return null;
      return {
        key: 'months_' + Math.floor(days / 30),
        claim: 'You have been keeping this record for ' + days + ' days.',
        q: 'What has actually changed since you started? Answer from evidence, not impression.',
        weight: 8
      };
    },

    /* wrote a lot, mostly one kind */
    function (s) {
      const recent = s.scribe.entries.filter(e => within(e.date, 21));
      if (recent.length < 8) return null;
      const counts = {};
      recent.forEach(e => { counts[e.kind] = (counts[e.kind] || 0) + 1; });
      const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      if (counts[top] < recent.length * 0.65) return null;
      return {
        key: 'write_skew_' + top,
        claim: pct(counts[top], recent.length) + '% of what you wrote in three weeks was filed as ' + top + '.',
        q: 'What are you not writing down? Every record has a blind spot shaped like its owner.',
        weight: 6
      };
    },

    /* a genuinely good day, worth knowing the cause of */
    function (s, st) {
      const today = LO.level.earnedOn();
      if (today < 60) return null;
      const days = D.lastDays(21).map(d => LO.level.earnedOn(d)).filter(v => v > 0);
      if (days.length < 6) return null;
      const avg = days.reduce((a, b) => a + b, 0) / days.length;
      if (today < avg * 1.7) return null;
      return {
        key: 'big_day',
        claim: 'You have banked ' + today + ' points today. Your usual day is about ' +
               Math.round(avg) + '.',
        q: 'What made today different? Name the thing you could repeat.',
        weight: 10
      };
    }
  ];

  /* ------------------------------------------------------------
     What it wants to ask right now.
     ------------------------------------------------------------ */
  function answered() {
    return (LO.store.state.scribe.insights || []).filter(x => x.key);
  }

  function observed(state) {
    const s = state || LO.store.state;
    const st = LO.store;
    const past = answered();
    const out = [];
    OBSERVERS.forEach(function (fn) {
      let found = null;
      try { found = fn(s, st); } catch (e) { found = null; }
      if (!found) return;
      const seen = past.find(x => x.key === found.key);
      if (seen && within(seen.date, COOLDOWN)) return;
      found.kind = 'observed';
      out.push(found);
    });
    return out.sort((a, b) => b.weight - a.weight);
  }

  /* ------------------------------------------------------------
     The reflections are not claims, so they do not need evidence —
     but they do need to not repeat. They cool down far longer than
     an observation does, because there are hundreds of them and a
     question you recognise is a question you answer from memory.
     ------------------------------------------------------------ */
  const REST = 120;                 // days before a reflection may return

  function reflective(state) {
    const s = state || LO.store.state;
    if (!LO.reflections) return [];
    const past = answered();
    return LO.reflections.available(s)
      .filter(function (r) {
        const seen = past.find(x => x.key === r.id);
        return !(seen && within(seen.date, REST));
      })
      .map(function (r) {
        return { key: r.id, kind: 'reflective', theme: r.theme, claim: r.frame, q: r.q, weight: 5 };
      });
  }

  /** everything it could ask, observations first */
  function candidates(state) {
    return observed(state).concat(shuffled(reflective(state)));
  }

  /* A stable shuffle: the same order all day, a different one tomorrow.
     Random per render would mean "ask me something else" could hand back
     what you just skipped. */
  function shuffled(list) {
    const seed = Number(D.today().replace(/-/g, '')) || 1;
    return list
      .map((x, i) => ({ x: x, k: (seed * (i + 7) * 2654435761) % 100000 }))
      .sort((a, b) => a.k - b.k)
      .map(o => o.x);
  }

  /** the one on the glass, honouring however many times he has said "another".

      Observations come first because a thing that actually happened to you
      outranks an idea — but they run out, and when they do this keeps going
      rather than showing an empty page. */
  function ask(state) {
    const all = candidates(state);
    if (!all.length) return null;
    const skip = LO.store.state.meta.mirrorSkip || 0;
    return all[skip % all.length];
  }

  function another() {
    const m = LO.store.state.meta;
    m.mirrorSkip = (m.mirrorSkip || 0) + 1;
    LO.store.save();
  }

  /** keep what he said, against the claim that prompted it */
  function answer(item, text) {
    const s = LO.store.state;
    s.scribe.insights = s.scribe.insights || [];
    s.scribe.insights.unshift({
      id: LO.store.id('ins'), date: D.today(),
      key: item.key, q: item.q, source: item.claim, text: String(text).trim()
    });
    LO.store.log('insight', String(text).trim(), { q: item.q, claim: item.claim });
    LO.store.state.meta.mirrorSkip = 0;
    LO.store.save();
  }

  /** the last few, so the page shows that it kept them */
  function recent(n) {
    return (LO.store.state.scribe.insights || []).filter(x => x.key).slice(0, n || 3);
  }

  LO.mirror = { ask, another, answer, recent, candidates, observed, reflective, OBSERVERS, COOLDOWN, REST };
})(window.LO);
