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

interface KanbanApiResponse {
  data?: KanbanItem[];
  recordsTotal?: number;
  recordsFiltered?: number;
  Data?: Record<string, { taskList?: KanbanItem[]; taskStatusID?: number; color?: string }>;
}

interface KanbanFetchResult {
  items: KanbanItem[];
  columns: StatusColumn[];
  total: number;
}

const PAGE_SIZE_OPTIONS = [50, 100, 200];

export default function KanbanTab({ project }: KanbanTabProps) {
  const [items, setItems] = useState<KanbanItem[]>([]);
  const [columns, setColumns] = useState<StatusColumn[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const projectId = project.ProjectInfoID ?? Number(project.id);

  const fetchKanbanData = useCallback(async (signal: AbortSignal, start: number, length: number): Promise<KanbanFetchResult> => {
    const res = await apiCall(KANBAN_API, {
      method: "POST",
      body: JSON.stringify({
        draw: 1,
        start,
        length,
        ProjectInfoID: projectId,
        TaskInfoID: 0,
        SubTaskInfoID: 0,
        ShowFilterKey: 0,
        Priority: 0,
        EmployeeIDs: "",
      }),
      signal,
    }, 120000);

    if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
    const json = (await res.json()) as KanbanApiResponse;

    let rows: KanbanItem[] = [];
    let totalRecords = 0;
    const allColumns: StatusColumn[] = [];
    const columnSeen = new Set<string>();

    if (Array.isArray(json?.data)) {
      const seenIds = new Set<number>();
      rows = json.data.filter((item) => {
        if (seenIds.has(item.CardID)) return false;
        seenIds.add(item.CardID);
        return true;
      });
      totalRecords = json.recordsTotal ?? rows.length;

      rows.forEach((item) => {
        const statusKey = (item.StatusName || "Not Started").trim().toLowerCase();
        if (!columnSeen.has(statusKey)) {
          columnSeen.add(statusKey);
          allColumns.push({
            key: statusKey,
            label: item.StatusName?.trim() || "Not Started",
            color: item.StatusColor || "#6b7280",
          });
        }
      });
    } else if (json?.Data && typeof json.Data === 'object' && json.Data !== null) {
      const groups = Object.entries(json.Data);
      const seenIds = new Set<number>();
      for (const [groupKey, group] of groups) {
        const normalizedKey = groupKey.trim().toLowerCase();
        if (!columnSeen.has(normalizedKey)) {
          columnSeen.add(normalizedKey);
          let label = groupKey.trim();
          if (Array.isArray(group?.taskList) && group.taskList.length > 0) {
            label = group.taskList[0].StatusName?.trim() || label;
          } else {
            label = label.replace(/\b\w/g, (c) => c.toUpperCase());
          }
          allColumns.push({
            key: normalizedKey,
            label,
            color: group?.color || "#6b7280",
          });
        }
        if (Array.isArray(group?.taskList)) {
          for (const item of group.taskList) {
            if (!seenIds.has(item.CardID)) {
              seenIds.add(item.CardID);
              rows.push(item);
            }
          }
        }
      }
      totalRecords = json.recordsTotal ?? rows.length;
    }

    const paginatedRows = rows.slice(start, start + length);

    return { items: paginatedRows, columns: allColumns, total: totalRecords };
  }, [projectId]);

  useEffect(() => {
    const controller = new AbortController();
    const start = (currentPage - 1) * pageSize;
    setLoading(true);
    setError(null);
    setItems([]);
    setTotal(0);

    fetchKanbanData(controller.signal, start, pageSize)
      .then(({ items: fetchedItems, columns: fetchedColumns, total: fetchedTotal }) => {
        if (!controller.signal.aborted) {
          setItems(fetchedItems);
          setColumns(fetchedColumns);
          setTotal(fetchedTotal);
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
  }, [fetchKanbanData, currentPage, pageSize]);

  const columnsData = useMemo(() => {
    const map: Record<string, KanbanItem[]> = {};
    columns.forEach((col) => {
      map[col.key] = [];
    });

    items.forEach((item) => {
      const statusKey = (item.StatusName || "Not Started").trim().toLowerCase();
      if (!map[statusKey]) {
        map[statusKey] = [];
      }
      map[statusKey].push(item);
    });

    return { map, columns };
  }, [items, columns]);

  const getItemTitle = (item: KanbanItem) => item.CardName;
  const getItemManager = (item: KanbanItem) => item.CardHeadName;

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">
        Loading kanban board...
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-base text-rose-700">{error}</div>
    );
  }

  if (columnsData.columns.length === 0 && !loading) {
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
        <span className="text-base text-muted-foreground">
          {items.length} item{items.length !== 1 ? 's' : ''} shown (page {currentPage})
        </span>
        <span className="text-base text-muted-foreground">
          {total} total items
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
                    className="text-sm font-bold px-2 py-0.5 rounded-full text-white"
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
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-sm font-semibold ${
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
                        className="inline-flex items-center rounded-full px-1.5 py-0.5 text-sm font-semibold text-slate-700"
                        style={{ backgroundColor: `${item.StatusColor}18`, color: item.StatusColor }}
                      >
                        {item.StatusName}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-base text-muted-foreground">
                      <span className="truncate max-w-[60%]">{getItemManager(item) || "—"}</span>
                    </div>
                  </div>
                ))}
                {columnItems.length === 0 && (
                  <div className="text-base text-slate-400 text-center py-8 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                    No items
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
        totalLabel={`Showing ${items.length ? (currentPage - 1) * pageSize + 1 : 0} to ${Math.min(currentPage * pageSize, total)} of ${total} items`}
      />
    </div>
  );
}
