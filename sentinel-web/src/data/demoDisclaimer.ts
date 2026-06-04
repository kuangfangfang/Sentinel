export const DEMO_DISCLAIMER_STORAGE_KEY = 'sentinel.demoDisclaimerAccepted.v1';
export const DEMO_DISCLAIMER_ACCEPTED_VALUE = 'accepted';

export const DEMO_DISCLAIMER_TEXT =
  'Sentinel is an independent demo. It is not affiliated with the Australian Human Rights Commission and does not provide legal advice.';

function getSessionStorage(storage?: Storage | null): Storage | null {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

export function hasAcceptedDemoDisclaimer(storage?: Storage | null): boolean {
  try {
    return getSessionStorage(storage)?.getItem(DEMO_DISCLAIMER_STORAGE_KEY) === DEMO_DISCLAIMER_ACCEPTED_VALUE;
  } catch {
    return false;
  }
}

export function acceptDemoDisclaimer(storage?: Storage | null): void {
  try {
    getSessionStorage(storage)?.setItem(DEMO_DISCLAIMER_STORAGE_KEY, DEMO_DISCLAIMER_ACCEPTED_VALUE);
  } catch {
    /* If session storage is unavailable, the current page view can still proceed. */
  }
}
