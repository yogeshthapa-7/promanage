import { apiCall, cachedQuery, API_BASE } from '@/lib/api/api.service';




export async function fetchProjectCount(): Promise<number> {
  return await cachedQuery(
    ['projectCount'],
    async (signal) => {
      const res = await apiCall(`${API_BASE}/ProjectInfo/ServerSearch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: {
            draw: 1,
            start: 0,
            length: 1,
            search: { value: '', regex: '' },
          },
          param: { ProjectInfoID: 0 },
        }),
        signal,
      }, 60000);
      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
      const json = await res.json();
      return json?.recordsFiltered ?? json?.recordsTotal ?? 0;
    },
    undefined
  );
}

export async function fetchTaskCount(): Promise<number> {
  return await cachedQuery(
    ['taskCount'],
    async (signal) => {
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
          param: { TaskInfoID: 0 },
        }),
        signal,
      }, 60000);
      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
      const json = await res.json();
      return json?.recordsFiltered ?? json?.recordsTotal ?? 0;
    },
    undefined
  );
}

export async function fetchOrganizationCount(): Promise<number> {
  return await cachedQuery(
    ['organizationCount'],
    async (signal) => {
      const res = await apiCall(`${API_BASE}/Organization/ServerSearch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: { draw: 1, start: 0, length: 1, search: { value: '', regex: '' } },
          param: { OrganizationID: 0 },
        }),
        signal,
      }, 60000);
      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
      const json = await res.json();
      return json?.recordsFiltered ?? json?.recordsTotal ?? 0;
    },
    undefined
  );
}

export async function fetchDepartmentCount(): Promise<number> {
  return await cachedQuery(
    ['departmentCount'],
    async (signal) => {
      const res = await apiCall(`${API_BASE}/Department/ServerSearch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: { draw: 1, start: 0, length: 1, search: { value: '', regex: '' } },
          param: { DepartmentID: 0 },
        }),
        signal,
      }, 60000);
      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
      const json = await res.json();
      return json?.recordsFiltered ?? json?.recordsTotal ?? 0;
    },
    undefined
  );
}

export async function fetchUsersCount(): Promise<number> {
  return await cachedQuery(
    ['usersCount'],
    async (signal) => {
      const res = await apiCall(`${API_BASE}/Users/ServerSearch`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify ({
              model: { draw: 1, start: 0, length: 1, search: {value: '', regex: ''}},
              param: { UserId: 0 }
          }),
          signal,
      }, 60000);
      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
      const json = await res.json();
      return json?.recordsFiltered ?? json?.recordsTotal ?? 0;
    },
    undefined
  );
}

export async function fetchEmployeeCount(): Promise<number> {
  return await cachedQuery(
    ['employeeCount'],
    async (signal) => {
      const res = await apiCall(`${API_BASE}/EmployeeInfo/ServerSearch`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify ({
              model: {draw: 1, start: 0, length: 1, search: {value: '', regex: ''}},
              param: { EmployeeInfoID: 0 }
          }),
          signal,
      }, 60000);
      if(!res.ok) throw new Error (`Failed: ${res.statusText}`);
      const json = await res.json();
      return json?.recordsFiltered ?? json?.recordsTotal ?? 0;
    },
    undefined
  );
}







