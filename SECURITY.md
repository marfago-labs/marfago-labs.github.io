# Security and secrets handling

Guidance for the **marfago-labs** workspace (org hub + nested project repos).

## Never commit

| Path / pattern | Repo | Why |
|----------------|------|-----|
| `.env` (not `.env.example`) | All Python/Node projects | Live API keys and tokens |
| `gold.log`, `configs/logs_tmp/` | ner-gold-generator | LLM prompt/response traces |
| `benchmark/results/` | ner-detector | Local benchmark runs (may embed machine paths) |
| `text-compressor/results/` | text-compressor | Compression run artifacts with full source excerpts |
| `backend/data/` | ArticleRecommender | Local runtime settings |
| `website/coverage/` | marfago-labs (root) | Generated Vitest coverage HTML |
| `blog/_archive/` | marfago-labs (root) | Internal dev notes — not for public publish |

Use **`.env.example`** only as empty templates. Copy to `.env` locally; never push `.env`.

## Pre-commit and CI

- **Gitleaks** runs in CI and via pre-commit on repos that configure it.
- **Large-file hook** (5120 KB) blocks accidental staging of trace logs such as `gold.log`.
- **Benchmark CI** rejects reports containing Windows drive-letter paths (`[A-Za-z]:\`).

## Full history audit (all commits)

Run across every local repo in the workspace:

```powershell
.\scripts\audit-git-history.ps1
```

The script runs **gitleaks** on full history, checks for `.env` commits, secret patterns in patches, machine-local Windows path leaks (drive letters and user-profile directories), sensitive filenames, large blobs, and currently tracked sensitive paths. Reports are written to `scripts/audit-reports/` (gitignored). Exit code **0** only when there are zero BLOCK findings.

## If a key is exposed

1. **Rotate** at the provider immediately (OpenRouter, Hugging Face, YouTube Data API, etc.).
2. **Scan history:** `gitleaks detect --source . --config .gitleaks.toml --verbose`
3. **Check `.env` commits:** `git log --all --full-history -- ".env" ".env.*"`
4. History rewrite (`git filter-repo`, BFG) only with explicit approval — prefer rotation first.

## Agent / IDE boundary

[`.cursorignore`](.cursorignore) keeps `.env` and credential material out of agent context. Nested repos also gitignore `.env`.

## Local-only credentials (expected on disk)

These may exist locally but must **not** appear in `git ls-files`:

- `ArticleRecommender/.env` — OpenRouter, YouTube, HF, database URL
- `ner-detector/.env` — optional `HF_TOKEN`, `OPENROUTER_API_KEY`
- `text-compressor/.env`, `ner-gold-generator/.env` — optional OpenRouter

## Published reports

Benchmark reports (`ner-detector/docs/benchmark-report/`, GitHub Pages) must use **repo-relative paths** only (e.g. `benchmark/config/compare_backends.yaml`), never absolute Windows paths.
