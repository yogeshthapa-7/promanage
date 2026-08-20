'use client';

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Users,
  CalendarClock,
  CornerDownRight,
  LayoutGrid,
  List,
  Kanban,
  ListChecks,
} from 'lucide-react';

import { BlockSkeleton } from '@/components/ui/Loaders';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { apiCall } from '@/lib/api';
import type { ApiProject } from '@/lib/projects-data';

/*
 * Route:
 * /projects/:id/tasks
 *
 * Features:
 * - Shows project information
 * - Shows project tasks
 * - List view
 * - Grid view
 * - Expand task to see subtasks
 * - Kanban button
 */

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

const priorityStyles: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Urgent: {
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  High: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  Medium: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  Low: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
};

function hexToRgba(
  hex: string | null | undefined,
  alpha: number
): string {
  if (!hex || typeof hex !== 'string') {
    return `rgba(107, 114, 128, ${alpha})`;
  }

  let clean = hex.replace('#', '');

  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }

  if (clean.length !== 6) {
    return `rgba(107, 114, 128, ${alpha})`;
  }

  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  return isNaN(r) || isNaN(g) || isNaN(b)
    ? `rgba(107, 114, 128, ${alpha})`
    : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const formatCurrency = (amount?: number) =>
  `Rs. ${(amount ?? 0).toLocaleString('en-NP', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function pick<T = any>(
  obj: Record<string, any> | null | undefined,
  keys: string[],
  fallback?: T
): T {
  if (!obj) return fallback as T;

  for (const key of keys) {
    if (
      obj[key] !== undefined &&
      obj[key] !== null &&
      obj[key] !== ''
    ) {
      return obj[key];
    }
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

function extractEntity(
  obj: RawEntity,
  keys: EntityKeyMap
): NormalizedEntity {
  const priorityRaw = pick<string>(
    obj,
    ['PriorityName'],
    ''
  );

  const priorityNum = pick<number>(
    obj,
    ['Priority'],
    3
  );

  return {
    id: pick<number>(obj, keys.idKeys),
    title: pick<string>(
      obj,
      keys.titleKeys,
      'Untitled'
    ),
    statusName: pick<string>(
      obj,
      ['WorkStatusName'],
      'Not Started'
    ),
    statusColor: pick<string>(
      obj,
      ['WorkStatusColor'],
      '#6B7280'
    ),
    priorityName:
      priorityRaw ||
      priorityLabelMap[priorityNum] ||
      'Medium',
    dueDate: pick<string>(
      obj,
      ['DueDate'],
      ''
    ),
    description: pick<string>(
      obj,
      ['Description'],
      ''
    ),
    managerName: pick<string>(
      obj,
      keys.managerKeys,
      ''
    ),
    managerPhoto: pick<string>(
      obj,
      keys.photoKeys,
      ''
    ),
  };
}

const TASK_KEYS: EntityKeyMap = {
  idKeys: ['TaskInfoID', 'Id', 'id'],
  titleKeys: ['TaskTitle', 'Title', 'Name'],
  managerKeys: ['TaskManagerName'],
  photoKeys: ['TaskManagerPhoto'],
};

const SUBTASK_KEYS: EntityKeyMap = {
  idKeys: ['SubTaskInfoID', 'Id', 'id'],
  titleKeys: [
    'SubTaskTitle',
    'TaskTitle',
    'Title',
    'Name',
  ],
  managerKeys: [
    'SubTaskManagerName',
    'TaskManagerName',
  ],
  photoKeys: [
    'SubTaskManagerPhoto',
    'TaskManagerPhoto',
  ],
};

const getBase = () =>
  (import.meta.env.VITE_BASE_API_URL || '').replace(
    /\/$/,
    ''
  );

async function postServerSearch<T>(
  endpoint: string,
  param: Record<string, any>,
  signal?: AbortSignal
): Promise<T[]> {
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
      order: [
        {
          column: 1,
          dir: 'desc',
        },
      ],
      search: {
        value: '',
        regex: '',
      },
    },
    param,
  };

  const res = await apiCall(
    `${getBase()}${endpoint}`,
    {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    10000
  );

  if (!res.ok) {
    throw new Error(
      `Request to ${endpoint} failed: ${res.statusText}`
    );
  }

  const json = await res.json();

  return json?.data || [];
}

/* -----------------------------
   Project
----------------------------- */

const fetchProjectInfo = async (
  projectId: string,
  signal?: AbortSignal
): Promise<ApiProject> => {
  const sanitizedId =
    encodeURIComponent(projectId);

  const res = await apiCall(
    `${getBase()}/GetProjectDetailData?id=${sanitizedId}`,
    {
      method: 'GET',
      signal,
    },
    10000
  );

  if (!res.ok) {
    throw new Error(
      `HTTP error ${res.status}: ${res.statusText}`
    );
  }

  const json = await res.json();

  const data =
    json?.Data ?? json?.data;

  const project =
    data?.ProjectInfo ??
    data?.projectInfo;

  if (
    !project ||
    !project.ProjectInfoID
  ) {
    throw new Error(
      'Project details not found'
    );
  }

  return project;
};

/* -----------------------------
   Tasks
----------------------------- */

const fetchProjectTasks = (
  projectId: string,
  signal?: AbortSignal
) =>
  postServerSearch<RawEntity>(
    '/TaskInfo/ServerSearch',
    {
      TaskInfoID: 0,
      ProjectInfoID: Number(projectId),
      TaskTitle: '',
      TaskManagerName: '',
      ProjectInfoName: '',
    },
    signal
  );

/* -----------------------------
   Subtasks
----------------------------- */

const fetchSubTasks = (
  taskId: number,
  signal?: AbortSignal
) =>
  postServerSearch<RawEntity>(
    '/SubTaskInfo/ServerSearch',
    {
      SubTaskInfoID: 0,
      TaskInfoID: taskId,
      SubTaskTitle: '',
      SubTaskManagerName: '',
      TaskInfoName: '',
    },
    signal
  );

/* -----------------------------
   Loading
----------------------------- */

const LoadingSkeleton = () => (
  <BlockSkeleton
    lines={3}
    className="max-w-screen-2xl mx-auto space-y-4"
    message="Loading tasks..."
  />
);

/* -----------------------------
   Badges
----------------------------- */

function PriorityBadge({
  name,
  size = 'md',
}: {
  name: string;
  size?: 'sm' | 'md';
}) {
  const style =
    priorityStyles[name] ||
    priorityStyles.Medium;

  const sizeCls =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[11px]'
      : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${sizeCls} ${style.bg} ${style.text} ${style.border}`}
    >
      {name}
    </span>
  );
}

