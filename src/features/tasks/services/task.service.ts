import { apiCall } from '@/features/projects/services/api.service';
import type { TaskItem, SubTaskItem, TaskStats, ProjectTaskCounts } from '@/features/projects/types/tasks-types';
import type { ApiProject } from '@/features/projects/types/projects-types';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
export const TASKS_API = `${API_BASE}/TaskInfo/ServerSearch`;
export const SUBTASKS_API = `${API_BASE}/SubTaskInfo/ServerSearch`;
export const TASK_STATUS_CHANGE_URL = `${API_BASE}/TaskInfo/ChangeWorkStatus`;
export const DELETE_SUBTASK_URL = `${API_BASE}/DeleteSubTaskInfo`;
export const PROJECT_DETAIL_URL = `${API_BASE}/GetProjectDetailData`;
export const WORK_STATUS_SELECT_LIST_URL = `${API_BASE}/WorkStatus/SelectList`;

export const statusColor: Record<string, string> = {
  "In Progress": "!bg-blue-100 !text-blue-700",
  Completed: "!bg-emerald-100 !text-emerald-700",
  Overdue: "!bg-rose-100 !text-rose-700",
  "On Hold": "!bg-amber-100 !text-amber-700",
  "Not Started": "!bg-gray-100 !text-gray-700",
};

export const priorityColor: Record<string, string> = {
  Urgent: "!bg-rose-100 !text-rose-700",
  High: "!bg-amber-100 !text-amber-700",
  Medium: "!bg-blue-100 !text-blue-700",
  Low: "!bg-gray-100 !text-gray-700",
};

interface ServerSearchResponse {
  data?: unknown[];
  recordsTotal?: number;
  recordsFiltered?: number;
}

interface FetchResult<T> {
  items: T[];
  total: number;
  filtered: number;
}

