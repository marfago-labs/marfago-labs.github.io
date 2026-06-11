import path from "node:path";
import { blogSourceDirs, clearAstroContentCache, diagramsSrc, syncBlog } from "./sync-blog.mjs";

/** Keep Astro content in sync when blog/ sources change during dev. */
export function syncBlogPlugin() {
  let debounce;

  function isDiagramFile(file) {
    const normalized = path.normalize(file);
    return normalized.startsWith(path.normalize(diagramsSrc));
  }

  function runSync(server, file) {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      try {
        const invalidateDiagramCache = file ? isDiagramFile(file) : false;
        const count = syncBlog({ quiet: true, invalidateDiagramCache });
        if (invalidateDiagramCache) {
          clearAstroContentCache();
        }
        if (count > 0) {
          server?.ws.send({ type: "full-reload" });
        }
      } catch (err) {
        console.warn(`sync-blog: ${err instanceof Error ? err.message : err}`);
      }
    }, 80);
  }

  return {
    name: "sync-blog",
    buildStart() {
      syncBlog({ quiet: true });
    },
    configureServer(server) {
      syncBlog({ quiet: true });
      for (const dir of blogSourceDirs) {
        server.watcher.add(dir);
      }
      server.watcher.on("change", (file) => {
        const normalized = path.normalize(file);
        if (blogSourceDirs.some((dir) => normalized.startsWith(path.normalize(dir)))) {
          runSync(server, file);
        }
      });
      server.watcher.on("add", (file) => {
        const normalized = path.normalize(file);
        if (blogSourceDirs.some((dir) => normalized.startsWith(path.normalize(dir)))) {
          runSync(server, file);
        }
      });
      server.watcher.on("unlink", (file) => {
        const normalized = path.normalize(file);
        if (blogSourceDirs.some((dir) => normalized.startsWith(path.normalize(dir)))) {
          runSync(server, file);
        }
      });
    },
  };
}
