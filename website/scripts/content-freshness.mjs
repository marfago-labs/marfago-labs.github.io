/**
 * Pure helpers for content freshness bumps (no git / fs side effects).
 */

/** Site page .astro paths (repo-relative) → sitePageMeta key */
export const SITE_PAGE_MAP = {
  "website/src/pages/index.astro": "home",
  "website/src/pages/about.astro": "about",
  "website/src/pages/blog/index.astro": "blog",
  "website/src/pages/projects/index.astro": "projects",
  "website/src/pages/projects/ner.astro": "ner",
};

export const SITE_PAGES_META = "website/src/data/site-pages.ts";
export const BLOG_POST_RE = /^blog\/posts\/[^/]+\.md$/;

export function todayIsoLocal(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function bumpVersionPatch(version) {
  const m = String(version).match(/^(\d+)\.(\d+)$/);
  if (!m) return version;
  return `${m[1]}.${Number(m[2]) + 1}`;
}

export function splitFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { fm: "", body: raw };
  return { fm: match[1], body: match[2] };
}

/** Frontmatter + body, ignoring freshness-only fields. */
export function substantiveBlogContent(raw) {
  const { fm, body } = splitFrontmatter(raw);
  const fmCompare = fm
    .split("\n")
    .filter((line) => !/^(lastUpdated|version):\s*/.test(line))
    .join("\n")
    .trimEnd();
  return `${fmCompare}\n---\n${body.trimEnd()}`;
}

export function substantiveChanged(current, previous) {
  if (previous == null) return true;
  return substantiveBlogContent(current) !== substantiveBlogContent(previous);
}

export function readBlogLastUpdated(raw) {
  const { fm } = splitFrontmatter(raw);
  const last = fm.match(/^lastUpdated:\s*(\S+)/m);
  if (last) return last[1];
  const published = fm.match(/^date:\s*(\S+)/m);
  return published ? published[1] : null;
}

export function readSitePageLastUpdated(content, pageKey) {
  const blockRe = new RegExp(
    `${pageKey}:\\s*\\{[\\s\\S]*?lastUpdated:\\s*new Date\\("([^"]+)"\\)`,
  );
  const match = content.match(blockRe);
  return match ? match[1] : null;
}

/**
 * @param {{ date: string, content: string, parentContent: string | null }[]} commits newest first
 * @param {(current: string, previous: string | null) => boolean} isChanged
 */
export function findLastMeaningfulChange(commits, isChanged) {
  for (const commit of commits) {
    if (isChanged(commit.content, commit.parentContent)) {
      return commit.date;
    }
  }
  return commits.at(-1)?.date ?? null;
}

function setYamlField(fm, key, value, quoted = false) {
  const formatted = quoted ? `"${value}"` : value;
  const re = new RegExp(`^${key}:\\s*.*$`, "m");
  if (re.test(fm)) {
    return fm.replace(re, `${key}: ${formatted}`);
  }
  return `${fm}\n${key}: ${formatted}`;
}

export function applyBlogFreshness(raw, today) {
  const { fm, body } = splitFrontmatter(raw);
  let nextFm = setYamlField(fm, "lastUpdated", today);
  const versionMatch = nextFm.match(/^version:\s*"?([^"\n]+)"?/m);
  if (versionMatch) {
    nextFm = setYamlField(
      nextFm,
      "version",
      bumpVersionPatch(versionMatch[1]),
      true,
    );
  }
  return `---\n${nextFm}\n---\n${body}`;
}

export function bumpSitePageBlock(content, pageKey, today) {
  const blockRe = new RegExp(
    `(${pageKey}:\\s*\\{[\\s\\S]*?version:\\s*)"([^"]+)"([\\s\\S]*?lastUpdated:\\s*)new Date\\("([^"]+)"\\)`,
  );
  const match = content.match(blockRe);
  if (!match) return content;

  const newVersion = bumpVersionPatch(match[2]);
  if (match[4] === today && match[2] === newVersion) return content;

  return content.replace(
    blockRe,
    `$1"${newVersion}"$3new Date("${today}")`,
  );
}

export function normalizeRepoPath(filePath) {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

/**
 * @param {string[]} filePaths repo-relative paths
 * @param {{
 *   today?: string,
 *   readCurrent: (path: string) => string,
 *   readPrevious: (path: string) => string | null,
 *   writeCurrent: (path: string, content: string) => void,
 * }} io
 * @returns {string[]} paths that were updated
 */
export function bumpContentFreshnessPaths(filePaths, io) {
  const today = io.today ?? todayIsoLocal();
  const updated = [];
  const siteKeys = new Set();

  for (const rawPath of filePaths) {
    const rel = normalizeRepoPath(rawPath);

    if (BLOG_POST_RE.test(rel)) {
      const current = io.readCurrent(rel);
      const previous = io.readPrevious(rel);
      if (!substantiveChanged(current, previous)) continue;

      io.writeCurrent(rel, applyBlogFreshness(current, today));
      updated.push(rel);
      continue;
    }

    const siteKey = SITE_PAGE_MAP[rel];
    if (siteKey) {
      const current = io.readCurrent(rel);
      const previous = io.readPrevious(rel);
      if (previous != null && current === previous) continue;
      siteKeys.add(siteKey);
      updated.push(rel);
    }
  }

  if (siteKeys.size > 0) {
    const metaRel = SITE_PAGES_META;
    let meta = io.readCurrent(metaRel);
    for (const key of siteKeys) {
      meta = bumpSitePageBlock(meta, key, today);
    }
    io.writeCurrent(metaRel, meta);
    if (!updated.includes(metaRel)) updated.push(metaRel);
  }

  return updated;
}
