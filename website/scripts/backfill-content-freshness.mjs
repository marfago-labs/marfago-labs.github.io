#!/usr/bin/env node
/** One-shot: align lastUpdated with last substantive git change per file. */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { backfillContentFreshness } from "./backfill-logic.mjs";
import { normalizeRepoPath } from "./content-freshness.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(websiteRoot, "..");

function gitShow(ref, repoRelativePath) {
  const gitPath = normalizeRepoPath(repoRelativePath);
  try {
    return execSync(`git show ${ref}:${gitPath}`, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

function gitCommitHistory(repoRelativePath) {
  const gitPath = normalizeRepoPath(repoRelativePath);
  let hashes;
  try {
    hashes = execSync(`git log --follow --format=%H -- ${gitPath}`, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }

  return hashes.map((hash, index) => ({
    date: execSync(`git log -1 --format=%ad --date=short ${hash}`, {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim(),
    content: gitShow(hash, repoRelativePath),
    parentContent:
      index < hashes.length - 1
        ? gitShow(hashes[index + 1], repoRelativePath)
        : null,
  }));
}

/* v8 ignore start */
const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  const changed = backfillContentFreshness({
    repoRoot,
    historyFor: gitCommitHistory,
  });
  if (changed.length > 0) {
    console.log(
      `backfill-content-freshness: updated ${changed.length} file(s): ${changed.join(", ")}`,
    );
  } else {
    console.log("backfill-content-freshness: all dates already current");
  }
}
/* v8 ignore stop */
