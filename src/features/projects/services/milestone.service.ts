import { apiCall, cachedQuery, API_BASE } from '@/lib/api/api.service';
import type { ApiProject, MilestoneItem } from '@/features/projects/types/projects-types';

export type { MilestoneItem } from '@/features/projects/types/projects-types';

export const MILESTONES_API = `${API_BASE}/ProjectMilestone/ServerSearch`;
export const SAVE_MILESTONE_URL = `${API_BASE}/SaveProjectMilestone`;
export const DELETE_MILESTONE_URL = `${API_BASE}/DeleteProjectMilestone`;



export async function fetchMilestones(
  project: ApiProject,
  params: { start: number; length: number; search?: string },
  signal?: AbortSignal
): Promise<{ items: MilestoneItem[]; total: number; filtered: number }> {
  return await cachedQuery(
    ['milestones', 'search', project.ProjectInfoID, params.search, params.start, params.length],
    (signal) => doFetchMilestones(project, params, signal),
    signal
  );
}

async function doFetchMilestones(
  _project: ApiProject,
  params: { start: number; length: number; search?: string },
  signal?: AbortSignal
): Promise<{ items: MilestoneItem[]; total: number; filtered: number }> {
  const res = await apiCall(MILESTONES_API, {
    method: 'POST',
    body: JSON.stringify({
      model: {
        draw: 1,
        start: params.start || 0,
        length: params.length || 12,
        search: { value: (params.search || '').trim(), regex: '' },
      },
      param: { ProjectMilestoneID: 0, ProjectInfoID: _project.ProjectInfoID },
    }),
    signal,
  });

  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  const json = await res.json();
  const data = Array.isArray(json?.data) ? json.data : [];
  return {
    items: data as MilestoneItem[],
    total: json.recordsTotal ?? data.length,
    filtered: json.recordsFiltered ?? data.length,
  };
}

export async function saveMilestone(body: Record<string, unknown>): Promise<void> {
  const res = await apiCall(SAVE_MILESTONE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
}

export async function deleteMilestone(id: number): Promise<void> {
  const res = await apiCall(`${DELETE_MILESTONE_URL}?id=${id}`, { method: 'GET' });
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
}
