const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

const REFRESH_TOKEN_URL = (
  import.meta.env.VITE_REFRESH_TOKEN_URL ||
  `${API_BASE}/Authenticate/RefreshToken`
).replace(/\/$/, '');

const DEFAULT_TIMEOUT_MS = 30000;
const REFRESH_TIMEOUT_MS = 15000;

let isRefreshing = false;
let refreshSubscribers: Array<
  (token: string | null) => void
> = [];

function subscribeTokenRefresh(
  callback: (token: string | null) => void
): () => void {
  refreshSubscribers.push(callback);

  return () => {
    refreshSubscribers = refreshSubscribers.filter(
      (cb) => cb !== callback
    );
  };
}

function notifyTokenRefresh(token: string | null): void {
  const subscribers = [...refreshSubscribers];

  refreshSubscribers = [];

  subscribers.forEach((callback) => {
    try {
      callback(token);
    } catch (error) {
      console.error('Error notifying token refresh subscriber:', error);
    }
  });
}

export function clearTokenRefreshSubscribers(): void {
  const subscribers = [...refreshSubscribers];

  refreshSubscribers = [];

  subscribers.forEach((callback) => {
    try {
      callback(null);
    } catch (error) {
      console.error('Error clearing token refresh subscriber:', error);
    }
  });
}

function getStoredToken(): string | null {
  try {
    const stored = localStorage.getItem('token');
    if (stored && stored.trim() !== '') return stored;
  } catch {
    // fall through to env fallback
  }
  return import.meta.env.VITE_BEARER_TOKEN || null;
}

function setStoredToken(token: string): void {
  try {
    localStorage.setItem('token', token);
  } catch (error) {
    console.error('Unable to store authentication token:', error);
  }
}

function clearAuthentication(): void {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('auth');
  } catch (error) {
    console.error('Unable to clear authentication data:', error);
  }
}

function dispatchAuthExpired(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-expired'));
  }
}

export async function refreshAuthToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise<string | null>((resolve) => {
      let unsubscribe: (() => void) | undefined;

      const callback = (token: string | null) => {
        if (unsubscribe) {
          unsubscribe();
        }

        resolve(token);
      };

      unsubscribe = subscribeTokenRefresh(callback);
    });
  }

  isRefreshing = true;

  try {
    const currentToken = getStoredToken();

    if (!currentToken) {
      notifyTokenRefresh(null);
      return null;
    }

    const refreshController = new AbortController();

    const refreshTimeoutId = window.setTimeout(() => {
      refreshController.abort();
    }, REFRESH_TIMEOUT_MS);

    try {
      const response = await fetch(REFRESH_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: currentToken,
        }),
        signal: refreshController.signal,
      });

      if (!response.ok) {
        notifyTokenRefresh(null);
        return null;
      }

      const data = await response.json();

      const newToken =
        data?.token ||
        data?.Token ||
        data?.Data?.token ||
        data?.data?.token ||
        data?.Data?.Token;

      if (typeof newToken === 'string' && newToken.length > 0) {
        setStoredToken(newToken);
        notifyTokenRefresh(newToken);

        return newToken;
      }

      notifyTokenRefresh(null);

      return null;
    } finally {
      window.clearTimeout(refreshTimeoutId);
    }
  } catch {
    notifyTokenRefresh(null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

function decodeJwtPayload(
  token: string
): Record<string, any> | null {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    let payload = parts[1];

    payload = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    while (payload.length % 4 !== 0) {
      payload += '=';
    }

    const decodedPayload = atob(payload);

    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);

  if (!payload) {
    return true;
  }

  if (!payload.exp) {
    return false;
  }

  const expirationTime = payload.exp * 1000;
  const safetyBuffer = 10000;

  return Date.now() >= expirationTime - safetyBuffer;
}

function buildHeaders(
  options: RequestInit,
  token: string | null
): Headers {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type')) {
    if (
      options.body &&
      typeof FormData !== 'undefined' &&
      options.body instanceof FormData
    ) {
      // Let the browser set multipart headers.
    } else {
      headers.set('Content-Type', 'application/json');
    }
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    headers.delete('Authorization');
  }

  return headers;
}

export async function apiCall(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  let token = getStoredToken();

  if (token && isTokenExpired(token)) {
    const newToken = await refreshAuthToken();

    if (newToken) {
      token = newToken;
    } else {
      clearAuthentication();
      clearTokenRefreshSubscribers();
      dispatchAuthExpired();

      throw new Error('Session expired. Please log in again.');
    }
  }

  let hasRetriedAfterRefresh = false;

  while (true) {
    const controller = new AbortController();

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        options.signal.addEventListener(
          'abort',
          () => controller.abort(),
          { once: true }
        );
      }
    }

    try {
      timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      const headers = buildHeaders(options, token);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      if (response.status !== 401) {
        return response;
      }

      if (hasRetriedAfterRefresh) {
        clearAuthentication();
        clearTokenRefreshSubscribers();
        dispatchAuthExpired();

        throw new Error('Session expired. Please log in again.');
      }

      hasRetriedAfterRefresh = true;

      const newToken = await refreshAuthToken();

      if (!newToken) {
        clearAuthentication();
        clearTokenRefreshSubscribers();
        dispatchAuthExpired();

        throw new Error('Session expired. Please log in again.');
      }

      token = newToken;

      continue;
    } catch (error) {
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (options.signal) {
        options.signal.removeEventListener('abort', () => controller.abort());
      }
    }
  }
}
