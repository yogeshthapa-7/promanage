import { useState, useRef } from "react";
import type { ApiProject } from "@/lib/projects-data";
import { fetchTasks, statusColor, priorityColor } from "@/lib/tasks-data";
import type { TaskItem, SubTaskItem, TaskManagerInfo } from "@/lib/tasks-data";
import Pagination from "@/components/ui/Pagination";
import { CardPanelSkeleton } from "@/components/ui/Loaders";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { usePaginatedList, type PaginatedListParams } from "@/hooks/usePaginatedList";

export type { TaskItem, SubTaskItem, TaskManagerInfo };

interface TasksTabProps {
  project: ApiProject;
  selectedTask: TaskItem | null;
  onTaskSelect: (task: TaskItem) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function TasksTab({ project, selectedTask, onTaskSelect }: TasksTabProps) {
  const [search, setSearch] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const projectId = project.ProjectInfoID ?? Number(project.id);

  const {
    data: tasks,
    total,
    loading,
    currentPage,
    setCurrentPage,
    setPageSize,
  } = usePaginatedList<TaskItem>({
    fetcher: (params: PaginatedListParams) => {
      const page = Math.floor((params.start as number) / (params.length as number)) + 1;
      return fetchTasks({
        projectId,
        page,
        pageSize: params.length as number,
        search: (params.search as string) || search,
        signal: params.signal,
      }).then((result) => ({
        items: result.items,
        total: result.total,
      }));
    },
    initialPageSize: 20,
    extraDeps: [search, projectId],
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => setCurrentPage(1), 400);
  };

  const handleSelect = (task: TaskItem) => {
    onTaskSelect(task);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search tasks..."
          containerClassName="flex-1 max-w-md"
        />
        <Button type="primary" onClick={() => { /* open add-task modal / navigate */ }}>
          Add New Task
        </Button>
      </div>

      {loading ? (
        <CardPanelSkeleton count={6} />
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">No tasks found for this project.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map((task) => {
            const statusClass = statusColor[task.WorkStatusName] ?? "bg-gray-100 text-gray-700";
            const priorityClass = priorityColor[task.PriorityName] ?? "bg-gray-100 text-gray-700";
            const isExpanded = selectedTask?.TaskInfoID === task.TaskInfoID;
            const worker = task.TaskManagerInfo
              ? { EmployeeInfoID: task.TaskManagerInfo.EmployeeInfoID, Fullname: task.TaskManagerInfo.Fullname, Photo: task.TaskManagerInfo.Photo ?? task.TaskManagerPhoto ?? '' }
              : { EmployeeInfoID: task.TaskManagerID, Fullname: task.TaskManagerName ?? '' };

            return (
              <Card
                key={task.TaskInfoID}
                hover
                className={`cursor-pointer ${isExpanded ? "border-purple-500 ring-2 ring-purple-100" : ""}`}
                onClick={() => handleSelect(task)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 truncate">{task.TaskTitle}</h3>
                    {task.TaskCode && <p className="text-base text-muted-foreground font-mono mt-0.5">{task.TaskCode}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className={statusClass}>{task.WorkStatusName}</Badge>
                    <Badge className={priorityClass}>{task.PriorityName}</Badge>
                  </div>
                </div>

                <p className="text-base text-slate-500 line-clamp-3">{task.Description}</p>

                <div className="flex items-center justify-between text-base text-muted-foreground">
                  <span>Due: {task.DueDate || "—"}</span>
                  <span>{task.DueInfo || ""}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Avatar src={worker.Photo} alt={worker.Fullname} size={28}>
                    {worker.Fullname.charAt(0).toUpperCase()}
                  </Avatar>
                  <span className="text-base text-muted-foreground">Weightage: {task.Weightage}</span>
                </div>

                {isExpanded && (
                  <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Selected for subtasks</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Pagination
        total={total}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        totalLabel={`Showing ${tasks.length ? (currentPage - 1) * pageSize + 1 : 0} to ${Math.min(currentPage * pageSize, total)} of ${total} tasks`}
      />
    </div>
  );
}
