'use client';

import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, message, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { apiCall } from '@/lib/api';

interface DiscussionCreateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: {
    ProjectInfoID: number;
    ProjectName?: string;
  };
  modal?: boolean;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

const PRIORITY_OPTIONS = [
  { label: 'Urgent', value: 1 },
  { label: 'High', value: 2 },
  { label: 'Medium', value: 3 },
  { label: 'Low', value: 4 },
];

export default function DiscussionCreate({
  open,
  onClose,
  onSuccess,
  project,
  modal = true,
}: DiscussionCreateProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const projectId = project?.ProjectInfoID ?? null;

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    if (!projectId) {
      message.error('Missing project information');
      return;
    }
    try {
      const values = await form.validateFields();
      setLoading(true);

      const body = {
        ProjectDiscussionID: 0,
        DiscussionTitle: values.DiscussionTitle,
        ProjectInfoID: projectId,
        Priority: Number(values.Priority),
        PriorityName: PRIORITY_OPTIONS.find((opt) => opt.value === Number(values.Priority))?.label || '',
        CreatedDate: values.CreatedDate ? dayjs(values.CreatedDate).format('YYYY/MM/DD') : dayjs().format('YYYY/MM/DD'),
      };

      const res = await apiCall(`${API_BASE}/SaveProjectDiscussion`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

      message.success('Discussion created successfully');
      form.resetFields();
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to create discussion');
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
      <div className="grid grid-cols-1 gap-4">
        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">
              Discussion Title<span className="text-red-500 ml-0.5">*</span>
            </span>
          }
          name="DiscussionTitle"
          rules={[{ required: true, message: 'Please enter discussion title' }]}
        >
          <Input placeholder="Enter discussion title" className="rounded-md" />
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
            <span className="text-slate-600 font-medium text-sm">Created Date</span>
          }
          name="CreatedDate"
          initialValue={dayjs()}
        >
          <DatePicker className="rounded-md w-full" format="YYYY/MM/DD" />
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
          Create Discussion
        </Button>
      </div>
    </Form>
  );

  return modal ? (
    <Modal
      open={open}
      onCancel={onClose}
      title="Create New Discussion"
      width={480}
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
