/* ============================================================
   NOTIFICATIONS — quiet, explicit, and honest about the platform.

   This static PWA can show scheduled notices while it is running.
   The service worker can receive true Web Push later, once a small
   application server owns subscriptions and VAPID credentials.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  let ticker = null;

  function cfg() {
    const s = LO.store.state.settings;
    if (!s.notifications) {
      s.notifications = {
        enabled: false, morning: true, update: true,
        morningTime: '08:00', updateTime: '17:30',
        quietStart: '21:30', quietEnd: '07:00', minGapHours: 6,
        last: { morning: '', update: '', sentAt: 0 }
      };
    }
    s.notifications.last = Object.assign({ morning: '', update: '', sentAt: 0 }, s.notifications.last || {});
    return s.notifications;
  }

  function supported() { return 'Notification' in window; }
  function permission() { return supported() ? Notification.permission : 'unsupported'; }

  async function enable() {
    if (!supported()) return { ok: false, error: 'Notifications are not supported here.' };
    try {
      const result = await Notification.requestPermission();
      const c = cfg();
      c.enabled = result === 'granted';
      LO.store.save();
      if (c.enabled) start();
      return c.enabled ? { ok: true } : { ok: false, error: result === 'denied' ? 'Notifications are blocked in browser settings.' : 'Permission was not granted.' };
    } catch (_) {
      return { ok: false, error: 'This browser could not open notification permission.' };
    }
  }

  function inQuietHours(now, c) {
    const m = now.getHours() * 60 + now.getMinutes();
    const start = LO.D.mins(c.quietStart), end = LO.D.mins(c.quietEnd);
    return start > end ? m >= start || m < end : m >= start && m < end;
  }

  function due(now, hhmm) {
    const at = LO.D.mins(hhmm);
    return now.getHours() * 60 + now.getMinutes() >= at;
  }

  function updateBody() {
    const open = LO.store.dayList().filter(x => x.status !== 'closed').length;
    const overdue = LO.store.state.people.filter(p => LO.companion.due(p) <= LO.D.today()).length;
    const bits = [];
    if (open) bits.push(open + (open === 1 ? ' thing is' : ' things are') + ' still open');
    if (overdue) bits.push(overdue + (overdue === 1 ? ' circle check-in is' : ' circle check-ins are') + ' due');
    return bits.length ? bits.join('. ') + '. No urgency—just keeping the board current.' : '';
  }

  async function show(title, body, path, tag) {
    const options = {
      body, tag: 'life-organizer-' + tag, renotify: false,
      data: { path: path || '#do' }
    };
    // Keep the standalone build light; file-opened copies do not have a
    // service worker and do not need an embedded 192px icon per notice.
    if (!window.LO_STANDALONE) options.icon = ['assets', 'icons', 'lumen-ball-192.png'].join('/');
    const reg = navigator.serviceWorker && navigator.serviceWorker.getRegistration
      ? await navigator.serviceWorker.getRegistration() : null;
    if (reg) await reg.showNotification(title, options);
    else new Notification(title, options);
  }

  async function check(now) {
    const c = cfg(), clock = now || new Date(), today = LO.D.key(clock);
    if (!c.enabled || permission() !== 'granted' || inQuietHours(clock, c)) return false;
    if (c.last.sentAt && Date.now() - c.last.sentAt < (Number(c.minGapHours) || 6) * 3600000) return false;

    if (c.morning && c.last.morning !== today && due(clock, c.morningTime) && clock.getHours() < 12) {
      const n = LO.store.dayList().filter(x => x.status !== 'closed').length;
      const body = n ? n + (n === 1 ? ' thing is' : ' things are') + ' available today. Open when useful.' : 'The day is open. Nothing needs your attention here.';
      await show('Good morning', body, '#do', 'morning');
      c.last.morning = today; c.last.sentAt = Date.now(); LO.store.save(); return true;
    }

    if (c.update && c.last.update !== today && due(clock, c.updateTime)) {
      const body = updateBody();
      if (!body) { c.last.update = today; LO.store.save(); return false; }
      await show('A quiet update', body, '#do', 'update');
      c.last.update = today; c.last.sentAt = Date.now(); LO.store.save(); return true;
    }
    return false;
  }

  function start() {
    clearInterval(ticker);
    if (!cfg().enabled) { ticker = null; return; }
    check().catch(() => {});
    ticker = setInterval(() => check().catch(() => {}), 60000);
  }

  function stop() { clearInterval(ticker); ticker = null; }
  async function test() {
    if (permission() !== 'granted') return false;
    await show('A quiet test', 'Notifications are ready. This is the tone they will use.', '#do', 'test');
    return true;
  }
  function status() { return { supported: supported(), permission: permission(), config: cfg() }; }

  LO.notify = { cfg, status, enable, check, start, stop, test, updateBody };
})(window.LO);
