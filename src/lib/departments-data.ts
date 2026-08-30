import { apiCall, cachedQuery } from '@/lib/api';

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
  departmentId?: string;
  signal?: AbortSignal;
}

interface FetchDepartmentsResult {
  departments: Department[];
  total: number;
  filtered: number;
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

export interface DepartmentSelectOption {
  value: string;
  label: string;
}

interface ApiSelectItem {
  DepartmentID?: number | string;
  DepartmentInfoID?: number | string;
  DepartmentName?: string;
  name?: string;
  id?: number | string;
  ID?: number | string;
  Value?: number | string;
  Text?: string;
  text?: string;
}

const SELECT_LIST_URL =
  (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '') +
  '/Department/SelectList';

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