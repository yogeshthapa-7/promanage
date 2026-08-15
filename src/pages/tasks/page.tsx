import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Pencil, Trash2, Plus } from "lucide-react";
import { Button, message, Select, Modal } from "antd";
import { apiCall } from "@/lib/api";
import type { ApiProject } from "@/lib/projects-data";
import type { TaskItem } from "@/lib/tasks-data";
import Pagination from "@/components/ui/Pagination";
import Card from "@/components/ui/Card";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import { usePaginatedList, type PaginatedListParams } from "@/hooks/usePaginatedList";
import { statusColor } from "@/lib/tasks-data";
import CreateTaskDrawer from "./createtasks";
import ViewTaskDrawer from "./viewtaskdrawer";
import SubTaskDrawer from "./SubTaskDrawer";

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const TASKS_API = `${API_BASE}/TaskInfo/ServerSearch`;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const buildTaskSearchBody = (start: number, length: number, search?: string, projectId?: number, taskName?: string, projectName?: string, managerName?: string) => ({
  model: {
    draw: 1,
    start,
    length,
    columns: [
      { data: 'TaskInfoID', name: 'TaskInfoID', searchable: true, orderable: true, search: { value: search || "", regex: '' } },
      { data: 'TaskTitle', name: 'TaskTitle', searchable: true, orderable: true, search: { value: taskName || "", regex: '' } },
      { data: 'TaskCode', name: 'TaskCode', searchable: true, orderable: true, search: { value: '', regex: '' } },
      { data: 'ProjectInfoName', name: 'ProjectInfoName', searchable: true, orderable: true, search: { value: projectName || "", regex: '' } },
      { data: 'TaskManagerName', name: 'TaskManagerName', searchable: true, orderable: true, search: { value: managerName || "", regex: '' } },
      { data: 'WorkStatusName', name: 'WorkStatusName', searchable: true, orderable: true, search: { value: '', regex: '' } },
      { data: 'PriorityName', name: 'PriorityName', searchable: true, orderable: true, search: { value: '', regex: '' } },
    ],
    search: { value: search || "", regex: "" },
    order: [{ column: 1, dir: 'desc' }],
  },
  param: {
    TaskInfoID: 0,
    ProjectInfoID: projectId ?? 0,
    TaskTitle: taskName || "",
    TaskManagerName: managerName || "",
    ProjectInfoName: projectName || "",
  },
});

function fetchTasksPage(params: PaginatedListParams & { projectId?: number; taskName?: string; projectName?: string; managerName?: string }): Promise<{ items: TaskItem[]; total: number }> {
  return apiCall(TASKS_API, {
    method: "POST",
    body: JSON.stringify(buildTaskSearchBody(params.start as number, params.length as number, params.search as string, params.projectId, params.taskName, params.projectName, params.managerName)),
    signal: params.signal,
  }).then(async (res) => {
    if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
    const json = await res.json();
    const rows = Array.isArray(json?.data) ? (json.data as TaskItem[]) : [];
    return { items: rows, total: json.recordsTotal ?? rows.length };
  });
}

