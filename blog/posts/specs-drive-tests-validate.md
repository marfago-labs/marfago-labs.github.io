---
title: "Specs Drive. Tests Validate."
slug: specs-drive-tests-validate
order: 9002
date: 2026-06-19
lastUpdated: 2026-06-21
version: "1.8"
description: How I build agent-written software I can trust — user stories and SDD as the driver, unit/integration/E2E as the validator, lifecycle matrices for multi-role journeys, AQ for agents.
cover: /blog/covers/specs-drive-tests-validate.png
coverAlt: A specification document with R1 and R2 flows through a guarded arrow into a three-tier test pyramid with checkmarks — specs drive, tests validate.
---

# Specs Drive. Tests Validate.

The assistant message read perfectly. The Playwright journey still failed on a 403. The unit test on the progress FSM caught a false clarify increment the chat never surfaced. Three different layers, three different failures — and I would have shipped if I had only read the transcript.

I am building a full-stack application in parallel with the open-source evaluation work in this lab. Almost every line is agent-drafted. What keeps it from becoming a demo is not better prompting. It is a loop I treat as non-negotiable: **write the spec first, encode acceptance in tests, let agents implement between those guardrails.** Agent quality work sits on top of that — it does not replace it.

## Context

**Specification-driven design (SDD)** here means product and engineering specs with explicit functional requirements, acceptance criteria, stable error codes, and often a testing section before implementation lands. The spec is the driver: it says what "done" means.

**QA** is the familiar application test pyramid: unit and component tests on business logic, API handler tests, browser E2E for user-visible flows, CI gates on coverage and lint. The tests are the validator for the spec's acceptance blocks.

**AQ (agent quality)** is the extra lane when conversational agents own multi-turn state. I covered that separately in [Agent Quality Engineering: Grade the Protocol, Not the Chat](./aq-better-ai-engineer.md). AQ validates protocol over turns; QA validates that the app lets the user finish.

| Lane | Drives or validates? | Question |
|------|----------------------|----------|
| SDD | **Drives** | What must be true when we ship? |
| QA | **Validates** | Does the application behave that way end-to-end? |
| AQ | **Validates** (agents only) | Does the agent obey caps, progress, and completion rules? |

Specs without tests are marketing. Tests without specs are archaeology. Agents without both are fast fiction.

<figure class="diagram">
  <img src="/blog/diagrams/specs-drive-stack.svg" alt="SDD drives acceptance criteria; agents draft implementation; CI signs; QA validates application behavior always; AQ validates agent protocol when agents are in the loop." width="400" height="444" loading="lazy" decoding="async" />
</figure>

## What the spec actually contains

On the application I am building, I keep specs under `docs/specs/` — not as decoration, but as the artifact agents read before they touch code. A typical SDD slice looks like this:

- **Functional requirements** numbered R1, R2, … (eligibility, create, mutate, finalize).
- **Acceptance** under each requirement — often concrete HTTP status, error code strings, immutability rules ("finalized resource rejects PATCH").
- **Out of scope** — so agents do not "helpfully" add scope.
- **Testing plan** on larger features — unit cases, integration journeys, explicit **negative** paths.

Example shape (abbreviated):

```markdown
### R1 — Eligibility

Only allow the workflow when preconditions are met (linked account, active session, required prior step completed).

**Acceptance:**
- Ineligible requests return 400 with stable error codes.
- Cross-principal access returns 404.

### R5 — Finalize

**Acceptance:**
- status becomes finalized; mutation endpoints return 400 afterward.
- Parent session and audit trail unchanged.
```

That is not prose for stakeholders only. It is the contract the next pull request must satisfy. When an agent proposes an implementation, I point it at the SDD section and say: make these acceptance bullets true.

Larger design docs add a **Testing plan** section before code: which routes get handler tests, which flows get Playwright integration, which negative cases must fail closed (unsupported upload, cross-owner access, sandbox mode must not create production records). The agent's job is to implement; my job is to ensure the plan becomes real tests, not a checklist in a forgotten doc.

## What the test pyramid looks like at scale

Order-of-magnitude numbers from the stack as it exists today — not to impress, but to show this is not "we should add tests later":

| Layer | Rough scale | Role |
|-------|-------------|------|
| Unit / component (`*.test.ts`, `*.test.tsx`) | **Hundreds of files** | Progress FSM, RBAC, validation, UI states, wizard steps |
| Python unit / benchmark (`test_*.py`) | **Dozens of files**, **600+** cases | Agent runtime, structured progress, scenario validators |
| Playwright E2E (`*.spec.ts`) | **Dozens of specs** | Stub journeys in CI; integration against real auth + deployed API |
| Agent scenarios (YAML) | **15+** gated paths | Clarify, cap, digression, parity — see AQ post |

