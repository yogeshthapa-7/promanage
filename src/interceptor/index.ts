import {
  getStoredToken,
  refreshAuthToken,
  clearAuthentication,
  clearTokenRefreshSubscribers,
  dispatchAuthExpired,
  isTokenExpired,
  buildHeaders,
} from './token';

const DEFAULT_TIMEOUT_MS = 30000;
const REFRESH_TIMEOUT_MS = 15000;

export async function apiCall(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  refreshUrl = `${(import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '')}/Authenticate/RefreshToken`
): Promise<Response> {
  let token = getStoredToken();

  if (token && isTokenExpired(token)) {
    const newToken = await refreshAuthToken(
      (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, ''),
      refreshUrl,
      REFRESH_TIMEOUT_MS
    );

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

      const newToken = await refreshAuthToken(
        (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, ''),
        refreshUrl,
        REFRESH_TIMEOUT_MS
      );

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
