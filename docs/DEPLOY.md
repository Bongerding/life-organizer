# Getting it on the phone, and updating it after

The short version: **put it on GitHub Pages once, then every change I make
reaches your phone by you reopening the app.** No reinstall, no store, no
copying files about, and your data is never touched.

---

## 1. Decide the address before you log anything real

This is the one decision that is annoying to change later.

Browser storage is tied to the **origin** — the scheme and domain the app is
served from. `https://you.github.io/life-organizer/` and
`https://claude.ai/code/artifact/…` are two different origins, so they get two
separate, invisible copies of your record. Moving between them means exporting
and importing by hand.

So: pick the permanent home first, install from that, and only then start filling
it with six months of your life.

**Recommended home: GitHub Pages.** Free, HTTPS (which is what makes a real
install possible), never expires, and the same account gives you the versioned
backup target.

---

## 2. One-time setup

```bash
cd "C:\Claude Projects\Life Organizer"
git init -b main
git add -A
git commit -m "Life Organizer"
```

Then make an empty repo on GitHub (private is fine — Pages works on private repos
for personal accounts on the free tier as of writing; if it refuses, make it
public, there is nothing sensitive in the code and your data never leaves the
phone), and:

```bash
git remote add origin https://github.com/<you>/life-organizer.git
git push -u origin main
```

In the repo: **Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**.

There is no build step — the repo root *is* the app — so branch deployment is all
it needs. No Actions workflow, and nothing that can break in CI.

Your URL will be `https://<you>.github.io/life-organizer/`.

## 3. Install it on the Pixel

Open that URL in Chrome → **⋮ → Install app** (or "Add to Home screen"; on
Android with a valid manifest and service worker it becomes a real install).

You get an app-drawer entry, its own storage, no browser chrome, offline support,
and persistent storage granted automatically.

---

## 4. The update loop, from here on

```
You:     "Claude, add a ride log"
Me:      edit files → node tools/stamp.js → node tools/build-app.js
Me:      git commit && git push
GitHub:  rebuilds Pages (~40s)
You:     open the app → it is the new version
```

That is the whole thing. Some detail on why it works:

- **The service worker is network-first.** When you open the app with signal it
  fetches the current files and only falls back to its cache when there is
  nothing. So there is no stale-version limbo and nothing to force-refresh.
- **`node tools/stamp.js`** rewrites the `?v=` on every asset and the service
  worker's cache name with a timestamp, so even an aggressive cache cannot hand
  you yesterday's JavaScript. Run it before every push — it is one command and it
  is the difference between "it updated" and "why has nothing changed".
- **Your data is not in the deploy.** The record lives in IndexedDB on the phone,
  keyed to the origin. Deploying new code swaps the HTML, CSS and JS and leaves
  the database exactly where it is.
- **Schema changes are safe.** `store.load()` grafts your saved object onto the
  current blank shape, so new fields arrive with defaults and nothing existing is
  dropped. Old exports restore into new versions.

### If you are offline when I ship something

Nothing breaks. The service worker serves the last version it cached and every
write still lands in IndexedDB. Next time you open it with signal you get the new
build, and the writes you made offline are already in the record.

---

## 5. The other routes, and why they are worse

| Route | Updates | Install | Verdict |
|---|---|---|---|
| **GitHub Pages** | push, reopen | real | **use this** |
| Artifact link | I republish, you reload | Add to Home Screen only, no offline | fine for a look, not a home |
| LAN `http://<pc-ip>:5273` | instant | not offered — install needs HTTPS | dev only |
| Single file copied over | copy it again by hand | no | last resort |

## 6. Automatic backup

Built, and it is the thing that makes six months of writing safe.

The app commits your whole record to **one file in a private repo**, over and
over. Because it is the same path every time, git's history *is* your version
history — every backup is a restore point you can read, diff or roll back to.

### Turning it on, once

1. GitHub → **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**
2. **Repository access:** Only select repositories → `life-organizer-data`
3. **Permissions:** Repository permissions → **Contents: Read and write**.
   Nothing else. No other repo, no other scope.
4. Generate it, copy it.
5. In the app: **⚙ → Automatic backup** → owner, repo, `backup.json`, paste the
   token → **Check and save**.

It refuses to accept a public repo, checks the token can actually write before
saving, and takes the first backup immediately so you know it works.

### After that

- Backs up on open, and after writes, at most once every six hours.
- **Back up now** forces one.
- **Restore from GitHub** pulls the committed copy back down — that is also how
  you move to a new phone.
- Offline it simply does not run; nothing queues up wrong and nothing is lost.

### Why the token is safe here

- It lives in IndexedDB on this device only.
- `store.export()` strips it, so it cannot end up inside the backup it just made,
  and it is not in any file you download or paste.
- Importing a backup never overwrites the token this device is using.
- It is scoped to one private repo with one permission. If it ever leaked, the
  worst anyone gets is that repo.

If the token expires, backups fail loudly — the settings panel shows the error
and the Character page nags once the last backup gets old. Nothing fails silently.
