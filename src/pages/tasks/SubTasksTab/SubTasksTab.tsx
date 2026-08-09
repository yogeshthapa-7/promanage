import { useEffect, useState, useCallback } from "react";
import type { ApiProject } from "@/lib/projects-data";
import { fetchSubTasks, statusColor, priorityColor } from "@/lib/tasks-data";
import type { TaskItem, SubTaskItem } from "@/lib/tasks-data";
import Pagination from "@/components/ui/Pagination";

interface SubTasksTabProps {
  project: ApiProject;
  selectedTask: TaskItem | null;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function SubTasksTab({ project, selectedTask }: SubTasksTabProps) {
  const [subTasks, setSubTasks] = useState<SubTaskItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");

  const projectId = project.ProjectInfoID ?? Number(project.id);

  useEffect(() => {
    setCurrentPage(1);
    setSearch("");
  }, [selectedTask]);

  const loadSubTasks = useCallback(async (signal: AbortSignal, page: number, size: number, searchVal: string) => {
    if (!selectedTask) return;
    setLoading(true);
    setError(null);
    setSubTasks([]);

    try {
      const result = await fetchSubTasks({
        projectId,
        taskInfoId: selectedTask.TaskInfoID,
        page,
        pageSize: size,
        search: searchVal,
        signal,
      });
      if (signal.aborted) return;
      setSubTasks(result.items);
      setTotal(result.total);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [projectId, selectedTask]);

  useEffect(() => {
    const controller = new AbortController();
    loadSubTasks(controller.signal, currentPage, pageSize, search);
    return () => controller.abort();
  }, [loadSubTasks, currentPage, pageSize, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    const controller = new AbortController();
    loadSubTasks(controller.signal, 1, pageSize, search);
  };

  if (!selectedTask) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">
        Select a task from the Tasks tab to view its subtasks.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">Task:</span>
          <span className="text-sm font-bold text-slate-900">{selectedTask.TaskTitle}</span>
        </div>
        <span className="text-base text-muted-foreground">({selectedTask.TaskCode})</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search subtasks..."
            className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 w-full bg-white focus:outline-none focus:border-purple-500"
          />
        </form>
        <span className="text-base text-muted-foreground whitespace-nowrap">
          {total} subtask{total !== 1 ? 's' : ''} total
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading subtasks...</div>
      ) : subTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-base text-slate-500 mb-3">This task does not have any subtasks yet.</p>
          <button
            onClick={() => {}}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Create New Subtask
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subTasks.map((sub) => {
            const statusClass = statusColor[sub.WorkStatusName] ?? "bg-gray-100 text-gray-700";
            const priorityClass = priorityColor[sub.PriorityName] ?? "bg-gray-100 text-gray-700";
            return (
              <div key={sub.SubTaskInfoID} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 truncate">{sub.SubTaskTitle}</h3>
                    {sub.SubTaskCode && <p className="text-base text-muted-foreground font-mono mt-0.5">{sub.SubTaskCode}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-sm font-semibold ${priorityClass}`}>{sub.PriorityName}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-sm font-semibold ${statusClass}`}>{sub.WorkStatusName}</span>
                  </div>
                </div>

                <p className="text-base text-slate-500 line-clamp-3">{selectedTask.Description || "No description available."}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {sub.SubTaskManagerPhoto ? (
                      <img
                        src={sub.SubTaskManagerPhoto}
                        alt={sub.SubTaskManagerName || ""}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                        {(sub.SubTaskManagerName || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[140px]">{sub.SubTaskManagerName || "—"}</span>
                  </div>
                  <span className="text-base text-muted-foreground">Weightage: {sub.Weightage}</span>
                </div>
              </div>
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
        totalLabel={`Showing ${subTasks.length ? (currentPage - 1) * pageSize + 1 : 0} to ${Math.min(currentPage * pageSize, total)} of ${total} subtasks`}
      />
    </div>
  );
}
