'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import Drawer from '@/components/drawer';
import { apiCall } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import type { Ward } from '@/lib/ward-data';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

interface CreateWardDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingWard?: Ward | null;
}

export default function CreateWardDrawer({ open, onClose, onSuccess, editingWard }: CreateWardDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      if (editingWard) {
        form.setFieldsValue({
          wardNumber: editingWard.wardNumber,
          wardCode: editingWard.wardCode,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, form, editingWard]);

const handleSubmit = async () => {
  try {
    const values = await form.validateFields();
    setLoading(true);

    const isEdit = !!editingWard;

    const body = {
      WardInfoID: isEdit ? editingWard?.id : 0,
      WardNumber: values.wardNumber,
      WardCode: values.wardCode,
    };

    const res = await apiCall(`${API_BASE}/SaveWardInfo`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Failed: ${res.statusText}`);
    }

    const result = await res.json();

    // Backend validation failed
    if (!result.Success) {
      message.error(result.Message || 'Failed to save ward');
      return;
    }

    // Backend save succeeded
    message.success(
      result.Message ||
      (isEdit
        ? 'Ward updated successfully'
        : 'Ward created successfully')
    );

    form.resetFields();

    queryClient.invalidateQueries({
      queryKey: ['wards'],
    });

    onClose();
    onSuccess();

  } catch (err) {
    if (err instanceof Error) {
      message.error(err.message || 'Failed to save ward');
    } else {
      message.error('Failed to save ward');
    }
  } finally {
    setLoading(false);
  }
};



  return (
      <Drawer
        open={open}
        onClose={onClose}
        title={editingWard ? 'Edit Ward' : 'New Ward'}
        subtitle={editingWard ? 'Update ward details.' : 'Create a new ward.'}
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
                Ward Number <span className="text-rose-500">*</span>
              </span>
            }
            name="wardNumber"
            rules={[{ required: true, message: 'Please enter ward number' }]}
          >
            <Input
              placeholder="Enter ward number"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Ward Code <span className="text-rose-500">*</span>
              </span>
            }
            name="wardCode"
            rules={[{ required: true, message: 'Please enter ward code' }]}
          >
            <Input
              placeholder="Enter ward code"
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
          {editingWard ? 'Update Ward' : 'Create Ward'}
        </Button>
      </div>
    </Drawer>
  );
}
