import { useState, useEffect } from 'react';
import { Form, Input, Select, Button, message } from 'antd';
import Drawer from '@/shared/components/drawer';
import AntdNepaliDatePicker from '@/shared/components/AntdNepaliDatePicker';
import { saveTask, fetchWorkStatuses } from '@/features/tasks/services/task.service';
// import { fetchEmployeesSelectList } from '@/features/employee/services/employee.service';
import { fetchSelectList } from '@/features/projects/services/project.service';
import type { TaskItem } from '@/features/tasks/types/tasks-types';
import type { ApiProject } from '@/features/projects/types/projects-types';

const priorityOptions = [
  { label: 'Urgent', value: 1 },
  { label: 'High', value: 2 },
  { label: 'Medium', value: 3 },
  { label: 'Low', value: 4 },
];

// Backend stores DueDate in BS format (e.g. "2082/6/28"). The picker returns BS
// (YYYY/MM/DD) in non-English mode; normalize to the unpadded YYYY/M/D the API uses.
const normalizeBs = (bs?: string): string => {
  if (!bs) return '';
  const parts = bs.replace(/-/g, '/').split('/');
  if (parts.length !== 3) return '';
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if ([y, m, d].some((n) => isNaN(n))) return '';
  return `${y}/${m}/${d}`;
};

interface CreateTaskDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTask?: TaskItem | null;
  project?: ApiProject | null;
}

