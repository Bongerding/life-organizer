/* ============================================================
   LEVEL — the only score in the app.

   Points come from finished things, nothing else. Effort decides
   the size of the reward, clearing everything you set for the day
   pays a bonus on top, and the total reads out as a level on the
   crest in the top left of every screen.

   Nothing is stored that cannot be recomputed: the level is a pure
   function of the wins ledger, so a restored backup levels you back
   up to exactly where you were.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  /* effort tiers — the only thing that changes what a task is worth */
  const TIERS = [
    { id: 1, name: 'light', points: 10 },
    { id: 2, name: 'real',  points: 25 },
    { id: 3, name: 'heavy', points: 60 }
  ];
  const tier = n => TIERS[Math.max(0, Math.min(2, (n || 2) - 1))];

  /* a win logged before points existed still counts for something */
  const DEFAULT_POINTS = 15;

  /* what the next level costs — steeper as you go, never a wall */
  const need = lvl => 150 + (lvl - 1) * 75;

  /** cheap heuristic so he never has to grade his own errands.
      He can override it on the row; the override is what gets paid. */
  function estimate(text) {
    const t = ' ' + String(text || '').toLowerCase().trim() + ' ';
    const words = t.trim().split(/\s+/).length;
    if (/\b(call|ring|text|message|email|reply|book|pay|order|send|bin|dishes|washing|post|water)\b/.test(t)
        && words <= 7) return 1;
    if (/\b(build|rebuild|write|draft|service|strip|rewire|deep|whole|entire|finish|overhaul|sort out|clear out|spring)\b/.test(t)
        || words >= 10) return 3;
    return 2;
  }

  /** the bonus for clearing everything you put on the day */
  const dayBonus = n => 50 + n * 10;

  /** points a single win was worth */
  function pointsOf(w) {
    return typeof w.points === 'number' ? w.points : DEFAULT_POINTS;
  }

  /** total points ever earned */
  function total(s) {
    return (s || LO.store.state).wins.reduce((a, w) => a + pointsOf(w), 0);
  }

  function earnedOn(date, s) {
    const st = s || LO.store.state;
    const d = date || LO.D.today();
    return st.wins.filter(w => w.date === d).reduce((a, w) => a + pointsOf(w), 0);
  }

  /** level, and how far into it — everything the crest needs */
  function stats(s) {
    let xp = total(s);
    let level = 1;
    while (xp >= need(level)) { xp -= need(level); level++; }
    const n = need(level);
    return {
      level, into: xp, need: n,
      pct: Math.max(0, Math.min(100, Math.round(xp / n * 100))),
      total: total(s), today: earnedOn(null, s)
    };
  }

  LO.level = { TIERS, tier, estimate, need, dayBonus, stats, total, earnedOn, pointsOf };
})(window.LO);
