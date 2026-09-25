import { apiCall, cachedQuery } from '@/services/apiservice';
import type { Employee } from '@/types/employees-types';

interface ApiEmployeeResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: Employee[];
}

interface FetchEmployeesParams {
  search: string;
  start: number;
  length: number;
  fullname?: string;
  address?: string;
  phone?: string;
  signal?: AbortSignal;
}

interface FetchEmployeesResult {
  employees: Employee[];
  total: number;
  filtered: number;
}

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

