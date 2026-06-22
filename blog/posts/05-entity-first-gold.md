---
title: "Fixing LLM Offset Hallucinations"
slug: entity-first-gold
series: marfago-labs-origin
order: 5
date: 2026-06-08
lastUpdated: 2026-06-21
version: "1.4"
description: LLMs can't count. How I solved character offset hallucinations using entity-first generation in ner-gold-generator.
cover: /blog/covers/entity-first-gold.png
coverAlt: Named entities anchored to character spans on a teal text strip — entity first, offsets second.
---

# Fixing LLM Offset Hallucinations

To benchmark the NER backends in `ner-detector`, I needed data. Not just ten hand-curated abstracts, but hundreds of documents across different genres (news, blogs, transcripts, scientific papers).

The obvious approach is to take a corpus of text, feed it to an LLM, and ask it to extract the entities and their character offsets. I built this. I used multi-sample consensus, taking a majority vote to drop hallucinated spans.

It did not work.

## Context

**Gold data** is the answer key for a benchmark — documents where the correct entities (and often their exact positions in the text) are already known. NER models are graded against it.

**Character offsets** mark where an entity starts and ends in a string. If "Pinecone" begins at character 42 in a paragraph, the gold record stores `start: 42, end: 50`. Strict benchmarks need these positions to be exact.

LLMs are good at reading and writing text. They are bad at counting characters. Asking a model to return precise offsets is asking it to do arithmetic on a string it generated token-by-token — and it will guess confidently when it gets it wrong.

## The Hallucination of Math

When you ask an LLM to return the exact character start and end offsets of a word in a paragraph, it guesses. It returns JSON with offsets that are off by three characters, or points to a completely different instance of the word. If you use this as your gold truth to evaluate other models, you penalize accurate models for the LLM's inability to count.

I refused to write a script to "fuzzy match" and fix the LLM's bad math. Patching bad offsets would have made the benchmark look clean while the foundation stayed rotten.

That failure mode is well documented in LLM-as-annotator work: models produce plausible labels but unreliable span boundaries when asked to count characters in generated text. The durable pattern is to keep **structure in code** (entities, spans, validation) and let the model supply language — the same inversion used in constrained generation and tool-calling pipelines where the runtime owns invariants the model cannot reliably compute.

I had to stop asking the LLM to do things it is fundamentally bad at.

## Entity-First Generation

I built **`ner-gold-generator`** by inverting the pipeline. Instead of generating text and asking the LLM to find the entities, I generate the entities first, and ask the LLM to write the text.

Here is the mechanism:

1. **Plan (Deterministic):** Code selects the entities I want (e.g., "Pinecone", "GraphRAG") from seed values and label weights.
2. **Prompt (Probabilistic):** I pass that list to the LLM. The prompt instructs it to write a cohesive article (in a specific genre) that includes every entity *verbatim*, exactly once.
3. **Validate (Deterministic):** I take the generated text and use standard Python string matching to verify that every planned entity exists exactly once, and that the text meets the length constraints.
4. **Emit (Deterministic):** Because I know the text contains the exact strings, I calculate the character offsets in code — not from model JSON.

The LLM writes prose. The code handles the math.

## The Agno Orchestration

LLMs drift. They drop an entity, duplicate one, or ignore the length constraints.

To handle this, I orchestrated the generation using **Agno per-document sessions**. Instead of a single API call, I treat generation as an agentic loop. If the LLM fails the deterministic validation step, the agent replies in the same session: *"You failed. You missed the entity 'Pinecone' and you duplicated 'Dremio'. Rewrite it."*

I split retry budgets: `provider_max_attempts` for when OpenRouter returns HTTP 429, and `validation_max_attempts` for when the LLM disobeys the prompt.

If the LLM still fails after all retries, I do not manually fix the data. I drop the document, log the failure in `gold.log`, and move on. If I planned 100 documents and two fail validation, I ship 98 good ones — I do not patch the two bad rows by hand to hit 100. Quality over count.

I finally had a mechanism to generate span-valid gold data at scale. It was time to publish the evidence.

## Takeaways

- **LLMs are weak accountants** — Asking for character offsets invites confident wrong JSON; fuzzy-matching the math patches a broken foundation.
- **Entity-first generation** — Generate entities and labels first, ask the LLM to write prose that contains them; let code assign spans deterministically.
- **Validation, not hand-patching** — Agno retry loops on provider errors and validation failures; drop documents rather than manually fix gold.
- **Publish quality over count** — Drop failed generations; never hand-patch gold to hit a target count.

## The Evidence

- **Repo:** [marfago-labs/ner-gold-generator](https://github.com/marfago-labs/ner-gold-generator)
- **Output corpus:** [marfago-labs/ner-dataset](https://github.com/marfago-labs/ner-dataset)

**Previous:** [Benchmarking NER: Latency, Doc F1, and Cache Bugs](./04-picking-a-ner-backend.md) · **Next:** [Publishing the Evidence](./06-publish-the-evidence-loop.md)