export default function CreateTaskDrawer({ open, onClose, onSuccess, editingTask, project }: CreateTaskDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState<{ id: number | string; name: string }[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [projects, setProjects] = useState<{ id: number | string; name: string }[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const isEdit = !!editingTask;

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    setManagersLoading(true);
    setProjectsLoading(true);
    setOptionsLoading(true);

     Promise.allSettled([
      fetchSelectList('/EmployeeInfo/SelectList', controller.signal ),
      fetchSelectList('/ProjectInfo/SelectList', controller.signal ),
      fetchWorkStatuses(controller.signal ),
    ]).then((results) => {
      const [managersResult, projectsResult, statusResult] = results as [
        PromiseSettledResult<{ id: number | string; name: string }[]>,
        PromiseSettledResult<{ id: number | string; name: string }[]>,
        PromiseSettledResult<{ WorkStatusInfoID: number; StatusName: string; StatusCode: string; Color?: string; IconName?: string }[]>,
      ];

      if (managersResult.status === 'fulfilled' && managersResult.value) {
        setManagers(managersResult.value);
      }
      setManagersLoading(false);

      if (projectsResult.status === 'fulfilled' && projectsResult.value) {
        setProjects(projectsResult.value);
      }
      setProjectsLoading(false);

      if (statusResult.status === 'fulfilled' && statusResult.value) {
        setStatusOptions(statusResult.value.map((s) => ({ value: String(s.WorkStatusInfoID), label: s.StatusName })));
      }
      setOptionsLoading(false);
      setDataLoaded(true);
    });

    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (open && dataLoaded) {
      if (editingTask) {
        const rawTask = editingTask as Record<string, any>;
        const rawProjectId = rawTask.ProjectInfoID ?? rawTask.ProjectId ?? rawTask.projectId;
        const rawManagerId = rawTask.TaskManagerID ?? rawTask.TaskManagerId ?? rawTask.managerId ?? rawTask.SubTaskManagerID;
        const rawStatusId = rawTask.WorkStatusID ?? rawTask.WorkStatusId ?? rawTask.workStatusId;
        const rawPriority = rawTask.Priority ?? rawTask.priority;
        const rawTitle = rawTask.TaskTitle ?? rawTask.taskTitle ?? rawTask.title;
        const rawCode = rawTask.TaskCode ?? rawTask.taskCode;
        const rawDesc = rawTask.Description ?? rawTask.description;
        const rawDueDate = rawTask.DueDate ?? rawTask.dueDate;

        const matchedStatus = statusOptions.find(
          (o) => String(o.value) === String(rawStatusId) || (rawTask.WorkStatusName && o.label === rawTask.WorkStatusName)
        )?.value;

        const matchedManager = managers.find(
          (m) => String(m.id) === String(rawManagerId) || (rawTask.TaskManagerName && m.name === rawTask.TaskManagerName)
        )?.id;

        const matchedProject = projects.find(
          (p) => String(p.id) === String(rawProjectId)
        )?.id;

        form.setFieldsValue({
          taskTitle: rawTitle || '',
          taskCode: rawCode || '',
          projectId: matchedProject !== undefined ? String(matchedProject) : rawProjectId !== undefined ? String(rawProjectId) : undefined,
          managerId: matchedManager !== undefined ? String(matchedManager) : rawManagerId !== undefined ? String(rawManagerId) : undefined,
          priority: rawPriority !== undefined ? Number(rawPriority) : undefined,
          workStatusId: matchedStatus !== undefined ? String(matchedStatus) : rawStatusId !== undefined ? String(rawStatusId) : undefined,
          description: rawDesc || '',
          dueDate: normalizeBs(rawDueDate),
        });
      } else {
        form.resetFields();
        if (project) {
          form.setFieldsValue({ projectId: String(project.ProjectInfoID) });
        }
      }
    }
  }, [open, form, editingTask, project, statusOptions, managers, projects, dataLoaded]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const selectedManager = managers.find((m) => String(m.id) === String(values.managerId));
      const selectedPriority = priorityOptions.find((p) => p.value === Number(values.priority));

      const body = {
        TaskInfoID: isEdit ? editingTask?.TaskInfoID ?? 0 : 0,
        TaskTitle: values.taskTitle,
        TaskCode: values.taskCode || '',
        TaskManagerID: values.managerId ? Number(values.managerId) : 0,
        OrderKey: 0,
        Priority: values.priority ? Number(values.priority) : 2,
        WorkStatusID: values.workStatusId ? Number(values.workStatusId) : 2,
        Description: values.description || '',
        DueDate: values.dueDate || '',
        Attachments: '',
        ProjectInfoID: values.projectId ? Number(values.projectId) : 0,
        TaskManagerName: selectedManager?.name || '',
        PriorityName: selectedPriority?.label || 'High',
      };

      const result = await saveTask(body);
      if (!result.success) {
        throw new Error(result.message || 'Failed to save task');
      }

      message.success(isEdit ? 'Task updated successfully' : 'Task created successfully');
      form.resetFields();
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to save task');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Task' : 'New Task'}
      subtitle={isEdit ? 'Update task details.' : 'Create a new task entry.'}
      width={520}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <div className="flex flex-col gap-4">
          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-600">
                Task Title <span className="text-rose-500">*</span>
              </span>
            }
            name="taskTitle"
            rules={[{ required: true, message: 'Please enter task title' }]}
          >
            <Input placeholder="Enter task title" className="rounded-lg border-slate-300 hover:border-violet-400 focus:border-violet-500" />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-600">
                Task Code
              </span>
            }
            name="taskCode"
          >
            <Input placeholder="Enter task code (e.g. 0x7)" className="rounded-lg border-slate-300 hover:border-violet-400 focus:border-violet-500" />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-600">
                Project <span className="text-rose-500">*</span>
              </span>
            }
            name="projectId"
            rules={[{ required: !project, message: 'Please select a project' }]}
          >
            <Select
              placeholder={projectsLoading ? 'Loading projects...' : 'Select project'}
              options={projects.map((p) => ({ value: String(p.id), label: p.name }))}
              className="rounded-lg"
              loading={projectsLoading}
              disabled={!!project}
              getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-600">
                Manager <span className="text-rose-500">*</span>
              </span>
            }
            name="managerId"
            rules={[{ required: true, message: 'Please select a manager' }]}
          >
            <Select
              placeholder={managersLoading ? 'Loading managers...' : 'Select manager'}
              options={managers.map((m) => ({ value: String(m.id), label: m.name }))}
              className="rounded-lg"
              loading={managersLoading}
              getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-600">
                Priority <span className="text-rose-500">*</span>
              </span>
            }
            name="priority"
            rules={[{ required: true, message: 'Please select a priority' }]}
          >
            <Select
              placeholder="Select priority"
              options={priorityOptions}
              className="rounded-lg"
              getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-600">
                Status <span className="text-rose-500">*</span>
              </span>
            }
            name="workStatusId"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select
              placeholder="Select status"
              options={statusOptions}
              className="rounded-lg"
              loading={optionsLoading}
              getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-600">
                Description
              </span>
            }
            name="description"
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter task description"
              className="rounded-lg border-slate-300 hover:border-violet-400 focus:border-violet-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-600">
                Due Date
              </span>
            }
            name="dueDate"
          >
            <AntdNepaliDatePicker placeholder="YYYY/MM/DD" className="w-full" />
          </Form.Item>
        </div>
      </Form>

      <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border/50">
        <Button
          type="text"
          onClick={onClose}
          className="text-slate-500 hover:!text-slate-600 font-medium h-auto py-1.5 px-3 text-sm"
        >
          Cancel
        </Button>
        <Button
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          className="bg-[#7C3AED] hover:!bg-[#6366F1] border-none px-5 py-1.5 h-auto text-sm rounded-md font-medium text-white shadow-sm"
        >
          {isEdit ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </Drawer>
  );
}








