import {
  getStoredToken,
  refreshAuthToken,
  clearAuthentication,
  clearTokenRefreshSubscribers,
  dispatchAuthExpired,
  isTokenExpired,
  buildHeaders,
} from '@/interceptor/token';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

// const REFRESH_TOKEN_URL = (
//   import.meta.env.VITE_REFRESH_TOKEN_URL ||
//   `${API_BASE}/Authenticate/RefreshToken`
// ).replace(/\/$/, '');

const DEFAULT_TIMEOUT_MS = 30000;
const REFRESH_TIMEOUT_MS = 15000;

export async function apiCall(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  let token = getStoredToken();

  if (token && isTokenExpired(token)) {
    // const newToken = await refreshAuthToken(
    //   API_BASE,
    //   REFRESH_TOKEN_URL,
    //   REFRESH_TIMEOUT_MS
    // );

    // if (newToken) {
    //   token = newToken;
    // } else {
    //   clearAuthentication();
    //   clearTokenRefreshSubscribers();
    //   dispatchAuthExpired();

    //   throw new Error('Session expired. Please log in again.');
    // }
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

      // const newToken = await refreshAuthToken(
      //   API_BASE,
      //   REFRESH_TOKEN_URL,
      //   REFRESH_TIMEOUT_MS
      // );

      // if (!newToken) {
      //   clearAuthentication();
      //   clearTokenRefreshSubscribers();
      //   dispatchAuthExpired();

      //   throw new Error('Session expired. Please log in again.');
      // }

      // token = newToken;

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

/**
 * Run a fetcher through React Query's cache keyed by `queryKey`.
 *
 * This lets non-React data libraries (server-side search lists) reuse cached
 * server responses when the user navigates back and forth between pages,
 * reducing repeated load on the backend. The live fetch is still attempted,
 * but when the cache holds a fresh (non-stale) entry the cached value is
 * returned immediately. Abort signals are forwarded so in-flight requests are
 * still cancellable.
 *
 * Falls back to the plain fetcher if React Query is unavailable.
 */
export async function cachedQuery<T>(
  queryKey: unknown[],
  fetcher: (signal?: AbortSignal) => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  const queryClient = (globalThis as { __promanageQueryClient?: import('@tanstack/react-query').QueryClient })
    .__promanageQueryClient;

  if (!queryClient) {
    return fetcher(signal);
  }

  return queryClient.fetchQuery({
    queryKey,
    queryFn: ({ signal: querySignal }) => fetcher(signal ?? querySignal),
    staleTime: 2 * 60 * 1000,
  });
}
