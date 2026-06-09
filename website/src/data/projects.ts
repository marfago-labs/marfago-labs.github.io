export type ProjectStatus = "public" | "wip" | "private";

export interface Project {
  id: string;
  name: string;
  tagline: string;
  status: ProjectStatus;
  repo?: string;
  evidence?: { label: string; href: string }[];
  stack?: string[];
}

export const projects: Project[] = [
  {
    id: "ner-pipeline",
    name: "NER evaluation pipeline",
    tagline:
      "Gold data → validated datasets → backend benchmarks with Doc F1 and latency.",
    status: "public",
    stack: ["ner-gold-generator", "ner-dataset", "ner-detector"],
    evidence: [
      {
        label: "Dataset stats",
        href: "https://marfago-labs.github.io/ner-dataset/",
      },
      {
        label: "Benchmark report",
        href: "https://marfago-labs.github.io/ner-detector/",
      },
    ],
  },
  {
    id: "article-recommender",
    name: "ArticleRecommender",
    tagline:
      "Personal intelligence platform — ingest tech signal, investigate entities, synthesize briefings.",
    status: "wip",
    repo: "https://github.com/marfago-labs/ArticleRecommender",
    stack: ["FastAPI", "React", "Agno", "Postgres"],
  },
  {
    id: "text-compressor",
    name: "text-compressor",
    tagline:
      "Compress long transcripts before embedding; multi-metric faithfulness scorecard.",
    status: "wip",
    repo: "https://github.com/marfago-labs/text-compressor",
  },
  {
    id: "ner-gold-generator",
    name: "ner-gold-generator",
    tagline: "Entity-first gold generation with deterministic span anchoring.",
    status: "public",
    repo: "https://github.com/marfago-labs/ner-gold-generator",
  },
  {
    id: "ner-dataset",
    name: "ner-dataset",
    tagline: "Canonical benchmark JSONL and CI-validated integrity metrics.",
    status: "public",
    repo: "https://github.com/marfago-labs/ner-dataset",
    evidence: [
      {
        label: "Live stats",
        href: "https://marfago-labs.github.io/ner-dataset/",
      },
    ],
  },
  {
    id: "ner-detector",
    name: "ner-detector",
    tagline:
      "Pluggable NER backends — pattern, BERT, GLiNER, NuNER, LLM — compared on shared gold.",
    status: "public",
    repo: "https://github.com/marfago-labs/ner-detector",
    evidence: [
      {
        label: "Benchmark report",
        href: "https://marfago-labs.github.io/ner-detector/",
      },
    ],
  },
];

export const evidenceLinks = [
  {
    title: "Dataset quality dashboard",
    href: "https://marfago-labs.github.io/ner-dataset/",
    source: "ner-dataset CI",
  },
  {
    title: "NER backend benchmark",
    href: "https://marfago-labs.github.io/ner-detector/",
    source: "ner-detector CI",
  },
];
