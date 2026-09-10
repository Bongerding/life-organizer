# Decisions

## 2026-09-09 · The trail is atmosphere, not a ribbon

The companion trail spans beyond the app frame as three softly blurred light
currents containing deterministic branching veins. The fractals are generated
locally once, use no image or video payload, and drift much more slowly than the
companion. Do not condense this back into one hard-edged curve: the purpose is a
wide field of refracted light, with the interface remaining the sharp layer.

## 2026-09-09 · The companion moves as glass; Do and Write are separate

The in-app mascot is now a generated SVG made from forty independent radial
glass wedges. A moving central light changes every wedge's radial displacement,
while each wedge also has its own phase and small rotation. This gives the
requested physical relationship between the light and pieces without shipping
a video loop or a Blender runtime. The original photorealistic render remains
the source for static phone icons, where animation is not supported.

The Do prompt owns a distinct daily checklist. Its tasks carry `origin: 'do'`,
render immediately under the orange prompt, and never create Scribe entries.
Write remains a written record even if its classifier labels a sentence as a
task or chore. Existing chronicle events are not rewritten, and legacy open
loops remain available to the action engine; only new Do-origin rows appear in
the daily checklist.

The icon URLs changed to `lumen-ball-*` so installed launchers see a new manifest
asset rather than retaining an old cached icon. Android may still require the
installed PWA to be removed and added again before the launcher redraws it.

## 2026-09-08 · Lumen game direction supersedes the hexagon-only identity

The user requested the glass-sphere mascot, player card, friends sidebar,
playful practices, learning moments and adaptive guidance, and authorized the
design pivot. The earlier prohibition on replacing the crest no longer applies.
Lumen keeps a visible level and routes to Me. The four-tab structure remains.
See [LUMEN-GUIDE.md](LUMEN-GUIDE.md) for scope, implementation, limits and trajectory.

Guidance runs locally with evidence thresholds, explicit feedback and a pause
switch. It changes recommendation weights, not source code or personal goals.
Journal removal uses append-only hide/restore events; it is recoverable and does
not claim to erase the original text from backups. Birthday/contact schedules
stay inside the existing state object. No automatic messages are sent.

The mascot is an AI-generated bitmap, not a Blender scene. Its exact prompt and
asset workflow are preserved in [MASCOT.md](MASCOT.md). Personal occupational
context informed the choice of educational topics but is not seeded into public
code or recorded in this public handoff as a claim about the user.

Why the system is shaped the way it is. Newest first.

This file exists so that a model picking the project up cold does not undo a
choice that was made deliberately, and does not re-litigate one that has already
been settled. **If you make a design call, add it here in the same pass as the
code.** An entry is worth writing when someone could reasonably do the opposite.

Format: what was decided, why, what was rejected, and what must not be undone.

---

## 2026-09-08 · Points are for finished things

**Decided.** Completing something pays points; writing something down pays zero.
A task pays by effort (light 10 / real 25 / heavy 60), a struck habit pays 10
once a day, a logged activity pays 25, a timed first step pays 10 + 2/minute
capped at 60, and clearing the whole day's list pays 50 + 10 a task on top.

**Why.** The first cut paid 15 points for anything typed into Write. Within
minutes of driving it that was obviously farmable, and a level you can raise by
typing measures typing. The number on the crest has to mean something or the
whole mechanic is decoration.

**The tension, resolved deliberately.** ROADMAP principle 7 says *"the reward is
for ignition, never for output."* That principle is intact and this does not
contradict it: **ignition still pays the reward it always did** — the gold
screen, the day streak, the meta-habit strike — and writing something down still
keeps the streak alive. What writing no longer does is move the *level*. Two
loops, deliberately: the streak rewards starting, the level counts finishing.
Do not "fix" this by paying points for capture.

**Also settled here.** Un-striking a habit hands the points back (the chronicle
keeps both events; only the `wins` ledger is adjusted) — a habit can therefore
pay at most 10 a day however many times it is toggled. Wins that a caller has
already written a chronicle entry for pass `quiet` so one action never produces
two entries in the logbook.

**Rejected.** Asking him to grade each task's effort himself — it is friction at
exactly the moment friction is fatal. Instead the effort is guessed from the
wording (`LO.level.estimate`) and the badge on the row is tappable if the guess
is wrong.

---

## 2026-09-08 · The level is derived, never stored

**Decided.** `LO.level.stats()` recomputes level and progress from the `wins`
ledger on every read. No `xp` field exists in state.

**Why.** A stored counter and an append-only ledger will disagree eventually, and
when they do the counter is the one that is wrong. Deriving it means a restored
backup levels you back to exactly where you were, and a scoring change applies
retroactively rather than stranding the history.

**Cost accepted.** Changing the curve or a tier retroactively changes past levels.
That is the right trade for a system meant to last ten years: the record is the
truth, the score is a view of it.

**Curve.** Level *n* costs `150 + (n-1) × 75`. Wins written before points existed
count as 15 each so old history is not worthless.

---

## 2026-09-08 · The crest, and the level living in the chrome

**Decided.** A hexagonal crest with the level number and a progress bar sits in
the top left of every screen, always. Pressing it opens Me.

**Why.** The level is the one number that should be visible without going to look
for it — that is the difference between a score and a status. The hexagon is the
brand's mark for *you* (Ember & Graphite: machined rectangular surfaces, fully
round controls, hexagons for identity), so the crest, the tab marks and the
reward seal are the same shape on purpose.

**Do not** change the crest into a generic avatar or move it to the tab bar. The
top left is where it is looked for, and the shape carries meaning.

---

## 2026-09-08 · Me opens with a portrait, and one question fills it in

**Decided.** The Me tab leads with the crest, name, level and a *portrait* —
prose assembled only from what he has told the system and what it has measured.
A single question prompt sits near the bottom, holding one question at a time,
and the queue never runs dry.

**Why.** A profile page that is a form is a chore, and chores do not get done. A
profile page that fills itself in from one question at a time is a conversation.
Every line of the portrait is either something he wrote or something with a
number behind it — nothing is inferred or flattering.

**Rejected.** A settings-style profile form with fields to complete. It was the
obvious build and it would have sat empty forever.

**Watch for.** The question bank is the cheapest lever on how well the system
knows him — extend `insight.BANK` rather than adding UI. Facts are keyed by
`qid`; the first version matched on `id`, which silently re-asked questions that
had already been answered. Check that dedupe still works after touching the bank.

---

## Settled earlier

These are recorded so they are not reopened. Rationale is in the commits.

- **Four tabs — Do / Write / Advice / Me — and never a fifth.** The eight-node
  lattice is archived at `archive/lattice.html`, not deleted (`5e038f9`).
- **Ember & Graphite.** One accent, graphite surfaces, brass/gold reserved for
  reward alone. Shape carries meaning (`442f170`).
- **Do is one target your thumb cannot miss.** Everything above the big button
  is read; the button is the only thing pressed (`16d1ea7`).
- **The clear count counts itself** rather than asking him to declare it
  (`8ba7ad8`).
- **Me is six blocks with the mission last**, and aims measure themselves out of
  the record instead of being self-reported (`b853a44`).
- **Automatic backup to a private GitHub repo**, token stored on-device only and
  stripped from every export (`4136853`).
