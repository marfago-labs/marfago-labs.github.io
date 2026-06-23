---
title: "Agent Quality Engineering: Grade the Protocol, Not the Chat"
slug: aq-better-ai-engineer
order: 9001
date: 2026-06-19
lastUpdated: 2026-06-22
version: "1.6"
description: Agent quality (AQ) is not prompt quality. How I grade multi-turn agent behavior with server-owned state, scenario contracts, and parity checks — not chat prose alone.
cover: /blog/covers/aq-better-ai-engineer.png
coverAlt: Chat prose on the left, server-owned progress checklist on the right — Python and TypeScript paths meeting at a parity checkpoint.
---

# Agent Quality Engineering: Grade the Protocol, Not the Chat

*To be a better AI engineer on agentic systems, grade AQ — not chat polish alone.*

The demo looked fine. The assistant asked sensible follow-up questions, acknowledged what the user said, and moved the conversation forward. I ran the same user script twice and got two different clarify counts on the same questionnaire item. Nothing threw an exception. The UI showed green checks. The progress object underneath did not agree with itself.

That was not a prompt problem. It was an **agent quality** problem — and I had been treating it like a QA problem with better copy.

## Context

**Agent quality (AQ)** asks whether a conversational agent follows the protocol you designed across many turns: which items are covered, when clarification is allowed, what happens when the user digresses, when the session may complete. It is adjacent to, but not the same as, familiar lanes:

| Lane | Question | Typical failure |
|------|----------|-----------------|
| **QA** | Does the application work? | Broken button, 500 error, auth regression |
| **AI eval** | Is this output good? | Hallucinated summary, wrong entity, unsupported sentence |
| **AQ** | Did the agent obey state and policy? | False clarify, cap violation, premature completion, progress drift |

**Server-owned progress** means the model proposes extractions and next actions, but deterministic code finalizes what actually changed: covered item ids, clarify counts per item, partial-answer sentinels, completion flags. The assistant message is UX. The progress object is truth.

A **scenario** is an executable contract: fixed questionnaire fixture, deterministic user script (turn-by-turn utterances), and expectations on final and per-turn state — not regex on chat text.

This post is standalone. It describes techniques I am using on a multi-turn guided-form agent I am building in parallel with the open-source evaluation work in [Building an Evaluation Lab by Accident](./00-series-index.md). Same discipline, harder surface: not one-shot compression or NER, but a state machine with caps and completion rules.

## The assistant lied politely

The agent I was building conducts structured questionnaires: a fixed list of items, each with a prompt, extraction rules, and a policy for ambiguous answers. When the user gives an unclear answer, the system may ask again — up to a configured cap per item. After the cap, policy decides whether to accept a partial sentinel, skip the item, or invite the user to complete early.

In manual testing, the chat always read well. The model apologized when answers were vague. It rephrased questions. It felt helpful.

When I started asserting on **progress** instead of prose, the picture changed. A polite digression — *"hey, good morning"* — sometimes incremented the clarify counter on the pending item. That is a bug. It does not surface as a stack trace. It surfaces as a user who gets fewer real clarification attempts than policy allows, or who gets stuck on an item that should have advanced.

I had spent weeks on prompts and Agno YAML. I had not spent enough time on **AQ engineering**: fixtures, invariants, and regression scenarios aimed at agent state.

## Server-owned progress, not LLM-owned truth

The fix started with ownership. The LLM returns structured JSON: extracted answers, a suggested next action, optional reasoning. None of that is committed directly to persistence.

A deterministic **finalize** step merges model output with policy:

- Strip partial-answer sentinels the model must not emit (the server injects those when cap policy fires).
- Increment clarify counts only when policy says a clarification actually occurred.
- Advance covered items only when extraction rules pass.
- Gate completion behind explicit flags and invite markers the product defines.

Benchmarks and unit tests assert on that finalized progress — in Python on the agent runtime and in TypeScript on the API gateway — not on whether the assistant sounded confident.

<figure class="diagram">
  <img src="/blog/diagrams/aq-turn-loop.svg" alt="Agent turn loop: user message, server injects session state, LLM proposes JSON, finalize commits progress; progress object is truth, chat prose is UX; Python runtime and API gateway must parity-match." width="400" height="468" loading="lazy" decoding="async" />
