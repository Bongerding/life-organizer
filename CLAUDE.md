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
- **Advice** — the daily line and twelve situational protocols.
- **Me** — the profile, the numbers, and the question that fills the profile in.

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
