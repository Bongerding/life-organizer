# Architecture — Life Organizer v0.5

Zero dependencies, and no build step to run it. Classic scripts and one global
namespace so
the app runs from a filesystem, a static host, a phone, or inside a native shell
without changing anything.

```
index.html                 the whole app: bar + four tabs, phone and desktop
assets/css/core.css        the entire design system (tokens → components)
assets/js/store.js         single source of truth + persistence + derived scores
assets/js/library.js       reference data: drill bank, prompts, taxonomies
assets/js/ui.js            render primitives: cards, meters, rings, sparks, fields
assets/css/app.css         the one layout layer, mobile-first, centred
assets/js/insight.js       messages / truths / questions — the part that knows you
assets/js/actions.js       the first-step dealer, shared by both front doors
assets/js/classify.js      six-kind classifier for what he writes, learns from corrections
assets/js/advice.js        daily advice + 12 situational protocols
assets/js/shell.js         tab registry, routing, settings + data
assets/js/surfaces/*.js    do.js, write.js, advice.js, me.js
archive/lattice.html       the original eight-node lattice, still working
assets/js/app.js           lattice registry + geometry (archived UI only)
assets/js/modules/*.js     one file per lattice module (archived UI only)
manifest.webmanifest       PWA install metadata
sw.js                      service worker: network-first, cache fallback
assets/icons/*.png         maskable app icons
mobile/index.html          redirect; the phone build was merged in
archive/ignition/          the retired phone-only UI
build/*.html               single-file builds (generated)
data/*.json                generated mirrors of schema + library (for the API/app)
tools/gen-data.js          regenerates data/ from the JS source of truth
tools/build-app.js         inlines the whole app into one file
docs/                      this, ignition, the design system, roadmap, visual reference
```

**One app.** `assets/css/app.css` is mobile-first: under 700px the tab bar
detaches from the header and fixes to the bottom of the screen, panels go
full-bleed and every target grows; above it the same markup is a centred 660px
column. There is no second UI and no second copy of any component — that
duplication is what produced the drift in v0.2–v0.4.

One trap worth knowing: `#top` carries `backdrop-filter`, which makes it a
containing block for `position: fixed` descendants. The phone tab bar therefore
pins to the header instead of the viewport unless the filter is turned off at
that breakpoint, which the media query does.

Installability: `manifest.webmanifest` + `sw.js` + maskable PNGs. Chrome on
Android offers a real install over HTTPS — app drawer entry, own storage,
persistent storage granted, offline via the worker. Plain HTTP on a LAN runs
fine but will not offer to install.

The two earlier interfaces are archived and still read the same store: the
eight-node lattice at `archive/lattice.html`, and the phone-only Ignition build
in `archive/ignition/`.

---

## 1. The one object

Everything the system knows about you is one JSON object, held in **IndexedDB**
(`life-organizer` → `docs` → `core`) with a **localStorage mirror** under
`life-organizer.core` as the fallback. There is no second store, no per-surface
key, no cache. `load()` is async and adopts existing localStorage data on first
run; `save()` stays synchronous for callers and debounces 120ms into an async flush.

Why IndexedDB: localStorage caps at ~5MB, which a decade of logging would exceed
around year four. The measured quota here is 2.5GB against an ~11MB ten-year
projection. `storageInfo()` reports the backend, the persistence grant, the record
size and the quota; `navigator.storage.persist()` is requested on every boot.
Full analysis in [MEMORY.md](MEMORY.md).

```
meta      schema, created, lastOpen, opens, streak, seeded, lastBackup, name
chronicle [{ id, ts, date, type, text, meta }]     append-only, never rewritten
identity  name, northStar, values[], statements[], avoid[], facts[{ q, a, date }]
goals     [{ title, domain, horizon, why, metric, due, progress, status, milestones[] }]
rhythm    blocks[{ label, start, end, days[0-6], domain, anchor }], rules[]
habits    [{ name, identity, domain, cue, reward, target, log{date:1} }]
rewire    targets[{ from, to, trait }], reps[{ date, drillId, trait, response }]
vessel    targets{}, logs[{ date, sleep, weight, steps, water, note }], sessions[]
mind      logs[{ date, mood, energy, clarity, stress, grateful, note }], load[{ title, weight, kind, status }]
people    [{ name, cadence, lastContact, note }]
clarity   { substance, clearSince, best, urges[{ date, intensity, rode, instead }], uses[{ date, note }] }
wins      [{ date, kind, label, minutes, ref }]     the first-step ledger
scribe    entries[{ date, prompt, text, tags }], insights[{ date, text, source }]
settings  reduceMotion, weekStart
```