</figure>

This mirrors a lesson I learned building gold data for NER benchmarks ([Fixing LLM Offset Hallucinations](./05-entity-first-gold.md)): let the model write prose; let code own invariants the model is bad at. Here the invariant is session state across turns, not character offsets.

## Scenarios as BDD for agents

Once progress is authoritative, you can grade agents the way you grade APIs: given inputs, expect outputs.

Each scenario is a YAML file:

- A **questionnaire fixture** (item ids, prompts, kinds).
- A **user script** — ordered utterances, not an LLM playing the user in CI.
- **`expect.final`** — `isComplete`, `coveredItemIds`, `extractedAnswers` with **answer kinds** (`any`, `any_non_partial`, `partial`, `exact`), not brittle string equality on free text.
- **`expect.per_turn`** — e.g. after turn 2, clarify count on `q-severity` must be at least 1.
- **`behavior`** checks — e.g. completion invite only when progress is actually complete.
- **Weights** for scoring: progress, behavior, efficiency (latency and LLM calls per turn).

A minimal shape:

```yaml
id: clarify-then-valid
questionnaire: questionnaires/standard_questionnaire.json
user_script:
  - "about two weeks"
  - "not sure"
  - "high"
  - "no"
expect:
  final:
    isComplete: true
    coveredItemIds:
      - q-duration
      - q-severity
    extractedAnswers:
      q-severity:
        kind: any_non_partial
  per_turn:
    - after: 2
      clarifyCountMin:
        q-severity: 1
behavior:
  - completion_invite_when_complete
```

The user script is deterministic. The model under test is not. That asymmetry is the point: you are testing whether **policy + extraction** behave under known user behavior.

## Negative scenarios matter as much as happy paths

AQ engineers think in failure modes. My scenario catalog includes paths that never show up in a slick demo:

| Scenario | What it catches |
|----------|-----------------|
| Happy path, all valid | Baseline cover and completion |
| Clarify then valid | Recovery after ambiguous answer |
| Clarify cap → partial | Policy when user will not clarify |
| No early partial | Progress must not cover until cap fires |
| Polite digression mid-flow | Greeting must **not** increment clarify |
| Extended halfway | Session stops incomplete when script ends early |
| Digression-rich replay | Real messy transcripts, often marked replay-only |

The digression scenario came from a live session I exported to JSONL: out-of-order answers, small talk, partial replies. It does not gate every CI run — replay-only fixtures are expensive and noisy — but it anchors regression when I change prompts or swap execution modes. Same instinct as keeping embarrassing sessions in a bug corpus.

## A bundle of metrics, not one green column

Single-metric traps are not new to me. ModernBERT F1 near 0.91 looked like a pass on compression until entity, numeric, and NLI checks disagreed ([ModernBERT and the Overlap Trap](./03-overlap-is-not-faithfulness.md)). Agent benchmarks have the same failure mode.

A useful report tracks a **bundle**:

- **Scenario pass/fail** on progress and behavior expectations.
- **`falseClarifyIncrements`** — clarify count moved when policy says it should not have.
- **`capViolations`** — partial sentinel or advance before cap rules allow.
- **`parityMismatches`** — agent runtime and gateway disagree on finalized progress.
- **Latency and LLM calls per turn** — especially when comparing one-call vs multi-call pipelines.

Composite scores (0–100) with explicit weights are fine for trends. They are not a release gate by themselves. I treat a scenario pass on progress + behavior as the gate; efficiency is a tie-breaker when comparing architectures.

Stub mode runs the harness without live models — wiring and validators only. Live runs hit real endpoints. Confusing the two is how teams lie to themselves about agent quality.

## Dual-path parity

The agent runtime is Python. The production API gateway is TypeScript. Both implement the same progress semantics — mirrored modules, not "hope they stay in sync."

Benchmarks run two paths:

1. **Direct** — agent runtime only, fastest feedback on prompt and FSM changes.
2. **Parity** — full request path through the gateway invoking the agent bridge.

When those disagree, the bug may not be the model at all. It may be serialization, cap defaults, or a drift between two copies of the same rule. AQ for distributed systems: green in the notebook is insufficient.

