import { apiCall, cachedQuery, API_BASE } from '@/lib/api/api.service';
import type { Department, DepartmentSelectOption, ApiDepartmrntResponse, ApiDepartmentRow,
  ApiSelectItem, FetchDepartmentsParams, FetchDepartmentsResult
 } from '@/features/departments/types/departments-types';
 export async function saveDepartment(body: Record<string, unknown>): promise<{success: boolean; message?: string; data?: unknown}>
 export async function deleteDepartment(id: number): promise<{success: boolean; message?: string }>
 

const API_URL = `${API_BASE}/Department/ServerSearch`;

const SELECT_LIST_URL = `${API_BASE}/Department/SelectList`;

function mapSelectItem(item: ApiSelectItem): DepartmentSelectOption {
  const rawValue = item.DepartmentID ?? item.DepartmentInfoID ?? item.id ?? item.ID ?? item.Value ?? '';
  const rawLabel = item.DepartmentName ?? item.name ?? item.Text ?? item.text ?? rawValue;

  return {
    value: String(rawValue),
    label: String(rawLabel),
  };
}

export async function fetchDepartmentSelectList(
  signal?: AbortSignal
): Promise<DepartmentSelectOption[]> {
  try {
    const res = await apiCall(
      SELECT_LIST_URL,
      { method: 'GET', signal },
      30000
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch department list: ${res.statusText}`);
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


function buildSearchBody(params: FetchDepartmentsParams) {
  const parsedDeptId = params.departmentId ? Number(params.departmentId) : 0;
  const parsedMainDeptId = params.mainDept ? Number(params.mainDept) : 0;

  return {
    model: {
      draw: 1,
      start: params.start || 0,
      length: params.length || 20,
      search: { value: params.search || '', regex: '' },
    },
    param: {
      search: params.search || '',
      DepartmentName: params.name || '',
      DepartmentCode: params.code || '',
      DepartmentID: isNaN(parsedDeptId) ? 0 : parsedDeptId,
      MainDepartmentID: isNaN(parsedMainDeptId) ? 0 : parsedMainDeptId,
    },
  };
}

export async function fetchDepartments(
  params: FetchDepartmentsParams
): Promise<FetchDepartmentsResult> {
  try {
    return await cachedQuery(
      [
        'departments',
        'search',
        params.search,
        params.start,
        params.length,
        params.name,
        params.code,
        params.mainDept,
        params.departmentId,
      ],
      (signal) => doFetchDepartments(params, signal),
      params.signal
    );
  } catch {
    return { departments: [], total: 0, filtered: 0 };
  }
}

async function doFetchDepartments(
  params: FetchDepartmentsParams,
  signal?: AbortSignal
): Promise<FetchDepartmentsResult> {
  const res = await apiCall(
    API_URL,
    {
      method: 'POST',
      body: JSON.stringify(buildSearchBody(params)),
      signal,
    },
    120000
  );

  if (!res.ok) throw new Error(`Failed to fetch departments: ${res.statusText}`);

  const json = await res.json();
  const response = json as ApiDepartmentResponse;
  const rows = Array.isArray(response?.data) ? (response.data as ApiDepartmentRow[]) : [];
  const mapped = rows.map(mapApiRowToDepartment);

  return {
    departments: mapped,
    total: response.recordsTotal ?? 0,
    filtered: response.recordsFiltered ?? 0,
  };
}

function mapApiRowToDepartment(row: ApiDepartmentRow): Department {
  return {
    id: String(row.DepartmentID),
    sn: row.SN,
    name: row.DepartmentName,
    departmentCode: row.DepartmentCode,
    parentDepartmentId: row.ParentDepartmentID,
    parentDepartmentName: row.ParentDepartmentName,
    orderKey: row.OrderKey,
    status: row.Status,
  };
}

export async function saveDepartment(body: Record<string, unknown>): Promise<{ success: boolean; message?: string; data?: unknown }> {
  const res = await apiCall(`${API_BASE}/SaveDepartment`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.Message || `Failed to save department: ${res.statusText}`);
  return {
    success: json.Success ?? true,
    message: json.Message,
    data: json.Data ?? json.data,
  };
}

export async function deleteDepartment(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await apiCall(`${API_BASE}/DeleteDepartment?id=${id}`, { method: 'GET' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Failed to delete department: ${res.statusText}`);
  return { success: json.Success !== false, message: json.Message };
}








