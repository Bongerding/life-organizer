# Deep Canopy — Design System v0.5

The look and the voice of Life Organizer. One palette, one accent, one way of
speaking. Everything in the product draws from this file.

Live visual reference: **[reference.html](reference.html)**.

---

## 1. What changed in v0.4, and why

v0.1–v0.3 grew three visual languages: a hex lattice, an editorial desktop and a
phone app, each shifting its accent per tab. That was incoherent, so:

- **One accent for the whole product.** The interface accent no longer changes
  between tabs. Only gold moves, and only for reward.
- **One palette, forest.** Deep Canopy replaced the teal/azure/violet spread:
  forest-floor darks, sage light, antique gold.
- **Centred composition on the desktop.** The whole desk reads down the middle.
- **Plainer words.** See §6. Aphorisms now live only in Advice, where advice is
  the point.
- **Fewer boxes.** Hairlines and space instead of a border round everything.

---

## 2. Colour

### Ground — forest floor at night
| Token | Value | Use |
|---|---|---|
| `--void-0` | `#080d0a` | page ground |
| `--void-1` | `#0b120e` | recessed surfaces, inputs |
| `--void-2` | `#101a13` | panels |
| `--void-3` | `#16241b` | raised panel, top of a gradient |
| `--void-4` | `#1f3226` | bars, unfilled tracks |
| `--line` | `rgba(186,216,190,.085)` | default hairline |
| `--line-2` | `rgba(186,216,190,.17)` | emphasis hairline |

### Ink — light through leaves
`--ink-0 #e9f1e7` primary · `--ink-1 #c4d3c1` body · `--ink-2 #93a693` secondary ·
`--ink-3 #6b7d6d` labels.

### Accent — sage
`--accent #8fbf8a`, `--accent-soft rgba(143,191,138,.14)`. Fixed. Every control,
meter, ring, focus ring and section label reads from it.

### Reward — antique gold
`--gold #e0b552` · `--gold-hi #f6e2a6` · `--gold-lo #9d7420` · `--gold-ink #241a05`.

> **Gold is reward and nothing else.** It appears on Ignition's "One more"
> button, and on the desktop reward panel and its seal. If gold shows up on
> chrome it stops meaning anything, and the reward stops landing.

### Semantic
`--ok #7fbf87` · `--warn #d9b25e` · `--bad #c9806c` (earthy, not pink). Used as
text colour, sparingly.

### The forest family
Kept for the archived lattice and Ignition's four tabs, all inside one family so
nothing reads as a different product: `--c-core #8fbf8a`, `--c-compass #a9c9b0`,
`--c-rhythm #7ea88f`, `--c-forge #c9a35c`, `--c-rewire #c98b7a`,
`--c-vessel #6fae7a`, `--c-mind #7fb3a3`, `--c-scribe #b8c98a`.

---

## 3. Layout

**A phone app, centred, at every size.** `#app` is `max-width: var(--app-w)`
(480px) centred with hairline sides on a wide window; `.col` is
`text-align: center`. Headings, ledes, action panels, advice and controls are
centred. Long-form reading is the exception and stays left-aligned inside the
centred block: protocol steps, stream entries, list rows, the settings sheet.
Centred paragraphs longer than two lines are hard to read; centred single
sentences are not.

Section labels carry a hairline on **both** sides (`.lbl::before/::after`). That
is the motif that makes the centred rhythm read as deliberate rather than
accidental.

| Token | Value |
|---|---|
| `--r-lg` | 14px (panels) |
| `--r-md` | 11px (buttons, inputs) |
| `--r-sm` | 8px (small controls) |
| Column | 480px (`--app-w`) |

Hexagons now appear only on the app mark, the reward seal and Ignition's tab
glyphs. In v0.1 they were on every bullet, and that was part of the noise.

---

## 4. Type

`--font`: Inter → Segoe UI Variable Display → Segoe UI → system-ui.
`--mono`: JetBrains Mono → ui-monospace → Consolas. Numbers only.

| Role | Class | Spec |
|---|---|---|
| Page heading | `h1.hd` | 25px / 600 / -.015em / max 22ch / balanced |
| Lede | `p.lede` | 14px / 1.6 / `--ink-3` |
| Section label | `.lbl` | 10.5px / 600 / .18em / uppercase |
| Panel heading | `.now h2`, `.adv h2` | 19–23px / 600 |
| Body | — | 15px / 1.65–1.7 |
| Note | `.note` | 13px / 1.65 / `--ink-3` |
| Figure | `.stat2 b` | 26px mono, tabular |

