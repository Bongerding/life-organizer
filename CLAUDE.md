# Working on Life Organizer

Read this before changing anything. It is short on purpose. The detail lives in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); the *why* behind the choices lives
in [docs/DECISIONS.md](docs/DECISIONS.md), which you should add to when you make
one.

## What this is

A single-user life system: a PWA the owner installs on an Android phone, opens in
two seconds, and is expected to still be running in ten years. It gives him one
thing to start, keeps the record so he does not have to, and reports back what it
can actually prove about him.

Zero dependencies. Classic scripts, one global (`window.LO`), no build step to
run it. It must keep loading from a filesystem, a static host, and a `WKWebView`
without changes.

## The shape

Current direction: read `docs/LUMEN-GUIDE.md` and `docs/MASCOT.md` alongside
the decision log. The user explicitly replaced the hexagon-only identity with
a glass companion, a player card, and a friends drawer. Preserve the local,
explainable guidance engine and its pause/motion controls. Never publish private
handoff files under `personal/`.

**Four tabs: Do · Write · Advice · Me. There is never a fifth.** A new idea goes
inside one of the four or it does not ship. If you think you need a fifth tab,
you have found a feature that belongs somewhere else.

- **Do** — one dealt action with a big target, a capture bar, and the day's list.
- **Write** — one box for everything; it classifies what you wrote.
- **Advice** — the daily line, twelve situational protocols, and the Mirror.

`LO.mirror` asks one question at a time, of two kinds, and the distinction is
load-bearing:

- **Observations** (`OBSERVERS` in `mirror.js`) are *claims*: a number, about
  him, derived from the record. No measurement, no observation — that rule has
  not moved. Shown behind a rule under **What I can prove**.
- **Reflections** (`reflections.js`) are *questions*, which assert nothing and
  therefore need no evidence. Their frame names an **idea**, never a fact about
  him, and is italic and unlined so it cannot borrow a measurement's authority.
  Shown under **Worth thinking about**.

Attribute a named researcher only where the attribution is solid; describe the
idea without a name otherwise. Never write a frame that claims something about
the user, and never let an observation ship without its figure.

The Do board is **swiped**, not buttoned. "Already did it" retires an action for
good via `board.retired`. The action bank is topped up by `LO.actions.generated`
from the user's own aims, habits, people and Scratch nodes — never invented from
nothing. Quotes rotate every three hours and swipe for the next.

`LO.customize` owns everything visual: eight layouts (five density, three
vertical order), colour presets, a tap-a-part diagram that recolours the accent
and the six Scratch kinds, and five backgrounds x three motion speeds. The
accent derives its whole ramp — `--accent-hi/-lo/-glow/-cast` — so never
hard-code an ember hex in a gradient again; that is what left a red rim on the
start button in every other colour. It writes **only** CSS custom properties on
the root plus one body class, and it is a separate panel from Settings on
purpose — Settings is what the app does and should stay boring.
- **Me** — the profile, the numbers, and the question that fills the profile in.

**Scratch is not a fifth tab.** Swiping **right** on Do slides the desk aside
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
