// Thin typed wrapper around fetch. Knows the API base URL and automatically
// attaches the JWT to every request (guide §6.1). The contract between the two
// halves of the app is checked by TypeScript via the shared interfaces in ../types.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5187/api';
const TOKEN_KEY = 'sentinel_token';

// Token is held in memory and mirrored to sessionStorage (clears when the browser
// closes — a deliberate choice over localStorage, guide §6.3 / SRS 6).
let authToken: string | null = sessionStorage.getItem(TOKEN_KEY);

export function setToken(token: string | null): void {
  authToken = token;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return authToken;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  correlationId?: string;

  constructor(message: string, status: number, errors?: Record<string, string[]>, correlationId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.correlationId = correlationId;
  }

  /** Flattened, human-readable list of field validation messages, if any. */
  get fieldMessages(): string[] {
    if (!this.errors) return [];
    return Object.values(this.errors).flat();
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  const isForm = options.body instanceof FormData;
  if (!isForm && options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: isForm ? (options.body as FormData) : options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  if (response.status === 401) {
    // Token missing/expired — clear it and let the app react (AuthContext listens).
    setToken(null);
    window.dispatchEvent(new CustomEvent('sentinel:unauthorized'));
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? safeParse(text) : null;

  if (!response.ok) {
    const message = (data && (data.message as string)) || defaultMessage(response.status);
    throw new ApiError(message, response.status, data?.errors, data?.correlationId);
  }
  return data as T;
}

function safeParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function defaultMessage(status: number): string {
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'Not found.';
  if (status >= 500) return 'Something went wrong on our side. Please try again.';
  return 'Request failed.';
}
