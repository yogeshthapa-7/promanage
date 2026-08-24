'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal, message } from 'antd';
import { Plus, Pencil, Trash2, LayoutGrid, List } from 'lucide-react';
import Drawer from '@/components/drawer';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { apiCall } from '@/lib/api';
import type { ApiProject } from '@/lib/projects-data';
import type { TaskItem, SubTaskItem } from '@/lib/tasks-data';
import { fetchSubTasks, statusColor, priorityColor } from '@/lib/tasks-data';
import SubTaskCreate from '@/pages/tasks/SubTasksTab/Create';

interface SubtaskDrawerProps {
  open: boolean;
  onClose: () => void;
  project: ApiProject;
  task: TaskItem | null;
}

const PAGE_SIZE = 20;

function SubTaskListRow({ subtask, onEdit, onDelete }: { subtask: SubTaskItem; onEdit: () => void; onDelete: () => void }) {
  const canEdit = (subtask as any).CanEdit !== false;
  const canDelete = (subtask as any).CanDelete !== false;
  return (
    <Card hover className="flex items-center gap-3 px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{subtask.SubTaskTitle}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge className={statusColor[subtask.WorkStatusName] ?? '!bg-gray-100 !text-gray-700'}>
            {subtask.WorkStatusName}
          </Badge>
          <Badge className={priorityColor[subtask.PriorityName] ?? '!bg-gray-100 !text-gray-700'}>
            {subtask.PriorityName}
          </Badge>
          {subtask.SubTaskManagerName && (
            <span className="text-xs text-slate-500 truncate">{subtask.SubTaskManagerName}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {canEdit && (
          <Button size="small" type="text" onClick={onEdit} icon={<Pencil className="w-3.5 h-3.5" />} />
        )}
        {canDelete && (
          <Button size="small" type="text" danger onClick={onDelete} icon={<Trash2 className="w-3.5 h-3.5" />} />
        )}
      </div>
    </Card>
  );
}

function SubTaskGridView({ subtasks, onEdit, onDelete }: { subtasks: SubTaskItem[]; onEdit: (id: number) => void; onDelete: (id: number) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {subtasks.map((subtask) => (
        <Card key={subtask.SubTaskInfoID} hover className="flex flex-col gap-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">{subtask.SubTaskTitle}</p>
              {subtask.SubTaskCode && (
                <p className="text-xs text-slate-400 font-mono mt-0.5">{subtask.SubTaskCode}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(subtask as any).CanEdit !== false && (
                <Button size="small" type="text" onClick={() => onEdit(subtask.SubTaskInfoID)} icon={<Pencil className="w-3.5 h-3.5" />} />
              )}
              {(subtask as any).CanDelete !== false && (
                <Button size="small" type="text" danger onClick={() => onDelete(subtask.SubTaskInfoID)} icon={<Trash2 className="w-3.5 h-3.5" />} />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={statusColor[subtask.WorkStatusName] ?? '!bg-gray-100 !text-gray-700'}>
              {subtask.WorkStatusName}
            </Badge>
            <Badge className={priorityColor[subtask.PriorityName] ?? '!bg-gray-100 !text-gray-700'}>
              {subtask.PriorityName}
            </Badge>
          </div>
          {subtask.SubTaskManagerName && (
            <p className="text-xs text-slate-500 truncate">{subtask.SubTaskManagerName}</p>
          )}
        </Card>
      ))}
    </div>
  );
}

export default function SubtaskDrawer({ open, onClose, project, task }: SubtaskDrawerProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<SubTaskItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const projectId = project?.ProjectInfoID ?? null;
  const taskId = task?.TaskInfoID ?? null;

  const { data: subtasks = [], isLoading, refetch } = useQuery({
    queryKey: ['project-subtasks', projectId, taskId],
    queryFn: ({ signal }) =>
      fetchSubTasks({
        projectId: projectId!,
        taskInfoId: taskId!,
        page: 1,
        pageSize: PAGE_SIZE,
        signal,
      }).then((result) => result.items),
    enabled: open && Boolean(projectId) && Boolean(taskId),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const handleOpenCreate = () => {
    setEditingSubtask(null);
    setCreateOpen(true);
  };

  const handleOpenEdit = (subtask: SubTaskItem) => {
    setEditingSubtask(subtask);
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setEditingSubtask(null);
  };

  const handleSuccess = () => {
    refetch();
    setCreateOpen(false);
    setEditingSubtask(null);
  };

  const handleDelete = (subtask: SubTaskItem) => {
    Modal.confirm({
      title: 'Delete subtask?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await apiCall(`${import.meta.env.VITE_BASE_API_URL}/DeleteSubTaskInfo?id=${subtask.SubTaskInfoID}`, {
            method: 'GET',
          });
          if (!res.ok) throw new Error('Failed');
          message.success('Subtask deleted');
          refetch();
        } catch {
          message.error('Failed to delete subtask');
        }
      },
    });
  };

  if (!task) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Subtasks" subtitle={task.TaskTitle} width={720}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''}</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/70 border border-slate-200 rounded-lg p-0.5">
              <Button type="text" onClick={() => setViewMode('list')} icon={<List className="w-4 h-4" />} />
              <Button type="text" onClick={() => setViewMode('grid')} icon={<LayoutGrid className="w-4 h-4" />} />
            </div>
            <Button type="primary" onClick={handleOpenCreate} icon={<Plus className="w-3.5 h-3.5" />}>
              Add New
            </Button>
          </div>
        </div>

        <Card padding="p-4" className="bg-white/80">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground">{task.TaskTitle}</h3>
              <span className="text-xs text-slate-500 font-mono">{task.TaskCode}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={statusColor[task.WorkStatusName] ?? '!bg-gray-100 !text-gray-700'}>
                {task.WorkStatusName}
              </Badge>
              <Badge className={priorityColor[task.PriorityName] ?? '!bg-gray-100 !text-gray-700'}>
                {task.PriorityName}
              </Badge>
            </div>
            {task.TaskManagerName && (
              <p className="text-xs text-slate-500">Manager: {task.TaskManagerName}</p>
            )}
            {task.Description && (
              <p className="text-xs text-slate-500 line-clamp-2">{task.Description}</p>
            )}
          </div>
        </Card>

        {createOpen && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">
                {editingSubtask ? 'Edit Subtask' : 'Add Subtask'}
              </h3>
              <Button size="small" type="text" onClick={handleCloseCreate}>Cancel</Button>
            </div>
            <SubTaskCreate
              open={createOpen}
              onClose={handleCloseCreate}
              onSuccess={handleSuccess}
              project={{ ProjectInfoID: project.ProjectInfoID, ProjectName: project.ProjectName }}
              selectedTask={task}
              editingSubTask={editingSubtask}
              modal={false}
            />
          </div>
        )}

        {isLoading ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-slate-400">Loading subtasks...</p>
          </Card>
        ) : subtasks.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-slate-400">No subtasks found</p>
          </Card>
        ) : viewMode === 'grid' ? (
          <SubTaskGridView
            subtasks={subtasks}
            onEdit={(id) => {
              const found = subtasks.find((s) => s.SubTaskInfoID === id);
              if (found) handleOpenEdit(found);
            }}
            onDelete={(id) => {
              const found = subtasks.find((s) => s.SubTaskInfoID === id);
              if (found) handleDelete(found);
            }}
          />
        ) : (
          <div className="space-y-2">
            {subtasks.map((subtask) => (
              <SubTaskListRow
                key={subtask.SubTaskInfoID}
                subtask={subtask}
                onEdit={() => handleOpenEdit(subtask)}
                onDelete={() => handleDelete(subtask)}
              />
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
