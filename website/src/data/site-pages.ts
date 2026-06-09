/** Version and freshness markers for static site pages (not blog posts). */
export const sitePageMeta = {
  home: {
    version: "1.1",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-10"),
  },
  about: {
    version: "1.1",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-10"),
  },
  blog: {
    version: "1.1",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-10"),
  },
  projects: {
    version: "1.0",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-08"),
  },
  ner: {
    version: "1.0",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-08"),
  },
} as const;
