/* Lumen: a glass companion, a circle of friends, and small discoveries. No remote profiling. */
(function (LO) {
  'use strict';
  const { store, ui, D } = LO;
  let returnFocus, discoveryOffset = 0, lumenId = 0;
  const animated = new WeakSet();
  const movers = new Set();
  const moverOf = new WeakMap();
  let animationFrame = 0, lastFrame = 0;
  const observer = window.IntersectionObserver ? new IntersectionObserver(entries => {
    entries.forEach(entry => { const mover = moverOf.get(entry.target); if (mover) mover.visible = entry.isIntersecting; });
  }, { rootMargin: '80px' }) : null;

  /** A real 2D animation, built from separate optical wedges. The moving
      core repels each wedge by a different amount along its own axis. */
  function lumen(kind) {
    const id = 'lumen-' + (++lumenId);
    const wedges = Array.from({ length: 40 }, (_, i) => {
      const a = i * 9;
      const width = 2.1 + (i % 5) * 0.22;
      const end = 39 + (i % 4) * 0.8;
      return `<g class="lumen-wedge" data-angle="${a}" data-phase="${(i * 1.73).toFixed(2)}" transform="translate(50 50) rotate(${a}) translate(1.5 0)">
        <path d="M8 ${-width / 5} L${end} ${-width} Q44 0 ${end} ${width} L8 ${width / 5} Z" fill="url(#${id}-glass)" stroke="url(#${id}-edge)"/>
        <path class="wedge-glint" d="M12 0 L${end - 2} ${(-width * .32).toFixed(2)}"/>
      </g>`;
    }).join('');
    return `<span class="lumen lumen-${kind || 'mini'}" data-lumen role="img" aria-label="Lumen, an expanded glass sphere moving around a living light">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="${id}-glass" x1="0" x2="1"><stop stop-color="#fff" stop-opacity=".08"/><stop offset=".38" stop-color="#aee6ee" stop-opacity=".55"/><stop offset=".62" stop-color="#fff8dd" stop-opacity=".82"/><stop offset="1" stop-color="#efae58" stop-opacity=".25"/></linearGradient>
          <linearGradient id="${id}-edge"><stop stop-color="#fff" stop-opacity=".85"/><stop offset=".5" stop-color="#8cd7e5" stop-opacity=".42"/><stop offset="1" stop-color="#ffe3a1" stop-opacity=".75"/></linearGradient>
          <radialGradient id="${id}-core"><stop stop-color="#fff"/><stop offset=".2" stop-color="#fff7cf"/><stop offset=".55" stop-color="#efbd63" stop-opacity=".9"/><stop offset="1" stop-color="#e86636" stop-opacity="0"/></radialGradient>
          <filter id="${id}-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.1"/></filter>
        </defs>
        <g class="lumen-wedges">${wedges}</g>
        <g class="lumen-core" transform="translate(50 50)"><circle r="10" fill="url(#${id}-core)" filter="url(#${id}-glow)"/><circle r="3.2" fill="#fff9d5"/><circle class="core-spark" r="1.1" fill="#fff"/></g>
      </svg>
    </span>`;
  }

  /** The trail is intentionally much larger than the app frame. Its soft
      currents carry several deterministic branching trees, so it reads as
      light breaking through glass instead of a second solid ribbon. */
  function trail() {
    const veins = [];
    function grow(x, y, length, angle, depth, phase) {
      const bend = (phase % 2 ? -1 : 1) * (5 + depth * 2.5);
      const x2 = x + Math.cos(angle) * length;
      const y2 = y + Math.sin(angle) * length;
      const mx = (x + x2) / 2 + Math.cos(angle + Math.PI / 2) * bend;
      const my = (y + y2) / 2 + Math.sin(angle + Math.PI / 2) * bend;
      veins.push(`<path class="trail-depth-${depth}" style="--phase:${phase}" d="M${x.toFixed(1)} ${y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}"/>`);
      if (!depth) return;
      grow(x2, y2, length * .64, angle + .31 + (phase % 3) * .025, depth - 1, phase + 1);
      grow(x2, y2, length * .57, angle - .39 - (phase % 2) * .035, depth - 1, phase + 3);
    }
    grow(1010, 65, 205, 2.08, 4, 0);
    grow(805, 405, 170, 2.34, 4, 4);
    grow(610, 700, 125, 2.58, 3, 8);
    return `<div class="lumen-trail" aria-hidden="true"><svg viewBox="0 0 1100 1200" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="trail-light" x1="100%" y1="0" x2="0" y2="100%"><stop stop-color="#fff8d8"/><stop offset=".42" stop-color="#efbd69"/><stop offset="1" stop-color="#8ddce8" stop-opacity="0"/></linearGradient>
      </defs>
      <g class="trail-haze">
        <path class="haze-wide" d="M1120 20 C810 230 1040 410 690 555 S260 820 -110 1190"/>
        <path class="haze-mid" d="M1190 160 C880 330 990 510 650 650 S220 850 -80 1080"/>
        <path class="haze-fine" d="M970 -80 C760 250 835 430 520 585 S150 680 -120 930"/>
      </g>
      <g class="trail-fractals">${veins.join('')}</g>
    </svg></div>`;
  }

  function animateLumen(el) {
    if (animated.has(el)) return;
    animated.add(el);
    const mover = {
      el, wedges: [...el.querySelectorAll('.lumen-wedge')], core: el.querySelector('.lumen-core'),
      start: performance.now(), visible: true
    };
    movers.add(mover); moverOf.set(el, mover); if (observer) observer.observe(el);
    if (!animationFrame) animationFrame = requestAnimationFrame(moveLumens);
  }

  function moveLumens(now) {
    animationFrame = requestAnimationFrame(moveLumens);
    if (document.hidden || now - lastFrame < 42) return;
    lastFrame = now;
    const still = document.body.classList.contains('still') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    movers.forEach(mover => {
      if (!mover.el.isConnected) { movers.delete(mover); if (observer) observer.unobserve(mover.el); return; }
      if (!mover.visible) return;
      const t = (now - mover.start) / 1000;
      const cx = still ? 0 : Math.sin(t * .63) * 2.8;
      const cy = still ? 0 : Math.cos(t * .47) * 2.1;
      mover.core.setAttribute('transform', `translate(${50 + cx} ${50 + cy})`);
      mover.wedges.forEach((w, i) => {
        const angle = Number(w.dataset.angle), rad = angle * Math.PI / 180;
        const phase = Number(w.dataset.phase);
        const pulse = still ? 0 : Math.sin(t * (.72 + (i % 7) * .035) + phase) * (.55 + (i % 4) * .15);
        const lightPull = cx * Math.cos(rad) + cy * Math.sin(rad);
        const distance = 1.5 + pulse + lightPull * .42;
        const turn = still ? 0 : Math.sin(t * .38 + phase) * .55;
        w.setAttribute('transform', `translate(50 50) rotate(${angle + turn}) translate(${distance} 0)`);
        w.style.opacity = String(.66 + (still ? 0 : Math.sin(t * .9 + phase) * .13));
      });
    });
  }

  function hydrate(root) {
    (root || document).querySelectorAll('[data-lumen-placeholder]').forEach(slot => {
      slot.outerHTML = lumen(slot.dataset.lumenPlaceholder || 'mini');
    });
    (root || document).querySelectorAll('[data-lumen]').forEach(animateLumen);
  }
  const facts = [
    { topic: 'springs', title: 'A spring with its own thermostat', text: 'Rock Springs at Kelly Park flows at about 68°F year-round. The cool water you feel is groundwater arriving at the surface.', source: 'Orange County', url: 'https://newsroom.ocfl.net/2025/07/spotlight-on-kelly-park-an-apopka-landmark-and-natural-treasure/', ask: 'How would you explain that cool water to someone on their first paddle?' },
    { topic: 'springs', title: 'Two springs, two temperatures', text: 'Wekiwa Springs is described by Florida State Parks as 72°F year-round. Nearby springs do not necessarily share the same temperature.', source: 'Florida State Parks', url: 'https://www.floridastateparks.org/parks-and-trails/wekiwa-springs-state-park', ask: 'Try asking someone to guess the temperature before sharing the answer.' },
    { topic: 'nature', title: 'A window into the ground', text: 'Sinkholes at Lafayette Blue Springs provide openings through which water can recharge the aquifer. What happens at the surface matters underground.', source: 'Florida State Parks', url: 'https://www.floridastateparks.org/learn/springs-lafayette-blue-springs', ask: 'What can you see around you that connects surface water and groundwater?' },
    { topic: 'nature', title: 'The spring has a larger story', text: 'Florida DEP identifies lower groundwater levels and excess nutrients as pressures on springs. Protecting a spring involves more than its visible pool.', source: 'Florida DEP', url: 'https://floridadep.gov/springs', ask: 'Tell the story in one friendly sentence, without turning it into a lecture.' }
  ];
  function discovery() {
    const selected = store.state.guidance.interests;
    const pool = facts.filter(f => selected.includes(f.topic));
    if (!pool.length) return '';
    const f = pool[(Math.floor(Date.now() / 14400000) + discoveryOffset) % pool.length];
    return `<aside class="discovery"><div class="eyebrow">A little wonder · ${ui.esc(f.topic)}</div><h3>${ui.esc(f.title)}</h3><p>${ui.esc(f.text)}</p><a href="${f.url}" target="_blank" rel="noopener noreferrer">${f.source} ↗</a><details><summary>Make it a conversation</summary><p>${ui.esc(f.ask)}</p></details><button class="flat" data-discover>Another discovery ↻</button></aside>`;
  }
  function birthday(p) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.birthday || '')) return '';
    const md = p.birthday.slice(5), year = new Date().getFullYear();
    let next = year + '-' + md;
    if (next < D.today()) next = (year + 1) + '-' + md;
    const days = D.daysBetween(D.today(), next);
    return days === 0 ? 'Birthday today 🎂' : 'Birthday in ' + days + ' days';
  }
  function due(p) {
    return p.nextReach || (p.lastContact ? D.shift(Number(p.cadence) || 14, p.lastContact) : D.today());
  }
  function friendsBody() {
    const list = store.state.people.slice().sort((a, b) => due(a).localeCompare(due(b)));
    return `<header class="drawer-heading"><div><div class="eyebrow">Your circle</div><h2>Friends to keep</h2></div><button class="flat" data-closefriends aria-label="Close friends">×</button></header>
      <p class="note">Real people. Small moments. A reason to reach out.</p>
      <form data-friendform class="friend-form"><label>Name<input name="name" required maxlength="80" autocomplete="off"></label><label>Birthday <small>(optional)</small><input name="birthday" type="date"></label><label>Reach out every<select name="cadence"><option value="7">Week</option><option value="14" selected>Two weeks</option><option value="30">Month</option><option value="90">Three months</option></select></label><label>Next reach-out<input name="nextReach" type="date"></label><label>Good time / shared interests<input name="note" maxlength="240" placeholder="Weekend afternoons, a walk…"></label><button class="go" type="submit">Add to my circle</button></form>
      <div class="friend-list">${list.length ? list.map(p => `<article class="friend-card"><span class="friend-avatar">${ui.esc(p.name.slice(0, 1).toUpperCase())}</span><div><h3>${ui.esc(p.name)}</h3><p class="note">${due(p) <= D.today() ? 'A good day to reach out' : 'Next: ' + D.pretty(due(p))}</p>${birthday(p) ? `<p class="birthday">${birthday(p)}</p>` : ''}<p>${ui.esc(p.note || '')}</p></div><div class="acts"><button class="flat" data-contact="${p.id}">We connected ✓</button><button class="flat" data-snooze="${p.id}">Tomorrow</button></div><details><summary>Edit friend</summary><form data-editfriend="${p.id}" class="friend-form"><label>Name<input name="name" required maxlength="80" value="${ui.esc(p.name)}"></label><label>Birthday<input type="date" name="birthday" value="${ui.esc(p.birthday || '')}"></label><label>Days between contact<input name="cadence" type="number" min="1" max="365" required value="${Number(p.cadence) || 14}"></label><label>Next reach-out<input name="nextReach" type="date" value="${ui.esc(due(p))}"></label><label>Good time / shared interests<input name="note" maxlength="240" value="${ui.esc(p.note || '')}"></label><button class="flat">Save friend</button></form></details></article>`).join('') : '<p class="note">Your circle starts with one name. No invitations are sent.</p>'}</div>`;
  }
  function bindFriends() {
    const el = document.getElementById('friends-drawer');
    el.querySelector('[data-closefriends]').onclick = closeFriends;
    function fields(form) {
      const f = Object.fromEntries(new FormData(form));
      return { name: f.name.trim(), birthday: f.birthday, cadence: Math.max(1, Math.min(365, Number(f.cadence) || 14)), nextReach: f.nextReach, note: f.note.trim() };
    }
    el.querySelector('[data-friendform]').onsubmit = e => {
      e.preventDefault(); const data = fields(e.target); if (!data.name) return;
      store.add('people', Object.assign(data, { lastContact: '', created: D.today() })); paintFriends();
    };
    el.querySelectorAll('[data-editfriend]').forEach(form => form.onsubmit = e => {
      e.preventDefault(); const data = fields(form); if (!data.name) return;
      store.patch('people', form.dataset.editfriend, data); paintFriends();
    });
    el.querySelectorAll('[data-contact]').forEach(b => b.onclick = () => {
      const p = store.state.people.find(x => x.id === b.dataset.contact);
      store.contacted(p.id, 'connected'); store.patch('people', p.id, { nextReach: D.shift(p.cadence || 14) }); paintFriends();
    });
    el.querySelectorAll('[data-snooze]').forEach(b => b.onclick = () => { store.patch('people', b.dataset.snooze, { nextReach: D.shift(1) }); paintFriends(); });
  }
  function paintFriends() { document.getElementById('friends-drawer').innerHTML = friendsBody(); bindFriends(); }
  function openFriends() {
    const el = document.getElementById('friends-drawer');
    if (el.open) return;
    returnFocus = document.activeElement; paintFriends(); el.showModal(); document.getElementById('friends-handle').setAttribute('aria-expanded', 'true');
  }
  function closeFriends() { document.getElementById('friends-drawer').close(); }
  function launch(button) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !store.state.guidance.motion || store.state.settings.reduceMotion) return Promise.resolve();
    button.classList.add('launching');
    const flare = document.createElement('div'); flare.className = 'launch-flare'; flare.setAttribute('aria-hidden', 'true'); document.body.appendChild(flare);
    return new Promise(resolve => setTimeout(() => { flare.remove(); button.classList.remove('launching'); resolve(); }, 680));
  }
  function playerStats() {
    const a = LO.adaptive.analyze(store.state);
    return `<div class="player-ribbon">LUMEN / PLAYER RECORD</div><div class="player-stats"><div><b>${a.current}</b><span>Actions · 7 days</span></div><div><b>${store.state.people.length}</b><span>Friends kept</span></div><div><b>${store.state.rewire.reps.length}</b><span>Practices</span></div></div>`;
  }
  function guidancePanel() {
    const a = LO.adaptive.analyze(store.state);
    return `<div class="guidance-card"><div class="eyebrow">Companion compass · ${a.mode}</div><p>${ui.esc(a.reason)}</p><p class="note">Recorded activity is a partial picture, not a judgement of your life.</p><label><input type="checkbox" data-adaptive ${store.state.guidance.enabled ? 'checked' : ''}> Adapt my guidance</label><label><input type="checkbox" data-motion ${store.state.guidance.motion ? 'checked' : ''}> Companion motion</label><fieldset><legend>Discoveries I enjoy</legend>${['springs','nature'].map(t => `<label><input type="checkbox" data-interest="${t}" ${store.state.guidance.interests.includes(t) ? 'checked' : ''}> ${t}</label>`).join('')}</fieldset><button class="flat" data-restore>Restore removed writes</button></div>`;
  }
  function undoEntry(id) {
    const t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = 'Removed from view. <button class="flat">Undo</button>'; document.getElementById('toast').appendChild(t);
    t.querySelector('button').onclick = () => { store.hideEntry(id, true); t.remove(); LO.machine.refresh(); }; setTimeout(() => t.remove(), 12000);
  }
  function boot() {
    hydrate(document);
    const handle = document.createElement('button'); handle.id = 'friends-handle'; handle.innerHTML = '<span>◈</span> Friends'; handle.setAttribute('aria-expanded', 'false'); handle.setAttribute('aria-controls', 'friends-drawer');
    const drawer = document.createElement('dialog'); drawer.id = 'friends-drawer'; drawer.setAttribute('aria-label', 'Close friends');
    document.body.append(handle, drawer); handle.onclick = openFriends;
    let startY = null;
    handle.onpointerdown = e => { startY = e.clientY; handle.setPointerCapture(e.pointerId); };
    handle.onpointermove = e => { if (startY !== null) handle.style.transform = 'translateY(' + Math.max(-50, Math.min(0, e.clientY - startY)) + 'px)'; };
    handle.onpointerup = e => { handle.style.transform = ''; if (startY !== null && startY - e.clientY > 25) { openFriends(); e.preventDefault(); } startY = null; };
    handle.onpointercancel = () => { startY = null; handle.style.transform = ''; };
    drawer.addEventListener('close', () => { handle.setAttribute('aria-expanded', 'false'); if (returnFocus && returnFocus.isConnected) returnFocus.focus(); });
    drawer.onclick = e => { if (e.target === drawer) { const r = drawer.getBoundingClientRect(); if (e.clientX < r.left || e.clientY < r.top) closeFriends(); } };
    document.body.insertAdjacentHTML('beforeend', trail());
    document.addEventListener('click', e => {
      if (e.target.closest('[data-discover]')) { discoveryOffset++; LO.machine.refresh(); }
      if (e.target.closest('[data-friends]')) openFriends();
      if (e.target.closest('[data-restore]')) {
        const visible = new Set(store.visibleChronicle().map(x => x.id));
        const ids = new Set(store.state.chronicle.filter(x => x.type === 'entry-hidden' && !visible.has(x.meta.ref)).map(x => x.meta.ref));
        ids.forEach(id => store.hideEntry(id, true)); ui.toast('Restored ' + ids.size + ' entries'); LO.machine.refresh();
      }
    });
    document.addEventListener('change', e => {
      if (e.target.matches('[data-adaptive]')) store.state.guidance.enabled = e.target.checked;
      else if (e.target.matches('[data-motion]')) store.state.guidance.motion = e.target.checked;
      else if (e.target.matches('[data-interest]')) {
        const t = e.target.dataset.interest, set = new Set(store.state.guidance.interests); e.target.checked ? set.add(t) : set.delete(t); store.state.guidance.interests = [...set];
      } else return;
      store.save(); document.body.classList.toggle('still', !store.state.guidance.motion || store.state.settings.reduceMotion); LO.machine.refresh();
    });
    document.body.classList.toggle('still', !store.state.guidance.motion || store.state.settings.reduceMotion);
  }
  LO.companion = { boot, lumen, trail, hydrate, openFriends: () => { if (!document.getElementById('friends-drawer').open) openFriends(); }, launch, discovery, playerStats, guidancePanel, undoEntry, birthday, due };
})(window.LO);
