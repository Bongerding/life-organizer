# Roadmap

The end state: a system that holds everything about your life, calculates your
trajectory, and trains you toward the person you have decided to become —
reachable from a phone in two seconds.

Current position: **Phase 0 shipped. Phase 1 mostly done — Ignition and the four-tab desk are live.**

---

## Phase 0 — Core (shipped)

The web instrument. Eight modules on a hex lattice, one JSON state object,
an Alignment Index computed from weighted pillars, and a working reprogramming loop.

- [x] Void Lattice design system
- [x] Store with deep-merge migration, export/import
- [x] Trajectory: index, pillars, 30-day line, 90-day slope, bottleneck naming
- [x] Compass: north star, values, identity statements, retired patterns, goals × 5 horizons
- [x] Rhythm: recurring weekday blocks, live NOW marker, non-negotiables
- [x] Forge: habits, 14-day hex strike grid, streaks, variable-ratio reinforcement
- [x] Rewire: targets, weighted drill dealer, 28-situation bank, earned reinforcement
- [x] Vessel: daily body log, targets, training sessions, weight trend
- [x] Mind: daily state check-in, mental load inventory with weighted loops
- [x] Scribe: daily prompt rotation, archive with search, insight layer

## Phase 1 — Depth (in progress)

Make the system know you rather than merely record you.

- [x] **First-run calibration** — `store.seed()` writes identity, values, retired
      patterns, seven goals across horizons, five habits and three rewire targets
      from the user's own stated words, once, into an untouched store.
- [x] **Ignition** — the phone front door. One dealt action at a time with a
      countdown, permission to stop after one, plus Loops, People and Clear.
      See [IGNITION.md](IGNITION.md).
- [x] **People** — friendships with a cadence each, so drifting becomes visible
      before it becomes years.
- [x] **Clarity** — clear-day count, urge-surf protocol, uses logged without shame.
      Feeds the Clear pillar at weight 1.3.
- [x] **One machine instead of eight modules** — the lattice's bottom rail became
      Do / Write / Advice / Me. The old lattice is archived, not deleted.
- [x] **Situational advice** — twelve protocols for the states he actually gets
      stuck in, plus one data-aware daily line. `assets/js/advice.js`.
- [x] **Deep Canopy** — one palette, one accent, centred composition, plainer
      phrasing. See [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md#1-what-changed-in-v04-and-why).
- [x] **One shape on both screens** — the phone moved to the same Do / Write /
      Advice / Me tabs, so there is a single mental model.
- [x] **The insight engine** — `insight.js`: what it wants to say, what it can
      prove with evidence, and what it wants to ask. The system keeps in touch
      with him rather than waiting to be checked.
- [x] **The chronicle** — one append-only event log behind everything, surfaced as
      a searchable day-by-day logbook with a notebook attached.
- [x] **Ten-year storage** — IndexedDB, persistence requested, quota and backup
      age surfaced, append-only history. See [MEMORY.md](MEMORY.md).
- [ ] **Automatic off-device backup** — needs one decision on the target; the four
      options are laid out in [MEMORY.md](MEMORY.md#5-automatic-backup--the-decision-to-make).
      Recommendation: a private GitHub repo, so every save is a restore point.
- [ ] **Weekly review** — auto-generated: what moved, what slipped, which pillar
      carried the week, one question to answer, next week's single lever.
- [ ] **A year in review** — the Chronicle's answer to "where did the years go".
- [ ] **Drill ladders** — exposure difficulty rising with rep count per trait;
      scheduled morning rehearsal and evening audit.
- [ ] **Correlation engine** — sleep vs mood, training vs clarity, load vs
      adherence. Only surfaces a link once there is enough data to mean it.
- [ ] **Domain balance wheel** — where attention actually goes vs where you said
      it should.

## Phase 2 — The App

- [ ] Local-first sync (private repo, worker, or file sync), same JSON contract
- [ ] Auth + one private instance
- [ ] Offline-first service worker so Ignition survives no signal (the manifest and
      icon are already in place; only the worker is missing)
- [ ] Time-series storage so history is not capped by `localStorage`
- [ ] Import bridges: Health/Fitbit sleep + steps, calendar into Rhythm

## Phase 3 — The Mentor

The layer that reads everything and speaks back.

- [ ] Structured brief: `vitals()` + insights + recent journal → a model call
- [ ] Generated drills written from your own patterns, not the static bank
- [ ] Trajectory interrogation: "what happens if I hold this for a year"
- [ ] Scheduled interventions timed to your rhythm and your dips

## Phase 4 — iOS

- [ ] `WKWebView` shell over the same source (already dependency-free, and
      `build/ignition-standalone.html` is already a single file it can load)
- [ ] Native notifications tied to `rhythm.blocks` and drill schedule
- [ ] Home-screen widget: index, today's strikes, the one lever
- [ ] Shortcuts/Siri capture straight into Mind → load
- [ ] Face ID gate

---

## Principles that constrain every phase

1. **One state object.** If a feature needs a second store, the feature is wrong.
2. **No dependency without a reason that survives a year.** Zero today.
3. **Every number traceable.** No score the user cannot decompose into inputs.
4. **The empty state teaches.** Never a blank panel; always the next action.
5. **Reinforcement is earned.** The system never congratulates you for nothing —
   that is what makes it land when it does.
6. **Data belongs to you.** Export works, always, in one click.
7. **Starting is the product.** The reward is for ignition, never for output, and
   every action carries explicit permission to stop after one.
8. **It speaks first.** The machine keeps in touch with him. Anything that
   requires him to remember to check it is a design failure.
9. **History is append-only.** No future version may rewrite what already
   happened. New shapes go alongside the old ones.
