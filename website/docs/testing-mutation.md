# Mutation testing (website)

Scoped [Stryker](https://stryker-mutator.io/) on analytics + page stamp helpers with **`thresholds.break: 100`**.

## Scope

Configured in `website/stryker.config.json`:

| Mutate | Test command |
|--------|----------------|
| `src/lib/googleAnalytics.ts`, `src/lib/pageMeta.ts`, `src/lib/googleSiteVerification.ts` | `npx vitest run src/lib/googleAnalytics.test.ts src/lib/pageMeta.test.ts src/lib/googleSiteVerification.test.ts` |

Vitest coverage still includes all of `src/lib/**/*.ts` plus blog sync scripts (`sync-blog.mjs`, `remark-inline-diagrams.mjs`, `content-freshness.mjs`, `backfill-logic.mjs`). **`blog.ts` / `readingTime.ts` and the scripts are not in the mutation gate yet** — expand only when killers keep a clean 100% run.

## Local

```bash
cd website
npm ci
npm run test:mutation
```

Report: `reports/mutation/mutation.html` (gitignored).

## Score gate

- Mutation score **must be 100%** (`thresholds.break: 100`).
- Clean run (2026-09-06): **43 scored, 43 killed, 0 survived** (`googleAnalytics.ts` + `pageMeta.ts` + `googleSiteVerification.ts`).

## CI

`.github/workflows/ci.yml` → website job runs `npm run test:mutation` after `npm test`.
