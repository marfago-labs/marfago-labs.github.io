---
title: "Agents Draft. I Sign."
slug: agents-draft-i-sign
series: marfago-labs-origin
order: 7
date: 2026-06-09
lastUpdated: 2026-06-22
version: "1.5"
description: The agent walk, the control loop, and the sign — how I explore with agents first, then constrain output with tests, benchmarks, and public evidence.
cover: /blog/covers/agents-draft-i-sign.png
coverAlt: A winding teal path through a stylized city map — the agent walk before the build.
---

# Agents Draft. I Sign.

Parts 1 through 6 were the technical path: the product problem, the compressor experiment, the metric traps, the NER benchmarks, the gold-data inversion, and the public evidence loop. This chapter is the operating model behind them.

The obvious story about this lab is that I used AI to build it. That is true, but incomplete. I worked in two distinct phases. First, I **walked** the problem space with agents until intent was sharp enough to trust. Then I ran a **control loop** that turned that intent into artifacts I would sign.

Agents draft. I sign. But before the draft comes the walk.

## The Experiment

I am running a practical experiment:

Can a single principal engineer, working with AI agents, produce public artifacts that hold up under review?

Not demos. Not throwaway prototypes. Artifacts another engineer can inspect, run, challenge, and improve:

- Repositories with tests, type checks, linters, and secret scanning.
- Gold datasets with deterministic validation.
- Benchmark reports with explicit metrics and latency numbers.
- Documentation that explains the architecture, not just the commands.
- Blog posts that describe the failures as clearly as the wins.

The hypothesis is not that AI replaces engineering discipline. The hypothesis is the opposite: AI output becomes useful only when discipline is made explicit.

Without that discipline, agents generate volume. With it, they can help build systems.

## The Agent Walk

Before I ask an agent to build anything, I take a walk.

Not a sprint to implementation. An exploratory pass through the problem space: the codebase, the prior conversations, the domain constraints, the failures from last time, the things I think I know and the things I am still unsure about. I call this **the agent walk**.

When you arrive in a city you do not know, you do not always pick a destination and march in a straight line. You walk. You notice landmarks. You change direction when a street looks wrong. You discover the neighbourhood you actually needed once you have seen enough of the map. The route becomes clear only after you have moved through the terrain.

Building with agents works the same way. At the start, I often do not have a fully formed spec. I have a problem, a hunch, and a set of open questions. I use the agent to explore: read the repo, compare approaches, replay what happened in earlier sessions, challenge assumptions, surface trade-offs. During the walk I also ask it to propose hypotheses, argue for or against options, and search for information — documentation, papers, comparable systems — when I do not know enough yet. Those outputs are inputs to the map, not conclusions. I am not asking for code yet. I am building a shared mental map.

Hallucination risk is highest when an agent is pushed to **produce** before it **understands**. If I ask for a benchmark harness before we have agreed what metric matters, I get a plausible report with the wrong headline number. If I ask for gold data before we have confronted the offset problem, I get JSON that looks clean and fails validation. The walk front-loads context. Wrong assumptions surface early, while the cost of correction is still a conversation — not a pull request.

Sometimes I discover the destination during the walk. I started this lab wanting ArticleRecommender to synthesize my reading list. Along the way, the walk made the real blockers visible: compression faithfulness, entity extraction, comparable gold, public evidence. I did not know I was building an evaluation lab when I began. I found out by walking.

The walk is not aimless chat. It has a purpose: turn uncertainty into intent. When the map is clear enough, the walk ends and the control loop begins.

## Walk, Loop, Sign

The full model has three movements:

| Phase | What happens | Output |
| --- | --- | --- |
| **Walk** | Explore context, domain, and constraints; hypothesize, compare, and research | Sharpened intent, shared map |
| **Loop** | Draft, test, benchmark, review, reject or accept | Trustworthy artifacts |
| **Sign** | Human accountability for what ships | Public evidence |

The walk feeds the loop. The loop earns the signature.

<figure class="diagram">
  <img src="/blog/diagrams/walk-loop-sign.svg" alt="Walk, loop, sign: Walk explores, hypothesizes, and researches; Loop drafts and verifies; Sign publishes public evidence; if not trustworthy, reject and walk again." width="400" height="460" loading="lazy" decoding="async" />
</figure>

The important box is not "Agent draft." That is the cheap part now.

What actually saved the lab was exploring before committing — the walk that surfaced which metric mattered — and refusing to merge when the scorecard still failed on the same rows ModernBERT had passed (see Evidence 1 below). An agent can write a CI workflow, but the workflow has to run the real tests. It can draft a benchmark report, but the report has to survive the cache fix and public re-run in Evidence 2. It can write a blog post, but the post cannot invent a result because it sounds good; Evidence 4 is where I applied the same rules to prose.

When "Trustworthy?" comes back no, the fix is not always another draft. Sometimes the map was wrong — as when I thought I needed a bookmark app and the walk revealed an evaluation lab instead. You walk again.

## Evidence 1: Green Was Not Enough

[`text-compressor`](./02-compress-then-embed.md) taught the first lesson: ModernBERT F1 near **0.91** on compression looked like a pass until entity, numeric, and NLI checks disagreed on the same rows ([Part 3](./03-overlap-is-not-faithfulness.md)). The walk surfaced *similar to what, and faithful to what?* The agent implemented the scorecard; it did not decide what deserved trust.

