import { apiCall, API_BASE } from '@/lib/api/api.service';
import type { ApiProject, MilestoneItem } from '@/features/projects/types/projects-types';

export const MILESTONES_API = `${API_BASE}/ProjectMilestone/ServerSearch`;
export const SAVE_MILESTONE_URL = `${API_BASE}/SaveProjectMilestone`;
export const DELETE_MILESTONE_URL = `${API_BASE}/DeleteProjectMilestone`;



export async function fetchMilestones(
  project: ApiProject,
  params: { start: number; length: number; search?: string },
  signal?: AbortSignal
): Promise<{ items: MilestoneItem[]; total: number; filtered: number }> {
  const res = await apiCall(MILESTONES_API, {
    method: 'POST',
    body: JSON.stringify({
      model: {
        draw: 1,
        start: params.start,
        length: params.length,
        columns: [
          { data: 'ProjectMilestoneID', name: 'ProjectMilestoneID', searchable: true, orderable: true, search: { value: params.search || '', regex: '' } },
          { data: 'MilestoneTitle', name: 'MilestoneTitle', searchable: true, orderable: true, search: { value: params.search || '', regex: '' } },
          { data: 'StartDate', name: 'StartDate', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'EndDate', name: 'EndDate', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'Progress', name: 'Progress', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'MilestoneCost', name: 'MilestoneCost', searchable: true, orderable: true, search: { value: '', regex: '' } },
        ],
        search: { value: params.search || '', regex: '' },
        order: [{ column: 0, dir: 'desc' }],
      },
      param: {
        ProjectMilestoneID: 0,
        ProjectInfoID: project.ProjectInfoID ?? Number(project.ProjectInfoID),
        MilestoneTitle: params.search || '',
        WorkStatusID: 0,
        MilestoneCost: 0,
        StartDate: '',
        EndDate: '',
        Summary: '',
        Progress: 0,
      },
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
