# Decisions

## 2026-09-10 · Notifications inform; they do not pursue

Notification permission is requested only from the Settings button. The default
cadence is at most two notices: an 8:00 AM brief and a 5:30 PM stale-state
summary, separated by at least six hours and suppressed from 9:30 PM to 7:00 AM.
Copy reports counts and says “open when useful” or “no urgency”; it never pleads,
scolds, or implies that an unfinished list is failure. Times and notice types are
user-controlled, and pausing them is one tap.

This release is explicit about the static-PWA boundary. It schedules checks while
the app is running and adds Web Push receive/click handlers to the service worker.
Closed-app delivery still needs a private sender that stores subscriptions and
signs messages with VAPID. Do not label local checks as reliable background push.

The app previews three Android widget concepts—Focus Orb, Today Strip, and Circle
Pulse—but does not claim the PWA installed a native widget. Android widgets require
an `AppWidgetProvider`/Glance receiver in a native shell. These three cover control,
information, and hybrid use without putting the whole app on the home screen.

## 2026-09-10 · Discoveries become field stories

The learning card on Do is now the entrance to a small field-journal loop inside
Write. A discovery can carry its fact, source, and conversation question into
the one writing box; Write can also begin a blank field story from an ordinary
moment. Saved stories are ordinary `scribe.entries` with `field-story` tags and
source metadata copied into their chronicle event. They gain a dedicated filter
and visual mark, but not another tab or another data store.

Writing a story pays zero, consistent with every other capture. Actually sharing
one is a finished action and pays 10 points once per story per day. The app records
only that it was shared; it does not ask who heard it or transmit the story.

## 2026-09-09 · The joysticks choose a quest, not an identity sentence

The two controls now resolve to one small physical action across four arenas:
work, self, connection, or environment. The second stick selects preparation
versus direct action and solo versus together. The player locks the generated
quest, does its two visible steps, and only then banks the practice. Coordinates,
the chosen action, and its steps are recorded as evidence; the app does not turn
them into a personality claim. The discarded “I am the kind of person who” copy
must not return.

Write corrections are projections over an append-only record. Holding an entry
opens a category rail; dropping it appends `entry-reclassified` and teaches the
classifier, while the original event remains byte-for-byte unchanged. Backup and
routine action confirmations descend from the hotbar so background success is
never ambiguous.

Goal tracking follows the verb, not merely the noun. Buying a motorcycle counts
marketplace checks; selling one counts repair, photo, and listing steps. Existing
saved goals with the old ride tracker are repaired at read time. Current-period
counts are shown as integers, not misleading four-week fractions.

The Circle's empty form is disclosure UI: one round Add control expands the form
and the friend list remains the first content below it. On a reward screen, a
second press keeps the gold target briefly, clears the surrounding copy, and
breaks the target into glass wedges before returning to Do.

## 2026-09-09 · Time chooses the category; evidence chooses the action

The Do dealer now reads local clock time in seven phases instead of treating an
entire morning or afternoon as interchangeable. Early morning strongly favors
body-first instructions; midday and afternoon strongly favor open rows from the
daily task board. It still uses recorded completions, energy and explicit task
effort inside that category. The UI shows the time, source, and “why this now” so
the recommendation is inspectable rather than pretending to be intuition.

Practice answers use two physical joysticks, not a disguised text form. Their
four axes are deliberately finite—approach, energy, action and support—and the
derived sentence stays visible before commit. Both raw coordinates and the
sentence are recorded. The app must not claim those coordinates reveal a hidden
personality; they are only the response the user selected in that moment.

The visual budget is now explicit. All companion instances share one 24fps
ticker and pause off-screen; the trail uses two group animations rather than 77
individual ones, and full-screen SVG blur filters are prohibited. A visual that
drops input or scroll frames has failed, however attractive it is.

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

## 2026-09-13 · The keyboard waits to be asked

**Opening a bubble no longer focuses its field.** Tapping a node used to throw
the keyboard up instantly, which on a phone means half the screen — and the
paper you are trying to read — disappears before you have decided you want to
type anything. Most taps on a node are to look at it, drag it, or delete it.

The keyboard now arrives when you tap the field, and only then. That is the one
moment you have actually said you want it.

**So the field has to look like a field.** A borderless line reads as a label
when nothing is focused, so inputs and textareas in a bubble now have a border,
a light fill and a radius, with an ember ring on focus. An empty field also
starts wide enough to read its own placeholder, because for the six kinds that
placeholder is the only instruction they ever give.

**And the keyboard must not move the paper under you.** The keyboard opening is
a `visualViewport` resize, and the resize handler re-centres the locked set —
which would yank the field out from under the cursor mid-sentence. While a
bubble is open that re-centring is skipped, and instead `keepFieldVisible()`
slides the paper just enough that the bubble sits inside whatever height is
left above the keyboard.

---

## 2026-09-13 · Never ask the window how big it is

