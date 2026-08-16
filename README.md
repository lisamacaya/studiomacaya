# Studio Macaya

Vite + React + TypeScript site deployed on Netlify with **Live** (production) and **Dev** branches.

## Branches

| Branch | Role | Netlify |
|--------|------|---------|
| `Live` | Production — what others call `main` | Production site |
| `Dev` | Staging / development | Dev site |

### Workflow

1. Do day-to-day work on `Dev` and push to GitHub.
2. When ready for production, merge `Dev` → `Live` and push.

```bash
git checkout Live
git merge Dev
git push origin Live
```

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` for local overrides:

```bash
cp .env.example .env.local
```

## Netlify setup (GitHub)

Create **two Netlify sites** connected to the same GitHub repo — one for each environment.

### 1. Production site (Live)

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
2. Select this repository
3. **Production branch:** `Live`
4. Build settings are read from `netlify.toml` automatically
5. Deploy

### 2. Dev site

1. **Add new site** → **Import from Git** → same repository
2. **Production branch:** `Dev`
3. Give the site a distinct name (e.g. `studiomacaya-dev`)
4. Deploy

Each push to the matching branch triggers a deploy on that site.

### Environment variables

Non-secret config can live in `netlify.toml` deploy contexts. Secrets belong in the Netlify UI:

**Site settings → Environment variables**

Set per-site values as needed. Use the `VITE_` prefix for client-side variables:

```
VITE_APP_ENV=live   # on the Live site (also set via netlify.toml)
```

Access in code via `import.meta.env.VITE_*`.

## Build

```bash
npm run build   # outputs to dist/
npm run preview # preview production build locally
```
