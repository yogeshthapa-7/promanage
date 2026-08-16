'use client';

import { useEffect, useState, useMemo } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { apiCall } from '@/lib/api';
import { fetchEmployees, type Employee } from '@/lib/employees-data';
import type { TaskItem } from '@/lib/tasks-data';

interface SubTaskCreateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project?: {
    ProjectInfoID?: number;
    ProjectName?: string;
    id?: string | number;
  };
  selectedTask: TaskItem;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

const PRIORITY_OPTIONS = [
  { label: 'Urgent', value: 1 },
  { label: 'High', value: 2 },
  { label: 'Medium', value: 3 },
  { label: 'Low', value: 4 },
];

const STATUS_OPTIONS = [
  { label: 'Not Started', value: 1 },
  { label: 'In Progress', value: 2 },
  { label: 'Completed', value: 3 },
  { label: 'Overdue', value: 4 },
  { label: 'On Hold', value: 5 },
];

export default function SubTaskCreate({
  open,
  onClose,
  onSuccess,
  project,
  selectedTask,
}: SubTaskCreateProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const projectId = project?.ProjectInfoID ?? (project?.id ? Number(project.id) : null) ?? selectedTask?.ProjectInfoID;
  const taskInfoId = selectedTask.TaskInfoID;

  useEffect(() => {
    if (open) {
      form.resetFields();
      fetchEmployeeOptions();
    }
  }, [open, form]);

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
    try {
      const values = await form.validateFields();
      setLoading(true);

      const involvedEmployees = Array.isArray(values.InvolvedEmployees)
        ? values.InvolvedEmployees.join(',')
        : String(values.InvolvedEmployees || '');

      const body = {
        SubTaskInfoID: 0,
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

      message.success('Subtask created successfully');
      form.resetFields();
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to create subtask');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Create New Subtask"
      width={640}
      footer={null}
      destroyOnClose
      zIndex={10000}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="mt-4"
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
            initialValue={2}
          >
            <Select
              placeholder="Select status"
              options={STATUS_OPTIONS}
              className="rounded-md"
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
            Create Subtask
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
