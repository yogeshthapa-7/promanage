import { apiCall } from './api.service';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
export const TIMELINE_API = `${API_BASE}/ProjectTimelineInfo/ServerSearch`;

export interface TimelineItem {
  ProjectInfoID: number;
  Remarks: string;
  TraceKey: number;
  TraceID: number;
  TraceKeyName: string;
  CreatedDate: string;
  CreatedTime: string;
  CreateDateTime: string;
}

export async function fetchTimeline(projectId: string | number, signal?: AbortSignal): Promise<TimelineItem[]> {
  const res = await apiCall(TIMELINE_API, {
    method: 'POST',
    body: JSON.stringify({
      model: {
        draw: 1,
        start: 0,
        length: 20,
        columns: [{ data: 'ProjectInfoID', name: 'ProjectInfoID', searchable: true, orderable: true, search: { value: '', regex: '' } }],
        search: { value: '', regex: '' },
        order: [{ column: 0, dir: 'desc' }],
      },
      param: { ProjectInfoID: Number(projectId) },
    }),
    signal,
  });

  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  const json = await res.json();
  return Array.isArray(json?.data) ? (json.data as TimelineItem[]) : [];
}
