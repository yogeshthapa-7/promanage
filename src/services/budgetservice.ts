import { apiCall, cachedQuery } from '@/services/apiservice';
import type { Budget } from '@/types/budget-types';

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
  FiscalYear?: string;
  FiscalYearID?: number;
  FiscalYearName?: string;
  FileUpload?: string;
  DocumentUrl?: string;
}

interface FetchBudgetsParams {
  search: string;
  fiscalYear: string;
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
      FiscalYearID: params.fiscalYear ? Number(params.fiscalYear) : 0,
    },
  };
}

export async function fetchBudgets(
  params: FetchBudgetsParams
): Promise<FetchBudgetsResult> {
  try {
    return await cachedQuery(
      ['budgets', 'search', params.search, params.fiscalYear, params.start, params.length],
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
  const basePath = row.FileUpload || row.DocumentUrl || '';
  const documentUrl = basePath ? `${API_BASE}/${basePath.replace(/^\/+/, '')}` : '';
  const documentName = basePath ? decodeURIComponent(basePath.split('/').pop() || '') : '';
  return {
    SN: row.SN,
    id: row.BudgetInfoID,
    name: row.BudgetInfoName,
    fiscal_year: row.FiscalYearName || row.FiscalYear,
    fiscal_year_id: row.FiscalYearID,
    document_url: documentUrl,
    document_name: documentName,
  };
}

export async function saveBudget(body: Record<string, unknown>): Promise<{ success: boolean; message?: string; data?: unknown }> {
  const res = await apiCall(`${API_BASE}/SaveBudgetInfo`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.Message || `Failed to save budget: ${res.statusText}`);
  return {
    success: json.Success ?? true,
    message: json.Message,
    data: json.Data ?? json.data,
  };
}

export async function deleteBudget(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await apiCall(`${API_BASE}/DeleteBudgetInfo?id=${id}`, { method: 'GET' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Failed to delete budget: ${res.statusText}`);
  return { success: json.Success !== false, message: json.Message };
}

