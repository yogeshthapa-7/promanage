'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Form, Input, Select, Button, message } from 'antd';
import Drawer from '@/components/drawer';
import { apiCall } from '@/lib/api';
import { fetchDepartmentSelectList, type DepartmentSelectOption } from '@/lib/departments-data';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

interface CreateDepartmentDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateDepartmentDrawer({
  open,
  onClose,
  onSuccess,
}: CreateDepartmentDrawerProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [deptOptions, setDeptOptions] = useState<DepartmentSelectOption[]>([]);
  const [deptOptionsLoading, setDeptOptionsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetchDepartmentSelectList(controller.signal)
      .then((options) => setDeptOptions(options))
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setDeptOptionsLoading(false);
      });
    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (open && !form.isFieldsTouched()) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const body = {
        DepartmentID: 0,
        DepartmentName: values.name,
        DepartmentCode: values.code,
        ParentDepartmentID: values.parentId ? Number(values.parentId) : 0,
        ParentDepartmentName: '',
        OrderKey: 0,
      };

      const res = await apiCall(`${API_BASE}/SaveDepartment`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

      message.success('Department created successfully');
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['departments', 'search'] });
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to create department');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New Department"
      subtitle="Fill in the details to create a new department."
      width={480}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <div className="flex flex-col gap-4">
          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-600">
                Department Name <span className="text-rose-500">*</span>
              </span>
            }
            name="name"
            rules={[{ required: true, message: 'Please enter department name' }]}
          >
            <Input
              placeholder="Enter department name"
              className="rounded-lg border-slate-300 hover:border-violet-400 focus:border-violet-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-600">
                Department Code <span className="text-rose-500">*</span>
              </span>
            }
            name="code"
            rules={[{ required: true, message: 'Please enter department code' }]}
          >
            <Input
              placeholder="Enter department code"
              className="rounded-lg border-slate-300 hover:border-violet-400 focus:border-violet-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-600">
                Parent Department
              </span>
            }
            name="parentId"
          >
            <Select
              placeholder={deptOptionsLoading ? 'Loading...' : 'Select parent department'}
              options={deptOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
              className="rounded-lg"
              allowClear
              loading={deptOptionsLoading}
              popupStyle={{ zIndex: 10000 }}
            />
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
          Create
        </Button>
      </div>
    </Drawer>
  );
}