CI runs static checks, workspace unit tests, stub E2E, and coverage gates (**≥95%** lines/statements/functions on the packages that own behavior). Live LLM benchmarks and full integration E2E are opt-in locally or in separate workflows — same distinction as stub vs live in the evaluation lab.

Role-based APIs need exhaustive negative cases and agents will not infer them from happy paths. One handler test file alone can exercise thousands of lines of in-process routing — not because I love big files, but because "works for admin" is not the same as "403 for the wrong role."

## How the three lanes connect on one feature

Take "user completes a multi-step workflow, then the result becomes immutable" as a thread through the stack:

1. **SDD** — R1 eligibility codes, R5 finalize immutability, R6 UI section distinct from the prior step's summary.
2. **Unit** — store rules, workspace helpers, 400 on writes after finalize.
3. **E2E** — browser journey: open the flow, complete steps, finalize; stub variant for CI without external auth.
4. **AQ** — not the primary gate for this feature (no multi-turn agent), but the conversational agent that *feeds* the workflow still has scenario coverage elsewhere.

The spec row is the spine. Tests are keyed to acceptance bullets, not to "we implemented something." Traceability tables (requirement id → route → page → status) stay honest about partial vs done so agents do not claim green on placeholders.

## Agents in the middle

I described the operating model in [Agents Draft. I Sign.](./07-agents-draft-i-sign.md): walk the problem, loop through mechanisms, sign what ships. On the full-stack application, that loop has a concrete split:

- **Agents draft** — components, handlers, tests, spec updates, infrastructure, Playwright helpers.
- **Specs drive** — I add or tighten SDD acceptance before trusting a new surface.
- **Tests validate** — CI is the signature; I do not merge on fluent chat alone.

Cursor rules in the private repo encode the same bar on every session: coverage floors, positive and negative scenarios, E2E for new behavior, no gaming gates. Agents did not choose that discipline; I did, and I made it machine-enforced so future agent sessions inherit it.

The failure mode I watch for is **spec lag**: an experiment harness prototypes a new FSM ahead of production, documented as tech debt until parity tests pass. That is acceptable temporarily. **Test lag** is not — if acceptance is written and there is no test, the agent can "satisfy" the spec in prose.

## AQ is not a substitute for QA

The AQ post focuses on grading **progress objects** across scripted user turns. That caught bugs no E2E would prioritize — a polite digression incrementing a clarify counter, cap applied one turn early.

E2E still matters. It catches auth wiring, wrong portal routing, CORS, and "button does not submit." AQ catches "session state lied while the UI smiled." You need both, plus unit tests on the deterministic finalize layer because that is where agents and servers must agree.

Stacked validation ladder I actually run after large changes:

1. Unit + coverage (fast, deterministic).
2. Stub Playwright (CI-shaped, no live external auth).
3. Deployed API smoke (liveness, auth, RBAC without starting the SPA).
4. Integration E2E (full journeys, optional when env is complete).
5. Live agent benchmark (opt-in, scored scenarios).

<figure class="diagram">
  <img src="/blog/diagrams/validation-ladder.svg" alt="Validation ladder: unit and coverage, stub Playwright, deployed API smoke, integration E2E, live agent benchmark opt-in." width="400" height="448" loading="lazy" decoding="async" />
</figure>

Skipping straight to step 5 because the product has an LLM is how teams ship confident chat and broken portals.

## Lifecycle coverage matrix (multi-role E2E)

The validation ladder says *when* to run stub Playwright versus deployed integration. It does not say *what* browser journeys must exist when **two roles share one resource** — book, move, cancel on the same schedulable slot, each from their own portal.

That surface is where agent-drafted E2E rots fastest. An agent adds another happy-path spec for role A. Role B still shows stale state. Or API tests catch the 409 overlap rule and nobody opens the other UI. Single-portal green is not cross-role truth.

I borrowed the AQ instinct — **executable contracts with stable ids** — and applied it to application E2E. Call it a **lifecycle coverage matrix**: one row per behavior the SDD claims, not one spec file per agent session.

Each row tracks:

- **ID** — grep-friendly (`A-BK-01`, `CHAIN-01`); test titles include `[MATRIX:<id>]`.
- **Actor** — role A, role B, or both in one chained journey.
- **Action** — what one side does in the product UI.
- **Other party sees** — what must be true on the other portal (or which stable error must *not* move state).
- **Polarity** — `+` happy path; `−` must fail closed (409, 403, empty slot grid).
- **Layers** — stub in CI always; integration when auth and deployed API are available. Honest gaps when policy exists in stub but not BFF yet.

