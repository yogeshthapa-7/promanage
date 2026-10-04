import { useState, useEffect, useCallback, useRef } from 'react';
import type { PaginatedListParams, PaginatedListResult, UsePaginatedListOptions, 
  UsePaginatedListReturn } from '@/shared/components/types/generic-components-types';

export type { PaginatedListParams, PaginatedListResult };
export type { UsePaginatedListOptions, UsePaginatedListReturn };

export function usePaginatedList<T>({
  fetcher,
  initialPageSize = 12,
  extraDeps = [],
  extraParams,
  queryKey,
}: UsePaginatedListOptions<T>): UsePaginatedListReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const fetchIdRef = useRef(0);
  const extraParamsRef = useRef(extraParams);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    extraParamsRef.current = extraParams;
  }, [extraParams]);

  const clampPage = useCallback((page: number, total: number, size: number) => {
    const maxPage = Math.max(1, Math.ceil(total / size));
    return page > maxPage ? maxPage : page;
  }, []);

  const getQueryClient = () => {
    const qc = (globalThis as { __promanageQueryClient?: import('@tanstack/react-query').QueryClient })
      .__promanageQueryClient;
    return qc || null;
  };

  const refetch = useCallback(() => {
    const qc = getQueryClient();
    if (qc && queryKey) {
      qc.invalidateQueries({ queryKey });
    }

    const fetchId = ++fetchIdRef.current;
    const controller = new AbortController();

    setLoading(true);

    Promise.resolve(fetcherRef.current({
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      signal: controller.signal,
      ...extraParamsRef.current,
    }))
      .then((result) => {
        if (fetchIdRef.current === fetchId) {
          setData(result.items);
          setTotal(result.total);
          setLoading(false);
          setCurrentPage(clampPage(currentPage, result.total, pageSize));
        }
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (fetchIdRef.current === fetchId) {
          setData([]);
          setTotal(0);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [currentPage, pageSize, clampPage, queryKey]);

useEffect(() => {
  let isCancelled = false;
  const controller = new AbortController();
  const fetchId = ++fetchIdRef.current;

  Promise.resolve(fetcherRef.current({
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    signal: controller.signal,
    ...extraParamsRef.current,
  })).then((result) => {
    if (fetchIdRef.current === fetchId && !isCancelled) {
      setData(result.items);
      setTotal(result.total);
      setLoading(false);
      setCurrentPage(clampPage(currentPage, result.total, pageSize));
    }
  }).catch((err) => {
    if (err instanceof Error && err.name === 'AbortError') return;
    if (fetchIdRef.current === fetchId && !isCancelled) {
      setData(prev => prev);          // keep existing data on non-abort errors
      setTotal(prev => prev);
      setLoading(false);
    }
  });

  return () => {
    isCancelled = true;
    controller.abort();
  };
}, [currentPage, pageSize, ...extraDeps, clampPage]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  return { data, total, loading, currentPage, pageSize, setCurrentPage, setPageSize, refetch };
}








