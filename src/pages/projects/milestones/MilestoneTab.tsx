import { useEffect, useState } from "react";
import { Modal, message, Button } from "antd";
import type { ApiProject } from "@/lib/projects-data";
import { apiCall } from "@/lib/api";
import { calculateProgressFromDates } from "@/lib/nepali-date";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import { LayoutGrid, List, Plus, Search, RotateCcw } from "lucide-react";
import MilestoneCreate from "./Create";
import MilestoneSearch from "./Search";

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const MILESTONE_API = `${API_BASE}/ProjectMilestone/ServerSearch`;

interface MilestoneItem {
  ProjectMilestoneID: number;
  ProjectInfoID: number;
  MilestoneTitle: string;
  WorkStatusID: number;
  MilestoneCost: number;
  StartDate: string;
  EndDate: string;
  Summary: string;
  Progress: number;
}

interface MilestoneTabProps {
  project: ApiProject;
  onEdit?: (milestone: MilestoneItem) => void;
}

export default function MilestoneTab({ project, onEdit }: MilestoneTabProps) {
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [allMilestones, setAllMilestones] = useState<MilestoneItem[]>([]);

  const loadMilestones = () => {
    const controller = new AbortController();
    let cancelled = false;
    setMilestonesLoading(true);
    setMilestones([]);

    apiCall(MILESTONE_API, {
      method: "POST",
      body: JSON.stringify({
        model: {
          draw: 1,
          start: 0,
          length: 20,
          columns: [
            { data: "ProjectMilestoneID", name: "ProjectMilestoneID", searchable: true, orderable: true, search: { value: "", regex: "" } },
          ],
          search: { value: "", regex: "" },
          order: [{ column: 0, dir: "desc" }],
        },
        param: {
          ProjectMilestoneID: 0,
          ProjectInfoID: project.ProjectInfoID ?? Number(project.id),
          MilestoneTitle: "",
          WorkStatusID: 0,
          MilestoneCost: 0,
          StartDate: "",
          EndDate: "",
          Summary: "",
          Progress: 0,
        },
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
        const json = await res.json();
        if (!cancelled) {
          const data = Array.isArray(json?.data) ? json.data : [];
          setMilestones(data);
          setAllMilestones(data);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      })
      .finally(() => {
        if (!cancelled) setMilestonesLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  };

  useEffect(() => {
    const cleanup = loadMilestones();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  const handleEdit = (milestone: MilestoneItem) => {
    if (onEdit) {
      onEdit(milestone);
    } else {
      setEditingMilestone(milestone);
      setIsCreateOpen(true);
    }
  };

  const handleDelete = (milestone: MilestoneItem) => {
    Modal.confirm({
      title: "Delete Milestone",
      content: `Are you sure you want to delete "${milestone.MilestoneTitle}"?`,
      okText: "Delete",
      okType: "danger",
      zIndex: 10000,
      onOk: async () => {
        try {
          const res = await apiCall(`${API_BASE}/DeleteProjectMilestone?id=${milestone.ProjectMilestoneID}`, { method: "GET" });
          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
          message.success("Milestone deleted successfully");
          setMilestones((prev) => prev.filter((m) => m.ProjectMilestoneID !== milestone.ProjectMilestoneID));
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Failed to delete milestone");
        }
      },
    });
  };

  const handleAdd = () => {
    setEditingMilestone(null);
    setIsCreateOpen(true);
  };

  const handleClearMilestoneSearch = () => {
    setIsSearchOpen(false);
    setIsSearchActive(false);
    setMilestones(allMilestones);
  };

  if (milestonesLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button icon={<Search size={16} />} onClick={() => setIsSearchOpen(true)}>
              Search
            </Button>
            <Button icon={<RotateCcw size={16} />} onClick={handleClearMilestoneSearch}>
              Clear
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/70 border border-border rounded-2xl p-0.5 shadow-xs">
              <Button type="text" onClick={() => setViewMode('grid')} icon={<LayoutGrid className="w-4 h-4" />} />
              <Button type="text" onClick={() => setViewMode('list')} icon={<List className="w-4 h-4" />} />
            </div>
          </div>
        </div>
        <Card>
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading milestones...</div>
        </Card>
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button icon={<Search size={16} />} onClick={() => setIsSearchOpen(true)}>
              Search
            </Button>
            <Button icon={<RotateCcw size={16} />} onClick={handleClearMilestoneSearch}>
              Clear
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/70 border border-border rounded-2xl p-0.5 shadow-xs">
              <Button type="text" onClick={() => setViewMode('grid')} icon={<LayoutGrid className="w-4 h-4" />} />
              <Button type="text" onClick={() => setViewMode('list')} icon={<List className="w-4 h-4" />} />
            </div>
            <Button type="primary" icon={<Plus size={16} />} onClick={handleAdd}>
              Add Milestone
            </Button>
          </div>
        </div>
        <Card>
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">
            {isSearchActive ? 'No milestones match your search.' : 'No milestones found.'}
          </div>
        </Card>
        <MilestoneCreate
          open={isCreateOpen}
          onClose={() => { setIsCreateOpen(false); setEditingMilestone(null); }}
          onSuccess={() => { setIsCreateOpen(false); setEditingMilestone(null); loadMilestones(); }}
          project={project}
          editingMilestone={editingMilestone}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button icon={<Search size={16} />} onClick={() => setIsSearchOpen(true)}>
            Search
          </Button>
          <Button icon={<RotateCcw size={16} />} onClick={handleClearMilestoneSearch}>
            Clear
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/70 border border-border rounded-2xl p-0.5 shadow-xs">
            <Button type="text" onClick={() => setViewMode('grid')} icon={<LayoutGrid className="w-4 h-4" />} />
            <Button type="text" onClick={() => setViewMode('list')} icon={<List className="w-4 h-4" />} />
          </div>
          <Button type="primary" icon={<Plus size={16} />} onClick={handleAdd}>
            Add Milestone
          </Button>
        </div>
      </div>
      {isSearchOpen && (
        <MilestoneSearch
          open={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSearch={(values) => {
            const searchTitle = String(values.MilestoneTitle || '').toLowerCase();
            const searchSummary = String(values.Summary || '').toLowerCase();
            setIsSearchActive(true);
            setMilestones(() => {
              if (!searchTitle && !searchSummary) return allMilestones;
              return allMilestones.filter((milestone) => {
                const matchesTitle = !searchTitle || milestone.MilestoneTitle.toLowerCase().includes(searchTitle);
                const matchesSummary = !searchSummary || milestone.Summary.toLowerCase().includes(searchSummary);
                return matchesTitle && matchesSummary;
              });
            });
          }}
          onClear={handleClearMilestoneSearch}
          project={project}
          modal={false}
        />
      )}

      {viewMode === 'list' ? (
        <Card className="mt-4 overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-1.5">
            <thead>
              <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                <th className="rounded-l-xl bg-slate-50 px-5 py-3">Milestone</th>
                <th className="bg-slate-50 px-4 py-3">Progress</th>
                <th className="bg-slate-50 px-4 py-3">Start Date</th>
                <th className="bg-slate-50 px-4 py-3">End Date</th>
                <th className="bg-slate-50 px-4 py-3">Cost</th>
                <th className="rounded-r-xl bg-slate-50 px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((milestone) => {
                const calculatedProgress = calculateProgressFromDates(milestone.StartDate, milestone.EndDate, milestone.Progress);
                const progressColor =
                  calculatedProgress >= 75
                    ? "#10B981"
                    : calculatedProgress >= 40
                    ? "#3B82F6"
                    : calculatedProgress > 0
                    ? "#F59E0B"
                    : "#D1D5DB";
                const handleRowMouseEnter = (e: React.MouseEvent<HTMLTableRowElement>) => {
                  e.currentTarget.style.transform = 'scale(1.01)';
                  e.currentTarget.style.transition = 'transform 0.25s cubic-bezier(0.4,0,0.2,1)';
                };
                const handleRowMouseLeave = (e: React.MouseEvent<HTMLTableRowElement>) => {
                  e.currentTarget.style.transform = 'scale(1)';
                };
                return (
                <tr
                  key={milestone.ProjectMilestoneID}
                  className="text-sm text-slate-700 hover:bg-slate-50/60 hover:scale-[1.01] transition-all duration-200 origin-center relative z-10"
                  onMouseEnter={handleRowMouseEnter}
                  onMouseLeave={handleRowMouseLeave}
                >
                    <td className="rounded-l-xl bg-white px-4 py-3 border-b border-slate-100">
                      <div className="font-semibold text-slate-900">{milestone.MilestoneTitle}</div>
                      {milestone.Summary && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs mt-1">{milestone.Summary}</div>
                      )}
                    </td>
                    <td className="bg-white px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">{calculatedProgress}%</span>
                        <ProgressBar value={Math.min(calculatedProgress, 100)} color={progressColor} />
                      </div>
                    </td>
                    <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600">{milestone.StartDate || "—"}</td>
                    <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600">{milestone.EndDate || "—"}</td>
                    <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600">{milestone.MilestoneCost.toLocaleString()}</td>
                    <td className="rounded-r-xl bg-white px-4 py-3 text-right border-b border-slate-100">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="small" onClick={() => handleEdit(milestone)}>Edit</Button>
                        <Button size="small" danger onClick={() => handleDelete(milestone)}>Delete</Button>
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
          {milestones.map((milestone) => {
            const calculatedProgress = calculateProgressFromDates(milestone.StartDate, milestone.EndDate, milestone.Progress);
            const progressColor =
              calculatedProgress >= 75
                ? "#10B981"
                : calculatedProgress >= 40
                ? "#3B82F6"
                : calculatedProgress > 0
                ? "#F59E0B"
                : "#D1D5DB";

            return (
              <Card key={milestone.ProjectMilestoneID} hover className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-900 truncate">{milestone.MilestoneTitle}</h3>
                  <span className="text-sm font-bold text-slate-700">{calculatedProgress}%</span>
                </div>

                {milestone.Summary && (
                  <p className="text-base text-slate-500 line-clamp-3">{milestone.Summary}</p>
                )}

                <ProgressBar value={Math.min(calculatedProgress, 100)} color={progressColor} />

                <div className="flex items-center justify-between text-base text-muted-foreground">
                  <span>Start: {milestone.StartDate || "—"}</span>
                  <span>End: {milestone.EndDate || "—"}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-base text-muted-foreground">Milestone Cost</span>
                  <span className="text-sm font-semibold text-slate-700">{milestone.MilestoneCost.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button size="small" onClick={() => handleEdit(milestone)}>Edit</Button>
                  <Button size="small" danger onClick={() => handleDelete(milestone)}>Delete</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <MilestoneCreate
        open={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setEditingMilestone(null); }}
        onSuccess={() => { setIsCreateOpen(false); setEditingMilestone(null); loadMilestones(); }}
        project={project}
        editingMilestone={editingMilestone}
      />
    </div>
  );
}