export async function fetchTasks(params: {
  projectId: number;
  page: number;
  pageSize: number;
  search?: string;
  signal?: AbortSignal;
}): Promise<FetchResult<TaskItem>> {
  const { projectId, page, pageSize, search = '', signal } = params;
  const start = (page - 1) * pageSize;

  try {
    const res = await apiCall(TASKS_API, {
      method: 'POST',
      body: JSON.stringify({
        model: {
          draw: 1,
          start,
          length: pageSize,
          columns: [
            { data: 'TaskInfoID', name: 'TaskInfoID', searchable: true, orderable: true, search: { value: search, regex: '' } },
            { data: 'TaskTitle', name: 'TaskTitle', searchable: true, orderable: true, search: { value: search, regex: '' } },
          ],
          search: { value: search, regex: '' },
          order: [{ column: 1, dir: 'desc' }],
        },
        param: {
          TaskInfoID: 0,
          TaskTitle: '',
          TaskCode: '',
          TaskManagerID: 0,
          InvolvedEmployees: '',
          Weightage: 0,
          OrderKey: 0,
          Priority: 0,
          WorkStatusID: 0,
          Description: '',
          Attachments: '',
          ProjectInfoID: projectId,
        },
      }),
      signal,
    }, 60000);

    if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.statusText}`);
    const json = (await res.json()) as ServerSearchResponse;
    const rows = Array.isArray(json?.data) ? (json.data as TaskItem[]) : [];

    return {
      items: rows,
      total: json.recordsTotal ?? 0,
      filtered: json.recordsFiltered ?? 0,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    console.error("API Call structural error failure:", err);
    return { items: [], total: 0, filtered: 0 };
  }
}

function buildTaskSearchBody(params: {
  start: number;
  length: number;
  search?: string;
  orderColumn?: number;
  orderDir?: 'asc' | 'desc';
  projectId?: number;
  statusName?: string;
  priorityName?: string;
}) {
  const {
    start,
    length,
    search = '',
    orderColumn = 1,
    orderDir = 'desc',
    projectId,
    statusName,
    priorityName,
  } = params;

  const searchValue = search.trim();

  return {
    model: {
      draw: 1,
      start,
      length,
      columns: [
        { data: 'TaskInfoID', name: 'TaskInfoID', searchable: true, orderable: true, search: { value: searchValue, regex: '' } },
        { data: 'TaskTitle', name: 'TaskTitle', searchable: true, orderable: true, search: { value: searchValue, regex: '' } },
        { data: 'TaskCode', name: 'TaskCode', searchable: true, orderable: true, search: { value: searchValue, regex: '' } },
        { data: 'WorkStatusName', name: 'WorkStatusName', searchable: true, orderable: true, search: { value: statusName || '', regex: '' } },
        { data: 'PriorityName', name: 'PriorityName', searchable: true, orderable: true, search: { value: priorityName || '', regex: '' } },
      ],
      search: { value: searchValue, regex: '' },
      order: [{ column: orderColumn, dir: orderDir }],
    },
    param: {
      TaskInfoID: 0,
      ProjectInfoID: projectId ?? 0,
      TaskTitle: '',
      TaskManagerName: '',
      ProjectInfoName: '',
      WorkStatusName: statusName || '',
      PriorityName: priorityName || '',
    },
  };
}

export async function fetchAllTasks(params: {
  page: number;
  pageSize: number;
  search?: string;
  statusName?: string;
  priorityName?: string;
  projectId?: number;
  sortBy?: 'name' | 'status' | 'priority' | 'dueDate';
  orderDir?: 'asc' | 'desc';
  signal?: AbortSignal;
}): Promise<FetchResult<TaskItem>> {
  const {
    page,
    pageSize,
    search = '',
    statusName,
    priorityName,
    projectId,
    sortBy = 'name',
    orderDir = 'desc',
    signal,
  } = params;
  const start = (page - 1) * pageSize;

  let orderColumn = 1;
  if (sortBy === 'status') orderColumn = 3;
  else if (sortBy === 'priority') orderColumn = 4;
  else if (sortBy === 'dueDate') orderColumn = 12;

  try {
    const res = await apiCall(TASKS_API, {
      method: 'POST',
      body: JSON.stringify(buildTaskSearchBody({
        start,
        length: pageSize,
        search,
        orderColumn,
        orderDir,
        projectId,
        statusName,
        priorityName,
      })),
      signal,
    }, 60000);

    if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.statusText}`);
    const json = (await res.json()) as ServerSearchResponse;
    const rows = Array.isArray(json?.data) ? (json.data as TaskItem[]) : [];

    return {
      items: rows,
      total: json.recordsTotal ?? json.recordsFiltered ?? rows.length ?? 0,
      filtered: json.recordsFiltered ?? 0,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    return { items: [], total: 0, filtered: 0 };
  }
}

export async function fetchTaskStats(projectId: number, signal?: AbortSignal): Promise<TaskStats> {
  const res = await apiCall(TASKS_API, {
    method: 'POST',
    body: JSON.stringify({
      model: {
        draw: 1,
        start: 0,
        length: 50,
        columns: [
          { data: 'TaskInfoID', name: 'TaskInfoID', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'TaskTitle', name: 'TaskTitle', searchable: true, orderable: true, search: { value: '', regex: '' } },
        ],
        search: { value: '', regex: '' },
        order: [{ column: 1, dir: 'desc' }],
      },
      param: {
        TaskInfoID: 0,
        TaskTitle: '',
        TaskCode: '',
        TaskManagerID: 0,
        InvolvedEmployees: '',
        Weightage: 0,
        OrderKey: 0,
        Priority: 0,
        WorkStatusID: 0,
        Description: '',
        Attachments: '',
        ProjectInfoID: projectId,
      },
    }),
    signal,
  }, 60000);

  if (!res.ok) throw new Error(`Failed to fetch task stats: ${res.statusText}`);
  const json = (await res.json()) as ServerSearchResponse;
  const rows = Array.isArray(json?.data) ? (json.data as TaskItem[]) : [];

  const stats: TaskStats = { total: json.recordsTotal ?? 0 };
  rows.forEach((task) => {
    stats[task.WorkStatusName] = (stats[task.WorkStatusName] || 0) + 1;
  });

  return stats;
}

