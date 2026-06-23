#!/usr/bin/env node
/** Pre-commit entry: bump lastUpdated when substantive content changes. */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  bumpContentFreshnessPaths,
  normalizeRepoPath,
} from "./content-freshness.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(websiteRoot, "..");

function gitShow(ref, repoRelativePath, root = repoRoot) {
  const gitPath = normalizeRepoPath(repoRelativePath);
  try {
    return execSync(`git show ${ref}:${gitPath}`, {
      cwd: root,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

function readWorkingFile(repoRelativePath, root) {
  return fs.readFileSync(path.join(root, repoRelativePath), "utf8");
}

function writeWorkingFile(repoRelativePath, content, root) {
  fs.writeFileSync(path.join(root, repoRelativePath), content);
}

export function bumpContentFreshness(filePaths, opts = {}) {
  const root = opts.repoRoot ?? repoRoot;
  const readPrevious =
    opts.readPrevious ?? ((p) => gitShow("HEAD", normalizeRepoPath(p), root));

  return bumpContentFreshnessPaths(filePaths, {
    today: opts.today,
    readCurrent: (p) => readWorkingFile(p, root),
    readPrevious,
    writeCurrent: (p, content) => writeWorkingFile(p, content, root),
  });
}

/* v8 ignore start */
const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  const files = process.argv.slice(2);
  if (files.length === 0) process.exit(0);

  const changed = bumpContentFreshness(files);
  if (changed.length > 0) {
    console.log(
      `bump-content-freshness: updated ${changed.length} file(s): ${changed.join(", ")}`,
    );
  }
}
/* v8 ignore stop */
