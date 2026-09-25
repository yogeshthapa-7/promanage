import { apiCall, cachedQuery } from '@/services/apiservice';
import type { Branch, BranchSelectOption } from '@/types/branches-types';

interface ApiBranchResponse {
  data: ApiBranchRow[];
  recordsTotal: number;
  recordsFiltered: number;
}

interface ApiBranchRow {
  SN: number;
  BranchID: number;
  BranchCode: string;
  BranchName: string;
  MainBranchID: number;
  MainBranchName: string;
  DepartmentID: number;
  DepartmentName: string;
  OrderKey: number;
}

interface ApiSelectItem {
  BranchID?: number | string;
  BranchName?: string;
  name?: string;
  id?: number | string;
  Value?: number | string;
  Text?: string;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
const API_URL = `${API_BASE}/Branch/ServerSearch`;

const SELECT_LIST_URL = `${API_BASE}/Branch/SelectList`;

function mapSelectItem(item: ApiSelectItem): BranchSelectOption {
  const value = String(
    item.BranchID ?? item.id ?? item.Value ?? ''
  );
  const label = String(
    item.BranchName ?? item.name ?? item.Text ?? value
  );
  return { value, label };
}

export async function fetchBranchSelectList(
  signal?: AbortSignal
): Promise<BranchSelectOption[]> {
  try {
    const res = await apiCall(
      SELECT_LIST_URL,
      { method: 'GET', signal },
      30000
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch branch list: ${res.statusText}`);
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

interface FetchBranchesParams {
  search: string;
  start: number;
  length: number;
  name?: string;
  code?: string;
  mainBranchId?: number | string;
  mainBranchName?: string;
  departmentId?: number | string;
  departmentName?: string;
  orderKey?: number;
  signal?: AbortSignal;
}

interface FetchBranchesResult {
  branches: Branch[];
  total: number;
  filtered: number;
}

function buildSearchBody(params: FetchBranchesParams) {
  const parsedMainBranchId = params.mainBranchId ? Number(params.mainBranchId) : 0;
  const parsedDepartmentId = params.departmentId ? Number(params.departmentId) : 0;

  return {
    model: {
      draw: 0,
      start: params.start || 0,
      length: params.length || 20,
      search: { value: params.search || '', regex: '' },
    },
    param: {
      BranchID: 0,
      BranchName: params.name || '',
      BranchCode: params.code || '',
      MainBranchID: isNaN(parsedMainBranchId) ? 0 : parsedMainBranchId,
      MainBranchName: params.mainBranchName || '',
      DepartmentID: isNaN(parsedDepartmentId) ? 0 : parsedDepartmentId,
      DepartmentName: params.departmentName || '',
      OrderKey: params.orderKey || 0,
    },
  };
}

export async function fetchBranches(
  params: FetchBranchesParams
): Promise<FetchBranchesResult> {
  const depId = params.departmentId ? String(params.departmentId) : '';
  const depName = params.departmentName || '';
  const mainId = params.mainBranchId ? String(params.mainBranchId) : '';
  const mainName = params.mainBranchName || '';

  try {
    return await cachedQuery(
      [
        'branches', 
        'search', 
        params.search, 
        params.start, 
        params.length, 
        params.name, 
        params.code, 
        mainId, 
        mainName, 
        depId, 
        depName, 
        params.orderKey
      ],
      (signal) => doFetchBranches(params, signal),
      params.signal
    );
  } catch {
    return { branches: [], total: 0, filtered: 0 };
  }
}

async function doFetchBranches(
  params: FetchBranchesParams,
  signal?: AbortSignal
): Promise<FetchBranchesResult> {
  const res = await apiCall(API_URL, {
    method: 'POST',
    body: JSON.stringify(buildSearchBody(params)),
    signal,
  }, 120000);

  if (!res.ok) throw new Error(`Failed to fetch branches: ${res.statusText}`);

  const json = await res.json();
  const response = json as ApiBranchResponse;
  const rows = Array.isArray(response?.data) ? (response.data as ApiBranchRow[]) : [];
  const mapped = rows.map(mapApiRowToBranch);

  return {
    branches: mapped,
    total: response.recordsTotal ?? 0,
    filtered: response.recordsFiltered ?? 0,
  };
}

function mapApiRowToBranch(row: ApiBranchRow): Branch {
  return {
    id: String(row.BranchID),
    sn: row.SN,
    name: row.BranchName,
    branchCode: row.BranchCode,
    mainBranchId: row.MainBranchID,
    mainBranchName: row.MainBranchName,
    departmentId: row.DepartmentID,
    departmentName: row.DepartmentName,
    orderKey: row.OrderKey,
  };
}

export async function saveBranch(body: Record<string, unknown>): Promise<{ success: boolean; message?: string; data?: unknown }> {
  const res = await apiCall(`${API_BASE}/SaveBranch`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.Message || `Failed to save branch: ${res.statusText}`);
  return {
    success: json.Success ?? true,
    message: json.Message,
    data: json.Data ?? json.data,
  };
}

export async function deleteBranch(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await apiCall(`${API_BASE}/DeleteBranch?id=${id}`, { method: 'GET' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Failed to delete branch: ${res.statusText}`);
  return { success: json.Success !== false, message: json.Message };
}

export { API_URL, SELECT_LIST_URL };

