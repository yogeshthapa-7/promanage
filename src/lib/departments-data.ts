import { apiCall } from '@/lib/api';

export interface Department {
  id: string;
  sn: number;
  name: string;
  departmentCode: string;
  parentDepartmentId: number;
  parentDepartmentName: string;
  orderKey: number;
  status: number;
}

interface ApiDepartmentResponse {
  data: ApiDepartmentRow[];
  recordsTotal: number;
  recordsFiltered: number;
}

interface ApiDepartmentRow {
  SN: number;
  DepartmentID: number;
  DepartmentCode: string;
  DepartmentName: string;
  OrderKey: number;
  ParentDepartmentID: number;
  ParentDepartmentName: string;
  Status: number;
}

const API_URL = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '') + '/Department/ServerSearch';

interface FetchDepartmentsParams {
  search: string;
  start: number;
  length: number;
  name?: string;
  code?: string;
  mainDept?: string;
  signal?: AbortSignal;
}

interface FetchDepartmentsResult {
  departments: Department[];
  total: number;
  filtered: number;
}

function buildSearchBody(params: FetchDepartmentsParams) {
  return {
    model: {
      draw: 1,
      start: params.start,
      length: params.length,
      search: { value: params.search, regex: '' },
    },
    param: {
      search: params.search,
      DepartmentName: params.name || '',
      DepartmentCode: params.code || '',
      MainDepartmentID: params.mainDept ? Number(params.mainDept) : 0,
    },
  };
}

export async function fetchDepartments(
  params: FetchDepartmentsParams
): Promise<FetchDepartmentsResult> {
  try {
    const res = await apiCall(API_URL, {
      method: 'POST',
      body: JSON.stringify(buildSearchBody(params)),
      signal: params.signal,
    }, 120000);
      
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
  } catch {
    return { departments: [], total: 0, filtered: 0 };
  }
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