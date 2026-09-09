/* Local guidance engine. Observations change the next invitation, never the user's identity. */
(function (LO) {
  'use strict';
  const { D, store } = LO;
  const inDays = (date, n) => date && D.daysBetween(date, D.today()) >= 0 && D.daysBetween(date, D.today()) < n;
  function analyze(s) {
    const wins = s.wins.filter(w => w.points > 0 && w.kind !== 'day');
    const current = wins.filter(w => inDays(w.date, 7));
    const previous = wins.filter(w => inDays(w.date, 14) && !inDays(w.date, 7));
    const logs = s.mind.logs.filter(r => inDays(r.date, 7));
    const energy = logs.length >= 3 ? logs.reduce((a, r) => a + Number(r.energy || 0), 0) / logs.length : null;
    const observedDays = new Set(wins.filter(w => inDays(w.date, 14)).map(w => w.date)).size;
    const ready = observedDays >= 6 && D.daysBetween(s.meta.created, D.today()) >= 13;
    const change = current.length - previous.length;
    let mode = 'explore', reason = 'Learning your rhythm. A few recorded days will make this more personal.';
    if (energy !== null && energy <= 4) {
      mode = 'gentle'; reason = 'Energy averaged ' + energy.toFixed(1) + '/10 across ' + logs.length + ' check-ins this week. Shorter invitations today.';
    } else if (ready) {
      mode = change < -2 ? 'gentle' : change > 2 ? 'stretch' : 'steady';
      reason = current.length + ' completions this week, ' + previous.length + ' the week before. ' +
        (mode === 'gentle' ? 'Trying smaller steps.' : mode === 'stretch' ? 'Offering a little more challenge.' : 'Keeping a steady pace.');
    }
    if (!s.guidance.enabled) { mode = 'explore'; reason = 'Adaptive guidance is paused. Your record is still yours.'; }
    return { mode, reason, current: current.length, previous: previous.length, energy, ready, observedDays };
  }
  function preference(method, s) {
    if (!s.guidance.enabled) return 1;
    const rows = s.guidance.feedback.filter(f => f.method === method && inDays(f.date, 28));
    // A bounded prior leaves room to explore even after an unhelpful attempt.
    return Math.max(0.5, Math.min(1.5, (2 + rows.filter(f => f.helped).length) / (4 + rows.length) * 2));
  }
  function feedback(method, helped) {
    const rows = store.state.guidance.feedback;
    const existing = rows.find(f => f.method === method && f.date === D.today());
    if (existing) existing.helped = helped;
    else rows.unshift({ method, helped, date: D.today() });
    store.log('guidance', 'Rated a practice', { method, helped });
    store.save();
  }
  function weight(action, s) {
    if (!s.guidance.enabled) return 1;
    const mode = analyze(s).mode;
    return mode === 'gentle' ? ((action.minutes || 2) <= 3 ? 1.6 : 0.65) : mode === 'stretch' && action.minutes >= 5 ? 1.35 : 1;
  }
  LO.adaptive = { analyze, preference, feedback, weight };
})(window.LO);
