'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { apiCall } from '@/lib/api';
import { fetchEmployees, type Employee } from '@/lib/employees-data';
import type { TaskItem, SubTaskItem } from '@/lib/tasks-data';
import Drawer from '@/components/drawer';

interface SubTaskCreateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: {
    ProjectInfoID: number;
    ProjectName?: string;
  };
  selectedTask: TaskItem;
  editingSubTask?: SubTaskItem | null;
  modal?: boolean;
}

interface SelectListItem {
  id: number | string;
  name: string;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
const STATUS_API = `${API_BASE}/WorkStatus/SelectList`;

const PRIORITY_OPTIONS = [
  { label: 'Urgent', value: 1 },
  { label: 'High', value: 2 },
  { label: 'Medium', value: 3 },
  { label: 'Low', value: 4 },
];

const extractIdAndName = (obj: Record<string, unknown>): SelectListItem | null => {
  if (obj.Value !== undefined && obj.Name !== undefined) {
    return { id: Number(obj.Value), name: String(obj.Name) };
  }

  const idSuffixes = ['id', 'ID', 'Id', 'InfoID', 'Code', 'code', 'Key'];
  const nameSuffixes = ['name', 'Name', 'title', 'Title', 'fullname', 'Fullname', 'label', 'Label'];

  let id: number | string | undefined;
  let name: string | undefined;

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (id === undefined && key.length > 1 && idSuffixes.some((s) => key.endsWith(s))) {
      id = value as number | string;
    }
    if (name === undefined && key.length > 1 && nameSuffixes.some((s) => key.endsWith(s))) {
      name = String(value);
    }
    if (id !== undefined && name !== undefined) break;
  }

  if (id !== undefined && name !== undefined) {
    return { id: id as number | string, name };
  }

  return null;
};

