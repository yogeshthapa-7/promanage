import { apiCall, cachedQuery } from '@/lib/api';

export interface Label {
  SN: number;
  id: number;
  name: string;
  code: string;
  color: string;
}

interface ApiLabelResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiLabelRow[];
}

interface ApiLabelRow {
  SN: number;
  LabelInfoID: number;
  LabelName: string;
  LabelCode: string;
  LabelColor: string;
}

interface FetchLabelsParams {
  search: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

interface FetchLabelsResult {
  labels: Label[];
  total: number;
  filtered: number;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
export const API_URL = `${API_BASE}/LabelInfo/ServerSearch`;

function buildSearchBody(params: FetchLabelsParams) {
  return {
    model: {
      draw: 1,
      start: params.start,
      length: params.length,
      search: { value: '', regex: '' },
    },
    param: {
      LabelInfoID: 0,
      LabelInfoName: params.search,
    },
  };
}

export async function fetchLabels(
  params: FetchLabelsParams
): Promise<FetchLabelsResult> {
  try {
    return await cachedQuery(
      ['labels', 'search', params.search, params.start, params.length],
      (signal) => doFetchLabels(params, signal),
      params.signal
    );
  } catch {
    return { labels: [], total: 0, filtered: 0 };
  }
}

async function doFetchLabels(
  params: FetchLabelsParams,
  signal?: AbortSignal
): Promise<FetchLabelsResult> {
  const res = await apiCall(API_URL, {
    method: 'POST',
    body: JSON.stringify(buildSearchBody(params)),
    signal,
  });

  if (!res.ok) throw new Error(`Failed to fetch labels: ${res.statusText}`);

  const json = await res.json();
  const response = json as ApiLabelResponse;
  const rows = Array.isArray(response?.data) ? (response.data as ApiLabelRow[]) : [];
  const mapped = rows.map(mapApiRowToLabel);

  return {
    labels: mapped,
    total: response.recordsTotal ?? 0,
    filtered: response.recordsFiltered ?? 0,
  };
}

function mapApiRowToLabel(row: ApiLabelRow): Label {
  return {
    SN: row.SN,
    id: row.LabelInfoID,
    name: row.LabelName,
    code: row.LabelCode,
    color: row.LabelColor,
  };
}

export async function createLabel(data: { name: string; code: string; color: string }): Promise<Label> {
  const res = await apiCall(`${API_BASE}/SaveLabelInfo`, {
    method: 'POST',
    body: JSON.stringify({
      LabelInfoID: 0,
      LabelName: data.name,
      LabelCode: data.code,
      LabelColor: data.color,
    }),
  });
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  const json = await res.json();
  const item = (json?.data ?? json) as Record<string, unknown>;
  return {
    SN: Number(item.SN ?? 0),
    id: Number(item.LabelInfoID ?? 0),
    name: String(item.LabelName ?? data.name),
    code: String(item.LabelCode ?? data.code),
    color: String(item.LabelColor ?? data.color),
  };
}

export async function updateLabel(id: number, data: { name: string; code: string; color: string }): Promise<Label> {
  const res = await apiCall(`${API_BASE}/SaveLabelInfo`, {
    method: 'POST',
    body: JSON.stringify({
      LabelInfoID: id,
      LabelName: data.name,
      LabelCode: data.code,
      LabelColor: data.color,
    }),
  });
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  const json = await res.json();
  const item = (json?.data ?? json) as Record<string, unknown>;
  return {
    SN: Number(item.SN ?? 0),
    id: Number(item.LabelInfoID ?? id),
    name: String(item.LabelName ?? data.name),
    code: String(item.LabelCode ?? data.code),
    color: String(item.LabelColor ?? data.color),
  };
}

export async function deleteLabel(id: number): Promise<void> {
  const res = await apiCall(`${API_BASE}/DeleteLabelInfo?id=${id}`, {
    method: 'GET',
  });
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
}
