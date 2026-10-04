import { apiCall, cachedQuery, API_BASE } from '@/lib/api/api.service';
import type { ApiProject, IssueItem } from '@/features/projects/types/projects-types';


export const ISSUES_API = `${API_BASE}/Issues/ServerSearch`;
export const SAVE_ISSUE_URL = `${API_BASE}/SaveIssues`;
export const DELETE_ISSUE_URL = `${API_BASE}/DeleteIssues`;
export const STATUS_SELECT_LIST_URL = `${API_BASE}/WorkStatus/SelectList`;
export const LABEL_INFO_SELECT_LIST_URL = `${API_BASE}/LabelInfo/SelectList`;


export async function fetchIssues(
  project: ApiProject,
  params: { start: number; length: number; search?: string },
  signal?: AbortSignal
): Promise<{ items: IssueItem[]; total: number; filtered: number }> {
  return await cachedQuery(
    ['issues', 'search', project.ProjectInfoID, params.search, params.start, params.length],
    (signal) => doFetchIssues(project, params, signal),
    signal
  );
}

async function doFetchIssues(
  _project: ApiProject,
  params: { start: number; length: number; search?: string },
  signal?: AbortSignal
): Promise<{ items: IssueItem[]; total: number; filtered: number }> {
  const res = await apiCall(ISSUES_API, {
    method: 'POST',
    body: JSON.stringify({
      model: {
        draw: 1,
        start: params.start || 0,
        length: params.length || 12,
        search: { value: (params.search || '').trim(), regex: '' },
      },
      param: { IssuesID: 0, ProjectInfoID: _project.ProjectInfoID },
    }),
    signal,
  });

  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  const json = await res.json();
  const data = Array.isArray(json?.data) ? json.data : [];
  return {
    items: data as IssueItem[],
    total: json.recordsTotal ?? data.length,
    filtered: json.recordsFiltered ?? data.length,
  };
}

export async function saveIssue(body: Record<string, unknown>): Promise<void> {
  const res = await apiCall(SAVE_ISSUE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
}

export async function deleteIssue(id: number): Promise<void> {
  const res = await apiCall(`${DELETE_ISSUE_URL}?id=${id}`, { method: 'GET' });
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
}
