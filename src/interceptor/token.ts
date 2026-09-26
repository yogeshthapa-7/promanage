let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

export function subscribeTokenRefresh(
  callback: (token: string | null) => void
): () => void {
  refreshSubscribers.push(callback);

  return () => {
    refreshSubscribers = refreshSubscribers.filter((cb) => cb !== callback);
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

export function getStoredToken(): string | null {
  try {
    const stored = localStorage.getItem('token');
    if (stored && stored.trim() !== '') return stored;
  } catch {
    // fall through to env fallback
  }
  return import.meta.env.VITE_BEARER_TOKEN || null;
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem('token', token);
  } catch (error) {
    console.error('Unable to store authentication token:', error);
  }
}

export function clearAuthentication(): void {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('auth');
  } catch (error) {
    console.error('Unable to clear authentication data:', error);
  }
}

export function dispatchAuthExpired(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-expired'));
  }
}

export async function refreshAuthToken(
  apiBase: string,
  refreshUrl: string,
  timeoutMs: number
): Promise<string | null> {
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
    }, timeoutMs);

    try {
      const response = await fetch(refreshUrl, {
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

export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    let payload = parts[1];

    payload = payload.replace(/-/g, '+').replace(/_/g, '/');

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

export function buildHeaders(
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
