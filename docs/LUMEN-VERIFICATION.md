# Lumen release verification — 2026-09-08

Automated: `node tools/test-companion.js` passes cold-start behaviour, low-energy
pacing, positive/negative method feedback, daily feedback correction, pause,
steady/stretch comparisons, append-only hide/restore, backup round-trip and
contact schedule advancement. All application JavaScript passes `node --check`.

Browser checks on a separate loopback origin (sample data only):

- Four tabs load; the glass profile mark and level remain in the header.
- Friends drawer opens; adding a friend persists a name and notes. Logging a
  connection advances the due date by the configured fourteen-day cadence.
- Me renders the raised player card, actual counters and guidance controls.
- Write saves a sample thought; the top-right removal control removes it from
  view; Undo restores the same text. Removal does not mutate prior events.
- Advice displays positive and difficult choices interleaved, the All feelings
  disclosure, and a quest. Completing a quest changes XP and presents feedback;
  submitting feedback disables the two feedback controls for that view.
- Phone-size layout reviewed at 390 × 844 and desktop at 1280 × 720.
- Final continuation on 2026-09-09: upward drag opens the drawer; a saved
  birthday shows its countdown; the legacy `#people` route opens the drawer;
  Start runs its brief animation then reaches the timer; Stop exits cleanly.
  The generated standalone HTML loads the player card, inline mascot and XP.

Icons are generated from the original render with a reproducible PowerShell
script. Normal sizes: 192/512, Apple 180, maskable 192/512 with inset artwork.
The original full-quality PNG remains available but runtime uses smaller icons.
The standalone builder now includes level/adaptive/companion scripts and embeds
the runtime images, avoiding new external asset dependencies.

Limits: browser reminders require opening the app. No message is automatically
sent. Soft-deleted writes remain in backups and source history. Discovery facts
are curated with source links; the old quote bank's author links are not proof
of attribution. The local adaptive engine is heuristic, not a clinical model or
causal analysis, and has no remote backend.

2026-09-09 regression scope: daily Do capture no longer creates a Scribe entry;
Write entries no longer create daily tasks; the daily list filters on
`origin: 'do'`; legacy wins still count through `level.pointsOf`; the runtime
mascot exposes forty wedge groups and respects both motion controls. The
procedural glass render was also reviewed at 800 × 800: distinct translucent
wedges, edge glints and the central light remain legible on the app background.
The completion box is the final control on every daily task row.

Trail refinement: the runtime markup contains more than seventy recursively
generated branch segments inside three broad blurred currents. Both the field
drift and vein shimmer stop under the app motion control and reduced-motion CSS.
The regenerated 512px launcher icon was visually reviewed after downsampling:
the sphere remains dominant and legible, while the old orbit line is gone and
the broader fractal field survives at icon scale.
