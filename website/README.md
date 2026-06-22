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

Analytics (production builds only): set `PUBLIC_GA_MEASUREMENT_ID` (see `.env.example`). CI passes this in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

Production-like check:

```bash
npm run build
npm run preview
```

## Quality checks

```bash
npm run check    # Astro / TypeScript
npm test         # Vitest with ≥95% coverage on src/lib + blog scripts
```

Coverage is scoped to testable units (`src/lib/`, `scripts/sync-blog.mjs`, `scripts/remark-inline-diagrams.mjs`), not Astro pages.

## Publish

CI lives in the **`marfago-labs.github.io`** repo (not in `ner-dataset` / `ner-detector`):

- Workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
- Setup checklist: [`SETUP-PAGES.md`](../SETUP-PAGES.md)

Push `blog/`, `website/`, and `.github/` together. Enable **Settings → Pages → GitHub Actions** on the repo before the first deploy.

## Evidence links

Repo CI publishes dashboards to GitHub Pages **when the repo is public**:

| Artifact | Pages URL | Repo |
|----------|-----------|------|
| Dataset stats | https://marfago-labs.github.io/ner-dataset/ | [ner-dataset](https://github.com/marfago-labs/ner-dataset) |
| NER benchmark | https://marfago-labs.github.io/ner-detector/ | [ner-detector](https://github.com/marfago-labs/ner-detector) |

The org hub links to repos and the pipeline overview; it does not embed those reports.
