'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal, message } from 'antd';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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

export default function SubtaskDrawer({ open, onClose, project, task }: SubtaskDrawerProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<SubTaskItem | null>(null);

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

  const subtitle = useMemo(() => {
    if (!task) return '';
    return `Task: ${task.TaskTitle}`;
  }, [task]);

  if (!task) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Subtasks" subtitle={subtitle} width={520}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''}</p>
          <Button size="small" type="primary" onClick={handleOpenCreate} icon={<Plus className="w-3.5 h-3.5" />}>
            Add Subtask
          </Button>
        </div>

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
        ) : (
          <div className="space-y-2">
            {subtasks.map((subtask) => (
              <Card key={subtask.SubTaskInfoID} hover className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{subtask.SubTaskTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={statusColor[subtask.WorkStatusName] ?? '!bg-gray-100 !text-gray-700'}>
                      {subtask.WorkStatusName}
                    </Badge>
                    <Badge className={priorityColor[subtask.PriorityName] ?? '!bg-gray-100 !text-gray-700'}>
                      {subtask.PriorityName}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="small" type="text" onClick={() => handleOpenEdit(subtask)} icon={<Pencil className="w-3.5 h-3.5" />} />
                  <Button size="small" type="text" danger onClick={() => handleDelete(subtask)} icon={<Trash2 className="w-3.5 h-3.5" />} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