`people`, `clarity` and `wins` arrived with schema v2 and are written by Ignition.
`wins[].ref` holds the id of the action that produced the win, which is how the
dealer knows not to offer the same thing twice in a day.

`chronicle` and `identity.facts` arrived with v3. **The chronicle is the logbook
and the durability guarantee**: `store.log(type, text, meta, date)` appends, and
nothing in the codebase edits, reorders or migrates what is already there. Writes
happen inside the store's own mutators — `win`, `toggleHabit`, `patch`,
`contacted`, `logUrge`, `logUse`, `markClear`, `setLog`, and `add` via the `ADDED`
table — so every surface gets the same history for free. Event types: `step`,
`habit`, `loop`, `person`, `urge`, `use`, `clear`, `entry`, `note`, `insight`,
`state`, `body`, `rep`, `goal`, `rewire`, `system`.

At roughly 100k events the single-document load becomes noticeable; that is the
point to move `chronicle` into its own IndexedDB store with a date index and load
it lazily. Everything else stays as it is.

`store.seed()` runs once into an untouched store and writes the first-run
calibration — north star, values, identity statements, retired patterns, goals
across horizons, habits, rewire targets — from the user's own stated words. It is
guarded by `meta.seeded` and by the store being empty, and everything it writes is
editable like any other record.

The canonical empty shape is mirrored to [`data/schema.json`](../data/schema.json).

**Migration.** `store.load()` deep-merges the saved object onto a fresh `blank()`
via `graft()`. New fields added to the schema appear immediately with their
defaults; existing data is never wiped by a version bump. Arrays are taken from
the saved copy wholesale — so array element shape changes need an explicit
migration step, added to `load()` behind a `meta.schema` check.

**Portability.** `store.export()` / `store.import()` round-trip the whole object.
That file is the backup, the device-to-device transfer, and the seed for the
future backend. Nothing in the app depends on `localStorage` specifically — swap
`load`/`save` for `fetch` and everything else keeps working.

---

## 2. Derived numbers live in the store, not the UI

`store.vitals()` returns eight pillars scored 0–100 plus a weighted **Alignment
Index**:

| Pillar | Weight | Definition |
|---|---|---|
| Reps | 1.4 | mean 14-day adherence across habits |
| Clear | 1.3 | days clear scaled to 21, blended 60/40 with the 14-day urge-resistance ratio |
| Aim | 1.2 | mean progress of live goals |
| Mind | 1.2 | 7-day (mood + energy + clarity + inverted stress) / 40 |
| Body | 1.0 | 7-day sleep / steps / sessions vs targets |
| Bonds | 0.9 | share of people contacted inside their own cadence |
| Rewire | 0.8 | reps logged in 14 days vs 7 per target |
| Load | 0.6 | `100 − Σweight × 6` of open loops |

A pillar with no data is `null` and drops out of the average — the index is
always "of what is known". `load` is deliberately suppressed until at least one
other pillar has signal, otherwise an empty system scores 100 for having no
open loops.

`store.indexSeries(n)` recomputes a comparable index as of each of the last `n`
days, which is what the trajectory line and the 14-day slope are drawn from.

**Rule: no module computes a score.** If a number is interesting outside its own
module, it belongs in `vitals()`.

---

## 3. The insight engine

`LO.insight` is what makes this a machine that speaks rather than a set of forms.
All three outputs are derived on read; none of it is stored.

- **`messages(state)`** — ranked, tone-tagged (`reward` / `notice` / `nudge` /
  `ask` / `quiet`), each optionally carrying a `go` target. Rewards and milestones
  outrank routine nudges. Character shows the top four.
- **`truths(state)`** — evidence-backed claims, weighted. Every claim carries the
  number that earns it and nothing fires without the data. Failures never appear
  here: the page about who you are does not carry them, drift goes in messages.
- **`questions(state)`** — the bank of things it does not know, filtered by
  `when(state)` and by `repeat` days since last answered. Answers land in
  `identity.facts` and stay on the page.

Extending the bank is the cheapest way to make the system know him better. Keep
the rule: no claim the data cannot back.

## 4. The tab contract

A tab is one IIFE that calls `LO.machine.register({...})`:

```js
LO.machine.register({
  id: 'do',                          // route (#do) and bar label
  name: 'Do',
  render(state) { return '<h1 class="hd">…</h1>'; },
  mount(root) { /* bind events; call this.refresh() after mutations */ }
});
```

