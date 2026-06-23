# marfago labs

### Code is cheap now. Judgment isn't.

I'm **Marco Fago** ([@marfago](https://github.com/marfago)) - a **principal AI engineer** in Dublin. For more than 25 years I've shipped distributed systems and ML platforms; today I lead and build agentic systems where **humans stay accountable** for what ships.

Principal engineer in practice: I set technical direction, raise the quality bar, and still ship.

**marfago-labs** is not a product portfolio. It is my **manifesto in motion** - where I pressure-test how I think before those patterns earn a place in production.

The shift I care about: **natural language is the new interface to the system** - specs, constraints, context. The implementation is generated, revised, and discarded. What compounds is whether the *intent* stayed true and whether you can *prove* it.

## Featured engineering

### NER benchmark pipeline (public)

**[ner-gold-generator](https://github.com/marfago-labs/ner-gold-generator)** and **[ner-dataset](https://github.com/marfago-labs/ner-dataset)** form a production-style NER data pipeline from generation to benchmark-ready gold files.

- **Hard problem solved:** avoid LLM offset hallucinations with entity-first planning and deterministic span anchoring.
- **Quality controls:** strict validation (exact and unique spans), multi-pass consensus labeling, and integrity metrics per dataset.
- **Engineering bar:** coverage gate (95%+), typed Python, pre-commit checks, Gitleaks secret scanning in CI, and CI workflows on every repo.
- **Evidence:** live dataset quality dashboard at [marfago-labs.github.io/ner-dataset](https://marfago-labs.github.io/ner-dataset/).

---

## Tenets

*Not slogans - tradeoffs I argue for in design review.*

### 1 · Intent is the source code

The spec, the constraints, the context - *that* is the durable artifact. Generated code is exhaust. I invest in the *what* and the *why*.

*Even over the how.*

### 2 · No metric, no merit

A demo proves nothing. A screenshot proves less. Claims need evidence: benchmarks, gold data, falsifiable checks.

*Even over momentum.*

### 3 · Complexity is debt - and AI lends at a brutal rate

Velocity can lie: output may grow faster than understanding. I watch for *complexity injection* - volume that looks like progress but raises the cost of every change after.

*Even over raw throughput.*

### 4 · Orchestrate, never abdicate

Agents plan, draft, and execute. I own failure modes, edge cases, and the signature at the bottom. Automation amplifies judgment - it does not replace it.

### 5 · Build only what earns trust

If I would not rely on it under scrutiny, it is not done. Use it, stress it, or cut it.

---

## How I work

Engineering as **information processing under constraints** - for teams, for users, and for models that read the same artifacts we do.

- **Articulate before you automate.** Written intent is how alignment survives handoffs, rewrites, and model drift.
- **Decompose until you can verify.** Large bets become steps you can inspect, score, and roll back.
- **Make disagreement cheap.** Interfaces and evidence that let others challenge assumptions without replaying your whole stack.
- **Teach the system, not just the team.** If the design cannot be explained plainly, it cannot be owned or maintained.
- **Stay curious, stay skeptical.** Curiosity finds leverage; skepticism keeps leverage honest.

---

## What I optimize for

Over a career, not a sprint.

- **Truth over theatre** - report the bad number; fix it.
- **Systems over heroics** - platforms outlive launches.
- **Human agency in the loop** - AI widens what one engineer can ship responsibly; it does not dissolve accountability.

---

## This lab

**marfago-labs** is where these tenets get exercised under real constraints - agents, evaluation, long-form knowledge, and the gap between a demo and something you would bet on.

The code is evidence. This page is the argument.

**Site:** `website/` — local preview with `cd website && npm run dev` → http://localhost:4321. Publish via [`SETUP-PAGES.md`](SETUP-PAGES.md) to [marfago-labs.github.io](https://marfago-labs.github.io).

**Public:** [ner-gold-generator](https://github.com/marfago-labs/ner-gold-generator), [ner-dataset](https://github.com/marfago-labs/ner-dataset) ([stats](https://marfago-labs.github.io/ner-dataset/)), [ner-detector](https://github.com/marfago-labs/ner-detector) ([benchmark](https://marfago-labs.github.io/ner-detector/)).

**Work in progress:** ArticleRecommender and text-compressor — central to the blog series, not open for public review yet.

---

## Elsewhere

[LinkedIn](https://www.linkedin.com/in/marco-fago/) - where I think in public.
[@marfago](https://github.com/marfago) - experiments and open contributions.
[marfago-labs](https://github.com/marfago-labs) - the lab on GitHub.

Technical reviewer of [*Agentic Design Patterns*](https://www.amazon.com/Agentic-Design-Patterns-Hands-Intelligent/dp/3032014018) (Antonio Gulli).
