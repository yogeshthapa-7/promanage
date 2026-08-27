'use client';

import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { apiCall } from '@/lib/api';

interface DiscussionSearchProps {
  open: boolean;
  onClose: () => void;
  onSearch: (values: Record<string, unknown>) => void;
  onClear?: () => void;
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

export default function DiscussionSearch({ open, onClose, onSearch, onClear, project, modal = true }: DiscussionSearchProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const projectId = project?.ProjectInfoID ?? null;

  const getPopupParent = (triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement;

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
      onSearch(values);
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to search discussions');
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
        if (changedKey === 'DiscussionTitle') {
          form.setFieldsValue({ Priority: undefined });
        } else if (changedKey === 'Priority') {
          form.setFieldsValue({ DiscussionTitle: undefined });
        }
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">
              Discussion Title
            </span>
          }
          name="DiscussionTitle"
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
      title="Search Discussions"
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
