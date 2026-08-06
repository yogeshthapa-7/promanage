import { apiCall } from '@/lib/api';
import { Plus } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ApiProject } from "@/lib/projects-data";

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const PROJECTS_API = `${API_BASE}/ProjectInfo/ServerSearch`;
const PROJECT_DETAIL_API = `${API_BASE}/GetProjectDetailData`;
const TASK_SUBTASK_API = `${API_BASE}/ProjectDetail/GetTaskSubTaskInfo`;

const serverSearchBody = {
  model: {
    draw: 1,
    start: 0,
    length: 1000,
    columns: [
      { data: "ProjectInfoID", name: "ProjectInfoID", searchable: true, orderable: true, search: { value: "", regex: "" } },
      { data: "ProjectName", name: "ProjectName", searchable: true, orderable: true, search: { value: "", regex: "" } },
      { data: "ProjectCode", name: "ProjectCode", searchable: true, orderable: true, search: { value: "", regex: "" } },
    ],
    search: { value: "", regex: "" },
    order: [{ column: 0, dir: "desc" }],
  },
  param: { ProjectInfoID: 0 },
};

const tabs = ["Task", "Discussion", "Issue", "Milestone", "Timeline", "Kanban"] as const;
type Tab = typeof tabs[number];

interface TaskItem {
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

interface SubTaskItem {
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

export default function TasksPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const project = (location.state as { project?: ApiProject } | undefined)?.project;
  const [activeTab, setActiveTab] = useState<Tab>("Task");

  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [subTasks, setSubTasks] = useState<SubTaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  useEffect(() => {
    if (project) return;
    const controller = new AbortController();
    let cancelled = false;
    setProjectsLoading(true);
    apiCall(PROJECTS_API, {
      method: "POST",
      body: JSON.stringify(serverSearchBody),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? (json.data as ApiProject[]) : [];
        if (!cancelled) setProjects(rows);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [project]);

  useEffect(() => {
    if (!project || activeTab !== "Task") return;
    const controller = new AbortController();
    let cancelled = false;
    setTasksLoading(true);
    setTasksError(null);
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
        if (!cancelled) setTasksError(err instanceof Error ? err.message : "Failed to load tasks");
      })
      .finally(() => {
        if (!cancelled) setTasksLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [project, activeTab]);

  const handleSelectProject = (item: ApiProject) => {
    navigate("/tasks", { state: { project: item } });
  };

  const subtasksByTask = subTasks.reduce<Record<number, SubTaskItem[]>>((acc, sub) => {
    if (!acc[sub.TaskInfoID]) acc[sub.TaskInfoID] = [];
    acc[sub.TaskInfoID].push(sub);
    return acc;
  }, {});

  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">
            Organize, prioritize and track all your projects tasks in one place.
          </p>
        </div>

        {project && (
          <button
            onClick={() => navigate("/tasks")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Projects
          </button>
        )}
        {!project && (
          <button
            onClick={() => {}}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New Task
          </button>
        )}
      </div>

      {project ? (
        <>
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-800">{project.ProjectName}</h2>
            <p className="mt-1 text-xs text-slate-500 font-mono">{project.ProjectCode}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                {project.WorkStatusName}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                {project.PriorityName}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                {project.ProjectTypeName}
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  activeTab === tab
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {activeTab === "Task" ? (
              tasksLoading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground">Loading tasks...</div>
              ) : tasksError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{tasksError}</div>
              ) : tasks.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground text-center">No tasks found for this project.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {tasks.map((task) => {
                    const statusClass = statusColor[task.WorkStatusName] ?? "bg-gray-100 text-gray-700";
                    const priorityClass = priorityColor[task.PriorityName] ?? "bg-gray-100 text-gray-700";
                    const taskSubtasks = subtasksByTask[task.TaskInfoID] ?? [];
                    return (
                      <div key={task.TaskInfoID} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 truncate">{task.TaskTitle}</h3>
                            {task.TaskCode && <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{task.TaskCode}</p>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}>{task.WorkStatusName}</span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityClass}`}>{task.PriorityName}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-3">{task.Description}</p>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Due: {task.DueDate || "—"}</span>
                          <span>{task.DueInfo || ""}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {task.TaskManagerPhoto ? (
                              <img src={task.TaskManagerPhoto} alt={task.TaskManagerName || ""} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600">
                                {(task.TaskManagerName || "?").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-[11px] font-medium text-slate-700 truncate max-w-[140px]">{task.TaskManagerName}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground">Weightage: {task.Weightage}</span>
                        </div>

                        {taskSubtasks.length > 0 && (
                          <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sub-tasks</p>
                            <div className="flex flex-col gap-1.5">
                              {taskSubtasks.map((sub) => (
                                <div key={sub.SubTaskInfoID} className="flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 truncate">{sub.SubTaskTitle}</p>
                                    <p className="text-[10px] text-muted-foreground">Manager: {sub.SubTaskManagerName || "—"}</p>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${priorityColor[sub.PriorityName] ?? "bg-gray-100 text-gray-700"}`}>{sub.PriorityName}</span>
                                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusColor[sub.WorkStatusName] ?? "bg-gray-100 text-gray-700"}`}>{sub.WorkStatusName}</span>
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
              )
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                {activeTab} content coming soon.
              </div>
            )}
          </div>

          <hr className="border-slate-200 my-6" />
        </>
      ) : (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white">
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Select a project</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Choose a project to view its tasks.</p>
          </div>
          {projectsLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading projects...</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {projects.map((item) => (
                <button
                  key={item.ProjectInfoID}
                  type="button"
                  onClick={() => handleSelectProject(item)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.ProjectName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{item.ProjectCode}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {item.WorkStatusName}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {item.PriorityName}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
              {!projectsLoading && projects.length === 0 && (
                <div className="p-6 text-sm text-muted-foreground text-center">No projects found.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
