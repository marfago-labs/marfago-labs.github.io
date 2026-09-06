/** Public Search Console HTML-tag token. Must appear in every page `<head>`. */
export const GOOGLE_SITE_VERIFICATION_TOKEN =
  "sJg7T8DTZ-L-b2r4jbEYMCuKVZ6_Cd311AdeAy-5qQ8";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,}$/;

export function isValidGoogleSiteVerificationToken(token: string): boolean {
  return TOKEN_PATTERN.test(token.trim());
}

export function googleSiteVerificationContent(token: string): string | null {
  const content = token.trim();
  if (!isValidGoogleSiteVerificationToken(content)) {
    return null;
  }
  return content;
}
