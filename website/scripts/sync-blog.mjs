#!/usr/bin/env node
/** Copy blog posts from monorepo blog/ and rewrite internal links for the site. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.resolve(root, "..", "blog", "posts");
const destDir = path.resolve(root, "src", "content", "blog");

function parseSlug(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  for (const line of match[1].split("\n")) {
    const m = line.match(/^slug:\s*"?([^"\n]+)"?/);
    if (m) return m[1].trim();
  }
  return null;
}

function rewriteLinks(body, fileToSlug) {
  let out = body;
  for (const [file, slug] of Object.entries(fileToSlug)) {
    const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(
      new RegExp(`\\]\\(\\./${escaped}\\)`, "g"),
      `](/blog/${slug}/)`,
    );
  }
  return out;
}

if (!fs.existsSync(srcDir)) {
  console.warn(`sync-blog: source missing (${srcDir}); skipping`);
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });
for (const old of fs.readdirSync(destDir)) {
  if (old.endsWith(".md")) fs.unlinkSync(path.join(destDir, old));
}

const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".md"));
const fileToSlug = {};
for (const file of files) {
  const raw = fs.readFileSync(path.join(srcDir, file), "utf8");
  const slug = parseSlug(raw);
  if (slug) fileToSlug[file] = slug;
}

for (const file of files) {
  const raw = fs.readFileSync(path.join(srcDir, file), "utf8");
  const parts = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!parts) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    continue;
  }
  const [, fm, body] = parts;
  const rewritten = rewriteLinks(body, fileToSlug);
  fs.writeFileSync(path.join(destDir, file), `---\n${fm}\n---\n${rewritten}`);
}

console.log(`sync-blog: synced ${files.length} posts → src/content/blog/`);
