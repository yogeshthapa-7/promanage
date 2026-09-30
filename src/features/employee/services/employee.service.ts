import { apiCall, cachedQuery } from '@/lib/api/api.service';
import type { Employee, ApiEmployeeResponse, FetchEmployeesParams, FetchEmployeesResult } from '@/features/employee/types/employees-types';



const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
export const API_URL = `${API_BASE}/EmployeeInfo/ServerSearch`;

function buildSearchBody(params: FetchEmployeesParams) {
  return {
    model: {
      draw: 1,
      start: params.start,
      length: params.length,
      search: { value: params.search, regex: '' },
    },
    param: {
      EmployeeInfoID: 0,
      Fullname: params.fullname || '',
      Address: params.address || '',
      Phone: params.phone || '',
      DepartmentID: 0,
      DepartmentName: '',
      DOB: '',
      Email: '',
      Gender: 0,
      Password: '',
      Username: '',
    },
  };
}

export async function fetchEmployees(
  params: FetchEmployeesParams
): Promise<FetchEmployeesResult> {
  try {
    return await cachedQuery(
      ['employees', 'search', params.search, params.start, params.length, params.fullname, params.address, params.phone],
      (signal) => doFetchEmployees(params, signal),
      params.signal
    );
  } catch {
    return { employees: [], total: 0, filtered: 0 };
  }
}

async function doFetchEmployees(
  params: FetchEmployeesParams,
  signal?: AbortSignal
): Promise<FetchEmployeesResult> {
  const res = await apiCall(API_URL, {
    method: 'POST',
    body: JSON.stringify(buildSearchBody(params)),
    signal,
  });
  if (!res.ok) throw new Error(`Failed to fetch employees: ${res.statusText}`);
  const json = await res.json();
  const response = json as ApiEmployeeResponse;
  const rows = Array.isArray(response?.data) ? (response.data as Employee[]) : [];
  return {
    employees: rows,
    total: response.recordsTotal ?? 0,
    filtered: response.recordsFiltered ?? 0,
  };
}

export async function saveEmployee(body: Record<string, unknown>): Promise<{ success: boolean; message?: string; data?: unknown }> {
  const res = await apiCall(`${API_BASE}/SaveEmployeeInfo`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.Message || `Failed to save employee: ${res.statusText}`);
  return {
    success: json.Success ?? true,
    message: json.Message,
    data: json.Data ?? json.data,
  };
}

export async function deleteEmployee(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await apiCall(`${API_BASE}/DeleteEmployeeInfo?id=${id}`, { method: 'GET' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Failed to delete employee: ${res.statusText}`);
  return { success: json.Success !== false, message: json.Message };
}

export async function fetchOrganizationOffices(signal?: AbortSignal): Promise<{ id: number | string; name: string }[]> {
  const res = await apiCall(`${API_BASE}/OrganizationOffice/SelectList`, { method: 'GET', signal }, 30000);
  if (!res.ok) return [];
  const json = await res.json();
  const rows: Record<string, unknown>[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : Array.isArray(json?.Data) ? json.Data : [];
  return rows.map((item) => ({
    id: Number(item.OrganizationOfficeID ?? item.Value ?? item.id ?? 0),
    name: String(item.OrganizationOfficeName ?? item.Name ?? item.name ?? item.Text ?? ''),
  }));
}

export async function fetchDepartmentsSelect(signal?: AbortSignal): Promise<{ id: number | string; name: string }[]> {
  const res = await apiCall(`${API_BASE}/Department/SelectList`, { method: 'GET', signal }, 30000);
  if (!res.ok) return [];
  const json = await res.json();
  const rows: Record<string, unknown>[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : Array.isArray(json?.Data) ? json.Data : [];
  return rows.map((item) => ({
    id: Number(item.DepartmentInfoID ?? item.DepartmentID ?? item.Value ?? item.id ?? 0),
    name: String(item.DepartmentName ?? item.Name ?? item.name ?? item.Text ?? ''),
  }));
}

export async function fetchMainBranchesSelect(signal?: AbortSignal): Promise<{ id: number | string; name: string; departmentId: number | string }[]> {
  const res = await apiCall(`${API_BASE}/MainBranch/SelectList`, { method: 'GET', signal }, 30000);
  if (!res.ok) return [];
  const json = await res.json();
  const rows: Record<string, unknown>[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : Array.isArray(json?.Data) ? json.Data : [];
  return rows.map((item) => ({
    id: Number(item.MainBranchID ?? item.Value ?? item.id ?? 0),
    name: String(item.MainBranchName ?? item.Name ?? item.name ?? item.Text ?? ''),
    departmentId: Number(item.DepartmentID ?? 0),
  }));
}

export async function fetchBranchesSelect(signal?: AbortSignal): Promise<{ id: number | string; name: string; mainBranchId: number | string }[]> {
  const res = await apiCall(`${API_BASE}/Branch/SelectList`, { method: 'GET', signal }, 30000);
  if (!res.ok) return [];
  const json = await res.json();
  const rows: Record<string, unknown>[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : Array.isArray(json?.Data) ? json.Data : [];
  return rows.map((item) => ({
    id: Number(item.BranchID ?? item.Value ?? item.id ?? 0),
    name: String(item.BranchName ?? item.Name ?? item.name ?? item.Text ?? ''),
    mainBranchId: Number(item.MainBranchID ?? 0),
  }));
}

export async function fetchEmployeesSelectList(signal?: AbortSignal): Promise<{ id: number | string; name: string }[]> {
  const res = await apiCall(`${API_BASE}/EmployeeInfo/SelectList`, { method: 'GET', signal }, 30000);
  if (!res.ok) return [];
  const json = await res.json();
  const rows: Record<string, unknown>[] = Array.isArray(json)
    ? json
    : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.Data)
        ? json.Data
        : [];
  return rows.map((item) => ({
    id: Number(item.EmployeeInfoID ?? item.EmployeeID ?? item.Value ?? item.id ?? 0),
    name: String(item.Fullname ?? item.FullName ?? item.Name ?? item.name ?? item.Text ?? ''),
  }));
}







