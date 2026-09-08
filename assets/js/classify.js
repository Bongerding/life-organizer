/* ============================================================
   CLASSIFY — work out what he just wrote.

   Six kinds: task, chore, activity, plan, feeling, thought.
   Rule-scored rather than ordered: every rule adds points to a
   kind and the highest total wins, so "book the bike in for a
   service" lands on chore instead of fighting with task.

   It also learns. When he overrides a guess, the significant
   words in that entry get weighted toward the kind he picked and
   away from the one this got wrong. Entirely on-device — no
   model, no network — which is what makes it instant as he types
   and reliable with no signal.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  const KINDS = [
    { id: 'task',     label: 'Task',     actionable: true,  hint: 'Something to do' },
    { id: 'chore',    label: 'Chore',    actionable: true,  hint: 'Upkeep and admin' },
    { id: 'activity', label: 'Activity', actionable: false, hint: 'Something you did' },
    { id: 'plan',     label: 'Plan',     actionable: false, hint: 'What you intend' },
    { id: 'feeling',  label: 'Feeling',  actionable: false, hint: 'How you are' },
    { id: 'thought',  label: 'Thought',  actionable: false, hint: 'Anything else' }
  ];

  const FEELING_WORDS =
    /\b(anxious|angry|sad|happy|tired|knackered|exhausted|flat|low|frustrated|stressed|overwhelmed|calm|content|lonely|guilty|ashamed|proud|foggy|restless|numb|gutted|buzzing|drained|wired|rough|grim|good|great)\b/i;

  /* [kind, points, test, reason] — reasons are shown to him, so the
     guess is never mysterious and correcting it feels fair. */
  const RULES = [
    // --- feeling ---
    ['feeling', 6, /\bi (feel|felt|am feeling|'m feeling)\b/i, 'you said how you feel'],
    ['feeling', 4, /\bfeeling\b/i, 'the word "feeling"'],
    ['feeling', 5, FEELING_WORDS, 'a feeling word'],
    ['feeling', 3, /^(knackered|tired|exhausted|flat|low|anxious|angry|stressed|gutted|buzzing|rough|grim)\b/i, 'it opens on a feeling'],
    ['feeling', 3, /\b(today was|been a .{0,20}(day|week))\b/i, 'you are describing the day'],

    // --- activity: already done ---
    ['activity', 6, /\b(rode|cycled|ran|walked|swam|trained|lifted|climbed|hiked|jogged|rowed)\b/i, 'past-tense movement'],
    ['activity', 5, /\bwent (for|out|to)\b/i, '"went for"'],
    ['activity', 4, /\b\d+\s?(km|kms|mi|miles)\b/i, 'a distance'],
    ['activity', 3, /\b\d+\s?(reps|sets|kg|lbs)\b/i, 'a training number'],
    ['activity', 3, /\b(did|done|finished|completed)\b.{0,30}\b(ride|run|session|workout|gym|walk)\b/i, 'a finished session'],
    ['activity', 2, /\b(ride|run|gym|workout|session|training|turbo|zwift|spin|yoga|stretch)\b/i, 'movement'],
    ['activity', 3, /\b(this morning|this afternoon|this evening|yesterday|last night|earlier today)\b/i, 'it already happened'],

    // --- chore: upkeep and admin ---
    ['chore', 6, /\b(bins?|rubbish|recycling|laundry|washing|dishes|hoover|vacuum|mow|dusting)\b/i, 'housework'],
    ['chore', 6, /\b(mot|service|insurance|tax|registration|renewal|renew|bill|rent|mortgage)\b/i, 'admin or upkeep'],
    ['chore', 7, /\b(dentist|doctor|optician|garage|mechanic|post office|council|barber|vet)\b/i, 'an errand'],
    ['chore', 4, /\b(tidy|clean|declutter|shopping|groceries|refill|restock)\b/i, 'tidying or supplies'],
    ['chore', 3, /\b(sort .{0,12}out|sort out)\b/i, 'sorting something out'],
    ['chore', 3, /\b(pick up|drop off|collect|return)\b/i, 'a collection or drop-off'],

    // --- task: actionable, not upkeep ---
    ['task', 5, /\b(need to|have to|must|should|remember to|don't forget|todo|to-do)\b/i, 'an obligation'],
    ['task', 4, /^(call|ring|email|message|text|book|buy|order|send|write|finish|fix|check|submit|file|pay|chase|reply|ask|sort|find|make|set ?up|sign|print|read|draft)\b/i, 'it starts with a verb'],
    ['task', 2, /\b(call|ring|email|message|book|order|chase|reply|submit|invoice|quote)\b/i, 'an action word'],
    ['task', 3, /\b(by|before) (monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|the end of)\b/i, 'a deadline'],
    ['task', 4, /\b(\d+|two|three|four|five|ten|fifteen|twenty|thirty)\s?(min|mins|minutes|hour|hours|hrs)\b/i, 'a time box'],

    // --- plan: intention, future ---
    ['plan', 5, /\b(going to|gonna|plan to|planning to|intend to|aim to|aiming to|thinking of|thinking about)\b/i, 'an intention'],
    ['plan', 4, /\b(next (week|month|year|summer|month)|this (weekend|year)|in the new year|one day|eventually|someday)\b/i, 'a future time'],
    ['plan', 4, /\b(i want to|i'd like to|i would like to|i will)\b/i, 'something you want'],
    ['plan', 4, /\bon (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, 'a day it happens'],
    ['plan', 3, /\b(idea|roadmap|strategy|approach)\b/i, 'an idea'],

    // --- thought: reflective ---
    ['thought', 6, /\b(i wonder|i think|i reckon|i realised|i realized|it occurred to me|reminds me)\b/i, 'you are thinking out loud'],
    ['thought', 5, /\b(maybe|perhaps|might just|not sure)\b/i, 'you are weighing it up'],
    ['thought', 3, /\?\s*$/, 'it ends in a question']
  ];

  const STOP = new Set(('the a an and or but if then than that this these those for to of in on at by with from into ' +
    'is are was were be been being am do does did done have has had it its i me my mine you your we our they them ' +
    'not no so just about out up down over under again very really quite some any all more most other').split(' '));

  /** score every kind; the winner comes back with its reasons */
  function guess(text, state) {
    const t = (text || '').trim();
    if (t.length < 3) return { kind: 'thought', confidence: 0, why: '', scores: {} };

    const scores = {}, reasons = {};
    KINDS.forEach(k => { scores[k.id] = 0; reasons[k.id] = []; });

    for (let i = 0; i < RULES.length; i++) {
      const r = RULES[i];
      if (r[2].test(t)) { scores[r[0]] += r[1]; reasons[r[0]].push(r[3]); }
    }

    // future framing means it has not happened yet
    if (/\b(going to|gonna|will|tomorrow|next week|this weekend|plan to|want to)\b/i.test(t)) {
      scores.activity = Math.max(0, scores.activity - 4);
    }
    // hedging turns an obligation into musing: "maybe I should…" is a thought
    if (/\b(i wonder|maybe|perhaps|i think|not sure|might just)\b/i.test(t)) {
      scores.task = Math.max(0, scores.task - 5);
      scores.chore = Math.max(0, scores.chore - 3);
    }
    // past framing rules out anything still to be done
    if (/\b(this morning|yesterday|last night|earlier today|went for)\b/i.test(t)) {
      scores.task = Math.max(0, scores.task - 3);
      scores.plan = Math.max(0, scores.plan - 3);
    }
    // a question is rarely a job
    if (/\?\s*$/.test(t)) {
      scores.task = Math.max(0, scores.task - 2);
      scores.chore = Math.max(0, scores.chore - 2);
    }

    // what it has learned from his own corrections
    const learned = (state && state.classifier && state.classifier.weights) || {};
    const toks = tokens(t);
    for (let i = 0; i < toks.length; i++) {
      const w = learned[toks[i]];
      if (!w) continue;
      for (const kind in w) if (scores[kind] !== undefined) scores[kind] += w[kind];
    }

    let best = 'thought', top = 0, second = 0;
    for (const k in scores) {
      if (scores[k] > top) { second = top; top = scores[k]; best = k; }
      else if (scores[k] > second) second = scores[k];
    }
    if (top <= 0) return { kind: 'thought', confidence: 0, why: '', scores };

    return {
      kind: best,
      confidence: Math.min(1, (top - second + 2) / 8),
      why: reasons[best].slice(0, 2).join(' and '),
      scores
    };
  }

  /** he overrode the guess — bias these words next time */
  function learn(text, chosen, wrong, state) {
    if (!state.classifier) state.classifier = { weights: {}, corrections: 0 };
    const w = state.classifier.weights;
    const toks = tokens(text);
    for (let i = 0; i < toks.length; i++) {
      const tok = toks[i];
      w[tok] = w[tok] || {};
      w[tok][chosen] = clamp((w[tok][chosen] || 0) + 1.2);
      if (wrong && wrong !== chosen) w[tok][wrong] = clamp((w[tok][wrong] || 0) - 0.8);
    }
    state.classifier.corrections = (state.classifier.corrections || 0) + 1;
  }

  function tokens(t) {
    return (t.toLowerCase().match(/[a-z']{3,}/g) || [])
      .filter(x => !STOP.has(x))
      .slice(0, 12);
  }
  function clamp(n) { return Math.max(-4, Math.min(4, Math.round(n * 10) / 10)); }
  function kind(id) { return KINDS.find(k => k.id === id) || KINDS[5]; }

  LO.classify = { KINDS, guess, learn, kind };
})(window.LO);
