import { useEffect, useRef } from 'react';

// The neutral destination a user is sent to on quick exit (SRS 13.3 leaves the
// exact site to the implementer). A weather site is innocuous and loads fast.
const NEUTRAL_URL = 'https://www.bom.gov.au';

/**
 * Leaves Sentinel immediately and replaces the current history entry so the
 * browser Back button does not return to the site (FR-37, AC-11).
 */
export function quickExit(): void {
  try {
    window.location.replace(NEUTRAL_URL);
  } catch {
    window.location.href = NEUTRAL_URL;
  }
}

/**
 * Binds the double-Escape keyboard shortcut to quick exit (FR-38). Two presses of
 * Escape within 500 ms trigger it; a single Escape does nothing (so it doesn't
 * fight normal "close dialog" behaviour).
 */
export function useDoubleEscapeQuickExit(): void {
  const lastEscape = useRef<number>(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      const now = Date.now();
      if (now - lastEscape.current < 500) {
        lastEscape.current = 0;
        quickExit();
      } else {
        lastEscape.current = now;
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
