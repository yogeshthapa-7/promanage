import { apiCall, cachedQuery } from '@/lib/api';

export interface Expense {
  SN: number;
  id: number;
  title: string;
  code: string;
}

interface ApiExpenseResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiExpenseRow[];
}

interface ApiExpenseRow {
  SN: number;
  ExpenseInfoID: number;
  ExpenseTitle: string;
  ExpenseCode: string;
}

interface FetchExpensesParams {
  search: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

interface FetchExpensesResult {
  expenses: Expense[];
  total: number;
  filtered: number;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
export const API_URL = `${API_BASE}/ExpenseInfo/ServerSearch`;

function buildSearchBody(params: FetchExpensesParams) {
  return {
    model: {
      draw: 1,
      start: params.start,
      length: params.length,
      search: { value: '', regex: '' },
    },
    param: {
      ExpenseInfoID: 0,
      ExpenseTitle: params.search,
    },
  };
}

export async function fetchExpenses(
  params: FetchExpensesParams
): Promise<FetchExpensesResult> {
  try {
    return await cachedQuery(
      ['expenses', 'search', params.search, params.start, params.length],
      (signal) => doFetchExpenses(params, signal),
      params.signal
    );
  } catch {
    return { expenses: [], total: 0, filtered: 0 };
  }
}

async function doFetchExpenses(
  params: FetchExpensesParams,
  signal?: AbortSignal
): Promise<FetchExpensesResult> {
  const res = await apiCall(API_URL, {
    method: 'POST',
    body: JSON.stringify(buildSearchBody(params)),
    signal,
  });

  if (!res.ok) throw new Error(`Failed to fetch expenses: ${res.statusText}`);

  const json = await res.json();
  const response = json as ApiExpenseResponse;
  const rows = Array.isArray(response?.data) ? (response.data as ApiExpenseRow[]) : [];
  const mapped = rows.map(mapApiRowToExpense);

  return {
    expenses: mapped,
    total: response.recordsTotal ?? 0,
    filtered: response.recordsFiltered ?? 0,
  };
}

function mapApiRowToExpense(row: ApiExpenseRow): Expense {
  return {
    SN: row.SN,
    id: row.ExpenseInfoID,
    title: row.ExpenseTitle,
    code: row.ExpenseCode,
  };
}
