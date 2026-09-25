import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Pencil, Trash2, Plus, LayoutList, LayoutGrid } from "lucide-react";
import { Button, message, Select, Modal } from "antd";
import { apiCall } from "@/services/apiservice";
import type { ApiProject } from "@/types/projects-data";
import type { TaskItem } from "@/types/tasks-data";
import Pagination from "@/components/ui/Pagination";
import Card from "@/components/ui/Card";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import AppTable from "@/components/ui/AppTable";
import { usePaginatedList, type PaginatedListParams } from "@/hooks/usePaginatedList";
import { statusColor, priorityColor } from "@/services/taskservice";
import CreateTaskDrawer from "./createtasks";
import ViewTaskDrawer from '@/components/projects/viewtaskdrawer';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const TASKS_API = `${API_BASE}/TaskInfo/ServerSearch`;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const NEPALI_NUMERALS: Record<string, string> = {
  "0": "०", "1": "१", "2": "२", "3": "३", "4": "४",
  "5": "५", "6": "६", "7": "७", "8": "८", "9": "९",
};

// Render a BS date string (e.g. "2083/5/15") using Devanagari numerals.
const toDevanagariDate = (bs?: string): string => {
  if (!bs) return "—";
  return bs.replace(/\d/g, (d) => NEPALI_NUMERALS[d] || d);
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const extractIdAndName = (obj: Record<string, unknown>): { id: number | string; name: string } | null => {
  if (obj.Value !== undefined && obj.Name !== undefined) {
    return { id: Number(obj.Value), name: String(obj.Name) };
  }
  const idSuffixes = ['id', 'ID', 'Id', 'InfoID', 'Code', 'code', 'Key'];
  const nameSuffixes = ['name', 'Name', 'title', 'Title', 'fullname', 'Fullname', 'label', 'Label'];
  let id: number | string | undefined;
  let name: string | undefined;
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (id === undefined && key.length > 1 && idSuffixes.some((s) => key.endsWith(s))) {
      id = value as number | string;
    }
    if (name === undefined && key.length > 1 && nameSuffixes.some((s) => key.endsWith(s))) {
      name = String(value);
    }
    if (id !== undefined && name !== undefined) break;
  }
  if (id !== undefined && name !== undefined) {
    return { id: id as number | string, name };
  }
  return null;
};

