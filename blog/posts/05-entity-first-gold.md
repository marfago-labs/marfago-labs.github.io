---
title: "Fixing LLM Offset Hallucinations"
slug: entity-first-gold
series: marfago-labs-origin
order: 5
date: 2026-06-08
description: LLMs can't count. How I solved character offset hallucinations using entity-first generation in ner-gold-generator.
---

# Fixing LLM Offset Hallucinations

To benchmark the NER backends in `ner-detector`, I needed data. Not just ten hand-curated abstracts, but hundreds of documents across different genres (news, blogs, transcripts, scientific papers).

The obvious, naive approach is to take a corpus of text, feed it to an LLM, and ask it to extract the entities and their character offsets. I built this. I used multi-sample consensus, taking a majority vote to drop hallucinated spans.

It was a disaster.

## The Hallucination of Math

LLMs are strong writers and weak accountants. They are probabilistic text generators, not deterministic calculators.

When you ask an LLM to return the exact character start and end offsets of a word in a paragraph, it guesses. It confidently returns JSON with offsets that are off by three characters, or points to a completely different instance of the word. If you use this as your "Gold" truth data to evaluate other models, you are penalizing accurate models for the LLM's inability to count.

I refused to write a script to "fuzzy match" and fix the LLM's bad math. If the foundation is broken, you don't patch the cracks; you pour new concrete.

I had to stop asking the LLM to do things it is fundamentally bad at.

## Entity-First Generation

I built **`ner-gold-generator`** by inverting the pipeline. Instead of generating text and asking the LLM to find the entities, I generate the entities first, and ask the LLM to write the text.

Here is the mechanism:

1. **Plan (Deterministic):** Code selects the entities I want (e.g., "Pinecone", "GraphRAG") from seed values and label weights.
2. **Prompt (Probabilistic):** I pass that list to the LLM. The prompt instructs it to write a cohesive article (in a specific genre) that includes every entity *verbatim*, exactly once.
3. **Validate (Deterministic):** I take the generated text and use standard Python string matching to verify that every planned entity exists exactly once, and that the text meets the length constraints.
4. **Emit (Deterministic):** Because I know the text contains the exact strings, I calculate the character offsets in code—not from model JSON.

The LLM writes prose. The code handles the math.

## The Agno Orchestration

Of course, LLMs drift. They will drop an entity, duplicate one, or ignore the length constraints.

To handle this, I orchestrated the generation using **Agno per-document sessions**. Instead of a single API call, I treat generation as an agentic loop. If the LLM fails the deterministic validation step, the agent replies in the same session: *"You failed. You missed the entity 'Pinecone' and you duplicated 'Dremio'. Rewrite it."*

I split retry budgets: `provider_max_attempts` for when OpenRouter returns HTTP 429, and `validation_max_attempts` for when the LLM disobeys the prompt.

If the LLM still fails after all retries, I do not manually fix the data. I drop the document, log the failure in `gold.log`, and move on. I would rather publish 98 validated, span-correct documents than 100 documents where two were patched by hand.

I finally had a mechanism to generate span-valid gold data at scale. It was time to publish the evidence.

**Previous:** [Benchmarking NER: Latency, Doc F1, and Cache Bugs](./04-picking-a-ner-backend.md) · **Next:** [Publishing the Evidence](./06-publish-the-evidence-loop.md)
