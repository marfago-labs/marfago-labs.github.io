/** URL slug from content id `00-series-index.md` → `series-index`. */
export function postSlug(id: string): string {
  const base = id.replace(/\.md$/i, "");
  const m = base.match(/^\d+-(.+)$/);
  return m ? m[1] : base;
}

/** Standalone posts use order >= 9000 or omit series. */
export const STANDALONE_ORDER_MIN = 9000;

export function isStandalonePost(series?: string, order?: number): boolean {
  return !series || (order ?? 0) >= STANDALONE_ORDER_MIN;
}

export interface BlogPostEntry {
  id: string;
  data: {
    series?: string;
    order: number;
    title: string;
    description: string;
    date: Date;
    lastUpdated?: Date;
    version?: string;
    cover?: string;
    coverAlt?: string;
  };
}

/** Newest first. Posts of the same day sort by title, so their order is fixed. */
export function newestFirst(
  a: { data: { date: Date; title: string } },
  b: { data: { date: Date; title: string } },
): number {
  return (
    b.data.date.getTime() - a.data.date.getTime() ||
    a.data.title.localeCompare(b.data.title)
  );
}

export function partitionBlogPosts<T extends BlogPostEntry>(posts: T[]) {
  const series = posts.filter(
    (p) => !isStandalonePost(p.data.series, p.data.order),
  );
  const standalone = posts.filter((p) =>
    isStandalonePost(p.data.series, p.data.order),
  );
  series.sort((a, b) => a.data.order - b.data.order);
  // Standalone posts are independent, so the newest comes first.
  standalone.sort(newestFirst);
  return { series, standalone };
}

export function getActLabel(order: number, series?: string): string {
  if (!series) return "Standalone";
  if (order === 0) return "Prologue";
  if (order <= 2) return "Act I: The Illusion";
  if (order <= 4) return "Act II: The Reality Check";
  if (order <= 6) return "Act III: The Infrastructure";
  if (order <= 7) return "Act IV: The Philosophy";
  return "Act V: Back to the Product";
}

export function getPostMetaLabel(order: number, series?: string): string {
  if (order === 0) return "Series index";
  if (series) return `Part ${order}`;
  return "Standalone";
}
