'use client';

import { useEffect, useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import Drawer from '@/components/drawer';
import { apiCall } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import type { Label } from '@/lib/label-data';

interface CreateLabelDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingLabel?: Label | null;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

export default function CreateLabelDrawer({ open, onClose, onSuccess, editingLabel }: CreateLabelDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const isEditing = !!editingLabel;

  useEffect(() => {
    if (open) {
      if (editingLabel) {
        form.setFieldsValue({
          LabelName: editingLabel.name,
          LabelCode: editingLabel.code,
          LabelColor: editingLabel.color,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, form, editingLabel]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const body = {
        LabelInfoID: isEditing ? editingLabel!.id : 0,
        LabelName: values.LabelName,
        LabelCode: values.LabelCode,
        LabelColor: values.LabelColor || '',
      };

      const res = await apiCall(`${API_BASE}/SaveLabelInfo`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

      message.success(isEditing ? 'Label updated successfully' : 'Label created successfully');
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to save label');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editingLabel ? 'Edit Label' : 'New Label'}
      subtitle={editingLabel ? 'Update label details.' : 'Create a new label for tasks and projects.'}
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
                Label Name <span className="text-rose-500">*</span>
              </span>
            }
            name="LabelName"
            rules={[{ required: true, message: 'Please enter label name' }]}
          >
            <Input
              placeholder="Enter label name"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-blue-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Label Code <span className="text-rose-500">*</span>
              </span>
            }
            name="LabelCode"
            rules={[{ required: true, message: 'Please enter label code' }]}
          >
            <Input
              placeholder="e.g. 0x1"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-blue-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Color
              </span>
            }
            name="LabelColor"
          >
            <Input
              placeholder="e.g. red"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-blue-500"
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
          className="bg-[#4F46E5] hover:!bg-[#4338CA] border-none px-5 py-1.5 h-auto text-sm rounded-md font-medium text-white shadow-sm"
        >
          {editingLabel ? 'Update Label' : 'Create Label'}
        </Button>
      </div>
    </Drawer>
  );
}
