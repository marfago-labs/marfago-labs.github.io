---
title: "Compressing YouTube for the Vector DB"
slug: compress-then-embed
series: marfago-labs-origin
order: 2
date: 2026-06-08
lastUpdated: 2026-06-21
version: "1.7"
description: The text-compressor experiment — embedder context limits, compress-then-embed, and the operational reality of API churn.
cover: /blog/covers/compress-then-embed.png
coverAlt: A long transcript ribbon narrowing into a dense teal block before a vector grid — compress, then embed.
---

# Compressing YouTube for the Vector DB

When I designed the ingest pipeline for ArticleRecommender, arXiv abstracts were easy. They are short, dense, and well-structured. You fetch them, run them through an embedding model, store the resulting vector in Postgres via `pgvector`, and you are done. No LLM required in the hot path.

At query time the flow reverses: embed the search text, find nearest neighbors by cosine distance. Phase 1 used **one vector per document** — simple rows, simple retrieval. That design only works when the source text fits entirely inside the embedder's input window.

## Context

**Embedding models** turn text into a fixed-size numeric vector so you can search by similarity ("find documents about the same topic"). They do not read unlimited text — they have a **token limit** (often 512 on smaller models, up to ~8k on larger API models). A token is roughly a word or part of a word; English prose runs about four characters per token.

**Vector databases** (here, Postgres with `pgvector`) store those vectors and find the closest matches at query time. **Compress-then-embed** means: summarize a long document first, then embed the summary — one vector for the whole gist, instead of chunking the raw text into many partial vectors.

## The Embedder Window

An embedding model reads up to **N tokens** and returns **one** fixed-size vector. A 45-minute tech talk can be tens of thousands of tokens. You cannot embed it whole and get a single faithful vector.

The naive fix is **chunking**: slice the transcript, embed each slice, store many vectors per video. That solves the window problem and creates two new ones — you inflate the index (storage and search cost), and you dilute semantics. Retrieval returns mid-talk fragments and filler, not "what was this video about?"

YouTube is a different story from arXiv for that reason, not only because transcripts are messy. A raw transcript is a sprawling, repetitive stream of speech. Chunk it verbatim and you multiply low-signal vectors across the store.

Take the 3Blue1Brown neural-networks intro in my corpus (`aircAruvnKk`). The cached transcript alone is **12,000 characters** — on the order of **thousands of tokens** — and it opens like this:

> This is a 3. It's sloppily written and rendered at an extremely low resolution of 28x28 pixels, but your brain has no trouble recognizing it as a 3. And I want you to take a moment to appreciate how crazy it is that brains can do this so effortlessly.

Fine prose for a human. A poor fit for **one** embedding of the full talk. Even the first **3,000 characters** I pass into the compressor (`transcript_embed_max` in `fetch.py`) is already hundreds of tokens — before summarization, before the embedder ever sees the text.

I needed a different architecture. Summarize first, embed second. **Compress-then-Embed**.

Production RAG systems face the same fork: **chunk raw text** (many vectors, fragment-level retrieval) or **summarize then embed** (one vector, higher risk if the summary drops facts). Embedder context limits are why both paths exist; the tradeoff is index shape versus faithfulness to the source. I chose one vector per document for ArticleRecommender Phase 1 simplicity, which forced the compression question rather than hiding it behind chunking.

## The `text-compressor` Experiment

The hypothesis: use a cheap instruct model to read the sprawling source text and generate a dense, 2–4 sentence prose summary (`short_summary` in `prompts.yaml`). Then embed *that* summary — one vector, entire gist inside the embedder's context. If it works, you get a smaller index and higher-signal retrieval than chunking raw speech.

But in software architecture, you must protect your core domain from unproven hypotheses. If I wired this experimental compression logic directly into ArticleRecommender's ingest pipeline, I would be coupling my production system to a volatile, untested LLM workflow.

So I split it out. I created **`text-compressor`** as a standalone repository.

By isolating the experiment, I could iterate without dragging the main app along. I built a fixed corpus in `corpus.json`: **12 arXiv papers** and **10 YouTube videos** — tutorials, lectures, podcasts, music, short clips — so compression would see more than one genre. I set up a pipeline to fetch raw text, compress it via Agno and OpenRouter, and write per-item results to `items.jsonl`.

## What the Inputs Actually Look Like

Not every corpus item presents the same shape to the compressor.

| Source | Example | Raw size | Fed to LLM |
|--------|---------|----------|------------|
| arXiv abstract | Attention (`1706.03762`) | ~1,180 chars | full abstract |
| Long YouTube transcript | 3Blue1Brown (`aircAruvnKk`) | 12,000 chars cached | **first 3,000 chars** of transcript (`transcript_embed_max` in `fetch.py`) |
| Short YouTube clip | *Me at the zoo* (`jNQXAC9IVRw`) | 217 chars | skipped when `min_compress_chars=1000` |
| Missing captions | HF Transformers intro (`WUvTyaaWZZc`) | 0 chars | nothing to compress |

That table mattered early. YouTube is the product pain; arXiv is the cheap control case. Several videos in the corpus have **no transcript at all** in `data/raw/youtube/` — a reminder that ingest pipelines fail quietly on missing captions, not just on bad summaries.

Why keep short clips and empty rows in the fixture set at all? Real ingest is not only 45-minute talks. ArticleRecommender will see brief videos, dense abstracts, and missing captions too. Those rows are here to test **production-shaped behavior**: does the pipeline skip when it should, passthrough-embed without an LLM call, and log the skip? That is separate from the faithfulness scorecard on compressed text — see below.

## A Real Compression (Before I Had Faithfulness Metrics)

