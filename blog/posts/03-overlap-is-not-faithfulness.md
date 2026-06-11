---
title: "ModernBERT and the Overlap Trap"
slug: overlap-is-not-faithfulness
series: marfago-labs-origin
order: 3
date: 2026-06-08
lastUpdated: 2026-06-13
version: "1.8"
description: Why semantic similarity metrics give you false confidence, and how I built a multi-metric faithfulness scorecard.
cover: /blog/covers/overlap-is-not-faithfulness.png
coverAlt: Two overlapping teal circles beside a scorecard — overlap is not the same as faithfulness.
---

# ModernBERT and the Overlap Trap

When I first built `text-compressor`, I needed a way to evaluate the quality of the LLM summaries. The standard approach is a semantic similarity metric. I wired up ModernBERT (`LazerLambda/ModernBERT-base-ModBERTScore-12`), ran the evaluation on my fixed corpus, and the numbers looked fantastic.

A note on the corpus before the numbers: I did **not** pick these documents because they represent what is state of the art in 2026. The fixed set in `corpus.json` is twelve canonical arXiv abstracts (Attention, BERT, ResNet, GPT‑3, CLIP, …) plus ten YouTube transcripts — papers I already knew by heart, with stable text I could re-run cheaply. They are **evaluation fixtures**, not reading recommendations. ResNet is from 2015; the Transformer paper is from 2017. Their abstracts still talk about ImageNet leaderboards and BLEU records from that era, and that is fine: I am testing whether compression **preserves what the source actually says**, not whether the source is still the best method available today.

The first real compare run scored eight of those arXiv abstracts with `openai/gpt-oss-120b:free` (YouTube came later — the path ArticleRecommender actually cares about). **Average ModernBERT F1 was 0.913**. Every paper scored above 0.88. That looked like a pass. It was not.

## Context

**Semantic similarity** (what ModernBERT measures) asks: "How much does the summary *sound like* the source?" It compares word-level embeddings. High overlap means similar phrasing and topic — not necessarily that every claim in the summary is supported by the source.

**Faithfulness** asks a different question: "Did the summary *get the facts right*?" To check that I added three more checks:

- **Numeric match** — Do the numbers in the source (BLEU scores, layer counts, error rates) appear in the summary?
- **NLI faithfulness** — Does a natural-language-inference model think each summary sentence is actually supported by the source text?
- **Entity coverage** — Did important names (datasets, benchmarks, product names) survive compression? This uses **NER** (Named Entity Recognition): finding names and labels in text.

**F1** is a standard precision/recall score (0 to 1). Higher is better, but what it measures depends entirely on the metric underneath it.

## A Summary That Passed Overlap

Take ResNet (`1512.03385`, 2015). The compressor produced a tight, authoritative summary:

> The paper introduces a residual learning framework that reformulates layers to learn residual functions relative to their inputs, enabling the training of neural networks far deeper than previously feasible. Empirical results show that residual networks up to 152 layers achieve state-of-the-art performance on ImageNet, attaining a 3.57% top-5 error and winning the ILSVRC 2015 classification challenge, while also delivering significant gains on CIFAR-10, COCO detection, and localization tasks.

It reads like the abstract — including decade-old "state-of-the-art" claims that nobody would cite for a 2026 benchmark. ModernBERT agreed: **F1 0.912**.

The scorecard did not:

<figure class="diagram diagram--wide">
  <img
    src="/blog/diagrams/resnet-scorecard.svg"
    alt="Bar chart for ResNet arXiv 1512.03385: ModernBERT F1 near 0.91 crosses a 0.88 pass line; entity coverage, numeric match, and NLI faithfulness stay near 0.50–0.57 on the same summary."
    width="480"
    height="205"
    loading="lazy"
    decoding="async"
  />
  <figcaption class="diagram-caption">Same ResNet summary — overlap looks like a pass; the other three checks do not.</figcaption>
</figure>

