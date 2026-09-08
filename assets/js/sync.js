/* ============================================================
   SYNC — the record, committed off this device.

   Writes your whole export to one file in a private GitHub repo
   through the Contents API. Because it is one path committed over
   and over, git gives you the version history for free: every
   backup is a restore point you can read, diff or roll back to.

   Rules this obeys:
   · The backup repo must be PRIVATE. The code repo is public and
     your record must never land in it.
   · The token never leaves this device and is stripped out of the
     export, so it cannot end up inside the backup it is making.
   · Failure is never silent and never destructive. If a push
     fails the error is shown and the local record is untouched.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  const API = 'https://api.github.com';
  const MIN_GAP_HOURS = 6;

  function cfg() {
    const s = LO.store.state.settings;
    if (!s.sync) {
      s.sync = { owner: '', repo: '', path: 'backup.json', token: '', on: false,
                 last: null, lastErr: '', commits: 0 };
    }
    return s.sync;
  }

  function ready() {
    const c = cfg();
    return !!(c.on && c.owner && c.repo && c.path && c.token);
  }

  /* base64 of UTF-8, which btoa alone cannot do */
  function b64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function unb64(b) {
    const bin = atob(b.replace(/\s/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function headers() {
    return {
      'Authorization': 'Bearer ' + cfg().token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }
  function url() {
    const c = cfg();
    return API + '/repos/' + encodeURIComponent(c.owner) + '/' +
      encodeURIComponent(c.repo) + '/contents/' + c.path.split('/').map(encodeURIComponent).join('/');
  }

  /** the sha of the file as it stands, or null if it is not there yet */
  async function currentSha() {
    const r = await fetch(url(), { headers: headers(), cache: 'no-store' });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(await message(r));
    const j = await r.json();
    return j.sha;
  }

  async function message(r) {
    let detail = '';
    try { detail = (await r.json()).message || ''; } catch (e) {}
    if (r.status === 401) return 'Token rejected. Check it has not expired.';
    if (r.status === 403) return 'Token lacks Contents write on that repository.';
    if (r.status === 404) return 'Repository or path not found for this token.';
    return 'GitHub said ' + r.status + (detail ? ': ' + detail : '');
  }

  /** check the settings work, without writing anything */
  async function test(over) {
    const c = cfg();
    const keep = { owner: c.owner, repo: c.repo, path: c.path, token: c.token };
    Object.assign(c, over || {});
    try {
      const r = await fetch(API + '/repos/' + encodeURIComponent(c.owner) + '/' +
        encodeURIComponent(c.repo), { headers: headers(), cache: 'no-store' });
      if (!r.ok) throw new Error(await message(r));
      const j = await r.json();
      if (!j.private) {
        throw new Error('That repository is public. Use a private one — this is your whole record.');
      }
      if (!(j.permissions && j.permissions.push)) {
        throw new Error('Token cannot write to that repository.');
      }
      return { ok: true, repo: j.full_name };
    } catch (e) {
      Object.assign(c, keep);
      return { ok: false, error: e.message };
    }
  }

  /** commit the current record. Returns {ok, error} and never throws. */
  async function push(reason) {
    const c = cfg();
    if (!ready()) return { ok: false, error: 'Not configured' };
    if (!navigator.onLine) return { ok: false, error: 'Offline' };

    try {
      await LO.store.flush();
      const body = LO.store.export();          // token is stripped inside export()
      const sha = await currentSha();
      const st = LO.store.state;
      const when = new Date().toISOString().slice(0, 16).replace('T', ' ');

      const r = await fetch(url(), {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers()),
        body: JSON.stringify({
          message: when + ' · ' + st.chronicle.length + ' entries' + (reason ? ' · ' + reason : ''),
          content: b64(body),
          sha: sha || undefined
        })
      });
      if (!r.ok) throw new Error(await message(r));

      c.last = new Date().toISOString();
      c.lastErr = '';
      c.commits = (c.commits || 0) + 1;
      LO.store.markBackup();
      return { ok: true };
    } catch (e) {
      c.lastErr = e.message;
      LO.store.save();
      return { ok: false, error: e.message };
    }
  }

  /** pull the committed record back down and replace what is here */
  async function restore() {
    if (!cfg().owner || !cfg().token) return { ok: false, error: 'Not configured' };
    try {
      const r = await fetch(url(), { headers: headers(), cache: 'no-store' });
      if (!r.ok) throw new Error(await message(r));
      const j = await r.json();
      const text = j.content ? unb64(j.content) : await (await fetch(j.download_url)).text();
      JSON.parse(text);                        // fail here rather than half-importing
      LO.store.import(text);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  /** called on boot and after writes; pushes at most once every few hours */
  let pending = null;
  function maybe(reason) {
    if (!ready() || !navigator.onLine) return;
    const c = cfg();
    const age = c.last ? (Date.now() - new Date(c.last).getTime()) / 3600000 : Infinity;
    if (age < MIN_GAP_HOURS) return;
    clearTimeout(pending);
    pending = setTimeout(() => push(reason || 'auto'), 4000);
  }

  function status() {
    const c = cfg();
    return {
      on: !!c.on, configured: ready(), owner: c.owner, repo: c.repo, path: c.path,
      last: c.last, lastErr: c.lastErr, commits: c.commits || 0,
      ago: c.last ? Math.round((Date.now() - new Date(c.last).getTime()) / 3600000) : null
    };
  }

  LO.sync = { cfg, ready, test, push, restore, maybe, status };
})(window.LO);