export default function SubTaskCreate({
  open,
  onClose,
  onSuccess,
  project,
  selectedTask,
  editingSubTask,
  modal = true,
}: SubTaskCreateProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const projectId = project?.ProjectInfoID ?? (project?.id ? Number(project.id) : null) ?? selectedTask?.ProjectInfoID;
  const taskInfoId = selectedTask?.TaskInfoID;

  const getPopupParent = (triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement;

  useEffect(() => {
    if (open) {
      form.resetFields();
      fetchEmployeeOptions();
      fetchStatusOptions();

      if (editingSubTask) {
        const involvedArr = editingSubTask.InvolvedEmployees
          ? editingSubTask.InvolvedEmployees.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
        form.setFieldsValue({
          SubTaskTitle: editingSubTask.SubTaskTitle,
          SubTaskCode: editingSubTask.SubTaskCode,
          Priority: editingSubTask.Priority,
          WorkStatusID: String(editingSubTask.WorkStatusID),
          SubTaskManagerID: String(editingSubTask.SubTaskManagerID),
          InvolvedEmployees: involvedArr,
        });
      }
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [open, form, editingSubTask]);

  const fetchStatusOptions = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatusLoading(true);
    try {
      const res = await apiCall(STATUS_API, { signal: controller.signal });
      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
      const data = await res.json();
      const list: Record<string, unknown>[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? (data.data as Record<string, unknown>[]) : [];
      const parsed = list.map(extractIdAndName).filter((item): item is SelectListItem => item !== null);
      setStatusOptions(parsed.map((item) => ({ value: String(item.id), label: item.name })));
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        message.error('Failed to load status options');
      }
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchEmployeeOptions = async () => {
    setEmployeesLoading(true);
    try {
      const result = await fetchEmployees({
        search: '',
        start: 0,
        length: 100,
      });
      setEmployees(result.employees);
    } catch {
      message.error('Failed to load employees');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const employeeOptions = useMemo(
    () =>
      employees.map((emp) => ({
        label: `${emp.Fullname} (${emp.DepartmentName || 'N/A'})`,
        value: String(emp.EmployeeInfoID),
      })),
    [employees]
  );

  const handleSubmit = async () => {
    if (!projectId || !taskInfoId) {
      message.error('Missing project or task information');
      return;
    }
    try {
      const values = await form.validateFields();
      setLoading(true);

      const involvedEmployees = Array.isArray(values.InvolvedEmployees)
        ? values.InvolvedEmployees.join(',')
        : String(values.InvolvedEmployees || '');

      const body = {
        SubTaskInfoID: editingSubTask ? editingSubTask.SubTaskInfoID : 0,
        SubTaskTitle: values.SubTaskTitle,
        SubTaskCode: values.SubTaskCode || '',
        SubTaskManagerID: Number(values.SubTaskManagerID),
        InvolvedEmployees: involvedEmployees,
        Priority: Number(values.Priority),
        WorkStatusID: Number(values.WorkStatusID),
        TaskInfoID: taskInfoId,
        ProjectInfoID: projectId,
      };

      const res = await apiCall(`${API_BASE}/SaveSubTaskInfo`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

      message.success(editingSubTask ? 'Subtask updated successfully' : 'Subtask created successfully');
      form.resetFields();
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to save subtask');
      }
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">
              Title<span className="text-red-500 ml-0.5">*</span>
            </span>
          }
          name="SubTaskTitle"
          rules={[{ required: true, message: 'Please enter subtask title' }]}
          className="md:col-span-2"
        >
          <Input placeholder="Enter subtask title" className="rounded-md" />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">Code</span>
          }
          name="SubTaskCode"
        >
          <Input placeholder="e.g. 0x11" className="rounded-md" />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">
              Priority<span className="text-red-500 ml-0.5">*</span>
            </span>
          }
          name="Priority"
          rules={[{ required: true, message: 'Please select priority' }]}
          initialValue={3}
        >
          <Select
            placeholder="Select priority"
            options={PRIORITY_OPTIONS}
            className="rounded-md"
            getPopupContainer={getPopupParent}
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">
              Status<span className="text-red-500 ml-0.5">*</span>
            </span>
          }
          name="WorkStatusID"
          rules={[{ required: true, message: 'Please select status' }]}
          initialValue={statusOptions.length > 0 ? Number(statusOptions[0]?.value) : undefined}
        >
          <Select
            placeholder="Select status"
            options={statusOptions}
            className="rounded-md"
            loading={statusLoading}
            getPopupContainer={getPopupParent}
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">
              Manager<span className="text-red-500 ml-0.5">*</span>
            </span>
          }
          name="SubTaskManagerID"
          rules={[{ required: true, message: 'Please select manager' }]}
        >
          <Select
            placeholder="Select manager"
            options={employeeOptions}
            className="rounded-md"
            showSearch
            optionFilterProp="label"
            loading={employeesLoading}
            notFoundContent={employeesLoading ? 'Loading...' : 'No employees found'}
            getPopupContainer={getPopupParent}
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">Involved Employees</span>
          }
          name="InvolvedEmployees"
        >
          <Select
            mode="multiple"
            placeholder="Select involved employees"
            options={employeeOptions}
            className="rounded-md"
            showSearch
            optionFilterProp="label"
            loading={employeesLoading}
            notFoundContent={employeesLoading ? 'Loading...' : 'No employees found'}
            getPopupContainer={getPopupParent}
          />
        </Form.Item>
      </div>

      <div className="flex justify-end items-center pt-4 mt-2 border-t border-slate-100">
        <Button onClick={onClose} className="mr-3 rounded-md">
          Cancel
        </Button>
        <Button
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          className="rounded-md"
        >
          {editingSubTask ? 'Update Subtask' : 'Create Subtask'}
        </Button>
      </div>
    </Form>
  );

  return modal ? (
    <Modal
      open={open}
      onCancel={onClose}
      title={editingSubTask ? 'Edit Subtask' : 'Create New Subtask'}
      width={640}
      footer={null}
      destroyOnClose
      zIndex={10000}
    >
      {formContent}
    </Modal>
  ) : (
    <Drawer
      open={open}
      onClose={onClose}
      title={editingSubTask ? 'Edit Subtask' : 'Create New Subtask'}
      subtitle={editingSubTask ? 'Edit subtask details' : 'Create a new subtask'}
      width={640}
    >
      {formContent}
    </Drawer>
  );
}