Nothing here is a Pinecone-acquired-Dremio fantasy. The summary is *plausible*. It keeps the right jargon, the right tone, and most of the headline claims. Entity coverage was only **0.50** (3/9 gold entity spans matched). The CoNLL tagger's gold set included noisy labels (`miscellaneous: Deep`, `miscellaneous: Learning`) and combined spans like `ILSVRC & COCO` that did not match — even though the summary text mentions COCO detection. NLI faithfulness was **0.50**: only one of two sentences cleared the entailment check. Numeric match dropped three of seven source figures.

If I had shipped compress-then-embed on ModernBERT alone, ArticleRecommender would have embedded text that *sounded* like the source while quietly losing the handles I needed for downstream investigation.

Similarity is not the same as getting the facts right.

## Why Overlap Passes Plausible Fiction

ModernBERT (and BERTScore-style metrics generally) encode the source and summary **separately**, then score token-level embedding similarity. That measures *lexical and semantic overlap*, not whether each summary sentence is entailed by the source. [Maynez et al. (2020)](https://arxiv.org/abs/2005.00661) document the gap between overlap metrics and factual consistency; [SummaC](https://arxiv.org/abs/2111.09525) and [FactCC](https://arxiv.org/abs/1910.12840) exist because the field kept rediscovering this mistake.

The ResNet summary is the pattern: polished prose, high overlap, partial fact loss. A retrieval system built on that text does not retrieve fiction — it retrieves **confident partial truth**, which is harder to catch in production.

## The Scorecard Run

I stopped looking for a single magic number and expanded the evaluation suite to run four metrics on every summary (`config/eval_metrics.yaml`):

1. **ModernBERT F1** — overlap / closeness. Useful for comparing compression models. **Not** a faithfulness certificate.
2. **Numeric match** — brittle but honest. What fraction of numeric tokens in the source appear in the summary?
3. **NLI faithfulness (light)** — `mDeBERTa-v3` checks whether source chunks entail each summary sentence (≥0.5 entailment probability).
4. **Entity coverage** — NER F1 between entities extracted from source vs summary. Critical for ArticleRecommender: if "GraphRAG" or "CLIP" vanishes in compression, investigation never starts.

On the same eight-paper compare run, the bundle told a different story than ModernBERT alone:

| Metric | Corpus average |
|--------|----------------|
| ModernBERT F1 | **0.913** |
| Entity coverage | **0.672** |
| Numeric match | **0.720** |
| NLI faithfulness | **0.750** |

ModernBERT said "excellent." The scorecard said "uneven." Different rows failed different checks — which is exactly why a bundle beats a headline number.

<figure class="diagram diagram--split">
  <div class="diagram-split">
    <div class="diagram-split__table">
      <table>
        <thead>
          <tr><th>Paper (year)</th><th>ModernBERT F1</th><th>Entity</th><th>Numeric</th><th>NLI</th></tr>
        </thead>
        <tbody>
          <tr><td>Attention (2017)</td><td>0.908</td><td>1.00</td><td><strong>0.40</strong></td><td>1.00</td></tr>
          <tr><td>ResNet (2015)</td><td>0.912</td><td><strong>0.50</strong></td><td><strong>0.57</strong></td><td><strong>0.50</strong></td></tr>
          <tr><td>GPT&#8209;3 (2020)</td><td>0.913</td><td>0.80</td><td>1.00</td><td><strong>0.33</strong></td></tr>
          <tr><td>ViT (2020)</td><td>0.903</td><td>0.77</td><td>1.00</td><td><strong>0.50</strong></td></tr>
        </tbody>
      </table>
    </div>
    <div class="diagram-split__chart"><img src="/blog/diagrams/faithfulness-radar.svg" alt="Radar chart of four papers across overlap F1, entity coverage, numeric match, and NLI faithfulness. F1 scores cluster near 0.91 while faithfulness axes spread apart." width="200" height="212" loading="lazy" decoding="async" /></div>
  </div>
</figure>

The years matter for expectations, not for the metric math. Attention (2017) is the numeric trap: NLI and entity coverage look fine, but the summary kept **28.4** and **41.8** BLEU while dropping **2 BLEU**, **3.5 days**, and **eight GPUs**. GPT‑3 (2020) is the entailment trap: perfect numeric preservation, **91.3%** overlap, but only **one of three** summary sentences entailed by the source. Old or new, the failure mode is the same — plausible compression that does not fully carry the facts forward.

No single column is sufficient. Each one catches a failure mode the others miss.

## The evaluator was broken too

Entity coverage depends on NER. I assumed the hard part was compression. The compare run taught me the evaluator was also broken.

I scored entity coverage with `dslim/bert-base-NER` (CoNLL-style transformers backend). On ML abstracts it tagged generic words as entities: `miscellaneous: Deep`, `miscellaneous: Learning`, `miscellaneous: Recognition` on ResNet; `miscellaneous: English`, `miscellaneous: German`, `miscellaneous: French` on the Attention paper. I was measuring entity preservation with a tagger that treated "English" as a named entity.

I added `DEFAULT_ENTITY_STOP_NORMS` in `entity_coverage.py` — a stop list for exactly this noise (`deep`, `learning`, `attention`, `english`, …). Then I noticed I had never wired it into the scorer. The band-aid existed in code and did nothing in production. I was patching symptoms in evaluation tooling, not fixing the dependency.

The codebase now defaults to the `pattern` backend in `ner-detector` (arXiv IDs, acronyms, years, numbers). That is narrower and more predictable than CoNLL BERT on scientific prose — but it is still not a product-grade entity extractor. I could not trust entity coverage until I could trust NER.

## What I Decided

I did not reject compress-then-embed. I rejected **one green column** as a release gate.

ModernBERT stays on the scorecard — it is a fast way to compare how "close" two compression models are. But the decision rule changed: a summary is trustworthy for the ArticleRecommender path only when **entity coverage, numeric match, and NLI faithfulness are acceptable together**, not when overlap alone looks good. On the May 2026 compare run, that ruled out treating any single model as "done." The best compressor still lost entities, numbers, or unsupported sentences on multiple papers while ModernBERT smiled.

Compress-then-embed remains a hypothesis worth pursuing, but only behind a **multi-metric gate** I can re-run on the full 22-item corpus (12 arXiv + 10 YouTube). The arXiv slice proved the scorecard mechanics; the YouTube transcripts are the product-shaped stress test — long, messy, and full of names and numbers from talks I might actually ingest. Overlap metrics are a compass, not a contract.

The next bottleneck was obvious. Entity coverage is only as good as the NER backend underneath it. I needed real Named Entity Recognition — and I did not want to guess which one.

## Takeaways

- **Overlap is not faithfulness** — ModernBERT F1 near **0.91** looked like a pass; entity, numeric, and NLI checks on the same rows told a different story.
- **No single magic number** — Use a scorecard: overlap for model comparison, numeric match for figures, NLI for unsupported sentences, entity coverage for names that drive downstream work.
- **Evaluator quality matters** — Entity coverage is only as trustworthy as the NER underneath it; noisy taggers measure noise, not compression quality.
- **Corpus fixtures, not recommendations** — Canonical arXiv abstracts prove scorecard mechanics; YouTube transcripts are the product-shaped stress test.
- **Release gate** — Compress-then-embed stays on the roadmap behind a multi-metric bundle, not one green column.

## The Evidence

- **Compare run:** `text-compressor/results/compare-20260524T225903Z/models/openai--gpt-oss-120b-free/metrics.json`
- **Eval config:** `text-compressor/config/eval_metrics.yaml`
- **Repo:** [marfago-labs/text-compressor](https://github.com/marfago-labs/text-compressor)

**Previous:** [Compressing YouTube for the Vector DB](./02-compress-then-embed.md) · **Next:** [Benchmarking NER: Latency, Doc F1, and Cache Bugs](./04-picking-a-ner-backend.md)
