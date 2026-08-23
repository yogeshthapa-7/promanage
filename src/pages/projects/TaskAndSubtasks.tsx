'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal, message } from 'antd';
import {
  ArrowLeft,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Users,
  CornerDownRight,
  LayoutGrid,
  List,
  Kanban,
  ListChecks,
  Plus,
  Trash2,
  Eye,
  Pencil,
} from 'lucide-react';

import { BlockSkeleton } from '@/components/ui/Loaders';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { apiCall } from '@/lib/api';
import type { ApiProject } from '@/lib/projects-data';
import CreateTaskDrawer from '@/pages/tasks/createtasks';
import ViewTaskDrawer from '@/pages/tasks/viewtaskdrawer';
import SubTaskCreate from '@/pages/tasks/SubTasksTab/Create';

const priorityLabelMap: Record<number, string> = {
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
};

const projectTypeMap: Record<number, string> = {
  0: 'General',
  1: 'Development',
  2: 'Infrastructure',
  3: 'Design',
};

function hexToRgba(hex: string | null | undefined, alpha: number): string {
  if (!hex || typeof hex !== 'string') return `rgba(107, 114, 128, ${alpha})`;
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
  if (clean.length !== 6) return `rgba(107, 114, 128, ${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return isNaN(r) || isNaN(g) || isNaN(b) ? `rgba(107, 114, 128, ${alpha})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const formatCurrency = (amount?: number) =>
  `Rs. ${(amount ?? 0).toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function pick<T = any>(obj: Record<string, any> | null | undefined, keys: string[], fallback?: T): T {
  if (!obj) return fallback as T;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return fallback as T;
}

interface RawEntity {
  [key: string]: any;
}

interface EntityKeyMap {
  idKeys: string[];
  titleKeys: string[];
  managerKeys: string[];
  photoKeys: string[];
}

interface NormalizedEntity {
  id: number;
  title: string;
  statusName: string;
  statusColor: string;
  priorityName: string;
  dueDate: string;
  description: string;
  managerName: string;
  managerPhoto: string;
}

function extractEntity(obj: RawEntity, keys: EntityKeyMap): NormalizedEntity {
  const priorityRaw = pick<string>(obj, ['PriorityName'], '');
  const priorityNum = pick<number>(obj, ['Priority'], 3);
  return {
    id: pick<number>(obj, keys.idKeys),
    title: pick<string>(obj, keys.titleKeys, 'Untitled'),
    statusName: pick<string>(obj, ['WorkStatusName'], 'Not Started'),
    statusColor: pick<string>(obj, ['WorkStatusColor'], '#6B7280'),
    priorityName: priorityRaw || priorityLabelMap[priorityNum] || 'Medium',
    dueDate: pick<string>(obj, ['DueDate'], ''),
    description: pick<string>(obj, ['Description'], ''),
    managerName: pick<string>(obj, keys.managerKeys, ''),
    managerPhoto: pick<string>(obj, keys.photoKeys, ''),
  };
}

const TASK_KEYS: EntityKeyMap = {
  idKeys: ['TaskInfoID', 'Id', 'id'],
  titleKeys: ['TaskTitle', 'TaskName', 'Title', 'Name'],
  managerKeys: ['TaskManagerName'],
  photoKeys: ['TaskManagerPhoto'],
};

const SUBTASK_KEYS: EntityKeyMap = {
  idKeys: ['SubTaskInfoID', 'Id', 'id'],
  titleKeys: ['SubTaskTitle', 'SubTaskName', 'Title', 'Name'],
  managerKeys: ['SubTaskManagerName'],
  photoKeys: ['SubTaskManagerPhoto'],
};

const getBase = () => (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

async function postServerSearch<T>(endpoint: string, param: Record<string, any>, signal?: AbortSignal): Promise<T[]> {
  const payload = {
    model: {
      columns: Object.keys(param).map((key) => ({
        data: key,
        name: key,
        searchable: true,
        orderable: true,
      })),
      draw: 1,
      start: 0,
      length: 200,
      order: [{ column: 1, dir: 'desc' }],
      search: { value: '', regex: '' },
    },
    param,
  };

  const res = await apiCall(`${getBase()}${endpoint}`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, 10000);

  if (!res.ok) throw new Error(`Request to ${endpoint} failed: ${res.statusText}`);
  const json = await res.json();
  return json?.data || [];
}

const fetchProjectInfo = async (projectId: string, signal?: AbortSignal): Promise<ApiProject> => {
  const sanitizedId = encodeURIComponent(projectId);
  const res = await apiCall(`${getBase()}/GetProjectDetailData?id=${sanitizedId}`, {
    method: 'GET',
    signal,
  }, 10000);

  if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
  const json = await res.json();
  const data = json?.Data ?? json?.data;
  const project = data?.ProjectInfo ?? data?.projectInfo;
  if (!project || !project.ProjectInfoID) throw new Error('Project details not found');
  return project;
};

const fetchProjectTasks = (projectId: string, signal?: AbortSignal) =>
  postServerSearch<RawEntity>(
    '/TaskInfo/ServerSearch',
    {
      TaskInfoID: 0,
      ProjectInfoID: Number(projectId),
      TaskTitle: '',
      TaskName: '',
      TaskManagerName: '',
    },
    signal
  );

const fetchSubTasks = (taskId: number, signal?: AbortSignal) =>
  postServerSearch<RawEntity>(
    '/SubTaskInfo/ServerSearch',
    {
      SubTaskInfoID: 0,
      TaskInfoID: taskId,
      SubTaskTitle: '',
      SubTaskName: '',
    },
    signal
  );

async function deleteSubTaskById(id: number) {
  const res = await apiCall(`${getBase()}/DeleteSubTaskInfo?id=${id}`, { method: 'GET' });
  if (!res.ok) throw new Error('Failed to delete subtask');
}
const LoadingSkeleton = () => (
  <BlockSkeleton lines={3} className="max-w-screen-2xl mx-auto space-y-4" message="Loading tasks..." />
);


function SubTaskRow({ subtask, onEdit, onDelete }: { subtask: RawEntity; onEdit: () => void; onDelete: () => void }) {
  const t = extractEntity(subtask, SUBTASK_KEYS);
  return (
    <Card hover className="flex items-center gap-3 px-3 py-2 cursor-default">
      <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{t.title}</p>
      </div>
      <Badge>{t.statusName}</Badge>
      <span className="hidden md:inline-block text-xs text-muted-foreground w-16 truncate">{t.priorityName}</span>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="small" type="text" onClick={onEdit} icon={<Pencil className="w-3.5 h-3.5" />} />
        <Button size="small" type="text" danger onClick={onDelete} icon={<Trash2 className="w-3.5 h-3.5" />} />
      </div>
    </Card>
  );
}

function TaskGridCard({
  task,
  onView,
  onEdit,
  onDelete,
  onAddSubtask,
  onEditSubtask, // NEW
}: {
  task: RawEntity;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubtask: () => void;
  onEditSubtask: (subtask: RawEntity) => void; // NEW
}) {
  const [expanded, setExpanded] = useState(false);
  const t = extractEntity(task, TASK_KEYS);

  const { data: subtasks = [], isLoading } = useQuery({
    queryKey: ['task-subtasks', t.id],
    queryFn: ({ signal }) => fetchSubTasks(t.id, signal),
    enabled: expanded && Boolean(t.id),
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });

  return (
    <Card hover className="flex flex-col min-h-[280px] cursor-pointer overflow-hidden" onClick={() => setExpanded((v) => !v)}>
      <div className="flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-4">
          <div
            className="p-3 rounded-xl shrink-0"
            style={{ background: hexToRgba(t.statusColor, 0.1), color: t.statusColor }}
          >
            <ListChecks className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground truncate" title={t.title}>
                {t.title}
              </h3>
              {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
            </div>
            {t.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{t.description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge>{t.statusName}</Badge>
          <span className="text-sm text-muted-foreground">{t.priorityName} priority</span>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/30 px-2.5 py-1.5">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Manager</p>
            <p className="text-sm font-medium text-foreground truncate">{t.managerName || '—'}</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Due Date</p>
            <p className="text-sm font-medium text-foreground tabular-nums truncate">{t.dueDate || '—'}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border/60">
        <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); onView(); }} icon={<Eye className="w-3.5 h-3.5" />}>View</Button>
        <Button size="small" onClick={(e) => { e.stopPropagation(); onEdit(); }} icon={<Pencil className="w-3.5 h-3.5" />}>Edit</Button>
        <Button size="small" danger onClick={(e) => { e.stopPropagation(); onDelete(); }} icon={<Trash2 className="w-3.5 h-3.5" />}>Delete</Button>
        <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); onAddSubtask(); }} icon={<Plus className="w-3.5 h-3.5" />} className="!bg-green-600 hover:!bg-green-700 !border-green-600">Subtask</Button>
      </div>

      {expanded && (
        <div className="pt-3 mt-3 border-t border-border/60 space-y-2" onClick={(e) => e.stopPropagation()}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subtasks ({subtasks.length})
          </div>
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-2">Loading...</p>
          ) : subtasks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No subtasks</p>
          ) : (
            <div className="space-y-1.5">
              {subtasks.map((st, i) => (
                  <SubTaskRow
                  key={pick(st, SUBTASK_KEYS.idKeys, i)}
                  subtask={st}
                  onEdit={() => onEditSubtask(st)}
                  onDelete={() => Modal.confirm({
                    title: 'Delete subtask?',
                    okType: 'danger',
                    onOk: async () => {
                      try {
                        await deleteSubTaskById(pick(st, SUBTASK_KEYS.idKeys));
                        message.success('Subtask deleted');
                        queryClient.invalidateQueries({ queryKey: ['task-subtasks', t.id] });
                      } catch {
                        message.error('Failed to delete subtask');
                      }
                    },
                  })}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function TaskListRow({
  task,
  onView,
  onEdit,
  onDelete,
  onAddSubtask,
}: {
  task: RawEntity;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubtask: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const t = extractEntity(task, TASK_KEYS);

  const { data: subtasks = [], isLoading } = useQuery({
    queryKey: ['task-subtasks', t.id],
    queryFn: ({ signal }) => fetchSubTasks(t.id, signal),
    enabled: expanded && Boolean(t.id),
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });

  return (
    <div>
      <Card hover className="flex items-center gap-3 px-4 py-2.5 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <div className="p-2 rounded-xl shrink-0" style={{ background: hexToRgba(t.statusColor, 0.1), color: t.statusColor }}>
          <ListChecks className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-foreground truncate">{t.title}</h3>
          </div>
          {t.managerName && <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><Users className="w-3 h-3" />{t.managerName}</p>}
        </div>
        <Badge>{t.statusName}</Badge>
        <span className="hidden md:inline-block text-sm text-muted-foreground w-20 truncate">{t.priorityName}</span>
        <span className="hidden lg:inline-block text-sm text-muted-foreground tabular-nums w-24 truncate text-right">{t.dueDate || '—'}</span>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="small" type="text" onClick={(e) => { e.stopPropagation(); onView(); }} icon={<Eye className="w-3.5 h-3.5" />} />
          <Button size="small" type="text" onClick={(e) => { e.stopPropagation(); onEdit(); }} icon={<Pencil className="w-3.5 h-3.5" />} />
          <Button size="small" type="text" danger onClick={(e) => { e.stopPropagation(); onDelete(); }} icon={<Trash2 className="w-3.5 h-3.5" />} />
          <Button size="small" type="text" onClick={(e) => { e.stopPropagation(); onAddSubtask(); }} icon={<Plus className="w-3.5 h-3.5" />} />
        </div>
        <div className="shrink-0">{expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}</div>
      </Card>

      {expanded && (
        <div className="ml-4 mt-1.5 mb-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
          {t.description && <p className="text-sm text-muted-foreground px-3">{t.description}</p>}
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3">Subtasks ({subtasks.length})</div>
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-2">Loading...</p>
          ) : subtasks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No subtasks</p>
          ) : (
            subtasks.map((st, i) => (
              <SubTaskRow
                key={pick(st, SUBTASK_KEYS.idKeys, i)}
                subtask={st}
                onEdit={() => message.info('Edit subtask')}
                onDelete={() => Modal.confirm({ title: 'Delete subtask?', okType: 'danger', onOk: async () => { message.success('Deleted'); } })}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ProjectTasksPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Add/Edit task drawer
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RawEntity | null>(null);

  // View task drawer
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // Subtask modal
  const [subtaskDrawerOpen, setSubtaskDrawerOpen] = useState(false);
  const [subtaskParentTask, setSubtaskParentTask] = useState<RawEntity | null>(null);
  const [editingSubTask, setEditingSubTask] = useState<RawEntity | null>(null);

  const { data: project, isLoading, isError, error } = useQuery({
    queryKey: ['project-detail', id],
    queryFn: ({ signal }) => fetchProjectInfo(id!, signal),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: tasks = [], isLoading: tasksLoading, refetch } = useQuery({
    queryKey: ['project-tasks', id],
    queryFn: ({ signal }) => fetchProjectTasks(id!, signal),
    enabled: Boolean(id),
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    return () => {
      queryClient.cancelQueries({ queryKey: ['project-detail', id] });
      queryClient.cancelQueries({ queryKey: ['project-tasks', id] });
    };
  }, [id, queryClient]);

  if (isLoading) return <LoadingSkeleton />;

  if (isError || !project || !project.ProjectInfoID) {
    return (
      <div className="fade-in space-y-3 max-w-screen-2xl mx-auto w-full pb-8">
        <button onClick={() => navigate('/projects')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </button>
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : 'Project not found.'}</p>
        </Card>
      </div>
    );
  }

  const priorityName = project.PriorityName || priorityLabelMap[project.Priority ?? 3] || 'Medium';
  const projectTypeName = project.ProjectTypeName || projectTypeMap[project.ProjectType ?? 0] || 'General';
  const workStatusColor = project.WorkStatusColor || '#6B7280';

  const handleDeleteTask = (taskId: number) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await apiCall(`${getBase()}/DeleteTaskInfo?id=${taskId}`, { method: 'GET' });
          if (!res.ok) throw new Error('Failed');
          message.success('Task deleted');
          refetch();
        } catch (err) {
          message.error('Delete failed');
        }
      },
    });
  };

    const openEditTask = (task: RawEntity) => {
    setEditingTask(task);
    setTaskDrawerOpen(true);
  };

  const openAddTask = () => {
    setEditingTask(null);
    setTaskDrawerOpen(true);
  };

    const openAddSubtask = (task: RawEntity) => {
    setSubtaskParentTask(task);
    setEditingSubTask(null);
    setSubtaskDrawerOpen(true);
  };

  const openEditSubtask = (task: RawEntity, subtask: RawEntity) => {
    setSubtaskParentTask(task);
    setEditingSubTask(subtask);
    setSubtaskDrawerOpen(true);
  };

  return (
    <div className="fade-in space-y-4 max-w-screen-2xl mx-auto w-full pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => navigate('/projects')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </button>
        <div className="flex items-center gap-2.5">
          <Button type="primary" onClick={openAddTask} icon={<Plus className="w-4 h-4" />}>
            Add Task
          </Button>
          <Button onClick={() => navigate(`/projects/${id}/kanban`)} icon={<Kanban className="w-4 h-4" />}>
            Kanban
          </Button>
          <div className="flex items-center bg-white/70 border border-border rounded-2xl p-0.5 shadow-xs">
            <Button type="text" onClick={() => setViewMode('grid')} icon={<LayoutGrid className="w-4 h-4" />} />
            <Button type="text" onClick={() => setViewMode('list')} icon={<List className="w-4 h-4" />} />
          </div>
        </div>
      </div>

      <Card padding="p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-l-4 pl-4" style={{ borderColor: workStatusColor }}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba(workStatusColor, 0.1), color: workStatusColor }}>
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{project.ProjectName}</h1>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{project.ProjectCode}</p>
              {project.Description && <p className="text-sm text-muted-foreground/80 mt-1.5 line-clamp-2 max-w-3xl">{project.Description}</p>}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge>{project.WorkStatusName}</Badge>
                <span className="text-sm text-muted-foreground">{priorityName} priority</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border border-border bg-white/60 text-muted-foreground">{projectTypeName}</span>
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right lg:min-w-[180px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Budget</p>
            <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{formatCurrency(project.TotalBudget)}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">Tasks</h2>
          <span className="text-base text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
            {tasks.length} total
          </span>
        </div>

        {tasksLoading ? (
          <div className="text-muted-foreground text-center py-8">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No tasks found</p>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {tasks.map((task, i) => (
              <TaskGridCard
                key={pick(task, TASK_KEYS.idKeys, i)}
                task={task}
                onView={() => { setSelectedTaskId(pick(task, TASK_KEYS.idKeys)); setViewDrawerOpen(true); }}
                onEdit={() => openEditTask(task)}
                onDelete={() => handleDeleteTask(pick(task, TASK_KEYS.idKeys))}
                onAddSubtask={() => openAddSubtask(task)}
                onEditSubtask={(st) => openEditSubtask(task, st)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task, i) => (
              <TaskListRow
                key={pick(task, TASK_KEYS.idKeys, i)}
                task={task}
                onView={() => { setSelectedTaskId(pick(task, TASK_KEYS.idKeys)); setViewDrawerOpen(true); }}
                onEdit={() => openEditTask(task)}
                onDelete={() => handleDeleteTask(pick(task, TASK_KEYS.idKeys))}
                onAddSubtask={() => { setSubtaskParentId(pick(task, TASK_KEYS.idKeys)); setSubtaskModalOpen(true); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Task Drawer — project is pre-filled since we're already inside this project */}
      <CreateTaskDrawer
        open={taskDrawerOpen}
        onClose={() => { setTaskDrawerOpen(false); setEditingTask(null); }}
        onSuccess={() => { refetch(); setEditingTask(null); }}
        editingTask={editingTask as any}
        project={project}
      />

      {/* View Task Drawer */}
      <ViewTaskDrawer
        open={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        taskId={selectedTaskId}
      />

      {/* Add/Edit Subtask Drawer */}
      {subtaskParentTask && (
        <SubTaskCreate
          open={subtaskDrawerOpen}
          onClose={() => { setSubtaskDrawerOpen(false); setEditingSubTask(null); }}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ['task-subtasks', pick(subtaskParentTask, TASK_KEYS.idKeys)] });
            setEditingSubTask(null);
          }}
          project={{ ProjectInfoID: project.ProjectInfoID, ProjectName: project.ProjectName }}
          selectedTask={subtaskParentTask as any}
          editingSubTask={editingSubTask as any}
        />
      )}
    </div>
  );
}