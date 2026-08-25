import { useEffect, useState } from "react";
import type { ApiProject } from "@/lib/projects-data";
import { apiCall } from "@/lib/api";
import { Modal, message, Button } from "antd";
import { LayoutGrid, List, Search, Pencil, Trash2, RotateCcw } from "lucide-react";
import Card from "@/components/ui/Card";
import DiscussionCreate from "./Create";
import DiscussionSearch from "./Search";

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const DISCUSSION_API = `${API_BASE}/ProjectDiscussion/ServerSearch`;

interface ProjectDiscussionItem {
  SN: number;
  ProjectDiscussionID: number;
  DiscussionTitle: string;
  ProjectInfoID: number;
  Priority: number;
  PriorityName: string;
  Status: number;
  HasUserRightToEdit: boolean;
  HasUserRightToDelete: boolean;
  CreatedDate: string;
}

interface DiscussionTabProps {
  project: ApiProject;
}

export default function DiscussionTab({ project }: DiscussionTabProps) {
  const [discussions, setDiscussions] = useState<ProjectDiscussionItem[]>([]);
  const [allDiscussions, setAllDiscussions] = useState<ProjectDiscussionItem[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDiscussion, setEditingDiscussion] = useState<ProjectDiscussionItem | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const discussionsRefetch = () => {
    const controller = new AbortController();
    let cancelled = false;
    setDiscussionsLoading(true);
    setDiscussions([]);

    apiCall(DISCUSSION_API, {
      method: "POST",
      body: JSON.stringify({
        model: {
          draw: 1,
          start: 0,
          length: 20,
          columns: [
            { data: "ProjectDiscussionID", name: "ProjectDiscussionID", searchable: true, orderable: true, search: { value: "", regex: "" } },
          ],
          search: { value: "", regex: "" },
          order: [{ column: 0, dir: "desc" }],
        },
        param: {
          ProjectDiscussionID: 0,
          DiscussionTitle: "",
          ProjectInfoID: project.ProjectInfoID ?? 0,
          Priority: 0,
          PriorityName: "",
          RaisedBy: "",
          CreatedDate: "",
          CanChangeStatus: true,
          CanEdit: true,
          CanDelete: true,
        },
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
        const json = await res.json();
        if (!cancelled) {
          const data = Array.isArray(json?.data) ? json.data : [];
          setDiscussions(data);
          setAllDiscussions(data);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      })
      .finally(() => {
        if (!cancelled) setDiscussionsLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  };

  const handleClearDiscussionSearch = () => {
    setIsSearchOpen(false);
    setIsSearchActive(false);
    setDiscussions(allDiscussions);
  };

  const handleEditDiscussion = (discussion: ProjectDiscussionItem) => {
    setEditingDiscussion(discussion);
    setIsCreateOpen(true);
  };

  const handleDeleteDiscussion = (discussion: ProjectDiscussionItem) => {
    Modal.confirm({
      title: 'Delete Discussion',
      content: `Are you sure you want to delete "${discussion.DiscussionTitle}"?`,
      okText: 'Delete',
      okType: 'danger',
      zIndex: 10000,
      onOk: async () => {
        try {
          const res = await apiCall(`${API_BASE}/DeleteProjectDiscussion?id=${discussion.ProjectDiscussionID}`, { method: 'GET' });
          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
          message.success('Discussion deleted successfully');
          setDiscussions((prev) => prev.filter((d) => d.ProjectDiscussionID !== discussion.ProjectDiscussionID));
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Failed to delete discussion');
        }
      },
    });
  };

  useEffect(() => {
    discussionsRefetch();
  }, [project]);

  return (
  <div className="space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button icon={<Search size={16} />} onClick={() => setIsSearchOpen(true)}>
          Search
        </Button>
        <Button icon={<RotateCcw size={16} />} onClick={handleClearDiscussionSearch}>
          Clear
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-white/70 border border-border rounded-2xl p-0.5 shadow-xs">
          <Button type="text" onClick={() => setViewMode('grid')} icon={<LayoutGrid className="w-4 h-4" />} />
          <Button type="text" onClick={() => setViewMode('list')} icon={<List className="w-4 h-4" />} />
        </div>
        <Button type="primary" onClick={() => { setEditingDiscussion(null); setIsCreateOpen(true); }}>
          Add Discussion
        </Button>
      </div>
    </div>
    {isSearchOpen && (
      <DiscussionSearch
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={(values) => {
          const searchTitle = String(values.DiscussionTitle || '').toLowerCase();
          const priority = Number(values.Priority);
          setIsSearchActive(true);
          setDiscussions(() => {
            if (!searchTitle && !priority) return allDiscussions;
            return allDiscussions.filter((d) => {
              const matchesTitle = !searchTitle || d.DiscussionTitle.toLowerCase().includes(searchTitle);
              const matchesPriority = !priority || d.Priority === priority;
              return matchesTitle && matchesPriority;
            });
          });
        }}
        onClear={handleClearDiscussionSearch}
        project={project}
        modal={false}
      />
    )}
    {discussionsLoading ? (
      <Card>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading discussions...</div>
      </Card>
    ) : discussions.length === 0 ? (
      <Card>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">
          {isSearchActive ? 'No discussions match your search.' : 'No discussions found.'}
        </div>
      </Card>
    ) : viewMode === 'list' ? (
      <Card className="mt-4 overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-1.5">
          <thead>
            <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
              <th className="rounded-l-xl bg-slate-50 px-5 py-3">Discussion</th>
              <th className="bg-slate-50 px-4 py-3">Priority</th>
              <th className="bg-slate-50 px-4 py-3">Date</th>
              <th className="rounded-r-xl bg-slate-50 px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {discussions.map((d) => {
              const handleRowMouseEnter = (e: React.MouseEvent<HTMLTableRowElement>) => {
                e.currentTarget.style.transform = 'scale(1.01)';
                e.currentTarget.style.transition = 'transform 0.25s cubic-bezier(0.4,0,0.2,1)';
              };
              const handleRowMouseLeave = (e: React.MouseEvent<HTMLTableRowElement>) => {
                e.currentTarget.style.transform = 'scale(1)';
              };
              return (
              <tr
                key={d.ProjectDiscussionID}
                className="text-sm text-slate-700 hover:bg-slate-50/60 hover:scale-[1.01] transition-all duration-200 origin-center relative z-10"
                onMouseEnter={handleRowMouseEnter}
                onMouseLeave={handleRowMouseLeave}
              >
                <td className="rounded-l-xl bg-white px-4 py-3 border-b border-slate-100">
                  <div className="font-semibold text-slate-900">{d.DiscussionTitle}</div>
                </td>
                <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600">{d.PriorityName || "—"}</td>
                <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600">{d.CreatedDate || "—"}</td>
                <td className="rounded-r-xl bg-white px-4 py-3 text-right border-b border-slate-100">
                  <div className="flex items-center justify-end gap-1">
                    {d.HasUserRightToEdit && <Button type="text" size="small" icon={<Pencil size={16} />} onClick={() => handleEditDiscussion(d)} />}
                    {d.HasUserRightToDelete && (
                      <Button type="text" size="small" danger icon={<Trash2 size={16} />} onClick={() => handleDeleteDiscussion(d)} />
                    )}
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {discussions.map((d) => (
          <Card key={d.ProjectDiscussionID} hover className="flex flex-col">
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-slate-900 truncate">{d.DiscussionTitle}</h4>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-base text-muted-foreground">
                <span>Priority: {d.PriorityName}</span>
                <span>•</span>
                <span>{d.CreatedDate}</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
              {d.HasUserRightToEdit && <Button size="small" onClick={() => handleEditDiscussion(d)}>Edit</Button>}
              {d.HasUserRightToDelete && (
                <Button size="small" danger onClick={() => handleDeleteDiscussion(d)}>Delete</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    )}
    <DiscussionCreate
      open={isCreateOpen}
      onClose={() => { setIsCreateOpen(false); setEditingDiscussion(null); }}
      onSuccess={() => {
        setIsCreateOpen(false);
        setEditingDiscussion(null);
        discussionsRefetch();
      }}
      project={project}
      editingDiscussion={editingDiscussion}
    />
  </div>
);
}
