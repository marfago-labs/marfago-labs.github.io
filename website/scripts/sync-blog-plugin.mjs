import path from "node:path";
import { blogSourceDirs, syncBlog } from "./sync-blog.mjs";

/** Keep Astro content in sync when blog/ sources change during dev. */
export function syncBlogPlugin() {
  let debounce;

  function runSync(server) {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const count = syncBlog({ quiet: true });
      if (count > 0) {
        server?.ws.send({ type: "full-reload" });
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
          runSync(server);
        }
      });
      server.watcher.on("add", (file) => {
        const normalized = path.normalize(file);
        if (blogSourceDirs.some((dir) => normalized.startsWith(path.normalize(dir)))) {
          runSync(server);
        }
      });
      server.watcher.on("unlink", (file) => {
        const normalized = path.normalize(file);
        if (blogSourceDirs.some((dir) => normalized.startsWith(path.normalize(dir)))) {
          runSync(server);
        }
      });
    },
  };
}
