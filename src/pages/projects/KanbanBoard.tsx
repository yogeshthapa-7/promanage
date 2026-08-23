'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Modal, message, Spin } from 'antd';
import {
  ArrowLeft,
  Trash2,
  Eye,
  Plus,
  Calendar,
  Tag,
  ClipboardList,
  RefreshCw,
  Clock,
  CheckCircle2,
  Flag,
} from 'lucide-react';
import { apiCall } from '@/lib/api';
import CreateTaskDrawer from '../tasks/createtasks';
import ViewTaskDrawer from '../tasks/viewtaskdrawer';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

interface WorkStatus {
  WorkStatusInfoID: number;
  StatusName: string;
  StatusCode: string;
  Color?: string;
  IconName?: string;
}

interface Task {
  TaskInfoID: number;
  TaskName: string;
  Description: string;
  WorkStatusID: number;
  Priority: string | number;
  DueDate: string;
  ProjectInfoID: number;
  ProjectName?: string;
  AssignedTo?: string;
  Progress?: number;
}

interface Project {
  ProjectInfoID: number;
  ProjectName: string;
  Description?: string;
}

interface TasksByStatus {
  [key: number]: Task[];
}

const priorityLabelMap: Record<number, string> = {
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
};

// Column color palette — cycles by index; falls back to this if status.Color isn't provided
const COLUMN_PALETTE = [
  { dot: '#EF4444', border: '#EF4444' }, // red
  { dot: '#3B82F6', border: '#3B82F6' }, // blue
  { dot: '#F59E0B', border: '#F59E0B' }, // amber
  { dot: '#10B981', border: '#10B981' }, // green
  { dot: '#8B5CF6', border: '#8B5CF6' }, // violet
  { dot: '#EC4899', border: '#EC4899' }, // pink
];