export async function fetchAllProjectTaskCounts(
  signal?: AbortSignal
): Promise<Record<number, ProjectTaskCounts>> {
  const result: Record<number, ProjectTaskCounts> = {};
  try {
    const res = await apiCall(TASKS_API, {
      method: 'POST',
      body: JSON.stringify({
        model: {
          draw: 1,
          start: 0,
          length: 1000,
          columns: [
            { data: 'TaskInfoID', name: 'TaskInfoID', searchable: true, orderable: true, search: { value: '', regex: '' } },
            { data: 'TaskTitle', name: 'TaskTitle', searchable: true, orderable: true, search: { value: '', regex: '' } },
          ],
          search: { value: '', regex: '' },
          order: [{ column: 1, dir: 'desc' }],
        },
        param: {
          TaskInfoID: 0,
          TaskTitle: '',
          TaskCode: '',
          TaskManagerID: 0,
          InvolvedEmployees: '',
          Weightage: 0,
          OrderKey: 0,
          Priority: 0,
          WorkStatusID: 0,
          Description: '',
          Attachments: '',
          ProjectInfoID: 0,
        },
      }),
      signal,
    }, 60000);

    if (!res.ok) throw new Error(`Failed to fetch task counts: ${res.statusText}`);
    const json = (await res.json()) as ServerSearchResponse;
    const rows = Array.isArray(json?.data) ? (json.data as TaskItem[]) : [];

    for (const t of rows) {
      const pid = Number(t.ProjectInfoID);
      if (!pid) continue;
      if (!result[pid]) result[pid] = { total: 0, completed: 0, byStatus: {} };
      const status = t.WorkStatusName || 'Unknown';
      result[pid].total += 1;
      result[pid].byStatus[status] = (result[pid].byStatus[status] || 0) + 1;
      if (status.toLowerCase() === 'completed') {
        result[pid].completed += 1;
      }
    }
    return result;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    return result;
  }
}

