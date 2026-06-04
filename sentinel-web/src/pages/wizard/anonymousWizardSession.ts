const SESSION_VERSION = 1;
const SESSION_KEY = 'sentinel.anonymousWizard.v1';

export interface AnonymousWizardSession<TValues = Record<string, unknown>> {
  step: number;
  values: TValues;
}

interface StoredAnonymousWizardSession<TValues = Record<string, unknown>> extends AnonymousWizardSession<TValues> {
  version: number;
}

export function getAnonymousWizardStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveAnonymousWizardSession<TValues>(storage: Storage | null | undefined, step: number, values: TValues): void {
  if (!storage || !isValidStep(step)) return;
  const payload: StoredAnonymousWizardSession<TValues> = {
    version: SESSION_VERSION,
    step,
    values,
  };
  storage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function readAnonymousWizardSession<TValues = Record<string, unknown>>(
  storage: Storage | null | undefined,
): AnonymousWizardSession<TValues> | null {
  if (!storage) return null;
  const raw = storage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredAnonymousWizardSession<TValues>>;
    if (parsed.version !== SESSION_VERSION || !isValidStep(parsed.step) || !parsed.values) return null;
    return {
      step: parsed.step,
      values: parsed.values,
    };
  } catch {
    return null;
  }
}

export function clearAnonymousWizardSession(storage: Storage | null | undefined): void {
  storage?.removeItem(SESSION_KEY);
}

function isValidStep(step: unknown): step is number {
  return typeof step === 'number' && Number.isInteger(step) && step >= 1 && step <= 5;
}
