'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import Drawer from '@/components/drawer';
import { apiCall } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

interface CreatePolicyDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingPolicy?: Policy | null;
}

export default function CreatePolicyDrawer({ open, onClose, onSuccess, editingPolicy }: CreatePolicyDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      if (editingPolicy) {
        form.setFieldsValue({ name: editingPolicy.name });
      } else {
        form.resetFields();
      }
    }
  }, [open, form, editingPolicy]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const isEdit = !!editingPolicy;
      const body = {
        PolicyProgramID: isEdit ? editingPolicy?.id : 0,
        PolicyProgramName: values.name,
      };

      const res = await apiCall(`${API_BASE}/SavePolicyProgram`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

      message.success(isEdit ? 'Policy updated successfully' : 'Policy created successfully');
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to save policy');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
      <Drawer
        open={open}
        onClose={onClose}
        title={editingPolicy ? 'Edit Policy' : 'New Policy'}
        subtitle={editingPolicy ? 'Update policy details.' : 'Create a new policy program.'}
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
              <span className="text-sm font-semibold text-foreground">
                Policy Name <span className="text-rose-500">*</span>
              </span>
            }
            name="name"
            rules={[{ required: true, message: 'Please enter policy name' }]}
          >
            <Input
              placeholder="Enter policy name"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
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
          {editingPolicy ? 'Update Policy' : 'Create Policy'}
        </Button>
      </div>
    </Drawer>
  );
}