Two complaints, one cause. The exit button was missing on a phone, and tapping
a set framed it down and right, half off the screen. Both came from
`window.innerWidth` / `innerHeight`, which on a phone is **not** the visible
area — iOS counts the space behind translucent chrome, Android counts the URL
bar until it hides. Measured on a 400×820 handset viewport, `innerHeight`
reported **1640**. Framing a set at `H/2` therefore centred it a full screen too
low, and sizing the overlay to it put the bottom strip — where the only way out
lives — under the browser.

**The rule now: nothing in Scratch asks the window for its size.** `screenBox()`
measures the surface, a real element with a real box, and every frame, every
lock and every rescue is computed from that. The overlay's own height takes the
*smallest* of `visualViewport.height`, `innerHeight` and
`documentElement.clientHeight` — the smallest honest number, never the largest,
because being slightly short is invisible and being slightly tall hides the exit.

`focus()` used to frame the view before the overlay was on screen, measuring an
element that had no box yet. It now stores what to look at and frames it in
`show()`, once there is something real to measure.

**And the exit gets a runtime guard.** After every paint, `guardExit()` checks
the button is actually inside the visible box and drags it back in if it is not.
Belt and braces for the one control whose failure mode is being trapped.

**A patching lesson, recorded because it cost real time.** A scripted
find-and-replace on `.sc-exit{` also matched inside
`@media (prefers-reduced-motion:reduce){ #scratch,#app,#tabs,.sc-node,.sc-exit{`
and injected a whole block into the middle of that selector list, nesting the
sets and pen styles inside the media query. It stayed valid CSS and therefore
stayed silent. When patching stylesheets by string match, anchor on something
that cannot appear inside a selector list.

---

## 2026-09-13 · The camera belongs to a set, not to the page

**You arrive inside a set.** Opening the paper used to drop you wherever you
last left the view, which on a phone is a screen of dots and no idea which way
your work is. Now it frames a set — the one you were last in, or the nearest, or
the only one — and the camera belongs to that set until you ask for it.

**A set is what you would point at and call "that lot".** Union-find over two
relations: an arrow between two nodes at *any* distance, because you drew that
on purpose, and simple proximity within 300 world px, because that is how anyone
reads a page. Both matter — grouping on spacing alone would split a deliberate
long arrow, and grouping on arrows alone would miss a cluster you have not wired
up yet.

**Buttons down the left, one per set, in the order they sit on the paper**
(top-left first). Each carries its name — the outcome if you named one, else
whatever the arrows end at — and its size. This is the way home, so it is always
visible. Tapping one puts the camera back inside that set.

**Pinch is what hands over the camera.** Zooming *is* the act of saying "let me
see more than this", so it is the gesture that unlocks free movement. Dragging
while locked lets you peek and springs back, which is what makes the lock feel
like a place rather than a cage. The buttons put you back. Nothing else
silently changes the mode.

**The dots are the paper, not a backdrop.** The grid's cell size and the dot's
own radius are both recomputed from the zoom every frame, and its origin is
pinned to world coordinates. Nodes and dots scale together as one object; there
is no parallax between the thing you drew and the surface you drew it on.

**The exit is a door.** Bottom right, a circle with a door-and-arrow glyph, back
to Do.

**One regression worth naming.** `overflow-wrap: anywhere` on the bubble text
changed its intrinsic min-content width to a single character, and since a
bubble is absolutely positioned and sizes shrink-to-fit, every one of them
collapsed into a vertical column of letters. `break-word` does not do this.
`anywhere` and `break-word` are not interchangeable, whatever the name suggests.

---

## 2026-09-13 · Four bugs that only showed up on the phone

All four were invisible on a desktop browser and obvious within a minute on an
Android handset. Worth recording as a class of mistake, not just four fixes.

**`transform-origin` was the big one.** The whole coordinate model is
`screen = world × zoom + pan`, which is only true if `scale()` grows from the
top-left. The default is `50% 50%`, so everything was exactly right at zoom 1
and quietly wrong at every other zoom — the wire under your thumb landed
somewhere else, the lasso caught the wrong bubbles, and the paper felt like the
camera was pointing somewhere you were not. `transform-origin: 0 0` on
`.sc-world` is load-bearing. **Do not remove it.**

**The pinch anchored to where the fingers landed** instead of tracking them, so
zooming felt pinned to the middle of the screen. The midpoint is read fresh
every frame now, which makes two fingers pan as well as scale — the standard
behaviour, and what a hand expects.

**There was no way out on a phone.** A fixed overlay at `inset: 0` sizes to the
*layout* viewport, so its bottom strip — where the only exit lives — sat under
the Android browser chrome. It is now measured from `visualViewport` into
`--sc-h` and updated on resize and scroll. `#app` already used `dvh` for the
same reason; anything full-screen in this app has to.

**Hold-to-draw died to text selection.** A long press on a phone starts a
selection, the selection cancels the pointer gesture, and the stroke never
begins. `user-select: none` on the surface stops it, and a cancel mid-stroke now
completes the loop rather than binning it. But the real answer was a **pen
button, top right** — on means every drag draws, off means every drag pans.
A visible toggle beats a hidden timing window, and you can see which mode you
are in without trying it.

