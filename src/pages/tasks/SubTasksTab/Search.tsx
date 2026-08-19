'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { apiCall } from '@/lib/api';
import { fetchEmployees, type Employee } from '@/lib/employees-data';

interface SubTaskSearchProps {
  open: boolean;
  onClose: () => void;
  onSearch: (values: Record<string, unknown>) => void;
  project: {
    ProjectInfoID: number;
    ProjectName?: string;
  };
  selectedTask?: {
    TaskInfoID: number;
  };
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

export default function SubTaskSearch({ open, onClose, onSearch, project, selectedTask, modal = true }: SubTaskSearchProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getPopupParent = (triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement;

  useEffect(() => {
    if (open) {
      form.resetFields();
      fetchEmployeeOptions();
      fetchStatusOptions();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [open, form]);

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
    try {
      const values = await form.validateFields();
      setLoading(true);
      onSearch(values);
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to search subtasks');
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
      onValuesChange={(changedValues) => {
        const changedKey = Object.keys(changedValues)[0];
        if (changedKey === 'SubTaskTitle') {
          form.setFieldsValue({ Priority: undefined, WorkStatusID: undefined, SubTaskManagerID: undefined });
        } else if (changedKey === 'Priority') {
          form.setFieldsValue({ SubTaskTitle: undefined, WorkStatusID: undefined, SubTaskManagerID: undefined });
        } else if (changedKey === 'WorkStatusID') {
          form.setFieldsValue({ SubTaskTitle: undefined, Priority: undefined, SubTaskManagerID: undefined });
        } else if (changedKey === 'SubTaskManagerID') {
          form.setFieldsValue({ SubTaskTitle: undefined, Priority: undefined, WorkStatusID: undefined });
        }
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">
              SubTask Title
            </span>
          }
          name="SubTaskTitle"
        >
          <Input placeholder="Search by title" className="rounded-md" />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">
              Priority
            </span>
          }
          name="Priority"
        >
          <Select
            placeholder="Select priority"
            options={PRIORITY_OPTIONS}
            className="rounded-md"
            allowClear
            getPopupContainer={getPopupParent}
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">
              Status
            </span>
          }
          name="WorkStatusID"
        >
          <Select
            placeholder="Select status"
            options={statusOptions}
            className="rounded-md"
            loading={statusLoading}
            allowClear
            getPopupContainer={getPopupParent}
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">
              Manager
            </span>
          }
          name="SubTaskManagerID"
        >
          <Select
            placeholder="Select manager"
            options={employeeOptions}
            className="rounded-md"
            showSearch
            optionFilterProp="label"
            loading={employeesLoading}
            notFoundContent={employeesLoading ? 'Loading...' : 'No employees found'}
            allowClear
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
          Search
        </Button>
      </div>
    </Form>
  );

  return modal ? (
    <Modal
      open={open}
      onCancel={onClose}
      title="Search Subtasks"
      width={640}
      footer={null}
      destroyOnClose
      zIndex={10000}
    >
      {formContent}
    </Modal>
  ) : open ? (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      {formContent}
    </div>
  ) : null;
}
