/* ============================================================
   SHELL — the frame.
   Four tabs, one accent, no theatrics. Do is where you act,
   Write is where everything you write goes, Advice is what to do
   when you are stuck, Me is the page about you.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  const machine = {
    surfaces: [],
    current: null,

    register(sf) { this.surfaces.push(sf); return sf; },
    get(id) { return this.surfaces.find(s => s.id === id); },

    async boot() {
      await LO.store.load();
      const fresh = LO.store.seed();
      LO.companion.boot();
      LO.ui.startField(document.getElementById('field'));

      this.paintTop();
      addEventListener('hashchange', () => this.route());
      this.route();

      LO.store.on(() => this.paintStatus());
      addEventListener('keydown', e => {
        const a = document.activeElement;
        if (/input|textarea|select/i.test(a.tagName) || a.isContentEditable) return;
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= this.surfaces.length) location.hash = this.surfaces[n - 1].id;
      });

      setTimeout(() => document.getElementById('veil').classList.add('gone'), 380);
      if (fresh) LO.ui.toast('Started. Restore a backup from the gear if you have one.', 4000);
      LO.sync.maybe('on open');
    },

    paintTop() {
      document.getElementById('tabs').innerHTML = this.surfaces.map(s =>
        `<button class="tab" data-go="${s.id}">${s.name}</button>`).join('');
      document.querySelectorAll('[data-go]').forEach(b => {
        b.onclick = () => { location.hash = b.dataset.go; };
      });
      document.getElementById('crest').onclick = () => { location.hash = 'me'; };
      document.getElementById('gear').onclick = () => this.sheet();
      document.getElementById('sheet2').onclick = e => {
        if (e.target.id === 'sheet2') this.closeSheet();
      };
      this.paintStatus();
    },

    /** one plain line: what today looks like */
    paintStatus() {
      const s = LO.store.state, st = LO.store;
      const done = st.winsOn().filter(w => w.kind !== 'day' && LO.level.pointsOf(w) > 0).length;
      const clear = st.daysClear();
      const bits = [done ? done + ' done today' : 'nothing done yet'];
      if (clear !== null) bits.push(clear + ' days clear');
      const open = st.tasks().length;
      if (open) bits.push(open + ' open');
      const el = document.getElementById('status');
      if (el) el.textContent = bits.join('  ·  ');
      this.paintCrest();
    },

    /** the level crest, top left, on every screen */
    paintCrest() {
      const el = document.getElementById('crest');
      if (!el || !LO.level) return;
      const st = LO.level.stats();
      el.querySelector('b').textContent = st.level;
      el.querySelector('.xpbar i').style.width = st.pct + '%';
      el.title = 'Level ' + st.level + ' · ' + st.into + ' / ' + st.need + ' points';
    },

    /** a level just went up — say so where the number lives */
    crestPulse() {
      const el = document.getElementById('crest');
      if (!el) return;
      el.classList.remove('up');
      void el.offsetWidth;
      el.classList.add('up');
      setTimeout(() => el.classList.remove('up'), 1600);
    },

    route() {
      const id = (location.hash || '').replace('#', '') || 'do';
      if (id === 'people') { this.go('me'); LO.companion.openFriends(); return; }
      const sf = this.get(id) || this.get('do');
      this.current = sf.id;
      document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.go === sf.id));
      document.querySelectorAll('.pane').forEach(el => el.classList.toggle('on', el.dataset.pane === sf.id));
      this.render(sf);
      this.paintStatus();
    },

    render(sf) {
      const host = document.querySelector(`.pane[data-pane="${sf.id}"] .col`);
      host.innerHTML = sf.render(LO.store.state);
      LO.companion.hydrate(host);
      if (sf.mount) sf.mount(host);
      sf.refresh = () => {
        host.innerHTML = sf.render(LO.store.state);
        LO.companion.hydrate(host);
        if (sf.mount) sf.mount(host);
        this.paintStatus();
      };
      const pane = host.closest('.pane');
      if (pane) pane.scrollTop = 0;
    },

    refresh() {
      const sf = this.get(this.current);
      if (sf) (sf.refresh || (() => this.render(sf)))();
    },

    go(id) {
      if (id === 'people') return LO.companion.openFriends();
      if (id === 'clear') id = 'me';
      if (id === 'loops') id = 'write';
      location.hash = id;
    },

    /* ---------------- sheets ---------------- */
    /** the two protocols that must be one tap away from anywhere */
    quick(kind) {
      const el = document.getElementById('sheet2');
      const body = kind === 'urge' ? `
        <h2>Ride it out</h2>
        <p class="lede">Ten minutes. The wave peaks and drops on its own. You only have to outlast it.</p>
        ${LO.ui.field('intensity', 'How strong', { type: 'range', min: 1, max: 10, value: 6 })}
        <div class="bars">
          <button class="fullbtn hot" data-q="surf">Start ten minutes</button>
          <button class="fullbtn" data-q="logurge">Just log it, no timer</button>
        </div>
        <p class="note" style="margin-top:14px">Get out of the room, drink water, move. Do not argue with it
          in your head — change what your body is doing instead.</p>`
      : `
        <h2>Log it and move on</h2>
        <p class="lede">The day count restarts. Your best run stays. That is the whole consequence.</p>
        ${LO.ui.field('note', 'What was going on', { ph: 'Optional' })}
        <div class="bars">
          <button class="fullbtn warn" data-q="saveused">Log it</button>
          <button class="fullbtn" data-q="cancel">Cancel</button>
        </div>`;

      el.querySelector('.box').innerHTML = body;
      el.hidden = false;
      const box = el.querySelector('.box');
      const acts = {
        cancel: () => this.closeSheet(),
        surf: () => {
          const intensity = +LO.ui.read(box).intensity;
          this.closeSheet();
          const dosf = this.get('do');
          dosf.runUrge(intensity);
        },
        logurge: () => {
          LO.store.logUrge({ intensity: +LO.ui.read(box).intensity, rode: false, instead: '' });
          LO.ui.toast('Logged'); this.closeSheet(); this.refresh();
        },
        saveused: () => {
          LO.store.logUse((LO.ui.read(box).note || '').trim());
          LO.ui.toast('Logged. Tomorrow is day one.', 3000);
          this.closeSheet(); this.refresh();
        }
      };
      box.querySelectorAll('[data-q]').forEach(b => { b.onclick = () => acts[b.dataset.q](); });
    },

    async sheet() {
      const el = document.getElementById('sheet2');
      const s = LO.store.state;
      const info = await LO.store.storageInfo();
      const sy = LO.sync.status();
      const cur = LO.sync.cfg();
      const size = n => n == null ? '—' : n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB';
      const back = LO.store.daysSinceBackup();

      el.querySelector('.box').innerHTML = `
        <h2>Settings</h2>
        <p class="lede">Everything is stored on this device. Nothing leaves unless you send it.</p>

        <label class="fld"><span>Your name</span>
          <input data-name value="${LO.ui.esc(s.meta.name)}" placeholder="Your name"></label>
        <label class="fld"><span>North star</span>
          <textarea data-ns rows="4">${LO.ui.esc(s.identity.northStar)}</textarea></label>
        <button class="fullbtn hot" data-s="save" style="text-align:center;margin-bottom:20px">Save</button>

        <div class="lbl" style="margin-top:0">Storage<span class="ln"></span></div>
        <div class="kv"><span>Kept in</span><b>${info.backend}</b></div>
        <div class="kv"><span>Protected from clearing</span><b>${info.persisted ? 'yes' : 'not yet'}</b></div>
        <div class="kv"><span>Your record</span><b>${size(info.bytes)} · ${info.events} entries</b></div>
        <div class="kv"><span>Room available</span><b>${size(info.quota)}</b></div>
        <div class="kv"><span>Last backup</span><b>${back === null ? 'never' : back === 0 ? 'today' : back + ' days ago'}</b></div>

        <div class="bars" style="margin-top:16px">
          <button class="fullbtn ${back === null || back > 21 ? 'hot' : ''}" data-s="download">Download a backup</button>
          <button class="fullbtn" data-s="copy">Copy everything to the clipboard</button>
          <button class="fullbtn" data-s="import">Restore from a file</button>
          <input type="file" accept="application/json" data-file hidden>
        </div>
        <p class="note" style="margin-top:14px">A copy that is not on this device is what makes this survive a
          lost phone. Set the one below up and it happens on its own.</p>

        <div class="lbl">Automatic backup${sy.configured ? '<span class="r">' +
          (sy.last ? (sy.ago === 0 ? 'backed up just now' : 'backed up ' + sy.ago + 'h ago')
                   : 'never run') + '</span>' : ''}</div>
        <p class="note" style="margin:0 0 12px">Commits your whole record to a
          <b>private</b> GitHub repo. Every backup is a restore point you can roll back to.</p>
        ${sy.lastErr ? `<p class="note" style="color:var(--bad);margin:0 0 12px">Last attempt failed: ${LO.ui.esc(sy.lastErr)}</p>` : ''}
        <div class="row">
          <label class="fld" style="flex:1 1 120px"><span>Owner</span>
            <input data-sowner value="${LO.ui.esc(sy.owner)}" placeholder="your-github-name" autocapitalize="off"></label>
          <label class="fld" style="flex:1 1 120px"><span>Private repo</span>
            <input data-srepo value="${LO.ui.esc(sy.repo)}" placeholder="life-organizer-data" autocapitalize="off"></label>
        </div>
        <label class="fld"><span>File</span>
          <input data-spath value="${LO.ui.esc(sy.path || 'backup.json')}" autocapitalize="off"></label>
        <label class="fld"><span>Fine-grained token${cur.token ? ' — saved on this device' : ''}</span>
          <input data-stoken type="password" placeholder="${cur.token ? '•••••••• leave blank to keep' : 'github_pat_…'}" autocapitalize="off" autocomplete="off"></label>
        <div class="bars">
          <button class="fullbtn hot" data-s="synctest">Check and save</button>
          <button class="fullbtn" data-s="syncnow"${sy.configured ? '' : ' disabled style="opacity:.45"'}>Back up now</button>
          <button class="fullbtn" data-s="syncrestore"${sy.configured ? '' : ' disabled style="opacity:.45"'}>Restore from GitHub</button>
          ${sy.configured ? `<button class="fullbtn" data-s="syncoff">${sy.on ? 'Turn automatic backup off' : 'Turn automatic backup on'}</button>` : ''}
        </div>
        <p class="note" style="margin-top:12px">Making the token: GitHub → Settings → Developer settings →
          <b>Fine-grained tokens</b> → only the backup repo → <b>Repository permissions → Contents:
          Read and write</b>. Nothing else. It is stored on this device only and is stripped out of every
          export, so it can never end up inside the backup it just made.</p>

        <div class="lbl">Elsewhere<span class="ln"></span></div>
        <div class="bars">
          <button class="fullbtn" data-s="lattice">Open the old lattice</button>
          <button class="fullbtn warn" data-s="wipe">Delete everything</button>
        </div>
        <div class="acts" style="margin-top:20px"><button class="flat" data-s="close">Close</button></div>`;

      el.hidden = false;
      const box = el.querySelector('.box');
      const file = box.querySelector('[data-file]');
      const acts = {
        close: () => this.closeSheet(),
        save: () => {
          LO.store.state.meta.name = box.querySelector('[data-name]').value.trim();
          LO.store.state.identity.northStar = box.querySelector('[data-ns]').value.trim();
          LO.store.save();
          LO.ui.toast('Saved');
          this.closeSheet();
          this.refresh();
        },
        download: async () => {
          await LO.store.flush();
          const blob = new Blob([LO.store.export()], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'life-organizer-' + LO.D.today() + '.json';
          a.click(); URL.revokeObjectURL(a.href);
          LO.store.markBackup();
          LO.ui.toast('Backed up. Put it somewhere other than this machine.');
        },
        copy: async () => {
          try {
            await navigator.clipboard.writeText(LO.store.export());
            LO.store.markBackup();
            LO.ui.toast('Copied');
          } catch (e) { LO.ui.toast('Clipboard blocked. Use download instead.'); }
        },
        import: () => file.click(),

        synctest: async () => {
          const c = LO.sync.cfg();
          const over = {
            owner: box.querySelector('[data-sowner]').value.trim(),
            repo: box.querySelector('[data-srepo]').value.trim(),
            path: (box.querySelector('[data-spath]').value.trim() || 'backup.json'),
            token: box.querySelector('[data-stoken]').value.trim() || c.token
          };
          if (!over.owner || !over.repo || !over.token) return LO.ui.toast('Owner, repo and token');
          LO.ui.toast('Checking…');
          const res = await LO.sync.test(over);
          if (!res.ok) { LO.ui.toast(res.error, 5000); LO.store.save(); return this.sheet(); }
          Object.assign(c, over, { on: true, lastErr: '' });
          LO.store.save();
          LO.ui.toast('Connected to ' + res.repo);
          const first = await LO.sync.push('first backup');
          LO.ui.toast(first.ok ? 'Backed up' : first.error, 4000);
          this.sheet();
        },
        syncnow: async () => {
          LO.ui.toast('Backing up…');
          const r = await LO.sync.push('manual');
          LO.ui.toast(r.ok ? 'Backed up to GitHub' : r.error, 4500);
          this.sheet();
        },
        syncrestore: async () => {
          if (!confirm('Replace everything on this device with the copy in GitHub?')) return;
          const r = await LO.sync.restore();
          if (!r.ok) return LO.ui.toast(r.error, 5000);
          LO.ui.toast('Restored'); setTimeout(() => location.reload(), 600);
        },
        syncoff: () => {
          const c = LO.sync.cfg();
          c.on = !c.on;
          LO.store.save();
          LO.ui.toast(c.on ? 'Automatic backup on' : 'Automatic backup off');
          this.sheet();
        },
        lattice: () => { location.href = 'archive/lattice.html'; },
        wipe: () => {
          if (!confirm('Delete everything on this device? Download a backup first if you want it back.')) return;
          LO.store.wipe();
          indexedDB.deleteDatabase('life-organizer');
          setTimeout(() => location.reload(), 200);
        }
      };
      box.querySelectorAll('[data-s]').forEach(b => { b.onclick = () => acts[b.dataset.s](); });
      file.onchange = () => {
        const f = file.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try { LO.store.import(r.result); LO.ui.toast('Restored'); location.reload(); }
          catch (e) { LO.ui.toast('That file did not read as a backup'); }
        };
        r.readAsText(f);
      };
    },

    closeSheet() { document.getElementById('sheet2').hidden = true; }
  };

  LO.machine = machine;
})(window.LO);
