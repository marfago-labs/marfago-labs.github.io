---
title: "Four Faithfulness Checks on the Same Summary"
slug: faithfulness-metrics-map
order: 9003
date: 2026-06-21
lastUpdated: 2026-06-21
version: "1.0"
description: A metrics map for compress-then-embed — what overlap, entity, numeric, and NLI checks each measure on the same rows, grounded in text-compressor compare runs.
cover: /blog/covers/faithfulness-metrics-map.png
coverAlt: Four teal metric lanes converging on one summary row — overlap alone is not a faithfulness certificate.
---

# Four Faithfulness Checks on the Same Summary

When I built the `text-compressor` scorecard, I did not start with a taxonomy. I started with a green column: **ModernBERT F1 0.913** on eight arXiv abstracts from a fixed compare run. Then I added three more checks on the **same summaries** and watched the pass line stop meaning anything.

This post is the map I wish I had before wiring the first metric — what each check asks, what failure mode it catches, and why no single number is a faithfulness certificate. The row-level story lives in [ModernBERT and the Overlap Trap](./03-overlap-is-not-faithfulness.md); here I stay at the survey layer.

**Scope:** evaluation fixtures in `text-compressor` (twelve canonical arXiv abstracts plus ten YouTube transcripts in `corpus.json`). Numbers below come from the eight-paper slice scored in compare run `compare-20260524T225903Z` with `openai/gpt-oss-120b:free`. This is not a SOTA leaderboard and not a recommendation of which compression model to ship — it is a **metric picker's guide** for one lab's compress-then-embed path.

## The method

1. Fixed corpus — stable text I can re-run cheaply ([Part 2](./02-compress-then-embed.md)).
2. One compression model per compare run — same inputs, same denominator.
3. Four metrics per summary — configured in `text-compressor/config/eval_metrics.yaml`.
4. Corpus averages **and** per-row inspection — averages hide ResNet-style traps.

If you adopt this pattern, log skipped rows separately when production uses `min_compress_chars` ([Part 2](./02-compress-then-embed.md)); passthrough rows are not compression faithfulness scores.

## Taxonomy

| Metric | Question it answers | Catches | Misses |
|--------|---------------------|---------|--------|
| **ModernBERT F1** (overlap) | How similar is the summary phrasing to the source? | Drift in topic and wording; useful for comparing compressors | Unsupported sentences, dropped numbers, missing product names |
| **Entity coverage** (NER F1) | Did salient names survive compression? | Vanished handles ("GraphRAG", "COCO") that block downstream work | Wrong entity boundaries; tagger noise on scientific prose |
| **Numeric match** | Did source figures appear in the summary? | Dropped BLEU scores, layer counts, error rates | Wrong numbers that still "look numeric"; unit confusion |
| **NLI faithfulness (light)** | Is each summary sentence entailed by the source? | Polished sentences the source does not support | Entailment model errors; chunk-boundary artifacts |

Overlap cluster near **0.91** on the eight-paper run. Entity (**0.672**), numeric (**0.720**), and NLI (**0.750**) averages spread wider — and **different papers failed different columns** (Attention: numeric; ResNet: entity + numeric + NLI; GPT‑3: NLI).

## Row-level anchor: ResNet

On `1512.03385` (2015), the summary read like the abstract. ModernBERT F1 **0.912**. Entity coverage **0.50**, numeric match **0.57**, NLI **0.50**. Plausible prose, partial fact carry — the pattern that breaks retrieval if you embed on overlap alone. Full scorecard and chart: [Part 3](./03-overlap-is-not-faithfulness.md).

## Field context

[BERTScore-style metrics](https://arxiv.org/abs/1904.09675) and embedding similarity reward lexical overlap, not entailment per sentence. [Maynez et al. (2020)](https://arxiv.org/abs/2005.00661) document the gap between overlap and factual consistency in summarization; [SummaC](https://arxiv.org/abs/2111.09525) and [FactCC](https://arxiv.org/abs/1910.12840) exist because teams kept shipping on ROUGE-like passes. NLI-based checks approximate "supported by source" but add model cost and chunking choices. Entity and numeric checks are brittle heuristics — and that brittleness is the point when you need handles and figures to survive compression.

## Gaps — no single pass line

- **Compound failure:** A summary can pass overlap and still fail investigation paths (missing entity) or mislead numerically (partial BLEU retention).
- **Evaluator dependency:** Entity coverage is only as good as the NER backend ([Part 4](./04-picking-a-ner-backend.md)).
- **Corpus shape:** ArXiv abstracts proved mechanics; long YouTube transcripts are the product-shaped stress test still open on the full 22-item corpus ([Part 3](./03-overlap-is-not-faithfulness.md)).
- **Production vs compare:** Model comparison runs should not be confused with production-shaped faithfulness reporting when skip thresholds differ ([Part 2](./02-compress-then-embed.md)).

## Connect to marfago-labs

- **Compress-then-embed experiment:** [Part 2](./02-compress-then-embed.md)
- **Overlap trap narrative:** [Part 3](./03-overlap-is-not-faithfulness.md)
- **Eval discipline at product scale:** [Specs Drive. Tests Validate.](./specs-drive-tests-validate.md) — same instinct: specs set intent, tests enforce it; one green column is insufficient.

## Takeaways

- **Pick metrics by failure mode** — Overlap for model comparison; entity, numeric, and NLI for faithfulness gates; no single headline number.
- **Same rows, every time** — A scorecard only works when all metrics run on identical summaries from a fixed compare run.
- **Inspect rows, not only averages** — Corpus means hid ResNet until I charted per-paper columns.
- **Evaluators are part of the system** — Faithfulness metrics inherit NER and NLI weaknesses; fix or document the dependency.

## Related reading

- [ModernBERT and the Overlap Trap](./03-overlap-is-not-faithfulness.md) — the ResNet scorecard story
- [Specs Drive. Tests Validate.](./specs-drive-tests-validate.md) — SDD and the application test pyramid
- [Building an Evaluation Lab by Accident](./00-series-index.md) — full series arc

**Further work:** publish the same four-metric bundle on the full 22-item corpus with YouTube rows scored separately from arXiv fixtures.

## The Evidence

- **Compare run:** `text-compressor/results/compare-20260524T225903Z/models/openai--gpt-oss-120b-free/metrics.json`
- **Eval config:** `text-compressor/config/eval_metrics.yaml`
- **Repo:** [marfago-labs/text-compressor](https://github.com/marfago-labs/text-compressor)
