import { apiCall, cachedQuery, API_BASE } from '@/lib/api/api.service';
import type { ApiProject, ProjectDiscussionItem } from '@/features/projects/types/projects-types';


export const DISCUSSIONS_API = `${API_BASE}/ProjectDiscussion/ServerSearch`;
export const SAVE_DISCUSSION_URL = `${API_BASE}/SaveProjectDiscussion`;
export const DELETE_DISCUSSION_URL = `${API_BASE}/DeleteProjectDiscussion`;


export async function fetchDiscussions(
  project: ApiProject,
  params: { start: number; length: number; search?: string },
  signal?: AbortSignal
): Promise<{ items: ProjectDiscussionItem[]; total: number; filtered: number }> {
  return await cachedQuery(
    ['discussions', 'search', project.ProjectInfoID, params.search, params.start, params.length],
    (signal) => doFetchDiscussions(project, params, signal),
    signal
  );
}

async function doFetchDiscussions(
  _project: ApiProject,
  params: { start: number; length: number; search?: string },
  signal?: AbortSignal
): Promise<{ items: ProjectDiscussionItem[]; total: number; filtered: number }> {
  const res = await apiCall(DISCUSSIONS_API, {
    method: 'POST',
    body: JSON.stringify({
      model: {
        draw: 1,
        start: params.start || 0,
        length: params.length || 12,
        search: { value: (params.search || '').trim(), regex: '' },
      },
      param: { ProjectDiscussionID: 0, ProjectInfoID: _project.ProjectInfoID },
    }),
    signal,
  });

  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  const json = await res.json();
  const data = Array.isArray(json?.data) ? json.data : [];
  return {
    items: data as ProjectDiscussionItem[],
    total: json.recordsTotal ?? data.length,
    filtered: json.recordsFiltered ?? data.length,
  };
}

export async function saveDiscussion(body: Record<string, unknown>): Promise<void> {
  const res = await apiCall(SAVE_DISCUSSION_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
}

export async function deleteDiscussion(id: number): Promise<void> {
  const res = await apiCall(`${DELETE_DISCUSSION_URL}?id=${id}`, { method: 'GET' });
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
}
