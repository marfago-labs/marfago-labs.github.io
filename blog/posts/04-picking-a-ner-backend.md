---
title: "Benchmarking NER: Latency, Doc F1, and Cache Bugs"
slug: picking-a-ner-backend
series: marfago-labs-origin
order: 4
date: 2026-06-08
description: Comparing LLMs, BERT, and GLiNER in ner-detector. Why I chose Doc F1, and the latency bug that almost ruined the benchmark.
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

This is why you must measure wall-clock time. A model that claims to be "fast" in a paper is useless if your implementation instantiates it poorly. I fixed the caching policy, and the BERT latency dropped to ~80ms.

## The Results

I ran the backends against my synthetic news corpus. The results were stark:

- **LLM:** ~84% Doc F1, but it took **~7 seconds per document**.
- **BERT:** ~73% Doc F1, at **~80 milliseconds per document**.

There is no universal winner. If you are doing offline batch enrichment, you pay the 7 seconds for the LLM's accuracy. If you are doing interactive, real-time search, you use BERT. If you need custom scientific labels without retraining, you use GLiNER.

That gave me routing logic. But the benchmark revealed a deeper problem.

To run a benchmark, you need "Gold" data—a dataset of documents with perfectly annotated entities to test the models against. And the way I was generating that Gold data was fundamentally broken.

**Previous:** [ModernBERT and the Overlap Trap](./03-overlap-is-not-faithfulness.md) · **Next:** [Fixing LLM Offset Hallucinations](./05-entity-first-gold.md)
