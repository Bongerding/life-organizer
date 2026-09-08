# Ember & Graphite — Design System v1.0

**Chosen 2026-09-08 and settled.** Direction 02 of four, with a hexagon/circle
shape blend and occasional saturated flavour. This is the brand; extend it
rather than re-deciding it.

Live visual reference: **[reference.html](reference.html)** ·
the four directions that were on the table: **[../brands.html](../brands.html)**

---

## 1. The idea

A machine shop, not a wellness app. Cold graphite, one hot ember accent, bone
type, hard-edged surfaces. It should read as a tool for starting things —
riding, building, shipping — rather than something that wants to soothe you.

Three rules hold everything together:

1. **One accent, fixed.** Ember never changes between tabs. Only one thing on
   screen is filled with it at a time.
2. **Reward is champagne brass and nothing else.** Cooled deliberately clear of
   the ember so the two never read as the same signal.
3. **Flavour is occasional.** Dark green and a small saturated set appear as a
   section tint, a category, or a status — never as chrome.

## 2. Colour

### Ground — graphite
| Token | Value | Use |
|---|---|---|
| `--void-0` | `#0c0c0e` | page ground |
| `--void-1` | `#101114` | recessed surfaces, inputs |
| `--void-2` | `#141518` | panels |
| `--void-3` | `#1a1c20` | raised panel |
| `--void-4` | `#25272c` | bars, unfilled tracks |
| `--line` | `rgba(255,255,255,.10)` | hairline |
| `--line-2` | `rgba(255,255,255,.19)` | emphasis hairline |

### Ink — bone
`--ink-0 #f2efe9` · `--ink-1 #cbc8c2` · `--ink-2 #94959a` · `--ink-3 #6b6c72`

### Accent — ember
`--accent #e2603a`, `--accent-soft rgba(226,96,58,.14)`. Every control, active
tab, focus ring and section marker reads from it.

### Reward — champagne brass
`--gold #eac878` · `--gold-hi #f9e8bd` · `--gold-lo #a8802c` · `--gold-ink #241a05`

> Brass appears on exactly two things: the "One more" button and the reward
> panel's seal. It is paler and yellower than the ember on purpose — if the two
> ever start reading as the same colour, cool the brass further, do not warm it.

### Flavour — used sparingly
`--forest #14251c` and `--forest-2 #1e3b2c` are the dark green surfaces: the
mission block's tint and the gradient under the section rules. The saturated set
is `--f-green #35b37e`, `--f-teal #2fa89b`, `--f-mustard #d9a441`,
`--f-oxblood #b3452f`, `--f-violet #9b7bd4`, `--f-blue #4f9dd9`,
`--f-steel #7d8ba0`.

Where they are allowed to show:

| Place | Colour |
|---|---|
| Write category pills | task ember · chore mustard · activity green · plan teal · feeling oxblood · thought steel |
| The mission block | forest tint, green rule |
| Days clear, clear-day buttons | green |
| "I'm spinning" / "I want to smoke" | teal / oxblood |
| Overdue people | oxblood |
| Domain accents (archived lattice) | the same set |

Semantic: `--ok #35b37e` · `--warn #d9a441` · `--bad #c9573c`.

---

## 3. Shape — the blend

The identity is that the three shape families each mean something:

| Family | Radius | What it is for |
|---|---|---|
| **Rectangles** | `--r-lg 5px` / `--r-md 4px` / `--r-sm 3px` | surfaces: panels, cards, sheets, entries |
| **Circles and pills** | `--r-pill 999px`, `border-radius:50%` | anything you touch: buttons, pills, ticks, the gear |
| **Hexagons** | `--hex` clip-path | anything standing for you or your progress: the app mark, tab glyphs, the reward seal |

So the surfaces are machined, the controls are round, and the marks are
hexagonal. Keep that mapping — it is what makes the blend read as deliberate
rather than mixed.

---

## 3. Layout

**A phone app, centred, at every size.** `#app` is `max-width: var(--app-w)`
(480px) centred with hairline sides on a wide window; `.col` is
`text-align: center`. The tab bar is fixed to the bottom of the screen and lives
outside `#app`. Headings, ledes, action panels, advice and controls are
centred. Long-form reading is the exception and stays left-aligned inside the
centred block: protocol steps, stream entries, list rows, the settings sheet.
Centred paragraphs longer than two lines are hard to read; centred single
sentences are not.

Section labels carry a hairline on **both** sides (`.lbl::before/::after`). That
is the motif that makes the centred rhythm read as deliberate rather than
accidental.

| Token | Value |
|---|---|
| Column | 480px (`--app-w`) |

See §3 for what each shape family means.

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

`assets/css/app.css`, loaded after `core.css`.

| Component | Class | Notes |
|---|---|---|
| Top bar | `#top` | mark, live status line, `⚙` |
| Tab bar | `#tabs` | fixed to the bottom, four hex glyphs; lives outside `#app` because a `backdrop-filter` ancestor would capture it |
| Tab | `.tab` / `.tab.on` | hex glyph fills sage and lifts when active |
| Panel | `.panel` | the single card treatment, 5px corners |
| Quote | `.quote` | the one line at the top of Do, ember rule under it |
| Mission | `.mission` | forest-tinted block, green rule |
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
