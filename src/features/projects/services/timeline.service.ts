import { apiCall, API_BASE } from '@/lib/api/api.service';
import type { TimelineItem } from '@/features/projects/types/projects-types';


export const TIMELINE_API = `${API_BASE}/ProjectTimelineInfo/ServerSearch`;


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
