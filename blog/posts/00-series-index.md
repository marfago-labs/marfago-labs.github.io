---
title: "Building an Evaluation Lab by Accident"
slug: series-index
series: marfago-labs-origin
order: 0
date: 2026-06-08
lastUpdated: 2026-06-22
version: "1.5"
description: How a personal tech news recommender forced me to build an open-source evaluation lab, and what it taught me about building with AI under engineering discipline.
cover: /blog/covers/series-index.png
coverAlt: A branching teal path through layered lab instruments — an evaluation stack built one experiment at a time.
---

# Building an Evaluation Lab by Accident

I wanted a better way to read the internet — not another bookmark app.

As a Principal Engineer, the volume of technical signal (arXiv papers, YouTube tech talks, GitHub releases) exceeds what I can actually process. I started building **ArticleRecommender**: a personal platform that would ingest that stream, pull out the technologies mentioned, connect related sources, and hand me a synthesized briefing. Save a link, chat with it, search later — that part worked fine.

Then I tried to make it *smart*. A 45-minute YouTube transcript does not fit in an embedding model. Summarize it first? Fine — but how do I know the summary kept the important detail? Extract product names like Pinecone or GraphRAG so the system can investigate them? Also fine — but which model, and how fast, and how do I know it is right?

I could not answer those questions. I had a product sketch and no way to measure whether the AI parts were trustworthy. So I stopped adding features and started building the tools to find out. What follows is how a side project turned into an open-source evaluation lab — and what I learned about working with AI agents along the way.

---

## Act I — The product I thought I was building

I had a clear north star: *Signal → Investigate → Connect → Brief.* Phase 1 was deliberately smaller — save documents, chat with them, search for them later — because the "smart" enrichment pipeline needed proof, not hope.

**[The Minimum Credible Loop](./01-i-didnt-want-another-bookmark-app.md)** — Why ArticleRecommender exists, what Phase 1 shipped, and why I stopped before building autonomous enrichment.

**[Compressing YouTube for the Vector DB](./02-compress-then-embed.md)** — Long transcripts do not fit embedding models. I split out `text-compressor` to test compress-then-embed: summarize first, embed second. The sizing worked. Whether the summaries were *true* was still an open question.

---

## Act II — When the metrics lied

The summaries read well. The first evaluation metric said they were excellent. Both were misleading in different ways.

**[ModernBERT and the Overlap Trap](./03-overlap-is-not-faithfulness.md)** — Semantic similarity scored 0.91 and looked like a pass. A four-metric scorecard on the same rows told a different story. Overlap is not faithfulness.

**[Benchmarking NER: Latency, Doc F1, and Cache Bugs](./04-picking-a-ner-backend.md)** — Entity coverage depends on NER. I built `ner-detector` to compare backends on quality and wall-clock time — and found a cache bug that made BERT look unusable until I fixed the implementation.

---

## Act III — Fixing the foundation

Benchmarks need gold data. The way I was generating gold data was broken.

**[Fixing LLM Offset Hallucinations](./05-entity-first-gold.md)** — LLMs write prose well and count characters badly. I inverted the pipeline: entities first, text second, offsets computed in code.

**[Publishing the Evidence](./06-publish-the-evidence-loop.md)** — I split the generator from `ner-dataset`, added CI validation, and published live stats and benchmark reports. Private benchmarks are theatre; the loop had to be public.

---

## Act IV — How I actually work with agents

The technical path above is what I built. This last chapter is *how* I built it.

**[Agents Draft. I Sign.](./07-agents-draft-i-sign.md)** — Explore the problem with agents first (the walk), constrain output with tests and benchmarks second (the loop), and take personal accountability for what ships (the sign).

---

## Who this is for

If you build with AI and are tired of vibes-based evaluation, these posts show how I put numbers behind architectural choices. If you use agents to write software, the final chapter describes the operating model: walk until the map is clear, then automate the work around judgment — not the judgment itself.

Start with [Chapter 1](./01-i-didnt-want-another-bookmark-app.md), or jump to whichever act matches where you are stuck.

Future in-series chapters will use **`08+`** filenames and `order` values (e.g. returning to ArticleRecommender). Standalone essays use slug-only filenames and do not consume those numbers.

---

## Further reading (standalone)

[Agent Quality Engineering: Grade the Protocol, Not the Chat](./aq-better-ai-engineer.md) — agent quality for multi-turn systems: server-owned progress, scenario contracts, and parity checks. Same discipline as this series, applied to conversational agents rather than single-shot compression or NER.

[Specs Drive. Tests Validate.](./specs-drive-tests-validate.md) — how I ship a large agent-written application: specification-driven acceptance criteria, application QA at scale, lifecycle coverage matrices for multi-role E2E, and AQ as an extra layer — not a substitute for specs.

[Did the Summary Keep the Important Bits?](./faithfulness-metrics-map.md) — plain-language map for the compression scorecard: four checks on the same summaries (sounds similar, names, numbers, sentence truth). Companion to Act II; the ResNet story is still in Part 3.
