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

## 6. Backup, once the repo exists

With the repo already there, the durable-backup answer is the same repo: the app
commits your exported JSON on a schedule through the GitHub API, using a
fine-grained token you paste in once. Every save becomes a restore point with
full history, so "I lost six months" stops being possible and the worst case is
"restore yesterday". That is the next thing to build.
