export type ProjectStatus = "public" | "wip" | "private";

export interface Project {
  id: string;
  name: string;
  tagline: string;
  status: ProjectStatus;
  repo?: string;
  overviewHref?: string;
  evidence?: { label: string; href: string }[];
  stack?: string[];
}

/** GitHub Pages URLs for repo CI dashboards — reachable when the repo is public. */
export const repoPages = {
  nerDataset: "https://marfago-labs.github.io/ner-dataset/",
  nerDetector: "https://marfago-labs.github.io/ner-detector/",
} as const;

export const projects: Project[] = [
  {
    id: "ner-pipeline",
    name: "NER evaluation pipeline",
    tagline:
      "Gold data → validated datasets → backend benchmarks with Doc F1 and latency.",
    status: "public",
    repo: "https://github.com/marfago-labs/ner-gold-generator",
    overviewHref: "/projects/ner/",
    stack: ["ner-gold-generator", "ner-dataset", "ner-detector"],
    evidence: [
      {
        label: "ner-dataset repo",
        href: "https://github.com/marfago-labs/ner-dataset",
      },
      {
        label: "ner-detector repo",
        href: "https://github.com/marfago-labs/ner-detector",
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
        label: "Repo",
        href: "https://github.com/marfago-labs/ner-dataset",
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
        label: "Repo",
        href: "https://github.com/marfago-labs/ner-detector",
      },
    ],
  },
];

export const evidenceLinks = [
  {
    title: "NER evaluation pipeline",
    href: "/projects/ner/",
    source: "ner-gold-generator → ner-dataset → ner-detector",
    question:
      "How gold is generated, validated, and benchmarked — repos and CI dashboards when public.",
  },
  {
    title: "Dataset & benchmark repos",
    href: "https://github.com/marfago-labs/ner-dataset",
    source: "GitHub",
    question:
      "Source JSONL, CI validators, and Pages reports on marfago-labs.github.io when repos are public.",
  },
];
