import { apiCall, cachedQuery } from '@/lib/api';

export interface Policy {
  SN: number;
  id: number;
  name: string;
  fiscal_year?: string;
  fiscal_year_id?: number;
  document_url?: string;
  document_name?: string;
}

interface ApiPolicyResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiPolicyRow[];
}

interface ApiPolicyRow {
  SN: number;
  PolicyProgramID: number;
  PolicyProgramName: string;
  FiscalYear?: string;
  FiscalYearID?: number;
  FiscalYearName?: string;
  FileUpload?: string;
  DocumentUrl?: string;
}

interface FetchPoliciesParams {
  search: string;
  fiscalYear: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

interface FetchPoliciesResult {
  policies: Policy[];
  total: number;
  filtered: number;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
export const API_URL = `${API_BASE}/PolicyProgram/ServerSearch`;

function buildSearchBody(params: FetchPoliciesParams) {
  return {
    model: {
      draw: 1,
      start: params.start,
      length: params.length,
      search: { value: '', regex: '' },
    },
    param: {
      PolicyProgramID: 0,
      PolicyProgramName: params.search,
      // FiscalYear: params.fiscalYear,
      FiscalYearID: params.fiscalYear ? Number(params.fiscalYear) : 0,
    },
  };
}

export async function fetchPolicies(
  params: FetchPoliciesParams
): Promise<FetchPoliciesResult> {
  try {
    return await cachedQuery(
      ['policies', 'search', params.search, params.fiscalYear, params.start, params.length],
      (signal) => doFetchPolicies(params, signal),
      params.signal
    );
  } catch {
    return { policies: [], total: 0, filtered: 0 };
  }
}

async function doFetchPolicies(
  params: FetchPoliciesParams,
  signal?: AbortSignal
): Promise<FetchPoliciesResult> {
  const res = await apiCall(API_URL, {
    method: 'POST',
    body: JSON.stringify(buildSearchBody(params)),
    signal,
  });

  if (!res.ok) throw new Error(`Failed to fetch policies: ${res.statusText}`);

  const json = await res.json();
  const response = json as ApiPolicyResponse;
  const rows = Array.isArray(response?.data) ? (response.data as ApiPolicyRow[]) : [];
  const mapped = rows.map(mapApiRowToPolicy);

  return {
    policies: mapped,
    total: response.recordsTotal ?? 0,
    filtered: response.recordsFiltered ?? 0,
  };
}

function mapApiRowToPolicy(row: ApiPolicyRow): Policy {
  const basePath = row.FileUpload || row.DocumentUrl || '';
  const documentUrl = basePath ? `${API_BASE}/${basePath.replace(/^\/+/, '')}` : '';
  const documentName = basePath ? decodeURIComponent(basePath.split('/').pop() || '') : '';
  return {
    SN: row.SN,
    id: row.PolicyProgramID,
    name: row.PolicyProgramName,
    fiscal_year: row.FiscalYearName || row.FiscalYear,
    fiscal_year_id: row.FiscalYearID,
    document_url: documentUrl,
    document_name: documentName,
  };
}
