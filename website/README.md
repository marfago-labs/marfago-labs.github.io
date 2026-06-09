# marfago-labs website

Org hub for [marfago-labs.github.io](https://marfago-labs.github.io): manifesto, engineering blog, project index, and links to live repo evidence (dataset stats, benchmark reports).

Built with [Astro](https://astro.build). Blog posts are **synced** from `../blog/posts/` at dev/build time — edit posts there, not in `src/content/blog/` (gitignored).

## Local preview

```bash
cd website
npm install
npm run dev
```

Open **http://localhost:4321**

Production-like check:

```bash
npm run build
npm run preview
```

## Publish

CI lives in the **`marfago-labs.github.io`** repo (not in `ner-dataset` / `ner-detector`):

- Workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
- Setup checklist: [`SETUP-PAGES.md`](../SETUP-PAGES.md)

Push `blog/`, `website/`, and `.github/` together. Enable **Settings → Pages → GitHub Actions** on the repo before the first deploy.

## Evidence links

Repo CI owns the full reports; this site only links:

| Artifact | URL |
|----------|-----|
| Dataset stats | https://marfago-labs.github.io/ner-dataset/ |
| NER benchmark | https://marfago-labs.github.io/ner-detector/ |
