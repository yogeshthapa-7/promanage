import { useState } from "react";
import { Modal, message, Button } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { MilestoneTabProps } from "@/features/projects/types/projects-types";
import { calculateProgressFromDates, convertAdToBs } from "@/shared/utils/nepali-date";
import Card from "@/shared/components/ui/Card";
import ProgressBar from "@/shared/components/ui/ProgressBar";
import { LayoutGrid, List, Plus, Search, RotateCcw } from "lucide-react";
import AppTable from "@/shared/components/ui/AppTable";
import MilestoneCreate from "./Create";
import MilestoneSearch from "./Search";
import { fetchMilestones, deleteMilestone, type MilestoneItem } from "@/features/projects/services/milestone.service";
import Pagination from '@/shared/components/ui/Pagination';
import { usePaginatedList, type PaginatedListParams } from '@/shared/hooks/usePaginatedList';
import { fetchProjectInfo } from '@/features/tasks/services/task.service';

export default function MilestoneTab({ project: propProject, onEdit }: MilestoneTabProps) {
  const queryClient = useQueryClient();
  const [editingMilestone, setEditingMilestone] = useState<MilestoneItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
          await deleteMilestone(milestone.ProjectMilestoneID);
          message.success("Milestone deleted successfully");
          queryClient.invalidateQueries({ queryKey: ['milestones'] });
          refetch();
        } catch {
          message.error("Failed to delete milestone");
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
    setSearchQuery('');
  };

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project-detail', propProject?.ProjectInfoID],
    queryFn: ({ signal }) => fetchProjectInfo(propProject!.ProjectInfoID, signal),
    enabled: Boolean(propProject?.ProjectInfoID),
  });

  const {
    data: milestones = [],
    total: totalFiltered,
    loading: milestonesLoading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch
  } = usePaginatedList<MilestoneItem>({
    fetcher: (params: PaginatedListParams) => {
      if(!project?.ProjectInfoID) return Promise.resolve({ items: [], total: 0 });
      return fetchMilestones(project, {
        start: params.start as number,
        length: params.length as number,
        search: (params.search as string) || searchQuery,
      }, params.signal);
    },
    extraDeps: [project, searchQuery],
    queryKey: ['milestones'],
  });

  const columns = [
    {
      title: 'Milestone',
      key: 'MilestoneTitle',
      render: (_: any, record: MilestoneItem) => {
        return (
          <div className="font-semibold text-slate-900">{record.MilestoneTitle}</div>
        );
      },
    },
    {
      title: 'Progress',
      key: 'Progress',
      render: (_: any, record: MilestoneItem) => {
        const calculatedProgress = calculateProgressFromDates(record.StartDate, record.EndDate, record.Progress);
        const progressColor =
          calculatedProgress >= 75
            ? '#10B981'
            : calculatedProgress >= 40
            ? '#3B82F6'
            : calculatedProgress > 0
            ? '#F59E0B'
            : '#D1D5DB';
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">{calculatedProgress}%</span>
            <ProgressBar value={Math.min(calculatedProgress, 100)} color={progressColor} />
          </div>
        );
      },
    },
    {
      title: 'Start Date',
      dataIndex: 'StartDate',
      key: 'StartDate',
      render: (date: string) => (date ? convertAdToBs(date) : '—'),
    },
    {
      title: 'End Date',
      dataIndex: 'EndDate',
      key: 'EndDate',
      render: (date: string) => (date ? convertAdToBs(date) : '—'),
    },
    {
      title: 'Cost',
      dataIndex: 'MilestoneCost',
      key: 'MilestoneCost',
      render: (cost: number) => (typeof cost === 'number' ? cost.toLocaleString() : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: MilestoneItem) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="small" onClick={() => handleEdit(record)}>Edit</Button>
          <Button size="small" danger onClick={() => handleDelete(record)}>Delete</Button>
        </div>
      ),
    },
  ];

  if (projectLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button icon={<Search size={16} />} onClick={() => setIsSearchOpen(true)}>
              Search
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

  if (milestonesLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
        onSuccess={() => { 
          setIsCreateOpen(false); 
          setEditingMilestone(null); 
          queryClient.invalidateQueries({ queryKey: ['milestones'] });
          refetch(); 
        }}
        project={project}
        editingMilestone={editingMilestone}
      />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
              setIsSearchActive(true);
              setSearchQuery(searchTitle);
             }}
           project={project}
           modal={false}
          />
      )}

      {viewMode === 'list' ? (
        <AppTable
          columns={columns}
          dataSource={milestones}
          rowKey="ProjectMilestoneID"
          rowHoverClassName="hover:bg-slate-50/60"
          cardClassName="mt-4"
          total={totalFiltered}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      ) : (
        <>
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
                    <span>Start: {convertAdToBs(milestone.StartDate) || "—"}</span>
                    <span>End: {convertAdToBs(milestone.EndDate) || "—"}</span>
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
          {viewMode === 'grid' && !milestonesLoading && milestones.length > 0 && (
            <Pagination
              total={totalFiltered}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          )}
        </>
      )}

      <MilestoneCreate
        open={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setEditingMilestone(null); }}
        onSuccess={() => { 
          setIsCreateOpen(false); 
          setEditingMilestone(null); 
          queryClient.invalidateQueries({ queryKey: ['milestones'] });
          refetch(); 
        }}
        project={project}
        editingMilestone={editingMilestone}
      />
    </div>
  );
}








