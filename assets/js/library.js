/* ============================================================
   LIBRARY — reference data, not user data.
   Drill bank (the reprogramming situations), prompt bank,
   domain + trait taxonomies. Kept in JS rather than fetched
   JSON so the app runs straight off the filesystem.
   Mirror copies live in /data for the future API.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  LO.lib = {

    /* domains tag every record so the trajectory engine can slice by area of life */
    domains: [
      { id: 'body',     label: 'Body',     accent: 'var(--c-vessel)' },
      { id: 'mind',     label: 'Mind',     accent: 'var(--c-mind)' },
      { id: 'craft',    label: 'Craft',    accent: 'var(--c-compass)' },
      { id: 'wealth',   label: 'Wealth',   accent: 'var(--c-forge)' },
      { id: 'people',   label: 'People',   accent: 'var(--c-rewire)' },
      { id: 'spirit',   label: 'Spirit',   accent: 'var(--c-rhythm)' },
      { id: 'order',    label: 'Order',    accent: 'var(--c-scribe)' }
    ],

    horizons: [
      { id: 'lifetime', label: 'Lifetime' },
      { id: 'decade',   label: '10 Year' },
      { id: 'year',     label: '1 Year' },
      { id: 'quarter',  label: '90 Day' },
      { id: 'week',     label: 'This Week' }
    ],

    /* traits are the axes you can be reprogrammed along */
    traits: [
      { id: 'discipline', label: 'Discipline', line: 'Acting from decision, not from mood.' },
      { id: 'focus',      label: 'Focus',      line: 'One thing, all the way down.' },
      { id: 'courage',    label: 'Courage',    line: 'Moving toward the thing that tightens your chest.' },
      { id: 'calm',       label: 'Calm',       line: 'Slack in the system before the pressure arrives.' },
      { id: 'presence',   label: 'Presence',   line: 'Being where your body is.' },
      { id: 'identity',   label: 'Identity',   line: 'Becoming the person for whom this is normal.' },
      { id: 'connection', label: 'Connection', line: 'Going first, staying open.' },
      { id: 'drive',      label: 'Drive',      line: 'Wanting it on the days it is boring.' }
    ],

    /* ------------------------------------------------------------
       DRILL BANK
       Each drill is a *situation* — something to run, not read.
       kind: rehearsal | reframe | intention | exposure | rep | audit | projection
       ------------------------------------------------------------ */
    drills: [
      { id: 'd01', trait: 'discipline', kind: 'rehearsal', title: 'The 6am Fork',
        situation: 'It is tomorrow morning. The alarm goes. The room is cold, the bed is warm, and there is a completely reasonable argument available to you for staying in it. Run the next ninety seconds in full detail: the sound, the cold air, your feet hitting the floor, the first thing your hands do.',
        ask: 'Write the exact physical sequence you will execute before your brain gets a vote.',
        reinforce: 'You just rehearsed the win. Decisions made in advance are cheap; decisions made in the moment cost everything. Tomorrow you are not choosing — you are executing.' },

      { id: 'd02', trait: 'discipline', kind: 'projection', title: 'Two Trajectories',
        situation: 'Take the one habit you keep negotiating with. Project it five years forward at your current adherence rate. Now project it five years forward at 90%. Two different people walk out of that projection.',
        ask: 'Describe both versions of yourself at five years. Be specific about body, money, and who is still around you.',
        reinforce: 'The gap you just described is not motivational fluff — it is arithmetic. Nothing about today feels heavy enough to matter, which is exactly why it does.' },

      { id: 'd03', trait: 'focus', kind: 'intention', title: 'If-Then Armour',
        situation: 'Name the single most common thing that pulls you off the work — the phone, the tab, the person, the snack, the sudden urge to reorganise something.',
        ask: 'Write it as: "If [trigger] happens, then I will [precise replacement action]." One line. No hedging.',
        reinforce: 'Implementation intentions outperform willpower because they move the choice out of the moment and into the plan. You now have a pre-loaded response instead of a fight.' },

      { id: 'd04', trait: 'focus', kind: 'rep', title: 'Single Thread',
        situation: 'For the next work block, only one thread exists. Everything else — every idea, every task that surfaces — gets written on a capture list and abandoned immediately, without evaluation.',
        ask: 'Name the one thread. Then name what you are explicitly refusing to touch until it is done.',
        reinforce: 'Focus is not the ability to concentrate. It is the willingness to let good things go unattended. You just practised letting go.' },

      { id: 'd05', trait: 'courage', kind: 'exposure', title: 'The Message You Are Not Sending',
        situation: 'There is a message, a call, or an ask you have been carrying. You know the one — it surfaced the moment you read this sentence. It has been costing you rent-free attention for days or years.',
        ask: 'Draft it here in full. Then decide: send it today, or consciously release it. No third option.',
        reinforce: 'Avoidance is not free — you have been paying for it in background CPU. Whichever you chose, the loop closes and the attention comes back to you.' },

      { id: 'd06', trait: 'courage', kind: 'reframe', title: 'Fear as Direction',
        situation: 'Something in your life is going untouched because it might not work. Put it in front of you.',
        ask: 'Finish these: "If this fails, the actual worst case is ___." "If I never try, in ten years I will ___." "The smallest version I could start this week is ___."',
        reinforce: 'You just converted a vague dread into a bounded cost and a first move. Fear that has been measured stops being fear and becomes a variable.' },

      { id: 'd07', trait: 'calm', kind: 'rehearsal', title: 'The Pause Before the Reaction',
        situation: 'Replay the last time you reacted in a way you did not respect — the flash of heat, the sharp reply, the shut-down. Freeze it one second before you moved.',
        ask: 'What did your body do first? Write the physical tell, then write the one breath and the one sentence you will use next time instead.',
        reinforce: 'You cannot control the surge, only the gap after it. Naming your physical tell gives you an early-warning system your reaction does not know about.' },

      { id: 'd08', trait: 'calm', kind: 'audit', title: 'Load Inventory',
        situation: 'Your mind is currently holding a set of unfinished things. They are not urgent, but they are all switched on, drawing power. Everything that is open, waiting on you, or unresolved.',
        ask: 'List every open loop you can feel right now. Do not solve them. Just get them out where you can see them.',
        reinforce: 'Open loops cost more in your head than on paper. What you just wrote is no longer a mood — it is a list, and lists can be closed.' },

      { id: 'd09', trait: 'presence', kind: 'rep', title: 'Sixty Seconds of Where You Are',
        situation: 'Stop. One minute, no input. Five things you can see, four you can hear, three you can feel, two you can smell, one thing your body is asking for.',
        ask: 'Write what your body was asking for. It usually knows before you do.',
        reinforce: 'Attention is the only real currency you spend. That minute was yours, in full, and you can take another one whenever you decide to.' },

      { id: 'd10', trait: 'presence', kind: 'reframe', title: 'The Person In Front Of You',
        situation: 'Next conversation today: no phone in sight, no thinking about your reply while they talk, no steering it back to you. You are only listening for what they actually mean.',
        ask: 'Afterwards — what did you notice that you would normally have missed?',
        reinforce: 'Presence is the rarest thing you can give someone, and people remember it far longer than anything you said.' },

      { id: 'd11', trait: 'identity', kind: 'rep', title: 'I Am The Kind Of Person Who',
        situation: 'Behaviour follows identity, not the other way around. You do not become disciplined by acting disciplined — you act disciplined once the label is load-bearing.',
        ask: 'Write three sentences starting "I am the kind of person who..." — each one already true, and each one slightly bigger than yesterday.',
        reinforce: 'You just moved a claim from aspiration to inventory. Say these out loud on the days you do not believe them; that is when they do their work.' },

      { id: 'd12', trait: 'identity', kind: 'audit', title: 'The Pattern Being Retired',
        situation: 'Name one pattern you are done with. Not the behaviour — the story underneath it that made the behaviour make sense.',
        ask: 'Write: "The old story was ___. It protected me from ___. The new story is ___."',
        reinforce: 'Old patterns are not stupidity, they are outdated protection. Thanking one and replacing it works far better than fighting it.' },

      { id: 'd13', trait: 'connection', kind: 'exposure', title: 'Go First',
        situation: 'Someone in your life would be genuinely glad to hear from you today, and there is no reason you have not reached out other than inertia.',
        ask: 'Who, and what are you sending? Write it, then send it before you close this.',
        reinforce: 'Almost every strong relationship in your life exists because somebody went first. Being the one who goes first is a decision, not a personality trait.' },

      { id: 'd14', trait: 'connection', kind: 'reframe', title: 'The Uncharitable Read',
        situation: 'Think of someone who irritated you this week. You are running an interpretation of their behaviour, and you have no evidence it is the correct one.',
        ask: 'Write the most generous reading of what they did that is still consistent with the facts.',
        reinforce: 'You are not doing this for them. Resentment is a tax you pay on their behalf, and the generous read is the cheapest way to stop paying it.' },

      { id: 'd15', trait: 'drive', kind: 'projection', title: 'The Boring Middle',
        situation: 'The launch energy is gone. The novelty has worn off. This is the stretch where almost everyone quietly stops, and where all the compounding actually happens.',
        ask: 'What is the minimum version you will still hit on the worst day of this week? Set the floor, not the ceiling.',
        reinforce: 'Consistency is not built on great days. A floor you never break beats a ceiling you occasionally touch.' },

      { id: 'd16', trait: 'drive', kind: 'reframe', title: 'Want vs Should',
        situation: 'Look at your goal list. At least one of those goals is not yours — it was inherited, absorbed, or adopted to impress someone.',
        ask: 'Which one, and whose voice is it in? Keep it, rewrite it, or kill it. Decide now.',
        reinforce: 'Motivation problems are usually alignment problems wearing a disguise. Goals you actually want do not need to be forced.' },

      { id: 'd17', trait: 'discipline', kind: 'intention', title: 'Friction Engineering',
        situation: 'Willpower is a bad long-term strategy. Environment is a good one. Look at the behaviour you are trying to install and the one you are trying to kill.',
        ask: 'Name one piece of friction you will remove from the good behaviour, and one you will add to the bad one. Physical changes only.',
        reinforce: 'You just stopped relying on a future version of yourself who is stronger than you. Environment holds when motivation does not.' },

      { id: 'd18', trait: 'focus', kind: 'audit', title: 'Attention Forensics',
        situation: 'Yesterday had roughly sixteen waking hours in it. You can probably account for eight.',
        ask: 'Where did the untracked hours go? Name the sink honestly, and what it was giving you.',
        reinforce: 'Time sinks are almost always meeting a real need badly. Name the need and you can meet it deliberately instead of by default.' },

      { id: 'd19', trait: 'calm', kind: 'rehearsal', title: 'Pre-Mortem on a Bad Day',
        situation: 'A day this week is going to go wrong — sleep, stress, an interruption, bad news. Assume it will.',
        ask: 'Write your bad-day protocol: the three things you still do, and the one thing you give yourself permission to drop.',
        reinforce: 'People do not fail on good days. Having a pre-decided bad-day floor is the difference between a dip and a derailment.' },

      { id: 'd20', trait: 'identity', kind: 'rehearsal', title: 'Five Years, Backwards',
        situation: 'It is five years from today and things went extraordinarily well. You are describing this stretch of your life to someone who was not there.',
        ask: 'Write that description in past tense. What did you start doing, in the year that turned it?',
        reinforce: 'Working backwards from a finished future exposes the first move more reliably than planning forwards from now. You just found it.' },

      { id: 'd21', trait: 'presence', kind: 'audit', title: 'Body Check',
        situation: 'Right now, without adjusting anything: jaw, shoulders, breath, gut, hands.',
        ask: 'What is tight, and what has it been tight about?',
        reinforce: 'Your body files the things your mind has decided not to deal with. It is the most honest instrument you own.' },

      { id: 'd22', trait: 'courage', kind: 'intention', title: 'The Ask',
        situation: 'There is something you want that requires another person to say yes — a rate, a role, a favour, a boundary, a relationship.',
        ask: 'Write the ask in one clean sentence, with no apology and no pre-emptive discount.',
        reinforce: 'Most people never ask, and then conclude the answer was no. A clean ask with no apology in it is asymmetric: cheap to make, large to win.' },

      { id: 'd23', trait: 'connection', kind: 'rep', title: 'Specific Praise',
        situation: 'Someone near you did something well recently and nobody mentioned it.',
        ask: 'Tell them, specifically — the exact thing, and the exact effect it had. Vague praise does not land; specific praise rewires.',
        reinforce: 'You just reinforced a behaviour in someone else and practised noticing. Both compound.' },

      { id: 'd24', trait: 'drive', kind: 'audit', title: 'The Bottleneck',
        situation: 'Progress on your main goal is limited by exactly one thing right now. Everything else is noise you are using to feel busy.',
        ask: 'Name the single bottleneck, and the next physical action against it.',
        reinforce: 'Systems move at the speed of their constraint. Working on anything else feels like effort and produces nothing.' },

      { id: 'd25', trait: 'discipline', kind: 'rep', title: 'The Vote',
        situation: 'Every action today was a vote for a version of you. Some were votes for who you are becoming; some were votes for who you were.',
        ask: 'Count today honestly. How did the vote go, and what is the first vote you cast tomorrow?',
        reinforce: 'No single vote decides it, and no single vote is wasted. You are not trying to be perfect — you are trying to win the count.' },

      { id: 'd26', trait: 'calm', kind: 'reframe', title: 'Is This Mine',
        situation: 'Something is sitting on you that you have been carrying as though it were yours to solve.',
        ask: 'Sort it: mine to act on, mine to accept, or not mine at all. Then act accordingly.',
        reinforce: 'Most stress is misfiled ownership. Sorting it does not make the situation smaller — it makes your share of it accurate.' },

      { id: 'd27', trait: 'focus', kind: 'projection', title: 'The Cost of the Fifth Thing',
        situation: 'You are running several projects at once. Adding one more feels free. It is not — it is paid for out of every other one.',
        ask: 'List everything live right now. Cut it to three. Write what happens to the rest: parked, delegated, or dead.',
        reinforce: 'Three things done well beats seven things kept alive. Parking something is not failure; it is arithmetic honestly applied.' },

      { id: 'd28', trait: 'identity', kind: 'projection', title: 'The Standard, Not the Mood',
        situation: 'You have a standard for your work and your body that you hit when you feel good, and abandon when you do not. That makes it a mood, not a standard.',
        ask: 'Write the version of your standard that survives a bad mood. That is the real one.',
        reinforce: 'A standard that only holds on good days is a preference. What you just wrote is the line that actually defines you.' }
    ],

    /* ------------------------------------------------------------ */
    prompts: [
      'What is the truest thing about today that I have not said out loud?',
      'Where did I act from my values today, and where did I act from fear?',
      'What am I pretending not to know?',
      'What did I avoid today, and what was it protecting me from?',
      'Who did I make better today?',
      'If today repeated for a year, where would it deposit me?',
      'What drained me that I could remove, and what filled me that I could double?',
      'What did I learn about how I actually work?',
      'What am I holding that is not mine to carry?',
      'What would the version of me I am building have done differently today?',
      'What went right that I have not given myself credit for?',
      'What is the one loop I could close tomorrow that would free the most attention?',
      'What did my body tell me today that I overrode?',
      'What am I grateful for that I would miss badly if it went?',
      'Where am I settling because the ceiling feels far away?',
      'What conversation am I overdue for?',
      'What is the smallest possible next move on the thing that matters most?',
      'What did I do today only because someone else expected it?',
      'What would I do this week if I were not afraid of it going badly?',
      'What is working so well that I should protect it deliberately?'
    ],

    valueWords: ['Discipline','Freedom','Mastery','Health','Family','Truth','Courage','Growth','Service',
      'Creation','Stillness','Loyalty','Curiosity','Strength','Integrity','Adventure','Wealth','Presence',
      'Independence','Craft','Legacy','Play','Order','Compassion']
  };
})(window.LO);
