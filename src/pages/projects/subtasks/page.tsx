import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal, message } from 'antd';
import { Plus, Pencil, Trash2, LayoutGrid, List, Search } from 'lucide-react';
import Drawer from '@/components/drawer';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import AppTable from '@/components/ui/AppTable';
import SearchInput from '@/components/ui/SearchInput';
import { Avatar } from '@/components/ui/Avatar';
import { apiCall } from '@/services/apiservice';
import type { ApiProject } from '@/types/projects-types';
import type { TaskItem, SubTaskItem } from '@/types/tasks-types';
import { fetchSubTasks, statusColor, priorityColor } from '@/services/taskservice';
import SubTaskCreate from './Create';

interface SubtaskDrawerProps {
  open: boolean;
  onClose: () => void;
  project: ApiProject;
  task: TaskItem | null;
}

const PAGE_SIZE = 20;

function SubTaskGridView({ subtasks, onEdit, onDelete }: { subtasks: SubTaskItem[]; onEdit: (id: number) => void; onDelete: (id: number) => void }) {
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

          {(subtask as any).Description && (
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{(subtask as any).Description}</p>
          )}

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <Avatar src={subtask.SubTaskManagerPhoto || ''} alt={subtask.SubTaskManagerName || 'Manager'} size={36} />
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
      title: 'Delete Subtask',
      content: `Are you sure you want to delete "${subtask.SubTaskTitle}"?`,
      okText: 'Delete',
      okType: 'danger',
      zIndex: 12000,
      onOk: async () => {
        try {
          const res = await apiCall(`${import.meta.env.VITE_BASE_API_URL}/DeleteSubTaskInfo?id=${subtask.SubTaskInfoID}`, {
            method: 'GET',
          });
          if (!res.ok) throw new Error('Failed');
          message.success('Subtask deleted successfully');
          refetch();
        } catch {
          message.error('Failed to delete subtask');
        }
      },
    });
  };

  if (!task) return null;

  const subtaskColumns = [
    {
      title: 'Subtask',
      dataIndex: 'SubTaskTitle',
      key: 'SubTaskTitle',
      render: (value: string, record: SubTaskItem) => (
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{value}</p>
          {record.SubTaskCode && (
            <p className="text-xs text-slate-500 font-mono">{record.SubTaskCode}</p>
          )}
          {record.TaskInfoName && (
            <p className="text-xs text-slate-500 truncate">{record.TaskInfoName}</p>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'WorkStatusName',
      key: 'WorkStatusName',
      render: (value: string) => (
        <Badge className={statusColor[value] ?? '!bg-gray-100 !text-gray-700'}>{value}</Badge>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'PriorityName',
      key: 'PriorityName',
      render: (value: string) => (
        <Badge className={priorityColor[value] ?? '!bg-gray-100 !text-gray-700'}>{value}</Badge>
      ),
    },
    {
      title: 'Manager',
      dataIndex: 'SubTaskManagerName',
      key: 'SubTaskManagerName',
      render: (value: string, record: SubTaskItem) =>
        value ? (
          <div className="flex items-center gap-2">
            <Avatar src={record.SubTaskManagerPhoto || ''} alt={value} size={24} />
            <span className="text-sm text-slate-700">{value}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      width: 140,
      render: (_: unknown, record: SubTaskItem) => {
        const canEdit = (record as any).CanEdit !== false;
        const canDelete = (record as any).CanDelete !== false;
        return (
          <div className="flex items-center justify-end gap-1">
            {canEdit && (
              <Button type="text" size="small" onClick={() => handleOpenEdit(record)} icon={<Pencil className="w-4 h-4" />} />
            )}
            {canDelete && (
              <Button type="text" size="small" danger onClick={() => handleDelete(record)} icon={<Trash2 className="w-4 h-4" />} />
            )}
          </div>
        );
      },
    },
  ];

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
          <SubTaskCreate
            open={createOpen}
            onClose={handleCloseCreate}
            onSuccess={handleSuccess}
            project={{ ProjectInfoID: project.ProjectInfoID, ProjectName: project.ProjectName }}
            selectedTask={task}
            editingSubTask={editingSubtask}
            modal
          />
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
          <AppTable
            columns={subtaskColumns}
            dataSource={filteredSubTasks}
            rowKey={(record) => record.SubTaskInfoID}
          />
        )}
      </div>
    </Drawer>
  );
}

