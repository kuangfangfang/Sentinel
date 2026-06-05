const QUEUE_FOCUS_STORAGE_KEY = 'sentinel-queue-focus';
const STICKY_HEADER_OFFSET_PX = 96;

export type QueueReturnState = {
  queueSearch?: string;
  focusComplaintId?: string;
};

export function readQueueReturnState(state: unknown): QueueReturnState | null {
  if (!state || typeof state !== 'object') return null;
  return state as QueueReturnState;
}

function withSessionStorage<T>(run: (storage: Storage) => T, fallback: T): T {
  try {
    return run(sessionStorage);
  } catch {
    return fallback;
  }
}

export function getNavigationType(): PerformanceNavigationTiming['type'] | 'unknown' {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return nav?.type ?? 'unknown';
}

export function rememberQueueFocus(complaintId: string) {
  withSessionStorage((s) => s.setItem(QUEUE_FOCUS_STORAGE_KEY, complaintId), undefined);
}

export function peekQueueFocus(): string | null {
  return withSessionStorage((s) => s.getItem(QUEUE_FOCUS_STORAGE_KEY), null);
}

export function clearQueueFocus() {
  withSessionStorage((s) => s.removeItem(QUEUE_FOCUS_STORAGE_KEY), undefined);
}

export function buildQueueOpenState(search: string, complaintId: string): QueueReturnState {
  rememberQueueFocus(complaintId);
  return { queueSearch: search, focusComplaintId: complaintId };
}

/** Only restore focus when returning from detail (router state or browser back), not on refresh. */
export function resolveQueueFocusId(state: unknown): string | null {
  const returnState = readQueueReturnState(state);
  if (returnState?.focusComplaintId) return returnState.focusComplaintId;
  if (getNavigationType() === 'back_forward') return peekQueueFocus();
  clearQueueFocus();
  return null;
}

export function findVisibleQueueItem(complaintId: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-queue-item="${complaintId}"]`);
  for (const node of nodes) {
    if (node.getBoundingClientRect().height > 0) return node;
  }
  return nodes[0] ?? null;
}

/** Table rows ignore scrollIntoView per-row; centre the row with an explicit window scroll. */
export function scrollQueueItemIntoView(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const top =
    rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2 - STICKY_HEADER_OFFSET_PX;
  window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
}
