import { apiCall, cachedQuery } from '@/services/apiservice';
import type { Client } from '@/types/client-types';

interface ApiClientResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiClientRow[];
}

interface ApiClientRow {
  SN: number;
  ClientInfoID: number;
  ClientCode: string;
  ClientName: string;
  ClientStatus: number;
  ContactNo: string;
  ContactPerson: string;
  Email: string;
  Logo: string;
  Address: string;
  Status: number;
}

interface FetchClientsParams {
  search: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

interface FetchClientsResult {
  clients: Client[];
  total: number;
  filtered: number;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
export const API_URL = `${API_BASE}/ClientInfo/ServerSearch`;

function buildSearchBody(params: FetchClientsParams) {
  const param: Record<string, unknown> = {
    ClientInfoID: 0,
  };

  if (params.search.trim()) {
    param.ClientName = params.search.trim();
  }

  return {
    model: {
      draw: 1,
      start: params.start,
      length: params.length,
      search: { value: '', regex: '' },
    },
    param,
  };
}

export async function fetchClients(
  params: FetchClientsParams
): Promise<FetchClientsResult> {
  try {
    return await cachedQuery(
      ['clients', 'search', params.search, params.start, params.length],
      (signal) => doFetchClients(params, signal),
      params.signal
    );
  } catch {
    return { clients: [], total: 0, filtered: 0 };
  }
}

async function doFetchClients(
  params: FetchClientsParams,
  signal?: AbortSignal
): Promise<FetchClientsResult> {
  const res = await apiCall(API_URL, {
    method: 'POST',
    body: JSON.stringify(buildSearchBody(params)),
    signal,
  });

  if (!res.ok) throw new Error(`Failed to fetch clients: ${res.statusText}`);

  const json = await res.json();
  const response = json as ApiClientResponse;
  const rows = Array.isArray(response?.data) ? (response.data as ApiClientRow[]) : [];
  const mapped = rows.map(mapApiRowToClient);

  return {
    clients: mapped,
    total: response.recordsTotal ?? 0,
    filtered: response.recordsFiltered ?? 0,
  };
}

function mapApiRowToClient(row: ApiClientRow): Client {
  return {
    SN: row.SN,
    id: row.ClientInfoID,
    clientCode: row.ClientCode,
    clientName: row.ClientName,
    clientStatus: row.ClientStatus,
    contactNo: row.ContactNo,
    contactPerson: row.ContactPerson,
    email: row.Email,
    logo: row.Logo,
    address: row.Address,
    status: row.Status,
  };
}

export async function saveClient(body: Record<string, unknown>): Promise<{ success: boolean; message?: string; data?: unknown }> {
  const res = await apiCall(`${API_BASE}/SaveClientInfo`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.Message || `Failed to save client: ${res.statusText}`);
  return {
    success: json.Success ?? true,
    message: json.Message,
    data: json.Data ?? json.data,
  };
}

export async function deleteClient(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await apiCall(`${API_BASE}/DeleteClientInfo?id=${id}`, { method: 'GET' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Failed to delete client: ${res.statusText}`);
  return { success: json.Success !== false, message: json.Message };
}

