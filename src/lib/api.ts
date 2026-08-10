import { trackAbortController, cancelAllPendingRequests } from './request-tracker';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
const REFRESH_TOKEN_URL = (import.meta.env.VITE_REFRESH_TOKEN_URL || `${API_BASE}/Authenticate/RefreshToken`).replace(/\/$/, '');
const DEFAULT_TIMEOUT_MS = 120000;
const REFRESH_TIMEOUT_MS = 15000; // Refresh token requests get a shorter, strict timeout

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(callback: (token: string | null) => void): () => void {
  refreshSubscribers.push(callback);
  return () => {
    refreshSubscribers = refreshSubscribers.filter((cb) => cb !== callback);
  };
}

/**
 * Notify ALL waiting subscribers — both on success (with token) and failure (with null).
 * This prevents promises from hanging forever when refresh fails.
 */
function notifyTokenRefresh(token: string | null): void {
  const subscribers = [...refreshSubscribers];
  refreshSubscribers = [];
  subscribers.forEach((cb) => cb(token));
}

export function clearTokenRefreshSubscribers(): void {
  // Resolve any pending subscribers with null before clearing,
  // so their promises don't hang forever
  const subscribers = [...refreshSubscribers];
  refreshSubscribers = [];
  subscribers.forEach((cb) => cb(null));
}

export async function refreshAuthToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise<string | null>((resolve) => {
      const unsubscribe = subscribeTokenRefresh((token) => {
        unsubscribe();
        resolve(token);
      });
    });
  }

  isRefreshing = true;

  try {
    const currentToken = localStorage.getItem('token');

    // Add a timeout to the refresh request so it can't hang indefinitely
    const refreshController = new AbortController();
    const refreshTimeoutId = setTimeout(() => refreshController.abort(), REFRESH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(REFRESH_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken }),
        signal: refreshController.signal,
      });
    } finally {
      clearTimeout(refreshTimeoutId);
    }

    if (!res.ok) {
      notifyTokenRefresh(null); // ← Unblock all waiting subscribers
      return null;
    }

    const data = await res.json();
    const newToken = data?.token || data?.Token || data?.Data?.token || data?.data?.token || data?.Data?.Token;

    if (newToken && typeof newToken === 'string') {
      localStorage.setItem('token', newToken);
      notifyTokenRefresh(newToken); // ← Unblock with new token
      return newToken;
    }

    notifyTokenRefresh(null); // ← Unblock all waiting subscribers
    return null;
  } catch {
    notifyTokenRefresh(null); // ← Unblock all waiting subscribers on error too
    return null;
  } finally {
    isRefreshing = false;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return true;
    const decoded = JSON.parse(atob(payloadBase64));
    if (!decoded.exp) return false;
    // Add a 10-second buffer so we refresh slightly before it actually expires
    return Date.now() >= (decoded.exp * 1000) - 10000;
  } catch {
    return true;
  }
}

export async function apiCall(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  let token = localStorage.getItem('token');

  // Proactively check if token is expired before making the request
  if (token && isTokenExpired(token)) {
    const newToken = await refreshAuthToken();
    if (newToken) {
      token = newToken;
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('auth');
      window.dispatchEvent(new Event('auth-expired'));
      throw new Error('Session expired. Please log in again.');
    }
  }

  const controller = new AbortController();
  const untrack = trackAbortController(controller);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Link the caller's signal to our internal controller
  // so if the component unmounts and aborts, we cancel the fetch
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', () => controller.abort());
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      const newToken = await refreshAuthToken();

      if (newToken) {
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), timeoutMs);

        try {
          const retryHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
            ...options.headers,
          };

          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
            signal: retryController.signal,
          });
          clearTimeout(retryTimeoutId);
          return retryResponse;
        } finally {
          clearTimeout(retryTimeoutId);
        }
      }

      // Refresh failed — clear any remaining subscribers and return the 401
      clearTokenRefreshSubscribers();
      localStorage.removeItem('token');
      localStorage.removeItem('auth');
      window.dispatchEvent(new Event('auth-expired'));
    }

    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  } finally {
    untrack();
  }
}

export { cancelAllPendingRequests };