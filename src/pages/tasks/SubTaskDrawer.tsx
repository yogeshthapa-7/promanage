'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Tabs, Button, message, Modal, Select, Input } from 'antd';
import Drawer from '@/components/drawer';
import type { ApiProject } from '@/lib/projects-data';
import type { TaskItem, SubTaskItem } from '@/lib/tasks-data';
import { fetchSubTasks, statusColor, priorityColor } from '@/lib/tasks-data';
import { apiCall } from '@/lib/api';
import { calculateProgressFromDates } from '@/lib/nepali-date';
import Pagination from '@/components/ui/Pagination';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { usePaginatedList, type PaginatedListParams } from '@/hooks/usePaginatedList';
import { Plus, Trash2, Pencil, Search, RotateCcw } from 'lucide-react';
import SubTaskCreate from './SubTasksTab/Create';
import SubTaskSearch from './SubTasksTab/Search';
import DiscussionCreate from './DiscussionTab/Create';
import DiscussionSearch from './DiscussionTab/Search';
import MilestoneCreate from './MilestoneTab/Create';
import IssueCreate from './IssueTab/Create';
import TimelineTab from './TimelineTab/TimelineTab';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
const DISCUSSION_API = `${API_BASE}/ProjectDiscussion/ServerSearch`;
const MILESTONE_API = `${API_BASE}/ProjectMilestone/ServerSearch`;
const TIMELINE_API = `${API_BASE}/ProjectTimelineInfo/ServerSearch`;
const ISSUES_API = `${API_BASE}/Issues/ServerSearch`;

interface SubTaskDrawerProps {
  open: boolean;
  onClose: () => void;
  project: ApiProject;
  task: TaskItem | null;
}

interface DiscussionItem {
  ProjectDiscussionID: number;
  DiscussionTitle: string;
  Priority: number;
  PriorityName: string;
  CreatedDate: string;
  HasUserRightToEdit: boolean;
  HasUserRightToDelete: boolean;
}

interface MilestoneItem {
  ProjectMilestoneID: number;
  MilestoneTitle: string;
  Progress: number;
  StartDate: string;
  EndDate: string;
  MilestoneCost: number;
  Summary: string;
}



