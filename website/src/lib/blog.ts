/** URL slug from content id `00-series-index.md` → `series-index`. */
export function postSlug(id: string): string {
  const base = id.replace(/\.md$/i, "");
  const m = base.match(/^\d+-(.+)$/);
  return m ? m[1] : base;
}
