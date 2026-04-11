type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  // Optional token override (e.g., mobile/native) if provided
  token?: string;
  // Pass-through fetch options if needed (cache, next tags, etc.)
  fetchOptions?: Omit<RequestInit, 'method' | 'body' | 'headers'>;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split(';').find((c) => c.trim().startsWith(`${CSRF_COOKIE}=`));
  return match ? match.split('=')[1]?.trim() ?? null : null;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    token,
    fetchOptions,
  } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Attach auth header only if a token is available (cookies will flow automatically)
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  // Add CSRF header for mutating requests in the browser
  if (typeof window !== 'undefined' && method !== 'GET' && method !== 'HEAD') {
    const csrf = getCsrfToken();
    if (csrf) {
      finalHeaders[CSRF_HEADER] = csrf;
    }
  }

  const makeRequest = async () =>
    fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
    ...fetchOptions,
    });

  const response = await makeRequest();

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const parsed = isJson ? await response.json() : null;

  if (!response.ok) {
    // Normalize error shape
    const message =
      (parsed && (parsed.message || parsed.error)) ||
      `${response.status} ${response.statusText}` ||
      'Request failed';
    // If unauthorized, try a single refresh then retry once.
    if (response.status === 401 && typeof window !== 'undefined' && path !== '/api/auth/refresh') {
      try {
        const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (refreshRes.ok) {
          const retry = await makeRequest();
          const retryIsJson = retry.headers.get('content-type')?.includes('application/json');
          const retryParsed = retryIsJson ? await retry.json() : null;
          if (retry.ok) return retryParsed as T;
        }
      } catch {
        // fall through to logout below
      }

      try {
        window.localStorage.removeItem('user');
      } catch {
        // ignore storage errors
      }
      window.location.href = '/login';
    }
    throw new Error(message);
  }

  return parsed as T;
}

export const apiClient = {
  get: <T>(path: string, fetchOptions?: RequestOptions['fetchOptions']) =>
    apiRequest<T>(path, { method: 'GET', fetchOptions }),
  post: <T>(path: string, body?: unknown, fetchOptions?: RequestOptions['fetchOptions']) =>
    apiRequest<T>(path, { method: 'POST', body, fetchOptions }),
  put: <T>(path: string, body?: unknown, fetchOptions?: RequestOptions['fetchOptions']) =>
    apiRequest<T>(path, { method: 'PUT', body, fetchOptions }),
  delete: <T>(path: string, fetchOptions?: RequestOptions['fetchOptions']) =>
    apiRequest<T>(path, { method: 'DELETE', fetchOptions }),
};

export default apiClient;
