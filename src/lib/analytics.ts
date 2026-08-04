/**
 * Google Analytics 4 (gtag) — measurement ID shared by index.html + SPA pageviews.
 */
export const GA_MEASUREMENT_ID = 'G-2ZSKB61T3P';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Record a client-side navigation so every SPA surface is counted in GA4. */
export function trackSpaPageView(path: string, title: string): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
    send_to: GA_MEASUREMENT_ID,
  });
}
