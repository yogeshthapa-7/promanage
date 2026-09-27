import { useEffect, useState } from "react";
import type { ApiProject } from "@/features/projects/types/projects-types";
import { Modal, message, Button } from "antd";
import { LayoutGrid, List, Search, Pencil, Trash2, RotateCcw } from "lucide-react";
import AppTable from "@/components/ui/AppTable";
import Card from "@/components/ui/Card";
import DiscussionCreate from "./Create";
import DiscussionSearch from "./Search";
import { convertAdToBs } from "@/shared/utils/nepali-date";
import { fetchDiscussions, deleteDiscussion, type ProjectDiscussionItem } from "@/features/projects/services/discussion.service";

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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  const discussionsRefetch = async () => {
    setDiscussionsLoading(true);
    setDiscussions([]);

    try {
      const data = await fetchDiscussions(project);
      setDiscussions(data);
      setAllDiscussions(data);
    } catch {
      console.error('Failed to fetch discussions');
    } finally {
      setDiscussionsLoading(false);
    }
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
          await deleteDiscussion(discussion.ProjectDiscussionID);
          message.success('Discussion deleted successfully');
          setDiscussions((prev) => prev.filter((d) => d.ProjectDiscussionID !== discussion.ProjectDiscussionID));
        } catch {
          message.error('Failed to delete discussion');
        }
      },
    });
  };

  useEffect(() => {
    discussionsRefetch();
  }, [project]);

  const columns = [
    {
      title: 'Discussion',
      dataIndex: 'DiscussionTitle',
      key: 'DiscussionTitle',
      render: (text: string) => <div className="font-semibold text-slate-900">{text}</div>,
    },
    {
      title: 'Priority',
      dataIndex: 'PriorityName',
      key: 'PriorityName',
      render: (text: string) => text || '',
    },
    {
      title: 'Date',
      dataIndex: 'CreatedDate',
      key: 'CreatedDate',
      render: (date: string) => (date ? convertAdToBs(date) : ''),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: ProjectDiscussionItem) => (
        <div className="flex items-center justify-end gap-1">
          {record.HasUserRightToEdit && <Button type="text" size="small" icon={<Pencil size={16} />} onClick={() => handleEditDiscussion(record)} />}
          {record.HasUserRightToDelete && (
            <Button type="text" size="small" danger icon={<Trash2 size={16} />} onClick={() => handleDeleteDiscussion(record)} />
          )}
        </div>
      ),
    },
  ];

  return (
  <div className="space-y-4">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
      <AppTable
        columns={columns}
        dataSource={discussions}
        rowKey="ProjectDiscussionID"
        rowHoverClassName="hover:bg-slate-50/60"
        cardClassName="mt-4"
      />
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {discussions.map((d) => (
          <Card key={d.ProjectDiscussionID} hover className="flex flex-col">
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-slate-900 truncate">{d.DiscussionTitle}</h4>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-base text-muted-foreground">
                <span>Priority: {d.PriorityName}</span>
                <span>•</span>
                 <span>{convertAdToBs(d.CreatedDate)}</span>
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












