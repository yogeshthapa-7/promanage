import { apiCall } from '@/lib/api';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

export async function fetchProjectCount(): Promise<number> {
  const res = await apiCall(`${API_BASE}/ProjectInfo/ServerSearch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: {
        draw: 1,
        start: 0,
        length: 1,
        columns: [
          { data: 'ProjectInfoID', name: 'ProjectInfoID', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'ProjectName', name: 'ProjectName', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'ProjectCode', name: 'ProjectCode', searchable: true, orderable: true, search: { value: '', regex: '' } },
        ],
        search: { value: '', regex: '' },
        order: [{ column: 0, dir: 'desc' }],
      },
      param: { ProjectInfoID: 0 },
    }),
  }, 60000);
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  const json = await res.json();
  return json?.recordsFiltered ?? json?.recordsTotal ?? 0;
}

export async function fetchTaskCount(): Promise<number> {
  const res = await apiCall(`${API_BASE}/TaskInfo/ServerSearch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: {
        draw: 1,
        start: 0,
        length: 1,
        search: { value: '', regex: '' },
      },
      param: {
        TaskInfoID: 0,
        ProjectInfoID: 0,
      },
    }),
  }, 60000);
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  const json = await res.json();
  return json?.recordsFiltered ?? json?.recordsTotal ?? 0;
}

export async function fetchOrganizationCount(): Promise<number> {
  const res = await apiCall(`${API_BASE}/Organization/ServerSearch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: { draw: 1, start: 0, length: 1, search: { value: '', regex: '' } },
      param: { OrganizationID: 0, Title: '', ParentOrganizationID: 0 },
    }),
  }, 60000);
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  const json = await res.json();
  return json?.recordsFiltered ?? json?.recordsTotal ?? 0;
}

export async function fetchDepartmentCount(): Promise<number> {
  const res = await apiCall(`${API_BASE}/Department/ServerSearch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: { draw: 1, start: 0, length: 1, search: { value: '', regex: '' } },
      param: { search: '', DepartmentName: '', DepartmentCode: '', DepartmentID: 0, MainDepartmentID: 0 },
    }),
  }, 60000);
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  const json = await res.json();
  return json?.recordsFiltered ?? json?.recordsTotal ?? 0;
}
