import { useEffect, useState } from "react";
import type { ApiProject } from "@/lib/projects-data";
import { apiCall } from "@/lib/api";

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const TASK_SUBTASK_API = `${API_BASE}/ProjectDetail/GetTaskSubTaskInfo`;

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
  TaskManagerInfo?: {
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
  };
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
  SubTaskManagerInfo?: {
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
  };
}

interface TaskApiResponse {
  Data: {
    TaskInfo: TaskItem[];
    SubTaskInfo: SubTaskItem[];
    EmployeeInfo: unknown[];
  };
  Message: unknown;
  Success: boolean;
}

const statusColor: Record<string, string> = {
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Overdue: "bg-rose-100 text-rose-700",
  "On Hold": "bg-amber-100 text-amber-700",
  "Not Started": "bg-gray-100 text-gray-700",
};

const priorityColor: Record<string, string> = {
  Urgent: "bg-rose-100 text-rose-700",
  High: "bg-amber-100 text-amber-700",
  Medium: "bg-blue-100 text-blue-700",
  Low: "bg-gray-100 text-gray-700",
};

interface TasksTabProps {
  project: ApiProject;
}

export default function TasksTab({ project }: TasksTabProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [subTasks, setSubTasks] = useState<SubTaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTasks([]);
    setSubTasks([]);

    const projectId = project.ProjectInfoID ?? Number(project.id);

    apiCall(TASK_SUBTASK_API, {
      method: "POST",
      body: JSON.stringify({
        id: projectId,
        Title: "",
        Type: 0,
        ManagerID: 0,
        Emps: "",
        Status: 0,
        Priority: 0,
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
        const json = (await res.json()) as TaskApiResponse;
        if (!cancelled) {
          setTasks(Array.isArray(json?.Data?.TaskInfo) ? json.Data.TaskInfo : []);
          setSubTasks(Array.isArray(json?.Data?.SubTaskInfo) ? json.Data.SubTaskInfo : []);
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load tasks");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [project]);

  const subtasksByTask = subTasks.reduce<Record<number, SubTaskItem[]>>((acc, sub) => {
    if (!acc[sub.TaskInfoID]) acc[sub.TaskInfoID] = [];
    acc[sub.TaskInfoID].push(sub);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading tasks...</div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-base text-rose-700">{error}</div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">No tasks found for this project.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tasks.map((task) => {
        const statusClass = statusColor[task.WorkStatusName] ?? "bg-gray-100 text-gray-700";
        const priorityClass = priorityColor[task.PriorityName] ?? "bg-gray-100 text-gray-700";
        const taskSubtasks = subtasksByTask[task.TaskInfoID] ?? [];
        return (
          <div key={task.TaskInfoID} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">{task.TaskTitle}</h3>
                {task.TaskCode && <p className="text-sm text-muted-foreground font-mono mt-0.5">{task.TaskCode}</p>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass}`}>{task.WorkStatusName}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${priorityClass}`}>{task.PriorityName}</span>
              </div>
            </div>

            <p className="text-sm text-slate-500 line-clamp-3">{task.Description}</p>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Due: {task.DueDate || "—"}</span>
              <span>{task.DueInfo || ""}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {task.TaskManagerPhoto ? (
                  <img src={task.TaskManagerPhoto} alt={task.TaskManagerName || ""} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                    {(task.TaskManagerName || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-slate-700 truncate max-w-[140px]">{task.TaskManagerName}</span>
              </div>
              <span className="text-sm text-muted-foreground">Weightage: {task.Weightage}</span>
            </div>

            {taskSubtasks.length > 0 && (
              <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sub-tasks</p>
                <div className="flex flex-col gap-1.5">
                  {taskSubtasks.map((sub) => (
                    <div key={sub.SubTaskInfoID} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{sub.SubTaskTitle}</p>
                        <p className="text-xs text-muted-foreground">Manager: {sub.SubTaskManagerName || "—"}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${priorityColor[sub.PriorityName] ?? "bg-gray-100 text-gray-700"}`}>{sub.PriorityName}</span>
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${statusColor[sub.WorkStatusName] ?? "bg-gray-100 text-gray-700"}`}>{sub.WorkStatusName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
