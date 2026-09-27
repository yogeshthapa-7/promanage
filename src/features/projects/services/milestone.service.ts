import { apiCall } from '@/lib/api/api.service';
import type { ApiProject } from '@/features/projects/types/projects-types';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
export const MILESTONES_API = `${API_BASE}/ProjectMilestone/ServerSearch`;
export const SAVE_MILESTONE_URL = `${API_BASE}/SaveProjectMilestone`;
export const DELETE_MILESTONE_URL = `${API_BASE}/DeleteProjectMilestone`;

export interface MilestoneItem {
  ProjectMilestoneID: number;
  ProjectInfoID: number;
  MilestoneTitle: string;
  WorkStatusID: number;
  WorkStatusName: string;
  MilestoneCost: number;
  StartDate: string;
  EndDate: string;
  Summary: string;
  Progress: number;
}


export async function fetchMilestones(project: ApiProject, signal?: AbortSignal): Promise<MilestoneItem[]> {
  const res = await apiCall(MILESTONES_API, {
    method: 'POST',
    body: JSON.stringify({
      model: {
        draw: 1,
        start: 0,
        length: 20,
        columns: [
          { data: 'ProjectMilestoneID', name: 'ProjectMilestoneID', searchable: true, orderable: true, search: { value: '', regex: '' } },
        ],
        search: { value: '', regex: '' },
        order: [{ column: 0, dir: 'desc' }],
      },
      param: {
        ProjectMilestoneID: 0,
        ProjectInfoID: project.ProjectInfoID ?? Number(project.ProjectInfoID),
        MilestoneTitle: '',
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
  return data as MilestoneItem[];
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
