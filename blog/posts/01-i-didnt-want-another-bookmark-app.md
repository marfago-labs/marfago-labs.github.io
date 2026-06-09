---
title: "The Minimum Credible Loop"
slug: i-didnt-want-another-bookmark-app
series: marfago-labs-origin
order: 1
date: 2026-06-08
lastUpdated: 2026-06-10
version: "1.1"
description: "Why ArticleRecommender exists, what Phase 1 actually shipped, and why I deliberately stopped before building the smart enrichment."
cover: /blog/covers/i-didnt-want-another-bookmark-app.png
coverAlt: A tight teal loop through document, storage, and search — the minimum credible path before the larger pipeline.
---

# The Minimum Credible Loop

If you watch a 45-minute tech talk on YouTube, the presenter might mention Pinecone, Dremio, and GraphRAG. The naive approach to building a "read-it-later" app is to just save the YouTube link. But that doesn't actually help you.

What you really want is a system that watches the video, extracts the entities (Pinecone, GraphRAG), autonomously hunts down the documentation and related arXiv papers for those entities, connects them into a research set, and hands you a synthesized one-pager briefing.

That was the north star for **ArticleRecommender**: *Signal → Investigate → Connect → Brief.*

## Phase 1: Proving the Foundation

Before you build the autonomous agents, you have to build the plumbing. I defined Phase 1 as the minimum credible loop: can I save a document, chat with it, and search for it later?

I built a FastAPI backend and a React frontend. I used Agno agents configured via YAML. For storage, I made a deliberate architectural choice: PostgreSQL is the single system of record. I used `tsvector` for keyword search and `pgvector` for semantic search — embed the document text, store one vector per row, retrieve by nearest neighbors at query time. I explicitly rejected standing up a separate Elasticsearch cluster on day one because I didn't want the operational overhead of syncing two systems of truth. That one-vector-per-document shape would matter as soon as ingest sources outgrew the embedder's input window.

I enforced a strict ≥95% test coverage gate on the backend (`pytest --cov-fail-under=95`). CI runs the same checks on every push. Storage is documented in [ADR-001](https://github.com/marfago-labs/ArticleRecommender/blob/master/docs/adr/001-storage.md): Postgres as the single system of record, `pgvector` for semantic columns, `tsvector` for keyword search.

Phase 1 shipped a concrete loop — not the north star, but provable:

1. **Discover** — on-demand search (DuckDuckGo + arXiv) from chat.
2. **Triage** — save a recommendation into the archive.
3. **Browse** — list and open saved items later.
4. **Chat** — Agno + OpenRouter against catalog context (`MOCK_LLM` / `MOCK_SEARCH` for offline E2E).

Playwright E2E covers that path end-to-end. Semantic search exists in the schema; the enrichment that would *populate* long-form ingest is what I deferred.

## The Discipline of Deferral

Here is what I *didn't* build in Phase 1: I didn't build the scheduled collectors. I didn't build the multi-agent GraphRAG synthesis. And crucially, I didn't build the autonomous enrichment pipeline.

This wasn't because I ran out of time. It was a deliberate deferral.

To generate a briefing from a web of sources, the system has to autonomously enrich incoming documents. It has to extract technology names and identify key claims.

But if an LLM reads a YouTube transcript and summarizes it, how do I know the summary is faithful to the source? If I embed that summary into a vector database, and the summary hallucinated a fact, my entire downstream retrieval process is poisoned. Furthermore, how do I reliably extract the named entities from that text without crippling the system's latency?

I realized that before I could build the "smart" recommender, I had to solve the evaluation problem. I had to prove I could compress a document faithfully, and I had to prove I could extract entities reliably and quickly.

I had to stop building product features and start building the discipline around them: evaluation, gold data, benchmarks, and the mechanisms that would tell me when an AI-assisted pipeline was actually trustworthy.

## Takeaways

- **North star vs Phase 1** — *Signal → Investigate → Connect → Brief* is the goal; Phase 1 only proves save, chat, and search — deliberately, not accidentally.
- **One database, two search modes** — Postgres with `pgvector` for semantic neighbors and `tsvector` for keywords; one vector per document until ingest sources outgrow the embedder window.
- **Deferral is a decision** — Collectors, GraphRAG synthesis, and autonomous enrichment wait until compression faithfulness and entity extraction are measurable, not vibes-based.
- **Poisoned retrieval** — A hallucinated summary embedded into `pgvector` corrupts everything downstream; evaluation is not a nice-to-have, it is a release gate.

## The Evidence

- **Repo:** [marfago-labs/ArticleRecommender](https://github.com/marfago-labs/ArticleRecommender) (Phase 1 MVP: chat, discovery, archive)
- **Storage ADR:** [ADR-001 Postgres + pgvector](https://github.com/marfago-labs/ArticleRecommender/blob/master/docs/adr/001-storage.md)
- **Coverage gate:** `backend` → `pytest tests/ --cov-fail-under=95`

**Next:** [Compressing YouTube for the Vector DB](./02-compress-then-embed.md)
