# marfago-labs engineering blog

Stories about problems, tradeoffs, measured outcomes, and the discipline required to build with AI without surrendering engineering judgment.

**Series:** [Building an Evaluation Lab by Accident](./posts/00-series-index.md) — I wanted a tech briefing app. I ended up building open-source tools to measure whether the AI parts actually work. Four acts: the product, the metric traps, the infrastructure, and the operating model.

Writing standards: [`.cursor/rules/docs-blog-writing.mdc`](../.cursor/rules/docs-blog-writing.mdc) — includes **External style references (Chip Huyen — adopt, don’t copy)** for production-minded tone without copying her format.

## Posts (read in order)

| # | Title | Act | File |
| --- | --- | --- | --- |
| — | [Building an Evaluation Lab by Accident](./posts/00-series-index.md) | — | Series prologue |
| 1 | [The Minimum Credible Loop](./posts/01-i-didnt-want-another-bookmark-app.md) | I | ArticleRecommender north star |
| 2 | [Compressing YouTube for the Vector DB](./posts/02-compress-then-embed.md) | I | text-compressor split |
| 3 | [ModernBERT and the Overlap Trap](./posts/03-overlap-is-not-faithfulness.md) | II | compression scorecard |
| 4 | [Benchmarking NER: Latency, Doc F1, and Cache Bugs](./posts/04-picking-a-ner-backend.md) | II | ner-detector benchmarks |
| 5 | [Fixing LLM Offset Hallucinations](./posts/05-entity-first-gold.md) | III | ner-gold-generator |
| 6 | [Publishing the Evidence](./posts/06-publish-the-evidence-loop.md) | III | ner-dataset + evidence loop |
| 7 | [Agents Draft. I Sign.](./posts/07-agents-draft-i-sign.md) | IV | Agent walk, control loop, and sign |

**Reserved:** `08+` filenames and `order` values are for future in-series chapters (e.g. ArticleRecommender return). Standalone essays do not use the `NN-` prefix.

### Standalone

| Title | File |
| --- | --- |
| [Agent Quality Engineering: Grade the Protocol, Not the Chat](./posts/aq-better-ai-engineer.md) | AQ — server-owned progress, scenarios, parity (not prompt craft alone) |
| [Specs Drive. Tests Validate.](./posts/specs-drive-tests-validate.md) | SDD + application QA — specs set intent, tests enforce it, lifecycle matrix for multi-role E2E |
| [Did the Summary Keep the Important Bits?](./posts/faithfulness-metrics-map.md) | ELI5 map — four compression checks (similar, names, numbers, truth) on the same rows |

## Conventions

- **Voice:** first person (*I built*, *I decided*) — solo lab; the author owns the calls and the numbers. Use *you* for general engineering patterns.
- **Drafting:** posts and diagrams are drafted with [Cursor](https://cursor.com), then edited and fact-checked against cited repos and benchmarks. Agents propose; the author signs. Disclose once on the site (About + blog index), not on every post.
- **Series posts:** `blog/posts/NN-short-slug.md` with `series: marfago-labs-origin` and `order: N` matching the prefix.
- **Standalone posts:** `blog/posts/short-slug.md` (no numeric prefix), omit `series`, use `order: 9001+`.
- **Front matter:** `title`, `slug`, `series`, `order`, `date`, `description` on each post under `blog/posts/`.

## Evidence links (live)

- [Dataset stats](https://marfago-labs.github.io/ner-dataset/) — live dashboard from `ner-dataset` CI
- [NER benchmark report](https://marfago-labs.github.io/ner-detector/) — live report from `ner-detector` CI
- [ner-gold-generator](https://github.com/marfago-labs/ner-gold-generator) · [ner-dataset](https://github.com/marfago-labs/ner-dataset) · [ner-detector](https://github.com/marfago-labs/ner-detector) — all public
- [marfago-labs org hub](https://marfago-labs.github.io)

**Work in progress (no public evidence yet):** ArticleRecommender, text-compressor — named in the series; repos not open for review.

**Site:** `website/` (Astro) — `npm run dev` in `website/` previews locally; deploys to [marfago-labs.github.io](https://marfago-labs.github.io) via GitHub Actions. These markdown files remain the source of truth.
