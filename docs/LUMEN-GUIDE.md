# Lumen: a companion for a life that is actually lived

The new direction is a personal growth game with a truthful record underneath.
The player is the person using it. Lumen is the floating glass companion: a
solid sphere divided into long inward-pointing glass wedges, held apart by a
living light. Its trailing beam gives the frame movement and asymmetry.

The user explicitly requested this pivot on 2026-09-08 and authorized design
judgement, implementation, and related usability improvements. This supersedes
the previous decision requiring a hexagon instead of a mascot. Four tabs remain.

## What this release does

- Uses the generated optical-glass render in the profile, header, and installed
  app icons. A raised player card shows recorded activity, friendships, practices,
  level, and progress. No invented character attributes or personality claims.
- Adds a vertical friends drawer at the lower right. Click or drag its handle
  upward. Add and edit birthdays, contact cadence, next dates, and notes about
  good times to connect. Logging contact advances the date; Tomorrow snoozes it.
  Reminders are in-app only. It sends no invitations, messages, or notifications.
- Fixes the obsolete `people` route used by the Do action about naming friends.
- Makes the X on journal entries visible. Removal is recoverable: append a
  tombstone event, filter the record view, offer Undo and restore-all in Me.
  This is removal from view, not secure erasure; exports retain original text,
  linked tasks, and earned points. The UI labels this distinction explicitly.
- Mixes positive, difficult, and mixed feelings, with gradual three-day rotation
  and an All feelings disclosure so a needed protocol never becomes inaccessible.
- Reframes practices as small quests; removes punitive answer-length language;
  records explicit helpfulness feedback to shape future selections.
- Adds sourced discovery cards for springs and nature, a conversational prompt,
  four-hour rotation, manual next, and interest switches. Public educational
  material belongs in code; a user's occupation or other private profile does not.
- Rotates existing quotes by app-open count and links author names. Author links
  are biographies, not verification of every quotation in the legacy bank.
- Adds a brief expansion/light animation on Start/Open and motion controls.
- Fixes the standalone builder's missing level engine and embeds the new image.

## The adaptive engine and its limits

`assets/js/adaptive.js` is the local data/decision layer. It compares seven-day
completion counts with the preceding week and reads recent energy check-ins.
At least six active dates and a thirteen-day account age are needed for the
week comparison. Three check-ins are required before adapting to low energy.
The user can pause adaptation. It never rewrites its own code or sends journal
text to a remote model. There is no hosted backend in this release.

Modes are explore, gentle, steady, stretch. They alter the probability of short
versus longer Do suggestions, and the balance of reflective versus exposure
practice. Method-level helpfulness feedback over 28 days uses a bounded prior
(0.5–1.5 multiplier), so a disliked method is less frequent without disappearing.
Feedback is one current vote per method per day; changing it is a correction.

The explanation is visible on Me. Sparse logging is not proof of a bad life,
causation, diagnosis, or a personality. Existing historical Alignment Index
estimates remain separate from this engine. No ungrounded inference about the
person should be added just because the UI looks like a game.

## Where this should go next

The strongest next idea is **a field journal that becomes a story collection**.
A discovery becomes something the user can explain, then a memory of sharing
it with someone. That ties learning, social contact, and everyday experience
together more naturally than another points currency.

1. First, use this release and gather explicit practice feedback. Review which
   invitations were useful and where the interface asks for too much work.
2. Add a weekly expedition recap: actions, connections, and discoveries, each
   traceable to a record. Offer one experiment for next week, with accept/skip.
3. Expand a curated, source-checked discovery library. Add recall and saved
   story cards before connecting any generated-fact service.
4. After enough observations, compare methods against actual follow-through.
   Show sample counts and uncertainty, distinguish correlation from causation,
   and offer the user a correction whenever an interpretation misses the mark.
5. Optional calendar export and reminders can follow. Explicit user controls
   should govern which friends and dates leave the device.

Avoid streak penalties, social rankings, fabricated RPG attributes, or an
algorithm silently changing the user's goals. The companion should be curious,
playful, and correctable. Its best success is helping someone put the phone away.

## Continuity / testing

Read this file alongside DECISIONS.md and ARCHITECTURE.md. Keep logs in the repo
when changing the direction. Never publish raw private conversation transcripts.
`node tools/test-companion.js` runs isolated checks of recovery, adaptation,
feedback, pause, backup round-tripping, and friends cadence. Browser checks use
a separate loopback port to avoid contaminating the user's established storage.
