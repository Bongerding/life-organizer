# Android widget direction

Life Organizer is currently an installable web app. Android home-screen widgets
are native components declared by an app widget provider; a PWA cannot register
one. The Settings page therefore contains live, data-backed previews and this
document is the implementation contract for a future Android shell.

Android groups widgets into information, collection, control, and hybrid types.
An app can publish multiple providers and responsive sizes, but more choices are
not automatically better. Life Organizer should begin with three.

## Focus Orb — 2 × 2, control

- Shows the next open Do item and the Lumen sphere.
- A tap opens `#do` at that item.
- A future native action may complete the item directly, with confirmation and
  the same point rules as the app.
- Empty state: “One clear next move,” never a guilt message.

## Today Strip — 4 × 1, information

- Shows completed/open counts and current player level.
- Resizes horizontally; larger widths may add the level progress line.
- A tap opens the Do page. It does not rotate content or animate continuously.

## Circle Pulse — 2 × 2, hybrid

- Shows the number of relationships whose chosen reach-out date has arrived.
- A tap opens the existing Friends drawer.
- It never displays a person's name on the home screen by default. A later
  configuration screen may explicitly opt a widget into one chosen person.

## Native implementation boundary

Use a minimal Android shell with an `AppWidgetProvider` or Jetpack Glance. The
shell must read a deliberate bridge/export from the web app; it must not create a
second authoritative record. Widget writes return through the same store methods
and append-only chronicle. Support responsive size buckets, touch, and vertical
scroll only; the launcher owns horizontal swipes.

Official references:

- <https://developer.android.com/develop/ui/views/appwidgets/overview>
- <https://developer.android.com/develop/ui/compose/glance>
- <https://developer.mozilla.org/en-US/docs/Web/API/Push_API>
