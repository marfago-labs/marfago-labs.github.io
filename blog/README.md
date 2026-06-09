# marfago-labs engineering blog

Public-quality narrative for engineers. Stories about problems, tradeoffs, measured outcomes, and the discipline required to build with AI without surrendering engineering judgment.

**Series:** [Building an Evaluation Lab by Accident](./posts/00-series-index.md) — from ArticleRecommender to open NER benchmarks, and the AI-assisted engineering operating model behind the work.

Writing standards: [`.cursor/rules/docs-blog-writing.mdc`](../.cursor/rules/docs-blog-writing.mdc)

## Posts (read in order)

| # | Title | File |
| --- | --- | --- |
| — | [Building an Evaluation Lab by Accident](./posts/00-series-index.md) | Series index |
| 1 | [The Minimum Credible Loop](./posts/01-i-didnt-want-another-bookmark-app.md) | ArticleRecommender north star |
| 2 | [Compressing YouTube for the Vector DB](./posts/02-compress-then-embed.md) | text-compressor split |
| 3 | [ModernBERT and the Overlap Trap](./posts/03-overlap-is-not-faithfulness.md) | compression scorecard |
| 4 | [Benchmarking NER: Latency, Doc F1, and Cache Bugs](./posts/04-picking-a-ner-backend.md) | ner-detector benchmarks |
| 5 | [Fixing LLM Offset Hallucinations](./posts/05-entity-first-gold.md) | ner-gold-generator |
| 6 | [Publishing the Evidence](./posts/06-publish-the-evidence-loop.md) | ner-dataset + evidence loop |
| 7 | [Agents Draft. I Sign.](./posts/07-agents-draft-i-sign.md) | Agent walk, control loop, and sign |

## Conventions

- **Voice:** first person (*I built*, *I decided*) — solo lab; the author owns the calls and the numbers. Use *you* for general engineering patterns.
- **Posts:** `blog/posts/NN-short-slug.md` — one file per **significant story**, not per calendar day. Add or update after meaningful work (see the rule above).
- **Front matter:** `title`, `slug`, `series`, `order`, `date`, `description` on each post under `blog/posts/`.
- **Archive:** `blog/_archive/` — old changelog notes superseded by narrative posts.

## Evidence links (live)

- [Dataset stats](https://marfago-labs.github.io/ner-dataset/)
- [NER benchmark report](https://marfago-labs.github.io/ner-detector/) (when deployed)
- [ner-gold-generator](https://github.com/marfago-labs/ner-gold-generator) · [ner-dataset](https://github.com/marfago-labs/ner-dataset)
- [marfago-labs org hub](https://marfago-labs.github.io)

**Site:** `website/` (Astro) — `npm run dev` in `website/` previews locally; deploys to [marfago-labs.github.io](https://marfago-labs.github.io) via GitHub Actions. These markdown files remain the source of truth.
