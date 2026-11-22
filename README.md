# marfago labs

This is the source of my site and blog. I'm Marco, a software engineer in Dublin. I've been building distributed systems and ML platforms for more than 25 years, and these days most of my time goes into agentic systems.

Most of what I write about comes from one question: when an AI system gives me an answer, how do I know it's right? The series [Building an Evaluation Lab by Accident](https://marfago-labs.github.io/blog/series-index/) tells how I got there.

## Projects

**[paper-research](https://github.com/marfago-labs/paper-research)** is a Claude Code plugin for finding, reading, and discussing research papers. It keeps notes and a knowledge graph in plain files, and every claim in the graph records where it came from and how it was checked.

**An NER evaluation pipeline**, in three parts:

- [ner-gold-generator](https://github.com/marfago-labs/ner-gold-generator) builds labelled datasets. Models propose the entities, and the code computes every offset from the source text, so no position is taken on trust.
- [ner-dataset](https://github.com/marfago-labs/ner-dataset) holds the datasets, with [quality statistics](https://marfago-labs.github.io/ner-dataset/).
- [ner-detector](https://github.com/marfago-labs/ner-detector) compares regex, BERT, GLiNER, NuNER, and LLM extractors on that data, and publishes the [results](https://marfago-labs.github.io/ner-detector/).

text-compressor and ArticleRecommender, which the blog series also covers, are still private.

## Working on the site

- `website/` is the Astro site. Preview it with `cd website && npm run dev` at <http://localhost:4321>, and run the unit and mutation tests with `npm test` and `npm run test:mutation` (see [website/docs/testing-mutation.md](website/docs/testing-mutation.md)).
- `blog/` holds the posts, covers, and diagrams.
- [`SETUP-PAGES.md`](SETUP-PAGES.md) describes publishing to [marcofago.com](https://marcofago.com) with GitHub Pages.
- `jev-lab/` (local only) is the harness for TypeSafe Jev over OpenRouter Decisions; its evidence goes in `jev-lab/docs/` before any post.

## Elsewhere

I write about what I learn here and on [LinkedIn](https://www.linkedin.com/in/marco-fago/). I was also a technical reviewer of [_Agentic Design Patterns_](https://www.amazon.com/Agentic-Design-Patterns-Hands-Intelligent/dp/3032014018) by Antonio Gulli.
