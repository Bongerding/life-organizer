/* ============================================================
   APP — shell, module registry, the hex lattice, routing.
   Modules register themselves; the shell owns the geometry.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  const app = {
    modules: [],
    current: 'hub',

    register(mod) {
      this.modules.push(mod);
      return mod;
    },
    get(id) { return this.modules.find(m => m.id === id); },
    ring() { return this.modules.filter(m => m.id !== 'trajectory'); },

    /* ---------------- boot ---------------- */
    async boot() {
      await LO.store.load();
      LO.ui.startField(document.getElementById('field'));

      this.renderRail();
      this.renderTopbar();
      this.renderHub();

      LO.store.on(() => { this.renderTopbar(); if (this.current === 'hub') this.renderHub(); });

      addEventListener('hashchange', () => this.route());
      addEventListener('resize', () => this.sizeLattice());
      this.route();

      setTimeout(() => document.getElementById('veil').classList.add('gone'), 480);

      // keyboard: 1-8 jump to modules, esc → hub
      addEventListener('keydown', e => {
        if (/input|textarea|select/i.test(document.activeElement.tagName)) return;
        if (e.key === 'Escape') { location.hash = ''; return; }
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= this.modules.length) location.hash = this.modules[n - 1].id;
      });
    },

    /* ---------------- routing ---------------- */
    route() {
      const id = (location.hash || '').replace('#', '');
      const mod = this.get(id);
      const hub = document.getElementById('hub');
      const panel = document.getElementById('panel');

      if (!mod) {
        this.current = 'hub';
        panel.classList.remove('active');
        hub.classList.add('active');
        this.renderHub();
        this.paintRail(null);
        document.documentElement.style.setProperty('--accent', 'var(--c-core)');
        document.documentElement.style.setProperty('--accent-soft', 'rgba(77,226,192,.14)');
        return;
      }

      this.current = id;
      document.documentElement.style.setProperty('--accent', mod.accent);
      document.documentElement.style.setProperty('--accent-soft', mod.accentSoft);
      hub.classList.remove('active');
      this.openPanel(mod);
      this.paintRail(id);
    },

    openPanel(mod) {
      const panel = document.getElementById('panel');
      panel.innerHTML = `
        <div class="panel-head">
          <button class="back" data-back title="Back to lattice (Esc)">&#8592;</button>
          <div class="panel-title">
            <h1><em>${mod.glyph}</em>${LO.ui.esc(mod.name)}</h1>
            <p>${LO.ui.esc(mod.tagline)}</p>
          </div>
        </div>
        <div class="accent-bar"></div>
        <div data-body></div>`;
      const body = panel.querySelector('[data-body]');
      body.innerHTML = mod.render(LO.store.state);
      panel.querySelector('[data-back]').onclick = () => { location.hash = ''; };
      if (mod.mount) mod.mount(body);
      panel.classList.add('active');
      panel.scrollTop = 0;

      // any module can ask for a re-render of itself
      mod.refresh = () => {
        body.innerHTML = mod.render(LO.store.state);
        if (mod.mount) mod.mount(body);
        this.renderTopbar();
      };
    },

    /* ---------------- topbar ---------------- */
    renderTopbar() {
      const v = LO.store.vitals();
      const s = LO.store.state;
      const el = document.getElementById('pips');
      if (!el) return;
      const p = v.pillars;
      el.innerHTML = [
        { l: 'Index', v: v.index },
        { l: 'Reps', v: p.reps == null ? '—' : p.reps + '%' },
        { l: 'Streak', v: s.meta.streak || 0 },
        { l: 'Loops', v: v.openLoad }
      ].map(x => `<div class="pip"><label>${x.l}</label><b>${x.v}</b></div>`).join('');
    },

    /* ---------------- rail ---------------- */
    renderRail() {
      const rail = document.getElementById('rail');
      rail.innerHTML = this.modules.map(m =>
        `<button class="chip" data-go="${m.id}" style="--accent:${m.accent};--accent-soft:${m.accentSoft}">
           <i></i>${LO.ui.esc(m.name)}
         </button>`).join('');
      rail.querySelectorAll('[data-go]').forEach(b => {
        b.onclick = () => { location.hash = b.dataset.go; };
      });
    },
    paintRail(id) {
      document.querySelectorAll('#rail .chip').forEach(c =>
        c.classList.toggle('on', c.dataset.go === id));
    },

    /* ---------------- the lattice ---------------- */
    renderHub() {
      const hub = document.getElementById('hub');
      const v = LO.store.vitals();
      const ring = this.ring();
      const core = this.get('trajectory');
      const N = ring.length;
      const R = 34; // % of lattice from centre

      const pos = ring.map((m, i) => {
        const a = (-90 + i * (360 / N)) * Math.PI / 180;
        return { m, x: Math.cos(a) * R, y: Math.sin(a) * R };
      });

      const spokes = pos.map(p => `M50 50 L${(50 + p.x).toFixed(2)} ${(50 + p.y).toFixed(2)}`).join(' ');
      const rim = pos.map((p, i) => {
        const q = pos[(i + 1) % N];
        return `M${(50 + p.x).toFixed(2)} ${(50 + p.y).toFixed(2)} L${(50 + q.x).toFixed(2)} ${(50 + q.y).toFixed(2)}`;
      }).join(' ');

      const drift = this.driftLabel();

      hub.innerHTML = `
        <div class="lattice" id="lattice">
          <svg class="web" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="webgrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#4de2c0" stop-opacity=".55"/>
                <stop offset="50%" stop-color="#7c9cff" stop-opacity=".4"/>
                <stop offset="100%" stop-color="#b47cff" stop-opacity=".5"/>
              </linearGradient>
            </defs>
            <path d="${spokes}"/>
            <path d="${rim}" style="animation-duration:34s;opacity:.3"/>
          </svg>

          <svg class="orbit" width="10" height="10" id="orbit">
            <circle class="o1" cx="5" cy="5" r="4"/>
            <circle class="o2" cx="5" cy="5" r="4"/>
          </svg>
          <div class="pulse" id="pulse"></div>

          <button class="node core" data-go="trajectory" title="${LO.ui.esc(core.tagline)}"
                  style="--nx:0px;--ny:0px;--delay:0ms">
            <div class="halo"></div><div class="shell"></div>
            <div class="face">
              <div class="index" id="idxNum">0</div>
              <div class="index-label">Alignment</div>
              <div class="drift">${drift}</div>
            </div>
          </button>

          ${pos.map((p, i) => `
            <button class="node" data-go="${p.m.id}" title="${LO.ui.esc(p.m.tagline)}"
              style="--accent:${p.m.accent};--accent-soft:${p.m.accentSoft};
                     --nxp:${p.x};--nyp:${p.y};--delay:${120 + i * 70}ms">
              <div class="halo"></div><div class="shell"></div>
              <div class="face">
                <div class="glyph">${p.m.glyph}</div>
                <div class="name">${LO.ui.esc(p.m.name)}</div>
                <div class="metric">${p.m.metric ? p.m.metric(LO.store.state) : ''}</div>
              </div>
            </button>`).join('')}
        </div>`;

      hub.querySelectorAll('[data-go]').forEach(b => {
        b.onclick = () => { location.hash = b.dataset.go; };
      });

      this.sizeLattice();
      LO.ui.rollUp(document.getElementById('idxNum'), v.index, 1100);
    },

    /** the lattice is percentage-driven, but hexagons need pixel maths */
    sizeLattice() {
      const lat = document.getElementById('lattice');
      if (!lat) return;
      const w = lat.clientWidth;
      const unit = Math.max(64, w * 0.2);
      lat.style.setProperty('--unit', unit + 'px');
      lat.querySelectorAll('.node').forEach(n => {
        const isCore = n.classList.contains('core');
        n.style.setProperty('--nw', (isCore ? unit * 1.4 : unit) + 'px');
        const xp = parseFloat(n.style.getPropertyValue('--nxp') || 0);
        const yp = parseFloat(n.style.getPropertyValue('--nyp') || 0);
        n.style.setProperty('--nx', (w * xp / 100).toFixed(1) + 'px');
        n.style.setProperty('--ny', (w * yp / 100).toFixed(1) + 'px');
      });
      const orbit = document.getElementById('orbit');
      if (orbit) {
        const d = unit * 2.55;
        orbit.setAttribute('width', d); orbit.setAttribute('height', d);
        orbit.setAttribute('viewBox', `0 0 ${d} ${d}`);
        orbit.querySelector('.o1').setAttribute('cx', d / 2);
        orbit.querySelector('.o1').setAttribute('cy', d / 2);
        orbit.querySelector('.o1').setAttribute('r', d / 2 - 4);
        orbit.querySelector('.o2').setAttribute('cx', d / 2);
        orbit.querySelector('.o2').setAttribute('cy', d / 2);
        orbit.querySelector('.o2').setAttribute('r', d / 2 - 18);
      }
      const pulse = document.getElementById('pulse');
      if (pulse) {
        pulse.style.width = (unit * 1.4) + 'px';
        pulse.style.height = (unit * 1.4 * 1.1547) + 'px';
      }
    },

    /** 7-day change in the index, as a signed label */
    driftLabel() {
      const s = LO.store.indexSeries(14).filter(p => p.v !== null);
      if (s.length < 2) return 'calibrating';
      const d = s[s.length - 1].v - s[0].v;
      return (d >= 0 ? '+' : '') + d + ' / 14d';
    }
  };

  LO.app = app;
})(window.LO);
