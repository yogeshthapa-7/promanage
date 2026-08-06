import { apiCall } from '@/lib/api';

export interface Department {
  id: string;
  sn: number;
  name: string;
  subTaskCount: number;
}

interface ApiDepartmentResponse {
  data: ApiDepartmentRow[];
  recordsTotal: number;
  recordsFiltered: number;
}

interface ApiDepartmentRow {
  id: string;
  SN: number;
  Name: string;
  SubTaskCount: number;
}

const API_URL = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '') + '/Department/ServerSearch';

interface FetchDepartmentsParams {
  search: string;
  start: number;
  length: number;
  name?: string;
  code?: string;
  mainDept?: string;
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
    });
      
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
    id: row.id,
    sn: row.SN,
    name: row.Name,
    subTaskCount: row.SubTaskCount,
  };
}