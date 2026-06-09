---
title: "Building an Evaluation Lab by Accident"
slug: series-index
series: marfago-labs-origin
order: 0
date: 2026-06-08
description: How a personal tech news recommender forced me to build an open-source evaluation lab, and what it taught me about building with AI under engineering discipline.
---

# Building an Evaluation Lab by Accident

I didn't set out to build an open-source evaluation lab. I just wanted a better way to read the internet.

As a Principal Engineer, the volume of technical signal—arXiv papers, YouTube tech talks, GitHub releases—exceeds what I can actually process. I wanted to build a personal intelligence platform that could ingest this stream, investigate the technologies mentioned, connect the sources, and generate a synthesized briefing.

I called it **ArticleRecommender**. I built the initial MVP: a FastAPI backend, a React frontend, some Agno agents, and a Postgres database. It worked. I could save links and chat with them.

But when it came time to build the autonomous ingestion and enrichment pipelines, I hit a wall. If I feed a 45-minute YouTube transcript into a vector database, it's noisy garbage. If I ask an LLM to summarize it first, how do I know the summary didn't drop the most important architectural detail? If I ask an agent to extract the named entities (like "Pinecone" or "GraphRAG") to investigate later, how do I know which NER model to use?

I realized I couldn't build the product because I didn't have the tools to measure if the product was actually working.

I had to stop building features and start building measurement mechanisms. This series is the architectural story of **marfago-labs**: how I hit the limits of generative AI, how I built evidence instead of demos, and how AI agents became an execution layer under human engineering control.

## The Series Arc

1. **[The Minimum Credible Loop](./01-i-didnt-want-another-bookmark-app.md)** — Why I built ArticleRecommender, what Phase 1 actually shipped, and why I deliberately stopped before building the "smart" enrichment.
2. **[Compressing YouTube for the Vector DB](./02-compress-then-embed.md)** — The `text-compressor` experiment. Why you can't just embed raw transcripts, and the operational reality of API churn.
3. **[ModernBERT and the Overlap Trap](./03-overlap-is-not-faithfulness.md)** — Why semantic similarity metrics give you false confidence, and how I built a multi-metric faithfulness scorecard.
4. **[Benchmarking NER: Latency, Doc F1, and Cache Bugs](./04-picking-a-ner-backend.md)** — Comparing LLMs, BERT, and GLiNER in `ner-detector`. Why I chose Doc F1, and the latency bug that almost ruined the benchmark.
5. **[Fixing LLM Offset Hallucinations](./05-entity-first-gold.md)** — LLMs can't count. How I solved character offset hallucinations using entity-first generation in `ner-gold-generator`.
6. **[Publishing the Evidence](./06-publish-the-evidence-loop.md)** — Separating the generator from `ner-dataset`. CI validation, live stats, and closing the loop so I can get back to building the recommender.
7. **[Agents Draft. I Sign.](./07-agents-draft-i-sign.md)** — The operating model behind the lab: agents draft code, docs, diagrams, and blog posts; I keep judgment, tests, benchmarks, and accountability in the loop.

If you are building agentic systems and are tired of vibes-based evaluation, this is how I put numbers behind the architecture. If you are using agents to build software, the final chapter is the part I would not skip: velocity is cheap now, but trust still has to be engineered.
