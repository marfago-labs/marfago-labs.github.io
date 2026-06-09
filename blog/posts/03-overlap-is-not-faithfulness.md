---
title: "ModernBERT and the Overlap Trap"
slug: overlap-is-not-faithfulness
series: marfago-labs-origin
order: 3
date: 2026-06-08
description: Why semantic similarity metrics give you false confidence, and how I built a multi-metric faithfulness scorecard.
---

# ModernBERT and the Overlap Trap

When I first built `text-compressor`, I needed a way to evaluate the quality of the LLM summaries. The standard approach is to use a semantic similarity metric. I wired up ModernBERT, ran the evaluation, and the numbers looked fantastic. High F1 scores across the board.

Green cells. Ship it, right?

Wrong.

## The Danger of Semantic Similarity

If you look at how ModernBERT (or any BERTScore-style metric) actually works, you realize it is measuring *overlap*, not *entailment*. It encodes the source text and the summary separately, then compares the contextual token embeddings via cosine similarity.

Here is the problem: An LLM can generate a summary that uses all the right jargon, sounds incredibly similar to the source, and completely hallucinate the relationship between the concepts. It can confidently state that "Pinecone acquired Dremio" when the source merely mentioned both in the same paragraph. ModernBERT will look at the embeddings, see a high degree of semantic overlap, and give you a passing grade.

Overlap is not faithfulness. Similarity is not factuality. If I embedded these summaries into ArticleRecommender, I would be building a retrieval system based on plausible fiction.

## Building the Faithfulness Scorecard

I had to stop looking for a single magic number. I needed a scorecard.

I expanded the `text-compressor` evaluation suite to run a bundle of metrics on every summary:

1. **ModernBERT F1:** I kept it, but explicitly demoted it. It is useful for comparing the general "closeness" of two models, but it is *not* a measure of factuality.
2. **Numeric Match:** A brittle but brutally honest heuristic. If the source text mentions "95% coverage", does that exact number survive in the summary?
3. **NLI Faithfulness (Light):** I brought in a Natural Language Inference model (`mDeBERTa-v3`) to perform a heuristic entailment check. Does the source text actually *entail* the claims made in the summary sentences?
4. **Entity Coverage:** This was the critical one. If the source talks about "GraphRAG" and "Pinecone," did those named entities survive the compression?

If ArticleRecommender is going to investigate entities, the compressor *must* preserve them.

## The Regex Embarrassment

To calculate Entity Coverage, I needed a way to extract entities from both the source and the summary. For the MVP, I used a regex-based pattern matcher (`DEFAULT_ENTITY_NER_BACKEND = "pattern"`).

It was the wrong tool for the job.

When I ran it against machine learning abstracts, the pattern matcher proudly identified words like "neural," "learning," and "attention" as named entities. It was noisy, brittle, and completely useless for rigorous evaluation. I tried patching it with stop-word filters (`DEFAULT_ENTITY_STOP_NORMS`), but I was just putting band-aids on a flawed architecture.

I could not evaluate this AI system with regex alone.

I needed real Named Entity Recognition (NER). But which model? BERT? A zero-shot model like GLiNER? Or do I just ask an LLM?

I didn't want to guess. I wanted to measure.

**Previous:** [Compressing YouTube for the Vector DB](./02-compress-then-embed.md) · **Next:** [Benchmarking NER: Latency, Doc F1, and Cache Bugs](./04-picking-a-ner-backend.md)
