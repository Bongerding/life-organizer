# Ignition — the first-step app

The hardest part of progress is the first step, so Ignition exists to do exactly
one job: make starting cheaper than not starting. It is the phone front door to
the same data the desk reads.

`mobile/index.html` · standalone build `build/ignition-standalone.html`

The phone loads the shared engines directly: `store.js`, `library.js`, `ui.js`,
`actions.js`, `insight.js`, `advice.js`. Only `ignition.js` and `ignition.css`
are phone-only.

---

## The design brief, in one line

Help me get through the first step — close one loop, send one message, achieve
one small thing. Everything below follows from that, and from the four things it
is built against: procrastination, rumination, a habit being cut down, and years
going by unnoticed.

---

## The five rules the app obeys

1. **One action at a time.** Choice is a procrastination surface. The Do tab
   opens on a single card, not a list to survey and feel behind on.
2. **The ask is always smaller than the task.** Two minutes on the business. Ten
   minutes on the bicycle. One text. Ignition, never completion.
3. **Permission to stop is built in.** Every completed action ends with a line
   that says you can stop now — "One is a full day." A system that always asks for
   more is a system you eventually avoid opening.
4. **The reward is for starting.** The timer running out *is* the win. Tapping
   Done early is also a win. Nothing here grades your output.
5. **Overdue beats available.** The dealer surfaces what has actually drifted —
   the friend at 60 days, the ride at 12 — over whatever is merely on the list.

## The tabs

Since 2026-09-08 the phone runs the **same four tabs as the desk**, so there is
one mental model across both. Only the sizing and the one-thing-at-a-time
framing of Do are phone-specific.

| Tab | Job |
|---|---|
| **Do** | One dealt action with a timer and a gold reward. Your open tasks and today's habits sit underneath, one tap each. Two panic buttons live here: *I'm spinning* (jumps to the rumination protocol) and *I want to smoke* (opens the ride-it-out timer). |
| **Write** | Task, Feeling, Plan or Thought in one box. Picking Feeling adds four sliders so the mood is logged with the words. Your record is underneath, filterable. |
| **Advice** | One thing for today from your own data, what the system noticed, twelve situations to tap, and one practice drill. |
| **Me** | Name and north star, four figures, the clear count and its buttons, what the system can prove about you, one question it wants answered, your people, your aims. |

The previous Now / Loops / People / Clear tabs map onto these: loops became tasks
(written on Write, done on Do), people and the clear count moved to Me, and the
urge protocol is reachable from both Do and Advice.

## The action dealer

`assets/js/actions.js` builds every action that makes sense right now from live
state, then picks one by weighted random.

- **Weights** rise with urgency: a ride at 12+ days scores 9, the heaviest open
  loop scores 7, the most overdue friend scores 7.
- **Time of day** doubles matching actions (`morning` / `midday` / `evening`) and
  suppresses mismatched ones to 35%.
- **Anything already done today is removed entirely** — wins carry a `ref` to the
  action id that produced them.
- Habits become actions automatically. Any habit not struck today with copy in
  the bank turns into a dealt action; striking it on the phone strikes the same
  habit the desk shows.
- Every win also strikes the meta-habit **"One first step"**, so the streak in the
  header is the streak of days you started something.

## Rumination and urges

Both are handled as protocols, not advice.

**Spinning** deals a fixed drill: the thought is either actionable or it is not,
and the cost is that you have not decided which. Decide, act on the smallest
piece, or name it not-actionable and move your body. Rumination framed as a
deferred decision is something you can actually close.

**Urge** opens a ten-minute ride-it-out timer with an intensity log. The premise
is stated plainly in the app: the urge is a wave that peaks and drops whether it
is fed or not, and riding one out is the rep that does the rewiring. A logged use
restarts the day count, keeps the best run on the board, and says "tomorrow is
day one" — the count resets, the system does not. The Me tab also states once,
quietly, that this is a self-tracking tool rather than treatment, and that using
real support would be a strong move.

## Data

Same store, same JSON object, same schema as the desk — IndexedDB with a
`life-organizer.core` localStorage mirror, schema v3. Served from the same
origin the two are literally the same data: strike a habit on the phone and the
desk shows it, write a task on either and it appears on both.

Written from the phone as well as the desk:

```
people    [{ name, cadence, lastContact, note }]
clarity   { substance, clearSince, best, urges[], uses[] }
wins      [{ date, kind, label, minutes, ref }]    the first-step ledger
chronicle [{ ts, date, type, text, meta }]         append-only, never rewritten
```

Two new pillars feed the Alignment Index: **Clear** (weight 1.3 — days clear
weighted 60/40 with how urges actually went) and **Bonds** (weight 0.9 — share of
people contacted inside their own cadence).

## Builds

```bash
node tools/build-mobile.js
```

- `build/ignition.html` — body-content only, for publishing as an Artifact
- `build/ignition-standalone.html` — full document, for a static host or a phone

Both set `window.LO_STANDALONE`, which swaps file export/import for a
copy-and-paste backup box, because a hosted viewer cannot hand a file to the
browser.

## Not built yet

- A service worker, so the hosted copy still needs a connection on first load.
- Notifications timed to `rhythm.blocks` — the data is there, the delivery is not.
- Aims are read-only on the phone; add and edit them on the desk.
