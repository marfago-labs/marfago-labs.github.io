import fs from "node:fs";
import path from "node:path";
import {
  applyBlogFreshness,
  bumpSitePageBlock,
  findLastMeaningfulChange,
  normalizeRepoPath,
  readBlogLastUpdated,
  readSitePageLastUpdated,
  SITE_PAGE_MAP,
  SITE_PAGES_META,
  substantiveChanged,
} from "./content-freshness.mjs";

function isoAfter(candidate, stored) {
  if (!candidate) return false;
  if (!stored) return true;
  return candidate > stored;
}

export function backfillContentFreshness(opts) {
  const root = opts.repoRoot;
  const readFile = (rel) =>
    fs.readFileSync(path.join(root, rel), "utf8");
  const writeFile = (rel, content) =>
    fs.writeFileSync(path.join(root, rel), content);
  const historyFor = opts.historyFor;

  const updated = [];

  const blogDir = path.join(root, "blog/posts");
  if (fs.existsSync(blogDir)) {
    for (const name of fs.readdirSync(blogDir).sort()) {
      if (!name.endsWith(".md")) continue;
      const rel = normalizeRepoPath(`blog/posts/${name}`);
      const current = readFile(rel);
      const stored = readBlogLastUpdated(current);
      const lastChange = findLastMeaningfulChange(
        historyFor(rel),
        substantiveChanged,
      );
      if (!isoAfter(lastChange, stored)) continue;

      writeFile(rel, applyBlogFreshness(current, lastChange));
      updated.push(rel);
    }
  }

  const metaRel = SITE_PAGES_META;
  const metaPath = path.join(root, metaRel);
  if (fs.existsSync(metaPath)) {
    let meta = readFile(metaRel);
    let metaDirty = false;

    for (const [pagePath, pageKey] of Object.entries(SITE_PAGE_MAP)) {
      const rel = normalizeRepoPath(pagePath);
      if (!fs.existsSync(path.join(root, rel))) continue;

      const stored = readSitePageLastUpdated(meta, pageKey);
      const lastChange = findLastMeaningfulChange(
        historyFor(rel),
        (current, previous) => previous == null || current !== previous,
      );
      if (!isoAfter(lastChange, stored)) continue;

      const next = bumpSitePageBlock(meta, pageKey, lastChange);
      if (next !== meta) {
        meta = next;
        metaDirty = true;
        updated.push(rel);
      }
    }

    if (metaDirty) {
      writeFile(metaRel, meta);
      if (!updated.includes(metaRel)) updated.push(metaRel);
    }
  }

  return updated;
}
