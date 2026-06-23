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

/** GitHub Pages URLs for repo CI dashboards (live). */
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
        label: "Dataset stats dashboard",
        href: repoPages.nerDataset,
      },
      {
        label: "Benchmark report",
        href: repoPages.nerDetector,
      },
    ],
  },
  {
    id: "article-recommender",
    name: "ArticleRecommender",
    tagline:
      "Personal intelligence platform — ingest tech signal, investigate entities, synthesize briefings. WIP: no public repo or CI evidence yet.",
    status: "wip",
    stack: ["FastAPI", "React", "Agno", "Postgres"],
  },
  {
    id: "text-compressor",
    name: "text-compressor",
    tagline:
      "Compress long transcripts before embedding; multi-metric faithfulness scorecard. WIP: not open for public review yet.",
    status: "wip",
  },
  {
    id: "ner-gold-generator",
    name: "ner-gold-generator",
    tagline: "Entity-first gold generation with deterministic span anchoring.",
    status: "public",
    repo: "https://github.com/marfago-labs/ner-gold-generator",
    evidence: [
      {
        label: "Repo",
        href: "https://github.com/marfago-labs/ner-gold-generator",
      },
    ],
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
      {
        label: "Live stats dashboard",
        href: repoPages.nerDataset,
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
      {
        label: "Live benchmark report",
        href: repoPages.nerDetector,
      },
    ],
  },
];

export const evidenceLinks = [
  {
    title: "Dataset stats dashboard",
    href: repoPages.nerDataset,
    source: "ner-dataset CI → GitHub Pages",
    question:
      "Live integrity metrics on gold JSONL — validators run on every PR.",
  },
  {
    title: "NER benchmark report",
    href: repoPages.nerDetector,
    source: "ner-detector CI → GitHub Pages",
    question: "Doc F1 and latency across backends on shared gold.",
  },
  {
    title: "NER evaluation pipeline",
    href: "/projects/ner/",
    source: "ner-gold-generator → ner-dataset → ner-detector",
    question:
      "How gold is generated, validated, and benchmarked — all three repos are public.",
  },
];
