---
title: "Publishing the Evidence"
slug: publish-the-evidence-loop
series: marfago-labs-origin
order: 6
date: 2026-06-08
lastUpdated: 2026-06-13
version: "1.2"
description: Separating the generator from ner-dataset. CI validation, live stats, and closing the loop.
cover: /blog/covers/publish-the-evidence-loop.png
coverAlt: A closed teal loop from generator to dataset to CI checks and back — publishing the evidence.
---

# Publishing the Evidence

You can claim your NER pipeline is highly accurate. You can show a demo of it extracting entities from a YouTube video. But if you cannot provide the dataset, the evaluation harness, and the exact metrics used to prove that claim, you are doing marketing, not engineering.

One of the core tenets of marfago-labs is: **No metric, no merit.** Private benchmarks are theatre. I had to make the evidence public.

## The Artifact: `ner-dataset`

I explicitly separated the generation code (`ner-gold-generator`) from the output data. I created **`ner-dataset`** as a standalone, versioned repository.

Generation is a messy process involving API keys, rate limits, and LLM retries. The dataset repository, by contrast, is intentionally boring. It contains the final JSONL files: ten manual arXiv rows, and five synthetic datasets of 100 rows each (news, blogs, transcripts, scientific abstracts, and mixed).

I built a CI pipeline that runs on every pull request to validate the integrity of the spans. If a character offset is wrong, the build fails. A script regenerates a live statistics dashboard at [marfago-labs.github.io/ner-dataset](https://marfago-labs.github.io/ner-dataset/) that tracks lexical diversity and entity usage.

It is not just a file dump; it is a living, audited artifact.

## Closing the Loop

With the dataset published, the evaluation loop was complete:

1. **Generate:** `ner-gold-generator` creates span-valid JSONL.
2. **Publish:** `ner-dataset` versions and validates the data.
3. **Benchmark:** `ner-detector` consumes that exact public dataset to run its backends.
4. **Report:** CI generates an HTML report and publishes it to GitHub Pages.

I made the system *agent-legible*. I wrote `for-agents.md` files and offline smoke scripts. This is not just documentation — it is an interface. If another engineer (or their coding agent) disagrees with my benchmark, the mechanism exists for them to fork the repo, swap the model, and prove me wrong.

Make disagreement cheap.

## The Reality of the Numbers

When I ran the full loop, the numbers told the truth I needed to hear.

On `synthetic_news_100`, the LLM (`openai/gpt-oss-120b:free`) achieved **83.9%** Doc F1 at **~6.9 s**/document; BERT reached **72.5%** at **~80 ms** ([benchmark report](https://marfago-labs.github.io/ner-detector/), `synthetic_news_100` table). On **`arxiv_gold`** — ten manual scientific abstracts with domain entity types — the same LLM dropped to **47.2%** Doc F1 at **~9.1 s**/document. Genre and label schema matter as much as model brand.

There is no magic model. There is only routing based on measured trade-offs.

## Back to the Beginning

I started this journey because I wanted ArticleRecommender to synthesize my reading list. I ended up building an open-source AI evaluation lab.

ArticleRecommender is still the north star. Phase 1 works. But now, as I move toward Phase 2 — autonomous search, enrichment pipelines, compress-then-embed ingestion — I am not guessing. I know which NER backend to route to based on latency budgets. I know which metrics to trust when evaluating a summary.

The product is still ahead. The measurement infrastructure is no longer the blocker.

## Takeaways

- **Separate generator from dataset** — `ner-gold-generator` produces; `ner-dataset` publishes versioned, CI-validated artifacts the benchmarks consume.
- **Public evidence loop** — Live stats, GitHub Pages reports, and failing CI on bad gold keep the lab honest after ship.
- **Routing from numbers** — LLM **83.9%** on `synthetic_news_100` vs **47.2%** on `arxiv_gold` (same report); pick backends from measured trade-offs, not defaults.
- **Product returns** — ArticleRecommender Phase 2 can proceed with known NER routes and compression metrics instead of guesses.

**Previous:** [Fixing LLM Offset Hallucinations](./05-entity-first-gold.md) · **Next:** [Agents Draft. I Sign.](./07-agents-draft-i-sign.md)

## The Evidence

- **Dataset Stats:** [marfago-labs.github.io/ner-dataset](https://marfago-labs.github.io/ner-dataset/)
- **Benchmark Report:** [marfago-labs.github.io/ner-detector](https://marfago-labs.github.io/ner-detector/)
- **The Code:** [ner-gold-generator](https://github.com/marfago-labs/ner-gold-generator) · [ner-dataset](https://github.com/marfago-labs/ner-dataset) · [ner-detector](https://github.com/marfago-labs/ner-detector)
