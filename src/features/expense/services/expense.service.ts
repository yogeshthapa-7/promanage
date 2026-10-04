import { apiCall, cachedQuery, API_BASE } from '@/lib/api/api.service';
import type { Expense, ApiExpenseResponse, ApiExpenseRow, FetchExpensesParams, FetchExpensesResult } from '@/features/expense/types/expense-types';



export const API_URL = `${API_BASE}/ExpenseInfo/ServerSearch`;

export async function fetchExpenses(
  params: FetchExpensesParams
): Promise<FetchExpensesResult> {
  try {
    return await cachedQuery(
      ['expenses', 'search', params.search, params.fiscalYear, params.expenseCode, params.start, params.length],
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
    body: JSON.stringify({
      model: {
        draw: 1,
        start: params.start || 0,
        length: params.length || 12,
        search: { value: (params.search || '').trim(), regex: '' },
      },
      param: { ExpenseInfoID: 0 },
    }),
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
  const basePath = row.FileUpload || row.DocumentUrl || '';
  const documentUrl = basePath ? `${API_BASE}/${basePath.replace(/^\/+/, '')}` : '';
  const documentName = basePath ? decodeURIComponent(basePath.split('/').pop() || '') : '';
  return {
    SN: row.SN,
    id: row.ExpenseInfoID,
    title: row.ExpenseTitle,
    code: row.ExpenseCode,
    fiscal_year: row.FiscalYearName || row.FiscalYear,
    fiscal_year_id: row.FiscalYearID,
    document_url: documentUrl,
    document_name: documentName,
  };
}

export async function saveExpense(body: Record<string, unknown>): Promise<{ success: boolean; message?: string; data?: unknown }> {
  const res = await apiCall(`${API_BASE}/SaveExpenseInfo`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.Message || `Failed to save expense: ${res.statusText}`);
  return {
    success: json.Success ?? true,
    message: json.Message,
    data: json.Data ?? json.data,
  };
}

export async function deleteExpense(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await apiCall(`${API_BASE}/DeleteExpenseInfo?id=${id}`, { method: 'GET' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Failed to delete expense: ${res.statusText}`);
  return { success: json.Success !== false, message: json.Message };
}








