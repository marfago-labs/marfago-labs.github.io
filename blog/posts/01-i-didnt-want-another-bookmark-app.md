---
title: "The Minimum Credible Loop"
slug: i-didnt-want-another-bookmark-app
series: marfago-labs-origin
order: 1
date: 2026-06-08
description: "Why ArticleRecommender exists, what Phase 1 actually shipped, and why I deliberately stopped before building the smart enrichment."
---

# The Minimum Credible Loop

If you watch a 45-minute tech talk on YouTube, the presenter might mention Pinecone, Dremio, and GraphRAG. The naive approach to building a "read-it-later" app is to just save the YouTube link. But that doesn't actually help you.

What you really want is a system that watches the video, extracts the entities (Pinecone, GraphRAG), autonomously hunts down the documentation and related arXiv papers for those entities, connects them into a research set, and hands you a synthesized one-pager briefing.

That was the north star for **ArticleRecommender**: *Signal → Investigate → Connect → Brief.*

## Phase 1: Proving the Foundation

Before you build the autonomous agents, you have to build the plumbing. I defined Phase 1 as the minimum credible loop: can I save a document, chat with it, and search for it later?

I built a FastAPI backend and a React frontend. I used Agno agents configured via YAML. For storage, I made a deliberate architectural choice: PostgreSQL is the single system of record. I used `tsvector` for keyword search and `pgvector` for semantic search. I explicitly rejected standing up a separate Elasticsearch cluster on day one because I didn't want the operational overhead of syncing two systems of truth.

I enforced a strict ≥95% test coverage gate. I set up CI/CD. I proved the basic loop worked.

## The Discipline of Deferral

Here is what I *didn't* build in Phase 1: I didn't build the scheduled collectors. I didn't build the multi-agent GraphRAG synthesis. And crucially, I didn't build the autonomous enrichment pipeline.

This wasn't because I ran out of time. It was a deliberate deferral.

To generate a briefing from a web of sources, the system has to autonomously enrich incoming documents. It has to extract technology names and identify key claims.

But if an LLM reads a YouTube transcript and summarizes it, how do I know the summary is faithful to the source? If I embed that summary into a vector database, and the summary hallucinated a fact, my entire downstream retrieval process is poisoned. Furthermore, how do I reliably extract the named entities from that text without crippling the system's latency?

I realized that before I could build the "smart" recommender, I had to solve the evaluation problem. I had to prove I could compress a document faithfully, and I had to prove I could extract entities reliably and quickly.

I had to stop building product features and start building the discipline around them: evaluation, gold data, benchmarks, and the mechanisms that would tell me when an AI-assisted pipeline was actually trustworthy.

**Next:** [Compressing YouTube for the Vector DB](./02-compress-then-embed.md)
