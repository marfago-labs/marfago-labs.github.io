---
title: "Did the Summary Keep the Important Bits?"
slug: faithfulness-metrics-map
order: 9003
date: 2026-06-21
lastUpdated: 2026-06-23
version: "1.1"
description: A plain-language guide to four compression checks — does it sound similar, keep names, keep numbers, and stay true sentence by sentence — and why one high score is not enough.
cover: /blog/covers/faithfulness-metrics-map.png
coverAlt: Four simple checks pointing at one summary — sounding right is not the same as keeping what mattered.
---

# Did the Summary Keep the Important Bits?

Imagine a friend tells you what a long article said. You ask four simple questions:

1. **Does it sound like the article?** (Same topic, similar words.)
2. **Did the important names survive?** (Products, datasets, methods — "GraphRAG", "COCO", "ResNet".)
3. **Did the numbers survive?** (Scores, layer counts, error rates.)
4. **Is each sentence actually supported by the article?** (Not polished fiction.)

That is what I built for `text-compressor`. I did not start with a taxonomy — I started with check #1 alone. **ModernBERT F1 hit 0.913** on eight arXiv abstracts. Green column. I felt done.

Then I ran checks #2–#4 on the **same summaries**. The pass line stopped meaning anything.

This post is the plain map: what each check asks, what it catches, and why **no single score** means "safe to embed." The dramatic ResNet example is in [ModernBERT and the Overlap Trap](./03-overlap-is-not-faithfulness.md). Here I stay at the survey layer — ELI5 first, numbers second.

**What this is:** a metric picker's guide for compress-then-embed in my lab — not a leaderboard, not "which model to ship." Numbers below come from compare run `compare-20260524T225903Z` on eight arXiv papers with `openai/gpt-oss-120b:free`. Corpus: twelve arXiv abstracts + ten YouTube transcripts in `corpus.json` ([Part 2](./02-compress-then-embed.md)).

## The four checks (ELI5)

| # | Plain question | Tool name | Good at catching | Blind spot |
|---|----------------|-----------|------------------|------------|
| 1 | Does it **sound like** the source? | ModernBERT F1 (overlap) | Wrong topic, totally different wording | Missing names, dropped numbers, sentences the source never said |
| 2 | Did **names** make it through? | Entity coverage (NER F1) | "GraphRAG" vanished — bad for downstream search | Tagging mistakes; fuzzy entity boundaries |
| 3 | Did **numbers** make it through? | Numeric match | BLEU scores, layer counts, error rates disappeared | Wrong number that still "looks numeric" |
| 4 | Is each sentence **actually true** given the source? | NLI faithfulness (light) | Smooth sentences the paper does not support | NLI model errors; awkward chunk splits |

**F1** just means "how well did we match?" on a 0–1 scale. High F1 on check #1 does **not** automatically mean high scores on #2–#4.

On the eight-paper run, check #1 averaged **0.91** — everything looked fine. Checks #2–#4 averaged **0.67**, **0.72**, and **0.75** — and **different papers failed different checks**. Attention lost numbers. ResNet lost names, numbers, and sentence-level truth at once.

## One row, four answers: ResNet

Paper `1512.03385` (2015). The summary read like the abstract — confident, fluent, "state of the art on ImageNet."

| Check | Score | Plain read |
|-------|-------|------------|
| Sounds similar | **0.91** | "Looks great." |
| Names kept | **0.50** | Half the important handles missing or wrong. |
| Numbers kept | **0.57** | Key figures partly dropped. |
| Sentences supported | **0.50** | Half the sentences not clearly backed by the source. |

If I had embedded that summary and searched later, overlap alone would have told me I was fine. I was not. Full chart and narrative: [Part 3](./03-overlap-is-not-faithfulness.md).

## How I run all four on the same rows

1. **Fixed corpus** — same inputs every time so I can re-run cheaply.
2. **One compression model per run** — apples to apples.
3. **All four metrics on every summary** — configured in `text-compressor/config/eval_metrics.yaml`.
4. **Look at rows, not just averages** — corpus means hid ResNet until I charted per-paper columns.

In production, rows skipped by `min_compress_chars` are not compression scores — log them separately ([Part 2](./02-compress-then-embed.md)).

## Why teams use more than one check

Overlap-style metrics ([BERTScore](https://arxiv.org/abs/1904.09675), embedding similarity) reward **sounding similar**, not **being true** per sentence. Summarization research ([Maynez et al., 2020](https://arxiv.org/abs/2005.00661)) documented that gap years ago; tools like [SummaC](https://arxiv.org/abs/2111.09525) and [FactCC](https://arxiv.org/abs/1910.12840) exist because ROUGE-like passes kept shipping. NLI checks approximate "supported by source" but cost more and depend on chunking. Name and number checks are blunt — and that bluntness is useful when handles and figures must survive compression.

## What one green column still cannot tell you

- **Compound failure** — pass on "sounds similar" + fail on names or numbers = broken retrieval path.
- **Your NER is part of the test** — entity coverage is only as good as the tagger ([Part 4](./04-picking-a-ner-backend.md)).
- **Short abstracts vs long talks** — arXiv proved the mechanics; YouTube transcripts are the messy product shape ([Part 3](./03-overlap-is-not-faithfulness.md)).
- **Compare runs ≠ production** — different skip rules, different denominators ([Part 2](./02-compress-then-embed.md)).

## Takeaways

- **Ask four questions, not one** — similar wording, names, numbers, sentence-level support.
- **Same summaries, every metric** — a scorecard only works when all checks run on identical rows from one compare run.
- **Read the bad rows** — averages hid ResNet; one paper can look fine in the mean and fail everywhere that matters.
- **Evaluators are infrastructure** — faithfulness inherits NER and NLI weaknesses; document or fix the dependency.

## Related reading

- [ModernBERT and the Overlap Trap](./03-overlap-is-not-faithfulness.md) — the ResNet scorecard story
- [Compressing YouTube for the Vector DB](./02-compress-then-embed.md) — why compress-then-embed exists
- [Building an Evaluation Lab by Accident](./00-series-index.md) — full series arc

**Next:** run the same four-check bundle on the full 22-item corpus with YouTube rows scored separately from arXiv fixtures.

## The Evidence

- **Compare run:** `text-compressor/results/compare-20260524T225903Z/models/openai--gpt-oss-120b-free/metrics.json`
- **Eval config:** `text-compressor/config/eval_metrics.yaml`
- **Repo:** [marfago-labs/text-compressor](https://github.com/marfago-labs/text-compressor) (WIP — not open for public review yet)
