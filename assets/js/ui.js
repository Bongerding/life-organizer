/* ============================================================
   UI — rendering primitives shared by every module.
   Small, dependency-free, string-template based. Modules return
   HTML strings; the shell mounts them and delegates events.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const ui = {
    esc,

    /* ---------- toast ---------- */
    toast(msg, ms) {
      const host = document.getElementById('toast');
      if (!host) return;
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      const el = document.createElement('div');
      el.className = 'toast';
      el.textContent = msg;
      host.appendChild(el);
      setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 320);
      }, ms || 2100);
    },

    /* ---------- card ---------- */
    card(title, body, opts) {
      const o = opts || {};
      return `<div class="card${o.span ? ' span-2' : ''}" style="--d:${o.delay || 0}ms"${o.attr || ''}>
        ${title ? `<h3><i class="dot"></i>${esc(title)}${o.right ? `<span class="right">${o.right}</span>` : ''}</h3>` : ''}
        ${body}
      </div>`;
    },

    /* ---------- meters ---------- */
    meter(pct) {
      const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
      return `<div class="meter"><i style="width:${p}%"></i></div>`;
    },

    ring(pct, size, label) {
      const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
      const s = size || 84, r = (s - 9) / 2, c = 2 * Math.PI * r;
      const off = c * (1 - p / 100);
      return `<svg class="ring" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" style="--full:${c}">
        <circle class="bg" cx="${s / 2}" cy="${s / 2}" r="${r}"/>
        <circle class="fg" cx="${s / 2}" cy="${s / 2}" r="${r}"
          stroke-dasharray="${c}" stroke-dashoffset="${off}"
          transform="rotate(-90 ${s / 2} ${s / 2})"/>
        <text x="${s / 2}" y="${s / 2 + 5}" font-size="${s * .26}">${label != null ? label : p}</text>
      </svg>`;
    },

    /** values: array of numbers or nulls */
    spark(values, opts) {
      const o = opts || {};
      const vals = values.filter(v => v !== null && v !== undefined && !isNaN(v));
      if (vals.length < 2) return `<div class="empty" style="padding:12px">Not enough signal yet</div>`;
      const w = 300, h = 46, pad = 3;
      const min = o.min !== undefined ? o.min : Math.min.apply(null, vals);
      const max = o.max !== undefined ? o.max : Math.max.apply(null, vals);
      const range = (max - min) || 1;
      const pts = [];
      values.forEach((v, i) => {
        if (v === null || v === undefined || isNaN(v)) return;
        const x = (i / Math.max(1, values.length - 1)) * (w - pad * 2) + pad;
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        pts.push([x, y]);
      });
      const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      const area = line + ` L${pts[pts.length - 1][0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`;
      const gid = 'sf' + Math.random().toString(36).slice(2, 7);
      const last = pts[pts.length - 1];
      return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity=".55"/>
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
        </linearGradient></defs>
        <path class="a" d="${area}" fill="url(#${gid})"/>
        <path class="l" d="${line}"/>
        <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.6"/>
      </svg>`;
    },

    /** vertical bar row, e.g. 7-day steps */
    bars(items, opts) {
      const o = opts || {};
      const max = Math.max(1, ...items.map(i => i.v || 0), o.target || 0);
      return `<div style="display:flex;gap:5px;align-items:flex-end;height:72px">${items.map(i => {
        const pct = Math.round(((i.v || 0) / max) * 100);
        const hit = o.target && i.v >= o.target;
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px" title="${esc(i.label)}: ${i.v || 0}">
          <div style="flex:1;width:100%;display:flex;align-items:flex-end">
            <div style="width:100%;height:${Math.max(2, pct)}%;border-radius:4px 4px 2px 2px;
              background:${hit ? 'linear-gradient(180deg,var(--accent),color-mix(in srgb,var(--accent) 40%,#000))' : 'var(--void-4)'};
              box-shadow:${hit ? '0 0 12px -3px var(--accent)' : 'none'};
              animation:grow 700ms var(--spring) both;transform-origin:bottom"></div>
          </div>
          <span style="font-size:8.5px;letter-spacing:.08em;color:var(--ink-3)">${esc(i.label)}</span>
        </div>`;
      }).join('')}</div>`;
    },

    /* ---------- inputs ---------- */
    field(name, label, opts) {
      const o = opts || {};
      const t = o.type || 'text';
      if (t === 'textarea') {
        return `<label class="fld"><span>${esc(label)}</span>
          <textarea name="${name}" placeholder="${esc(o.ph || '')}" rows="${o.rows || 3}">${esc(o.value || '')}</textarea></label>`;
      }
      if (t === 'select') {
        return `<label class="fld"><span>${esc(label)}</span><select name="${name}">
          ${(o.options || []).map(op => `<option value="${esc(op.id)}"${op.id == o.value ? ' selected' : ''}>${esc(op.label)}</option>`).join('')}
        </select></label>`;
      }
      if (t === 'range') {
        return `<label class="fld"><span>${esc(label)} <b class="mono" data-out="${name}" style="color:var(--accent)">${esc(o.value || o.min || 0)}</b></span>
          <input type="range" name="${name}" min="${o.min || 0}" max="${o.max || 10}" step="${o.step || 1}" value="${esc(o.value != null ? o.value : (o.max || 10) / 2)}" oninput="this.closest('label').querySelector('[data-out]').textContent=this.value"></label>`;
      }
      return `<label class="fld"><span>${esc(label)}</span>
        <input type="${t}" name="${name}" value="${esc(o.value || '')}" placeholder="${esc(o.ph || '')}"${o.step ? ` step="${o.step}"` : ''}${o.min != null ? ` min="${o.min}"` : ''}></label>`;
    },

    seg(name, options, current) {
      return `<div class="seg" data-seg="${name}">${options.map(o =>
        `<button type="button" data-val="${esc(o.id)}" class="${o.id == current ? 'on' : ''}">${esc(o.label)}</button>`
      ).join('')}</div>`;
    },

    empty(text) { return `<div class="empty">${text}</div>`; },

    /** read a form's named fields into a plain object */
    read(root) {
      const out = {};
      root.querySelectorAll('[name]').forEach(el => { out[el.name] = el.value; });
      root.querySelectorAll('[data-seg]').forEach(seg => {
        const on = seg.querySelector('button.on');
        out[seg.dataset.seg] = on ? on.dataset.val : null;
      });
      return out;
    },

    domainOptions() { return LO.lib.domains.map(d => ({ id: d.id, label: d.label })); },
    domainLabel(id) { const d = LO.lib.domains.find(x => x.id === id); return d ? d.label : '—'; },

    /* ---------- background particle field ---------- */
    startField(canvas) {
      if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const ctx = canvas.getContext('2d');
      let w, h, dots = [], raf;
      const N = 46;
      function size() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        w = canvas.width = innerWidth * dpr;
        h = canvas.height = innerHeight * dpr;
        canvas.style.width = innerWidth + 'px';
        canvas.style.height = innerHeight + 'px';
        ctx.scale(1, 1);
      }
      function seed() {
        dots = Array.from({ length: N }, () => ({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - .5) * .16, vy: (Math.random() - .5) * .16,
          r: Math.random() * 1.5 + .4
        }));
      }
      function tick() {
        ctx.clearRect(0, 0, w, h);
        for (const d of dots) {
          d.x += d.vx; d.y += d.vy;
          if (d.x < 0 || d.x > w) d.vx *= -1;
          if (d.y < 0 || d.y > h) d.vy *= -1;
        }
        for (let i = 0; i < dots.length; i++) {
          for (let j = i + 1; j < dots.length; j++) {
            const a = dots[i], b = dots[j];
            const dx = a.x - b.x, dy = a.y - b.y, dist = Math.hypot(dx, dy);
            if (dist < 150) {
              ctx.strokeStyle = `rgba(150,196,150,${(1 - dist / 150) * .075})`;
              ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
        }
        for (const d of dots) {
          ctx.fillStyle = 'rgba(186,216,190,.24)';
          ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill();
        }
        raf = requestAnimationFrame(tick);
      }
      size(); seed(); tick();
      addEventListener('resize', () => { cancelAnimationFrame(raf); size(); seed(); tick(); });
    },

    /** count a number up on first paint */
    rollUp(el, to, ms) {
      const dur = ms || 900, from = 0, t0 = performance.now();
      function step(t) {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(from + (to - from) * e);
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
  };

  LO.ui = ui;
})(window.LO);
