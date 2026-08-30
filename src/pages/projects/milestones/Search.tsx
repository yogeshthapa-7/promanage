'use client';

import { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, message, Select } from 'antd';
import { apiCall } from '@/lib/api';

interface MilestoneSearchProps {
  open: boolean;
  onClose: () => void;
  onSearch: (values: Record<string, unknown>) => void;
  project: {
    ProjectInfoID: number;
    ProjectName?: string;
  };
  modal?: boolean;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
const STATUS_API = `${API_BASE}/WorkStatus/SelectList`;

interface SelectListItem {
  id: number | string;
  name: string;
}

function extractIdAndName(obj: Record<string, unknown>): SelectListItem | null {
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
}

export default function MilestoneSearch({ open, onClose, onSearch, project, modal = true }: MilestoneSearchProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([]);

  const projectId = project?.ProjectInfoID ?? null;

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  useEffect(() => {
    if (!open || !projectId) return;

    const controller = new AbortController();
    const fetchStatusOptions = async () => {
      try {
        const res = await apiCall(STATUS_API, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
        const data = await res.json();
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? (data.data as Record<string, unknown>[])
            : [];
        const parsed = list.map(extractIdAndName).filter((item): item is SelectListItem => item !== null);
        setStatusOptions(parsed.map((item) => ({ value: String(item.id), label: item.name })));
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') console.error(err);
      }
    };

    fetchStatusOptions();
    return () => controller.abort();
  }, [open, projectId]);

  const handleSubmit = async () => {
    if (!projectId) {
      message.error('Missing project information');
      return;
    }
    try {
      const values = await form.validateFields();
      setLoading(true);
      onSearch({
        ...values,
        WorkStatusID: values.WorkStatusID ? Number(values.WorkStatusID) : undefined,
      });
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to search milestones');
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
      <div className="flex items-end gap-3">
        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">
              Milestone Title
            </span>
          }
          name="MilestoneTitle"
          className="flex-1 mb-0"
        >
          <Input placeholder="Search by title" className="rounded-md" />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">
              Work Status
            </span>
          }
          name="WorkStatusID"
          className="flex-1 mb-0"
        >
          <Select
            placeholder="Select status"
            className="rounded-md"
            style={{ width: '100%' }}
            getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
          >
            {statusOptions.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
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
      title="Search Milestones"
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
