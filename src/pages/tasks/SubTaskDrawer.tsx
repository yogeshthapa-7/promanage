'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Tabs, Button, message, Modal } from 'antd';
import Drawer from '@/components/drawer';
import type { ApiProject } from '@/lib/projects-data';
import type { TaskItem, SubTaskItem } from '@/lib/tasks-data';
import { fetchSubTasks, statusColor, priorityColor } from '@/lib/tasks-data';
import { apiCall } from '@/lib/api';
import Pagination from '@/components/ui/Pagination';
import Card from '@/components/ui/Card';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { usePaginatedList, type PaginatedListParams } from '@/hooks/usePaginatedList';
import { Plus, Trash2, Pencil } from 'lucide-react';
import SubTaskCreate from './SubTasksTab/Create';
import DiscussionCreate from './DiscussionTab/Create';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
const DISCUSSION_API = `${API_BASE}/ProjectDiscussion/ServerSearch`;
const MILESTONE_API = `${API_BASE}/ProjectMilestone/ServerSearch`;
const TIMELINE_API = `${API_BASE}/ProjectTimelineInfo/ServerSearch`;

interface SubTaskDrawerProps {
  open: boolean;
  onClose: () => void;
  project: ApiProject;
  task: TaskItem | null;
}

interface DiscussionItem {
  ProjectDiscussionID: number;
  DiscussionTitle: string;
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

interface TimelineItem {
  TraceID: number;
  TraceKeyName: string;
  Remarks: string;
  CreatedDate: string;
  CreatedTime: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function SubTaskDrawer({ open, onClose, project, task }: SubTaskDrawerProps) {
  const [activeTab, setActiveTab] = useState('subtasks');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSubTask, setEditingSubTask] = useState<SubTaskItem | null>(null);
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [isDiscussionCreateModalOpen, setIsDiscussionCreateModalOpen] = useState(false);
  const [discussionRefreshTrigger, setDiscussionRefreshTrigger] = useState(0);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [timelines, setTimelines] = useState<TimelineItem[]>([]);
  const [timelinesLoading, setTimelinesLoading] = useState(false);

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
      search: (params.search as string) || '',
      signal: params.signal,
    }).then((result) => ({
      items: result.items,
      total: result.total,
    }));
  }, [projectId, taskId]);

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
    extraDeps: [projectId, taskId],
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
          setDiscussions(Array.isArray(json?.data) ? (json.data as DiscussionItem[]) : []);
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
  }, [open, activeTab, projectId]);

  useEffect(() => {
    if (!open || activeTab !== 'timeline' || !projectId) return;
    const controller = new AbortController();
    let cancelled = false;

    setTimelinesLoading(true);
    setTimelines([]);
    apiCall(TIMELINE_API, {
      method: 'POST',
      body: JSON.stringify({
        model: {
          draw: 1,
          start: 0,
          length: 20,
          columns: [
            { data: 'ProjectInfoID', name: 'ProjectInfoID', searchable: true, orderable: true, search: { value: '', regex: '' } },
          ],
          search: { value: '', regex: '' },
          order: [{ column: 0, dir: 'desc' }],
        },
        param: { ProjectInfoID: projectId },
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
        const json = await res.json();
        if (!cancelled) {
          setTimelines(Array.isArray(json?.data) ? (json.data as TimelineItem[]) : []);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      })
      .finally(() => {
        if (!cancelled) setTimelinesLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, activeTab, projectId]);

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

  const tabItems = useMemo(() => {
    const subtaskPane = (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SearchInput placeholder="Search subtasks..." containerClassName="flex-1 max-w-md" />
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
      <div className="space-y-3">
        <div className="flex items-center justify-end">
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setIsDiscussionCreateModalOpen(true)}>Add Discussion</Button>
        </div>
        {isDiscussionCreateModalOpen && (
          <DiscussionCreate
            open={isDiscussionCreateModalOpen}
            onClose={() => setIsDiscussionCreateModalOpen(false)}
            onSuccess={() => {
              setIsDiscussionCreateModalOpen(false);
              setDiscussionRefreshTrigger((prev) => prev + 1);
            }}
            project={{ ProjectInfoID: projectId || 0, ProjectName: project?.ProjectName }}
          />
        )}
        {discussionsLoading ? (
          <Card><div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading discussions...</div></Card>
        ) : discussions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">No discussions found.</div>
        ) : (
          discussions.map((d) => (
            <Card key={d.ProjectDiscussionID} hover>
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-base font-bold text-slate-900">{d.DiscussionTitle}</h4>
                {d.HasUserRightToDelete && (
                  <Button type="text" size="small" danger icon={<Trash2 size={16} />} onClick={() => handleDeleteDiscussion(d)} />
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-base text-muted-foreground">
                <span>Priority: {d.PriorityName}</span>
                <span>•</span>
                <span>{d.CreatedDate}</span>
              </div>
            </Card>
          ))
        )}
      </div>
    );

    const milestonePane = (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button type="primary" icon={<Plus size={16} />}>Add Milestone</Button>
        </div>
        {milestonesLoading ? (
          <Card><div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading milestones...</div></Card>
        ) : milestones.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">No milestones found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {milestones.map((milestone) => {
              const progressColor = milestone.Progress >= 75 ? '#10B981' : milestone.Progress >= 40 ? '#3B82F6' : milestone.Progress > 0 ? '#F59E0B' : '#D1D5DB';
              return (
                <Card key={milestone.ProjectMilestoneID} hover className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-slate-900 truncate">{milestone.MilestoneTitle}</h3>
                    <span className="text-sm font-bold text-slate-700">{milestone.Progress}%</span>
                  </div>
                  {milestone.Summary && <p className="text-base text-slate-500 line-clamp-3">{milestone.Summary}</p>}
                  <ProgressBar value={Math.min(milestone.Progress, 100)} color={progressColor} />
                  <div className="flex items-center justify-between text-base text-muted-foreground">
                    <span>Start: {milestone.StartDate || '—'}</span>
                    <span>End: {milestone.EndDate || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-base text-muted-foreground">Milestone Cost</span>
                    <span className="text-sm font-semibold text-slate-700">{milestone.MilestoneCost.toLocaleString()}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );

    const timelinePane = (
      <div className="w-full max-w-5xl mx-auto px-4 py-8 font-sans select-none">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Project Timeline</h2>
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{project?.ProjectName || 'Progress Overview'}</p>
        </div>
        {timelinesLoading ? (
          <Card><div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading timeline...</div></Card>
        ) : timelines.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">No progress history found for this project.</div>
        ) : (
          <div className="relative w-full">
            <div className="timeline-rail absolute top-0 bottom-0 left-4 md:left-1/2 md:-translate-x-1/2 w-[2px] h-full pointer-events-none" />
            <div className="w-full flex flex-col gap-8 relative">
              {timelines.map((item, idx) => {
                const isLeft = idx % 2 === 0;
                const itemNumber = timelines.length - idx;
                return (
                  <div key={item.TraceID + idx} className="w-full flex flex-col md:flex-row items-start md:items-center relative">
                    <div className={`w-full md:w-1/2 ${isLeft ? 'md:pr-8 md:ml-auto md:pl-0' : 'md:pl-8'} flex justify-start md:justify-end`}>
                      <Card className="group w-full max-w-md">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-bold uppercase tracking-wider text-indigo-600">{item.TraceKeyName || 'Milestone'}</span>
                          <span className="text-sm font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600">#{String(itemNumber).padStart(2, '0')}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800 tracking-tight leading-relaxed whitespace-pre-line mt-2">{item.Remarks || 'No logged descriptions recorded.'}</h4>
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-sm font-medium text-slate-400">
                          <span className="bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded font-mono border border-slate-100">ID: #{item.TraceID}</span>
                          <span>{item.CreatedDate}</span>
                          <span>•</span>
                          <span>{item.CreatedTime}</span>
                        </div>
                      </Card>
                    </div>
                    <div className="timeline-step absolute top-0 bottom-0 left-4 md:left-1/2 md:-translate-x-1/2" />
                    <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center z-20">
                      <div className="w-3 h-3 rounded-full border-2 border-indigo-600 bg-white" />
                    </div>
                    <div className="hidden md:block w-1/2" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );

    return [
      { key: 'subtasks', label: 'Sub Tasks', children: subtaskPane },
      { key: 'discussion', label: 'Discussion', children: discussionPane },
      { key: 'milestone', label: 'Milestone', children: milestonePane },
      { key: 'timeline', label: 'Timeline', children: timelinePane },
    ];
  }, [activeTab, discussions, discussionsLoading, milestones, milestonesLoading, timelines, timelinesLoading, subTasks, subTasksLoading, currentPage, pageSize, project, task, total, isCreateModalOpen, editingSubTask, isDiscussionCreateModalOpen]);

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