> **Two traps that have both bitten already.** `core.css` defines `.big` (mono
> figure) and `.act .kind` (action label), so a generically named new class
> silently inherits them — headings are `.hd`, the write pills are `.kpill`.
> And `#top` has a `backdrop-filter`, which makes it the containing block for
> any `position: fixed` descendant, so the bottom tab bar must sit outside it.
> Grep `core.css` before naming a new class.

Uppercase is for tab names and section labels only. Sentences are never
uppercased.

---

## 5. Motion

Much less than v0.1, on purpose — calm is part of the brief now.

| What | Spec |
|---|---|
| Pane change | `up` — 320ms, 8px rise + fade |
| Panel arrival | same, or `pop2` 300–420ms for reward and sheets |
| Hover | 140ms ease |
| Press | `scale(.97)`; `.88` for the tick |
| Timer | 1s linear `stroke-dashoffset` |
| Reward | `pop2` on the panel, no looping shine |
| Ambient | one particle field at 30% opacity. Nothing else loops. |

Ignition keeps its livelier motion — the gold button breathes and shines, because
that is the one place a bit of theatre earns its keep. Everything collapses under
`prefers-reduced-motion: reduce`.

---

## 6. Voice

The phrasing rules matter as much as the colour.

- **Say the thing.** "12 days since you rode." Not "12 days since you rode — this
  is the thing you said you wanted a lot of."
- **One sentence where one will do.** Notices are a single line. Advice gets three.
- **No aphorisms outside Advice.** Do, Write and Me report; Advice advises. That
  separation is what stopped the whole thing sounding preachy.
- **Buttons are verbs:** Start, Save, Add, Answer, Done. Never "Commit rep".
- **Labels are one or two words:** Now, Your tasks, Habits, What is true.
- **Empty states name the next action** and where to do it.
- **Numbers carry claims.** "You start." only ever prints with the streak
  attached. No praise without evidence.
- **No shame in the clarity copy, ever.** A use resets the count and nothing
  else. See [IGNITION.md](IGNITION.md).

---

## 7. Components

`assets/css/app.css`, loaded after `core.css`. Mobile-first: one phone-width
column at every window size, with the tab bar fixed to the bottom of the screen.

| Component | Class | Notes |
|---|---|---|
| Top bar | `#top` | mark, live status line, `⚙` |
| Tab bar | `#tabs` | fixed to the bottom, four hex glyphs; lives outside `#app` because a `backdrop-filter` ancestor would capture it |
| Tab | `.tab` / `.tab.on` | hex glyph fills sage and lifts when active |
| Panel | `.panel` / `.panel.lift` | the single card treatment |
| Action | `.now` | centred: kind, heading, sub, minutes, buttons |
| Primary / ghost | `.go` / `.flat` | sage fill; hairline ghost |
| Reward | `.reward`, `.seal`, `.gold` | the only gold on the desk |
| Timer | `.timer`, `.dial` | 132px ring, 31px mono clock |
| Advice | `.adv` | sage rule along the **top**, centred |
| Situation | `.sit` in `.sits` | tappable grid of states |
| Protocol | `.proto` | centred card, numbered steps left-aligned |
| Write box | `.kinds`, `#writebox` | four kind pills, one textarea |
| Stream | `.dayblock`, `.entry` | day heading, left rule per entry |
| List row | `.row-l`, `.tick` | hairline rows, 24px circular check |
| Proven | `.proven .p` | claim left, evidence right in mono |
| Question | `.ask` | what the machine wants to know |
| Figures | `.stats`, `.stat2` | centred number over caption |
| Settings | `#sheet2` | centred modal, left-aligned inside |

The retired phone-only build in `archive/ignition/` still picks up this palette
through the shared tokens.

---

## 8. Rules for new work

- Never introduce a hex value in a surface. Add a token, or use `var(--accent)`.
- Never use gold for anything but reward.
- Never change the accent per tab.
- Any number that can be `null` renders as `—` in `--ink-3`, never `0`.
- New content goes into one of the four tabs, or into `insight.js` / `advice.js`
  as something the machine says. Never as a fifth tab.
- Bump `?v=` on the asset URLs in `index.html` after editing CSS or JS, or the
  browser will keep serving the old file.
