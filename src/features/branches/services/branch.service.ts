import { apiCall, cachedQuery } from '@/lib/api/api.service';
import type { Branch, BranchSelectOption, ApiBranchResponse, ApiBranchRow, ApiSelectItem,
  FetchBranchesParams, FetchBranchesResult
 } from '@/features/branches/types/branches-types';
 import { API_BASE } from '@/lib/api/api.service';


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

export async function fetchBranches(
  params: FetchBranchesParams
): Promise<FetchBranchesResult> {
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
        params.mainBranchId,
        params.departmentId,
        params.mainBranchName,
        params.departmentName,
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
    body: JSON.stringify({
      model: {
        draw: 1,
        start: params.start || 0,
        length: params.length || 12,
        search: { value: (params.search || '').trim(), regex: '' },
      },
      param: { BranchID: 0 },
    }),
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








