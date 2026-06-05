const QUEUE_FOCUS_STORAGE_KEY = 'sentinel-queue-focus';
const QUEUE_SEARCH_STORAGE_KEY = 'sentinel-queue-search';
const STICKY_HEADER_OFFSET_PX = 96;

export type QueueReturnState = {
  queueSearch?: string;
  focusComplaintId?: string;
};

export type QueueNavigationType = 'POP' | 'PUSH' | 'REPLACE';

export type ResolveQueueFocusOptions = {
  state: unknown;
  /** React Router navigation type — POP covers browser back/forward within the SPA. */
  navigationType: QueueNavigationType;
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

export function isDocumentReload(): boolean {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return nav?.type === 'reload';
}

export function rememberQueueReturn(search: string, complaintId: string) {
  withSessionStorage((s) => {
    s.setItem(QUEUE_FOCUS_STORAGE_KEY, complaintId);
    s.setItem(QUEUE_SEARCH_STORAGE_KEY, search);
  }, undefined);
}

export function peekQueueFocus(): string | null {
  return withSessionStorage((s) => s.getItem(QUEUE_FOCUS_STORAGE_KEY), null);
}

export function peekQueueSearch(): string | null {
  const value = withSessionStorage((s) => s.getItem(QUEUE_SEARCH_STORAGE_KEY), null);
  if (!value) return null;
  return value.startsWith('?') ? value : `?${value}`;
}

export function clearQueueReturn() {
  withSessionStorage((s) => {
    s.removeItem(QUEUE_FOCUS_STORAGE_KEY);
    s.removeItem(QUEUE_SEARCH_STORAGE_KEY);
  }, undefined);
}

/** @deprecated Use rememberQueueReturn via buildQueueOpenState */
export function rememberQueueFocus(complaintId: string) {
  rememberQueueReturn('', complaintId);
}

/** @deprecated Use clearQueueReturn */
export function clearQueueFocus() {
  clearQueueReturn();
}

export function buildQueueOpenState(search: string, complaintId: string): QueueReturnState {
  rememberQueueReturn(search, complaintId);
  return { queueSearch: search, focusComplaintId: complaintId };
}

/** Restore focus when returning from detail (router state or browser back), not on refresh. */
export function resolveQueueFocusId({ state, navigationType }: ResolveQueueFocusOptions): string | null {
  const returnState = readQueueReturnState(state);
  if (returnState?.focusComplaintId) return returnState.focusComplaintId;
  if (isDocumentReload()) {
    clearQueueReturn();
    return null;
  }
  if (navigationType === 'POP') return peekQueueFocus();
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
