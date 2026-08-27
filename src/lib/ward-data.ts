import { apiCall, cachedQuery } from '@/lib/api';

export interface Ward {
  SN: number;
  id: number;
  wardNumber: string;
  wardCode: string;
}

interface ApiWardResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiWardRow[];
}

interface ApiWardRow {
  SN: number;
  WardInfoID: number;
  WardNumber: string;
  WardCode: string;
}

interface FetchWardsParams {
  search: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

interface FetchWardsResult {
  wards: Ward[];
  total: number;
  filtered: number;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
export const API_URL = `${API_BASE}/WardInfo/ServerSearch`;

function buildSearchBody(params: FetchWardsParams) {
  return {
    model: {
      draw: 1,
      start: params.start,
      length: params.length,
      search: { value: '', regex: '' },
    },
    param: {
      WardInfoID: 0,
      WardNumber: params.search.trim() || '',
      WardCode: '',
    },
  };
}

export async function fetchWards(
  params: FetchWardsParams
): Promise<FetchWardsResult> {
  try {
    return await cachedQuery(
      ['wards', 'search', params.search, params.start, params.length],
      (signal) => doFetchWards(params, signal),
      params.signal
    );
  } catch {
    return { wards: [], total: 0, filtered: 0 };
  }
}

async function doFetchWards(
  params: FetchWardsParams,
  signal?: AbortSignal
): Promise<FetchWardsResult> {
  const res = await apiCall(API_URL, {
    method: 'POST',
    body: JSON.stringify(buildSearchBody(params)),
    signal,
  });

  if (!res.ok) throw new Error(`Failed to fetch wards: ${res.statusText}`);

  const json = await res.json();
  const response = json as ApiWardResponse;
  const rows = Array.isArray(response?.data) ? (response.data as ApiWardRow[]) : [];
  const mapped = rows.map(mapApiRowToWard);

  return {
    wards: mapped,
    total: response.recordsTotal ?? 0,
    filtered: response.recordsFiltered ?? 0,
  };
}

function mapApiRowToWard(row: ApiWardRow): Ward {
  return {
    SN: row.SN,
    id: row.WardInfoID,
    wardNumber: row.WardNumber,
    wardCode: row.WardCode,
  };
}
