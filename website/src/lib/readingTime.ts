/** Average adult reading speed for technical prose (words per minute). */
export const WORDS_PER_MINUTE = 200;

/** Strip fenced and inline code so reading time reflects prose, not snippets. */
function stripCode(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]+`/g, " ");
}

export function countWords(text: string): number {
  const prose = stripCode(text)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!prose) return 0;
  return prose.split(/\s+/).length;
}

export function readingMinutes(
  text: string,
  wpm: number = WORDS_PER_MINUTE,
): number {
  const words = countWords(text);
  if (words === 0) return 1;
  return Math.max(1, Math.ceil(words / wpm));
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}

export function pageReadingLabel(pageName: string, prose: string): string {
  return `${pageName} · ${formatReadingTime(readingMinutes(prose))}`;
}
