/** Version and freshness markers for static site pages (not blog posts). */
export const sitePageMeta = {
  home: {
    version: "1.3",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-19"),
  },
  about: {
    version: "1.3",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-19"),
  },
  blog: {
    version: "1.4",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-19"),
  },
  projects: {
    version: "1.1",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-13"),
  },
  ner: {
    version: "1.1",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-13"),
  },
} as const;
