/** Version and freshness markers for static site pages (not blog posts). */
export const sitePageMeta = {
  home: {
    version: "1.4",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-23"),
  },
  about: {
    version: "1.4",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-23"),
  },
  blog: {
    version: "1.5",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-23"),
  },
  projects: {
    version: "1.2",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-23"),
  },
  ner: {
    version: "1.2",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-23"),
  },
} as const;
