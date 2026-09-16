# Working on Life Organizer

Read this before changing anything. It is short on purpose. The detail lives in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); the *why* behind the choices lives
in [docs/DECISIONS.md](docs/DECISIONS.md), which you should add to when you make
one.

## What this is

A single-user life system: a PWA the owner installs on an Android phone, opens in
two seconds, and is expected to still be running in ten years. It puts today's
chosen work immediately in view, keeps the record so he does not have to, and
reports back what it can actually prove about him.

Zero dependencies. Classic scripts, one global (`window.LO`), no build step to
run it. It must keep loading from a filesystem, a static host, and a `WKWebView`
without changes.

## The shape

Current direction: read `docs/LUMEN-GUIDE.md` and `docs/MASCOT.md` alongside
the decision log. The user explicitly replaced the hexagon-only identity with
a glass companion, a player card, and a friends drawer. Preserve the local,
explainable guidance engine and its pause/motion controls. Never publish private
handoff files under `personal/`.

**Three destinations: Do · Write · Me. There is never a fourth.** Write is the
larger centre action in the bottom bar. A new idea goes inside one of the three
or opens as a temporary sheet; it does not earn another permanent destination.

- **Do** — today's list on raised paper, with capture and completion in place.
- **Write** — one box for everything; it classifies what you wrote.
- **Me** — the profile, evidence, aims, people, and the one-question queue.

Advice is not a page. “I'm spinning” and urge support are small sheets opened
from Do or Me, then dismissed. Old advice chronicle events remain valid history,
but `advice.js`, Mirror, and the Advice surface are not loaded by the live app.

Do has no dealt-action board and no primary Start button. The raised paper list
is the first surface and must stay ahead of quotes, emergency tools, habits, and
discoveries. Quotes still rotate every three hours and swipe for the next.

`assets/css/paper.css` owns the live visual direction and loads last. It is fixed
by design: warm open canvas, white physical sheets, near-black ink, one red-pen
accent, restrained shadows, circular controls, and no animated background. The
old theme editor remains historical source but is not loaded. Simplicity is more
important than offering a palette of alternate interfaces.

**Scratch is not a fourth destination.** Swiping **right** on Do slides the desk aside
and brings in a white grid you put things down on and draw the order between.
It is an overlay on the `#scratch` route with Do still mounted underneath, it is
not in the tab bar, and it must not be promoted into one. A single node is never
a task; circling a group with your thumb is the one act that crosses over, and it
makes one larger task on Do carrying its own map. See DECISIONS.md.

Three lines in Scratch are load-bearing and all three were found the hard way,
on a phone, after looking fine on a desktop:

- `.pane[data-pane="do"] { touch-action: pan-y }` — without it the browser
  claims any drag starting on a scrolling list and the open gesture dies halfway.
- `.sc-world { transform-origin: 0 0 }` — the coordinate model is
  `screen = world × zoom + pan`, which the default 50% origin makes true only at
  zoom 1 and wrong at every other zoom.
- `#scratch` is `inset: 0` (the layout viewport, so the paper reaches every
  edge) and `.sc-chrome` inside it is sized from measurement (the visible
  region, so every control is reachable). **Two boxes, two jobs** — one box
  doing both is what hid the exit button three separate times. Width comes from
  the document unless the page is pinch-zoomed; height is the smaller of the
  document and `visualViewport`.

- Nothing in Scratch may use `window.innerWidth` / `innerHeight`. On a phone
  those are not the visible area — measured at double it on one test viewport —
  and using them puts content off screen and the exit button under the browser
  chrome. Measure the element with `screenBox()`.

**Test full-screen and gesture work on an actual handset.** Every one of these
behaved perfectly under a desktop mouse.

## Invariants — do not break these

1. **One state object.** Everything is `LO.store.state`, one JSON document in
   IndexedDB with a localStorage mirror. A feature that needs a second store is
   a feature that is wrong.
2. **`chronicle` is append-only.** Nothing edits, reorders or migrates what is
   already in it. New shapes go alongside old ones. This is the ten-year
   guarantee, and it is the one rule with no exceptions.
3. **Derived numbers are derived.** The Alignment Index and the player level are
   pure functions of the record. Never cache a score into state — a restored
   backup must reproduce them exactly.
4. **No module computes a score.** If a number matters outside its own file, it
   belongs in `store.vitals()` or `LO.level`.
5. **Points are for finished things.** Writing something down keeps the streak
   alive but pays zero. See DECISIONS.md 2026-09-08 — this one gets re-broken by
   anyone who does not read it.
6. **No claim without its evidence.** `insight.truths()` never says anything the
   data cannot back, and every claim carries the number that earns it.
7. **Escape everything through `ui.esc()`.** Surfaces build HTML strings; that
   function is the whole XSS boundary.
8. **No dependency without a reason that survives a year.** Currently zero.

## The public-repo rule

This repo is public, and the Pages site is readable by anyone regardless. **No
personal content in the code, ever** — not names, not the substance being cut
down on, not real goals or people. That material is *data*: it lives in the
owner's backups and in `personal/` (gitignored). `store.seed()` is deliberately
generic and must stay that way.

**Grep the staged diff before every push.** That check has already caught leaks.

## Shipping a change

```bash
node tools/stamp.js      # timestamps asset URLs + the SW cache name — never skip
node tools/build-app.js  # regenerates the single-file builds in build/
```

Then commit and push to `main`. GitHub Pages rebuilds in ~40s; the installed PWA
is network-first, so it picks the new version up on next open. Do not add
`.github/workflows/*` — the available token lacks `workflow` scope and Pages here
is branch-based with no build step.

Verify in a browser before you push. The app is drivable from the console:
`LO.store`, `LO.level.stats()`, `LO.insight.portrait(LO.store.state)`.

## Conventions

2-space indent, single quotes, semicolons. Dates are `YYYY-MM-DD` local strings
via `LO.D`, never `Date` objects in state. IDs are `store.id(prefix)`. Never
mutate state outside a `store.*` method without calling `store.save()`.

Comments in this codebase explain *why*, in plain English, in the owner's
register. Match that. Commit messages are prose, not bullet lists.