## Evidence 2: The Benchmark Was Wrong Until It Was Measured

[`ner-detector`](./04-picking-a-ner-backend.md) repeated the pattern: a styled report before a trustworthy one — model reload per document, wrong label maps on scientific gold. The loop fixed caching and dataset wiring, then published [Doc F1 + latency](https://marfago-labs.github.io/ner-detector/) where others can challenge the numbers. Routing followed: LLM **83.9%** on news at ~7s, BERT **72.5%** at ~80ms, **47.2%** on `arxiv_gold`.

## Evidence 3: The Gold Data Could Not Be Patched by Vibes

[`ner-gold-generator`](./05-entity-first-gold.md) inverted the pipeline: entities first, prose second, offsets in code. No fuzzy repair of LLM counting errors. Failed validations retry or drop. The model writes; code owns the invariants.

## Evidence 4: The Blog Is Part of the System

This blog was also built with agents.

That creates a different risk. Code can fail tests. Benchmarks can expose bad numbers. Prose fails more quietly. It can become generic. It can overclaim. It can turn a messy engineering path into a clean marketing arc.

So I made rules for the narrative too:

- First person. I made the decisions; I own the calls.
- No invented metrics.
- No "we" unless there is a named collaborator.
- One story per post, not a changelog.
- Reality only: point to code, reports, CI, datasets, or recorded decisions.

That is why this series includes the embarrassing parts: regex-based entity extraction, misleading similarity scores, cache bugs, LLM offset hallucinations, CI gaps, and security hardening after a credential scare.

The public narrative is not decoration around the engineering work. It is another artifact under the same rule: claims need evidence.

## What AI Changed

AI changed the economics of iteration.

It let me move across repos quickly. It helped scaffold packages, wire CI, draft docs, produce diagrams, generate static pages, inspect transcripts, and turn a trail of work into a readable series. A single engineer could sustain a wider surface area than would have been practical by hand.

But AI did not remove the hard parts.

The hard parts were knowing when to keep walking and when to stop, choosing the metric, noticing when a result was too convenient, deciding when to split a repo, refusing fuzzy gold data, keeping public docs accurate, and asking whether a token in the local keyring was visible to an agent with shell access.

Those are not typing problems. They are judgment problems.

AI made the walk and the loop faster. It did not make either optional.

## The Engineering Bar

The operating standard for marfago-labs is intentionally boring in the best sense:

- Walk the problem before committing to a build.
- Tests and coverage gates where behavior is implemented — see [Specs Drive. Tests Validate.](./specs-drive-tests-validate.md) for the product-scale test pyramid (SDD as driver, unit/integration/E2E as validator).
- Static checks and linters in CI.
- Secret scanning.
- Deterministic validators for persisted benchmark data.
- Public reports for claims about quality and latency.
- Docs that explain how to reproduce the result.
- Blog posts that admit the failed assumptions.

That standard matters because agent output can look finished before it is finished. The screen fills with code. The report renders. The README sounds confident. The danger is accepting the appearance of completion.

The antidote is mechanism — tests, validators, public reports — not confidence in the draft.

## What I Am Claiming

I am not claiming that this lab proves agents can replace engineers.

I am claiming something narrower and more useful:

A disciplined engineer can use agents to produce high-quality public artifacts faster, if the work starts with exploratory context-building, continues through explicit intent and repeatable checks, and ends with honest metrics and human accountability.

The agent walk turns uncertainty into intent. The control loop turns intent into evidence. The signature means I stand behind what shipped.

That is the experiment.

`marfago-labs` is the evidence trail: the code, the datasets, the reports, the CI, the docs, the blog, and the history that shows how many times the agent output had to be walked, corrected, and re-tested before it deserved trust.

The lesson I am taking back to ArticleRecommender is simple.

Do not automate judgment away. Walk until the map is clear. Then automate the work around judgment so there is more room for it.

## Takeaways

- **Walk** — Explore first: hypotheses, research, comparisons; the map of blockers is the deliverable, not a premature build plan.
- **Loop** — Constrain agent output with tests, benchmarks, CI, and scorecards; green on one metric is not trustworthy until the bundle passes.
- **Sign** — Public evidence and human accountability: I stand behind what shipped, not what merely rendered on screen.
- **Agents as execution layer** — Agents draft and implement; the engineer decides what deserves trust and owns the signature at the bottom.
- **The map is the deliverable** — I did not set out to build an evaluation lab; the walk revealed compression, NER, gold, and evidence as the real prerequisites.

**Previous:** [Publishing the Evidence](./06-publish-the-evidence-loop.md) · **Series index:** [Building an Evaluation Lab by Accident](./00-series-index.md)

## The Evidence

- **Dataset Stats:** [marfago-labs.github.io/ner-dataset](https://marfago-labs.github.io/ner-dataset/)
- **Benchmark Report:** [marfago-labs.github.io/ner-detector](https://marfago-labs.github.io/ner-detector/)
- **The Code:** [ner-gold-generator](https://github.com/marfago-labs/ner-gold-generator) · [ner-dataset](https://github.com/marfago-labs/ner-dataset) · [ner-detector](https://github.com/marfago-labs/ner-detector)
