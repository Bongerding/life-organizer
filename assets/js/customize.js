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
    { id: 'cards',   name: 'Cards',   note: 'Every block on its own panel.' },
    /* the vertical ones: same blocks, different order down the page */
    { id: 'ledger',  name: 'Ledger',  note: 'Today\u2019s list first, the action under it.' },
    { id: 'tower',   name: 'Tower',   note: 'A narrow centred column, tight rhythm.' },
    { id: 'anchor',  name: 'Anchor',  note: 'The button first. Everything else below.' }
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

  /* Twelve hues, tapped rather than dragged. A slider asks you to hunt for a
     number; a swatch asks you to point at the one you want, which is the only
     thing anyone is actually doing when they change a colour. */
  const HUES = [
    { h: 14,  name: 'Ember' },   { h: 30,  name: 'Amber' },
    { h: 44,  name: 'Brass' },   { h: 68,  name: 'Olive' },
    { h: 120, name: 'Fern' },    { h: 158, name: 'Moss' },
    { h: 184, name: 'Teal' },    { h: 205, name: 'Sky' },
    { h: 232, name: 'Ink' },     { h: 262, name: 'Iris' },
    { h: 300, name: 'Plum' },    { h: 340, name: 'Rose' }
  ];

  /* the parts of the picture you can point at */
  const PARTS = [
    { id: 'accent',   name: 'The accent', note: 'Start button, tabs, every highlight.' },
    { id: 'outcome',  name: 'Outcome',    note: 'What you are actually after.' },
    { id: 'step',     name: 'Step',       note: 'One concrete action.' },
    { id: 'blocker',  name: 'Blocker',    note: 'What is in the way.' },
    { id: 'resource', name: 'Resource',   note: 'What it needs first.' },
    { id: 'habit',    name: 'Habit',      note: 'The repeating thing.' },
    { id: 'note',     name: 'Note',       note: 'Context, not work.' }
  ];

  let picked = 'accent';      // which part the swatches are aimed at

  /* ------------------------------------------------------------
     THE GROUND

     Five backgrounds and three speeds. The default is the one the
     product was designed with; the rest exist because a screen you
     open ten times a day should be allowed to feel different in
     February than it did in September.
     ------------------------------------------------------------ */
  const GROUNDS = [
    { id: 'field',  name: 'Field',  note: 'Drifting motes. The original.' },
    { id: 'glow',   name: 'Glow',   note: 'A single wash of colour from above.' },
    { id: 'aurora', name: 'Aurora', note: 'Slow bands that move behind everything.' },
    { id: 'grid',   name: 'Grid',   note: 'A quiet engineering grid. Still.' },
    { id: 'plain',  name: 'Plain',  note: 'Nothing at all. Just the dark.' }
  ];
  const MOTIONS = [
    { id: 'full',  name: 'Full' },
    { id: 'slow',  name: 'Slow' },
    { id: 'still', name: 'Still' }
  ];

  const blank = () => ({
    preset: 'ember', hue: null, sat: null, layout: 'classic', bubbles: {},
    ground: 'field', motion: 'full'
  });

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

    /* The whole ramp, not just the middle of it. Every round ember thing in
       this app was a gradient with two hard-coded orange ends and the accent
       in between, so changing the accent only ever repainted a third of the
       button and left a red rim round it. Highlight and shadow are the same
       hue now, which is what makes a colour change a colour change. */
    const accent = 'hsl(' + hue + ' ' + sat + '% 56%)';
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-soft', 'hsl(' + hue + ' ' + sat + '% 56% / .16)');
    root.style.setProperty('--accent-hi', 'hsl(' + hue + ' ' + Math.min(98, sat + 16) + '% 68%)');
    root.style.setProperty('--accent-lo', 'hsl(' + hue + ' ' + Math.min(98, sat + 8) + '% 36%)');
    root.style.setProperty('--accent-ink', hue > 40 && hue < 200 ? '#12140f' : '#170603');
    root.style.setProperty('--accent-glow', 'hsl(' + hue + ' ' + sat + '% 56% / .42)');
    root.style.setProperty('--accent-cast', 'hsl(' + hue + ' ' + sat + '% 56% / .10)');
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
    GROUNDS.forEach(g => document.body.classList.toggle('bg-' + g.id, (L.ground || 'field') === g.id));
    MOTIONS.forEach(m => document.body.classList.toggle('mo-' + m.id, (L.motion || 'full') === m.id));

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

      <div class="lbl">Every colour<span class="r">tap a part</span></div>
      <p class="note" style="margin:0 0 14px">This is your screen in miniature, in the layout you just
        chose. Tap anything in it, then tap a colour.</p>
      ${diagram(L)}
      <div class="picked" data-picked></div>
      <div class="hues" data-hues></div>

      <div class="lbl">Background<span class="ln"></span></div>
      <div class="lay-row">
        ${GROUNDS.map(g => `
          <button class="lay-chip ${(L.ground || 'field') === g.id ? 'on' : ''}" data-bg="${g.id}">
            <i class="bg-mini bg-mini-${g.id}"></i>
            <b>${ui.esc(g.name)}</b><span>${ui.esc(g.note)}</span>
          </button>`).join('')}
      </div>
      <div class="seg-row" style="margin-top:10px">
        ${MOTIONS.map(m => `
          <button class="seg-b ${(L.motion || 'full') === m.id ? 'on' : ''}" data-mo="${m.id}"
            >${ui.esc(m.name)}</button>`).join('')}
      </div>

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
        redrawDiagram();        // the picture is the layout, so it moves with it
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

    function paintPicker() {
      const P = PARTS.find(x => x.id === picked) || PARTS[0];
      const cur = hueOf(picked);
      box.querySelector('[data-picked]').innerHTML =
        '<b>' + ui.esc(P.name) + '</b><span>' + ui.esc(P.note) + '</span>' +
        (isSet(picked) ? '<button class="picked-clear" data-clear>Reset</button>' : '');
      box.querySelector('[data-hues]').innerHTML = HUES.map(function (x) {
        return '<button class="hue' + (Math.abs(x.h - cur) < 7 ? ' on' : '') + '" data-hue2="' + x.h +
          '" style="--sw:hsl(' + x.h + ' 58% 54%)" aria-label="' + ui.esc(x.name) + '"></button>';
      }).join('');
      box.querySelectorAll('[data-part]').forEach(function (n) {
        n.classList.toggle('sel', n.dataset.part === picked);
      });
      const clear = box.querySelector('[data-clear]');
      if (clear) clear.onclick = function () {
        if (picked === 'accent') { look().hue = null; look().sat = null; }
        else delete look().bubbles[picked];
        save(); redrawDiagram(); paintPicker();
      };
      box.querySelectorAll('[data-hue2]').forEach(function (b) {
        b.onclick = function () {
          const h = +b.dataset.hue2;
          if (picked === 'accent') look().hue = h;
          else look().bubbles[picked] = h;
          save(); redrawDiagram(); paintPicker();
          const hb = box.querySelector('[data-hue]');
          if (hb && picked === 'accent') {
            hb.value = h;
            box.querySelector('[data-huelabel]').textContent = h + '°';
          }
        };
      });
    }

    function redrawDiagram() {
      const host = box.querySelector('.prev');
      if (host) host.outerHTML = diagram(look());
      bindDiagram();
    }
    function bindDiagram() {
      box.querySelectorAll('[data-part]').forEach(function (n) {
        n.onclick = function (e) {
          e.stopPropagation();
          picked = n.dataset.part;
          paintPicker();
        };
      });
    }
    bindDiagram();
    paintPicker();

    box.querySelectorAll('[data-bg]').forEach(function (b) {
      b.onclick = function () {
        look().ground = b.dataset.bg;
        box.querySelectorAll('[data-bg]').forEach(x => x.classList.toggle('on', x === b));
        save();
        if (LO.ui.restartField) LO.ui.restartField();
      };
    });
    box.querySelectorAll('[data-mo]').forEach(function (b) {
      b.onclick = function () {
        look().motion = b.dataset.mo;
        box.querySelectorAll('[data-mo]').forEach(x => x.classList.toggle('on', x === b));
        save();
        if (LO.ui.restartField) LO.ui.restartField();
      };
    });

    box.querySelector('[data-c="reset"]').onclick = function () {
      store.state.settings.look = blank();
      picked = 'accent';
      save();
      open();
      ui.toast('Back to Ember');
    };
    box.querySelector('[data-c="close"]').onclick = function () { LO.machine.closeSheet(); };
  }

  /* what hue a part is on right now, whether it was set or inherited */
  function hueOf(id) {
    const L = look();
    if (id === 'accent') {
      const p = PRESETS.find(x => x.id === L.preset) || PRESETS[0];
      return L.hue === null || L.hue === undefined ? p.hue : L.hue;
    }
    const b = BUBBLES.find(x => x.id === id);
    const set = L.bubbles[id];
    return set === undefined || set === null ? (b ? b.fallback : 14) : set;
  }
  function isSet(id) {
    const L = look();
    return id === 'accent' ? (L.hue !== null && L.hue !== undefined)
      : (L.bubbles[id] !== undefined && L.bubbles[id] !== null);
  }

  /* ------------------------------------------------------------
     THE PICTURE

     Not a legend and not a list of sliders — the screen itself, at
     thumbnail size, arranged the way the layout you picked arranges
     it. You change a colour by pointing at the thing that has it,
     which is the only mental step anyone actually wants to take.
     ------------------------------------------------------------ */
  function diagram(L) {
    const hue = function (id) { return 'hsl(' + hueOf(id) + ' 56% 54%)'; };
    const soft = function (id) { return 'hsl(' + hueOf(id) + ' 56% 54% / .22)'; };

    const phone =
      '<div class="prev-phone">' +
        '<div class="prev-bar"><i style="background:' + hue('accent') + '"></i><u></u></div>' +
        '<div class="prev-quote prev-b">“ ”</div>' +
        '<div class="prev-card prev-b"><s></s><s class="w"></s></div>' +
        '<button class="prev-go" data-part="accent" style="background:' + hue('accent') + '"></button>' +
        '<div class="prev-list">' +
          '<div class="prev-row prev-b"><s></s></div>' +
          '<div class="prev-row prev-b"><s class="w"></s></div>' +
        '</div>' +
        '<div class="prev-tabs">' +
          '<i style="background:' + hue('accent') + '"></i><i></i><i></i><i></i>' +
        '</div>' +
      '</div>';

    const paper =
      '<div class="prev-paper">' +
        '<span class="prev-paper-tag">Scratch</span>' +
        BUBBLES.map(function (b) {
          return '<button class="prev-node" data-part="' + b.id + '" ' +
            'style="border-color:' + hue(b.id) + ';background:' + soft(b.id) + '">' +
            '<i style="background:' + hue(b.id) + '"></i>' + ui.esc(b.name) + '</button>';
        }).join('') +
      '</div>';

    return '<div class="prev prev-' + (L.layout || 'classic') + '">' + phone + paper + '</div>';
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

  LO.customize = { boot, open, apply, diagram, LAYOUTS, PRESETS, BUBBLES, HUES, PARTS, GROUNDS, MOTIONS };
})(window.LO);
