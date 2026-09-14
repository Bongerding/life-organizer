/* ============================================================
   REFLECTIONS — the questions that are not about your data.

   The Mirror's observations are claims: they carry a number and
   they are about you, so they can only exist once the record has
   earned them. These are the other half. A question asserts
   nothing, so a good one does not need evidence — but it does need
   a reason to exist, and the reason is the idea underneath it.

   So every entry names its idea. The frame is a description of a
   concept, never a claim about him: "psychologists call this X",
   not "you are doing X". That distinction is the whole reason this
   can sit in a product whose first rule is that nothing is
   asserted without the figure that earns it.

   Where a named researcher is given, it is because the attribution
   is solid. Where an idea is folklore, or contested, or I am not
   certain who first said it, it is described without a name rather
   than dressed up with a false one — the same rule the quote bank
   follows.

   These are meant to be hard. A question you can answer in four
   words was not worth asking.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  /* Gates. A question about the people you keep is noise if you have
     not told it about anybody; one about staying clear is worse than
     noise if that is not what you are here for. */
  const has = {
    people:  s => s.people.length > 0,
    clarity: s => !!s.clarity.clearSince || s.clarity.uses.length > 0 || s.clarity.urges.length > 0,
    goals:   s => s.goals.some(g => g.status !== 'parked'),
    habits:  s => s.habits.length > 0,
    written: s => s.scribe.entries.length >= 3,
    aWhile:  s => LO.D.daysBetween(s.meta.created, LO.D.today()) >= 10
  };

  const REFLECTIONS = [

    /* ---------------- starting, and what resistance is ---------------- */
    { id: 'r_activation', theme: 'Starting',
      frame: 'Behavioural activation reverses the usual order: action first, motivation second.',
      q: 'Think of the last thing you did while still not wanting to do it. What got your body moving before your mind agreed?' },
    { id: 'r_first_move', theme: 'Starting',
      frame: 'Resistance tends to sit on the first physical move, not on the task.',
      q: 'Take something you have been putting off. What is the literal first movement — the hand, the door, the file — and what makes that specific movement unpleasant?' },
    { id: 'r_zeigarnik', theme: 'Starting',
      frame: 'Bluma Zeigarnik found that unfinished tasks stay active in the mind in a way finished ones do not.',
      q: 'What unfinished thing is quietly taking up room in your head right now, and what would "finished enough" actually look like for it?' },
    { id: 'r_parkinson', theme: 'Starting',
      frame: 'Parkinson observed that work expands to fill the time available to it.',
      q: 'What are you currently giving more time than it needs, and what is not getting that time instead?' },
    { id: 'r_two_min', theme: 'Starting',
      frame: 'Some tasks are not hard, only undefined — the cost is deciding, not doing.',
      q: 'Which of the things on your list is genuinely difficult, and which are just still vague? Name one of each.' },
    { id: 'r_start_cost', theme: 'Starting',
      frame: 'Starting and continuing cost different amounts; most people only budget for the second.',
      q: 'What do you find easy to continue once begun, and how long is the gap between deciding to begin and beginning?' },

    /* ---------------- identity ---------------- */
    { id: 'r_identity_vote', theme: 'Identity',
      frame: 'One way to read a habit is as evidence — each repetition is a small vote for who you take yourself to be.',
      q: 'Which of your current routines is voting for someone you do not want to become?' },
    { id: 'r_mindset', theme: 'Identity',
      frame: 'Carol Dweck distinguished believing ability is fixed from believing it is built.',
      q: 'Name something you have decided you are simply "not good at". What evidence did you actually gather before deciding that?' },
    { id: 'r_narrative', theme: 'Identity',
      frame: 'Dan McAdams describes identity as the story a person tells about how they got here.',
      q: 'What is the story you tell about why your life looks the way it does? Who is the main character — you, or circumstances?' },
    { id: 'r_old_story', theme: 'Identity', when: has.aWhile,
      frame: 'Self-descriptions outlive the facts that produced them.',
      q: 'What do you still say about yourself that was true five years ago and is not quite true now?' },
    { id: 'r_best_self', theme: 'Identity',
      frame: 'People are usually more specific about who they do not want to be than who they do.',
      q: 'Describe the version of you that you would be relieved to become. Not impressive — relieved. What is he doing on a Tuesday?' },
    { id: 'r_self_efficacy', theme: 'Identity',
      frame: 'Bandura called the belief that your actions produce results self-efficacy, and found it predicts persistence.',
      q: 'Where in your life do you genuinely believe effort pays, and where do you secretly suspect it does not?' },

    /* ---------------- control ---------------- */
    { id: 'r_dichotomy', theme: 'Control',
      frame: 'The Stoics split everything into what is up to you and what is not, and said suffering lives in the confusion.',
      q: 'What are you currently spending worry on that you have no power over? What is the nearest thing to it that you do control?' },
    { id: 'r_locus', theme: 'Control',
      frame: 'Rotter described locus of control: whether outcomes feel caused by you or by the world.',
      q: 'Think of a recent thing that went badly. How much of it was actually yours, honestly — not generously, and not harshly?' },
    { id: 'r_blame', theme: 'Control',
      frame: 'Attributing our own failures to circumstance and other people’s to character is one of the best-documented biases there is.',
      q: 'Who have you been explaining away as "just like that"? What circumstance might you be leaving out?' },
    { id: 'r_influence', theme: 'Control',
      frame: 'Between no control and full control there is a wide band of influence, which is where most real life happens.',
      q: 'Name something you cannot control but can influence. What is the influence you are not currently using?' },

    /* ---------------- avoidance ---------------- */
    { id: 'r_ironic', theme: 'Avoidance',
      frame: 'Wegner showed that trying not to think about something reliably keeps it present.',
      q: 'What are you working hardest not to think about? What happens if you give it ten deliberate minutes instead of a day of leaking?' },
    { id: 'r_avoid_shape', theme: 'Avoidance',
      frame: 'Avoidance rarely looks like avoidance. It usually looks like being busy with something defensible.',
      q: 'What useful-looking thing do you reach for when you are dodging something harder?' },
    { id: 'r_worst_case', theme: 'Avoidance',
      frame: 'Naming the feared outcome in full tends to shrink it; leaving it vague keeps it large.',
      q: 'Take the thing you are avoiding. What is the actual worst realistic outcome, written out in full, and could you live through it?' },
    { id: 'r_approach', theme: 'Avoidance',
      frame: 'Goals framed as moving toward something behave differently from goals framed as escaping something.',
      q: 'Is what you are working on now a thing you want, or a thing you are trying to get away from? Say it both ways and see which is true.' },
    { id: 'r_avoid_person', theme: 'Avoidance', when: has.people,
      frame: 'Unhad conversations accumulate interest.',
      q: 'Which conversation are you not having? What are you protecting by not having it?' },

    /* ---------------- values and shoulds ---------------- */
    { id: 'r_should', theme: 'Values',
      frame: 'Deci and Ryan separate motivation you own from motivation you have swallowed from elsewhere.',
      q: 'Which of your current goals would you drop tomorrow if nobody ever found out? What does that tell you about whose goal it is?' },
    { id: 'r_values_goals', theme: 'Values',
      frame: 'A goal can be completed; a value can only be moved toward. Confusing the two produces a finished life with nothing in it.',
      q: 'What direction do you want your life pointing, independent of whether you ever arrive?' },
    { id: 'r_cost_of_yes', theme: 'Values',
      frame: 'Every yes is a no to everything that would have occupied the same hours.',
      q: 'What did you say yes to recently, and what did it quietly cost you? Was that trade one you would make again?' },
    { id: 'r_dissonance', theme: 'Values',
      frame: 'Festinger described the discomfort of holding a belief and acting against it — and how readily we change the belief instead of the act.',
      q: 'Where are you currently arguing yourself into being fine with something you would once have refused?' },
    { id: 'r_admire', theme: 'Values',
      frame: 'What we admire in other people is often a description of what we are not doing.',
      q: 'Who do you quietly admire, and what specifically do they do that you do not?' },

    /* ---------------- time ---------------- */
    { id: 'r_discounting', theme: 'Time',
      frame: 'We discount future rewards steeply, which is why tomorrow’s benefit loses to tonight’s comfort.',
      q: 'What does tonight’s version of you regularly take from next month’s version? What would a fair deal between them look like?' },
    { id: 'r_planning', theme: 'Time',
      frame: 'Kahneman and Tversky named the planning fallacy: we underestimate our own timelines even when we know better.',
      q: 'What did you last think would take an afternoon? What did it actually take, and what did you not account for?' },
    { id: 'r_regret', theme: 'Time',
      frame: 'Gilovich and Medvec found that regret over time shifts from things done to things not done.',
      q: 'What will you regret not having tried? Not the grand version — the next available version of it.' },
    { id: 'r_decade', theme: 'Time',
      frame: 'We overestimate a year and underestimate a decade.',
      q: 'If the next ten years were the same as the last ten, what would you most want to have changed? What is the first month of that?' },
    { id: 'r_sunk', theme: 'Time',
      frame: 'Time already spent is gone whether or not you spend more after it.',
      q: 'What are you continuing mainly because you have already put so much into it?' },
    { id: 'r_ordinary_day', theme: 'Time',
      frame: 'A life is mostly made of ordinary days rather than decisive ones.',
      q: 'Describe your ordinary Wednesday honestly. Is that the life you think you are building?' },

    /* ---------------- craving and habit ---------------- */
    { id: 'r_urge_wave', theme: 'Craving', when: has.clarity,
      frame: 'Marlatt taught urge surfing: treating a craving as a wave that peaks and falls rather than a command.',
      q: 'How long does the wave actually last for you, from first pull to it passing? What have you been doing in that gap?' },
    { id: 'r_cue', theme: 'Craving',
      frame: 'Habits run on cues — a time, a place, a feeling, a person — more than on decisions.',
      q: 'What reliably comes immediately before the thing you want to stop? Be specific about the minute before, not the hour.' },
    { id: 'r_reward', theme: 'Craving',
      frame: 'A habit persists because it pays something, even when it costs more than it pays.',
      q: 'What does the habit you want rid of actually give you? What else could pay the same thing?' },
    { id: 'r_environment', theme: 'Craving',
      frame: 'Changing the surroundings tends to outperform trying harder in them.',
      q: 'What one change to your rooms, phone or route would make the thing you want to stop measurably more awkward?' },
    { id: 'r_ulysses', theme: 'Craving',
      frame: 'A Ulysses contract is a decision made in advance, binding the version of you that will want to renege.',
      q: 'What could you decide now — while calm — that would take the choice away from you later tonight?' },
    { id: 'r_substitute', theme: 'Craving', when: has.clarity,
      frame: 'Removing a behaviour leaves a hole shaped exactly like the hour it used to fill.',
      q: 'What actually fills the time the old habit used to take? If the honest answer is "nothing yet", what could?' },

    /* ---------------- self-talk ---------------- */
    { id: 'r_compassion', theme: 'Self-talk',
      frame: 'Kristin Neff’s work finds self-compassion predicts persistence better than self-criticism does.',
      q: 'Write the sentence you say to yourself after a bad day. Would you say it to someone you were trying to help?' },
    { id: 'r_brooding', theme: 'Self-talk',
      frame: 'Researchers separate brooding — going round the same loop — from reflection, which reaches a conclusion.',
      q: 'What have you been going round on lately? Is there a decision inside it, or is it just weather?' },
    { id: 'r_defusion', theme: 'Self-talk',
      frame: 'A thought can be treated as an event in the mind rather than a report on reality.',
      q: 'What thought about yourself have you been treating as a fact? What would it take to test it?' },
    { id: 'r_granularity', theme: 'Self-talk',
      frame: 'Lisa Feldman Barrett’s work suggests people who name feelings precisely regulate them better.',
      q: '"Bad" is not a feeling. Take the last time you felt bad and find the three more exact words for it.' },
    { id: 'r_standard', theme: 'Self-talk',
      frame: 'A standard you never meet stops functioning as a standard and starts functioning as a stick.',
      q: 'Which of your standards have you failed to meet for so long that it now only produces guilt? Keep it or cut it — which?' },

    /* ---------------- people ---------------- */
    { id: 'r_relatedness', theme: 'People',
      frame: 'Self-determination theory puts relatedness alongside autonomy and competence as a basic need, not a luxury.',
      q: 'Who do you feel most yourself around, and when did you last make that happen on purpose?' },
    { id: 'r_help', theme: 'People',
      frame: 'People consistently underestimate how willing others are to help when asked directly.',
      q: 'What would you ask for if you were certain the answer was yes? What stops you asking anyway?' },
    { id: 'r_comparison', theme: 'People',
      frame: 'Festinger described how much we evaluate ourselves by comparison, and how badly chosen those comparisons usually are.',
      q: 'Who are you measuring yourself against? Did you choose them, or did an algorithm?' },
    { id: 'r_drift', theme: 'People', when: has.people,
      frame: 'Friendships rarely end; they lapse, one uncontested month at a time.',
      q: 'Which friendship is currently lapsing? What is the smallest thing that would interrupt that?' },
    { id: 'r_giving', theme: 'People',
      frame: 'Doing something for someone else reliably improves mood more than doing something for yourself.',
      q: 'Who could you make a genuinely better week for, with something it is in your power to do?' },
    { id: 'r_seen', theme: 'People',
      frame: 'Being known and being liked are different needs, and people often solve for the second.',
      q: 'Who actually knows what your days are like at the moment? If nobody, is that a choice or a drift?' },

    /* ---------------- work and mastery ---------------- */
    { id: 'r_flow', theme: 'Mastery',
      frame: 'Csikszentmihalyi found flow sits where challenge and skill are matched — boredom below it, anxiety above.',
      q: 'What are you doing that is too easy, and what is too hard right now? What sits in between?' },
    { id: 'r_deliberate', theme: 'Mastery',
      frame: 'Ericsson distinguished deliberate practice — working at the edge, with feedback — from mere repetition.',
      q: 'What have you done a thousand times without getting better at? What would working at the edge of it look like?' },
    { id: 'r_progress', theme: 'Mastery',
      frame: 'Teresa Amabile found that visible progress in meaningful work is the strongest daily lift there is.',
      q: 'What did you actually move forward this week? If you cannot name it, is the work invisible or is it stalled?' },
    { id: 'r_craft', theme: 'Mastery',
      frame: 'Enjoying an activity and being good at it are related but not the same, and it matters which you are chasing.',
      q: 'What do you do purely because you like doing it, with no ambition attached? When was the last time?' },
    { id: 'r_teacher', theme: 'Mastery',
      frame: 'Explaining something exposes the parts you only thought you understood.',
      q: 'What could you teach someone tomorrow? What part of it would you struggle to explain?' },

    /* ---------------- body and energy ---------------- */
    { id: 'r_energy_ledger', theme: 'Energy',
      frame: 'Attention follows energy; most planning treats time as the scarce resource instead.',
      q: 'When in the day are you genuinely sharp? What currently occupies those hours?' },
    { id: 'r_decisions', theme: 'Energy',
      frame: 'Deciding is itself effortful, which is why routine protects the things that matter.',
      q: 'What do you re-decide every single day that could be decided once and left alone?' },
    { id: 'r_sleep', theme: 'Energy',
      frame: 'Almost every psychological capacity measured degrades with poor sleep.',
      q: 'What is the real reason you go to bed when you do? Not the stated reason.' },
    { id: 'r_eustress', theme: 'Energy',
      frame: 'Stress that you chose and can end behaves very differently from stress that is done to you.',
      q: 'Which of your current pressures did you choose? Which were handed to you, and can any be handed back?' },
    { id: 'r_rest', theme: 'Energy',
      frame: 'Rest and distraction are not the same thing, though they take the same hours.',
      q: 'What actually restores you, and how much of your downtime is spent on it rather than on scrolling?' },

    /* ---------------- subtraction ---------------- */
    { id: 'r_via_negativa', theme: 'Subtraction',
      frame: 'The via negativa: improvement by removal rather than addition.',
      q: 'What could you stop doing entirely this month that nobody would notice but you?' },
    { id: 'r_fence', theme: 'Subtraction',
      frame: 'Chesterton’s fence: before removing something, work out why it was put there.',
      q: 'What in your life looks pointless right now? What might it quietly be doing that you have not accounted for?' },
    { id: 'r_addition_bias', theme: 'Subtraction',
      frame: 'Offered a problem, people reliably reach for something to add before something to take away.',
      q: 'What problem are you trying to solve by adding? What is the subtraction version of the same fix?' },
    { id: 'r_enough', theme: 'Subtraction',
      frame: 'Without a defined "enough", more is the only available direction.',
      q: 'What would enough look like — in money, in fitness, in work? Write an actual number or description.' },

    /* ---------------- resistance to change itself ---------------- */
    { id: 'r_immunity', theme: 'Change',
      frame: 'Kegan and Lahey describe an immunity to change: a competing commitment quietly protecting you from the thing you say you want.',
      q: 'Take the change you keep failing to make. What might you be protecting yourself from by not making it?' },
    { id: 'r_payoff', theme: 'Change',
      frame: 'A problem that persists is usually paying someone something.',
      q: 'What does your current stuckness spare you from? Being tested, being seen, being responsible — or something else?' },
    { id: 'r_smallest', theme: 'Change',
      frame: 'Changes that survive are usually smaller than the ones we design.',
      q: 'What is the smallest version of the change you want that you would genuinely still be doing in six months?' },
    { id: 'r_relapse', theme: 'Change',
      frame: 'A lapse becomes a collapse mainly through the story told about the lapse.',
      q: 'What do you usually tell yourself after slipping? What would a version that keeps you going sound like?' },

    /* ---------------- the shadow ---------------- */
    { id: 'r_shadow', theme: 'Shadow',
      frame: 'Jung argued that what we most dislike in others often points at something disowned in ourselves.',
      q: 'What trait in other people irritates you out of proportion? Where does a version of it live in you?' },
    { id: 'r_secret', theme: 'Shadow',
      frame: 'The parts of a life kept from everyone tend to be the parts that run it.',
      q: 'What do you not tell anyone? What would change if one person knew?' },
    { id: 'r_envy', theme: 'Shadow',
      frame: 'Envy is unflattering and unusually informative — it points precisely at a want.',
      q: 'Whose life produces a twinge in you? What exactly are you envying — and is it available to you?' },
    { id: 'r_pride', theme: 'Shadow',
      frame: 'People are often more fluent in their failings than in their evidence.',
      q: 'What have you done that you have genuinely never given yourself credit for? Say why it was hard.' },

    /* ---------------- meaning ---------------- */
    { id: 'r_why', theme: 'Meaning',
      frame: 'A sufficient reason makes difficulty survivable; an insufficient one makes ease unbearable.',
      q: 'What is this all actually for? Answer it plainly, even if the answer is small.' },
    { id: 'r_eulogy', theme: 'Meaning',
      frame: 'The qualities people want said about them rarely match the ones they spend their weeks on.',
      q: 'What would you want said about how you lived? What in your current week is evidence for it?' },
    { id: 'r_contribution', theme: 'Meaning',
      frame: 'Meaning tends to be reported where effort connects to something beyond the person making it.',
      q: 'Who is better off because of what you do? If the answer is nobody yet, who could be?' },
    { id: 'r_last_good', theme: 'Meaning',
      frame: 'Good stretches are easier to recognise afterwards than during.',
      q: 'When were you last genuinely well — not happy, but solid? What was in place then that is not now?' },
    { id: 'r_hedonic', theme: 'Meaning',
      frame: 'We adapt to improvements in circumstance faster than we expect, which is why arrival disappoints.',
      q: 'What did you once think would fix things, that you now have? Did it? What does that predict about the next one?' }
  ];

  /** the ones that make sense for this record right now */
  function available(state) {
    const s = state || LO.store.state;
    return REFLECTIONS.filter(r => !r.when || r.when(s));
  }

  const themes = () => [...new Set(REFLECTIONS.map(r => r.theme))];

  LO.reflections = { REFLECTIONS, available, themes, has };
})(window.LO);
