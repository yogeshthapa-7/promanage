import { apiCall } from '@/lib/api';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

const SELECT_LIST_URL = `${API_BASE}/FiscalYear/SelectList`;

export interface FiscalYearSelectOption {
  value: string;
  label: string;
}

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
    item.FiscalYear ?? item.FiscalYearName ?? item.name ?? item.Text ?? label
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
