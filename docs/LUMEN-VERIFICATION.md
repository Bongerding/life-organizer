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
