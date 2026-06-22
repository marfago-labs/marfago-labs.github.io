# GitHub Pages — org site (`marfago-labs.github.io`)

The org hub lives at **`https://marfago-labs.github.io/`**. GitHub requires a repo named exactly **`marfago-labs/marfago-labs.github.io`**.

## Repo layout

```text
marfago-labs.github.io/
  blog/posts/              # source of truth for blog (synced at build)
  website/                 # Astro site → website/dist/
  .github/workflows/deploy.yml
  README.md
```

Do **not** flatten `website/` to repo root unless you also change `sync-blog.mjs` and the workflow paths.

## One-time GitHub setup

1. Create **`marfago-labs/marfago-labs.github.io`** (public).
2. Push this monorepo slice (`blog/`, `website/`, `.github/`, root `README.md`).
3. **Settings → Pages → Build and deployment → Source:** **GitHub Actions**.
4. Push to `master` or `main` (or run **Deploy org site (Pages)** manually).

After the first green run, the site URL appears under **Settings → Pages** and in the **github-pages** environment.

## Local check before push

```powershell
cd <workspace-root>/website
npm install
npm run build
npm run preview   # http://localhost:4321
```

## What CI does

Same pattern as `ner-dataset` / `ner-detector` Pages workflows:

1. Checkout
2. `npm ci` + `npm run build` in `website/` (runs `sync-blog` from `../blog/posts/`)
3. Upload `website/dist` as Pages artifact
4. Deploy via `deploy-pages`

Triggers on changes under `website/**`, `blog/**`, or the workflow file.

## Evidence pages (separate repos)

| Site | Repo | Workflow |
|------|------|----------|
| Dataset stats | [ner-dataset](https://github.com/marfago-labs/ner-dataset) | `pages.yml` |
| NER benchmark | [ner-detector](https://github.com/marfago-labs/ner-detector) | `benchmark-pages.yml` |
| Org hub | **marfago-labs.github.io** | `deploy.yml` |

This site links to those reports; it does not embed them.

## Create repo and push (PowerShell)

From the workspace root (after committing):

```powershell
cd <workspace-root>
gh repo create marfago-labs/marfago-labs.github.io --public --description "marfago-labs org hub (Astro + blog)"
git remote add origin https://github.com/marfago-labs/marfago-labs.github.io.git
git push -u origin master
```

If the repo already exists, skip `gh repo create` and only add remote + push.
