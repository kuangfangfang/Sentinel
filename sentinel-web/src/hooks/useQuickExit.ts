import { useEffect, useRef } from 'react';

// The neutral destination a user is sent to on quick exit (SRS 13.3 leaves the
// exact site to the implementer). A Google weather search is innocuous and familiar.
export const QUICK_EXIT_URL = 'https://www.google.com/search?q=weather';

export function isQuickExitKey(e: Pick<KeyboardEvent, 'key' | 'code'>): boolean {
  return e.key === 'Escape' || e.key === 'Esc' || e.code === 'Escape';
}

/**
 * Leaves Sentinel immediately and replaces the current history entry so the
 * browser Back button does not return to the site (FR-37, AC-11).
 */
export function quickExit(): void {
  try {
    window.location.replace(QUICK_EXIT_URL);
  } catch {
    window.location.href = QUICK_EXIT_URL;
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
      if (!isQuickExitKey(e)) return;
      const now = Date.now();
      if (now - lastEscape.current < 500) {
        lastEscape.current = 0;
        e.preventDefault();
        e.stopPropagation();
        quickExit();
      } else {
        lastEscape.current = now;
      }
    }
    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', onKeyDown, { capture: true });
  }, []);
}