export default function TasksPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const project = (location.state as { project?: ApiProject } | undefined)?.project;
  const [taskNameSearch, setTaskNameSearch] = useState("");
  const [projectNameSearch, setProjectNameSearch] = useState("");
  const [managerNameSearch, setManagerNameSearch] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewingTaskId, setViewingTaskId] = useState<number | null>(null);
  const [subTaskDrawerOpen, setSubTaskDrawerOpen] = useState(false);
  const [viewingTaskForSubTasks, setViewingTaskForSubTasks] = useState<TaskItem | null>(null);

  const debouncedTaskName = useDebounce(taskNameSearch, 300);
  const debouncedProjectName = useDebounce(projectNameSearch, 300);
  const debouncedManagerName = useDebounce(managerNameSearch, 300);

  const projectId = project?.ProjectInfoID;

  const fetcher = useCallback((params: PaginatedListParams) => fetchTasksPage({ ...params, projectId, taskName: debouncedTaskName, projectName: debouncedProjectName, managerName: debouncedManagerName }), [projectId, debouncedTaskName, debouncedProjectName, debouncedManagerName]);

  const {
    data: tasks,
    total,
    loading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<TaskItem>({
    fetcher,
    initialPageSize: 20,
    extraDeps: [debouncedTaskName, debouncedProjectName, debouncedManagerName, projectId],
  });

  const handleTaskNameSearchChange = (value: string) => {
    setTaskNameSearch(value);
  };

  const handleProjectNameSearchChange = (value: string) => {
    setProjectNameSearch(value);
  };

  const handleManagerNameSearchChange = (value: string) => {
    setManagerNameSearch(value);
  };

  const handleViewTask = (task: TaskItem) => {
    setViewingTaskId(task.TaskInfoID);
    setViewDrawerOpen(true);
  };

  const handleEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setShowFormModal(true);
  };

  const handleDeleteTask = async (task: TaskItem) => {
    Modal.confirm({
      title: 'Delete Task',
      content: `Are you sure you want to delete "${task.TaskTitle}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
          const deleteUrl = `${API_BASE}/DeleteTaskInfo?id=${task.TaskInfoID}`;
          const res = await apiCall(deleteUrl, { method: "GET" });
          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
          message.success("Task deleted successfully");
          refetch();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Failed to delete task");
        }
      },
    });
  };

  const handleViewSubTasks = (task: TaskItem) => {
    setViewingTaskForSubTasks(task);
    setSubTaskDrawerOpen(true);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedTaskName, debouncedProjectName, debouncedManagerName]);

  const filteredTasks = tasks.filter((task) => {
    const matchesProject = !projectNameSearch || task.ProjectInfoName?.toLowerCase().includes(projectNameSearch.toLowerCase());
    const matchesManager = !managerNameSearch || task.TaskManagerName?.toLowerCase().includes(managerNameSearch.toLowerCase());
    return matchesProject && matchesManager;
  });

  const filteredTotal = filteredTasks.length;
  const start = filteredTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filteredTotal);

  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Tasks</h1>
          <p className="mt-1 text-base text-slate-500">
            Organize, prioritize and track all your projects tasks in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {project && (
            <Button onClick={() => navigate("/tasks")} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Projects
            </Button>
          )}
          <Button type="primary" onClick={() => { setEditingTask(null); setShowFormModal(true); }} icon={<Plus className="w-4 h-4" />}>
            Add New Task
          </Button>
        </div>
      </div>

      <hr className="border-slate-200 my-6" />

      {project && (
        <Card className="mb-6">
          <h2 className="text-lg font-bold text-slate-800">{project.ProjectName}</h2>
          <p className="mt-1 text-base text-slate-500 font-mono">{project.ProjectCode}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>{project.WorkStatusName}</Badge>
            <Badge>{project.PriorityName}</Badge>
            <Badge>{project.ProjectTypeName}</Badge>
          </div>
        </Card>
      )}

      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Task Name</label>
            <SearchInput
              value={taskNameSearch}
              onChange={handleTaskNameSearchChange}
              placeholder="Search task name..."
              containerClassName="w-40 sm:w-48"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Project Name</label>
            <SearchInput
              value={projectNameSearch}
              onChange={handleProjectNameSearchChange}
              placeholder="Search project name..."
              containerClassName="w-40 sm:w-48"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Manager Name</label>
            <SearchInput
              value={managerNameSearch}
              onChange={handleManagerNameSearchChange}
              placeholder="Search manager name..."
              containerClassName="w-40 sm:w-48"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-base text-slate-500 font-medium">
          <span>Show</span>
          <Select
            value={pageSize}
            onChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}
            className="w-20"
            options={PAGE_SIZE_OPTIONS.map((size) => ({ value: size, label: `${size}` }))}
          />
          <span>entries</span>
        </div>
      </div>

      <div className="text-base text-slate-500 font-medium mt-2">
        Showing {start} to {end} of {filteredTotal} entries
      </div>

      <Card className="mt-4">
        {loading ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="px-4 py-3 text-center text-sm text-slate-400">Loading tasks...</div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-base text-slate-400">
            No tasks found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-1.5">
              <thead>
                <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <th className="rounded-l-xl bg-slate-50 px-5 py-3">Task</th>
                  <th className="bg-slate-50 px-4 py-3">Project</th>
                  <th className="bg-slate-50 px-4 py-3">Manager</th>
                  <th className="bg-slate-50 px-4 py-3">Status</th>
                  <th className="bg-slate-50 px-4 py-3">Sub Task</th>
                  <th className="rounded-r-xl bg-slate-50 px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const handleRowMouseEnter = (e: React.MouseEvent<HTMLTableRowElement>) => {
                    e.currentTarget.style.transform = 'scale(1.01)';
                    e.currentTarget.style.transition = 'transform 0.25s cubic-bezier(0.4,0,0.2,1)';
                  };
                  const handleRowMouseLeave = (e: React.MouseEvent<HTMLTableRowElement>) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  };

                  return (
                    <tr
                      key={task.TaskInfoID}
                      className="text-sm text-slate-700"
                      onMouseEnter={handleRowMouseEnter}
                      onMouseLeave={handleRowMouseLeave}
                    >
                      <td className="rounded-l-xl bg-white px-4 py-3 border-b border-slate-100">
                        <div className="font-semibold text-slate-900">{task.TaskTitle}</div>
                        {/* {task.TaskCode && <div className="text-xs text-muted-foreground font-mono">{task.TaskCode}</div>} */}
                      </td>
                      <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
                        {task.ProjectInfoName || "—"}
                      </td>
                      <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
                        {task.TaskManagerName || "—"}
                      </td>
                      <td className="bg-white px-4 py-3 border-b border-slate-100">
                        <Badge className={statusColor[task.WorkStatusName] ?? "!bg-gray-100 !text-gray-700"}>
                          {task.WorkStatusName}
                        </Badge>
                      </td>
                      <td className="bg-white px-4 py-3 border-b border-slate-100">
                        <Button type="link" size="small" onClick={() => handleViewSubTasks(task)} icon={<Eye className="w-4 h-4" />}>
                          View
                        </Button>
                      </td>
                      <td className="rounded-r-xl bg-white px-4 py-3 text-right border-b border-slate-100">
                        <div className="flex items-center justify-end gap-2">
                          <Button type="text" size="small" onClick={() => handleViewTask(task)} icon={<Eye className="w-4 h-4" />} />
                          {task.CanEdit && (
                            <Button type="text" size="small" onClick={() => handleEditTask(task)} icon={<Pencil className="w-4 h-4" />} />
                          )}
                          {task.CanDelete && (
                            <Button type="text" size="small" danger onClick={() => handleDeleteTask(task)} icon={<Trash2 className="w-4 h-4" />} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex justify-end pt-2">
        <Pagination
          total={filteredTotal}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(Number(size));
            setCurrentPage(1);
          }}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      </div>

      <CreateTaskDrawer
        open={showFormModal}
        onClose={() => { setShowFormModal(false); setEditingTask(null); }}
        onSuccess={refetch}
        editingTask={editingTask}
        project={project}
      />
      <ViewTaskDrawer
        open={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        taskId={viewingTaskId}
      />
      <SubTaskDrawer
        open={subTaskDrawerOpen}
        onClose={() => setSubTaskDrawerOpen(false)}
        project={project as ApiProject}
        task={viewingTaskForSubTasks}
      />
    </div>
  );
}
