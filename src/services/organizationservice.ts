import { apiCall, cachedQuery } from '@/services/apiservice';
import type { Organization } from '@/types/organizations-types';

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

interface ApiSelectItem {
  OrganizationID?: number | string;
  Title?: string;
  name?: string;
  id?: number | string;
  Value?: number | string;
  Text?: string;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
export const API_URL = `${API_BASE}/Organization/ServerSearch`;
const SELECT_LIST_URL = `${API_BASE}/Organization/SelectList`;

function mapSelectItem(item: ApiSelectItem): { value: string; label: string } {
  const value = String(item.OrganizationID ?? item.id ?? item.Value ?? '');
  const label = String(item.Title ?? item.name ?? item.Text ?? value);
  return { value, label };
}

export async function fetchOrganizationSelectList(signal?: AbortSignal): Promise<{ value: string; label: string }[]> {
  try {
    const res = await apiCall(SELECT_LIST_URL, { method: 'GET', signal }, 30000);
    if (!res.ok) throw new Error(`Failed to fetch organization list: ${res.statusText}`);
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

export async function saveOrganization(body: Record<string, unknown>): Promise<{ success: boolean; message?: string; data?: unknown }> {
  const res = await apiCall(`${API_BASE}/SaveOrganization`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.Message || `Failed to save organization: ${res.statusText}`);
  return {
    success: json.Success ?? true,
    message: json.Message,
    data: json.Data ?? json.data,
  };
}

export async function deleteOrganization(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await apiCall(`${API_BASE}/DeleteOrganization?id=${id}`, { method: 'GET' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Failed to delete organization: ${res.statusText}`);
  return { success: json.Success !== false, message: json.Message };
}