Abbreviated shape from a dual-portal scheduling workflow I am building in parallel:

| ID | Actor | Action | Other party sees | ± | Stub | Integration |
|----|-------|--------|------------------|---|------|-------------|
| A-BK-01 | Role A | Book via UI | Role B lists same resource id | + | yes | yes |
| A-RS-02 | Role A | Move onto occupied slot | 409; neither view moves | − | yes | yes |
| A-CL-01 | Role A | Cancel booking | Role B agenda clears | + | yes | yes |
| B-RS-01 | Role B | Reschedule to free adjacent slot | Role A upcoming shows new start | + | yes | yes |
| EX-01 | Role A | Book during blocked window | Slot not offered | − | yes | yes |
| CHAIN-01 | Both | Book → A moves → B moves → B cancels | Sync after each step | + | yes | yes |

Mechanics that keep it from becoming wallpaper:

- **Canonical source** — matrix ids live in a typed module agents import; a markdown table mirrors it for humans and for SDD traceability.
- **Shared helpers** — one mutable stub both portals share; UI actions assert on **both** pages; integration adds an API parity poll where needed.
- **Out of matrix** — explicit table for related tests (projection drift, API-only edge cases, unit parity) so the matrix does not absorb every spec in the repo.

AQ scenarios grade agent **progress** over scripted user turns. The lifecycle matrix grades **shared application state** over scripted cross-role turns. Same discipline: deterministic script, authoritative object under test, negative rows beside happy paths.

When an agent proposes "add E2E for reschedule," I ask which matrix row it closes — or which row is missing from the table.

## Connect to marfago-labs

The evaluation lab already enforced the same instinct at smaller scale. [The Minimum Credible Loop](./01-i-didnt-want-another-bookmark-app.md) shipped ArticleRecommender Phase 1 with a **≥95% pytest gate** and Playwright E2E in CI. Posts 02–06 added benchmark validators, gold-data invariants, and public evidence for model outputs. [Did the Summary Keep the Important Bits?](./faithfulness-metrics-map.md) maps the compression scorecard in plain language for readers who want the four-check overview before the ResNet story in Part 3.

The full-stack application applies that discipline to product behavior: not only "is the compression faithful?" but "can the user register, complete the workflow, and hit the right error when they should not have access?" Same walk-loop-sign model; a wider surface and more E2E journeys.

## What changed in my head

"Better AI engineer" used to mean better prompts and model routing. On a multi-role product with agent-drafted code, it means **better spec writer** and **better QA engineer**, with **AQ** when agents own conversation state.

The evaluation lab taught me to measure compression and NER with public evidence. The application taught me that **shipping** requires the same rigor on specs and application tests — agents just produce more code per day, so the cost of missing a layer compounds faster.

Specs drive. Tests validate. Agents draft. I still sign.

## Takeaways

- **SDD is the driver** — Numbered requirements and acceptance criteria (status codes, error ids, immutability) are the contract agents implement against, not a slide deck.
- **QA is the validator** — Hundreds of unit tests and dozens of E2E specs enforce that contract; CI coverage gates make "agent wrote it" insufficient without proof.
- **AQ stacks on QA** — Multi-turn agent protocol needs scenario contracts and server-owned progress; it does not replace browser journeys or API auth tests.
- **Lifecycle matrix for multi-role E2E** — Stable ids, stub vs integration columns, and `[MATRIX:id]` titles so cross-portal book/move/cancel stays traceable; AQ scenarios for agents, matrix rows for shared UI state.
- **Honest traceability** — Partial vs done in requirement tables; tech debt when experiment FSM runs ahead of production — tests prevent silent drift.
- **Agents need mechanisms, not confidence** — Workspace rules and CI encode the bar so every agent session inherits the same definition of done.

## Related reading

- [Agents Draft. I Sign.](./07-agents-draft-i-sign.md) — walk, loop, sign operating model.
- [Agent Quality Engineering: Grade the Protocol, Not the Chat](./aq-better-ai-engineer.md) — scenarios, parity, progress truth (agent lane only).
- [The Minimum Credible Loop](./01-i-didnt-want-another-bookmark-app.md) — ArticleRecommender pytest + Playwright gates at lab scale.
- [Building an Evaluation Lab by Accident](./00-series-index.md) — public measurement infrastructure for model outputs.
