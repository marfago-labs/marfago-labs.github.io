---
title: "Compressing YouTube for the Vector DB"
slug: compress-then-embed
series: marfago-labs-origin
order: 2
date: 2026-06-08
description: The text-compressor experiment. Why you can't just embed raw transcripts, and the operational reality of API churn.
---

# Compressing YouTube for the Vector DB

When I designed the ingest pipeline for ArticleRecommender, arXiv abstracts were easy. They are short, dense, and well-structured. You fetch them, embed them in Postgres via `pgvector`, and you're done. No LLM required in the hot path.

YouTube is a different story. A raw transcript from a 45-minute tech talk is a sprawling, repetitive mess of filler words. If you chunk a raw transcript and embed it, you are paying twice—once in storage, and again in retrieval accuracy. Your vector space becomes polluted with chunks like *"so yeah, moving on to the next slide."*

I needed a different architecture. I needed **Compress-then-Embed**.

## The `text-compressor` Experiment

The hypothesis: use a cheap, fast instruct model to read the sprawling source text and generate a dense, 2-4 sentence prose summary. Then, embed *that* summary. If it works, you get a smaller, higher-signal vector space.

But in software architecture, you must protect your core domain from unproven hypotheses. If I wired this experimental compression logic directly into ArticleRecommender's ingest pipeline, I would be coupling my production system to a volatile, untested LLM workflow.

So I split it out. I created **`text-compressor`** as a standalone repository.

By isolating the experiment, I could iterate without dragging the main app along. I built a fixed corpus of 12 arXiv papers and 10 YouTube videos. I set up a pipeline to fetch the raw data, compress it via Agno and OpenRouter, and output the results to JSONL.

## The Friction of the Real World

The moment you move from a Python script to a pipeline, the real world hits you.

First, **API churn**. I relied on OpenRouter's `:free` models for cheap, bulk compression. But free endpoints retire silently. Your pipeline doesn't fail with a polite deprecation warning; it fails with a hard `No endpoints found`. I had to build in model fallbacks and CLI overrides just to keep the pipeline breathing.

Second, **The Asymmetry of Data**. Not everything needs compression. If an article is only 800 characters long, asking an LLM to summarize it is a waste of time and money, and often degrades the text. I introduced a `min_compress_chars` threshold (set to 1000 in `run.py`). But if you skip compression for short texts, how do you handle that in your evaluation metrics without skewing the averages? I had to explicitly log skipped rows so they wouldn't artificially inflate my success rate.

I built the pipeline. I proved I could compress the text. But as I looked at the generated summaries, a cold realization set in. They *read* beautifully. They sounded authoritative.

But were they true? Did they actually retain the technical facts from the original transcript?

I had no defensible answer. And in engineering, if you cannot tell whether a result is faithful, you do not have an architecture yet. You have a demo.

**Previous:** [The Minimum Credible Loop](./01-i-didnt-want-another-bookmark-app.md) · **Next:** [ModernBERT and the Overlap Trap](./03-overlap-is-not-faithfulness.md)