export async function fetchSubTasks(params: {
  projectId: number;
  taskInfoId: number;
  page: number;
  pageSize: number;
  search?: string;
  signal?: AbortSignal;
  priority?: number;
  workStatusId?: number;
  managerId?: number;
}): Promise<FetchResult<SubTaskItem>> {
  const { projectId, taskInfoId, page, pageSize, search = '', signal, priority, workStatusId, managerId } = params;
  const start = (page - 1) * pageSize;

  try {
    const res = await apiCall(SUBTASKS_API, {
      method: 'POST',
      body: JSON.stringify({
        model: {
          draw: 1,
          start,
          length: pageSize,
          columns: [
            { data: 'SubTaskInfoID', name: 'SubTaskInfoID', searchable: true, orderable: true, search: { value: '', regex: '' } },
            { data: 'SubTaskTitle', name: 'SubTaskTitle', searchable: true, orderable: true, search: { value: search, regex: '' } },
          ],
          search: { value: search, regex: '' },
          order: [{ column: 1, dir: 'desc' }],
        },
        param: {
          SubTaskInfoID: 0,
          SubTaskTitle: '',
          SubTaskCode: '',
          SubTaskManagerID: managerId ?? 0,
          InvolvedEmployees: '',
          Weightage: 0,
          OrderKey: 0,
          Priority: priority ?? 0,
          WorkStatusID: workStatusId ?? 0,
          TaskInfoID: taskInfoId,
          ProjectInfoID: projectId,
        },
      }),
      signal,
    }, 60000);

    if (!res.ok) throw new Error(`Failed to fetch subtasks: ${res.statusText}`);
    const json = (await res.json()) as ServerSearchResponse;
    const rows = Array.isArray(json?.data) ? (json.data as SubTaskItem[]) : [];

    return {
      items: rows,
      total: json.recordsTotal ?? 0,
      filtered: json.recordsFiltered ?? 0,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    console.error("API Call structural error failure:", err);
    return { items: [], total: 0, filtered: 0 };
  }
}

export async function saveTask(body: Record<string, unknown>): Promise<{ success: boolean; message?: string; data?: unknown }> {
  const res = await apiCall(`${API_BASE}/SaveTaskInfo`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.Message || `Failed to save task: ${res.statusText}`);
  return {
    success: json.Success ?? true,
    message: json.Message,
    data: json.Data ?? json.data,
  };
}

export async function deleteTask(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await apiCall(`${API_BASE}/DeleteTaskInfo?id=${id}`, { method: 'GET' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Failed to delete task: ${res.statusText}`);
  return { success: json.Success !== false, message: json.Message };
}

export async function deleteSubTask(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await apiCall(`${DELETE_SUBTASK_URL}?id=${id}`, { method: 'GET' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Failed to delete subtask: ${res.statusText}`);
  return { success: json.Success !== false, message: json.Message };
}

export async function saveSubTask(body: Record<string, unknown>): Promise<{ success: boolean; message?: string }> {
  const res = await apiCall(`${API_BASE}/SaveSubTaskInfo`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Failed to save subtask: ${res.statusText}`);
  return { success: json.Success !== false, message: json.Message };
}

export async function fetchWorkStatuses(signal?: AbortSignal): Promise<
  Array<{
    WorkStatusInfoID: number;
    StatusName: string;
    StatusCode: string;
    Color?: string;
    IconName?: string;
  }>
> {
  const res = await apiCall(WORK_STATUS_SELECT_LIST_URL, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  const list: Record<string, unknown>[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? (data.data as Record<string, unknown>[]) : [];
  return list.map((item) => ({
    WorkStatusInfoID: Number(item.WorkStatusInfoID ?? item.Value ?? 0),
    StatusName: String(item.StatusName ?? item.Name ?? ''),
    StatusCode: String(item.StatusCode ?? ''),
    Color: item.Color as string | undefined,
    IconName: item.IconName as string | undefined,
  }));
}

export async function changeTaskStatus(taskId: number, workStatusId: number): Promise<void> {
  const res = await apiCall(TASK_STATUS_CHANGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      TaskInfoID: taskId,
      WorkStatusID: workStatusId,
    }),
  });
  if (!res.ok) throw new Error(`Failed to update task status: ${res.statusText}`);
}

export async function postServerSearch<T>(
  endpoint: string,
  param: Record<string, any>,
  signal?: AbortSignal
): Promise<T[]> {
  const payload = {
    model: {
      columns: Object.keys(param).map((key) => ({
        data: key,
        name: key,
        searchable: true,
        orderable: true,
      })),
      draw: 1,
      start: 0,
      length: 200,
      order: [{ column: 1, dir: 'desc' }],
      search: { value: '', regex: '' },
    },
    param,
  };

  const res = await apiCall(`${API_BASE}${endpoint}`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, 10000);

  if (!res.ok) throw new Error(`Request to ${endpoint} failed: ${res.statusText}`);
  const json = await res.json();
  return json?.data || [];
}

export async function fetchProjectInfo(projectId: string | number, signal?: AbortSignal): Promise<ApiProject> {
  const sanitizedId = encodeURIComponent(String(projectId));
  const res = await apiCall(`${PROJECT_DETAIL_URL}?id=${sanitizedId}`, {
    method: 'GET',
    signal,
  }, 10000);

  if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
  const json = await res.json();
  const data = json?.Data ?? json?.data;
  const project = data?.ProjectInfo ?? data?.projectInfo;
  if (!project || !project.ProjectInfoID) throw new Error('Project details not found');

  return project as ApiProject;
}

export async function fetchProjectTasks(projectId: string | number, signal?: AbortSignal): Promise<any[]> {
  return postServerSearch<any>(
    '/TaskInfo/ServerSearch',
    {
      TaskInfoID: 0,
      ProjectInfoID: Number(projectId),
      TaskTitle: '',
      TaskName: '',
      TaskManagerName: '',
    },
    signal
  );
}
