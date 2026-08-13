import { apiCall, cachedQuery } from '@/lib/api';

export interface Budget {
  SN: number;
  id: number;
  name: string;
}

interface ApiBudgetResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiBudgetRow[];
}

interface ApiBudgetRow {
  SN: number;
  BudgetInfoID: number;
  BudgetInfoName: string;
}

interface FetchBudgetsParams {
  search: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

interface FetchBudgetsResult {
  budgets: Budget[];
  total: number;
  filtered: number;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
export const API_URL = `${API_BASE}/BudgetInfo/ServerSearch`;

function buildSearchBody(params: FetchBudgetsParams) {
  return {
    model: {
      draw: 1,
      start: params.start,
      length: params.length,
      search: { value: '', regex: '' },
    },
    param: {
      BudgetInfoID: 0,
      BudgetInfoName: params.search,
    },
  };
}

export async function fetchBudgets(
  params: FetchBudgetsParams
): Promise<FetchBudgetsResult> {
  try {
    return await cachedQuery(
      ['budgets', 'search', params.search, params.start, params.length],
      (signal) => doFetchBudgets(params, signal),
      params.signal
    );
  } catch {
    return { budgets: [], total: 0, filtered: 0 };
  }
}

async function doFetchBudgets(
  params: FetchBudgetsParams,
  signal?: AbortSignal
): Promise<FetchBudgetsResult> {
  const res = await apiCall(API_URL, {
    method: 'POST',
    body: JSON.stringify(buildSearchBody(params)),
    signal,
  });

  if (!res.ok) throw new Error(`Failed to fetch budgets: ${res.statusText}`);

  const json = await res.json();
  const response = json as ApiBudgetResponse;
  const rows = Array.isArray(response?.data) ? (response.data as ApiBudgetRow[]) : [];
  const mapped = rows.map(mapApiRowToBudget);

  return {
    budgets: mapped,
    total: response.recordsTotal ?? 0,
    filtered: response.recordsFiltered ?? 0,
  };
}

function mapApiRowToBudget(row: ApiBudgetRow): Budget {
  return {
    SN: row.SN,
    id: row.BudgetInfoID,
    name: row.BudgetInfoName,
  };
}
