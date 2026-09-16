# Life Organizer

One machine that knows you. It puts today's chosen work first and keeps your
life in the order it happened — identity, goals, habits, the
reprogramming work, body, mind, people, clarity and the whole written record,
rolled into one **Alignment Index** that says where this is actually heading.

Zero dependencies. No build step to run it. One JSON object that is yours.

---

## One app

The identity is **Lumen**, a glass companion used for the app icon, profile crest,
and level. The live direction is quieter than the original prospective guide:
profile, trajectory, inbox, and friends remain; Guidance/Explore presentation
does not. Asset provenance and the full generation prompt are in
[MASCOT.md](docs/MASCOT.md).

There is no separate phone build any more. `index.html` is the whole thing:
a bottom tab bar and full-bleed panels on a handset, the same markup widening
into a centred column on a laptop. Three destinations, and three is the ceiling.

| Tab | What it is for |
|---|---|
| **Do** | Today's task list on raised paper: capture, effort, completion, reopening, deletion, and points. The rotating quote stays; coaching clutter does not. |
| **Write** | The larger centre action. One paper pad for capturing, classifying, searching, and revisiting the record. |
| **Me** | Profile and trajectory plus an attention inbox for open work, reminders, notices, due contacts, and assigned FareHarbor tours. |

The Do capture makes today's tasks; Write stays a separate journal. Everything
still lands in one record.

## Installing it on a phone, and updating it

It is a PWA — `manifest.webmanifest`, a service worker for offline, maskable
icons. Served over **HTTPS**, Chrome on Android offers a real "Install app": app
drawer entry, own storage, offline, persistent storage granted automatically.

Once it is installed, the update loop is:

```
"Claude, add a ride log"  →  I edit, stamp, push  →  you reopen the app
```

No reinstall, no store, and **your data is never touched** — the record lives in
IndexedDB on the phone and a deploy only swaps the code.

Two things worth knowing before you start logging real data:

- **Pick the address first.** Storage is tied to the origin, so moving from one
  URL to another means exporting and importing by hand. Choose the permanent home
  before you fill it.
- **Run `node tools/stamp.js` before every deploy.** It timestamps every asset
  URL and the service worker cache so a phone can never serve you yesterday's
  code.

Full walkthrough, including the one-time GitHub Pages setup:
[docs/DEPLOY.md](docs/DEPLOY.md).

## Run it

```bash
cd "C:\Claude Projects\Life Organizer" && python -m http.server 5273
```

Then open <http://localhost:5273>.

To reach it from your phone on the same wifi, open `http://<this-machine's-ip>:5273`.
A single-file copy for any static host is built by `node tools/build-app.js`.

Double-clicking a file also works in most browsers, but pick one way in and stay
with it — `localStorage` is scoped per origin, so opening the same app from a
different address looks like your data vanished when it hasn't.

