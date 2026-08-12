import { apiCall, cachedQuery } from '@/lib/api';

export interface MainBranch {
  id: string;
  sn: number;
  name: string;
  mainBranchCode: string;
  departmentId: number;
  departmentName: string;
  orderKey: number;
}

export interface MainBranchSelectOption {
  value: string;
  label: string;
}

interface ApiMainBranchResponse {
  data: ApiMainBranchRow[];
  recordsTotal: number;
  recordsFiltered: number;
}

interface ApiMainBranchRow {
  SN: number;
  MainBranchID: number;
  MainBranchCode: string;
  MainBranchName: string;
  DepartmentID: number;
  DepartmentName: string;
  OrderKey: number;
}

interface ApiSelectItem {
  MainBranchID?: number | string;
  MainBranchName?: string;
  DepartmentID?: number | string;
  DepartmentName?: string;
  id?: number | string;
  name?: string;
  Value?: number | string;
  Text?: string;
}

const API_URL = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '') + '/MainBranch/ServerSearch';

const SELECT_LIST_URL =
  (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '') +
  '/MainBranch/SelectList';

function mapSelectItem(item: ApiSelectItem): MainBranchSelectOption {
  const value = String(
    item.MainBranchID ?? item.id ?? item.Value ?? ''
  );
  const label = String(
    item.MainBranchName ?? item.name ?? item.Text ?? value
  );
  return { value, label };
}

export async function fetchMainBranchSelectList(
  signal?: AbortSignal
): Promise<MainBranchSelectOption[]> {
  try {
    const res = await apiCall(
      SELECT_LIST_URL,
      { method: 'GET', signal },
      30000
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch main branch list: ${res.statusText}`);
    }

    const json = await res.json();
    const rows: ApiSelectItem[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.Data)
          ? json.Data
          : [];

    return rows.map(mapSelectItem);
  } catch {
    return [];
  }
}

interface FetchMainBranchesParams {
  search: string;
  start: number;
  length: number;
  name?: string;
  code?: string;
  mainBranchId?: number;
  departmentId?: number;
  departmentName?: string;
  orderKey?: number;
  signal?: AbortSignal;
}

interface FetchMainBranchesResult {
  mainBranches: MainBranch[];
  total: number;
  filtered: number;
}

function buildSearchBody(params: FetchMainBranchesParams) {
  return {
    model: {
      draw: 1,
      start: params.start,
      length: params.length,
      search: { value: params.search, regex: '' },
    },
    param: {
      search: params.search,
      MainBranchID: params.mainBranchId || 0,
      MainBranchName: params.name || '',
      MainBranchCode: params.code || '',
      DepartmentID: params.departmentId || 0,
      DepartmentName: params.departmentName || '',
      OrderKey: params.orderKey || 0,
    },
  };
}

export async function fetchMainBranches(
  params: FetchMainBranchesParams
): Promise<FetchMainBranchesResult> {
  try {
    return await cachedQuery(
      ['mainBranches', 'search', params.search, params.start, params.length, params.name, params.code, params.mainBranchId, params.departmentId, params.departmentName, params.orderKey],
      (signal) => doFetchMainBranches(params, signal),
      params.signal
    );
  } catch {
    return { mainBranches: [], total: 0, filtered: 0 };
  }
}

async function doFetchMainBranches(
  params: FetchMainBranchesParams,
  signal?: AbortSignal
): Promise<FetchMainBranchesResult> {
  const res = await apiCall(API_URL, {
    method: 'POST',
    body: JSON.stringify(buildSearchBody(params)),
    signal,
  }, 120000);

  if (!res.ok) throw new Error(`Failed to fetch main branches: ${res.statusText}`);

  const json = await res.json();
  const response = json as ApiMainBranchResponse;
  const rows = Array.isArray(response?.data) ? (response.data as ApiMainBranchRow[]) : [];
  const mapped = rows.map(mapApiRowToMainBranch);

  return {
    mainBranches: mapped,
    total: response.recordsTotal ?? 0,
    filtered: response.recordsFiltered ?? 0,
  };
}

function mapApiRowToMainBranch(row: ApiMainBranchRow): MainBranch {
  return {
    id: String(row.MainBranchID),
    sn: row.SN,
    name: row.MainBranchName,
    mainBranchCode: row.MainBranchCode,
    departmentId: row.DepartmentID,
    departmentName: row.DepartmentName,
    orderKey: row.OrderKey,
  };
}
