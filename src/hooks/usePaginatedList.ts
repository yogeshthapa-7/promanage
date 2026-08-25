'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PaginatedListParams {
  start: number;
  length: number;
  signal?: AbortSignal;
  [key: string]: unknown;
}

export interface PaginatedListResult<T> {
  items: T[];
  total: number;
}

export interface UsePaginatedListOptions<T> {
  fetcher: (params: PaginatedListParams) => Promise<PaginatedListResult<T>>;
  initialPageSize?: number;
  extraDeps?: unknown[];
  extraParams?: Record<string, unknown>;
}

export interface UsePaginatedListReturn<T> {
  data: T[];
  total: number;
  loading: boolean;
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refetch: () => void;
}

export function usePaginatedList<T>({
  fetcher,
  initialPageSize = 20,
  extraDeps = [],
  extraParams,
}: UsePaginatedListOptions<T>): UsePaginatedListReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const fetchIdRef = useRef(0);
  const extraParamsRef = useRef(extraParams);

  useEffect(() => {
    extraParamsRef.current = extraParams;
  }, [extraParams]);

  const refetch = useCallback(() => {
    const fetchId = ++fetchIdRef.current;
    const controller = new AbortController();

    setLoading(true);

    Promise.resolve(fetcher({
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
  }, [currentPage, pageSize, fetcher]);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();
    const fetchId = ++fetchIdRef.current;

    Promise.resolve(fetcher({
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      signal: controller.signal,
      ...extraParamsRef.current,
    })).then((result) => {
      if (fetchIdRef.current === fetchId && !isCancelled) {
        setData(result.items);
        setTotal(result.total);
        setLoading(false);
      }
    }).catch((err) => {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (fetchIdRef.current === fetchId && !isCancelled) {
        setData([]);
        setTotal(0);
        setLoading(false);
      }
    });

    return () => {
      isCancelled = true;
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, ...extraDeps, fetcher]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  return { data, total, loading, currentPage, pageSize, setCurrentPage, setPageSize, refetch };
}