**Assist.** The paper is infinite, which is the problem. Nodes fall into
sections whether you meant them to or not, so on release the view settles toward
the section you were nearest — a nudge, never more than a quarter of a screen,
and it leaves you alone while a section is in view. The one hard rule: **if no
node is on screen at all, it frames the nearest section.** You cannot drift off
into blank paper and lose the lot. That was asked for directly, and it is the
promise the feature makes.

---

## 2026-09-13 · The paper gets a vocabulary, and one door to the list

Second pass on Scratch, all of it asked for directly.

**The swipe goes right, and it had to be fixed to work at all.** The first cut
had it backwards. More importantly it barely fired on a real phone: the Do pane
is a scrolling list, so the browser claimed any drag starting on it, fired
`pointercancel`, and the gesture died halfway. `touch-action: pan-y` on that pane
is the fix — the browser keeps the vertical axis, we get the horizontal. The
commit threshold is now distance **or** speed, so a flick counts as much as a
haul. **Do not remove the `touch-action` line**; without it the whole gesture
silently stops working on touch and keeps working on a desktop mouse, which is
the worst way for a bug to hide.

**Straight while you aim, curved once it exists.** A wire being dragged is
straight because you are pointing it at something. Once it exists it becomes a
cubic, because a page of straight lines through a field of bubbles reads as a
mess. One formula covers both shapes it needs: control points pushed
perpendicular in opposite directions make an S, and when something is sitting in
the middle of the run both get pushed the same way instead, opening the S into a
C around it.

**Six kinds, and they had to earn it.** Step, Outcome, Blocker, Resource, Habit,
Note, on a double tap. The brief was "don't make it complicated and don't make it
useless", and the resolution is that they are a *vocabulary for taking a goal
apart*, not colours. The palette teaches it — one line each on when you would
reach for it — and the line a plan shows on Do is composed from them, so
choosing the right kind is what makes the summary read like a plan rather than a
pile. A kind that only tinted a bubble would be the useless version.

**Circling is the door to the list, and the only one.** Holding the paper starts
ink like a pen; a loop around a group makes one larger task on Do, `effort: 3`,
carrying a thumbnail of the actual shape and a one-line description. This is the
"separate act" left unbuilt last time. Individual nodes still never become tasks
— that stays true, and the reasoning below still holds. What crosses over is a
whole shape you deliberately drew a circle around.

**Ink is not stored.** Its only job is the loop. Persisting freehand annotation
is a different feature and was not asked for; storing it would have meant an
eraser, layers, and a lot of surface for no gain.

**Pinch zooms**, 0.45× to 2.2×, about the midpoint of the two fingers, and the
dot grid scales with it.

**One bug worth remembering.** `pointerup` and `pointercancel` now listen on the
window rather than the surface. Release over an element that was removed mid-
gesture — the bubble you tapped twice, a wire you just cut — and the event never
bubbles back; the pointer stays in the live map, and the *next* touch is read as
the second finger of a pinch. Every gesture after it dies. This is invisible
until it happens and maddening afterwards.

---

## 2026-09-13 · Scratch is paper, and it is not a fifth tab

**Decided.** Swiping left on Do slides the desk aside and brings in a white
dotted grid: tap to put a thing down, hold a bubble to wire it to another, swipe
along the wire to say which end comes first. An ember exit button, bottom right,
brings the desk back.

**Why it is not a tab.** "Never a fifth tab" is a rule about the bar, and the
reasoning behind it is that four is the number a thumb can hit without looking.
This is a lateral move off Do — Do stays mounted underneath, the bar slides away
with it, and you arrive by a gesture rather than by aiming. It lives on the
`#scratch` route so the Android back button closes it for free. **Do not promote
it into the bar**, and do not delete it for breaking a rule it does not break.

**Why white.** Everything else is graphite because it is a machine you operate.
This is paper you think on. The change of material is the only signal needed to
say which mode you are in, and it costs no chrome to say it.

**Nodes are not tasks.** They are deliberately kept out of `mind.load`. Mapping
a plan has to cost nothing and commit to nothing — the moment putting a node
down added a row to today's list, thinking on paper would start adding
obligations, and he would stop doing it. Sending work to the list is a separate,
deliberate act: as of the entry above, that act is circling a group with ink,
and it makes one task, not one per bubble.

**The arrow has to change something.** An order you can draw but that the system
ignores is decoration. Anything with a directed arrow pointing at it renders
faded and dashed, and the header counts how many can actually start now
(`store.scratchOpeners()`). That feedback is the entire payoff for drawing it.

**Swipe semantics, stated once because they are easy to invert.** You swipe
*away from* the thing that has to happen first, in the direction the work flows.
Swiping from "Earn £100" towards "Get a new mower" means earning comes first and
the arrow points at the mower.

**Rejected.** A toolbar with add/connect/direct modes. Modes are a tax on every
future interaction, and the gestures separate cleanly on movement and time
without one. Also rejected: snapping nodes to a rigid lattice — the positions
are a thinking aid, so they only snap to a half-grid, loosely.

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
