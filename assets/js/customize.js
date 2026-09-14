/* ============================================================
   CUSTOMIZE — the paint bucket, under the gear.

   Settings is for what the app does. This is for what it looks
   like, and the two should never be the same panel: one you open
   once a month with a purpose, the other you poke at because you
   feel like a change. Keeping them apart is why the gear stays
   boring.

   Everything here writes CSS custom properties onto the root and
   nothing else. No surface is rebuilt, no state is recomputed, and
   a look is a handful of strings in `settings.look` that restore
   with any backup.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';
  const { ui, store } = LO;

  /* ------------------------------------------------------------
     FIVE LAYOUTS
     Not five themes — five answers to "how much does it show me at
     once", which is the only layout question that matters on a
     phone you open for two seconds.
     ------------------------------------------------------------ */
  const LAYOUTS = [
    { id: 'classic', name: 'Classic', note: 'The full page, as designed.' },
    { id: 'compact', name: 'Compact', note: 'Tighter spacing, more on screen.' },
    { id: 'calm',    name: 'Calm',    note: 'Larger type, more air, less at once.' },
    { id: 'focus',   name: 'Focus',   note: 'The one action and the list. Nothing else.' },
    { id: 'cards',   name: 'Cards',   note: 'Every block on its own panel.' }
  ];

  /* Pastels first, because the graphite is relentless and sometimes
     you want the machine to be quieter. The ember is the default and
     always the way back. */
  const PRESETS = [
    { id: 'ember',   name: 'Ember',    hue: 14,  sat: 74, tint: 0 },
    { id: 'brass',   name: 'Brass',    hue: 38,  sat: 62, tint: 0 },
    { id: 'moss',    name: 'Moss',     hue: 142, sat: 40, tint: 6 },
    { id: 'tide',    name: 'Tide',     hue: 192, sat: 48, tint: 6 },
    { id: 'iris',    name: 'Iris',     hue: 258, sat: 42, tint: 8 },
    { id: 'rose',    name: 'Rose',     hue: 340, sat: 48, tint: 6 },
    { id: 'sand',    name: 'Sand',     hue: 28,  sat: 30, tint: 10 },
    { id: 'slate',   name: 'Slate',    hue: 214, sat: 18, tint: 4 }
  ];

  /* the six scratch kinds, each recolourable on its own */
  const BUBBLES = [
    { id: 'step',     name: 'Step',     fallback: 210 },
    { id: 'outcome',  name: 'Outcome',  fallback: 14 },
    { id: 'blocker',  name: 'Blocker',  fallback: 356 },
    { id: 'resource', name: 'Resource', fallback: 44 },
    { id: 'habit',    name: 'Habit',    fallback: 158 },
    { id: 'note',     name: 'Note',     fallback: 250 }
  ];

  const blank = () => ({ preset: 'ember', hue: null, sat: null, layout: 'classic', bubbles: {} });

  function look() {
    const s = store.state.settings;
    if (!s.look) s.look = blank();
    return s.look;
  }

  /* ------------------------------------------------------------
     APPLY — the whole of the theming, in one place.
     ------------------------------------------------------------ */
  function apply() {
    const L = look();
    const root = document.documentElement;
    const preset = PRESETS.find(p => p.id === L.preset) || PRESETS[0];
    const hue = L.hue === null || L.hue === undefined ? preset.hue : L.hue;
    const sat = L.sat === null || L.sat === undefined ? preset.sat : L.sat;

    const accent = 'hsl(' + hue + ' ' + sat + '% 56%)';
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-soft', 'hsl(' + hue + ' ' + sat + '% 56% / .16)');
    root.style.setProperty('--sc-accent-hi', 'hsl(' + hue + ' ' + Math.min(96, sat + 14) + '% 66%)');
    root.style.setProperty('--sc-accent-lo', 'hsl(' + hue + ' ' + sat + '% 38%)');
    // the tint lifts the graphite a hair toward the accent so the whole
    // surface agrees with it rather than fighting it
    const tint = preset.tint || 0;
    root.style.setProperty('--void-1', 'hsl(' + hue + ' ' + tint + '% 7%)');
    root.style.setProperty('--void-2', 'hsl(' + hue + ' ' + tint + '% 9%)');
    root.style.setProperty('--void-3', 'hsl(' + hue + ' ' + tint + '% 12%)');

    BUBBLES.forEach(function (b) {
      const h = L.bubbles[b.id];
      const use = h === undefined || h === null ? b.fallback : h;
      root.style.setProperty('--k-' + b.id, 'hsl(' + use + ' 52% 48%)');
      root.style.setProperty('--k-' + b.id + '-bg', 'hsl(' + use + ' 62% 97%)');
      root.style.setProperty('--k-' + b.id + '-line', 'hsl(' + use + ' 42% 62% / .55)');
    });

    LAYOUTS.forEach(l => document.body.classList.toggle('lay-' + l.id, L.layout === l.id));

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', 'hsl(' + hue + ' ' + tint + '% 7%)');
  }

  /* ------------------------------------------------------------
     THE PANEL
     ------------------------------------------------------------ */
  function open() {
    const el = document.getElementById('sheet2');
    const L = look();
    const preset = PRESETS.find(p => p.id === L.preset) || PRESETS[0];
    const hue = L.hue === null || L.hue === undefined ? preset.hue : L.hue;
    const sat = L.sat === null || L.sat === undefined ? preset.sat : L.sat;

    el.querySelector('.box').innerHTML = `
      <h2>Customize</h2>
      <p class="lede">How it looks. Nothing here changes what it knows about you.</p>

      <div class="lbl" style="margin-top:0">Layout<span class="ln"></span></div>
      <div class="lay-row">
        ${LAYOUTS.map(l => `
          <button class="lay-chip ${L.layout === l.id ? 'on' : ''}" data-lay="${l.id}">
            <i class="lay-mini lay-mini-${l.id}"></i>
            <b>${ui.esc(l.name)}</b><span>${ui.esc(l.note)}</span>
          </button>`).join('')}
      </div>

      <div class="lbl">Colour<span class="r">${ui.esc(preset.name)}</span></div>
      <div class="swatches">
        ${PRESETS.map(p => `
          <button class="swatch ${L.preset === p.id && L.hue === null ? 'on' : ''}" data-preset="${p.id}"
            style="--sw:hsl(${p.hue} ${p.sat}% 56%)" aria-label="${ui.esc(p.name)}"><i></i><b>${ui.esc(p.name)}</b></button>`).join('')}
      </div>

      <label class="fld"><span>Hue<b data-huelabel>${hue}°</b></span>
        <input type="range" class="huebar" data-hue min="0" max="360" step="1" value="${hue}"></label>
      <label class="fld"><span>Strength<b data-satlabel>${sat}%</b></span>
        <input type="range" data-sat min="8" max="92" step="1" value="${sat}"></label>

      <div class="lbl">Each bubble<span class="r">on the paper</span></div>
      <p class="note" style="margin:0 0 12px">The six kinds in Scratch. Tap a hue to recolour just that one.</p>
      ${BUBBLES.map(b => {
        const h = L.bubbles[b.id] === undefined || L.bubbles[b.id] === null ? b.fallback : L.bubbles[b.id];
        return `<label class="fld bub"><span><i style="background:hsl(${h} 52% 48%)"></i>${ui.esc(b.name)}</span>
          <input type="range" class="huebar" data-bub="${b.id}" min="0" max="360" step="1" value="${h}"></label>`;
      }).join('')}

      <div class="bars" style="margin-top:18px">
        <button class="fullbtn" data-c="reset">Put everything back to Ember</button>
      </div>
      <div class="acts" style="margin-top:16px"><button class="flat" data-c="close">Done</button></div>`;

    el.hidden = false;
    const box = el.querySelector('.box');

    const save = function () { store.save(); apply(); };

    box.querySelectorAll('[data-lay]').forEach(function (b) {
      b.onclick = function () {
        look().layout = b.dataset.lay;
        box.querySelectorAll('[data-lay]').forEach(x => x.classList.toggle('on', x === b));
        save();
      };
    });
    box.querySelectorAll('[data-preset]').forEach(function (b) {
      b.onclick = function () {
        const p = PRESETS.find(x => x.id === b.dataset.preset);
        const L2 = look();
        L2.preset = p.id; L2.hue = null; L2.sat = null;
        save();
        open();                       // repaint the panel against the new base
      };
    });

    const hueIn = box.querySelector('[data-hue]');
    hueIn.oninput = function () {
      look().hue = +hueIn.value;
      box.querySelector('[data-huelabel]').textContent = hueIn.value + '°';
      apply();
    };
    hueIn.onchange = save;

    const satIn = box.querySelector('[data-sat]');
    satIn.oninput = function () {
      look().sat = +satIn.value;
      box.querySelector('[data-satlabel]').textContent = satIn.value + '%';
      apply();
    };
    satIn.onchange = save;

    box.querySelectorAll('[data-bub]').forEach(function (r) {
      r.oninput = function () {
        look().bubbles[r.dataset.bub] = +r.value;
        const dot = r.closest('.fld').querySelector('span i');
        if (dot) dot.style.background = 'hsl(' + r.value + ' 52% 48%)';
        apply();
      };
      r.onchange = save;
    });

    box.querySelector('[data-c="reset"]').onclick = function () {
      store.state.settings.look = blank();
      save();
      open();
      ui.toast('Back to Ember');
    };
    box.querySelector('[data-c="close"]').onclick = function () { LO.machine.closeSheet(); };
  }

  function boot() {
    const top = document.getElementById('top');
    if (!top || document.getElementById('paint')) return apply();
    const b = document.createElement('button');
    b.id = 'paint';
    b.setAttribute('aria-label', 'Customize');
    b.innerHTML =
      '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">' +
        '<path d="M11.5 3 L20 11.5 L12 19.5 A2.2 2.2 0 0 1 8.9 19.5 L4.4 15 A2.2 2.2 0 0 1 4.4 11.9 Z" ' +
          'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
        '<path d="M8.6 6 L6.2 3.6" fill="none" stroke="currentColor" stroke-width="1.7" ' +
          'stroke-linecap="round"/>' +
        '<path d="M20.4 15.4 C21.6 17 22 17.9 22 18.7 A1.7 1.7 0 0 1 18.8 18.7 C18.8 17.9 19.2 17 20.4 15.4 Z" ' +
          'fill="currentColor" stroke="none"/>' +
      '</svg>';
    b.onclick = open;
    document.getElementById('gear').insertAdjacentElement('afterend', b);
    apply();
  }

  LO.customize = { boot, open, apply, LAYOUTS, PRESETS, BUBBLES };
})(window.LO);
