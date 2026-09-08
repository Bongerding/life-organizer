/* ============================================================
   AIMS — goals that move on their own.

   You should never drag a slider to tell the app how you are
   doing; it already knows. When a goal is written, this reads the
   sentence and picks a tracker: a habit, a kind of win, the clear
   count, contacts, or overall alignment. Progress is then computed
   from the record every time the page is drawn.

   Anything it cannot read stays manual, and says so.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  const D = LO.D;
  const NUM = { a: 1, one: 1, once: 1, two: 2, twice: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };

  /** pull "three times a week" / "2x a month" / "once a week" out of a sentence */
  function cadence(t) {
    let m = t.match(/\b(\d+|a|one|once|two|twice|three|four|five|six|seven)\s*(?:times?|x)?\s*(?:a|per|each)\s+(day|week|month)\b/i);
    if (!m) m = t.match(/\b(\d+|once|twice)\s+(?:a|per|each)\s+(day|week|month)\b/i);
    if (!m) return null;
    const n = /^\d+$/.test(m[1]) ? +m[1] : NUM[m[1].toLowerCase()];
    return n ? { per: n, unit: m[2].toLowerCase() } : null;
  }

  /** Read the goal and decide what actually measures it.
      Every pattern ends on a stem with NO trailing \b — "cycl" has to match
      "Cycle", and a closing boundary would stop it dead. That bug shipped once.
      Order matters: the specific measures come before the broad ones. */
  function detect(title, domain) {
    const t = (title || '').toLowerCase();
    const c = cadence(t);

    if (/\b(motorcycl|motorbike|ride out|bike out)/.test(t)) {
      return { kind: 'wins', winKind: 'ride', per: c ? c.per : 1, unit: c ? c.unit : 'week', what: 'rides' };
    }
    if (/\b(cycl|bicycle|bike)/.test(t)) {
      return { kind: 'habit', name: 'Cycle', per: c ? c.per : 3, unit: c ? c.unit : 'week', what: 'rides' };
    }
    if (/\b(clear[- ]?head|sober|stop smoking|cut down|weed|clean)/.test(t)) {
      return { kind: 'clear', what: 'clear' };
    }
    if (/\b(friend|mates|see people|in person|touch with)/.test(t)) {
      return { kind: 'contacts', per: c ? c.per : 2, unit: c ? c.unit : 'month', what: 'people reached' };
    }
    if (/\b(writ|journal|record|log)/.test(t)) {
      return { kind: 'wins', winKind: 'write', per: c ? c.per : 3, unit: c ? c.unit : 'week', what: 'entries' };
    }
    if (/\b(partner|dating|say yes|open to)/.test(t)) {
      return { kind: 'wins', winKind: 'people', per: c ? c.per : 1, unit: c ? c.unit : 'week', what: 'times you said yes' };
    }
    if (/\b(business|revenue|money|earning|client|customer)/.test(t) || domain === 'wealth') {
      return { kind: 'wins', winKind: 'craft', per: c ? c.per : 3, unit: c ? c.unit : 'week', what: 'sessions' };
    }
    if (/\b(happy|healthy|life|years)/.test(t)) {
      return { kind: 'index', what: 'alignment' };
    }
    if (/\b(sleep|train|gym|strength|weight|fitness)/.test(t) || domain === 'body') {
      return { kind: 'pillar', pillar: 'body', what: 'body' };
    }
    return { kind: 'manual', what: '' };
  }

  const DAYS = { day: 1, week: 7, month: 30 };

  /** count events in the last `days`, from the right source */
  function rate(track, s) {
    const win = Math.max(28, (DAYS[track.unit] || 7) * 4);   // at least four periods
    const since = D.shift(-win + 1);
    let n = 0;
    if (track.kind === 'habit') {
      const h = s.habits.find(x => x.name === track.name);
      if (!h || !h.log) return null;
      n = Object.keys(h.log).filter(d => d >= since).length;
    } else if (track.kind === 'wins') {
      n = s.wins.filter(w => w.kind === track.winKind && w.date >= since).length;
    } else if (track.kind === 'contacts') {
      n = s.chronicle.filter(e => e.type === 'person' && e.date >= since &&
        /^(Reached|Saw)/.test(e.text || '')).length;
    } else return null;

    const periods = win / (DAYS[track.unit] || 7);
    const expected = track.per * periods;
    return { n, expected, periods, win };
  }

  /** {pct, label, auto} for one goal */
  function progress(goal, s) {
    const track = goal.track || detect(goal.title, goal.domain);

    if (track.kind === 'manual') {
      return { pct: +goal.progress || 0, label: 'set by hand', auto: false };
    }
    if (track.kind === 'index') {
      const v = LO.store.vitals();
      return { pct: v.index, label: 'alignment ' + v.index, auto: true };
    }
    if (track.kind === 'pillar') {
      const v = LO.store.vitals();
      const p = v.pillars[track.pillar];
      return p == null
        ? { pct: 0, label: 'nothing logged yet', auto: true }
        : { pct: p, label: track.pillar + ' ' + p, auto: true };
    }
    if (track.kind === 'clear') {
      const days = LO.store.daysClear();
      const score = LO.store.clarityScore();
      return {
        pct: score == null ? 0 : score,
        label: days == null ? 'not started' : days + ' days clear',
        auto: true
      };
    }

    const r = rate(track, s);
    if (!r) return { pct: 0, label: 'nothing logged yet', auto: true };
    const pct = Math.max(0, Math.min(100, Math.round(r.n / (r.expected || 1) * 100)));
    const perPeriod = (r.n / r.periods);
    return {
      pct,
      label: fmt(perPeriod) + ' of ' + track.per + ' ' + track.what + ' a ' + track.unit,
      auto: true
    };
  }

  function fmt(n) { return n >= 10 ? Math.round(n) : Math.round(n * 10) / 10; }

  LO.aims = { detect, progress, cadence };
})(window.LO);
