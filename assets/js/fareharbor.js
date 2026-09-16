/* ============================================================
   FAREHARBOR — the private bridge, never the credential vault.

   Life Organizer is a public static PWA, so it cannot receive a
   booking webhook or safely carry a FareHarbor API credential.
   It reads a small normalized feed from a private bridge instead.
   The bridge filters sensitive booking data; this app keeps only
   the tour, time, assignment, status, and dashboard link.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  let ticker = null;
  const FIVE_MINUTES = 5 * 60 * 1000;

  function cfg() {
    const s = LO.store.state;
    s.integrations = s.integrations || {};
    s.integrations.fareharbor = Object.assign({
      bridgeUrl: '', token: '', guide: '', lastSync: '', lastError: '', tours: []
    }, s.integrations.fareharbor || {});
    return s.integrations.fareharbor;
  }

  function configured() {
    const c = cfg();
    return !!(c.bridgeUrl && c.token && c.guide);
  }

  function configure(fields) {
    const c = cfg();
    c.bridgeUrl = String(fields.bridgeUrl || '').trim();
    c.token = String(fields.token || c.token || '').trim();
    c.guide = String(fields.guide || '').trim();
    c.lastError = '';
    LO.store.save();
    return c;
  }

  function disconnect() {
    const c = cfg();
    Object.assign(c, { bridgeUrl: '', token: '', guide: '', lastSync: '', lastError: '', tours: [] });
    LO.store.save();
    stop();
  }

  function normalize(raw) {
    const t = raw || {};
    const assigned = Array.isArray(t.assignedTo) ? t.assignedTo.join(', ') :
      Array.isArray(t.guides) ? t.guides.join(', ') : String(t.assignedTo || t.guide || t.crew || '');
    return {
      id: String(t.id || t.uuid || t.bookingId || [t.title, t.start, assigned].join('|')),
      title: String(t.title || t.item || t.tour || 'Tour'),
      start: String(t.start || t.startsAt || t.date || ''),
      end: String(t.end || t.endsAt || ''),
      assignedTo: assigned,
      status: String(t.status || 'booked'),
      url: /^https:\/\//i.test(String(t.url || '')) ? String(t.url) : ''
    };
  }

  function matches(tour, guide) {
    if (!guide) return false;
    const needle = guide.toLocaleLowerCase().trim();
    return tour.assignedTo.toLocaleLowerCase().split(/[,;&]/).some(name => name.trim().includes(needle));
  }

  function upcoming() {
    const now = Date.now() - 6 * 3600000;
    return cfg().tours
      .filter(t => !t.start || Number.isNaN(Date.parse(t.start)) || Date.parse(t.start) >= now)
      .sort((a, b) => String(a.start).localeCompare(String(b.start)));
  }

  function validBridge(raw) {
    const u = new URL(raw, location.href);
    const local = ['localhost', '127.0.0.1'].includes(u.hostname);
    if (u.protocol !== 'https:' && !local) throw new Error('The bridge must use HTTPS.');
    return u.href;
  }

  async function sync(force) {
    const c = cfg();
    if (!configured()) return { ok: false, error: 'FareHarbor is not connected.' };
    const last = c.lastSync ? Date.parse(c.lastSync) : 0;
    if (!force && last && Date.now() - last < FIVE_MINUTES) return { ok: true, fresh: false, count: upcoming().length };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const url = new URL(validBridge(c.bridgeUrl));
      url.searchParams.set('guide', c.guide);
      const res = await fetch(url.href, {
        headers: { Accept: 'application/json', Authorization: 'Bearer ' + c.token },
        cache: 'no-store', signal: controller.signal
      });
      if (!res.ok) throw new Error('Bridge returned ' + res.status + '.');
      const body = await res.json();
      const rows = Array.isArray(body) ? body : body.tours;
      if (!Array.isArray(rows)) throw new Error('Bridge response needs a tours array.');

      const before = new Set((c.tours || []).map(t => t.id));
      const hadSync = !!c.lastSync;
      const next = rows.map(normalize).filter(t => matches(t, c.guide)).slice(0, 200);
      const added = hadSync ? next.filter(t => !before.has(t.id)) : [];
      c.tours = next;
      c.lastSync = new Date().toISOString();
      c.lastError = '';

      added.forEach(t => LO.store.notice(
        'New tour assigned', tourLine(t), 'fareharbor', 'tour_' + t.id, '#inbox'
      ));
      LO.store.save();
      if (added.length && LO.notify && LO.notify.external) {
        LO.notify.external('New tour assigned', added.length === 1 ? tourLine(added[0]) : added.length + ' new tours are in your inbox.', '#inbox', 'fareharbor');
      }
      return { ok: true, fresh: true, count: next.length, added: added.length };
    } catch (e) {
      c.lastError = e && e.name === 'AbortError' ? 'The bridge timed out.' : String(e.message || e);
      LO.store.save();
      return { ok: false, error: c.lastError };
    } finally {
      clearTimeout(timeout);
    }
  }

  function tourLine(t) {
    const when = t.start && !Number.isNaN(Date.parse(t.start))
      ? new Date(t.start).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      : 'Time pending';
    return t.title + ' · ' + when;
  }

  function start() {
    stop();
    if (!configured()) return;
    sync(false).then(r => { if (r.ok && LO.machine.current === 'me') LO.machine.refresh(); });
    ticker = setInterval(() => sync(false).then(r => {
      if (r.ok && r.fresh && LO.machine.current === 'me') LO.machine.refresh();
    }), FIVE_MINUTES);
  }

  function stop() { clearInterval(ticker); ticker = null; }

  LO.fareharbor = { cfg, configured, configure, disconnect, normalize, matches, upcoming, sync, start, stop, tourLine };
})(window.LO);
