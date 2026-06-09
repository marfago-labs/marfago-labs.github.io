export function formatPageDate(date: Date): string {
  return date.toLocaleDateString("en-IE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatPageStamp(opts: {
  version: string;
  published?: Date;
  lastUpdated: Date;
}): string {
  const published = opts.published ?? opts.lastUpdated;
  const sameDay = published.toDateString() === opts.lastUpdated.toDateString();
  const version = `v${opts.version}`;

  if (sameDay) {
    return `${version} · ${formatPageDate(published)}`;
  }

  return `${version} · Published ${formatPageDate(published)} · Updated ${formatPageDate(opts.lastUpdated)}`;
}