`LO.machine.render` attaches a `refresh()` that re-runs `render` + `mount` and
repaints the status line. Registration order is the order in the bar. Tabs no
longer declare an accent: v0.4 fixed one accent for the whole product.

**`LO.advice`** carries the other half of the voice: `today(state)` picks one
daily line from a ranked, data-gated bank, and `SITUATIONS` holds the twelve
"right now I feel…" protocols, each three or four physical or written steps.

### The archived lattice's contract

A lattice module is one IIFE that calls `LO.app.register({...})`:

```js
LO.app.register({
  id: 'forge',                        // route (#forge) and rail id
  name: 'Forge',
  glyph: '⬢',                         // node face
  accent: 'var(--c-forge)',           // written to :root on route
  accentSoft: 'rgba(255,177,84,.14)',
  tagline: 'Habits, streaks, and the reinforcement that locks them in',

  metric(state) { return '2/2 today'; },   // one line shown on the hub node
  render(state) { return '<div class="grid">…</div>'; },
  mount(root) { /* bind events; call this.refresh() after mutations */ }
});
```

- `render` is pure: state in, HTML string out. It must be safe to call at any time.
- `mount` binds handlers to the freshly mounted DOM. `app.openPanel` attaches a
  `refresh()` to the module that re-runs `render` + `mount` and repaints the
  topbar — the only update path a module needs.
- Registration order drives both the rail order and the lattice ring order.
  `trajectory` is special-cased as the centre node; everything else rings it.
- Escape all user text through `ui.esc()`. Modules build HTML strings, so this
  is the XSS boundary.

Adding a module is: write the file, add one `<script>` tag to `index.html`, add
its fields to `blank()` in `store.js`. The lattice re-lays itself out for any `N`.

---

## 5. Rendering primitives (`ui.*`)

`card(title, body, {span, delay, right})` · `meter(pct)` · `ring(pct, size, label)`
· `spark(values, {min,max})` (nulls are gaps) · `bars(items, {target})` ·
`field(name, label, {type, options, value, ph, min, max, step})` · `seg` · `tag` ·
`empty(text)` · `read(root)` (harvests `[name]` and `[data-seg]` into an object) ·
`toast(msg)` · `rollUp(el, to)` · `startField(canvas)`.

Forms are read, not bound — no reactive layer, no virtual DOM. `render` →
`mount` → mutate store → `refresh`. It is fast enough for a decade of data and
it is debuggable at 3am.

---

## 6. The Rewire engine

The part that does the reprogramming, and the part most likely to grow.

- **Bank:** `LO.lib.drills` — 28 situations, each `{ trait, kind, title,
  situation, ask, reinforce }`. `kind` ∈ rehearsal · reframe · intention ·
  exposure · rep · audit · projection.
- **Dealer:** weighted random. Base weight 1; ×5 if the drill's trait matches a
  live rewire target; ×0.12 if it appears in the last 10 reps; 0 for the drill
  currently on the table. Variable-ratio by design — a predictable drill stops
  landing.
- **Reinforcement is earned, not given.** `reinforce` is withheld until a
  response of real length is committed. This is the deliberate operant loop:
  situation → response → reinforcement → banked rep → visible trait load.
- Growth path: per-trait ladders (exposure difficulty rising with rep count),
  scheduled deals (morning rehearsal / evening audit), and drills generated from
  the user's own journal and insights rather than the static bank.

---

## 7. Roadmap-relevant seams

| Future need | Seam already in place |
|---|---|
| Server sync | `store.load`/`flush` are the only I/O; swap for `fetch` |
| Versioned backup | `chronicle` is append-only, so commit-per-save history is coherent |
| Multi-device | `export/import` is a complete state transfer today |
| Native iOS | no build step, no modules, no CORS — loads in a `WKWebView` as-is |
| Notifications | `rhythm.blocks` already carry weekday + time |
| AI mentor | `scribe.insights` is the intended read-first layer; `vitals()` is the numeric brief |
| New life domain | add to `lib.domains`; every module's domain selector updates |

## 8. Conventions

- 2-space indent, single quotes, semicolons.
- Dates are `YYYY-MM-DD` strings in local time (`D.key`), never `Date` objects
  in state. All date maths goes through `LO.D`.
- IDs are `store.id(prefix)` → `prefix_xxxxxxx`.
- Never mutate state outside a `store.*` method unless you call `store.save()`
  immediately after.
