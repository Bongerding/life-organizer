/* ============================================================
   THE FIRST-STEP ENGINE
   Everything here exists to make starting cheaper than not
   starting. Rules the bank obeys:

   1. One action at a time. Choice is a procrastination surface.
   2. The ask is always smaller than the real task. Two minutes on
      the business, ten minutes on the bike, one text. The point is
      ignition, not completion.
   3. Permission to stop is built into every action. "You can turn
      around at the end of the road" is load-bearing copy.
   4. Nothing is offered twice in a day once it is done.
   5. What is actually overdue outranks what is merely available.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  const D = LO.D;

  function slot() {
    const h = new Date().getHours();
    return h < 11 ? 'morning' : h < 17 ? 'midday' : 'evening';
  }

  /* ------------------------------------------------------------
     Build every action that makes sense right now.
     Each: { id, kind, label, sub, minutes, weight, when, done(), tab }
     ------------------------------------------------------------ */
  function build(s) {
    const out = [];
    const push = o => out.push(o);
    const today = D.today();
    const st = LO.store;

    /* --- open loops: the single biggest procrastination lever --- */
    const open = s.mind.load
      .filter(l => l.status !== 'closed')
      .sort((a, b) => (+b.weight || 1) - (+a.weight || 1));

    if (open.length) {
      const l = open[0];
      push({
        id: 'loop_' + l.id, kind: 'close one loop', when: 'any', weight: 7, minutes: 2,
        label: l.title,
        sub: 'Two minutes on it. Not finished — moved. If two minutes gets it done, close it and take the win.',
        done() { st.patch('mind.load', l.id, { status: 'closed', closedOn: today }); }
      });
      if (open.length > 2) {
        const light = [...open].sort((a, b) => (+a.weight || 1) - (+b.weight || 1))[0];
        push({
          id: 'loop_light_' + light.id, kind: 'the easy one', when: 'any', weight: 4, minutes: 2,
          label: light.title,
          sub: 'The lightest thing on your list. Momentum is the only goal here.',
          done() { st.patch('mind.load', light.id, { status: 'closed', closedOn: today }); }
        });
      }
    } else {
      push({
        id: 'capture', kind: 'clear your head', when: 'any', weight: 5, minutes: 2,
        label: 'Empty your head onto the list',
        sub: 'Everything that is open, unfinished, or nagging. Do not solve any of it — writing it down is the whole task.',
        tab: 'loops'
      });
    }

    /* --- people: the antidote to years going by --- */
    const overdue = st.mostOverdue();
    if (overdue) {
      const d = st.daysSince(overdue);
      push({
        id: 'text_' + overdue.id, kind: 'one message', when: 'any', weight: 7, minutes: 2,
        label: 'Text ' + overdue.name,
        sub: (d > 300 ? 'It has been a long time.' : d + ' days since you spoke.') +
             ' "Hey, you crossed my mind — how are you?" is enough. It does not need to be clever.',
        done() { st.contacted(overdue.id); }
      });
    }
    if (s.people.length < 3) {
      push({
        id: 'add_people', kind: 'people', when: 'any', weight: 5, minutes: 2,
        label: 'Name the friends you refuse to lose',
        sub: 'Three names is enough to start. The app keeps the count so you never have to notice a year has gone by.',
        tab: 'people'
      });
    }
    const seeSoon = s.people.filter(p => st.daysSince(p) > 45);
    if (seeSoon.length) {
      const p = seeSoon[0];
      push({
        id: 'plan_see_' + p.id, kind: 'make a plan', when: 'evening', weight: 4, minutes: 3,
        label: 'Put a date in with ' + p.name,
        sub: 'Not "we should catch up". An actual day. Send one message with a day in it.',
        done() { st.contacted(p.id); }
      });
    }

    /* --- movement: the fastest route out of fog --- */
    const habit = name => s.habits.find(h => h.name === name);
    const doneToday = h => !!(h && h.log && h.log[today]);
    const strike = h => () => { if (!doneToday(h)) st.toggleHabit(h.id); };

    const cyc = habit('Cycle');
    if (cyc && !doneToday(cyc)) {
      const week = D.lastDays(7).filter(d => cyc.log && cyc.log[d]).length;
      push({
        id: 'cycle', kind: 'get on the bike', when: 'any', weight: 6 + (week < 2 ? 2 : 0), minutes: 10,
        label: 'Bicycle out. Ten minutes.',
        sub: 'You can turn around at the end of the road and it still counts. ' +
             (week ? week + ' ride' + (week === 1 ? '' : 's') + ' in the last week.' : 'Nothing logged this week yet.'),
        done: strike(cyc)
      });
    }

    const out5 = habit('Outside before noon');
    if (out5 && !doneToday(out5)) {
      push({
        id: 'outside', kind: 'light and air', when: 'morning', weight: 6, minutes: 5,
        label: 'Outside. Five minutes, no phone.',
        sub: 'Light early does more for the fog than anything you can think your way into.',
        done: strike(out5)
      });
    }

    /* --- the motorcycle: the thing he actually loves, so it gets tracked --- */
    const lastRide = s.wins.find(w => w.kind === 'ride');
    const sinceRide = lastRide ? D.daysBetween(lastRide.date, today) : 999;
    const ridingIsKnown = !!lastRide || /motorcycl/i.test(s.identity.northStar + ' ' + s.goals.map(g => g.title).join(' '));
    if (ridingIsKnown && sinceRide >= 5) {
      push({
        id: 'ride', kind: 'the good part', when: 'any', weight: sinceRide > 12 ? 9 : 6, minutes: 20,
        label: 'Get the motorcycle out',
        sub: (lastRide ? sinceRide + ' days since the last ride. ' : '') +
             'Twenty minutes, no destination. This is not a reward for finishing your list — it is the point of the list.',
        winKind: 'ride'
      });
    }

    /* --- deep work: two minutes, never "work on the business" --- */
    push({
      id: 'deepwork', kind: 'two minutes', when: 'midday', weight: 6, minutes: 2,
      label: 'Two minutes on meaningful work',
      sub: 'Open the file. Write one line. That is the entire task and you are allowed to stop after it.',
      winKind: 'craft'
    });
    push({
      id: 'unstick', kind: 'unstick it', when: 'any', weight: 4, minutes: 3,
      label: 'Send the thing you have been sitting on',
      sub: 'The half-formed version, sent today, beats the finished version you send next month.',
      winKind: 'craft'
    });

    /* --- clarity --- */
    const c = s.clarity;
    if (!c.clearSince && !c.uses.length) {
      push({
        id: 'clear_start', kind: 'day one', when: 'any', weight: 5, minutes: 2,
        label: 'Start the clear count',
        sub: 'No promises, no plan. Just a number that starts existing so the days stop being invisible.',
        tab: 'clear'
      });
    }
    /* --- state and record --- */
    const checked = s.mind.logs.some(r => r.date === today);
    if (!checked) {
      push({
        id: 'checkin', kind: 'thirty seconds', when: 'any', weight: 5, minutes: 1,
        label: 'How are you actually',
        sub: 'Four sliders. It takes half a minute and it is what makes the trend lines mean anything later.',
        sheet: 'checkin'
      });
    }
    const wroteToday = s.scribe.entries.some(e => e.date === today);
    if (!wroteToday && slot() === 'evening') {
      push({
        id: 'oneline', kind: 'one line', when: 'evening', weight: 5, minutes: 2,
        label: 'One line about today',
        sub: 'One sentence is a complete entry. This is how a year stops being a blur.',
        sheet: 'line'
      });
    }

    /* --- resets: cheap wins that break a stall --- */
    push({
      id: 'reset60', kind: 'sixty seconds', when: 'any', weight: 3, minutes: 1,
      label: 'Stand up and reset',
      sub: 'Up, shoulders back, thirty seconds of slow breathing, one glass of water. Physical first, thinking after.',
      winKind: 'reset'
    });
    push({
      id: 'surface', kind: 'one surface', when: 'any', weight: 3, minutes: 5,
      label: 'Clear one surface',
      sub: 'One desk, one counter, one seat. Visible order is the cheapest mental relief available to you.',
      winKind: 'order'
    });
    push({
      id: 'yes', kind: 'stay open', when: 'evening', weight: 3, minutes: 3,
      label: 'Say yes to one thing this week',
      sub: 'The ride-out, the dinner, the thing you would normally skip. Not searching — just being where people are.',
      winKind: 'people'
    });

    /* --- an untouched goal is a quiet source of guilt; make it a 2-minute ask --- */
    const stale = s.goals.filter(g => g.status === 'live' && !g.progress);
    if (stale.length) {
      const g = stale[Math.floor(Math.random() * stale.length)];
      push({
        id: 'goal_' + g.id, kind: 'first inch', when: 'any', weight: 4, minutes: 2,
        label: g.title,
        sub: 'Nothing logged against this yet. Two minutes on the smallest possible piece of it.',
        winKind: 'aim'
      });
    }

    return out;
  }

  /* ------------------------------------------------------------
     Pick one. Weighted by relevance and time of day, with
     anything already done today removed entirely.
     ------------------------------------------------------------ */
  function pick(s, avoidId) {
    const now = slot();
    const doneRefs = LO.store.winsOn().map(w => w.ref).filter(Boolean);

    const pool = build(s)
      .filter(a => !doneRefs.includes(a.id) && a.id !== avoidId)
      .map(a => {
        let w = (a.weight || 1) * LO.adaptive.weight(a, s);
        if (a.when === now) w *= 2;
        else if (a.when && a.when !== 'any') w *= 0.35;
        return { a, w };
      });

    if (!pool.length) {
      return {
        id: 'nothing', kind: 'nothing owed', minutes: 0,
        label: 'You are done for today',
        sub: 'Everything the system had for you is struck. Go and ride something.'
      };
    }

    const total = pool.reduce((x, y) => x + y.w, 0);
    let r = Math.random() * total;
    for (const x of pool) { r -= x.w; if (r <= 0) return x.a; }
    return pool[0].a;
  }

  /* the rumination interrupt — dealt by the "spinning" button, not the bank */
  const SPIN = {
    id: 'spin', kind: 'stop the spin', minutes: 2,
    label: 'Sort it, do not solve it',
    sub: 'The thought going round is either actionable or it is not, and you have not decided which. ' +
         'Decide now: if there is an action, write the smallest one and do it. If there is not, name it as ' +
         'not-actionable and go and move your body for two minutes. Rumination is a decision you keep deferring.',
    winKind: 'reset'
  };

  LO.actions = { build, pick, slot, SPIN };
})(window.LO);
