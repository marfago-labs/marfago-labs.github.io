---
title: "The Minimum Credible Loop"
slug: i-didnt-want-another-bookmark-app
series: marfago-labs-origin
order: 1
date: 2026-06-08
lastUpdated: 2026-06-21
version: "1.6"
description: "Why ArticleRecommender exists, what Phase 1 actually shipped, and why I deliberately stopped before building the smart enrichment."
cover: /blog/covers/i-didnt-want-another-bookmark-app.png
coverAlt: A tight teal loop through document, storage, and search — the minimum credible path before the larger pipeline.
---

# The Minimum Credible Loop

If you watch a 45-minute tech talk on YouTube, the presenter might mention Pinecone, Dremio, and GraphRAG. Saving the link does not help you much on its own.

What I actually wanted was a system that watches the video, extracts those names, hunts down the documentation and related arXiv papers, connects them into a research set, and hands me a synthesized one-pager briefing.

That was the north star for **ArticleRecommender**: *Signal → Investigate → Connect → Brief.*

I did not want another bookmark app. The volume of technical signal I follow — arXiv papers, YouTube talks, GitHub releases — outruns what I can process in a week. Bookmarks solve storage: they remember the URL. They do not extract the product names, link the related papers, or tell me whether GraphRAG is worth a spike this sprint. A week later I was rewatching chunks of the talk or redoing the same searches from memory because the saved link never captured what mattered. Phase 1 had to answer a smaller question first: before the system can investigate and brief on its own, can I reliably capture a source, retrieve it, and chat with it?

## Phase 1: Proving the Foundation

Before you build autonomous agents, you need plumbing. I defined Phase 1 as that minimum credible loop: save a document, chat with it, search for it later.

I built a FastAPI backend and a React frontend, with Agno agents configured via YAML. For storage I made a deliberate choice: PostgreSQL as the single system of record. Keyword search uses `tsvector`; semantic search uses `pgvector` — embed the document text, store one vector per row, retrieve by nearest neighbors at query time. I skipped standing up Elasticsearch on day one because I did not want the operational overhead of syncing two systems of truth. That one-vector-per-document shape would matter as soon as ingest sources outgrew the embedder's input window.

The backend enforces a ≥95% test coverage gate (`pytest --cov-fail-under=95`), and CI runs the same checks on every push. Storage is documented in [ADR-001](https://github.com/marfago-labs/ArticleRecommender/blob/master/docs/adr/001-storage.md).

Phase 1 shipped a concrete loop — not the north star, but provable:

1. **Discover** — on-demand search (DuckDuckGo + arXiv) from chat.
2. **Triage** — save a recommendation into the archive.
3. **Browse** — list and open saved items later.
4. **Chat** — Agno + OpenRouter against catalog context (`MOCK_LLM` / `MOCK_SEARCH` for offline E2E).

Playwright E2E covers that path end-to-end. Semantic search exists in the schema; the enrichment that would *populate* long-form ingest is what I deferred.

## The Discipline of Deferral

Here is what I did not build in Phase 1: scheduled collectors, multi-agent GraphRAG synthesis, or the autonomous enrichment pipeline. That was not a time problem. It was a deliberate choice.

To generate a briefing from a web of sources, the system has to enrich incoming documents — extract technology names, identify key claims. But if an LLM summarizes a YouTube transcript, how do I know the summary is faithful? If I embed that summary and it hallucinated a fact, the entire downstream retrieval process is poisoned. And how do I extract named entities reliably without killing latency?

Before I could build the "smart" recommender, I had to solve the evaluation problem: prove I could compress a document faithfully, and prove I could extract entities reliably and quickly.

So I stopped widening the ingest path — anything that would summarize, embed, or enrich into retrieval — and started building the discipline to measure it: evaluation, gold data, benchmarks, and the mechanisms that would tell me when an AI-assisted pipeline was actually trustworthy.

## Takeaways

- **Minimum credible loop** — Prove capture, retrieval, and reasoning on real sources before you automate investigation. How much proof you need scales with blast radius; the order does not — intelligence on an unproven substrate optimizes the wrong layer.
- **The index is a trust boundary** — When enrichment writes into retrieval, errors become ground truth for every later query, not a bad answer you can patch in the UI. That write path deserves scorecards before you widen it.
- **Name the blocker, then build the falsifier** — I did not freeze the product; I paused enrichment I could not test. The open questions were specific — is compression faithful, is extraction fast enough — and the honest next work was the smallest evaluation that could answer them.

## The Evidence

- **Repo:** [marfago-labs/ArticleRecommender](https://github.com/marfago-labs/ArticleRecommender) (Phase 1 MVP: chat, discovery, archive)
- **Storage ADR:** [ADR-001 Postgres + pgvector](https://github.com/marfago-labs/ArticleRecommender/blob/master/docs/adr/001-storage.md)
- **Coverage gate:** `backend` → `pytest tests/ --cov-fail-under=95`

**Next:** [Compressing YouTube for the Vector DB](./02-compress-then-embed.md)
