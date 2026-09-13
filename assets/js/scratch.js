/* ============================================================
   SCRATCH — the paper next to the desk.

   Do is one thing at a time. This is the opposite: everything at
   once, laid out in space, with the order between things drawn
   rather than described.

   It is deliberately white. The app is graphite because it is a
   machine you operate; this is paper you think on, and the change
   of material is the point — you should know which mode you are in
   without reading a word.

   A single node is never a task. Mapping has to cost nothing and
   commit to nothing, or thinking on paper starts adding to the
   day's obligations. Circling a group with your thumb is the one
   act that crosses over: that becomes one larger task on Do, with
   the shape of what you drew carried across with it.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store } = LO;

  const GRID = 26;            // dot spacing, px at 1× — half of it is the snap step
  const HOLD = 340;           // ms before a press becomes a wire, or becomes ink
  const SLOP = 7;             // px of movement still counted as a tap
  const ZMIN = 0.45, ZMAX = 2.2;

  /* ------------------------------------------------------------
     THE SIX KINDS

     Not decoration. This is a vocabulary for taking a goal apart,
     and the palette teaches it by saying, in one line each, when
     you would reach for it. The line a plan shows on Do is written
     out of these kinds, so choosing the right one is what makes
     the summary read like a plan rather than a pile.
     ------------------------------------------------------------ */
  const TYPES = [
    { id: 'step',     label: 'Step',     glyph: '→',
      hint: 'One concrete action you could start today.' },
    { id: 'outcome',  label: 'Outcome',  glyph: '★',
      hint: 'The thing you actually want. Arrows should end here.' },
    { id: 'blocker',  label: 'Blocker',  glyph: '!',
      hint: 'What is in the way. Named, it stops being a fog.' },
    { id: 'resource', label: 'Resource', glyph: '+',
      hint: 'What it needs first — money, a tool, a person, time.' },
    { id: 'habit',    label: 'Habit',    glyph: '∞',
      hint: 'The repeating thing that makes the outcome inevitable.' },
    { id: 'note',     label: 'Note',     glyph: '¶',
      hint: 'A paragraph of context. Why it matters, or what you learned.' }
  ];
  const typeOf = id => TYPES.find(t => t.id === id) || TYPES[0];

  let el = null, world = null, svg = null, nodesEl = null, inkEl = null;
  let open = false;
  let sel = null;             // { kind: 'node' | 'link', id }
  let flash = [];             // node ids lit up after arriving from Do
  let sizes = {};             // id -> { hw, hh } in world units
  let editing = null;         // the open bubble
  let palette = null;
  let penOn = false;          // the pen toggle, top right
  let locked = null;          // the set the camera is sitting in, by key
  let peeking = false;        // dragged off a locked set; it springs back
  let forget = function () {};   // drop any pointer the surface still thinks is down

  /* ------------------------------------------------------------
     THE ONE MEASUREMENT

     window.innerHeight is not the visible area on a phone. iOS counts
     the space behind the translucent chrome, Android counts the URL
     bar until it hides. Framing a set against it centres the set
     below and right of where you are actually looking, and sizing
     the overlay to it puts the exit button under the browser.

     So nothing here asks the window how big it is. Everything asks
     the surface, which is a real element with a real box, and the
     overlay itself is sized to the smallest honest number we have.
     ------------------------------------------------------------ */
  function screenBox() {
    const surf = el && el.querySelector('.sc-surface');
    const r = surf ? surf.getBoundingClientRect() : null;
    if (r && r.width > 0 && r.height > 0) return { W: r.width, H: r.height };
    const vv = window.visualViewport;
    return {
      W: Math.min(vv ? vv.width : Infinity, window.innerWidth),
      H: Math.min(vv ? vv.height : Infinity, window.innerHeight)
    };
  }

  const data = () => store.state.scratch;
  const node = id => data().nodes.find(n => n.id === id);
  const snap = v => Math.round(v / (GRID / 2)) * (GRID / 2);
  const view = () => data().view;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r = v => Math.round(v * 10) / 10;

  /* ---------------- frame ---------------- */

  function build() {
    if (el) return el;
    el = document.createElement('div');
    el.id = 'scratch';
    el.hidden = true;
    el.innerHTML =
      '<div class="sc-surface" data-surface>' +
        '<div class="sc-world" data-world>' +
          '<svg class="sc-links" data-svg>' +
            '<defs><marker id="sc-arrow" viewBox="0 0 10 10" refX="9" refY="5" ' +
              'markerWidth="5.4" markerHeight="5.4" orient="auto-start-reverse">' +
              '<path d="M0 0 L10 5 L0 10 z"/></marker></defs>' +
          '</svg>' +
          '<div class="sc-nodes" data-nodes></div>' +
        '</div>' +
        '<svg class="sc-ink" data-ink></svg>' +
      '</div>' +
      '<div class="sc-top"><b>Scratch</b><span data-count></span></div>' +
      '<div class="sc-sets" data-sets></div>' +
      '<button class="sc-pen" data-pen aria-label="Draw" aria-pressed="false">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
          '<path d="M4 20 L5.6 15.2 L16.4 4.4 A2 2 0 0 1 19.6 7.6 L8.8 18.4 Z" ' +
            'fill="none" stroke="currentColor" stroke-width="1.9" ' +
            'stroke-linejoin="round" stroke-linecap="round"/>' +
          '<path d="M15 6 L18 9" fill="none" stroke="currentColor" stroke-width="1.9" ' +
            'stroke-linecap="round"/>' +
        '</svg>' +
      '</button>' +
      '<p class="sc-hint" data-hint></p>' +
      '<button class="sc-exit" data-exit aria-label="Back to Do">' +
        '<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">' +
          '<path d="M13.5 3.5 H19 A1.5 1.5 0 0 1 20.5 5 V19 A1.5 1.5 0 0 1 19 20.5 H13.5" ' +
            'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
            'stroke-linejoin="round"/>' +
          '<path d="M3.5 12 H14" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round"/>' +
          '<path d="M10.5 8.2 L14.3 12 L10.5 15.8" fill="none" stroke="currentColor" ' +
            'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
      '</button>';
    document.body.appendChild(el);

    world = el.querySelector('[data-world]');
    svg = el.querySelector('[data-svg]');
    nodesEl = el.querySelector('[data-nodes]');
    inkEl = el.querySelector('[data-ink]');

    el.querySelector('[data-exit]').onclick = () => close();
    el.querySelector('[data-pen]').onclick = () => setPen(!penOn);
    bindSurface(el.querySelector('[data-surface]'));
    trackViewport();
    return el;
  }

  /* The overlay is sized to the *visual* viewport, measured, not guessed.
     A fixed element sized to the layout viewport puts its bottom strip under
     the Android browser chrome — and the bottom strip is where the only way
     out of here lives. dvh is supposed to cover this and mostly does, but it
     is worth measuring the one thing that must never be wrong. */
  function trackViewport() {
    const vv = window.visualViewport;
    const set = function () {
      // the smallest honest number, never the largest: an overlay taller than
      // the visible area hides its own bottom strip, and the only way out of
      // here lives in that strip
      const h = Math.min(
        vv ? vv.height : Infinity,
        window.innerHeight || Infinity,
        document.documentElement.clientHeight || Infinity
      );
      document.documentElement.style.setProperty('--sc-h', Math.round(h) + 'px');
      if (open) { paintSets(); guardExit(); }
    };
    const reframe = function () {
      set();
      if (!open || !locked) return;
      const s0 = setOf(locked);
      if (s0) { const f = frameOf(s0); const v = view(); v.x = f.x; v.y = f.y; v.z = f.z; applyView(); }
    };
    if (vv) { vv.addEventListener('resize', reframe); vv.addEventListener('scroll', set); }
    addEventListener('resize', reframe);
    addEventListener('orientationchange', reframe);
    set();
  }

  /* ---------------- open / close ---------------- */

  function show() {
    build();
    el.hidden = false;
    requestAnimationFrame(function () {
      clearDragStyles();
      document.body.classList.add('scratch-open');
      open = true;
      // you arrive inside a set, not hovering over the whole page
      const all = sets();
      if (!applyPending() && all.length) {
        const want = (locked && setOf(locked)) || nearest() || all[0];
        locked = want.key;
        const f = frameOf(want);
        const v = view(); v.x = f.x; v.y = f.y; v.z = f.z;
      }
      paint();
    });
  }

  function close() {
    if (!open) return;
    document.body.classList.remove('scratch-open');
    clearDragStyles();
    open = false;
    closeBubble();
    closePalette();
    forget();
    if (penOn) setPen(false);
    sel = null; flash = [];
    if ((location.hash || '').replace('#', '') === 'scratch') location.hash = 'do';
    setTimeout(function () { if (!open && el) el.hidden = true; }, 340);
  }

  /** arrive from a plan on Do: centre what it was made of and light it up.
      The framing waits until the overlay is actually on screen — an element
      that is still hidden has no box to measure, and guessing is what put the
      view in the wrong place to begin with. */
  function focus(ids) {
    build();
    pending = (ids || []).slice();
    location.hash = 'scratch';
    setTimeout(function () { flash = []; if (open) paint(); }, 2600);
  }
  let pending = null;

  function applyPending() {
    const list = (pending || []).map(node).filter(Boolean);
    pending = null;
    if (!list.length) return false;
    const m = screenBox();
    const xs = list.map(n => n.x), ys = list.map(n => n.y);
    const cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
    const cy = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
    const w = (Math.max.apply(null, xs) - Math.min.apply(null, xs)) + 300;
    const h = (Math.max.apply(null, ys) - Math.min.apply(null, ys)) + 340;
    const v = view();
    v.z = clamp(Math.min(m.W / w, m.H / h), ZMIN, 1.25);
    v.x = m.W / 2 - cx * v.z;
    v.y = m.H / 2 - cy * v.z;
    flash = list.map(n => n.id);
    locked = null;
    store.save();
    return true;
  }

  /* ------------------------------------------------------------
     THE PEN

     Holding the paper still starts a line, which works — until the
     browser decides a long press was the start of a text selection
     and cancels the gesture out from under you. So the pen is also
     a button: on means every drag draws, off means every drag pans.
     No hunting for a timing window, and you can see which mode you
     are in without trying it.
     ------------------------------------------------------------ */
  function setPen(on) {
    penOn = !!on;
    const b = el.querySelector('[data-pen]');
    b.classList.toggle('on', penOn);
    b.setAttribute('aria-pressed', penOn ? 'true' : 'false');
    el.classList.toggle('pen', penOn);
    if (penOn) hint('Pen is on — draw a circle round a bubble, or a group');
    else paint();
  }

  /* ---------------- paint ---------------- */

  function applyView() {
    const v = view();
    world.style.transform = 'translate(' + v.x + 'px,' + v.y + 'px) scale(' + v.z + ')';
    // The dots are painted in the same coordinates as the bubbles and the dot
    // itself grows with the zoom, so the grid is not a backdrop the nodes float
    // over — it is the paper they are drawn on, and it moves as one thing.
    const surf = el.querySelector('.sc-surface');
    const r0 = Math.max(0.6, Math.min(3.4, 1.15 * v.z));
    surf.style.backgroundImage =
      'radial-gradient(circle at ' + r0 + 'px ' + r0 + 'px, rgba(18,18,24,.22) ' + r0 +
      'px, transparent 0)';
    surf.style.backgroundSize = (GRID * v.z) + 'px ' + (GRID * v.z) + 'px';
    surf.style.backgroundPosition = v.x + 'px ' + v.y + 'px';
  }

  /* The exit is the only way out, so it does not get to rely on `bottom`
     and `env()` resolving the way they should. After every paint we check
     it is actually inside the visible box, and drag it back in if it is not.
     Cheap, and it turns "I am trapped" into a non-event. */
  function guardExit() {
    const ex = el.querySelector('.sc-exit');
    if (!ex) return;
    const m = screenBox(), host = el.getBoundingClientRect(), b = ex.getBoundingClientRect();
    if (!b.height) return;
    if ((b.bottom - host.top) > m.H - 4) {
      ex.style.bottom = 'auto';
      ex.style.top = Math.max(8, m.H - b.height - 18) + 'px';
    }
    if ((b.right - host.left) > m.W - 4) {
      ex.style.right = 'auto';
      ex.style.left = Math.max(8, m.W - b.width - 16) + 'px';
    }
  }

  function paint() {
    if (!el) return;
    const d = data();
    applyView();
    guardExit();

    // anything with an arrow pointing at it is waiting on something else.
    // Drawing the arrow has to change what you see, or it is decoration.
    const blocked = new Set(d.links.filter(l => l.directed).map(l => l.to));

    nodesEl.innerHTML = d.nodes.map(function (n) {
      const t = typeOf(n.type);
      const on = sel && sel.kind === 'node' && sel.id === n.id;
      const wait = blocked.has(n.id) && n.type !== 'note';
      return '<div class="sc-node k-' + t.id + (on ? ' on' : '') + (wait ? ' blocked' : '') +
        (flash.indexOf(n.id) > -1 ? ' flash' : '') + '" data-node="' + n.id + '" ' +
        'style="left:' + n.x + 'px;top:' + n.y + 'px">' +
        (t.id === 'step' ? '' : '<i class="sc-g">' + t.glyph + '</i>') +
        '<span class="sc-text">' + ui.esc(n.text) + '</span></div>';
    }).join('');

    measure();
    paintLinks();

    paintSets();

    const work = d.nodes.filter(n => n.type !== 'note').length;
    const waiting = d.nodes.filter(n => blocked.has(n.id) && n.type !== 'note').length;
    el.querySelector('[data-count]').textContent =
      !d.nodes.length ? '' : waiting ? (work - waiting) + ' of ' + work + ' can start now'
        : d.nodes.length + (d.nodes.length === 1 ? ' thing' : ' things');

    if (penOn) return hint('Pen is on — draw a circle round a bubble, or a group');
    if (!locked && d.nodes.length > 1) {
      return hint('Camera is yours  ·  tap a set on the left to sit back inside it');
    }
    hint(!d.nodes.length ? 'Tap to put something down  ·  double tap to choose a kind'
      : d.nodes.length < 2 ? 'Double tap for the six kinds  ·  hold a bubble to wire it'
      : !d.links.length ? 'Hold a bubble and drag it onto another to join them'
      : waiting ? 'Hold the paper to draw  ·  circle a group to make it one task'
      : 'Swipe along a wire, towards whichever one comes last');
  }

  /** measured in world units, so wires meet the bubble edge at any zoom */
  function measure() {
    sizes = {};
    const z = view().z;
    nodesEl.querySelectorAll('[data-node]').forEach(function (b) {
      const box = b.getBoundingClientRect();
      sizes[b.dataset.node] = { hw: box.width / 2 / z, hh: box.height / 2 / z };
    });
  }

  function paintLinks() {
    const d = data();
    const defs = svg.querySelector('defs').outerHTML;
    svg.innerHTML = defs + d.links.map(function (l) {
      const a = node(l.from), b = node(l.to);
      if (!a || !b) return '';
      const g = wire(a, b);
      const on = sel && sel.kind === 'link' && sel.id === l.id;
      return '<path class="sc-wire' + (l.directed ? ' flow' : '') + (on ? ' on' : '') + '" ' +
          'd="' + g.d + '" fill="none" ' + (l.directed ? 'marker-end="url(#sc-arrow)"' : '') + '/>' +
        '<path class="sc-hit" data-link="' + l.id + '" d="' + g.d + '" fill="none"/>' +
        (on ? '<g class="sc-kill" data-killlink="' + l.id + '" ' +
          'transform="translate(' + g.mx + ',' + g.my + ')">' +
          '<circle r="11"/><path d="M-3.4 -3.4 L3.4 3.4 M3.4 -3.4 L-3.4 3.4"/></g>' : '');
    }).join('');
  }

  /* ------------------------------------------------------------
     THE WIRE

     Straight while you are dragging it, because you are aiming.
     Once it exists it becomes a curve, because a page of straight
     lines through a field of bubbles reads as a mess.

     One cubic does both shapes. The two control points push out
     perpendicular in opposite directions, which is what makes an S.
     If something is sitting in the middle of the run, both get
     pushed the same way instead and the S opens out into a C
     around it — the same formula, sliding between the two as the
     paper gets busier.
     ------------------------------------------------------------ */
  function wire(a, b) {
    const sa = sizes[a.id] || { hw: 44, hh: 18 };
    const sb = sizes[b.id] || { hw: 44, hh: 18 };
    const p = edge(a, b, sa, sb);
    const dx = p.x2 - p.x1, dy = p.y2 - p.y1;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len, py = dx / len;          // unit perpendicular

    const s = Math.min(34, len * 0.17);           // how much of an S
    const dodge = avoid(a, b, p, px, py);         // how much of a C

    const c1x = p.x1 + dx * 0.32 + px * (s + dodge);
    const c1y = p.y1 + dy * 0.32 + py * (s + dodge);
    const c2x = p.x2 - dx * 0.32 + px * (dodge - s);
    const c2y = p.y2 - dy * 0.32 + py * (dodge - s);

    return {
      d: 'M' + r(p.x1) + ' ' + r(p.y1) + ' C' + r(c1x) + ' ' + r(c1y) +
         ' ' + r(c2x) + ' ' + r(c2y) + ' ' + r(p.x2) + ' ' + r(p.y2),
      mx: r((p.x1 + 3 * c1x + 3 * c2x + p.x2) / 8),   // the cubic at t = 0.5
      my: r((p.y1 + 3 * c1y + 3 * c2y + p.y2) / 8)
    };
  }

  /** how hard, and which way, to bend around whatever else is in the run */
  function avoid(a, b, p, px, py) {
    const mx = (p.x1 + p.x2) / 2, my = (p.y1 + p.y2) / 2;
    const len2 = Math.pow(p.x2 - p.x1, 2) + Math.pow(p.y2 - p.y1, 2) || 1;
    let push = 0;
    data().nodes.forEach(function (n) {
      if (n.id === a.id || n.id === b.id) return;
      const s = sizes[n.id] || { hw: 44, hh: 18 };
      const along = ((n.x - p.x1) * (p.x2 - p.x1) + (n.y - p.y1) * (p.y2 - p.y1)) / len2;
      if (along < 0.12 || along > 0.88) return;             // not in the middle stretch
      const off = (n.x - mx) * px + (n.y - my) * py;        // sideways from the line
      const clear = s.hw + 26;
      if (Math.abs(off) > clear) return;
      push += (off >= 0 ? -1 : 1) * (clear - Math.abs(off)) * 0.9;
    });
    return clamp(push, -64, 64);
  }

  /** trim both ends back to the edge of their bubble */
  function edge(a, b, sa, sb) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const cut = function (s) {
      if (!dx && !dy) return 0;
      const tx = dx ? (s.hw + 7) / Math.abs(dx) : Infinity;
      const ty = dy ? (s.hh + 7) / Math.abs(dy) : Infinity;
      return Math.min(1, Math.min(tx, ty));
    };
    const ta = cut(sa), tb = cut(sb);
    return {
      x1: a.x + dx * ta, y1: a.y + dy * ta,
      x2: b.x - dx * tb, y2: b.y - dy * tb
    };
  }

  function hint(t) {
    const h = el.querySelector('[data-hint]');
    if (h && h.textContent !== t) h.textContent = t;
  }

  /* ---------------- the bubble you type into ---------------- */

  function openBubble(x, y, existing, kind) {
    closeBubble(); closePalette();
    const t = typeOf(kind || (existing && existing.type) || 'step');
    const b = document.createElement('form');
    b.className = 'sc-bubble k-' + t.id;
    b.style.left = x + 'px';
    b.style.top = y + 'px';
    b.innerHTML =
      (t.id === 'step' ? '' : '<div class="sc-kind"><i>' + t.glyph + '</i>' + t.label + '</div>') +
      (t.id === 'note'
        ? '<textarea data-in rows="3" maxlength="400" placeholder="' + ui.esc(t.hint) + '">' +
            ui.esc(existing ? existing.text : '') + '</textarea>'
        : '<input data-in type="text" maxlength="120" autocomplete="off" enterkeyhint="done" ' +
            'placeholder="' + ui.esc(t.hint) + '" value="' + ui.esc(existing ? existing.text : '') + '">') +
      '<div class="sc-acts">' +
        '<button type="submit" class="sc-ok">' + (existing ? 'Save' : 'Confirm') + '</button>' +
        (existing ? '<button type="button" class="sc-del" data-del>Delete</button>' : '') +
        '<button type="button" class="sc-cancel" data-cancel>Cancel</button>' +
      '</div>';
    world.appendChild(b);
    editing = { el: b, x: x, y: y, id: existing ? existing.id : null,
                type: t.id, at: Date.now(), fresh: !existing };

    const input = b.querySelector('[data-in]');
    if (input.tagName === 'INPUT') {
      const fit = function () {
        input.style.width = Math.max(116, Math.min(212, input.value.length * 8.5 + 36)) + 'px';
      };
      input.oninput = fit; fit();
    }
    setTimeout(function () { input.focus(); if (input.select) input.select(); }, 30);

    b.onsubmit = function (e) {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return input.focus();
      if (editing.id) store.scratchRename(editing.id, text);
      else store.scratchAdd(text, snap(x), snap(y), editing.type);
      closeBubble();
      sel = null;
      paint();
    };
    const del = b.querySelector('[data-del]');
    if (del) del.onclick = function () {
      const id = editing.id;
      closeBubble();
      store.scratchDrop(id);
      sel = null; paint();
      ui.toast('Removed');
    };
    b.querySelector('[data-cancel]').onclick = function () { closeBubble(); paint(); };
  }

  function closeBubble() { if (editing) { editing.el.remove(); editing = null; } }

  /* ---------------- the six kinds, on a double tap ---------------- */

  function openPalette(x, y) {
    closeBubble(); closePalette();
    const p = document.createElement('div');
    p.className = 'sc-palette';
    p.innerHTML =
      '<div class="sc-p-head">What are you putting down?</div>' +
      '<div class="sc-p-grid">' + TYPES.map(function (t) {
        return '<button class="sc-p-kind k-' + t.id + '" data-kind="' + t.id + '">' +
          '<i>' + t.glyph + '</i><b>' + t.label + '</b>' +
          '<span>' + ui.esc(t.hint) + '</span></button>';
      }).join('') + '</div>' +
      '<button class="sc-p-close" data-pclose>Close</button>';
    el.appendChild(p);
    palette = { el: p, x: x, y: y };
    p.querySelectorAll('[data-kind]').forEach(function (b) {
      b.onclick = function () {
        const kind = b.dataset.kind;
        closePalette();
        openBubble(snap(x), snap(y), null, kind);
      };
    });
    p.querySelector('[data-pclose]').onclick = closePalette;
  }

  function closePalette() { if (palette) { palette.el.remove(); palette = null; } }

  /* ---------------- ink, and the circle that makes a task ---------------- */

  const inkPath = pts => pts.map((p, i) => (i ? 'L' : 'M') + r(p.sx) + ' ' + r(p.sy)).join(' ');

  /** which nodes the loop encloses — the stroke is closed for the test */
  function inside(pts, n) {
    const v = view();
    const x = n.x * v.z + v.x, y = n.y * v.z + v.y;   // node centre, screen space
    let hit = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      if ((a.sy > y) !== (b.sy > y) &&
          x < (b.sx - a.sx) * (y - a.sy) / ((b.sy - a.sy) || 1e-6) + a.sx) hit = !hit;
    }
    return hit;
  }

  function lasso(pts) {
    if (!pts || pts.length < 8) return null;
    const caught = data().nodes.filter(function (n) { return inside(pts, n); });
    return caught.length ? caught : null;
  }

  /* ------------------------------------------------------------
     A CIRCLED GROUP BECOMES ONE TASK

     The only door between the paper and the day's list, and it is
     deliberately a deliberate act. What crosses over is the whole
     shape, not the individual bubbles.
     ------------------------------------------------------------ */
  function makePlan(caught) {
    const ids = caught.map(n => n.id);
    const title = suggestTitle(caught);
    const cx = caught.reduce((a, n) => a + n.x, 0) / caught.length;
    const cy = caught.reduce((a, n) => a + n.y, 0) / caught.length;

    closeBubble();
    const b = document.createElement('form');
    b.className = 'sc-bubble k-plan';
    b.style.left = cx + 'px';
    b.style.top = cy + 'px';
    b.innerHTML =
      '<div class="sc-kind"><i>◇</i>' + caught.length + ' circled</div>' +
      '<input data-in type="text" maxlength="120" value="' + ui.esc(title) + '">' +
      '<div class="sc-acts">' +
        '<button type="submit" class="sc-ok">Add to Do</button>' +
        '<button type="button" class="sc-cancel" data-cancel>Cancel</button>' +
      '</div>';
    world.appendChild(b);
    editing = { el: b, x: cx, y: cy, id: null, type: 'plan', at: Date.now(), fresh: false };

    const input = b.querySelector('[data-in]');
    input.style.width = '198px';
    setTimeout(function () { input.focus(); input.select(); }, 30);

    b.onsubmit = function (e) {
      e.preventDefault();
      store.capturePlan(input.value.trim() || title, ids);
      closeBubble();
      paint();
      ui.toast('On your list, with the map attached');
    };
    b.querySelector('[data-cancel]').onclick = function () { closeBubble(); paint(); };
  }

  /** the outcome if one was named, otherwise whatever the arrows end at */
  function suggestTitle(caught) {
    const out = caught.find(n => n.type === 'outcome');
    if (out) return out.text;
    const ids = caught.map(n => n.id);
    const leaves = caught.filter(function (n) {
      return n.type !== 'note' &&
        !data().links.some(l => l.directed && l.from === n.id && ids.indexOf(l.to) > -1);
    });
    return (leaves[leaves.length - 1] || caught[0]).text;
  }

  /* ------------------------------------------------------------
     WHAT A PLAN LOOKS LIKE ON DO
     A thumbnail of the actual shape, then one line written out of
     the kinds you chose. Both read the live nodes, so the row on
     Do keeps up with the paper.
     ------------------------------------------------------------ */
  function thumb(ids) {
    const ns = (ids || []).map(node).filter(Boolean);
    if (!ns.length) return '';
    const W = 46, H = 30, P = 5;
    const xs = ns.map(n => n.x), ys = ns.map(n => n.y);
    const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    const y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    const sx = v => P + ((v - x0) / ((x1 - x0) || 1)) * (W - P * 2);
    const sy = v => P + ((v - y0) / ((y1 - y0) || 1)) * (H - P * 2);

    const wires = data().links
      .filter(l => ids.indexOf(l.from) > -1 && ids.indexOf(l.to) > -1)
      .map(function (l) {
        const a = node(l.from), b = node(l.to);
        return '<line x1="' + r(sx(a.x)) + '" y1="' + r(sy(a.y)) + '" x2="' + r(sx(b.x)) +
          '" y2="' + r(sy(b.y)) + '"' + (l.directed ? ' marker-end="url(#td-a)"' : '') + '/>';
      }).join('');

    return '<svg class="td-map" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<defs><marker id="td-a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="3.2" ' +
      'markerHeight="3.2" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 z"/></marker></defs>' +
      wires + ns.map(function (n) {
        return '<circle class="k-' + typeOf(n.type).id + '" cx="' + r(sx(n.x)) + '" cy="' +
          r(sy(n.y)) + '" r="' + (n.type === 'outcome' ? 3.2 : 2.3) + '"/>';
      }).join('') + '</svg>';
  }

  /** one line, written out of the kinds */
  function describe(ids) {
    const ns = (ids || []).map(node).filter(Boolean);
    if (!ns.length) return 'The bubbles this came from are gone.';
    const by = k => ns.filter(n => n.type === k);
    const bits = [];
    const named = [];                       // nothing gets said twice in one line
    const say = function (n, phrase) { if (!n) return; named.push(n.id); bits.push(phrase); };

    const steps = by('step').length;
    if (steps) bits.push(steps + (steps === 1 ? ' step' : ' steps'));
    const stop = by('blocker')[0];
    say(stop, stop && 'blocked by ' + stop.text.toLowerCase());
    const need = by('resource')[0];
    say(need, need && 'needs ' + need.text.toLowerCase());
    const hab = by('habit')[0];
    say(hab, hab && 'habit: ' + hab.text.toLowerCase());
    if (!bits.length) bits.push(ns.length + ' bubbles');

    const inSet = ns.map(n => n.id);
    const first = ns.find(function (n) {
      return n.type !== 'note' &&
        !data().links.some(l => l.directed && l.to === n.id && inSet.indexOf(l.from) > -1);
    });
    if (first && ns.length > 1 && named.indexOf(first.id) === -1) {
      bits.push(first.text.toLowerCase() + ' first');
    }
    return bits.join('  ·  ');
  }

  /* ------------------------------------------------------------
     ASSIST — the paper is infinite, which is the problem.

     Nodes cluster into sections whether you meant them to or not.
     When you stop panning or pinching, the view settles toward the
     section you were nearest rather than wherever your thumb happened
     to stop. It is a nudge and not a snap: it never moves you more
     than a fifth of a screen, and if you are deliberately out in open
     paper putting something new down, it leaves you alone.

     The one time it takes over is when nothing is on screen at all
     and the nearest section is more than a screen and a half away.
     That is not a choice, that is being lost, so it frames the
     nearest section instead.
     ------------------------------------------------------------ */
  const REACH = 300;          // world px: closer than this and it is one set

  /* A set is what you would point at and call "that lot". Two things put
     nodes in the same one: an arrow between them, at any distance — you drew
     that on purpose and it means they belong together — or simply sitting
     close, because that is how anyone reads a page. Union-find over both. */
  function sets() {
    const ns = data().nodes;
    if (!ns.length) return [];
    const parent = {};
    ns.forEach(n => { parent[n.id] = n.id; });
    const find = function (a) { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
    const join = function (a, b) { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };

    data().links.forEach(function (l) {
      if (parent[l.from] && parent[l.to]) join(l.from, l.to);
    });
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        if (Math.hypot(ns[i].x - ns[j].x, ns[i].y - ns[j].y) <= REACH) join(ns[i].id, ns[j].id);
      }
    }

    const byRoot = {};
    ns.forEach(function (n) {
      const r0 = find(n.id);
      (byRoot[r0] = byRoot[r0] || []).push(n);
    });

    return Object.keys(byRoot).map(function (k) {
      const g = byRoot[k];
      const xs = g.map(n => n.x), ys = g.map(n => n.y);
      const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
      const y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      // the key has to survive a repaint, so it is the id of the top-left node
      const anchor = g.slice().sort((a, b) => (a.y - b.y) || (a.x - b.x))[0];
      return {
        key: anchor.id, nodes: g,
        c: { x: (x0 + x1) / 2, y: (y0 + y1) / 2 },
        box: { x0: x0, y0: y0, x1: x1, y1: y1 },
        name: setName(g)
      };
    }).sort(function (a, b) { return (a.box.y0 - b.box.y0) || (a.box.x0 - b.box.x0); });
  }

  /** what to call a set: the outcome if you named one, else where it ends */
  function setName(g) {
    const out = g.find(n => n.type === 'outcome');
    if (out) return out.text;
    const ids = g.map(n => n.id);
    const ends = g.filter(function (n) {
      return n.type !== 'note' &&
        !data().links.some(l => l.directed && l.from === n.id && ids.indexOf(l.to) > -1);
    });
    return (ends[0] || g[0]).text;
  }

  const setOf = key => sets().find(s0 => s0.key === key);

  /* ------------------------------------------------------------
     THE CAMERA

     You arrive sitting *in* a set, not floating above the paper.
     While it is locked the view belongs to that set: you can drag to
     peek and it springs back. Pinching is what hands you the camera —
     zooming is the act of saying "let me see more than this" — and
     the buttons down the left put you back into any set you like.
     ------------------------------------------------------------ */
  function frameOf(s0) {
    const m = screenBox(), W = m.W, H = m.H;
    const b = s0.box;
    const w = (b.x1 - b.x0) + 320;          // room for the widest bubble, twice
    const h = (b.y1 - b.y0) + 360;
    const z = clamp(Math.min(W / w, H / h), ZMIN, 1.25);
    return { x: W / 2 - s0.c.x * z, y: H / 2 - s0.c.y * z, z: z };
  }

  function lockTo(key, snap) {
    const s0 = setOf(key);
    if (!s0) return;
    locked = key;
    peeking = false;
    const f = frameOf(s0);
    if (snap) { const v = view(); v.x = f.x; v.y = f.y; v.z = f.z; applyView(); store.save(); }
    else glide(f.x, f.y, f.z);
    paintSets();
  }

  function unlock() {
    if (!locked) return;
    locked = null; peeking = false;
    paintSets();
  }

  /** the set nearest the middle of the screen right now */
  function nearest() {
    const all = sets();
    if (!all.length) return null;
    const v = view(), m = screenBox(), W = m.W, H = m.H;
    const cx = (W / 2 - v.x) / v.z, cy = (H / 2 - v.y) / v.z;
    return all.slice().sort(function (a, b) {
      return Math.hypot(a.c.x - cx, a.c.y - cy) - Math.hypot(b.c.x - cx, b.c.y - cy);
    })[0];
  }

  /** called when a drag or a pinch ends */
  function assist() {
    const all = sets();
    if (!all.length) return;
    if (locked) {                                   // peeked off it: spring back
      const s0 = setOf(locked);
      if (s0) { const f = frameOf(s0); return glide(f.x, f.y, f.z); }
      locked = null;
    }
    // free camera: the one thing it will not do is leave you staring at nothing
    const v = view(), m = screenBox(), W = m.W, H = m.H;
    const onScreen = data().nodes.some(function (n) {
      const sz = sizes[n.id] || { hw: 60, hh: 22 };
      const x = n.x * v.z + v.x, y = n.y * v.z + v.y;
      return x > -sz.hw * v.z && x < W + sz.hw * v.z && y > -sz.hh * v.z && y < H + sz.hh * v.z;
    });
    if (onScreen) return;
    const s0 = nearest();
    if (!s0) return;
    const f = frameOf(s0);
    glide(f.x, f.y, f.z);
    hint('Brought you back to the nearest set');
  }

  /* ---------------- the buttons down the left ---------------- */

  function paintSets() {
    if (!el) return;
    const host = el.querySelector('[data-sets]');
    const all = sets();
    if (all.length < 1) { host.innerHTML = ''; return; }
    host.innerHTML = all.map(function (s0, i) {
      return '<button class="sc-set' + (locked === s0.key ? ' on' : '') + '" data-set="' + s0.key + '">' +
        '<i>' + (i + 1) + '</i><b>' + ui.esc(clip(s0.name, 18)) + '</b>' +
        '<span>' + s0.nodes.length + '</span></button>';
    }).join('');
    host.querySelectorAll('[data-set]').forEach(function (b) {
      b.onclick = function () { lockTo(b.dataset.set); };
    });
  }

  function clip(t, n) {
    t = String(t || '');
    return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t;
  }

  let gliding = null;
  function stopGlide() {
    if (gliding) { cancelAnimationFrame(gliding); gliding = null; }
  }
  function glide(tx, ty, tz) {
    const v = view();
    stopGlide();
    if (store.state.settings.reduceMotion) {
      v.x = tx; v.y = ty; v.z = tz; applyView(); store.save(); return;
    }
    const x0 = v.x, y0 = v.y, z0 = v.z, t0 = performance.now(), dur = 300;
    const step = function (now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      v.x = x0 + (tx - x0) * e; v.y = y0 + (ty - y0) * e; v.z = z0 + (tz - z0) * e;
      applyView();
      if (p < 1) gliding = requestAnimationFrame(step);
      else { gliding = null; store.save(); }
    };
    gliding = requestAnimationFrame(step);
  }

  /* ---------------- gestures on the paper ---------------- */

  function bindSurface(surface) {
    const live = new Map();   // pointerId -> { x, y }
    let mode = null;          // pan | move | wire | link | killlink | ink | pinch
    let id = null;
    let sx = 0, sy = 0, ox = 0, oy = 0;
    let held = null, band = null, stroke = null, strokeEl = null;
    let moved = false, lastTap = 0, lastTapAt = null;
    let pinch = null;

    const toWorld = function (cx, cy) {
      const box = surface.getBoundingClientRect(), v = view();
      return { x: (cx - box.left - v.x) / v.z, y: (cy - box.top - v.y) / v.z };
    };
    const toScreen = function (cx, cy) {
      const box = surface.getBoundingClientRect();
      return { sx: cx - box.left, sy: cy - box.top };
    };

    surface.addEventListener('pointerdown', function (e) {
      live.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (live.size === 2) {                       // a second finger: pinch wins
        if (held) clearTimeout(held);
        endBand(); endStroke();
        const pts = [...live.values()];
        const v = view();
        const box = surface.getBoundingClientRect();
        const mx = (pts[0].x + pts[1].x) / 2 - box.left;
        const my = (pts[0].y + pts[1].y) / 2 - box.top;
        // remember the point on the paper under the fingers. Keeping *that*
        // under them is what makes the zoom feel attached to the hand rather
        // than to the middle of the screen.
        pinch = {
          d: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1, z: v.z,
          wx: (mx - v.x) / v.z, wy: (my - v.y) / v.z
        };
        mode = 'pinch';
        unlock();                    // asking to see more is asking for the camera
        return;
      }
      if (live.size > 2) return;

      // a second tap on a bubble you only just opened asks for the kinds instead
      if (e.target.closest('.sc-bubble')) {
        if (editing && editing.fresh && Date.now() - editing.at < 420) {
          const at = { x: editing.x, y: editing.y };
          closeBubble();
          openPalette(at.x, at.y);
          e.preventDefault();
        }
        return;
      }
      if (e.target.closest('.sc-palette')) return;
      if (palette) { closePalette(); return; }

      stopGlide();
      try { surface.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
      sx = e.clientX; sy = e.clientY; moved = false;

      // with the pen on, the paper is for drawing and nothing else
      if (penOn) {
        mode = 'ink';
        startStroke(e);
        return;
      }

      const kill = e.target.closest('[data-killlink]');
      if (kill) { mode = 'killlink'; id = kill.dataset.killlink; return; }

      const hit = e.target.closest('[data-node]');
      if (hit) {
        id = hit.dataset.node;
        const n = node(id);
        ox = n.x; oy = n.y;
        mode = 'move';
        held = setTimeout(function () {
          if (moved) return;
          mode = 'wire';
          hit.classList.add('wiring');
          startBand(n);
          hint('Drag onto another bubble to join them');
        }, HOLD);
        return;
      }

      const w = e.target.closest('[data-link]');
      if (w) { mode = 'link'; id = w.dataset.link; return; }

      // empty paper: a tap puts something down, a drag pans, a hold inks
      mode = 'pan';
      const v = view(); ox = v.x; oy = v.y;
      held = setTimeout(function () {
        if (moved) return;
        mode = 'ink';
        startStroke(e);
        hint('Circle a bubble, or a group, to make it one task');
      }, HOLD);
    });

    addEventListener('pointermove', function (e) {
      if (!live.has(e.pointerId)) return;
      live.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (mode === 'pinch' && pinch && live.size >= 2) {
        const pts = [...live.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
        const box = surface.getBoundingClientRect();
        const mx = (pts[0].x + pts[1].x) / 2 - box.left;
        const my = (pts[0].y + pts[1].y) / 2 - box.top;
        const v = view();
        v.z = clamp(pinch.z * (dist / pinch.d), ZMIN, ZMAX);
        // the midpoint is read fresh every frame, so two fingers pan the paper
        // as well as scale it. The old version anchored to where they first
        // landed, which is why it felt pinned to the centre of the screen.
        v.x = mx - pinch.wx * v.z;
        v.y = my - pinch.wy * v.z;
        applyView();
        return;
      }
      if (!mode) return;

      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > SLOP) {
        moved = true;
        if (held) clearTimeout(held);
      }
      if (!moved && mode !== 'ink') return;

      if (mode === 'pan') {
        const v = view();
        v.x = ox + dx; v.y = oy + dy;
        if (locked) peeking = true;
        applyView();
      } else if (mode === 'move') {
        const n = node(id);
        if (!n) return;
        const z = view().z;
        n.x = ox + dx / z; n.y = oy + dy / z;
        const b = nodesEl.querySelector('[data-node="' + id + '"]');
        if (b) { b.style.left = n.x + 'px'; b.style.top = n.y + 'px'; }
        paintLinks();
      } else if (mode === 'wire') {
        const p = toWorld(e.clientX, e.clientY);
        if (band) { band.setAttribute('x2', p.x); band.setAttribute('y2', p.y); }
        const over = under(e, id);
        nodesEl.querySelectorAll('.sc-node').forEach(function (b) {
          b.classList.toggle('target', !!over && b.dataset.node === over);
        });
      } else if (mode === 'ink') {
        stroke.push(toScreen(e.clientX, e.clientY));
        strokeEl.setAttribute('d', inkPath(stroke));
      }
    });

    /* Up and cancel listen on the window, not the surface, and that is
       not fussiness: releasing over an element that has just been removed
       — the bubble you tapped twice, a wire you cut — never bubbles back
       here, and a pointer left in `live` makes the next touch read as the
       second finger of a pinch. Every gesture after it would die. */
    addEventListener('pointerup', function (e) {
      if (!live.has(e.pointerId) && mode === null) return;
      live.delete(e.pointerId);
      if (mode === 'pinch') {
        if (live.size < 2) { pinch = null; mode = null; store.save(); paint(); assist(); }
        return;
      }
      if (mode !== null) finish(e);
    });
    addEventListener('pointercancel', function (e) {
      live.delete(e.pointerId);
      // Android fires this when it decides a long press was a text selection.
      // If a stroke is already down, finish it as if the finger lifted —
      // losing the loop someone just drew is the worst possible answer.
      if (mode === 'ink' && stroke && stroke.length > 8) {
        const caught = lasso(stroke);
        endStroke();
        mode = null;
        if (caught) return makePlan(caught);
      }
      reset();
    });

    function reset() {
      if (held) clearTimeout(held);
      endBand(); endStroke(); pinch = null; mode = null;
      nodesEl.querySelectorAll('.sc-node').forEach(function (x) {
        x.classList.remove('target', 'wiring');
      });
    }
    forget = function () { live.clear(); reset(); };

    function finish(e) {
      if (held) clearTimeout(held);
      const dx = e.clientX - sx, dy = e.clientY - sy;
      const m = mode;
      mode = null;

      if (m === 'killlink') {
        store.scratchUnlink(id);
        sel = null; paint(); ui.toast('Wire cut');
        return;
      }

      if (m === 'ink') {
        const caught = lasso(stroke);
        endStroke();
        if (caught) makePlan(caught);
        else { paint(); hint('Nothing in that loop — circle a bubble to make it a task'); }
        return;
      }

      if (m === 'pan') {
        if (moved) { store.save(); assist(); return; }
        if (editing) { closeBubble(); paint(); return; }
        if (sel) { sel = null; paint(); return; }
        const now = Date.now();
        const p = toWorld(e.clientX, e.clientY);
        if (now - lastTap < 400 && lastTapAt &&
            Math.hypot(e.clientX - lastTapAt.x, e.clientY - lastTapAt.y) < 46) {
          lastTap = 0;
          openPalette(snap(p.x), snap(p.y));
          return;
        }
        lastTap = now; lastTapAt = { x: e.clientX, y: e.clientY };
        openBubble(snap(p.x), snap(p.y), null, 'step');
        return;
      }

      if (m === 'move') {
        const n = node(id);
        if (!moved) {
          if (sel && sel.kind === 'node' && sel.id === id && n) openBubble(n.x, n.y + 40, n);
          else { sel = { kind: 'node', id: id }; paint(); }
          return;
        }
        if (n) { n.x = snap(n.x); n.y = snap(n.y); store.save(); }
        paint();
        return;
      }

      if (m === 'wire') {
        endBand();
        const b = under(e, id);
        nodesEl.querySelectorAll('.sc-node').forEach(function (x) {
          x.classList.remove('target', 'wiring');
        });
        if (b) {
          const made = store.scratchLink(id, b);
          ui.toast(made ? 'Joined — now swipe along it to set the order' : 'Already joined');
        }
        paint();
        return;
      }

      if (m === 'link') {
        if (!moved) { sel = { kind: 'link', id: id }; paint(); return; }
        setFlow(id, dx, dy);
      }
    }

    /** whichever way the thumb travelled is the way the work flows:
        you swipe away from the thing that has to happen first */
    function setFlow(linkId, dx, dy) {
      const l = data().links.find(function (x) { return x.id === linkId; });
      if (!l) return;
      const a = node(l.from), b = node(l.to);
      if (!a || !b) return;
      const along = dx * (b.x - a.x) + dy * (b.y - a.y);
      if (Math.abs(along) < 55) {
        hint('Swipe along the wire, towards whichever one comes last');
        return;
      }
      const firstId = along > 0 ? l.from : l.to;
      store.scratchFlow(linkId, firstId);
      sel = null; paint();
      const f = node(firstId);
      ui.toast(f.text.length > 26 ? 'That one comes first' : f.text + ' comes first');
    }

    /* straight while you aim it — the curve is for wires that exist */
    function startBand(n) {
      band = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      band.setAttribute('class', 'sc-live');
      band.setAttribute('x1', n.x); band.setAttribute('y1', n.y);
      band.setAttribute('x2', n.x); band.setAttribute('y2', n.y);
      svg.appendChild(band);
    }
    function endBand() { if (band) { band.remove(); band = null; } }

    function startStroke(e) {
      stroke = [toScreen(e.clientX, e.clientY)];
      strokeEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      strokeEl.setAttribute('class', 'sc-stroke');
      strokeEl.setAttribute('fill', 'none');
      inkEl.appendChild(strokeEl);
    }
    function endStroke() {
      if (strokeEl) {
        const s = strokeEl;
        s.classList.add('gone');
        setTimeout(function () { s.remove(); }, 320);
      }
      strokeEl = null; stroke = null;
    }

    function under(e, not) {
      const stack = document.elementsFromPoint(e.clientX, e.clientY);
      for (let i = 0; i < stack.length; i++) {
        const b = stack[i].closest && stack[i].closest('[data-node]');
        if (b && b.dataset.node !== not) return b.dataset.node;
      }
      return null;
    }
  }

  function clearDragStyles() {
    const app = document.getElementById('app');
    const tabs = document.getElementById('tabs');
    if (app) app.style.transform = '';
    if (tabs) tabs.style.transform = '';
    if (el) el.style.transform = '';
  }

  /* ------------------------------------------------------------
     THE SWIPE THAT GETS YOU HERE

     Rightward, with the paper waiting off the left edge. The Do
     pane is `touch-action: pan-y`, which is what actually makes
     this work on a phone: without it the browser claims any drag
     that starts on a scrollable list, fires pointercancel, and the
     gesture dies halfway. Vertical still scrolls natively.

     A flick counts as much as a long drag — the threshold is
     whichever of distance or speed you satisfy first.
     ------------------------------------------------------------ */
  function bindEdgeSwipe() {
    let sx = 0, sy = 0, active = false, decided = false, dx = 0;
    let lastX = 0, lastT = 0, vel = 0;

    document.addEventListener('pointerdown', function (e) {
      if (open) return;
      if (LO.machine.current !== 'do') return;
      const sheet = document.getElementById('sheet2');
      if (sheet && !sheet.hidden) return;
      const pane = document.querySelector('.pane[data-pane="do"]');
      if (!pane || !pane.contains(e.target)) return;
      if (e.target.closest('input,textarea,select,[contenteditable="true"],.hrow,.sos')) return;
      sx = e.clientX; sy = e.clientY;
      lastX = e.clientX; lastT = e.timeStamp || Date.now(); vel = 0;
      active = true; decided = false; dx = 0;
    }, { passive: true });

    document.addEventListener('pointermove', function (e) {
      if (!active) return;
      const mx = e.clientX - sx, my = e.clientY - sy;
      const t = e.timeStamp || Date.now();
      if (t > lastT) vel = (e.clientX - lastX) / (t - lastT);   // px per ms, signed
      lastX = e.clientX; lastT = t;

      if (!decided) {
        if (Math.abs(my) > 14 && Math.abs(my) > Math.abs(mx) * 1.1) { active = false; return; }
        if (mx > 8 && mx > Math.abs(my) * 1.1) {
          decided = true;
          build();
          el.hidden = false;
          document.body.classList.add('scratch-dragging');
        } else return;
      }
      dx = Math.max(0, mx);
      const w = window.innerWidth;
      document.getElementById('app').style.transform = 'translateX(' + dx + 'px)';
      const tabs = document.getElementById('tabs');
      if (tabs) tabs.style.transform = 'translateX(calc(-50% + ' + dx + 'px))';
      el.style.transform = 'translateX(' + (dx - w) + 'px)';
    }, { passive: true });

    const release = function () {
      if (!active) return;
      active = false;
      document.body.classList.remove('scratch-dragging');
      if (!decided) return;
      decided = false;
      const far = dx > Math.min(96, window.innerWidth * 0.18);
      const fast = vel > 0.35 && dx > 30;
      if (far || fast) location.hash = 'scratch';
      else {
        clearDragStyles();
        setTimeout(function () { if (!open && el) el.hidden = true; }, 220);
      }
    };
    document.addEventListener('pointerup', release, { passive: true });
    document.addEventListener('pointercancel', release, { passive: true });

    addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !open) return;
      if (palette) return closePalette();
      if (editing) { closeBubble(); return paint(); }
      close();
    });
  }

  LO.scratch = {
    open: show,
    close: close,
    focus: focus,
    thumb: thumb,
    describe: describe,
    TYPES: TYPES,
    isOpen: function () { return open; },
    boot: function () { build(); bindEdgeSwipe(); }
  };
})(window.LO);