const buildTaskSearchBody = (start: number, length: number, search?: string, projectId?: number, managerName?: string) => ({
  model: {
    draw: 1,
    start,
    length,
    columns: [
      { data: 'TaskInfoID', name: 'TaskInfoID', searchable: true, orderable: true, search: { value: search || "", regex: '' } },
      { data: 'TaskTitle', name: 'TaskTitle', searchable: true, orderable: true, search: { value: '', regex: '' } },
      { data: 'TaskCode', name: 'TaskCode', searchable: true, orderable: true, search: { value: '', regex: '' } },
      { data: 'ProjectInfoName', name: 'ProjectInfoName', searchable: true, orderable: true, search: { value: '', regex: '' } },
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
    TaskTitle: "",
    TaskManagerName: managerName || "",
    ProjectInfoName: "",
  },
});

function fetchTasksPage(params: PaginatedListParams & { projectId?: number; taskId?: number; projectIdSearch?: number; managerName?: string }): Promise<{ items: TaskItem[]; total: number }> {
  return apiCall(TASKS_API, {
    method: "POST",
    body: JSON.stringify(buildTaskSearchBody(params.start as number, params.length as number, params.search as string, params.projectId, params.managerName)),
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
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [managerNameSearch, setManagerNameSearch] = useState("");
  const [taskOptions, setTaskOptions] = useState<{ value: string; label: string }[]>([]);
  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectLoading, setSelectLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewingTaskId, setViewingTaskId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  const debouncedManagerName = useDebounce(managerNameSearch, 300);

  const projectId = project?.ProjectInfoID;

  const activeProjectFilter = selectedProjectId ? Number(selectedProjectId) : (selectedTaskId ? undefined : projectId);

  const fetcher = useCallback((params: PaginatedListParams) => fetchTasksPage({ ...params, projectId: activeProjectFilter, managerName: debouncedManagerName }), [activeProjectFilter, debouncedManagerName]);

  const {
    data: tasks,
    loading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<TaskItem>({
    fetcher,
    initialPageSize: 20,
    extraDeps: [debouncedManagerName, activeProjectFilter],
  });

  const handleTaskSelect = (value: string | undefined) => {
    setSelectedTaskId(value);
    setSelectedProjectId(undefined);
    setManagerNameSearch("");
  };

  const handleProjectSelect = (value: string | undefined) => {
    setSelectedProjectId(value);
    setSelectedTaskId(undefined);
    setManagerNameSearch("");
  };

  const handleManagerNameSearchChange = (value: string) => {
    setManagerNameSearch(value);
    setSelectedTaskId(undefined);
    setSelectedProjectId(undefined);
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

  useEffect(() => {
    const controller = new AbortController();
    setSelectLoading(true);
    Promise.allSettled([
      apiCall(`${API_BASE}/TaskInfo/SelectList`, { method: 'GET', signal: controller.signal }),
      apiCall(`${API_BASE}/ProjectInfo/SelectList`, { method: 'GET', signal: controller.signal }),
    ]).then((results) => {
      const [taskResult, projectResult] = results as [
        PromiseSettledResult<Response>,
        PromiseSettledResult<Response>,
      ];

      if (taskResult.status === 'fulfilled' && taskResult.value.ok) {
        taskResult.value.json().then((json: unknown) => {
          const data = Array.isArray(json) ? json : Array.isArray((json as { data?: unknown[] })?.data) ? (json as { data: unknown[] }).data : Array.isArray((json as { Data?: unknown[] })?.Data) ? (json as { Data: unknown[] }).Data : [];
          const mapped = data.map((obj: Record<string, unknown>) => extractIdAndName(obj)).filter((item): item is { id: number | string; name: string } => item !== null);
          setTaskOptions(mapped.map((item) => ({ value: String(item.id), label: item.name })));
        });
      }

      if (projectResult.status === 'fulfilled' && projectResult.value.ok) {
        projectResult.value.json().then((json: unknown) => {
          const data = Array.isArray(json) ? json : Array.isArray((json as { data?: unknown[] })?.data) ? (json as { data: unknown[] }).data : Array.isArray((json as { Data?: unknown[] })?.Data) ? (json as { Data: unknown[] }).Data : [];
          const mapped = data.map((obj: Record<string, unknown>) => extractIdAndName(obj)).filter((item): item is { id: number | string; name: string } => item !== null);
          setProjectOptions(mapped.map((item) => ({ value: String(item.id), label: item.name })));
        });
      }

      setSelectLoading(false);
    });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTaskId, selectedProjectId, debouncedManagerName]);

  const filteredTasks = tasks.filter((task) => {
    const matchesTask = !selectedTaskId || String(task.TaskInfoID) === selectedTaskId;
    const matchesProject = !selectedProjectId && !projectId || String(task.ProjectInfoID) === String(selectedProjectId ?? projectId);
    const matchesManager = !managerNameSearch || task.TaskManagerName?.toLowerCase().includes(managerNameSearch.toLowerCase());
    return matchesTask && matchesProject && matchesManager;
  });

  const filteredTotal = filteredTasks.length;
  const start = filteredTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filteredTotal);

  const taskColumns = [
    {
      title: 'Task',
      dataIndex: 'TaskTitle',
      key: 'TaskTitle',
      render: (value: string) => <div className="font-semibold text-slate-900">{value}</div>,
    },
    {
      title: 'Project',
      dataIndex: 'ProjectInfoName',
      key: 'ProjectInfoName',
      render: (value: string) => <span className="text-slate-600 font-medium">{value || "—"}</span>,
    },
    {
      title: 'Manager',
      dataIndex: 'TaskManagerName',
      key: 'TaskManagerName',
      render: (value: string) => <span className="text-slate-600 font-medium">{value || "—"}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'WorkStatusName',
      key: 'WorkStatusName',
      render: (value: string) => <Badge className={statusColor[value] ?? "!bg-gray-100 !text-gray-700"}>{value}</Badge>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      width: 140,
      render: (_: unknown, record: TaskItem) => (
        <div className="flex items-center justify-end gap-1">
          <Button type="text" size="small" onClick={() => handleViewTask(record)} icon={<Eye className="w-4 h-4" />} />
          {record.CanEdit && (
            <Button type="text" size="small" onClick={() => handleEditTask(record)} icon={<Pencil className="w-4 h-4" />} />
          )}
          {record.CanDelete && (
            <Button type="text" size="small" danger onClick={() => handleDeleteTask(record)} icon={<Trash2 className="w-4 h-4" />} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Tasks</h1>
          <p className="mt-1 text-base text-slate-500">
            Organize, prioritize and track all your projects tasks in one place.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {project && (
            <Button onClick={() => navigate("/tasks")} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Projects
            </Button>
          )}
          <Button type="primary" onClick={() => { setEditingTask(null); setShowFormModal(true); }} icon={<Plus className="w-4 h-4" />}>
            Add New Task
          </Button>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
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

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">Task Name</div>
          <Select
            value={selectedTaskId}
            onChange={handleTaskSelect}
            placeholder="Select task"
            options={taskOptions}
            className="w-full"
            loading={selectLoading}
            allowClear
            showSearch
            optionFilterProp="label"
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">Project Name</div>
          <Select
            value={selectedProjectId}
            onChange={handleProjectSelect}
            placeholder="Select project"
            options={projectOptions}
            className="w-full"
            loading={selectLoading}
            allowClear
            showSearch
            optionFilterProp="label"
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">Manager Name</div>
          <SearchInput
            value={managerNameSearch}
            onChange={handleManagerNameSearchChange}
            placeholder="Search manager name..."
            containerClassName="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button type="primary" onClick={() => setCurrentPage(1)}>Search</Button>
          <Button onClick={() => {
            setSelectedTaskId(undefined);
            setSelectedProjectId(undefined);
            setManagerNameSearch('');
            setCurrentPage(1);
          }}>Clear</Button>
        </div>
      </div>

      {/* <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
      </div> */}

      <div className="text-base text-slate-500 font-medium mt-2">
        Showing {start} to {end} of {filteredTotal} entries
      </div>

       {loading ? (
          <Card className="mt-4">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="px-4 py-3 text-center text-sm text-slate-400">Loading tasks...</div>
            </div>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card className="mt-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-base text-slate-400">
              No tasks found.
            </div>
          </Card>
        ) : viewMode === 'list' ? (
          <AppTable
            columns={taskColumns}
            dataSource={filteredTasks}
            rowKey={(record) => record.TaskInfoID}
            cardClassName="mt-4"
          />
        ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
           {filteredTasks.map((task) => (
             <Card key={task.TaskInfoID} hover className="group overflow-hidden flex flex-col">
               <div className="flex items-start justify-between mb-3">
                 <div className="min-w-0 flex-1">
                   <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors truncate">
                     {task.TaskTitle}
                   </h3>
                   {task.TaskCode && (
                     <div className="text-xs text-slate-400 font-mono mt-0.5">{task.TaskCode}</div>
                   )}
                 </div>
                 {/* <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0 ml-2">
                   #{task.TaskInfoID}
                 </span> */}
               </div>

               <div className="space-y-2 mb-4 flex-1">
                 <div className="flex items-center justify-between text-sm gap-2">
                   <span className="text-slate-400 shrink-0">Project</span>
                   <span className="font-semibold text-slate-700 truncate">{task.ProjectInfoName || "—"}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm gap-2">
                   <span className="text-slate-400 shrink-0">Manager</span>
                   <span className="font-semibold text-slate-700 truncate">{task.TaskManagerName || "—"}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm gap-2">
                   <span className="text-slate-400 shrink-0">Due Date</span>
                    <span className="font-semibold text-slate-700">{toDevanagariDate(task.DueDate)}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm gap-2">
                   <span className="text-slate-400 shrink-0">Status</span>
                   <Badge className={statusColor[task.WorkStatusName] ?? "!bg-gray-100 !text-gray-700"}>
                     {task.WorkStatusName}
                   </Badge>
                 </div>
                 {task.PriorityName && (
                   <div className="flex items-center justify-between text-sm gap-2">
                     <span className="text-slate-400 shrink-0">Priority</span>
                     <Badge className={priorityColor[task.PriorityName] ?? "!bg-gray-100 !text-gray-700"}>
                       {task.PriorityName}
                     </Badge>
                   </div>
                 )}
               </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button size="small" type="primary" onClick={() => handleViewTask(task)}>View</Button>
                  {task.CanEdit && (
                    <Button size="small" onClick={() => handleEditTask(task)}>Edit</Button>
                  )}
                  {task.CanDelete && (
                    <Button size="small" danger onClick={() => handleDeleteTask(task)}>Delete</Button>
                  )}
                </div>
             </Card>
           ))}
         </div>
       )}

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
    </div>
  );
}


