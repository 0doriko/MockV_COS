# Custom GPT Action setup

Your GitHub Pages site is a **website** (HTML). Custom GPT **Actions** need an **OpenAPI schema** (API description), not a people directory page.

## Do not import this URL

```
https://0doriko.github.io/MockV_COS/people/
```

That returns HTML. You will see: **"Could not find a valid URL in `servers`"**.

## Import this URL instead

```
https://0doriko.github.io/MockV_COS/openapi.json
```

Or paste the contents of `openapi.json` from the repo into the Schema box.

## Steps in ChatGPT

1. Open your Custom GPT → **Configure** → **Actions** → **Create new action**.
2. Click **Import from URL**.
3. Paste: `https://0doriko.github.io/MockV_COS/openapi.json`
4. **Authentication:** None
5. Confirm two operations appear:
   - `getCompanyStructure` — all employees (`profiles.json`)
   - `getEmployeeProfile` — one person by slug (`data/maya-chen.json`, etc.)
6. Save the GPT.

## Example GPT instructions (add to Instructions)

```
When you need org context, call getCompanyStructure or getEmployeeProfile.

Slug examples: aisha-rahman, maya-chen, yuki-tayawa, davis-wan.

Use communication_style and key_goal when drafting messages to each person.
```

## Slug reference

| Name | Slug |
|------|------|
| Aisha Rahman | aisha-rahman |
| Maya Chen | maya-chen |
| Yuki Tayawa | yuki-tayawa |
| Davis Wan | davis-wan |

Full list: open [People directory](https://0doriko.github.io/MockV_COS/people/) — the URL path after `/people/` is the slug.

## After updating profiles.json

```bash
npm run build:pages
git add profiles.json people/ data/ openapi.json
git commit -m "Update profiles and API data for Custom GPT"
git push
```
