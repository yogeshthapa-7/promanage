import { apiCall, API_BASE } from '@/lib/api/api.service';
import type { ApiProject, ProjectDiscussionItem } from '@/features/projects/types/projects-types';


export const DISCUSSIONS_API = `${API_BASE}/ProjectDiscussion/ServerSearch`;
export const SAVE_DISCUSSION_URL = `${API_BASE}/SaveProjectDiscussion`;
export const DELETE_DISCUSSION_URL = `${API_BASE}/DeleteProjectDiscussion`;


export async function fetchDiscussions(project: ApiProject, signal?: AbortSignal): Promise<ProjectDiscussionItem[]> {
  const res = await apiCall(DISCUSSIONS_API, {
    method: 'POST',
    body: JSON.stringify({
      model: {
        draw: 1,
        start: 0,
        length: 20,
        columns: [
          { data: 'ProjectDiscussionID', name: 'ProjectDiscussionID', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'DiscussionTitle', name: 'DiscussionTitle', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'Priority', name: 'Priority', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'PriorityName', name: 'PriorityName', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'CreatedDate', name: 'CreatedDate', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'RaisedBy', name: 'RaisedBy', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'Comments', name: 'Comments', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'Attachments', name: 'Attachments', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'HasUserRightToEdit', name: 'HasUserRightToEdit', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'HasUserRightToDelete', name: 'HasUserRightToDelete', searchable: true, orderable: true, search: { value: '', regex: '' } },
        ],
        search: { value: '', regex: '' },
        order: [{ column: 0, dir: 'desc' }],
      },
      param: {
        ProjectDiscussionID: 0,
        DiscussionTitle: '',
        ProjectInfoID: project.ProjectInfoID ?? 0,
        Priority: 0,
        PriorityName: '',
        RaisedBy: '',
        CreatedDate: '',
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
  return data as ProjectDiscussionItem[];
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
