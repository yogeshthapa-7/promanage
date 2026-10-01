import { apiCall, API_BASE } from '@/lib/api/api.service';
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
  const res = await apiCall(ISSUES_API, {
    method: 'POST',
    body: JSON.stringify({
      model: {
        draw: 1,
        start: params.start,
        length: params.length,
        columns: [
          { data: 'IssuesID', name: 'IssuesID', searchable: true, orderable: true, search: { value: params.search || '', regex: '' } },
          { data: 'IssuesTitle', name: 'IssuesTitle', searchable: true, orderable: true, search: { value: params.search || '', regex: '' } },
          { data: 'Comments', name: 'Comments', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'RaisedBy', name: 'RaisedBy', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'CreatedDate', name: 'CreatedDate', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'WorkStatusName', name: 'WorkStatusName', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'LabelInfoName', name: 'LabelInfoName', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'LabelColor', name: 'LabelColor', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'Priority', name: 'Priority', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'PriorityName', name: 'PriorityName', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'WorkStatusColor', name: 'WorkStatusColor', searchable: true, orderable: true, search: { value: '', regex: '' } },
        ],
        search: { value: params.search || '', regex: '' },
        order: [{ column: 0, dir: 'desc' }],
      },
      param: {
        IssuesID: 0,
        IssuesTitle: params.search || '',
        LabelInfoID: 0,
        Comments: '',
        Attachments: '',
        ProjectInfoID: project.ProjectInfoID ?? Number(project.ProjectInfoID),
        WorkStatusID: 0,
        ProjectInfoName: '',
        WorkStatusName: '',
        LabelInfoName: '',
        LabelColor: '',
        CreatedDate: '',
        RaisedBy: '',
        WorkStatusColor: '',
        CanChangeStatus: true,
        CanEdit: true,
        CanDelete: true,
      },
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
