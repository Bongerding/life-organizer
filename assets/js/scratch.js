/* ============================================================
   SCRATCH — the paper next to the desk.

   Do is one thing at a time. This is the opposite: everything at
   once, laid out in space, with the order between things drawn
   rather than described. Put a thing down where it feels like it
   goes, join two of them, and swipe along the join to say which
   one has to happen first.

   It is deliberately white. The app is graphite because it is a
   machine you operate; this is paper you think on, and the change
   of material is the point — you should know which mode you are in
   without reading a word.

   Nothing here is committed to today. A node is an intention with
   a position, not a task, until you send it to the list.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store } = LO;

  const GRID = 26;            // dot spacing, px — half of it is the snap step
  const HOLD = 340;           // ms before a press becomes a wire
  const SLOP = 7;             // px of movement still counted as a tap

  let el = null;              // #scratch
  let world = null;           // the panned layer
  let svg = null;
  let nodesEl = null;
  let open = false;
  let sel = null;             // { kind: 'node' | 'link', id }
  let sizes = {};             // id -> { hw, hh }, measured after paint
  let editing = null;         // the open bubble, if any

  const data = () => store.state.scratch;
  const node = id => data().nodes.find(n => n.id === id);
  const snap = v => Math.round(v / (GRID / 2)) * (GRID / 2);

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
      '</div>' +
      '<div class="sc-top"><b>Scratch</b><span data-count></span></div>' +
      '<p class="sc-hint" data-hint></p>' +
      '<button class="sc-exit" data-exit aria-label="Back to Do">' +
        '<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">' +
          '<path d="M14 5 L7 12 L14 19" fill="none" stroke="currentColor" stroke-width="2.2" ' +
            'stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path d="M7.5 12 H19" fill="none" stroke="currentColor" stroke-width="2.2" ' +
            'stroke-linecap="round"/>' +
        '</svg>' +
      '</button>';
    document.body.appendChild(el);

    world = el.querySelector('[data-world]');
    svg = el.querySelector('[data-svg]');
    nodesEl = el.querySelector('[data-nodes]');

    el.querySelector('[data-exit]').onclick = () => close();
    bindSurface(el.querySelector('[data-surface]'));
    return el;
  }

  /* ---------------- open / close ---------------- */

  function show() {
    build();
    el.hidden = false;
    // clear whatever inline transform the drag that brought us here left behind,
    // then let the class transition finish the travel
    requestAnimationFrame(function () {
      clearDragStyles();
      document.body.classList.add('scratch-open');
      open = true;
      paint();
    });
  }

  function close() {
    if (!open) return;
    document.body.classList.remove('scratch-open');
    clearDragStyles();
    open = false;
    closeBubble();
    sel = null;
    if ((location.hash || '').replace('#', '') === 'scratch') location.hash = 'do';
    setTimeout(function () { if (!open && el) el.hidden = true; }, 340);
  }

  /* ---------------- paint ---------------- */

  function paint() {
    if (!el) return;
    const d = data();
    world.style.transform = 'translate(' + d.view.x + 'px,' + d.view.y + 'px)';
    el.querySelector('.sc-surface').style.backgroundPosition = d.view.x + 'px ' + d.view.y + 'px';

    // anything with an arrow pointing at it is waiting on something else.
    // Drawing the arrow has to change what you see, or it is decoration.
    const blocked = new Set(d.links.filter(function (l) { return l.directed; })
                                   .map(function (l) { return l.to; }));

    nodesEl.innerHTML = d.nodes.map(function (n) {
      const on = sel && sel.kind === 'node' && sel.id === n.id;
      return '<div class="sc-node' + (on ? ' on' : '') + (blocked.has(n.id) ? ' blocked' : '') +
        '" data-node="' + n.id + '" style="left:' + n.x + 'px;top:' + n.y + 'px">' +
        '<span class="sc-text">' + ui.esc(n.text) + '</span></div>';
    }).join('');

    measure();
    paintLinks();

    const n = d.nodes.length;
    const ready = n - blocked.size;
    el.querySelector('[data-count]').textContent =
      !n ? '' : blocked.size ? ready + ' of ' + n + ' can start now' : n + (n === 1 ? ' thing' : ' things');
    hint(n < 2 ? 'Tap anywhere to put something down'
      : !d.links.length ? 'Hold a bubble and drag it onto another to join them'
      : blocked.size ? 'Solid bubbles can start now — faded ones are waiting on something'
      : 'Swipe along a wire, towards whichever one comes last');
  }

  /** read the rendered size of each bubble so wires stop at its edge */
  function measure() {
    sizes = {};
    nodesEl.querySelectorAll('[data-node]').forEach(function (b) {
      sizes[b.dataset.node] = { hw: b.offsetWidth / 2, hh: b.offsetHeight / 2 };
    });
  }

  function paintLinks() {
    const d = data();
    const defs = svg.querySelector('defs').outerHTML;
    svg.innerHTML = defs + d.links.map(function (l) {
      const a = node(l.from), b = node(l.to);
      if (!a || !b) return '';
      const p = trim(a, b);
      const on = sel && sel.kind === 'link' && sel.id === l.id;
      const mx = (p.x1 + p.x2) / 2, my = (p.y1 + p.y2) / 2;
      return '<line class="sc-wire' + (l.directed ? ' flow' : '') + (on ? ' on' : '') + '" ' +
          'x1="' + p.x1 + '" y1="' + p.y1 + '" x2="' + p.x2 + '" y2="' + p.y2 + '" ' +
          (l.directed ? 'marker-end="url(#sc-arrow)"' : '') + '/>' +
        '<line class="sc-hit" data-link="' + l.id + '" ' +
          'x1="' + p.x1 + '" y1="' + p.y1 + '" x2="' + p.x2 + '" y2="' + p.y2 + '"/>' +
        (on ? '<g class="sc-kill" data-killlink="' + l.id + '" ' +
          'transform="translate(' + mx + ',' + my + ')">' +
          '<circle r="11"/><path d="M-3.4 -3.4 L3.4 3.4 M3.4 -3.4 L-3.4 3.4"/></g>' : '');
    }).join('');
  }

  /** shorten a wire so it meets the edge of a bubble, not its centre */
  function trim(a, b) {
    const sa = sizes[a.id] || { hw: 44, hh: 18 };
    const sb = sizes[b.id] || { hw: 44, hh: 18 };
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

  function openBubble(x, y, existing) {
    closeBubble();
    const b = document.createElement('form');
    b.className = 'sc-bubble';
    b.style.left = x + 'px';
    b.style.top = y + 'px';
    b.innerHTML =
      '<input data-in type="text" maxlength="120" autocomplete="off" enterkeyhint="done" ' +
        'placeholder="What is it?" value="' + ui.esc(existing ? existing.text : '') + '">' +
      '<div class="sc-acts">' +
        '<button type="submit" class="sc-ok">' + (existing ? 'Save' : 'Confirm') + '</button>' +
        (existing ? '<button type="button" class="sc-del" data-del>Delete</button>' : '') +
        '<button type="button" class="sc-cancel" data-cancel>Cancel</button>' +
      '</div>';
    world.appendChild(b);
    editing = { el: b, x: x, y: y, id: existing ? existing.id : null };

    const input = b.querySelector('[data-in]');
    const fit = function () {
      input.style.width = Math.max(112, Math.min(208, input.value.length * 8.5 + 34)) + 'px';
    };
    input.oninput = fit;
    fit();
    setTimeout(function () { input.focus(); input.select(); }, 30);

    b.onsubmit = function (e) {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return input.focus();
      if (editing.id) store.scratchRename(editing.id, text);
      else store.scratchAdd(text, snap(x), snap(y));
      closeBubble();
      sel = null;
      paint();
    };
    const del = b.querySelector('[data-del]');
    if (del) del.onclick = function () {
      const id = editing.id;
      closeBubble();
      store.scratchDrop(id);
      sel = null;
      paint();
      ui.toast('Removed');
    };
    b.querySelector('[data-cancel]').onclick = function () { closeBubble(); paint(); };
  }

  function closeBubble() {
    if (editing) { editing.el.remove(); editing = null; }
  }

  /* ---------------- gestures on the paper ---------------- */

  function bindSurface(surface) {
    let mode = null;          // pan | move | wire | link | killlink
    let id = null;
    let sx = 0, sy = 0;       // pointer start, screen space
    let ox = 0, oy = 0;       // the thing's start, world space
    let held = null;
    let live = null;          // the rubber band while wiring
    let moved = false;

    const toWorld = function (e) {
      const r = surface.getBoundingClientRect();
      const d = data();
      return { x: e.clientX - r.left - d.view.x, y: e.clientY - r.top - d.view.y };
    };

    surface.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.sc-bubble')) return;
      // capture keeps the gesture ours if the thumb leaves the element;
      // it throws for a pointer the browser no longer considers active
      try { surface.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
      sx = e.clientX; sy = e.clientY; moved = false;

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
          startLive(n);
          hint('Drag onto another bubble to join them');
        }, HOLD);
        return;
      }

      const wire = e.target.closest('[data-link]');
      if (wire) { mode = 'link'; id = wire.dataset.link; return; }

      mode = 'pan';
      ox = data().view.x; oy = data().view.y;
    });

    surface.addEventListener('pointermove', function (e) {
      if (!mode) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > SLOP) {
        moved = true;
        if (held) clearTimeout(held);
      }
      if (!moved) return;

      if (mode === 'pan') {
        const d = data();
        d.view.x = ox + dx; d.view.y = oy + dy;
        world.style.transform = 'translate(' + d.view.x + 'px,' + d.view.y + 'px)';
        surface.style.backgroundPosition = d.view.x + 'px ' + d.view.y + 'px';
      } else if (mode === 'move') {
        const n = node(id);
        if (!n) return;
        n.x = ox + dx; n.y = oy + dy;
        const b = nodesEl.querySelector('[data-node="' + id + '"]');
        if (b) { b.style.left = n.x + 'px'; b.style.top = n.y + 'px'; }
        paintLinks();
      } else if (mode === 'wire') {
        const p = toWorld(e);
        if (live) { live.setAttribute('x2', p.x); live.setAttribute('y2', p.y); }
        const over = underPointer(e, id);
        nodesEl.querySelectorAll('.sc-node').forEach(function (b) {
          b.classList.toggle('target', !!over && b.dataset.node === over);
        });
      }
    });

    surface.addEventListener('pointerup', finish);
    surface.addEventListener('pointercancel', function () {
      if (held) clearTimeout(held);
      endLive(); mode = null;
      nodesEl.querySelectorAll('.sc-node').forEach(function (x) {
        x.classList.remove('target', 'wiring');
      });
    });

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

      if (m === 'pan') {
        if (moved) { store.save(); return; }
        // a tap on empty paper is where the next thing goes
        if (editing) { closeBubble(); paint(); return; }
        if (sel) { sel = null; paint(); return; }
        const p = toWorld(e);
        openBubble(snap(p.x), snap(p.y), null);
        return;
      }

      if (m === 'move') {
        const n = node(id);
        if (!moved) {
          if (sel && sel.kind === 'node' && sel.id === id && n) openBubble(n.x, n.y + 36, n);
          else { sel = { kind: 'node', id: id }; paint(); }
          return;
        }
        if (n) { n.x = snap(n.x); n.y = snap(n.y); store.save(); }
        paint();
        return;
      }

      if (m === 'wire') {
        endLive();
        const b = underPointer(e, id);
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
      const along = dx * (b.x - a.x) + dy * (b.y - a.y);   // swipe onto the wire's axis
      if (Math.abs(along) < 55) {
        hint('Swipe along the wire, towards whichever one comes last');
        return;
      }
      const firstId = along > 0 ? l.from : l.to;
      store.scratchFlow(linkId, firstId);
      sel = null;
      paint();
      const f = node(firstId);
      ui.toast(f.text.length > 26 ? 'That one comes first' : f.text + ' comes first');
    }

    function startLive(n) {
      live = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      live.setAttribute('class', 'sc-live');
      live.setAttribute('x1', n.x); live.setAttribute('y1', n.y);
      live.setAttribute('x2', n.x); live.setAttribute('y2', n.y);
      svg.appendChild(live);
    }
    function endLive() { if (live) { live.remove(); live = null; } }

    function underPointer(e, not) {
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

  /* ---------------- the swipe that gets you here ----------------
     Leftward, because the page travels left and the paper arrives
     from the right. Vertical wins early so the list still scrolls. */

  function bindEdgeSwipe() {
    let sx = 0, sy = 0, active = false, decided = false, dx = 0;

    document.addEventListener('pointerdown', function (e) {
      if (open) return;
      if (LO.machine.current !== 'do') return;
      const sheet = document.getElementById('sheet2');
      if (sheet && !sheet.hidden) return;
      const pane = document.querySelector('.pane[data-pane="do"]');
      if (!pane || !pane.contains(e.target)) return;
      if (e.target.closest('input,textarea,select,[contenteditable="true"],.hrow,.sos')) return;
      sx = e.clientX; sy = e.clientY; active = true; decided = false; dx = 0;
    }, { passive: true });

    document.addEventListener('pointermove', function (e) {
      if (!active) return;
      const mx = e.clientX - sx, my = e.clientY - sy;
      if (!decided) {
        if (Math.abs(my) > 12 && Math.abs(my) > Math.abs(mx)) { active = false; return; }
        if (mx < -14 && Math.abs(mx) > Math.abs(my) * 1.5) {
          decided = true;
          build();
          el.hidden = false;
          document.body.classList.add('scratch-dragging');
        } else return;
      }
      dx = Math.min(0, mx);
      const w = window.innerWidth;
      document.getElementById('app').style.transform = 'translateX(' + dx + 'px)';
      const tabs = document.getElementById('tabs');
      if (tabs) tabs.style.transform = 'translateX(calc(-50% + ' + dx + 'px))';
      el.style.transform = 'translateX(' + (w + dx) + 'px)';
    }, { passive: true });

    const release = function () {
      if (!active) return;
      active = false;
      document.body.classList.remove('scratch-dragging');
      if (!decided) return;
      decided = false;
      if (-dx > window.innerWidth * 0.26) location.hash = 'scratch';
      else {
        clearDragStyles();
        setTimeout(function () { if (!open && el) el.hidden = true; }, 220);
      }
    };
    document.addEventListener('pointerup', release, { passive: true });
    document.addEventListener('pointercancel', release, { passive: true });

    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) close();
    });
  }

  LO.scratch = {
    open: show,
    close: close,
    isOpen: function () { return open; },
    boot: function () { build(); bindEdgeSwipe(); }
  };
})(window.LO);
