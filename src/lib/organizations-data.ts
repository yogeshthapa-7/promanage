import { apiCall, cachedQuery } from '@/lib/api';

export interface Organization {
  SN: number;
  id: number;
  title: string;
  parentOrganizationId: number;
  parentOrganizationName: string;
}

interface ApiOrganizationResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiOrganizationRow[];
}

interface ApiOrganizationRow {
  SN: number;
  OrganizationID: number;
  ParentOrganizationID: number;
  ParentOrganizationName: string;
  Title: string;
}

interface FetchOrganizationsParams {
  search: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

interface FetchOrganizationsResult {
  organizations: Organization[];
  total: number;
  filtered: number;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
export const API_URL = `${API_BASE}/Organization/ServerSearch`;

function buildSearchBody(params: FetchOrganizationsParams) {
  return {
    model: {
      draw: 1,
      start: params.start,
      length: params.length,
      search: { value: '', regex: '' },
    },
    param: {
      OrganizationID: 0,
      Title: params.search,
      ParentOrganizationID: 0,
    },
  };
}

export async function fetchOrganizations(
  params: FetchOrganizationsParams
): Promise<FetchOrganizationsResult> {
  try {
    return await cachedQuery(
      ['organizations', 'search', params.search, params.start, params.length],
      (signal) => doFetchOrganizations(params, signal),
      params.signal
    );
  } catch {
    return { organizations: [], total: 0, filtered: 0 };
  }
}

async function doFetchOrganizations(
  params: FetchOrganizationsParams,
  signal?: AbortSignal
): Promise<FetchOrganizationsResult> {
  const res = await apiCall(API_URL, {
    method: 'POST',
    body: JSON.stringify(buildSearchBody(params)),
    signal,
  });
  if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.statusText}`);
  const json = await res.json();
  const response = json as ApiOrganizationResponse;
  const rows = Array.isArray(response?.data) ? (response.data as ApiOrganizationRow[]) : [];
  const mapped = rows.map(mapApiRowToOrganization);
  return {
    organizations: mapped,
    total: response.recordsTotal ?? 0,
    filtered: response.recordsFiltered ?? 0,
  };
}

function mapApiRowToOrganization(row: ApiOrganizationRow): Organization {
  return {
    SN: row.SN,
    id: row.OrganizationID,
    title: row.Title,
    parentOrganizationId: row.ParentOrganizationID,
    parentOrganizationName: row.ParentOrganizationName,
  };
}