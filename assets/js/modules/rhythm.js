/* ============================================================
   RHYTHM — the architecture of the week.
   Blocks are recurring by weekday. Today renders as a live
   timeline with a NOW marker; the week renders as committed
   structure so you can see what you have actually promised.
   ============================================================ */
(function (LO) {
  'use strict';
  const { ui, store, D } = LO;
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  LO.app.register({
    id: 'rhythm',
    name: 'Rhythm',
    glyph: '◷',
    accent: 'var(--c-rhythm)',
    accentSoft: 'rgba(180,124,255,.14)',
    tagline: 'The shape of the week, and what is live right now',

    metric(s) {
      const n = s.rhythm.blocks.length;
      if (!n) return 'no blocks';
      const today = s.rhythm.blocks.filter(b => b.days.includes(new Date().getDay())).length;
      return today + ' today';
    },

    render(s) {
      const dow = new Date().getDay();
      const now = D.minsNow();
      const today = s.rhythm.blocks
        .filter(b => b.days.includes(dow))
        .sort((a, b) => D.mins(a.start) - D.mins(b.start));

      const next = today.find(b => D.mins(b.start) > now);
      const live = today.find(b => D.mins(b.start) <= now && D.mins(b.end) > now);

      const weekMins = s.rhythm.blocks.reduce((a, b) =>
        a + (D.mins(b.end) - D.mins(b.start)) * b.days.length, 0);

      return `<div class="grid wide">

        ${ui.card('Today · ' + DAYS[dow], today.length ? `
          <div class="tl">${today.map(b => {
            const isNow = live && live.id === b.id;
            return `<div class="blk ${isNow ? 'now' : ''}" style="${b.anchor ? 'border-left-width:5px' : ''}">
              <span class="time">${ui.esc(b.start)} – ${ui.esc(b.end)}</span>
              <span class="lbl">${b.anchor ? '⬢ ' : ''}${ui.esc(b.label)}</span>
              <span class="tag">${ui.domainLabel(b.domain)}</span>
              ${isNow ? '<span class="live">NOW</span>' : ''}
            </div>`;
          }).join('')}</div>` : ui.empty('Nothing scheduled today. Add a block below — start with the one non-negotiable.'),
          { span: true })}

        ${ui.card('Right Now', `
          <div class="big" style="font-size:26px">${live ? ui.esc(live.label) : 'Open'}</div>
          <div class="sub">${live
            ? 'Ends ' + live.end + ' · ' + (D.mins(live.end) - now) + ' min left'
            : 'No block claims this moment.'}</div>
          <div class="hr"></div>
          <div class="kv"><span>Next</span><b>${next ? ui.esc(next.start) : '—'}</b></div>
          <div class="kv"><span>Up</span><b style="font-family:var(--font);font-size:12px">${next ? ui.esc(next.label) : 'nothing left today'}</b></div>
          <div class="kv"><span>Clock</span><b>${D.hhmm(now)}</b></div>`, { delay: 60 })}

        ${ui.card('Committed Structure', `
          <div class="big">${(weekMins / 60).toFixed(1)}<small>hrs / week</small></div>
          <div class="sub">${s.rhythm.blocks.length} block${s.rhythm.blocks.length === 1 ? '' : 's'} ·
            ${s.rhythm.blocks.filter(b => b.anchor).length} anchor${s.rhythm.blocks.filter(b => b.anchor).length === 1 ? '' : 's'}</div>
          <div class="hr"></div>
          ${DAYS.map((d, i) => {
            const mins = s.rhythm.blocks.filter(b => b.days.includes(i))
              .reduce((a, b) => a + (D.mins(b.end) - D.mins(b.start)), 0);
            return `<div style="display:flex;align-items:center;gap:9px;margin-bottom:6px">
              <span style="font-size:10px;letter-spacing:.14em;color:${i === new Date().getDay() ? 'var(--accent)' : 'var(--ink-3)'};width:30px">${d.toUpperCase()}</span>
              <div style="flex:1">${ui.meter(mins / 60 / 12 * 100)}</div>
              <b class="mono" style="font-size:10.5px;color:var(--ink-2);width:34px;text-align:right">${(mins / 60).toFixed(1)}</b>
            </div>`;
          }).join('')}`, { delay: 120 })}

        ${ui.card('New Block', `
          <div data-form>
            ${ui.field('label', 'Block', { ph: 'Deep work, Train, Read, Dinner…' })}
            <div class="row">
              ${ui.field('start', 'Start', { type: 'time', value: '07:00' })}
              ${ui.field('end', 'End', { type: 'time', value: '08:00' })}
            </div>
            ${ui.field('domain', 'Domain', { type: 'select', options: ui.domainOptions() })}
            <label class="fld"><span>Days</span>
              <div class="tags" data-days>
                ${DAYS.map((d, i) => `<button class="tag" data-day="${i}" style="cursor:pointer;font-family:inherit">${d}</button>`).join('')}
              </div>
            </label>
            <label class="fld"><span>Weight</span>
              <div class="seg" data-seg="anchor">
                <button type="button" data-val="1">Anchor</button>
                <button type="button" data-val="0" class="on">Flexible</button>
              </div>
            </label>
            <button class="btn primary" data-add>Add Block</button>
          </div>`, { delay: 180 })}

        ${ui.card('Non-Negotiables', `
          <div class="sub" style="margin-top:0">Rules, not intentions. These hold when the day goes sideways.</div>
          <div class="list" style="margin:12px 0">
            ${s.rhythm.rules.length ? s.rhythm.rules.map(r =>
              `<div class="item"><div class="t">${ui.esc(r.text)}</div><button class="x" data-del-rule="${r.id}">×</button></div>`).join('')
              : ui.empty('No rules set.')}
          </div>
          <div class="row">
            <input data-rule placeholder="No screens after 22:30…">
            <button class="btn sm" data-add-rule style="flex:0 0 auto">Add</button>
          </div>`, { delay: 240 })}

        ${allBlocks(s)}
      </div>`;
    },

    mount(root) {
      const self = LO.app.get('rhythm');
      const form = root.querySelector('[data-form]');

      root.querySelectorAll('[data-day]').forEach(b => {
        b.onclick = () => b.classList.toggle('hot');
      });
      root.querySelectorAll('[data-seg] button').forEach(b => {
        b.onclick = () => {
          b.parentElement.querySelectorAll('button').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
        };
      });

      root.querySelector('[data-add]').onclick = () => {
        const d = ui.read(form);
        const days = [...root.querySelectorAll('[data-day].hot')].map(b => +b.dataset.day);
        if (!d.label.trim()) return ui.toast('Name the block');
        if (!days.length) return ui.toast('Pick at least one day');
        if (D.mins(d.end) <= D.mins(d.start)) return ui.toast('End must be after start');
        store.state.rhythm.blocks.push({
          id: store.id('blk'), label: d.label.trim(), start: d.start, end: d.end,
          domain: d.domain, days, anchor: d.anchor === '1'
        });
        store.save(); ui.toast('Block added'); self.refresh();
      };

      const rule = root.querySelector('[data-rule]');
      const addRule = () => {
        if (!rule.value.trim()) return;
        store.state.rhythm.rules.push({ id: store.id('rule'), text: rule.value.trim() });
        store.save(); ui.toast('Rule set'); self.refresh();
      };
      root.querySelector('[data-add-rule]').onclick = addRule;
      rule.onkeydown = e => { if (e.key === 'Enter') addRule(); };

      root.querySelectorAll('[data-del-rule]').forEach(b => {
        b.onclick = () => { store.drop('rhythm.rules', b.dataset.delRule); self.refresh(); };
      });
      root.querySelectorAll('[data-del-blk]').forEach(b => {
        b.onclick = () => { store.drop('rhythm.blocks', b.dataset.delBlk); self.refresh(); };
      });
    }
  });

  function allBlocks(s) {
    if (!s.rhythm.blocks.length) return '';
    const sorted = [...s.rhythm.blocks].sort((a, b) => D.mins(a.start) - D.mins(b.start));
    return ui.card('All Blocks', `<div class="list">${sorted.map(b => `
      <div class="item">
        <span class="mono" style="font-size:11px;color:var(--ink-2);min-width:88px">${ui.esc(b.start)}–${ui.esc(b.end)}</span>
        <div class="t">${b.anchor ? '⬢ ' : ''}${ui.esc(b.label)}
          <em>${b.days.map(d => DAYS[d]).join(' ')} · ${ui.domainLabel(b.domain)}</em></div>
        <button class="x" data-del-blk="${b.id}">×</button>
      </div>`).join('')}</div>`, { delay: 300, span: true });
  }
})(window.LO);
