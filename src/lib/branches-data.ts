import { apiCall } from '@/lib/api';

export interface Branch {
  id: string;
  sn: number;
  name: string;
  branchCode: string;
  mainBranchId: number;
  mainBranchName: string;
  departmentId: number;
  departmentName: string;
  orderKey: number;
}

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

const API_URL = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '') + '/Branch/ServerSearch';

interface FetchBranchesParams {
  search: string;
  start: number;
  length: number;
  name?: string;
  code?: string;
  mainBranchId?: number;
  mainBranchName?: string;
  departmentId?: number;
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
  return {
    model: {
      draw: 0,
      start: params.start,
      length: params.length,
      search: { value: params.search, regex: '' },
    },
    param: {
      BranchID: params.mainBranchId || 0,
      BranchName: params.name || '',
      BranchCode: params.code || '',
      MainBranchID: params.mainBranchId || 0,
      MainBranchName: params.mainBranchName || '',
      DepartmentID: params.departmentId || 0,
      DepartmentName: params.departmentName || '',
      OrderKey: params.orderKey || 0,
    },
  };
}

export async function fetchBranches(
  params: FetchBranchesParams
): Promise<FetchBranchesResult> {
  try {
    const res = await apiCall(API_URL, {
      method: 'POST',
      body: JSON.stringify(buildSearchBody(params)),
      signal: params.signal,
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
  } catch {
    return { branches: [], total: 0, filtered: 0 };
  }
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
