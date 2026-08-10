let pendingAbortControllers: AbortController[] = [];

export function trackAbortController(controller: AbortController): () => void {
  pendingAbortControllers.push(controller);
  return () => {
    const index = pendingAbortControllers.indexOf(controller);
    if (index !== -1) {
      pendingAbortControllers.splice(index, 1);
    }
  };
}

export function cancelAllPendingRequests(): void {
  pendingAbortControllers.forEach((controller) => {
    try {
      controller.abort();
    } catch {
      // ignore
    }
  });
  pendingAbortControllers = [];
}