## A lab bench before production wiring

Debugging agents inside a full stack is slow: auth, database, UI, deploy cycles. I split an **experiment harness** that imports the same agent logic but skips the rest.

It records structured JSONL traces per turn: FSM action before the call, system prompt, invoke payload, model JSON, progress delta, optional reasoning. A REPL exposes `/state`, `/prompt`, `/internals`, and lets me inject mid-session progress for a single turn.

Same pattern as isolating `text-compressor` from the main app ([Compressing YouTube for the Vector DB](./02-compress-then-embed.md)): protect the core product from unproven hypotheses, but iterate fast where the risk lives.

## Execution modes without moving the goalposts

I compared several internal pipelines on the same scenario set: one LLM call per turn versus split extractor/asker versus a small team with validation. Different cost and latency profiles; **same external contract** for progress and caps.

Parity runs apply only to the production-default mode. Experimental modes use the direct path so I do not pretend the gateway integration is solved before it is. AQ separates **interface contract** from **implementation strategy**.

## Where AQ sits in the validation ladder

AQ does not replace QA. Application trust starts with specs and the test pyramid — user stories and SDD acceptance criteria as the driver, unit/integration/E2E as the validator. I wrote that up in [Specs Drive. Tests Validate.](./specs-drive-tests-validate.md). AQ is the specialist layer on top when a conversational agent owns multi-turn state.

Within that stack, AQ sits between unit tests and full browser journeys:

1. **Unit tests** on the progress FSM and finalize rules (high coverage gate on the modules that own truth).
2. **Stub agent benchmarks** — scenario validators and report generation in CI without network.
3. **Live agent benchmarks** — opt-in, scored, min-threshold env var for local regression hunting.
4. **Stub E2E** — user can complete a flow in the browser with mocked LLM.
5. **Deployed integration** — real auth and API, selective journeys.

E2E proves the user can finish. AQ proves the agent **should** have finished correctly — that clarify counts, caps, and completion flags match policy for a known script.

Configurable agent policy (max clarifications per item, action on cap) is behavior, not admin chrome. When policy changes, scenarios change.

## What changed in my head

Prompt engineering is tuning. AQ engineering is instrumentation.

I still iterate on YAML and model choice. I no longer treat a fluent assistant message as evidence that the session is correct. I add a scenario when I find a new way for progress to lie. I run parity when I touch either copy of finalize logic. I keep replay fixtures from sessions that embarrassed me.

That is the same operating model I described in [Agents Draft. I Sign.](./07-agents-draft-i-sign.md): walk the bad session, loop through tests and benchmarks, sign only what the mechanisms support. The evaluation lab series taught me to measure model outputs. AQ extends that discipline to **multi-turn protocol** — the part of the product where the model is only one component.

If you build conversational agents and your test plan stops at "read the chat," you are grading fiction. Grade state.

## Takeaways

- **AQ is its own lane** — QA checks the app; AI eval checks outputs; AQ checks whether the agent followed caps, progress, and completion rules across turns.
- **Server-owned progress** — Models propose; deterministic finalize commits covered items, clarify counts, and partial sentinels. Assert on that object, not assistant prose.
- **Scenarios over screenshots** — YAML contracts with user scripts, answer kinds, and per-turn expectations are BDD for agents.
- **Negative paths are the catalog** — False clarifies, cap violations, digressions, and incomplete sessions belong in the suite beside happy paths.
- **Parity and bundles** — Agent-only green is insufficient; one headline score is insufficient. Run direct and gateway paths; track false clarifies, cap violations, and parity mismatches together.

## Related reading

- [Specs Drive. Tests Validate.](./specs-drive-tests-validate.md) — SDD + application QA at scale; AQ stacks on top, it does not replace E2E or specs.
- [Building an Evaluation Lab by Accident](./00-series-index.md) — compression faithfulness, NER benchmarks, gold data, public evidence.
- [Agents Draft. I Sign.](./07-agents-draft-i-sign.md) — walk, loop, sign: how I explore with agents first and constrain with mechanisms second.
- [ModernBERT and the Overlap Trap](./03-overlap-is-not-faithfulness.md) — why one green metric column is a trap (same lesson, single-shot outputs).
