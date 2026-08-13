'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Form, Input, Select, Button, message } from 'antd';
import Drawer from '@/components/drawer';
import { apiCall } from '@/lib/api';
import {
  fetchDepartmentSelectList,
  type DepartmentSelectOption,
} from '@/lib/departments-data';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

interface CreateMainBranchDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingBranch?: { id: string; name: string; mainBranchCode: string; departmentId: number } | null;
}

export default function CreateMainBranchDrawer({
  open,
  onClose,
  onSuccess,
  editingBranch,
}: CreateMainBranchDrawerProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentSelectOption[]>([]);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const isEdit = !!editingBranch;

  const getPopupParent = (triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement;

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setDepartmentLoading(true);

    fetchDepartmentSelectList(controller.signal)
      .then((departments) => {
        setDepartmentOptions(departments);
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) {
          setDepartmentLoading(false);
        }
      });

    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (open && editingBranch) {
      form.setFieldsValue({
        name: editingBranch.name,
        code: editingBranch.mainBranchCode,
        departmentId: String(editingBranch.departmentId),
      });
    } else if (open && !editingBranch) {
      form.resetFields();
    }
  }, [open, editingBranch, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const selectedDepartment = departmentOptions.find(
        (opt) => opt.value === values.departmentId
      );

      const body = {
        MainBranchID: isEdit ? Number(editingBranch!.id) : 0,
        MainBranchName: values.name,
        MainBranchCode: values.code,
        DepartmentID: values.departmentId ? Number(values.departmentId) : 0,
        DepartmentName: selectedDepartment?.label || '',
        // ParentDepartmentID: 0,
        OrderKey: 0,
      };

      const res = await apiCall(`${API_BASE}/SaveMainBranch`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

      message.success(isEdit ? 'Main branch updated successfully' : 'Main branch created successfully');
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['mainBranches', 'search'] });
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to save main branch');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Main Branch' : 'New Main Branch'}
      subtitle={isEdit ? 'Update main branch details.' : 'Fill in the details to create a new main branch.'}
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
                Main Branch Name / मुख्य शाखा नाम <span className="text-rose-500">*</span>
              </span>
            }
            name="name"
            rules={[{ required: true, message: 'Please enter main branch name' }]}
          >
            <Input
              placeholder="Enter main branch name"
              className="rounded-lg border-slate-300 hover:border-violet-400 focus:border-violet-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-600">
                Main Branch Code / मुख्य शाखा कोड <span className="text-rose-500">*</span>
              </span>
            }
            name="code"
            rules={[{ required: true, message: 'Please enter main branch code' }]}
          >
            <Input
              placeholder="Enter main branch code"
              className="rounded-lg border-slate-300 hover:border-violet-400 focus:border-violet-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-600">
                Department / विभाग <span className="text-rose-500">*</span>
              </span>
            }
            name="departmentId"
            rules={[{ required: true, message: 'Please select a department' }]}
          >
            <Select
              placeholder={departmentLoading ? 'Loading...' : 'Select department'}
              options={departmentOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
              className="rounded-lg"
              allowClear
              loading={departmentLoading}
              getPopupContainer={getPopupParent}
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
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </div>
    </Drawer>
  );
}
