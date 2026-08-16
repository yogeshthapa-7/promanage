import { useEffect, useState, useRef } from "react";
import type { ApiProject } from "@/lib/projects-data";
import { fetchSubTasks, statusColor, priorityColor } from "@/lib/tasks-data";
import type { TaskItem, SubTaskItem } from "@/lib/tasks-data";
import { apiCall } from "@/lib/api";
import { message, Modal } from "antd";
import { Trash2 } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { CardPanelSkeleton } from "@/components/ui/Loaders";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { usePaginatedList, type PaginatedListParams } from "@/hooks/usePaginatedList";
import SubTaskCreate from "./Create";

interface SubTasksTabProps {
  project: ApiProject;
  selectedTask: TaskItem | null;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");

export default function SubTasksTab({ project, selectedTask }: SubTasksTabProps) {
  const [search, setSearch] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const projectId = project.ProjectInfoID ?? Number(project.id);

  const {
    data: subTasks,
    total,
    loading,
    currentPage,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<SubTaskItem>({
    fetcher: (params: PaginatedListParams) => {
      if (!selectedTask) return Promise.resolve({ items: [], total: 0 });
      const page = Math.floor((params.start as number) / (params.length as number)) + 1;
      return fetchSubTasks({
        projectId,
        taskInfoId: selectedTask.TaskInfoID,
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
    extraDeps: [search, projectId, selectedTask?.TaskInfoID],
  });

  /* eslint-disable react-hooks/set-state-in-effect -- reset pagination on task change */
  useEffect(() => {
    setCurrentPage(1);
    setSearch("");
  }, [selectedTask, setCurrentPage]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setCurrentPage(1);
    }, 400);
  };

  const handleDeleteSubTask = (subtask: SubTaskItem) => {
    Modal.confirm({
      title: "Delete Subtask",
      content: `Are you sure you want to delete "${subtask.SubTaskTitle}"?`,
      okText: "Delete",
      okType: "danger",
      style: { zIndex: 10000 },
      onOk: async () => {
        try {
          const res = await apiCall(`${API_BASE}/DeleteSubTaskInfo?id=${subtask.SubTaskInfoID}`, { method: "GET" });
          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
          message.success("Subtask deleted successfully");
          refetch();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Failed to delete subtask");
        }
      },
    });
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
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search subtasks..."
          containerClassName="flex-1 max-w-md"
        />
        <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
          Add New Subtask
        </Button>
      </div>

      {loading ? (
        <CardPanelSkeleton count={6} />
      ) : subTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-base text-slate-500 mb-3">This task does not have any subtasks yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subTasks.map((sub) => {
            const statusClass = statusColor[sub.WorkStatusName] ?? "!bg-gray-100 !text-gray-700";
            const priorityClass = priorityColor[sub.PriorityName] ?? "!bg-gray-100 !text-gray-700";
            return (
              <Card key={sub.SubTaskInfoID} hover className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 truncate">{sub.SubTaskTitle}</h3>
                    {sub.SubTaskCode && <p className="text-base text-muted-foreground font-mono mt-0.5">{sub.SubTaskCode}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className={priorityClass}>{sub.PriorityName}</Badge>
                    <Badge className={statusClass}>{sub.WorkStatusName}</Badge>
                    <Button type="text" size="sm" danger icon={<Trash2 size={16} />} onClick={() => handleDeleteSubTask(sub)}>
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>

                <p className="text-base text-slate-500 line-clamp-3">{selectedTask.Description || "No description available."}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar src={sub.SubTaskManagerPhoto} alt={sub.SubTaskManagerName || ""} size={28}>
                      {(sub.SubTaskManagerName || "?").charAt(0).toUpperCase()}
                    </Avatar>
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[140px]">{sub.SubTaskManagerName || "—"}</span>
                  </div>
                  <span className="text-base text-muted-foreground">Weightage: {sub.Weightage}</span>
                </div>
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
        totalLabel={`Showing ${subTasks.length ? (currentPage - 1) * pageSize + 1 : 0} to ${Math.min(currentPage * pageSize, total)} of ${total} subtasks`}
      />

      <SubTaskCreate
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
          setCurrentPage(1);
        }}
        project={project}
        selectedTask={selectedTask}
      />
    </div>
  );
}
