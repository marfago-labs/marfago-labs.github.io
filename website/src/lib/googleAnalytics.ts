/** GA4 measurement IDs look like G-XXXXXXXXXX. */
export function isValidGaMeasurementId(id: string): boolean {
  return /^G-[A-Z0-9]+$/i.test(id.trim());
}

export function shouldEnableGoogleAnalytics(
  isProd: boolean,
  measurementId: string,
): boolean {
  const id = measurementId.trim();
  return isProd && id.length > 0 && isValidGaMeasurementId(id);
}

export function gtagScriptSrc(measurementId: string): string {
  return `https://www.googletagmanager.com/gtag/js?id=${measurementId.trim()}`;
}
