/* ============================================================
   INSIGHT — the part that reads everything and speaks first.

   Three jobs, all derived, none stored:
     messages()  what it wants to say to you today, ranked
     truths()    what it can prove about you, with the evidence
     questions() what it still does not know and wants to ask

   Rules:
   · Nothing fires without evidence. No claim the data cannot back.
   · Praise is specific or it is absent. "You start" is only said
     with the streak attached.
   · What is drifting goes in messages, never in truths. The page
     about who you are does not carry your failures.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  const D = LO.D;
  const within = (date, n) => date && D.daysBetween(date, D.today()) < n;
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

  /* ------------------------------------------------------------
     MESSAGES — ranked. The surface shows the top few.
     tone: reward | notice | nudge | ask | quiet
     ------------------------------------------------------------ */
  function messages(s) {
    const st = LO.store, out = [];
    const push = (rank, tone, text, extra) => out.push(Object.assign({ rank, tone, text }, extra || {}));

    const wins = st.winsOn().length;
    const streak = st.winStreak();
    const days = st.daysClear();
    const CLEAR_MARKS = [3, 7, 14, 21, 30, 50, 75, 100, 180, 365];
    const STREAK_MARKS = [3, 7, 14, 21, 30, 50, 75, 100];

    /* --- rewards first: they are the reason to open this page --- */
    if (days !== null && CLEAR_MARKS.includes(days)) {
      push(100, 'reward', days + ' days clear.');
    }
    if (STREAK_MARKS.includes(streak)) {
      push(96, 'reward', streak + ' days in a row of starting something.');
    }

    const rides = s.wins.filter(w => w.kind === 'ride' && within(w.date, 30)).length;
    if (rides >= 4) push(90, 'reward', rides + ' rides in the last month.');

    /* --- what is drifting --- */
    const lastRide = s.wins.find(w => w.kind === 'ride');
    const sinceRide = lastRide ? D.daysBetween(lastRide.date, D.today()) : null;
    if (sinceRide === null && s.chronicle.length > 12) {
      push(88, 'nudge', 'No ride logged yet.', { go: 'do' });
    } else if (sinceRide !== null && sinceRide >= 10) {
      push(92, 'nudge', sinceRide + ' days since you rode.', { go: 'do' });
    }

    const worst = st.mostOverdue();
    if (worst) {
      const d = st.daysSince(worst);
      push(86, 'nudge',
        (d > 200 ? 'A very long time since you spoke to ' + worst.name + '.'
                 : d + ' days since ' + worst.name + '.'), { go: 'me' });
    }

    const open = s.mind.load.filter(l => l.status !== 'closed');
    if (open.length >= 7) {
      push(80, 'notice', open.length + ' tasks open.', { go: 'do' });
    }

    const lastState = s.mind.logs.find(r => within(r.date, 4));
    if (!lastState && s.chronicle.length > 8) {
      push(74, 'ask', 'No note on how you are this week.', { go: 'write' });
    }

    const recent5 = s.mind.logs.filter(r => within(r.date, 6));
    if (recent5.length >= 3) {
      const avg = k => recent5.reduce((a, r) => a + (+r[k] || 0), 0) / recent5.length;
      if (avg('clarity') <= 4.2) {
        push(78, 'notice', 'Clarity around ' + avg('clarity').toFixed(1) + ' all week.', { go: 'do' });
      }
      if (avg('stress') >= 7) {
        push(76, 'notice', 'Stress averaging ' + avg('stress').toFixed(1) + ' this week.', { go: 'write' });
      }
    }

    const lastUse = s.clarity.uses[0];
    if (lastUse && within(lastUse.date, 2)) {
      push(84, 'quiet', 'You logged a smoke ' + (lastUse.date === D.today() ? 'today' : 'yesterday') +
        '. Best run still ' + (s.clarity.best || 0) + ' days.');
    }

    const staleGoals = s.goals.filter(g => g.status === 'live' && !g.progress &&
      D.daysBetween(g.created, D.today()) > 14);
    if (staleGoals.length) {
      push(70, 'nudge', 'Nothing logged yet against "' + staleGoals[0].title + '".', { go: 'me' });
    }

    /* --- the ten-year problem --- */
    const sinceBackup = st.daysSinceBackup();
    if (s.chronicle.length > 40 && (sinceBackup === null || sinceBackup > 21)) {
      push(94, 'notice', sinceBackup === null ? 'This has never been backed up.'
        : 'Last backup was ' + sinceBackup + ' days ago.', { go: 'settings' });
    }

    /* --- rhythm of the week --- */
    const dow = new Date().getDay();
    if (dow === 1 && !wins) {
      push(68, 'ask', 'New week. Worth writing down what would make it a good one.', { go: 'write' });
    }
    if (dow === 0 && s.chronicle.length > 20) {
      push(66, 'ask', 'End of the week. Worth five minutes on what moved.', { go: 'write' });
    }

    /* --- today, plainly --- */
    if (!wins) push(60, 'ask', 'Nothing done today yet.', { go: 'do' });
    else push(58, 'reward', wins === 1 ? 'One thing done today.' : wins + ' things done today.');

    if (!out.some(m => m.rank >= 66)) {
      push(50, 'quiet', 'Nothing is drifting right now.');
    }

    return out.sort((a, b) => b.rank - a.rank);
  }

  /* ------------------------------------------------------------
     TRUTHS — only what the data can prove, with its evidence.
     ------------------------------------------------------------ */
  function truths(s) {
    const st = LO.store, out = [];
    const claim = (claim, evidence, weight) => out.push({ claim, evidence, weight: weight || 1 });

    const streak = st.winStreak();
    const wins14 = s.wins.filter(w => within(w.date, 14));
    const startDays = new Set(wins14.map(w => w.date)).size;

    if (streak >= 3) claim('You start.', streak + ' days running, and ' + startDays + ' of the last 14.', 5);
    else if (startDays >= 6) claim('You start more often than not.', startDays + ' of the last 14 days.', 4);

    const days = st.daysClear();
    if (days !== null && days >= 5) {
      claim('You are clear-headed.', days + ' days' + (s.clarity.best > days ? ', best run ' + s.clarity.best : '') + '.', 5);
    }

    const urges14 = s.clarity.urges.filter(u => within(u.date, 21));
    const rode = urges14.filter(u => u.rode).length;
    const faced = rode + s.clarity.uses.filter(u => within(u.date, 21)).length;
    if (faced >= 3 && pct(rode, faced) >= 55) {
      claim('You outlast the urge.', rode + ' of ' + faced + ' ridden out in three weeks.', 5);
    }

    const rides = s.wins.filter(w => w.kind === 'ride' && within(w.date, 30)).length;
    if (rides >= 2) claim('You ride.', rides + ' times in the last month.', 4);

    const cyc = s.habits.find(h => h.name === 'Cycle');
    if (cyc) {
      const n = D.lastDays(14).filter(d => cyc.log && cyc.log[d]).length;
      if (n >= 4) claim('You are on the bike consistently.', n + ' rides in a fortnight.', 3);
    }

    const captured = s.mind.load.length;
    const closed = s.mind.load.filter(l => l.status === 'closed').length;
    if (captured >= 5 && pct(closed, captured) >= 50) {
      claim('You close what you capture.', closed + ' of ' + captured + ' loops shut.', 3);
    }

    if (s.people.length >= 3) {
      const kept = s.people.filter(p => st.daysSince(p) <= (p.cadence || 21)).length;
      if (pct(kept, s.people.length) >= 60) {
        claim('You keep your people.', kept + ' of ' + s.people.length + ' inside their own cadence.', 4);
      }
    }

    const entries = s.scribe.entries.filter(e => within(e.date, 21)).length;
    if (entries >= 5) claim('You keep the record.', entries + ' entries in three weeks.', 3);

    const reps = s.rewire.reps.filter(r => within(r.date, 21)).length;
    if (reps >= 4) claim('You do the reprogramming work.', reps + ' drills answered in three weeks.', 4);

    /* the correlation he cannot see without this: clear days vs starting */
    const startSet = new Set(s.wins.map(w => w.date));
    const uses = new Set(s.clarity.uses.map(u => u.date));
    const window30 = D.lastDays(30);
    const clearDays = window30.filter(d => !uses.has(d));
    const smokedDays = window30.filter(d => uses.has(d));
    if (smokedDays.length >= 4 && clearDays.length >= 8) {
      const a = pct(clearDays.filter(d => startSet.has(d)).length, clearDays.length);
      const b = pct(smokedDays.filter(d => startSet.has(d)).length, smokedDays.length);
      if (a - b >= 20) {
        claim('You get more done clear.',
          'You started something on ' + a + '% of clear days and ' + b + '% of the others.', 5);
      }
    }

    const totalDays = s.chronicle.length ? D.daysBetween(s.meta.created, D.today()) + 1 : 0;
    if (totalDays >= 14) {
      claim('You have kept this going.', totalDays + ' days of record, ' + s.chronicle.length + ' entries.', 2);
    }

    return out.sort((a, b) => b.weight - a.weight);
  }

  /* ------------------------------------------------------------
     QUESTIONS — what it does not know yet.
     Answers land in identity.facts and stay on the character page.
     ------------------------------------------------------------ */
  const BANK = [
    { id: 'name', q: 'What should I call you?', when: s => !s.meta.name },
    { id: 'best_hours', q: 'What time of day do you actually do your best work?', when: () => true },
    { id: 'good_day', q: 'Describe a genuinely good day for you, start to finish.', when: () => true },
    { id: 'work_need', q: 'What does your work need from you this month?', when: () => true, repeat: 30 },
    { id: 'avoiding', q: 'What are you avoiding right now?', when: () => true, repeat: 14 },
    { id: 'clear_diff', q: 'Think of a stretch when you felt genuinely clear-headed. What was different then?', when: () => true },
    { id: 'the_ride', q: 'What is the ride you keep meaning to do and have not done?', when: () => true },
    { id: 'people_three', q: 'Who are the people you would be gutted to lose touch with?', when: s => s.people.length < 3 },
    { id: 'substance_for', q: 'What is the thing you are cutting down on actually doing for you?', when: s => !!s.clarity.clearSince },
    { id: 'partner_open', q: 'Where would you actually meet someone, if you were being honest about it?', when: () => true },
    { id: 'ten_years', q: 'Ten years out, what do you want to be able to say about this stretch?', when: () => true },
    { id: 'week_worth', q: 'What would make this week worth remembering?', when: () => true, repeat: 7 },
    { id: 'drains', q: 'What drains you that you could actually remove?', when: () => true },
    { id: 'proud', q: 'What have you done that you have never given yourself credit for?', when: () => true }
  ];

  function questions(s) {
    const answered = s.identity.facts || [];
    return BANK.filter(q => {
      if (!q.when(s)) return false;
      const hits = answered.filter(f => f.id === q.id);
      if (!hits.length) return true;
      if (!q.repeat) return false;
      return !within(hits[0].date, q.repeat);
    });
  }

  /* one current-state line, used in both the shell and the character header */
  function snapshot(s) {
    const st = LO.store, v = st.vitals();
    const days = st.daysClear();
    const bits = [];
    bits.push('index ' + v.index);
    if (days !== null) bits.push(days + 'd clear');
    const streak = st.winStreak();
    if (streak) bits.push(streak + 'd starting');
    const open = s.mind.load.filter(l => l.status !== 'closed').length;
    if (open) bits.push(open + ' open');
    return bits.join(' · ');
  }

  LO.insight = { messages, truths, questions, snapshot, BANK };
})(window.LO);