> **Your data lives on this device.** Nothing leaves unless you send it. Back it up
> from **⚙ → Download a backup** (or Ignition's gear → Data). That file is also how
> you move between the desktop copy and a phone copy.

> **After editing CSS or JS**, bump the `?v=` number on the asset links in
> `index.html`, or your browser will keep serving the old file.

---

> The two earlier interfaces are archived and still read the same data: the
> eight-node hex lattice at [archive/lattice.html](archive/lattice.html), and the
> separate Ignition phone build in `archive/ignition/`.

## Where to start

Open **Do** and write the few things that belong to today. The list itself is the
front door: tap a line or its box to finish it. On first run the wider system
sets itself up from your own north star, values, goals and patterns — all of it
editable.

After that: put today's work on **Do**, keep thoughts and moments in **Write**,
and use the glass crest to open **Me → Inbox**. The ordinary Me tab opens the
profile; trajectory sits directly under the crest and the question queue fills
the evidence-backed summary over time.

FareHarbor is prepared as a private-bridge integration. Once a FareHarbor
booking webhook/API bridge is approved and deployed, enter its endpoint, access
key, and exact crew name from the Me inbox. The public PWA never stores a
FareHarbor API credential. See [docs/FAREHARBOR.md](docs/FAREHARBOR.md).

The index stays at 0 until something real is being tracked — that is deliberate.
An empty system should not congratulate you.

## Will it still be here in ten years?

Capacity was never the question — a decade of dense logging is about **11 MB**
against gigabytes of quota. Losing the device was.

That is now handled: the app commits your whole record to a **private GitHub
repo** on open and after writes, at most once every six hours. One file rewritten
each time, so git's history is your version history and every backup is a restore
point. Set it up in **⚙ → Automatic backup** — it refuses public repos, verifies
the token can write before saving, and takes the first backup on the spot.

The token stays on the device and is stripped from every export, so it can never
end up inside the backup it just made.

Storage underneath is IndexedDB with persistent storage requested, and the
`chronicle` is append-only so no future version can rewrite your history. Full
analysis: [docs/MEMORY.md](docs/MEMORY.md) · setup: [docs/DEPLOY.md](docs/DEPLOY.md).

## Points and levels

Points come from **finished** things, never from writing one down — otherwise
the level measures typing. A task pays by effort: **light 10**, **real 25**,
**heavy 60**, guessed from the wording and changeable with a tap on the badge.
A struck habit pays 10, once a day however many times it is toggled, and gives
the points back if you untick it. An activity you log pays 25. A timed first
step pays 10 + 2 a minute, capped at 60. Clearing everything on the day's list
pays 50 + 10 a task on top, once a day.

Level *n* costs `150 + (n-1) × 75` points. The level is **derived from the wins
ledger, never stored** — restore a backup and you level straight back to where
you were. It lives on the crest in the top left of every screen.

## How the Alignment Index works

Eight pillars, each 0–100, weighted: Reps ×1.4, Clear ×1.3, Aim ×1.2, Mind ×1.2,
Body ×1.0, Bonds ×0.9, Rewire ×0.8, Load ×0.6. A pillar with no data drops out of the average rather
than counting as zero, so the number always means "of what is known". Full
derivation in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#2-derived-numbers-live-in-the-store-not-the-ui).

## Reference

- [docs/IGNITION.md](docs/IGNITION.md) — the first-step rules, the action dealer, the protocols
- [docs/DEPLOY.md](docs/DEPLOY.md) — getting it on the phone and updating it after
- [docs/MEMORY.md](docs/MEMORY.md) — can this hold ten years, and what would lose it
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) — Void Lattice: tokens, geometry, motion, components
- [docs/reference.html](docs/reference.html) — living visual reference, every component in real CSS
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — data model, module contract, how to add a module
- [docs/ROADMAP.md](docs/ROADMAP.md) — Phase 0 → app → mentor → iOS
- `data/` — generated mirrors of the schema and library (`node tools/gen-data.js`)

## Layout

```
index.html                   the desk: three destinations
assets/css/core.css          design system
assets/css/desk.css          desktop layer
assets/js/store.js           state, IndexedDB persistence, chronicle, derived scores
assets/js/level.js           effort tiers, points, the level on the crest
assets/js/insight.js         what it says, what it can prove, what it asks
assets/js/library.js         drill bank, prompts, taxonomies
assets/js/ui.js              render primitives
assets/js/shell.js           tab registry, routing, settings
assets/js/surfaces/          do.js, write.js, me.js
mobile/                      Ignition: index.html, ignition.css, ignition.js
archive/lattice.html         the original eight-node lattice
assets/js/app.js + modules/  what the archived lattice runs on
build/                       single-file phone builds (generated)
data/                        schema.json, drills.json, prompts.json, taxonomy.json
CLAUDE.md                    the rules for changing this codebase — read first
docs/DECISIONS.md            why it is shaped this way; add to it when you decide
docs/                        ignition, memory, design system, architecture, roadmap, reference
tools/gen-data.js            regenerates data/ from the JS source of truth
tools/build-app.js           inlines the whole app into one file
tools/stamp.js               timestamps assets + the service worker cache
```

Do not add a tab. New capability belongs inside Do, Write, or Me, or in a small
temporary sheet. Registration order is the order in the bottom bar.
