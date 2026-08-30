'use client';

import { useState, useEffect, useCallback } from 'react';
import Drawer from '@/components/drawer';
import { apiCall } from '@/lib/api';
import type { TaskItem } from '@/lib/tasks-data';
import Badge from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
const TASKS_API = `${API_BASE}/TaskInfo/ServerSearch`;

interface ViewTaskDrawerProps {
  open: boolean;
  onClose: () => void;
  taskId: number | null;
}

function buildTaskSearchBody(taskInfoId: number) {
  return {
    model: {
      draw: 1,
      start: 0,
      length: 1,
      search: { value: '', regex: '' },
    },
    param: {
      TaskInfoID: taskInfoId,
      ProjectInfoID: 0,
    },
  };
}

async function fetchTaskById(taskId: number): Promise<TaskItem | null> {
  const res = await apiCall(TASKS_API, {
    method: 'POST',
    body: JSON.stringify(buildTaskSearchBody(taskId)),
  });

  if (!res.ok) throw new Error(`Failed to fetch task: ${res.statusText}`);
  const json = await res.json();
  const rows = Array.isArray(json?.data) ? (json.data as TaskItem[]) : [];
  return rows[0] ?? null;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
      <div className="text-sm font-medium text-slate-700">{children}</div>
    </div>
  );
}

export default function ViewTaskDrawer({ open, onClose, taskId }: ViewTaskDrawerProps) {
  const [task, setTask] = useState<TaskItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    setTask(null);
    try {
      const data = await fetchTaskById(taskId);
      setTask(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (open && taskId) {
      loadTask();
    }
  }, [open, taskId, loadTask]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={task?.ProjectInfoName || 'Task Details'}
      subtitle={task ? `Task #${task.TaskInfoID}` : 'Loading task information...'}
      width={520}
    >
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-slate-400">Loading task details...</div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {task && !loading && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Task Title</p>
            <p className="text-base font-semibold text-slate-900">{task.TaskTitle || '—'}</p>
          </div>

          <Row label="Work Status">
            <Badge
              className={task.WorkStatusColor ? '' : '!bg-gray-100 !text-gray-700'}
              style={task.WorkStatusColor ? { background: task.WorkStatusColor, borderColor: task.WorkStatusColor, color: '#fff' } : undefined}
            >
              {task.WorkStatusName || '—'}
            </Badge>
          </Row>

          <Row label="Priority">
            <span className="text-sm font-medium text-slate-700">{task.PriorityName || '—'}</span>
          </Row>

          <Row label="Task Manager">
            <div className="flex items-center gap-3">
              <Avatar src={task.TaskManagerPhoto || ''} alt={task.TaskManagerName || 'Manager'} size={36} />
              <span className="text-sm font-medium text-slate-700">{task.TaskManagerName || '—'}</span>
            </div>
          </Row>

          {task.InvolvedEmployees && (
            <Row label="Involved Employees">
              <span className="text-sm font-medium text-slate-700">{task.InvolvedEmployees}</span>
            </Row>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Description</p>
            <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
              {task.Description || 'No description provided.'}
            </p>
          </div>

          {task.Attachments && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Attachment</p>
              <a
                href={task.Attachments}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-violet-600 hover:text-violet-700 underline underline-offset-2 break-all"
              >
                {task.Attachments}
              </a>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
