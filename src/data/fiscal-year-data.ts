import { apiCall, cachedQuery } from '@/services/api';
import NepaliFunctions from '@sajanm/nepali-functions';

export interface FiscalYearSelectOption {
  value: string;
  label: string;
}

interface ApiFiscalYearResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiFiscalYearRow[];
}

interface ApiFiscalYearRow {
  FiscalYearID: number;
  FiscalYearName: string;
  FiscalYearCode: string;
  StartDate: string;
  EndDate: string;
  Status: number;
  IsCurrent: number;
  YearOrder?: number;
}

export interface FiscalYearItem {
  id: number;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  startDateBs: string;
  endDateBs: string;
  yearOrder?: number;
  isActive?: number;
  isRunning?: number;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '')
// .replace(/\/$/, '').replace(/\/api$/, '');
const SELECT_LIST_URL = `${API_BASE}/FiscalYear/SelectList`;
const SERVER_SEARCH_URL = `${API_BASE}/FiscalYear/ServerSearch`;

interface ApiSelectItem {
  FiscalYearID?: number | string;
  FiscalYearName?: string;
  FiscalYear?: string;
  name?: string;
  id?: number | string;
  Value?: number | string;
  Text?: string;
}

function mapSelectItem(item: ApiSelectItem): FiscalYearSelectOption {
  const label = String(
    item.FiscalYearName ?? item.FiscalYear ?? item.name ?? item.Text ?? ''
  );
  const value = String(
    item.FiscalYearID ?? item.FiscalYear ?? item.FiscalYearName ?? item.name ?? item.Text ?? label
    // item.FiscalYearName ?? item.FiscalYear ?? item.FiscalYearID ?? item.name ?? item.Text ?? label
  );
  return { value, label };
}

export async function fetchFiscalYearSelectList(
  signal?: AbortSignal
): Promise<FiscalYearSelectOption[]> {
  try {
    const res = await apiCall(
      SELECT_LIST_URL,
      { method: 'GET', signal },
      30000
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch fiscal year list: ${res.statusText}`);
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

interface FetchFiscalYearsParams {
  search: string;
  status: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

interface FetchFiscalYearsResult {
  fiscalYears: FiscalYearItem[];
  total: number;
  filtered: number;
}

function buildSearchBody(params: FetchFiscalYearsParams) {
  return {
    model: {
      draw: 1,
      start: params.start,
      length: params.length,
      columns: [
        { data: 'FiscalYearID', name: 'FiscalYearID', searchable: true, orderable: true, search: { value: '', regex: '' } },
        { data: 'FiscalYearName', name: 'FiscalYearName', searchable: true, orderable: true, search: { value: '', regex: '' } },
        { data: 'FiscalYearCode', name: 'FiscalYearCode', searchable: true, orderable: true, search: { value: '', regex: '' } },
      ],
      search: { value: params.search, regex: '' },
      order: [{ column: 1, dir: 'desc' }],
    },
    param: {
      FiscalYearID: 0,
      FiscalYearName: '',
      FiscalYearCode: '',
      Status: params.status === 'Active' ? 1 : params.status === 'Inactive' ? 0 : undefined,
    },
  };
}

export async function fetchFiscalYears(
  params: FetchFiscalYearsParams
): Promise<FetchFiscalYearsResult> {
  try {
    return await cachedQuery(
      ['fiscalYears', 'search', params.search, params.status, params.start, params.length],
      (signal) => doFetchFiscalYears(params, signal),
      params.signal
    );
  } catch {
    return { fiscalYears: [], total: 0, filtered: 0 };
  }
}

async function doFetchFiscalYears(
  params: FetchFiscalYearsParams,
  signal?: AbortSignal
): Promise<FetchFiscalYearsResult> {
  const res = await apiCall(SERVER_SEARCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildSearchBody(params)),
    signal,
  });

  if (!res.ok) throw new Error(`Failed to fetch fiscal years: ${res.statusText}`);

  const json = await res.json();
  const response = json as ApiFiscalYearResponse;
  const rows = Array.isArray(response?.data) ? (response.data as ApiFiscalYearRow[]) : [];
  const mapped = rows.map(mapApiRowToFiscalYear);

  return {
    fiscalYears: mapped,
    total: response.recordsTotal ?? 0,
    filtered: response.recordsFiltered ?? 0,
  };
}

function toBsString(adStr: string): string {
  try {
    const parts = adStr.replace(/-/g, '/').split('/');
    if (parts.length !== 3) return adStr;
    const [y, m, d] = parts.map(Number);
    const bs = NepaliFunctions.AD2BS({ year: y, month: m, day: d }) as { year: number; month: number; day: number };
    return `${bs.year}/${String(bs.month).padStart(2, '0')}/${String(bs.day).padStart(2, '0')}`;
  } catch {
    return adStr;
  }
}

function mapApiRowToFiscalYear(row: ApiFiscalYearRow): FiscalYearItem {
  const startDateBs = row.StartDate ? toBsString(row.StartDate) : '';
  const endDateBs = row.EndDate ? toBsString(row.EndDate) : '';
  return {
    id: row.FiscalYearID,
    name: row.FiscalYearName,
    code: row.FiscalYearCode,
    startDate: row.StartDate,
    endDate: row.EndDate,
    startDateBs,
    endDateBs,
    yearOrder: row.YearOrder,
  };
}
