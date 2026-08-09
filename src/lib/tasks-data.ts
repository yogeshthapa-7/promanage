import { apiCall } from '@/lib/api';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
const TASKS_API = `${API_BASE}/TaskInfo/ServerSearch`;
const SUBTASKS_API = `${API_BASE}/SubTaskInfo/ServerSearch`;

export interface TaskManagerInfo {
  EmployeeInfoID: number;
  Fullname: string;
  Address: string;
  Phone: string;
  Email: string;
  Gender: number;
  DOB: string | null;
  DepartmentID: number;
  MainBranchID: number;
  BranchID: number;
  Photo: string;
  EmpStatus: number;
  Username: string | null;
  Password: string | null;
  OrganizationOfficeID: number;
  DepartmentName: string;
  BranchName: string;
  MainBranchName: string | null;
  OrganizationOfficeName: string | null;
  TraceKey: string | null;
}

export interface TaskItem {
  TaskInfoID: number;
  TaskTitle: string;
  TaskCode: string;
  TaskManagerID: number;
  InvolvedEmployees: string;
  Weightage: number;
  OrderKey: number;
  Priority: number;
  WorkStatusID: number;
  Description: string;
  Attachments: string;
  ProjectInfoID: number;
  DueDate: string;
  TaskManagerName: string;
  WorkStatusIconName: string;
  TaskManagerPhoto: string | null;
  WorkStatusName: string;
  WorkStatusColor: string;
  DueInfo: string;
  PriorityName: string;
  InvolvedEmployeesDetail: unknown | null;
  TaskManagerInfo?: TaskManagerInfo;
}

export interface SubTaskItem {
  SubTaskInfoID: number;
  SubTaskTitle: string;
  SubTaskCode: string;
  SubTaskManagerID: number;
  InvolvedEmployees: string;
  Weightage: number;
  OrderKey: number;
  Priority: number;
  WorkStatusID: number;
  TaskInfoID: number;
  ProjectInfoID: number;
  TaskInfoName: string | null;
  SubTaskManagerName: string | null;
  SubTaskManagerPhoto: string | null;
  WorkStatusColor: string;
  WorkStatusName: string;
  PriorityName: string;
  WorkStatusIconName: string;
  SubTaskManagerInfo?: TaskManagerInfo;
}

export const statusColor: Record<string, string> = {
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Overdue: "bg-rose-100 text-rose-700",
  "On Hold": "bg-amber-100 text-amber-700",
  "Not Started": "bg-gray-100 text-gray-700",
};

export const priorityColor: Record<string, string> = {
  Urgent: "bg-rose-100 text-rose-700",
  High: "bg-amber-100 text-amber-700",
  Medium: "bg-blue-100 text-blue-700",
  Low: "bg-gray-100 text-gray-700",
};

interface FetchResult<T> {
  items: T[];
  total: number;
  filtered: number;
}

interface ServerSearchResponse {
  data?: unknown[];
  recordsTotal?: number;
  recordsFiltered?: number;
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
            { data: 'TaskInfoID', name: 'TaskInfoID', searchable: true, orderable: true, search: { value: '', regex: '' } },
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
    return { items: [], total: 0, filtered: 0 };
  }
}

export async function fetchSubTasks(params: {
  projectId: number;
  taskInfoId: number;
  page: number;
  pageSize: number;
  search?: string;
  signal?: AbortSignal;
}): Promise<FetchResult<SubTaskItem>> {
  const { projectId, taskInfoId, page, pageSize, search = '', signal } = params;
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
          SubTaskManagerID: 0,
          InvolvedEmployees: '',
          Weightage: 0,
          OrderKey: 0,
          Priority: 0,
          WorkStatusID: 0,
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
    return { items: [], total: 0, filtered: 0 };
  }
}
