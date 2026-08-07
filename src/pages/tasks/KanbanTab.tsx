import { useEffect, useState, useMemo, useCallback } from "react";
import type { ApiProject } from "@/lib/projects-data";
import { apiCall } from "@/lib/api";
import Pagination from "@/components/ui/Pagination";

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const KANBAN_API = `${API_BASE}/ProjectDetail/GetKanbanData`;

interface KanbanItem {
  CardKey: string;
  CardID: number;
  CardName: string;
  CurrentStatus: number;
  StatusName: string;
  StatusColor: string;
  CardHeadName: string;
  CardHeadPhoto: string;
  Priority: number;
  PriorityName: string;
  DueDate?: string;
}

interface KanbanTabProps {
  project: ApiProject;
}

type StatusColumn = {
  key: string;
  label: string;
  color: string;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function KanbanTab({ project }: KanbanTabProps) {
  const [rawItems, setRawItems] = useState<KanbanItem[]>([]);
  const [columns, setColumns] = useState<StatusColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterPriority, setFilterPriority] = useState<number>(0);

  const projectId = project.ProjectInfoID ?? Number(project.id);

  const fetchKanbanData = useCallback(async (signal: AbortSignal) => {
    const res = await apiCall(KANBAN_API, {
      method: "POST",
      body: JSON.stringify({
        draw: 1,
        start: 0,
        length: 10000,
        ProjectInfoID: projectId,
        TaskInfoID: 0,
        SubTaskInfoID: 0,
        ShowFilterKey: 0,
        Priority: 0,
        EmployeeIDs: "",
      }),
      signal,
    });

    if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
    const json = await res.json();

    let items: KanbanItem[] = [];
    let columnDefs: StatusColumn[] = [];

    if (Array.isArray(json?.data)) {
      items = json.data;
      columnDefs = items.length > 0
        ? [{ key: items[0].StatusName, label: items[0].StatusName, color: items[0].StatusColor || "#6b7280" }]
        : [];
    } else if (json?.Data && typeof json.Data === 'object' && json.Data !== null) {
      const groups = Object.entries(json.Data).filter(([, v]) =>
        Array.isArray((v as any)?.taskList) || (v as any).taskStatusID
      );

      for (const [key, group] of groups) {
        const g = group as any;
        const groupItems = g.taskList || [];
        items.push(...groupItems);

        const color = groupItems.length > 0
          ? (groupItems[0].StatusColor || g.color || "#6b7280")
          : (g.color || "#6b7280");

        const columnKey = groupItems.length > 0 ? groupItems[0].StatusName : key;

        columnDefs.push({
          key: columnKey,
          label: key,
          color,
        });
      }
    }

    const seen = new Set<string>();
    const uniqueItems = items.filter((item) => {
      const id = `${item.CardKey}-${item.CardID}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return { items: uniqueItems, columns: columnDefs };
  }, [projectId]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setRawItems([]);
    setColumns([]);
    setCurrentPage(1);

    fetchKanbanData(controller.signal)
      .then(({ items, columns: cols }) => {
        if (!controller.signal.aborted) {
          setRawItems(items);
          setColumns(cols);
        }
      })
      .catch((err) => {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [project, fetchKanbanData]);

  const filteredItems = useMemo(() => {
    if (filterPriority === 0) return rawItems;
    return rawItems.filter((item) => item.Priority === filterPriority);
  }, [rawItems, filterPriority]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const columnsData = useMemo(() => {
    const map: Record<string, KanbanItem[]> = {};
    columns.forEach((col) => {
      map[col.key] = [];
    });
    paginatedItems.forEach((item) => {
      const statusKey = item.StatusName || "Not Started";
      if (!map[statusKey]) {
        map[statusKey] = [];
      }
      map[statusKey].push(item);
    });
    return { map, columns };
  }, [paginatedItems, columns]);

  const getItemTitle = (item: KanbanItem) => item.CardName;
  const getItemManager = (item: KanbanItem) => item.CardHeadName;

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">
        Loading kanban board...
      </div>
    );
  }

  if (error && rawItems.length === 0) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-base text-rose-700">{error}</div>
    );
  }

  if (columns.length === 0 && !loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">
        No columns found for this project.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">Priority:</label>
          <select
            value={filterPriority}
            onChange={(e) => {
              setFilterPriority(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-purple-500"
          >
            <option value={0}>All</option>
            <option value={1}>Urgent</option>
            <option value={2}>High</option>
            <option value={3}>Medium</option>
            <option value={4}>Low</option>
          </select>
        </div>
        <span className="text-xs text-muted-foreground">
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} total
          {filterPriority !== 0 && rawItems.length > filteredItems.length ? ` (filtered from ${rawItems.length})` : ''}
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columnsData.columns.map((column) => {
          const columnItems = columnsData.map[column.key] || [];
          return (
            <div key={column.key} className="min-w-[300px] w-[300px] flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
              <div
                className="px-4 py-3 rounded-t-xl border-b"
                style={{
                  backgroundColor: `${column.color}12`,
                  borderColor: `${column.color}30`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">{column.label}</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: column.color }}
                  >
                    {columnItems.length}
                  </span>
                </div>
              </div>
              <div className="flex-1 p-3 space-y-3 min-h-[180px] max-h-[calc(100vh-340px)] overflow-y-auto bg-white">
                {columnItems.map((item) => (
                  <div
                    key={`${item.CardKey}-${item.CardID}`}
                    className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
                  >
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight">
                      {getItemTitle(item)}
                    </h4>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                          item.PriorityName === "Urgent"
                            ? "bg-rose-100 text-rose-700"
                            : item.PriorityName === "High"
                            ? "bg-amber-100 text-amber-700"
                            : item.PriorityName === "Medium"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.PriorityName}
                      </span>
                      <span
                        className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold text-slate-700"
                        style={{ backgroundColor: `${item.StatusColor}18`, color: item.StatusColor }}
                      >
                        {item.StatusName}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate max-w-[60%]">{getItemManager(item) || "—"}</span>
                    </div>
                  </div>
                ))}
                {columnItems.length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-8 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                    No items
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Pagination
        total={filteredItems.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
      />
    </div>
  );
}