interface IssueItem {
  IssuesID: number;
  IssuesTitle: string;
  LabelInfoID: number;
  Comments: string;
  Attachments: string;
  ProjectInfoID: number;
  WorkStatusID: number;
  ProjectInfoName: string;
  WorkStatusName: string;
  LabelInfoName: string;
  LabelColor: string;
  CreatedDate: string;
  RaisedBy: string;
  WorkStatusColor: string;
  CanChangeStatus: boolean;
  HasUserRightToEdit: boolean;
  HasUserRightToDelete: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function SubTaskDrawer({ open, onClose, project, task }: SubTaskDrawerProps) {
  const [activeTab, setActiveTab] = useState('subtasks');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSubTask, setEditingSubTask] = useState<SubTaskItem | null>(null);
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [allDiscussions, setAllDiscussions] = useState<DiscussionItem[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [isDiscussionCreateModalOpen, setIsDiscussionCreateModalOpen] = useState(false);
  const [editingDiscussion, setEditingDiscussion] = useState<DiscussionItem | null>(null);
  const [discussionRefreshTrigger, setDiscussionRefreshTrigger] = useState(0);
  const [isSubTaskSearchModalOpen, setIsSubTaskSearchModalOpen] = useState(false);
  const [subTaskFilters, setSubTaskFilters] = useState({
    SubTaskTitle: '',
    Priority: undefined as number | undefined,
    WorkStatusID: undefined as number | undefined,
    SubTaskManagerID: undefined as number | undefined,
  });

  const handleClearSubTaskSearch = () => {
    setSubTaskFilters({
      SubTaskTitle: '',
      Priority: undefined,
      WorkStatusID: undefined,
      SubTaskManagerID: undefined,
    });
    setIsSubTaskSearchModalOpen(false);
  };

  const handleClearDiscussionSearch = () => {
    setDiscussions(allDiscussions);
    setIsDiscussionSearchModalOpen(false);
  };
  const [isDiscussionSearchModalOpen, setIsDiscussionSearchModalOpen] = useState(false);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [isMilestoneCreateModalOpen, setIsMilestoneCreateModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneItem | null>(null);
  const [milestoneRefreshTrigger, setMilestoneRefreshTrigger] = useState(0);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issueRefreshTrigger, setIssueRefreshTrigger] = useState(0);
  const [isIssueCreateModalOpen, setIsIssueCreateModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<IssueItem | null>(null);


  const projectId = project?.ProjectInfoID ?? (project ? Number(project.id) : null) ?? task?.ProjectInfoID ?? null;
  const taskId = task?.TaskInfoID ?? null;

  const fetcher = useCallback((params: PaginatedListParams) => {
    if (!projectId || !taskId) return Promise.resolve({ items: [], total: 0 });
    const page = Math.floor((params.start as number) / (params.length as number)) + 1;
    return fetchSubTasks({
      projectId,
      taskInfoId: taskId,
      page,
      pageSize: params.length as number,
      search: (params.search as string) || subTaskFilters.SubTaskTitle,
      priority: subTaskFilters.Priority,
      workStatusId: subTaskFilters.WorkStatusID,
      managerId: subTaskFilters.SubTaskManagerID,
      signal: params.signal,
    }).then((result) => ({
      items: result.items,
      total: result.total,
    }));
  }, [projectId, taskId, subTaskFilters]);

  const {
    data: subTasks,
    total,
    loading: subTasksLoading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<SubTaskItem>({
    fetcher,
    initialPageSize: 20,
    extraDeps: [projectId, taskId, subTaskFilters],
  });

  useEffect(() => {
    if (!open) return;
    setCurrentPage(1);
  }, [open, activeTab, setCurrentPage]);

  useEffect(() => {
    setActiveTab('subtasks');
  }, [task?.TaskInfoID]);

  useEffect(() => {
    if (!open || activeTab !== 'discussion' || !projectId) return;
    const controller = new AbortController();
    let cancelled = false;

    setDiscussionsLoading(true);
    setDiscussions([]);
    apiCall(DISCUSSION_API, {
      method: 'POST',
      body: JSON.stringify({
        model: {
          draw: 1,
          start: 0,
          length: 20,
          columns: [
            { data: 'ProjectDiscussionID', name: 'ProjectDiscussionID', searchable: true, orderable: true, search: { value: '', regex: '' } },
          ],
          search: { value: '', regex: '' },
          order: [{ column: 0, dir: 'desc' }],
        },
        param: {
          ProjectDiscussionID: 0,
          DiscussionTitle: '',
          ProjectInfoID: projectId,
          Priority: 0,
          PriorityName: '',
          RaisedBy: '',
          CreatedDate: '',
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
          const data = Array.isArray(json?.data) ? (json.data as DiscussionItem[]) : [];
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
  }, [open, activeTab, projectId, discussionRefreshTrigger]);

  useEffect(() => {
    if (!open || activeTab !== 'milestone' || !projectId) return;
    const controller = new AbortController();
    let cancelled = false;

    setMilestonesLoading(true);
    setMilestones([]);
    apiCall(MILESTONE_API, {
      method: 'POST',
      body: JSON.stringify({
        model: {
          draw: 1,
          start: 0,
          length: 20,
          columns: [
            { data: 'ProjectMilestoneID', name: 'ProjectMilestoneID', searchable: true, orderable: true, search: { value: '', regex: '' } },
          ],
          search: { value: '', regex: '' },
          order: [{ column: 0, dir: 'desc' }],
        },
        param: {
          ProjectMilestoneID: 0,
          ProjectInfoID: projectId,
          MilestoneTitle: '',
          WorkStatusID: 0,
          MilestoneCost: 0,
          StartDate: '',
          EndDate: '',
          Summary: '',
          Progress: 0,
        },
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
        const json = await res.json();
        if (!cancelled) {
          setMilestones(Array.isArray(json?.data) ? (json.data as MilestoneItem[]) : []);
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
  }, [open, activeTab, projectId, milestoneRefreshTrigger]);

  useEffect(() => {
    if (!open || activeTab !== 'issue' || !projectId) return;
    const controller = new AbortController();
    let cancelled = false;

    setIssuesLoading(true);
    setIssues([]);
    apiCall(ISSUES_API, {
      method: 'POST',
      body: JSON.stringify({
        model: {
          draw: 1,
          start: 0,
          length: 20,
          columns: [
            { data: 'IssuesID', name: 'IssuesID', searchable: true, orderable: true, search: { value: '', regex: '' } },
          ],
          search: { value: '', regex: '' },
          order: [{ column: 0, dir: 'desc' }],
        },
        param: {
          IssuesID: 0,
          IssuesTitle: '',
          LabelInfoID: 0,
          Comments: '',
          Attachments: '',
          ProjectInfoID: projectId,
          WorkStatusID: 0,
          ProjectInfoName: '',
          WorkStatusName: '',
          LabelInfoName: '',
          LabelColor: '',
          CreatedDate: '',
          RaisedBy: '',
          WorkStatusColor: '',
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
          setIssues(Array.isArray(json?.data) ? (json.data as IssueItem[]) : []);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      })
      .finally(() => {
        if (!cancelled) setIssuesLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, activeTab, projectId, issueRefreshTrigger]);



  const handleDeleteDiscussion = (discussion: DiscussionItem) => {
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

  const handleEditDiscussion = (discussion: DiscussionItem) => {
    setEditingDiscussion(discussion);
    setIsDiscussionCreateModalOpen(true);
  };

  const handleDeleteSubTask = (subtask: SubTaskItem) => {
    Modal.confirm({
      title: 'Delete Subtask',
      content: `Are you sure you want to delete "${subtask.SubTaskTitle}"?`,
      okText: 'Delete',
      okType: 'danger',
      zIndex: 10000,
      onOk: async () => {
        try {
          const res = await apiCall(`${API_BASE}/DeleteSubTaskInfo?id=${subtask.SubTaskInfoID}`, { method: 'GET' });
          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
          message.success('Subtask deleted successfully');
          refetch();
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Failed to delete subtask');
        }
      },
    });
  };

  const handleEditSubTask = (subtask: SubTaskItem) => {
    setEditingSubTask(subtask);
    setIsCreateModalOpen(true);
  };

  const handleEditMilestone = (milestone: MilestoneItem) => {
    setEditingMilestone(milestone);
    setIsMilestoneCreateModalOpen(true);
  };

  const handleEditIssue = (issue: IssueItem) => {
    setEditingIssue(issue);
    setIsIssueCreateModalOpen(true);
  };

  const handleDeleteIssue = (issue: IssueItem) => {
    Modal.confirm({
      title: 'Delete Issue',
      content: `Are you sure you want to delete "${issue.IssuesTitle}"?`,
      okText: 'Delete',
      okType: 'danger',
      zIndex: 10000,
      onOk: async () => {
        try {
          const res = await apiCall(`${API_BASE}/DeleteIssues?id=${issue.IssuesID}`, { method: 'GET' });
          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
          message.success('Issue deleted successfully');
          setIssues((prev) => prev.filter((i) => i.IssuesID !== issue.IssuesID));
          setIssueRefreshTrigger((prev) => prev + 1);
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Failed to delete issue');
        }
      },
    });
  };

  const handleDeleteMilestone = (milestone: MilestoneItem) => {
    Modal.confirm({
      title: 'Delete Milestone',
      content: `Are you sure you want to delete "${milestone.MilestoneTitle}"?`,
      okText: 'Delete',
      okType: 'danger',
      zIndex: 10000,
      onOk: async () => {
        try {
          const res = await apiCall(`${API_BASE}/DeleteProjectMilestone?id=${milestone.ProjectMilestoneID}`, { method: 'GET' });
          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
          message.success('Milestone deleted successfully');
          setMilestones((prev) => prev.filter((m) => m.ProjectMilestoneID !== milestone.ProjectMilestoneID));
          setMilestoneRefreshTrigger((prev) => prev + 1);
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Failed to delete milestone');
        }
      },
    });
  };

  const tabItems = useMemo(() => {
    const subtaskPane = (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button icon={<Search size={16} />} onClick={() => setIsSubTaskSearchModalOpen(true)}>
              Search
            </Button>
            <Button onClick={handleClearSubTaskSearch}>
              Clear
            </Button>
          </div>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setIsCreateModalOpen(true)}>
            Add New Subtask
          </Button>
        </div>
        {isCreateModalOpen && (
          <SubTaskCreate
            open={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setEditingSubTask(null);
            }}
            onSuccess={() => {
              refetch();
              setEditingSubTask(null);
            }}
            project={project}
            selectedTask={task}
            editingSubTask={editingSubTask}
            modal={false}
          />
        )}
        {isSubTaskSearchModalOpen && (
          <SubTaskSearch
            open={isSubTaskSearchModalOpen}
            onClose={() => setIsSubTaskSearchModalOpen(false)}
            onSearch={(values) => {
              setSubTaskFilters({
                SubTaskTitle: String(values.SubTaskTitle || ''),
                Priority: values.Priority ? Number(values.Priority) : undefined,
                WorkStatusID: values.WorkStatusID ? Number(values.WorkStatusID) : undefined,
                SubTaskManagerID: values.SubTaskManagerID ? Number(values.SubTaskManagerID) : undefined,
              });
            }}
            onClear={handleClearSubTaskSearch}
            project={project}
            selectedTask={task}
            modal={false}
          />
        )}
        {subTasksLoading ? (
          <Card><div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading subtasks...</div></Card>
        ) : subTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <p className="text-base text-slate-500 mb-3">This task does not have any subtasks yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subTasks.map((sub) => {
              const statusClass = statusColor[sub.WorkStatusName] ?? '!bg-gray-100 !text-gray-700';
              const priorityClass = priorityColor[sub.PriorityName] ?? '!bg-gray-100 !text-gray-700';
              return (
                <Card key={sub.SubTaskInfoID} hover padding="" className="flex flex-col gap-5 p-8">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 leading-snug truncate" title={sub.SubTaskTitle}>{sub.SubTaskTitle}</h3>
                      {sub.ProjectName && (
                        <p className="text-sm font-medium text-slate-500 truncate" title={sub.ProjectName}>{sub.ProjectName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button type="text" size="small" icon={<Pencil size={16} />} onClick={() => handleEditSubTask(sub)} />
                      <Button type="text" size="small" danger icon={<Trash2 size={16} />} onClick={() => handleDeleteSubTask(sub)} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={priorityClass}>{sub.PriorityName}</Badge>
                    <Badge className={statusClass}>{sub.WorkStatusName}</Badge>
                  </div>

                  {sub.TaskInfoName && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                      <span className="font-medium truncate" title={sub.TaskInfoName}>{sub.TaskInfoName}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <Avatar src={sub.SubTaskManagerPhoto || ''} alt={sub.SubTaskManagerName || ''} size={40}>
                      {(sub.SubTaskManagerName || '?').charAt(0).toUpperCase()}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate" title={sub.SubTaskManagerName}>{sub.SubTaskManagerName || '—'}</p>
                      <p className="text-sm text-slate-500">Manager</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        {total > 0 && (
          <Pagination
            total={total}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(Number(size));
              setCurrentPage(1);
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            totalLabel={`Showing ${subTasks.length ? (currentPage - 1) * pageSize + 1 : 0} to ${Math.min(currentPage * pageSize, total)} of ${total} subtasks`}
          />
        )}
      </div>
    );

    const discussionPane = (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button icon={<Search size={16} />} onClick={() => setIsDiscussionSearchModalOpen(true)}>
              Search
            </Button>
            <Button icon={<RotateCcw size={16} />} onClick={handleClearDiscussionSearch}>
              Clear
            </Button>
          </div>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => { setEditingDiscussion(null); setIsDiscussionCreateModalOpen(true); }}>Add Discussion</Button>
        </div>
        {isDiscussionCreateModalOpen && (
          <DiscussionCreate
            open={isDiscussionCreateModalOpen}
            onClose={() => { setIsDiscussionCreateModalOpen(false); setEditingDiscussion(null); }}
            onSuccess={() => {
              setIsDiscussionCreateModalOpen(false);
              setEditingDiscussion(null);
              setDiscussionRefreshTrigger((prev) => prev + 1);
            }}
            project={{ ProjectInfoID: projectId || 0, ProjectName: project?.ProjectName }}
            editingDiscussion={editingDiscussion}
          />
        )}
        {isDiscussionSearchModalOpen && (
          <DiscussionSearch
            open={isDiscussionSearchModalOpen}
            onClose={() => setIsDiscussionSearchModalOpen(false)}
            onSearch={(values) => {
              const searchTitle = String(values.DiscussionTitle || '').toLowerCase();
              const priority = Number(values.Priority);
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
            project={{ ProjectInfoID: projectId || 0, ProjectName: project?.ProjectName }}
            modal={false}
          />
        )}
        {discussionsLoading ? (
          <Card><div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading discussions...</div></Card>
        ) : discussions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">No discussions found.</div>
        ) : (
          <div className="space-y-4">
          {discussions.map((d) => (
            <Card key={d.ProjectDiscussionID} hover>
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-base font-bold text-slate-900">{d.DiscussionTitle}</h4>
                <div className="flex items-center gap-1.5 shrink-0">
                  {d.HasUserRightToEdit && (
                    <Button type="text" size="small" icon={<Pencil size={16} />} onClick={() => handleEditDiscussion(d)} />
                  )}
                  {d.HasUserRightToDelete && (
                    <Button type="text" size="small" danger icon={<Trash2 size={16} />} onClick={() => handleDeleteDiscussion(d)} />
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-base text-muted-foreground">
                <span>Priority: {d.PriorityName}</span>
                <span>•</span>
                <span>{d.CreatedDate}</span>
              </div>
            </Card>
          ))}
          </div>
        )}
      </div>
    );

    const issuePane = (
      <div className="space-y-3">
        <div className="flex items-center justify-end">
          <Button type="primary" icon={<Plus size={16} />} onClick={() => { setEditingIssue(null); setIsIssueCreateModalOpen(true); }}>Add Issue</Button>
        </div>
        {isIssueCreateModalOpen && (
          <IssueCreate
            open={isIssueCreateModalOpen}
            onClose={() => { setIsIssueCreateModalOpen(false); setEditingIssue(null); }}
            onSuccess={(savedIssue) => {
              setIsIssueCreateModalOpen(false);
              setEditingIssue(null);
              if (savedIssue && savedIssue.IssuesID) {
                setIssues((prev) => {
                  const exists = prev.some((i) => i.IssuesID === savedIssue.IssuesID);
                  if (exists) {
                    return prev.map((i) => (i.IssuesID === savedIssue.IssuesID ? { ...i, ...savedIssue } : i));
                  }
                  return [{ ...savedIssue } as IssueItem, ...prev];
                });
              } else {
                setIssueRefreshTrigger((prev) => prev + 1);
              }
            }}
            project={{ ProjectInfoID: projectId || 0, ProjectName: project?.ProjectName }}
            editingIssue={editingIssue}
          />
        )}
        {issuesLoading ? (
          <Card><div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading issues...</div></Card>
        ) : issues.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">No issues found.</div>
        ) : (
          issues.map((issue) => (
            <Card key={issue.IssuesID} hover>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-slate-900">{issue.IssuesTitle}</h4>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-base text-muted-foreground">
                    {issue.LabelInfoName && (
                      <Badge
                        style={{
                          background: issue.LabelColor ? `${issue.LabelColor}15` : undefined,
                          color: issue.LabelColor || undefined,
                          borderColor: issue.LabelColor ? `${issue.LabelColor}40` : undefined,
                        }}
                      >
                        {issue.LabelInfoName}
                      </Badge>
                    )}
                    {issue.WorkStatusName && <Badge>{issue.WorkStatusName}</Badge>}
                    <span>•</span>
                    <span>Raised by: {issue.RaisedBy || '—'}</span>
                    <span>•</span>
                    <span>{issue.CreatedDate}</span>
                  </div>
                  {issue.Comments && <p className="mt-2 text-base text-slate-500 line-clamp-2">{issue.Comments}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {issue.HasUserRightToEdit && <Button type="text" size="small" icon={<Pencil size={16} />} onClick={() => handleEditIssue(issue)} />}
                  {issue.HasUserRightToDelete && (
                    <Button type="text" size="small" danger icon={<Trash2 size={16} />} onClick={() => handleDeleteIssue(issue)} />
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    );

    const milestonePane = (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button type="primary" icon={<Plus size={16} />} onClick={() => { setEditingMilestone(null); setIsMilestoneCreateModalOpen(true); }}>Add Milestone</Button>
        </div>
        {isMilestoneCreateModalOpen && (
          <MilestoneCreate
            open={isMilestoneCreateModalOpen}
            onClose={() => { setIsMilestoneCreateModalOpen(false); setEditingMilestone(null); }}
            onSuccess={() => {
              setIsMilestoneCreateModalOpen(false);
              setEditingMilestone(null);
              setMilestoneRefreshTrigger((prev) => prev + 1);
            }}
            project={{ ProjectInfoID: projectId || 0, ProjectName: project?.ProjectName }}
            editingMilestone={editingMilestone}
          />
        )}
        {milestonesLoading ? (
          <Card><div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading milestones...</div></Card>
        ) : milestones.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">No milestones found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {milestones.map((milestone) => {
              const calculatedProgress = calculateProgressFromDates(milestone.StartDate, milestone.EndDate, milestone.Progress);
              const progressColor = calculatedProgress >= 75 ? '#10B981' : calculatedProgress >= 40 ? '#3B82F6' : calculatedProgress > 0 ? '#F59E0B' : '#D1D5DB';
              return (
                  <Card key={milestone.ProjectMilestoneID} hover className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-slate-900 truncate">{milestone.MilestoneTitle}</h3>
                      <span className="text-sm font-bold text-slate-700">{calculatedProgress}%</span>
                    </div>
                    {milestone.Summary && <p className="text-base text-slate-500 line-clamp-3">{milestone.Summary}</p>}
                    <ProgressBar value={Math.min(calculatedProgress, 100)} color={progressColor} />
                    <div className="flex items-center justify-between text-base text-muted-foreground">
                      <span>Start: {milestone.StartDate || '—'}</span>
                      <span>End: {milestone.EndDate || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-base text-muted-foreground">Milestone Cost</span>
                      <span className="text-sm font-semibold text-slate-700">{milestone.MilestoneCost.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <Button size="small" onClick={() => handleEditMilestone(milestone)}>Edit</Button>
                      <Button size="small" danger onClick={() => handleDeleteMilestone(milestone)}>Delete</Button>
                    </div>
                  </Card>
              );
            })}
          </div>
        )}
      </div>
    );



    return [
      { key: 'subtasks', label: 'Sub Tasks', children: subtaskPane },
      { key: 'discussion', label: 'Discussion', children: discussionPane },
      { key: 'issue', label: 'Issue', children: issuePane },
      { key: 'milestone', label: 'Milestone', children: milestonePane },
      { key: 'timeline', label: 'Timeline', children: <TimelineTab project={project} projectId={projectId} /> },
    ];
  }, [activeTab, discussions, discussionsLoading, milestones, milestonesLoading, subTasks, subTasksLoading, currentPage, pageSize, project, task, total, isCreateModalOpen, editingSubTask, isDiscussionCreateModalOpen, editingDiscussion, isMilestoneCreateModalOpen, editingMilestone, isIssueCreateModalOpen, editingIssue, issues, issuesLoading, issueRefreshTrigger, discussionRefreshTrigger, milestoneRefreshTrigger, isSubTaskSearchModalOpen, isDiscussionSearchModalOpen, subTaskFilters]);

  if (!task) return null;

  const drawerTitle = task.TaskTitle || 'Task Details';
  const drawerSubtitle = `Task #${task.TaskInfoID}`;

  return (
    <Drawer open={open} onClose={onClose} title={drawerTitle} subtitle={drawerSubtitle} width={760}>
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Project</p>
                <p className="text-sm font-bold text-slate-900">{project?.ProjectName || task?.ProjectInfoName || '—'}</p>
                {(project?.ProjectCode || task?.ProjectCode) && <p className="text-xs text-muted-foreground font-mono mt-0.5">{project?.ProjectCode || task?.ProjectCode}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{project?.WorkStatusName}</Badge>
                <Badge>{project?.PriorityName}</Badge>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Task Manager</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar src={task.TaskManagerPhoto || ''} alt={task.TaskManagerName || 'Manager'} size={28} />
                    <span className="text-sm font-semibold text-slate-700">{task.TaskManagerName || '—'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColor[task.WorkStatusName] ?? '!bg-gray-100 !text-gray-700'}>{task.WorkStatusName}</Badge>
                <Badge className={priorityColor[task.PriorityName] ?? '!bg-gray-100 !text-gray-700'}>{task.PriorityName}</Badge>
              </div>
            </div>
          </div>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </div>
    </Drawer>
  );
}
