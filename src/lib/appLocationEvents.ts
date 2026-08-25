/** Soft SPA navigation helpers shared by landing CTAs and useAppNavigation. */

export const PREPX_LOCATION_EVENT = 'prepx:location';

export function notifyAppLocationChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PREPX_LOCATION_EVENT));
}
