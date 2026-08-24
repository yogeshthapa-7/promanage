'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal, message } from 'antd';
import { Plus, Pencil, Trash2, LayoutGrid, List, Search } from 'lucide-react';
import Drawer from '@/components/drawer';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import SearchInput from '@/components/ui/SearchInput';
import { Avatar } from '@/components/ui/Avatar';
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
    <Card hover className="flex flex-col gap-3 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">{subtask.SubTaskTitle}</p>
            {subtask.SubTaskCode && (
              <span className="text-[11px] font-mono text-slate-400 shrink-0">{subtask.SubTaskCode}</span>
            )}
          </div>
          {subtask.TaskInfoName && (
            <p className="text-xs text-slate-500 mt-1 truncate">{subtask.TaskInfoName}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {canEdit && (
            <Button size="small" type="text" onClick={onEdit} icon={<Pencil className="w-3.5 h-3.5" />} />
          )}
          {canDelete && (
            <Button size="small" type="text" danger onClick={onDelete} icon={<Trash2 className="w-3.5 h-3.5" />} />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <Badge className={statusColor[subtask.WorkStatusName] ?? '!bg-gray-100 !text-gray-700'}>
          {subtask.WorkStatusName}
        </Badge>
        <Badge className={priorityColor[subtask.PriorityName] ?? '!bg-gray-100 !text-gray-700'}>
          {subtask.PriorityName}
        </Badge>
        {subtask.Weightage ? (
          <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">Weight: {subtask.Weightage}%</span>
        ) : null}
        {subtask.SubTaskManagerName && (
          <div className="flex items-center gap-1.5">
            <Avatar src={subtask.SubTaskManagerPhoto || ''} alt={subtask.SubTaskManagerName} size={20} />
            <span className="text-xs text-slate-500 truncate">{subtask.SubTaskManagerName}</span>
          </div>
        )}
      </div>

      {subtask.Description && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{subtask.Description}</p>
      )}
    </Card>
  );
}

function SubTaskGridView({ subtasks, projectName, onEdit, onDelete }: { subtasks: SubTaskItem[]; projectName: string; onEdit: (id: number) => void; onDelete: (id: number) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {subtasks.map((subtask) => (
        <Card key={subtask.SubTaskInfoID} hover className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-foreground leading-snug">{subtask.SubTaskTitle}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {subtask.SubTaskCode && (
                  <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded-md">{subtask.SubTaskCode}</span>
                )}
                {subtask.Weightage ? (
                  <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">Weight: {subtask.Weightage}%</span>
                ) : null}
              </div>
            </div>
          </div>

          {subtask.TaskInfoName && (
            <p className="text-sm text-slate-600 bg-slate-50/80 rounded-lg px-3 py-2">{subtask.TaskInfoName}</p>
          )}

          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge className={statusColor[subtask.WorkStatusName] ?? '!bg-gray-100 !text-gray-700'}>
              {subtask.WorkStatusName}
            </Badge>
            <Badge className={priorityColor[subtask.PriorityName] ?? '!bg-gray-100 !text-gray-700'}>
              {subtask.PriorityName}
            </Badge>
          </div>

          {subtask.Description && (
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{subtask.Description}</p>
          )}

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <Avatar src={subtask.SubTaskManagerPhoto || ''} alt={subtask.SubTaskManagerName || 'Manager'} size={36}>
              {(subtask.SubTaskManagerName || '?').charAt(0).toUpperCase()}
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-700 truncate">{subtask.SubTaskManagerName || '—'}</p>
              <p className="text-xs text-slate-400">Manager</p>
            </div>
            {subtask.InvolvedEmployees && (
              <span className="text-xs text-slate-400 truncate max-w-[140px] text-right">{subtask.InvolvedEmployees}</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            {(subtask as any).CanEdit !== false && (
              <Button size="small" onClick={() => onEdit(subtask.SubTaskInfoID)} icon={<Pencil className="w-3.5 h-3.5" />}>
                Edit
              </Button>
            )}
            {(subtask as any).CanDelete !== false && (
              <Button size="small" danger onClick={() => onDelete(subtask.SubTaskInfoID)} icon={<Trash2 className="w-3.5 h-3.5" />}>
                Delete
              </Button>
            )}
          </div>
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
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredSubTasks = useMemo(() => {
    if (!searchQuery.trim()) return subtasks;
    const query = searchQuery.toLowerCase();
    return subtasks.filter((subtask) => {
      return (
        subtask.SubTaskTitle?.toLowerCase().includes(query) ||
        subtask.SubTaskCode?.toLowerCase().includes(query) ||
        subtask.WorkStatusName?.toLowerCase().includes(query) ||
        subtask.PriorityName?.toLowerCase().includes(query) ||
        subtask.SubTaskManagerName?.toLowerCase().includes(query) ||
        subtask.TaskInfoName?.toLowerCase().includes(query)
      );
    });
  }, [subtasks, searchQuery]);

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
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-600">{filteredSubTasks.length} subtask{filteredSubTasks.length !== 1 ? 's' : ''}</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/70 border border-border rounded-xl p-0.5 shadow-xs">
                <Button type="text" onClick={() => setViewMode('list')} icon={<List className="w-4 h-4" />} />
                <Button type="text" onClick={() => setViewMode('grid')} icon={<LayoutGrid className="w-4 h-4" />} />
              </div>
              <Button type="primary" onClick={handleOpenCreate} icon={<Plus className="w-3.5 h-3.5" />}>
                Add New
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search subtasks..."
              icon={<Search className="w-4 h-4 text-slate-400" />}
              containerClassName="flex-1"
            />
          </div>
        </div>

        <Card className="bg-white/80">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Task</p>
                <h3 className="text-base font-bold text-foreground mt-0.5">{task.TaskTitle}</h3>
              </div>
              {task.TaskCode && (
                <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-md shrink-0">{task.TaskCode}</span>
              )}
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className={statusColor[task.WorkStatusName] ?? '!bg-gray-100 !text-gray-700'}>
                {task.WorkStatusName}
              </Badge>
              <Badge className={priorityColor[task.PriorityName] ?? '!bg-gray-100 !text-gray-700'}>
                {task.PriorityName}
              </Badge>
            </div>
            {task.TaskManagerName && (
              <div className="flex items-center gap-2">
                <Avatar src={task.TaskManagerPhoto || ''} alt={task.TaskManagerName || 'Manager'} size={24} />
                <span className="text-sm text-slate-600">{task.TaskManagerName}</span>
              </div>
            )}
            {task.Description && (
              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{task.Description}</p>
            )}
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold mt-5 uppercase tracking-wide text-black">Subtask List</h3>
        </div>

        {createOpen && (
          <div className="rounded-xl border border-border bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">
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
        ) : filteredSubTasks.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-slate-400">No subtasks found</p>
          </Card>
        ) : viewMode === 'grid' ? (
          <SubTaskGridView
            subtasks={filteredSubTasks}
            projectName={project.ProjectName}
            onEdit={(id) => {
              const found = filteredSubTasks.find((s) => s.SubTaskInfoID === id);
              if (found) handleOpenEdit(found);
            }}
            onDelete={(id) => {
              const found = filteredSubTasks.find((s) => s.SubTaskInfoID === id);
              if (found) handleDelete(found);
            }}
          />
        ) : (
          <div className="space-y-3">
            {filteredSubTasks.map((subtask) => (
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
