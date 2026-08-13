'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Form, Input, Select, Button, message } from 'antd';
import Drawer from '@/components/drawer';
import { apiCall } from '@/lib/api';
import {
  fetchMainBranchSelectList,
  type MainBranchSelectOption,
} from '@/lib/main-branches-data';
import {
  fetchDepartmentSelectList,
  type DepartmentSelectOption,
} from '@/lib/departments-data';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

interface CreateBranchDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingBranch?: { id: string; name: string; branchCode: string; mainBranchId: number; departmentId: number } | null;
}

export default function CreateBranchDrawer({
  open,
  onClose,
  onSuccess,
  editingBranch,
}: CreateBranchDrawerProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [mainBranchOptions, setMainBranchOptions] = useState<MainBranchSelectOption[]>([]);
  const [mainBranchLoading, setMainBranchLoading] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentSelectOption[]>([]);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const isEdit = !!editingBranch;

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setMainBranchLoading(true);
    setDepartmentLoading(true);

    Promise.all([
      fetchMainBranchSelectList(controller.signal),
      fetchDepartmentSelectList(controller.signal),
    ])
      .then(([mainBranches, departments]) => {
        setMainBranchOptions(mainBranches);
        setDepartmentOptions(departments);
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) {
          setMainBranchLoading(false);
          setDepartmentLoading(false);
        }
      });

    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (open && editingBranch) {
      form.setFieldsValue({
        name: editingBranch.name,
        code: editingBranch.branchCode,
        mainBranchId: String(editingBranch.mainBranchId),
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

      const selectedMainBranch = mainBranchOptions.find(
        (opt) => opt.value === values.mainBranchId
      );
      const selectedDepartment = departmentOptions.find(
        (opt) => opt.value === values.departmentId
      );

      const body = {
        BranchID: isEdit ? Number(editingBranch!.id) : 0,
        BranchName: values.name,
        BranchCode: values.code,
        MainBranchID: values.mainBranchId ? Number(values.mainBranchId) : 0,
        MainBranchName: selectedMainBranch?.label || '',
        DepartmentID: values.departmentId ? Number(values.departmentId) : 0,
        DepartmentName: selectedDepartment?.label || '',
        OrderKey: 0,
      };

      const res = await apiCall(`${API_BASE}/SaveBranch`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

      message.success(isEdit ? 'Branch updated successfully' : 'Branch created successfully');
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['branches', 'search'] });
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to save branch');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Branch' : 'New Branch'}
      subtitle={isEdit ? 'Update branch details.' : 'Fill in the details to create a new branch.'}
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
                Branch Name / शाखा नाम <span className="text-rose-500">*</span>
              </span>
            }
            name="name"
            rules={[{ required: true, message: 'Please enter branch name' }]}
          >
            <Input
              placeholder="Enter branch name"
              className="rounded-lg border-slate-300 hover:border-violet-400 focus:border-violet-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-600">
                Branch Code / शाखा कोड <span className="text-rose-500">*</span>
              </span>
            }
            name="code"
            rules={[{ required: true, message: 'Please enter branch code' }]}
          >
            <Input
              placeholder="Enter branch code"
              className="rounded-lg border-slate-300 hover:border-violet-400 focus:border-violet-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-600">
                Main Branch / मुख्य शाखा <span className="text-rose-500">*</span>
              </span>
            }
            name="mainBranchId"
            rules={[{ required: true, message: 'Please select a main branch' }]}
          >
            <Select
              placeholder={mainBranchLoading ? 'Loading...' : 'Select main branch'}
              options={mainBranchOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
              className="rounded-lg"
              allowClear
              loading={mainBranchLoading}
              popupStyle={{ zIndex: 10000 }}
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
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </div>
    </Drawer>
  );
}
