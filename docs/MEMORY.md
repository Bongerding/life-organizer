# Memory — can this hold ten years?

Short answer: yes, and capacity is not the hard part. Durability is.

---

## 1. What is stored, and where

As of schema v3 the whole record lives in **IndexedDB** on the device, with
**localStorage** kept as a mirror and a fallback. On first load the store adopts
any existing localStorage data, so the upgrade loses nothing.

The app also calls `navigator.storage.persist()` on every boot, which asks the
browser to mark the data **eviction-proof** — without it, a browser under disk
pressure is allowed to bin your site data without asking. Settings → Memory shows
whether the grant came through.

## 2. The size maths, with real numbers

Measured on a live record: **12 KB for 27 events** — roughly 120 bytes per
chronicle entry once you account for the surrounding state.

| | |
|---|---|
| Events on a heavy day | ~25 |
| Per day | ~3 KB |
| Per year | ~1.1 MB |
| **Ten years** | **~11 MB** |
| Quota this browser reported | **2,594 MB** |

So a decade of dense logging uses about **0.4% of what the browser already
offers**, roughly 230× headroom. Text is tiny. Nothing about ten years is a
storage problem.

Two caveats worth knowing:
- The **localStorage mirror** caps out around 5 MB, so somewhere in year four it
  will quietly stop mirroring. That is fine — IndexedDB is the primary — and the
  store sets a `mirrorFull` flag rather than failing.
- The whole object is parsed on boot. At ~100k events that is a noticeable pause,
  which is the point to split `chronicle` into its own IndexedDB store with a
  date index and load it lazily. Roughly year eight. Noted in the architecture doc.

## 3. What can still lose it

Capacity is solved. These are the actual risks:

| Risk | Real? |
|---|---|
| "Clear browsing data" / clearing site data | **Yes.** Wipes everything, persistence grant or not. |
| Losing or replacing the device | **Yes.** One device is one point of failure. |
| iOS Safari 7-day eviction for sites you have not visited | **Yes** for a plain tab; much less so once added to the Home Screen. |
| Persistence not granted | Possible. Chrome grants it on engagement, bookmarks, or install; Safari on Home Screen add. |
| Browser or OS reinstall | **Yes.** |
| Running out of space | No. See the maths above. |

Every one of these has the same fix: **the record has to exist somewhere that is
not this browser.**

## 4. What the app does about it today

- **Settings → Memory** shows the backend, the persistence grant, your record
  size, the quota, and days since your last backup.
- **Download a backup** writes the complete JSON and stamps `meta.lastBackup`.
- **Copy the whole record** does the same via the clipboard, for the hosted phone
  build where a browser cannot hand a page a file.
- If it has been more than 21 days, the Character page raises it as a message,
  ranked near the top. The machine nags you instead of the other way round.

Put those files in a cloud folder — iCloud Drive, Dropbox, Drive, anything that
syncs — and the ten-year problem is already solved at the cost of one tap a
fortnight.

## 5. Automatic backup — the decision to make

Manual works but depends on you. These are the four real options for making it
automatic, and they need one choice from you before I build it:

| Option | How it works | Upside | Cost |
|---|---|---|---|
| **Private GitHub repo** *(recommended)* | The app commits the JSON on a schedule through the GitHub API | Free, off-device, and **every save is a version** — a decade of restore points, diffable, recoverable from a bad write | A fine-grained token stored on the device |
| Cloudflare Worker + R2/KV | A ~50-line endpoint you own | Fast, free at this volume, no third-party UI | You keep a Worker alive; no version history unless added |
| Small private server | A VPS with one file per save | Total control | A machine to maintain for ten years |
| Cloud-folder file (native shell) | The iOS app writes into iCloud Drive | Zero infrastructure, invisible, Apple keeps it | Needs the Phase 4 native shell first |

The GitHub option is the one I would pick. Version history is the difference
between "I have a backup" and "I can go back to how this looked in March 2029",
and it costs nothing forever.

## 6. Why the format will still open in ten years

- **One plain JSON object.** No database file, no proprietary container, no
  binary. Readable in any text editor, on any OS, forever.
- **`chronicle` is append-only.** Events are written once and never edited,
  reordered, or migrated. A future version of the app can add new event types
  alongside the old ones, but it cannot rewrite your history — which is exactly
  the property a logbook needs.
- **`graft()` migration.** Loading merges your saved object onto the current
  blank shape, so new fields appear with defaults and nothing existing is
  dropped. Old backups restore into new versions.
- **No dependencies.** Nothing to go stale, nothing to be abandoned upstream.
  A single HTML file plus your JSON is the entire system.

## 7. If you want it truly permanent

Belt and braces, in order of effort:

1. Add Ignition to your Home Screen (helps the persistence grant, kills the iOS
   7-day eviction risk).
2. Download a backup into a synced cloud folder — the app will remind you.
3. Pick a sync target from §5 so it stops depending on you.
4. Once a year, export and drop a copy somewhere cold: a USB stick, an email to
   yourself, a printed year in review from the Chronicle.
