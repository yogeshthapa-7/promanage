import { useState, useRef, useCallback } from "react";
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

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const TASKS_API = `${API_BASE}/TaskInfo/ServerSearch`;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const buildTaskSearchBody = (start: number, length: number, search?: string, projectId?: number) => ({
  model: {
    draw: 1,
    start,
    length,
    search: { value: search || "", regex: "" },
  },
  param: {
    TaskInfoID: 0,
    ProjectInfoID: projectId ?? 0,
  },
});

function fetchTasksPage(params: PaginatedListParams & { projectId?: number }): Promise<{ items: TaskItem[]; total: number }> {
  return apiCall(TASKS_API, {
    method: "POST",
    body: JSON.stringify(buildTaskSearchBody(params.start as number, params.length as number, params.search as string, params.projectId)),
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const projectId = project?.ProjectInfoID;

  const fetcher = useCallback((params: PaginatedListParams) => fetchTasksPage({ ...params, projectId }), [projectId]);

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
    extraDeps: [searchQuery, projectId],
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => setCurrentPage(1), 400);
  };

  const handleViewTask = (task: TaskItem) => {
    message.info(`View task: ${task.TaskTitle}`);
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
    message.info(`View subtasks for: ${task.TaskTitle}`);
  };

  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

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
        <div className="flex items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search tasks..."
            containerClassName="flex-1 max-w-md"
          />
        </div>
      </div>

      <div className="text-base text-slate-500 font-medium mt-2">
        Showing {start} to {end} of {total} entries
      </div>

      <Card className="mt-4">
        {loading ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="px-4 py-3 text-center text-sm text-slate-400">Loading tasks...</div>
          </div>
        ) : tasks.length === 0 ? (
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
                {tasks.map((task) => {
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
          total={total}
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
    </div>
  );
}
