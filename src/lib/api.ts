const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
const REFRESH_TOKEN_URL = (import.meta.env.VITE_REFRESH_TOKEN_URL || `${API_BASE}/Authenticate/RefreshToken`).replace(/\/$/, '');
const DEFAULT_TIMEOUT_MS = 15000;

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void): () => void {
  refreshSubscribers.push(callback);
  return () => {
    refreshSubscribers = refreshSubscribers.filter((cb) => cb !== callback);
  };
}

function notifyTokenRefresh(token: string): void {
  refreshSubscribers.forEach((cb) => cb(token));
}

export function clearTokenRefreshSubscribers(): void {
  refreshSubscribers = [];
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
    const res = await fetch(REFRESH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: currentToken }),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const newToken = data?.token || data?.Token || data?.Data?.token || data?.data?.token || data?.Data?.Token;

    if (newToken && typeof newToken === 'string') {
      localStorage.setItem('token', newToken);
      notifyTokenRefresh(newToken);
      return newToken;
    }

    return null;
  } catch {
    return null;
  } finally {
    isRefreshing = false;
  }
}

export async function apiCall(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const token = localStorage.getItem('token');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
        const retryHeaders: HeadersInit = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        };

        return fetch(url, {
          ...options,
          headers: retryHeaders,
          signal: controller.signal,
        });
      }

      clearTokenRefreshSubscribers();
    }

    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}