const STAT_ICONS = [ClipboardList, RefreshCw, Clock, CheckCircle2, Flag];
const STAT_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-600' },
  { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  { bg: 'bg-amber-100', text: 'text-amber-600' },
  { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { bg: 'bg-violet-100', text: 'text-violet-600' },
];

function getPriorityLabel(priority: string | number | undefined) {
  if (typeof priority === 'number') return priorityLabelMap[priority] || 'Medium';
  return priority || 'Medium';
}

function getPriorityStyle(priority: string | number | undefined) {
  const label = getPriorityLabel(priority).toLowerCase();
  if (label.includes('urgent') || label.includes('high')) return 'bg-red-100 text-red-600';
  if (label.includes('medium')) return 'bg-amber-100 text-amber-600';
  return 'bg-emerald-100 text-emerald-600';
}

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function KanbanBoard() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [workStatuses, setWorkStatuses] = useState<WorkStatus[]>([]);
  const [tasks, setTasks] = useState<TasksByStatus>({});
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<{ taskId: number; fromStatusId: number } | null>(null);

  // Add task drawer
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [addDrawerStatusId, setAddDrawerStatusId] = useState<number | null>(null);

  // View task drawer
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const sanitizedId = encodeURIComponent(projectId || '');
      const res = await apiCall(`${API_BASE}/GetProjectDetailData?id=${sanitizedId}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      const data = await res.json();
      const projectInfo = data?.Data?.ProjectInfo || data?.data?.ProjectInfo || data?.ProjectInfo;
      if (projectInfo) {
        setProject({
          ProjectInfoID: projectInfo.ProjectInfoID,
          ProjectName: projectInfo.ProjectName,
          Description: projectInfo.Description,
        });
      }
    } catch (err) {
      console.error('Failed to fetch project:', err);
      message.error('Failed to load project details');
    }
  }, [projectId]);

  const fetchWorkStatuses = useCallback(async () => {
    try {
      const res = await apiCall(`${API_BASE}/WorkStatus/SelectList`);
      if (!res.ok) throw new Error('Failed to fetch work statuses');
      const data = await res.json();
      const statuses = Array.isArray(data) ? data : [];
      setWorkStatuses(statuses);
      return statuses;
    } catch (err) {
      console.error('Failed to fetch work statuses:', err);
      message.error('Failed to load work statuses');
      return [];
    }
  }, []);

  const fetchTasks = useCallback(async (statuses: WorkStatus[]) => {
    try {
      const res = await apiCall(`${API_BASE}/TaskInfo/ServerSearch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: {
            draw: 1,
            start: 0,
            length: 1000,
            columns: [
              { data: 'TaskInfoID', name: 'TaskInfoID', searchable: true, orderable: true, search: { value: '', regex: '' } },
              { data: 'TaskName', name: 'TaskName', searchable: true, orderable: true, search: { value: '', regex: '' } },
            ],
            search: { value: '', regex: '' },
            order: [{ column: 0, dir: 'asc' }],
          },
          param: { ProjectInfoID: Number(projectId) },
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch tasks');

      const data = await res.json();
      const allTasks = Array.isArray(data?.data) ? data.data : [];

      const grouped: TasksByStatus = {};
      statuses.forEach(status => {
        grouped[status.WorkStatusInfoID] = [];
      });

      allTasks.forEach((task: any) => {
        const mappedTask: Task = {
          TaskInfoID: task.TaskInfoID,
          TaskName: task.TaskName || task.TaskTitle,
          Description: task.Description || '',
          WorkStatusID: task.WorkStatusID,
          Priority: task.Priority || task.PriorityName || 'Medium',
          DueDate: task.DueDate || '',
          ProjectInfoID: task.ProjectInfoID,
          ProjectName: task.ProjectName,
          AssignedTo: task.AssignedTo || task.TaskManagerName,
          Progress: task.Progress || 0,
        };

        if (grouped[task.WorkStatusID]) {
          grouped[task.WorkStatusID].push(mappedTask);
        }
      });

      setTasks(grouped);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      message.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const refreshBoard = useCallback(async () => {
    const statuses = await fetchWorkStatuses();
    if (statuses.length > 0) {
      await fetchTasks(statuses);
    }
  }, [fetchWorkStatuses, fetchTasks]);

  useEffect(() => {
    setLoading(true);
    const loadData = async () => {
      try {
        await fetchProject();
        const statuses = await fetchWorkStatuses();
        if (statuses.length > 0) {
          await fetchTasks(statuses);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Load error:', err);
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleDragStart = (taskId: number, statusId: number) => {
    setDraggedTask({ taskId, fromStatusId: statusId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.style.backgroundColor = '';
  };

  const handleDrop = async (e: React.DragEvent, targetStatusId: number) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = '';

    if (!draggedTask) return;

    const { taskId, fromStatusId } = draggedTask;

    if (fromStatusId === targetStatusId) {
      setDraggedTask(null);
      return;
    }

    try {
      const res = await apiCall(`${API_BASE}/TaskInfo/ChangeWorkStatus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          TaskInfoID: taskId,
          WorkStatusID: targetStatusId,
        }),
      });

      if (!res.ok) throw new Error('Failed to update task status');

      message.success('Task status updated');

      setTasks(prev => {
        const updated = { ...prev };
        const taskToMove = updated[fromStatusId]?.find(t => t.TaskInfoID === taskId);

        if (taskToMove) {
          updated[fromStatusId] = updated[fromStatusId].filter(t => t.TaskInfoID !== taskId);
          if (!updated[targetStatusId]) updated[targetStatusId] = [];
          updated[targetStatusId] = [...updated[targetStatusId], { ...taskToMove, WorkStatusID: targetStatusId }];
        }

        return updated;
      });

      setDraggedTask(null);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to update status');
      setDraggedTask(null);
    }
  };

  const handleDeleteTask = (taskId: number) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await apiCall(`${API_BASE}/DeleteTaskInfo?id=${taskId}`, {
            method: 'GET',
          });
          if (!res.ok) throw new Error('Failed to delete task');
          message.success('Task deleted');
          await refreshBoard();
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Delete failed');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Spin size="large" tip="Loading kanban board..." />
      </div>
    );
  }

  const totalTasks = Object.values(tasks).flat().length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {project?.ProjectName || 'Kanban Board'}
        </h1>
        {project?.Description && (
          <p className="text-sm text-gray-500 mt-0.5">{project.Description}</p>
        )}
      </div>

      {/* Columns */}
      <div className="max-w-full overflow-x-auto px-6 py-6">
        <div className="flex gap-4" style={{ width: `max(100%, ${workStatuses.length * 300}px)` }}>
          {workStatuses.map((status, colIdx) => {
            const palette = COLUMN_PALETTE[colIdx % COLUMN_PALETTE.length];
            const dotColor = status.Color || palette.dot;
            const columnTasks = tasks[status.WorkStatusInfoID] || [];

            return (
              <div
                key={status.WorkStatusInfoID}
                className="flex-shrink-0 w-72 bg-white rounded-xl border border-gray-200 flex flex-col shadow-sm"
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                    <h2 className="font-semibold text-sm text-gray-900">{status.StatusName}</h2>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">{columnTasks.length}</span>
                </div>

                {/* Cards */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, status.WorkStatusInfoID)}
                  className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-[420px] transition-colors duration-200"
                >
                  {columnTasks.map((task) => (
                    <div
                      key={task.TaskInfoID}
                      draggable
                      onDragStart={() => handleDragStart(task.TaskInfoID, status.WorkStatusInfoID)}
                      className="group relative bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md p-3.5 cursor-grab active:cursor-grabbing transition-all"
                      style={{ borderLeft: `3px solid ${dotColor}` }}
                    >
                      {/* Hover action icons */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTaskId(task.TaskInfoID);
                            setViewDrawerOpen(true);
                          }}
                          className="p-1 rounded hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="View task"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.TaskInfoID);
                          }}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="font-semibold text-sm text-gray-900 pr-10 mb-1 line-clamp-1">
                        {task.TaskName}
                      </h3>

                      {task.Description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2.5 leading-relaxed">
                          {task.Description}
                        </p>
                      )}

                      {(task.ProjectName || project?.ProjectName) && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[11px] font-medium mb-2.5">
                          <Tag className="w-2.5 h-2.5" />
                          {task.ProjectName || project?.ProjectName}
                        </div>
                      )}

                      {task.AssignedTo && (
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {getInitials(task.AssignedTo)}
                          </div>
                          <span className="text-xs text-gray-500 truncate">{task.AssignedTo}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        {task.DueDate ? (
                          <div className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.DueDate).toLocaleDateString()}
                          </div>
                        ) : <span />}
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getPriorityStyle(task.Priority)}`}>
                          {getPriorityLabel(task.Priority)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-300">
                      <p className="text-xs">No tasks yet</p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setAddDrawerStatusId(status.WorkStatusInfoID);
                      setAddDrawerOpen(true);
                    }}
                    className="w-full px-2 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Task
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom stats strip */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-full overflow-x-auto">
          <div className="flex items-center gap-8 min-w-max">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 leading-tight">{totalTasks}</p>
                <p className="text-xs text-gray-500">Total Tasks</p>
              </div>
            </div>

            {workStatuses.map((status, idx) => {
              const Icon = STAT_ICONS[idx % STAT_ICONS.length];
              const color = STAT_COLORS[idx % STAT_COLORS.length];
              return (
                <div key={status.WorkStatusInfoID} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${color.bg} ${color.text} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 leading-tight">
                      {tasks[status.WorkStatusInfoID]?.length || 0}
                    </p>
                    <p className="text-xs text-gray-500">{status.StatusName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Task Drawer — project & status are pre-filled since we're already inside this project's column */}
      <CreateTaskDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={refreshBoard}
        editingTask={null}
        project={project as any}
        defaultStatusId={addDrawerStatusId}
      />

      {/* View Task Drawer */}
      <ViewTaskDrawer
        open={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        taskId={selectedTaskId}
      />
    </div>
  );
}