# Fake CompanyOS

A static **companyOS** people profile simulator for [GitHub Pages](https://pages.github.com/), powered by `profiles.json`.

## GitHub Pages deploy

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source:** Deploy from a branch.
3. Branch: `main` (or `master`), folder: **`/ (root)`**.
4. Your site will be live at:
   - `https://<user>.github.io/<repo>/` → redirects to the People directory
   - `https://<user>.github.io/<repo>/people/` → all profiles
   - `https://<user>.github.io/<repo>/people/maya-chen/` → Maya Chen’s profile

`.nojekyll` is included so GitHub does not run Jekyll (which would ignore some paths).

### After editing profiles.json

**You must regenerate** the `people/` folder — those HTML files embed old names and URL slugs.

```bash
npm run build:pages
# or: node scripts/generate-people-pages.mjs
git add profiles.json people/
git commit -m "Update names and regenerate people pages"
git push
```

If you rename someone, their URL slug changes too (e.g. `yuki-tanaka/` → `yuki-tayawa/`). Update any `reports_to` fields that still use the old name, or reporting lines will break.

## URL structure

| URL | Page |
|-----|------|
| `/` | Redirects to `/people/` |
| `/people/` | Directory of all employees |
| `/people/maya-chen/` | Maya Chen profile |
| `/?person=Maya%20Chen` | Redirects to `/people/maya-chen/` (legacy) |

Slugs are derived from names: `Maya Chen` → `maya-chen`.

Reporting line and peer cards link to each person’s page. Paths work on any repo name (project sites use `/RepoName/` automatically).

## Local preview

```bash
python3 -m http.server 8080
```

- http://localhost:8080/people/
- http://localhost:8080/people/maya-chen/

## Data mapping

| UI section | Source |
|------------|--------|
| Name, role, department | `profiles.json` |
| Reporting line | `reports_to` chain + direct-report counts |
| Peers | Same manager in org chart |
| Current time / location | `timezone` |
| About me | `communication_style`, `key_goal` |
| Email, handle, tenure | Generated (fake) |

## Custom GPT integration

`buildProfileView(name)` in `js/profile-data.js` returns JSON documented in `api-schema.json`. When your SyncMind GPT is ready, point the app at that API instead of `Profiles.json`.

## Files

| Path | Purpose |
|------|---------|
| `profiles.json` | Employee data (edit this) |
| `people/<slug>/index.html` | Static profile pages (generated) |
| `people/index.html` | People directory (generated) |
| `scripts/generate-people-pages.mjs` | Page generator |
| `js/paths.js` | GitHub Pages–safe URLs |
| `js/profile-data.js` | Org computations |
| `js/app.js` | UI rendering |