My first scored compare runs used eight arXiv papers (`run_compare.py --limit 8`) before I ran the full 22-item corpus with YouTube. The mechanics are the same regardless of source kind: `source_text` in, 2–4 sentences out.

Here is Attention (`1706.03762`) compressed with `openai/gpt-oss-120b:free`:

**In** (1,180 chars, 230 tokens — excerpt from `source_text`):

> We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. … Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task … 41.8 after training for 3.5 days on eight GPUs …

**Out** (476 chars, 85 tokens — **compression ratio 0.40**):

> The paper introduces the Transformer, a neural architecture that relies exclusively on attention mechanisms and eliminates recurrence and convolution. It achieves state-of-the-art machine‑translation results, reaching 28.4 BLEU on English‑German and 41.8 BLEU on English‑French while training much faster and with greater parallelism. The authors also demonstrate the model's versatility by applying it successfully to English constituency parsing across different data sizes.

Across that eight-paper run, average ratio was **0.46** — less than half the character bulk, roughly **8 seconds** of OpenRouter latency per document. The sizing win was concrete: **85 tokens** out, well inside a 512-token embedder window (let alone an 8k one). One row in `pgvector`, one vector that represents the whole document's gist.

Semantic search alone would not carry product names reliably. Phase 1 already had `tsvector` for keyword-style matches. I also planned **entity extraction** on ingest — salient names like Pinecone or GraphRAG indexed for lookup and investigation even when the summary vector only captures topical similarity. Compression and entities are complementary: the summary fits the embedder; the entities preserve handles compression might drop. Proving both paths would take the rest of this series.

ArticleRecommender does not yet pin a production embedder model in this series; summaries are sized to fit **≤512-token** bi-encoders (and comfortably inside 8k API models). When ingest wires up, the contract is: **one summary vector per document, entire text inside the embedder window.**

**YouTube faithfulness is still an open gate.** The scored compare runs in this chapter used eight arXiv abstracts; the 22-item corpus includes ten YouTube transcripts, but I have not published a faithfulness scorecard row for a long talk yet. ArXiv proved the mechanics; YouTube is the product-shaped stress test ([Part 3](./03-overlap-is-not-faithfulness.md)).

## The Friction of the Real World

The moment you move from a Python script to a pipeline, the real world hits you.

**API churn.** I relied on OpenRouter's `:free` models for cheap bulk compression. Free endpoints retire without a deprecation calendar. When a model id goes stale, the failure mode is blunt: `No endpoints found for …:free` (documented in the repo README). You swap the model id or pass `--model` and move on.

I also learned that "free" is not interchangeable. In the same compare run, `openrouter/free` returned **empty summaries** for Attention and ResNet — `compress_error: "model returned empty summary"` — while `openai/gpt-oss-120b:free` produced usable text on the same inputs. Two `:free` routes; one usable batch, one with two silent holes. I kept `gpt-oss-120b:free` as the default in `corpus.json` and treated model choice as operational config, not a one-time setup step.

**The asymmetry of data.** Not everything should hit the LLM. `run.py` defaults to `--min-compress-chars 1000`: sources shorter than that pass through uncompressed (`compression_skipped: true` in `items.jsonl`). *Me at the zoo* at 217 characters should not be "summarized." A 1,578-character music video transcript might barely qualify; a 12,000-character tutorial definitely does.

That split creates two different evaluation questions — do not mix them.

**Production-shaped faithfulness** (threshold on): score faithfulness only on rows that were actually compressed. Log skipped rows separately (`eval_skipped` in `metrics.json`) and report both counts — e.g. “12 scored, 10 skipped.” Do not fold skips into the average as free passes (that inflates) or as failures (that deflates). Passthrough is faithful by definition, but it was never summarized, so it does not belong in a “compression faithfulness” average unless you say so explicitly.

**Compare runs** (threshold off, `min_compress_chars=0`): a different experiment — which compression *model* is better on the **same** inputs. Every row hits the LLM so model A and model B share one denominator. That is fair for model comparison; it is not how production ingest should behave, and it is not a substitute for production-shaped faithfulness reporting.

I built the pipeline and proved I could shrink text by half on demand. Then I read the generated summaries and noticed something uncomfortable: they read beautifully. They sounded authoritative. I had no way to tell whether they actually retained the technical facts from the original — or even from the first 3,000 characters I had fed the model.

Without a way to measure faithfulness, I had a demo, not an architecture. The scorecard comes next.

## Takeaways

- **Embedder window, not index size** — One vector per document only works when the source fits the model's token cap (often 512–8k). Long transcripts force chunking (many noisy vectors) or compression (one gist vector).
- **Compress-then-embed** — Summarize first, embed second: ~85-token summaries fit entirely in the embedder context and keep one row per document in `pgvector`. That is a sizing win, not a faithfulness guarantee.
- **Hybrid retrieval** — Semantic vectors handle topical similarity; `tsvector` and extracted entities handle product names and exact handles a summary may drop. Plan for both, not either/or.
- **Pipeline ops** — Free OpenRouter model ids retire; empty summaries happen; skip thresholds (`min_compress_chars`) must be logged in evaluation so production-shaped faithfulness averages do not silently drop or inflate rows.
- **Demo vs architecture** — If you cannot measure whether compression preserved the facts, you have a demo. The scorecard comes next.

## The Evidence

- **Compare run:** `text-compressor/results/compare-20260524T225903Z/` (`openai/gpt-oss-120b:free`, eight arXiv papers)
- **Repo:** [marfago-labs/text-compressor](https://github.com/marfago-labs/text-compressor)

**Previous:** [The Minimum Credible Loop](./01-i-didnt-want-another-bookmark-app.md) · **Next:** [ModernBERT and the Overlap Trap](./03-overlap-is-not-faithfulness.md)
