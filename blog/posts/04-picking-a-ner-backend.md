---
title: "Benchmarking NER: Latency, Doc F1, and Cache Bugs"
slug: picking-a-ner-backend
series: marfago-labs-origin
order: 4
date: 2026-06-08
lastUpdated: 2026-06-10
version: "1.1"
description: Comparing LLMs, BERT, and GLiNER in ner-detector. Why I chose Doc F1, and the latency bug that almost ruined the benchmark.
cover: /blog/covers/picking-a-ner-backend.png
coverAlt: Three teal backend stacks on a benchmark grid with latency and F1 markers — picking a NER backend with evidence.
---

# Benchmarking NER: Latency, Doc F1, and Cache Bugs

`text-compressor` needed NER to evaluate summaries. ArticleRecommender needed it to extract technologies from articles so it could autonomously investigate them.

I could have just hardcoded an API call to OpenRouter and asked an LLM to extract the entities. But I didn't want to pick a model based on vibes; I wanted a harness to measure the trade-offs between quality and latency.

That is why I built **`ner-detector`**.

## The Pluggable Harness

`ner-detector` is a pluggable NER runtime and benchmark runner. I implemented four distinct backends:

1. **Pattern:** Regex and heuristics. Execution time: milliseconds. Quality: terrible on complex text.
2. **Transformers:** Classic BERT-family NER.
3. **GLiNER / NuNER:** Zero-shot models. You provide the label schema at runtime.
4. **LLM:** OpenRouter extraction.

I built a CLI, a Python API, and a YAML-driven configuration system. I mocked the heavy ML paths in CI so I could maintain my ≥95% test coverage gate without downloading 500MB of weights on every pull request.

Then I built the benchmark runner to pit them against each other.

## The Metric That Matters: Doc F1

If you read academic NLP papers, you will see a lot of focus on *Strict Span F1*. This metric requires the model to identify the exact character start and end offsets of an entity.

But my use case is different. I am doing *salient-entity* extraction. I only care about the important entities (e.g., "Pinecone"), not every single noun. If a model finds "Pinecone" but misses the exact character offset by one space, Strict Span F1 punishes it as a false positive.

For this system, that is the wrong headline metric. I still validate spans where the dataset requires them, but the product question is simpler: did the system find the entity that should drive downstream investigation?

So I wrote [ADR 001](https://github.com/marfago-labs/ner-detector/blob/master/docs/adr/001-doc-f1-primary-metric.md) and made **Document-Level F1 (Doc F1)** my primary metric. Doc F1 simply asks: *Did the model extract the normalized text of the entity somewhere in this document?*

## The Latency Bug

When I ran the first full benchmark, I noticed the pipeline was crawling. I looked at the logs, expecting to see network latency from the LLM.

Instead, I saw the Hugging Face `transformers` backend taking seconds per document. It wasn't downloading weights from the internet; it was re-loading the model from disk into memory for *every single document*. The code was optimizing for strict process isolation over iteration speed.

This is why you must measure wall-clock time. A model that claims to be "fast" in a paper is useless if your implementation reloads weights on every document. I fixed the transformers backend cache policy; BERT inference settled at **~80 ms/example** on the published run (down from multi-second per-doc behavior before the fix).

## The Results

I ran the backends against shared gold in `ner-dataset` — primarily `synthetic_news_100` (standard entity types) and `arxiv_gold` (ten manual scientific abstracts with domain labels). Doc F1 is the headline metric ([ADR 001](https://github.com/marfago-labs/ner-detector/blob/master/docs/adr/001-doc-f1-primary-metric.md)). Numbers below are from the [published benchmark report](https://marfago-labs.github.io/ner-detector/) (`run-20260606T131135Z`):

| Backend | Dataset | Doc F1 | Latency | Route when… |
|---------|---------|--------|---------|-------------|
| LLM (`gpt-oss-120b:free`) | `synthetic_news_100` | **83.9%** | **~6.9 s** | Offline enrichment; quality over speed |
| NuNER Zero | `synthetic_news_100` | **78.0%** | **~1.9 s** | Best non-LLM quality on news without 7s calls |
| BERT (`dslim/bert-base-NER`) | `synthetic_news_100` | **72.5%** | **~80 ms** | Interactive ingest; fixed PER/ORG/LOC schema |
| GLiNER medium | `arxiv_gold` | **36.2%** | **~364 ms** | Custom scientific labels without retraining |
| LLM (`gpt-oss-120b:free`) | `arxiv_gold` | **47.2%** | **~9.1 s** | High cost, modest gain on sparse scientific gold |

There is no universal winner. BERT is not benchmarked on `arxiv_gold` — its CoNLL labels do not match scientific gold types. GLiNER/NuNER matter when the label schema is domain-specific. The LLM leads on synthetic news but does not justify a blanket default on scientific abstracts.

That gave me routing logic. But the benchmark revealed a deeper problem.

To run a benchmark, you need "Gold" data—a dataset of documents with perfectly annotated entities to test the models against. And the way I was generating that Gold data was fundamentally broken.

## Takeaways

- **Measure wall-clock, not papers** — BERT looked slow until I fixed per-document model reload; implementation dominates claimed latency.
- **Doc F1 over Strict Span F1** — Salient-entity extraction cares whether *Pinecone* appears in the document, not whether the span is off by one character.
- **No universal winner** — On `synthetic_news_100`, LLM **83.9%** at ~**6.9 s**/doc vs BERT **72.5%** at ~**80 ms**; on `arxiv_gold`, LLM **47.2%** — route by latency budget and dataset genre, not brand.
- **Pluggable harness** — Pattern, transformers, GLiNER, and LLM backends behind one CLI and YAML config so comparisons stay fair.
- **Benchmarks need gold** — A broken gold generator poisons every backend score; fixing offsets became the next chapter.

## The Evidence

- **Benchmark report:** [marfago-labs.github.io/ner-detector](https://marfago-labs.github.io/ner-detector/) (`run-20260606T131135Z`)
- **ADR 001:** [Doc F1 as primary metric](https://github.com/marfago-labs/ner-detector/blob/master/docs/adr/001-doc-f1-primary-metric.md)
- **Repo:** [marfago-labs/ner-detector](https://github.com/marfago-labs/ner-detector)

**Previous:** [ModernBERT and the Overlap Trap](./03-overlap-is-not-faithfulness.md) · **Next:** [Fixing LLM Offset Hallucinations](./05-entity-first-gold.md)
