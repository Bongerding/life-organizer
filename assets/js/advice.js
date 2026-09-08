/* ============================================================
   ADVICE — daily and situational.

   Daily: one thing worth hearing today, chosen from what your own
   data says. Situational: you pick the state you are in and get a
   protocol, not a lecture. Three or four steps, all physical or
   written, nothing that requires you to feel differently first.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  const D = LO.D;
  const within = (date, n) => date && D.daysBetween(date, D.today()) < n;

  /* ------------------------------------------------------------
     SITUATIONS — the "I feel like this right now" menu.
     ------------------------------------------------------------ */
  const SITUATIONS = [
    {
      id: 'cant-start', label: "I can't get started", icon: '◔',
      what: 'Starting costs more than doing. Your brain is pricing the whole job instead of the first move.',
      steps: [
        'Shrink it until it sounds stupid. Two minutes, one line, one email.',
        'Set a timer for that amount and start badly.',
        'Stop when it goes off, even if you want to carry on.'
      ],
      after: 'You are allowed to stop. That is what makes it easy to start next time.',
      act: 'deepwork'
    },
    {
      id: 'spinning', label: "I can't stop thinking", icon: '◍',
      what: 'The thought is going round because you have not decided whether it is actionable. That decision is the loop.',
      steps: [
        'Write the thought down in one sentence.',
        'Decide now: is there an action or not?',
        'If yes, write the smallest one and do it today.',
        'If no, say "not actionable" out loud and move your body for two minutes.'
      ],
      after: 'Rumination is a decision you keep putting off. Make it and the loop closes.'
    },
    {
      id: 'urge', label: 'I want to smoke', icon: '◌',
      what: 'The urge is a wave. It peaks around ten minutes and drops whether you feed it or not.',
      steps: [
        'Leave the room you are in.',
        'Drink a full glass of water.',
        'Ten minutes of anything physical. Walk, stairs, tidy.',
        'Then decide again, on the other side of the peak.'
      ],
      after: 'Do not argue with it in your head. You lose that argument. Change what your body is doing.',
      go: 'ignition'
    },
    {
      id: 'overwhelmed', label: 'Too much at once', icon: '◈',
      what: 'Overwhelm is a list problem wearing an emotion. Nothing has a size yet, so everything feels the same size.',
      steps: [
        'Write every open thing down. No solving.',
        'Circle three. Cross out the rest for this week.',
        'Do the smallest of the three now.'
      ],
      after: 'Three things done beats seven kept alive.',
      go: 'write'
    },
    {
      id: 'avoiding', label: "I'm avoiding something", icon: '◑',
      what: 'You know exactly what it is. It came to mind reading this. Avoidance is not free, you are paying attention rent on it.',
      steps: [
        'Name it in writing.',
        'Write the actual worst case, in full.',
        'Do the first two minutes of it, or decide out loud to drop it.'
      ],
      after: 'Either way the loop shuts and the attention comes back.'
    },
    {
      id: 'flat', label: 'I feel flat', icon: '◎',
      what: 'Flat is usually physical before it is emotional. Light, movement and food come before motivation, not after.',
      steps: [
        'Outside for five minutes. No phone.',
        'Water, then something with protein in it.',
        'One small thing you can finish, so the day has a win in it.'
      ],
      after: 'Do not try to think your way out of a body problem.',
      act: 'outside'
    },
    {
      id: 'anxious', label: 'I feel anxious', icon: '◉',
      what: 'Your body is braced for something. It will not stand down because you told it to.',
      steps: [
        'Slow the out-breath. Six seconds out, four in, ten rounds.',
        'Name the actual thing you are worried about, in writing.',
        'Sort it: mine to act on, mine to accept, or not mine.',
        'Act on your share only.'
      ],
      after: 'Most anxiety is misfiled ownership. Sorting it makes your share accurate, not smaller.'
    },
    {
      id: 'angry', label: "I'm angry", icon: '◭',
      what: 'The surge is not the problem. What you do in the next sixty seconds is.',
      steps: [
        'Say nothing for one minute. Nothing.',
        'Move: walk outside, up the stairs, anything.',
        'Write what you actually wanted to say, and do not send it.',
        'Decide in an hour whether it still needs saying.'
      ],
      after: 'You cannot control the surge, only the gap after it.'
    },
    {
      id: 'cant-sleep', label: "I can't sleep", icon: '◐',
      what: 'Lying there problem-solving trains your brain to treat bed as a thinking place.',
      steps: [
        'Get up. Low light, another room.',
        'Write down whatever is circling. All of it.',
        'Something dull for twenty minutes. No screens.',
        'Back to bed when you are actually sleepy.'
      ],
      after: 'The list on paper does the holding so you do not have to.'
    },
    {
      id: 'lonely', label: 'I feel lonely', icon: '◇',
      what: 'This one has a direct fix and it is usually one message away. The reason you have not sent it is inertia, not judgement.',
      steps: [
        'Pick the person you have not spoken to in longest.',
        'Send something short. "You crossed my mind, how are you?" is enough.',
        'If they answer, suggest an actual day.'
      ],
      after: 'Almost every close friendship you have exists because somebody went first.',
      go: 'me'
    },
    {
      id: 'behind', label: 'I feel behind', icon: '◒',
      what: 'Behind compared to what? The feeling is usually comparison, not arithmetic.',
      steps: [
        'Write what you have actually done in the last month. Check the record if you cannot remember.',
        'Write the one thing that would matter most in the next month.',
        'Put the first step of it in today.'
      ],
      after: 'You are not behind. You are undocumented, which feels the same.',
      go: 'write'
    },
    {
      id: 'no-point', label: "What's the point", icon: '◊',
      what: 'This shows up when the days stop connecting to anything you chose. It is a direction problem, not a character one.',
      steps: [
        'Read your north star. Change it if it has stopped being true.',
        'Name one thing this week that would be yours, not anyone else\'s.',
        'Do a small piece of it today.'
      ],
      after: 'Meaning follows movement more reliably than movement follows meaning.',
      go: 'me'
    }
  ];

  /* ------------------------------------------------------------
     DAILY — one thing worth hearing, picked for the day you are in.
     `when` gates it on your data. Ranked; highest applicable wins,
     with the date rotating between equals so it is not the same
     line every morning.
     ------------------------------------------------------------ */
  const DAILY = [
    { id: 'ride-overdue', rank: 9,
      when: s => { const d = sinceRide(s); return d !== null && d >= 10; },
      title: 'Put a ride in this week',
      body: s => 'It has been ' + sinceRide(s) + ' days. Motorcycling is not the reward for clearing your list, it is the reason for having one.' },

    { id: 'ride-none', rank: 8,
      when: s => sinceRide(s) === null,
      title: 'Log a ride',
      body: 'Nothing on the board for the motorcycle yet. Take it out this week and mark it, so the thing you actually love gets counted.' },

    { id: 'clear-streak', rank: 9,
      when: s => { const d = LO.store.daysClear(); return d !== null && d >= 7; },
      title: 'Protect the streak, not the mood',
      body: s => LO.store.daysClear() + ' days clear. On the day it gets hard, you only have to get through the evening, not the rest of your life.' },

    { id: 'after-use', rank: 10,
      when: s => s.clarity.uses[0] && within(s.clarity.uses[0].date, 2),
      title: 'One day does not undo a month',
      body: 'The count restarted. Your best run is still on the board and every urge you rode out still happened. Tomorrow is day one, and that is all it is.' },

    { id: 'fog', rank: 8,
      when: s => avgOf(s, 'clarity', 6) !== null && avgOf(s, 'clarity', 6) <= 4.3,
      title: 'Treat the fog as physical',
      body: 'Your clarity has been low all week. Light, movement and water do more for this than any decision you could make about it.' },

    { id: 'loops', rank: 7,
      when: s => LO.store.tasks().length >= 7,
      title: 'The list is the noise',
      body: s => LO.store.tasks().length + ' things are open. Close three small ones today. Volume matters more than importance here.' },

    { id: 'friend', rank: 7,
      when: s => !!LO.store.mostOverdue(),
      title: 'Send one message',
      body: s => { const p = LO.store.mostOverdue(); return 'It has been a while with ' + p.name + '. Short is fine. Going first is the whole skill.'; } },

    { id: 'aim-stale', rank: 6,
      when: s => s.goals.some(g => g.status === 'live' && !g.progress && D.daysBetween(g.created, D.today()) > 14),
      title: 'Give one aim a first inch',
      body: 'Something you set has had nothing logged against it. Two minutes on the smallest piece counts, and it stops the guilt compounding.' },

    { id: 'streak-good', rank: 6,
      when: s => LO.store.winStreak() >= 5,
      title: 'You have proof now',
      body: s => LO.store.winStreak() + ' days of starting something. On the days it feels impossible, that number is the argument.' },

    { id: 'nothing-today', rank: 5,
      when: s => !LO.store.winsOn().length,
      title: 'One thing is the target',
      body: 'Not a productive day. One. Pick the smallest thing on the Do tab and set the timer.' },

    { id: 'floor', rank: 4, when: () => true,
      title: 'Set the floor, not the ceiling',
      body: 'Decide the smallest version you will still do on your worst day this week. A floor you never break beats a ceiling you touch occasionally.' },

    { id: 'friction', rank: 4, when: () => true,
      title: 'Move the friction, not the willpower',
      body: 'Take one step out of something you want to do, and add one to something you do not. Kit by the door. Phone in another room.' },

    { id: 'vote', rank: 4, when: () => true,
      title: 'Every action is a vote',
      body: 'You are not trying to be perfect, you are trying to win the count. One vote today for the version of you that rides and builds.' },

    { id: 'two-min', rank: 4, when: () => true,
      title: 'Two minutes is a real unit',
      body: 'Anything you have been putting off has a two-minute version. Open the file. Write the first line. Send the half-formed message.' },

    { id: 'body-first', rank: 4, when: () => true,
      title: 'Body before brain',
      body: 'When the day is going badly, change what your body is doing before you try to change what you are thinking.' },

    { id: 'capture', rank: 4, when: () => true,
      title: 'Write it down, do not carry it',
      body: 'An open loop costs more in your head than on a list. Use the Write tab as the release valve, then close them in batches.' },

    { id: 'boring', rank: 4, when: () => true,
      title: 'This is the boring middle',
      body: 'The stretch where the novelty is gone is where the compounding actually happens. Nothing here needs to feel exciting to work.' },

    { id: 'ask', rank: 4, when: () => true,
      title: 'Make the ask cleanly',
      body: 'Anything you want that needs someone to say yes: one sentence, no apology, no pre-emptive discount. Most people never ask and call it a no.' },

    { id: 'people-first', rank: 4, when: () => true,
      title: 'Go first',
      body: 'Someone would be glad to hear from you today and the only reason you have not messaged is inertia. Fix that in thirty seconds.' },

    { id: 'record', rank: 4, when: () => true,
      title: 'Write one line a day',
      body: 'A year is a blur without a record. One sentence in the Write tab is enough to make this stretch of your life findable later.' }
  ];

  function today(s) {
    const pool = DAILY.filter(a => { try { return a.when(s); } catch (e) { return false; } });
    if (!pool.length) return null;
    const top = Math.max.apply(null, pool.map(a => a.rank));
    const best = pool.filter(a => a.rank === top);
    const n = Math.floor(Date.now() / 86400000);
    const pick = best[n % best.length];
    return {
      id: pick.id,
      title: pick.title,
      body: typeof pick.body === 'function' ? pick.body(s) : pick.body,
      act: pick.act, go: pick.go
    };
  }

  function situation(id) { return SITUATIONS.find(x => x.id === id); }

  /* helpers */
  function sinceRide(s) {
    const r = s.wins.find(w => w.kind === 'ride');
    return r ? D.daysBetween(r.date, D.today()) : null;
  }
  function avgOf(s, key, days) {
    const rows = s.mind.logs.filter(r => within(r.date, days));
    if (rows.length < 3) return null;
    return rows.reduce((a, r) => a + (+r[key] || 0), 0) / rows.length;
  }

  LO.advice = { SITUATIONS, DAILY, today, situation };
})(window.LO);