function StatusBadge({
  name,
  color,
  size = 'md',
}: {
  name: string;
  color: string;
  size?: 'sm' | 'md';
}) {
  const sizeCls =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[11px]'
      : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold border ${sizeCls}`}
      style={{
        backgroundColor: hexToRgba(
          color,
          0.1
        ),
        color,
        borderColor: hexToRgba(
          color,
          0.25
        ),
      }}
    >
      <span
        className="w-1 h-1 rounded-full"
        style={{
          backgroundColor: color,
        }}
      />

      {name}
    </span>
  );
}

/* -----------------------------
   Subtask Card
----------------------------- */

function SubTaskCard({
  subtask,
}: {
  subtask: RawEntity;
}) {
  const t = extractEntity(
    subtask,
    SUBTASK_KEYS
  );

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground truncate">
          {t.title}
        </h4>

        <PriorityBadge
          name={t.priorityName}
          size="sm"
        />
      </div>

      {t.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {t.description}
        </p>
      )}

      <StatusBadge
        name={t.statusName}
        color={t.statusColor}
        size="sm"
      />

      {(t.dueDate ||
        t.managerName) && (
        <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {t.dueDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="w-3 h-3" />
              Due {t.dueDate}
            </span>
          )}

          {t.managerName && (
            <span className="inline-flex items-center gap-1">
              {t.managerPhoto ? (
                <img
                  src={t.managerPhoto}
                  alt={t.managerName}
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <Users className="w-3 h-3" />
              )}

              {t.managerName}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

/* -----------------------------
   Subtask Row
----------------------------- */

function SubTaskRow({
  subtask,
}: {
  subtask: RawEntity;
}) {
  const t = extractEntity(
    subtask,
    SUBTASK_KEYS
  );

  return (
    <div className="flex items-start gap-3 p-3 pl-4 border-t border-border/50 first:border-t-0">
      <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">
            {t.title}
          </p>

          <div className="flex items-center gap-1.5 shrink-0">
            <PriorityBadge
              name={t.priorityName}
              size="sm"
            />

            <StatusBadge
              name={t.statusName}
              color={t.statusColor}
              size="sm"
            />
          </div>
        </div>

        {t.description && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.description}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {t.dueDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="w-3 h-3" />
              Due {t.dueDate}
            </span>
          )}

          {t.managerName && (
            <span className="inline-flex items-center gap-1">
              {t.managerPhoto ? (
                <img
                  src={t.managerPhoto}
                  alt={t.managerName}
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <Users className="w-3 h-3" />
              )}

              {t.managerName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   Subtask Panel
----------------------------- */

function SubtaskPanel({
  taskId,
  expanded,
  variant,
}: {
  taskId: number;
  expanded: boolean;
  variant: 'card' | 'row';
}) {
  const {
    data: subtasks = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      'task-subtasks',
      taskId,
    ],

    queryFn: ({ signal }) =>
      fetchSubTasks(
        taskId,
        signal
      ),

    enabled:
      expanded &&
      Boolean(taskId),

    staleTime:
      3 * 60 * 1000,

    retry: 1,
  });

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Subtasks{' '}
        {subtasks.length > 0
          ? `(${subtasks.length})`
          : ''}
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground text-center py-3">
          Loading subtasks...
        </div>
      ) : isError ? (
        <div className="text-xs text-rose-600 text-center py-3">
          Failed to load subtasks
        </div>
      ) : subtasks.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-3">
          No subtasks
        </div>
      ) : variant === 'card' ? (
        <div className="space-y-2">
          {subtasks.map(
            (st, i) => (
              <SubTaskCard
                key={pick(
                  st,
                  SUBTASK_KEYS.idKeys,
                  i
                )}
                subtask={st}
              />
            )
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border/60 overflow-hidden bg-white">
          {subtasks.map(
            (st, i) => (
              <SubTaskRow
                key={pick(
                  st,
                  SUBTASK_KEYS.idKeys,
                  i
                )}
                subtask={st}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

/* -----------------------------
   Grid Task
----------------------------- */

function TaskGridCard({
  task,
}: {
  task: RawEntity;
}) {
  const [expanded, setExpanded] =
    useState(false);

  const t = extractEntity(
    task,
    TASK_KEYS
  );

  return (
    <Card
      hover
      className="flex flex-col min-h-[260px] cursor-pointer overflow-hidden"
      onClick={() =>
        setExpanded((v) => !v)
      }
    >
      <div className="flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className="p-3 rounded-xl shrink-0"
              style={{
                background: hexToRgba(
                  t.statusColor,
                  0.1
                ),
                color: t.statusColor,
              }}
            >
              <ListChecks className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <h3
                className="text-sm font-bold text-foreground truncate"
                title={t.title}
              >
                {t.title}
              </h3>

              {t.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {t.description}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 mt-1">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge
            name={t.statusName}
            color={t.statusColor}
          />

          <PriorityBadge
            name={t.priorityName}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/30 px-2.5 py-1.5 mt-auto">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Manager
            </p>

            <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5 mt-0.5">
              {t.managerPhoto ? (
                <img
                  src={t.managerPhoto}
                  alt={t.managerName}
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}

              <span className="truncate">
                {t.managerName || '—'}
              </span>
            </p>
          </div>

          <div className="min-w-0 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Due Date
            </p>

            <p className="text-sm font-medium text-foreground tabular-nums truncate mt-0.5">
              {t.dueDate || '—'}
            </p>
          </div>
        </div>
      </div>

      {expanded && (
        <div
          className="pt-3 mt-3 border-t border-border/60"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <SubtaskPanel
            taskId={t.id}
            expanded={expanded}
            variant="card"
          />
        </div>
      )}
    </Card>
  );
}

/* -----------------------------
   List Task
----------------------------- */

function TaskListRow({
  task,
}: {
  task: RawEntity;
}) {
  const [expanded, setExpanded] =
    useState(false);

  const t = extractEntity(
    task,
    TASK_KEYS
  );

  return (
    <div>
      <Card
        hover
        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
        onClick={() =>
          setExpanded((v) => !v)
        }
      >
        <div
          className="p-2 rounded-xl shrink-0"
          style={{
            background: hexToRgba(
              t.statusColor,
              0.1
            ),
            color: t.statusColor,
          }}
        >
          <ListChecks className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground truncate">
            {t.title}
          </h3>

          {t.managerName && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
              {t.managerPhoto ? (
                <img
                  src={t.managerPhoto}
                  alt={t.managerName}
                  className="w-3.5 h-3.5 rounded-full object-cover"
                />
              ) : (
                <Users className="w-3 h-3" />
              )}

              {t.managerName}
            </p>
          )}
        </div>

        <StatusBadge
          name={t.statusName}
          color={t.statusColor}
        />

        <span className="hidden md:inline-block text-sm text-muted-foreground w-20 truncate">
          {t.priorityName}
        </span>

        <span className="hidden lg:inline-flex items-center gap-1.5 text-sm text-muted-foreground w-32 shrink-0">
          <CalendarClock className="w-3.5 h-3.5" />
          {t.dueDate || '—'}
        </span>

        <div className="shrink-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </Card>

      {expanded && (
        <div
          className="ml-4 mt-1.5 mb-2 p-3 rounded-lg bg-muted/20 border border-border/60"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          {t.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {t.description}
            </p>
          )}

          <SubtaskPanel
            taskId={t.id}
            expanded={expanded}
            variant="row"
          />
        </div>
      )}
    </div>
  );
}

/* =============================
   MAIN PAGE
============================= */

export default function TaskAndSubtasks() {
  const { id } =
    useParams<{ id: string }>();

  const navigate =
    useNavigate();

  const queryClient =
    useQueryClient();

  const [viewMode, setViewMode] =
    useState<'list' | 'grid'>(
      'grid'
    );

  useEffect(() => {
    return () => {
      queryClient.cancelQueries({
        queryKey: [
          'project-detail',
          id,
        ],
      });

      queryClient.cancelQueries({
        queryKey: [
          'project-tasks',
          id,
        ],
      });
    };
  }, [id, queryClient]);

  /* Project */
  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'project-detail',
      id,
    ],

    queryFn: ({ signal }) =>
      fetchProjectInfo(
        id!,
        signal
      ),

    enabled: Boolean(id),

    staleTime:
      5 * 60 * 1000,

    retry: 1,
  });

  /* Tasks */
  const {
    data: tasks = [],
    isLoading: tasksLoading,
  } = useQuery({
    queryKey: [
      'project-tasks',
      id,
    ],

    queryFn: ({ signal }) =>
      fetchProjectTasks(
        id!,
        signal
      ),

    enabled: Boolean(id),

    staleTime:
      3 * 60 * 1000,

    retry: 1,
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (
    isError ||
    !project ||
    !project.ProjectInfoID
  ) {
    return (
      <div className="fade-in space-y-3 max-w-screen-2xl mx-auto w-full pb-8">
        <button
          onClick={() =>
            navigate('/projects')
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </button>

        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : 'Project not found.'}
          </p>
        </Card>
      </div>
    );
  }

  const priorityName =
    project.PriorityName ||
    priorityLabelMap[
      project.Priority ?? 3
    ] ||
    'Medium';

  const projectTypeName =
    project.ProjectTypeName ||
    projectTypeMap[
      project.ProjectType ?? 0
    ] ||
    'General';

  const workStatusColor =
    project.WorkStatusColor ||
    '#6B7280';

  return (
    <div className="fade-in space-y-3 max-w-screen-2xl mx-auto w-full pb-8">

      {/* Top Bar */}

      <div className="flex items-center justify-between flex-wrap gap-3">

        <button
          onClick={() =>
            navigate('/projects')
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </button>

        <div className="flex items-center gap-2.5">

          {/* Kanban */}

          <Button
            type="default"
            onClick={() =>
              navigate(
                `/projects/${id}/kanban`
              )
            }
            icon={
              <Kanban className="w-4 h-4" />
            }
          >
            Kanban Board
          </Button>

          {/* List / Grid */}

          <div className="flex items-center bg-white/70 border border-border rounded-2xl p-0.5 shadow-xs">

            <Button
              type={
                viewMode === 'list'
                  ? 'primary'
                  : 'text'
              }
              onClick={() =>
                setViewMode('list')
              }
              icon={
                <List className="w-4 h-4" />
              }
              title="List view"
            />

            <Button
              type={
                viewMode === 'grid'
                  ? 'primary'
                  : 'text'
              }
              onClick={() =>
                setViewMode('grid')
              }
              icon={
                <LayoutGrid className="w-4 h-4" />
              }
              title="Grid view"
            />

          </div>
        </div>
      </div>

      {/* Project Header */}

      <Card padding="p-5">
        <div
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-l-4 pl-4"
          style={{
            borderColor:
              workStatusColor,
          }}
        >

          <div className="flex items-start gap-3">

            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: hexToRgba(
                  workStatusColor,
                  0.1
                ),
                color:
                  workStatusColor,
              }}
            >
              <FolderOpen className="w-6 h-6" />
            </div>

            <div className="min-w-0">

              <h1 className="text-xl font-bold text-foreground truncate">
                {project.ProjectName}
              </h1>

              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {project.ProjectCode}
              </p>

              {project.Description && (
                <p className="text-sm text-muted-foreground/80 mt-1.5 line-clamp-2 max-w-3xl">
                  {project.Description}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3 flex-wrap">

                <StatusBadge
                  name={
                    project.WorkStatusName
                  }
                  color={
                    workStatusColor
                  }
                />

                <PriorityBadge
                  name={priorityName}
                />

                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border border-border bg-white/60 text-muted-foreground">
                  {projectTypeName}
                </span>

              </div>
            </div>
          </div>

          <div className="shrink-0 text-right lg:min-w-[180px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Total Budget
            </p>

            <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
              {formatCurrency(
                project.TotalBudget
              )}
            </p>
          </div>

        </div>
      </Card>

      {/* Tasks */}

      <Card padding="p-5">

        <div className="pb-3 border-b border-border mb-4">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Tasks ({tasks.length})
          </h2>
        </div>

        {tasksLoading ? (
          <div className="text-muted-foreground text-center py-8">
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">
            No tasks found
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">

            {tasks.map(
              (task, i) => (
                <TaskGridCard
                  key={pick(
                    task,
                    TASK_KEYS.idKeys,
                    i
                  )}
                  task={task}
                />
              )
            )}

          </div>
        ) : (
          <div className="space-y-2">

            {tasks.map(
              (task, i) => (
                <TaskListRow
                  key={pick(
                    task,
                    TASK_KEYS.idKeys,
                    i
                  )}
                  task={task}
                />
              )
            )}

          </div>
        )}

      </Card>
    </div>
  );
}    