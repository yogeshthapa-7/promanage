import { apiCall, cachedQuery, API_BASE } from '@/lib/api/api.service';
import type { TimelineItem } from '@/features/projects/types/projects-types';

export type { TimelineItem } from '@/features/projects/types/projects-types';


export const TIMELINE_API = `${API_BASE}/ProjectTimelineInfo/ServerSearch`;


export async function fetchTimeline(projectId: string | number, signal?: AbortSignal): Promise<TimelineItem[]> {
  return await cachedQuery(
    ['timeline', projectId],
    (signal) => doFetchTimeline(projectId, signal),
    signal
  );
}

async function doFetchTimeline(projectId: string | number, signal?: AbortSignal): Promise<TimelineItem[]> {
  const res = await apiCall(TIMELINE_API, {
    method: 'POST',
    body: JSON.stringify({
      model: {
        draw: 1,
        start: 0,
        length: 20,
        search: { value: '', regex: '' },
      },
      param: { ProjectInfoID: Number(projectId) },
    }),
    signal,
  });

  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  const json = await res.json();
  return Array.isArray(json?.data) ? (json.data as TimelineItem[]) : [];
}
