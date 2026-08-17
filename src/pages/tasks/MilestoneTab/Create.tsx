'use client';

import { useEffect, useState, useRef } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, message } from 'antd';
import { apiCall } from '@/lib/api';
import AntdNepaliDatePicker from '@/components/AntdNepaliDatePicker';

interface MilestoneCreateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: {
    ProjectInfoID: number;
    ProjectName?: string;
  };
  editingMilestone?: {
    ProjectMilestoneID: number;
    MilestoneTitle: string;
    WorkStatusID: number;
    MilestoneCost: number;
    StartDate: string;
    EndDate: string;
    Summary: string;
  } | null;
  modal?: boolean;
}

interface SelectListItem {
  id: number | string;
  name: string;
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
const STATUS_API = `${API_BASE}/WorkStatus/SelectList`;

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

export default function MilestoneCreate({
  open,
  onClose,
  onSuccess,
  project,
  editingMilestone,
  modal = false,
}: MilestoneCreateProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const projectId = project?.ProjectInfoID ?? null;
  const isEditing = !!editingMilestone;

  const getPopupParent = (triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement;

  useEffect(() => {
    if (open) {
      form.resetFields();
      fetchStatusOptions();

      if (editingMilestone) {
        form.setFieldsValue({
          MilestoneTitle: editingMilestone.MilestoneTitle,
          WorkStatusID: String(editingMilestone.WorkStatusID),
          MilestoneCost: editingMilestone.MilestoneCost,
          Summary: editingMilestone.Summary,
          StartDate: editingMilestone.StartDate || undefined,
          EndDate: editingMilestone.EndDate || undefined,
        });
      }
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [open, form, editingMilestone]);

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

  const handleSubmit = async () => {
    if (!projectId) {
      message.error('Missing project information');
      return;
    }
    try {
      const values = await form.validateFields();
      setLoading(true);

      const body = {
        ProjectMilestoneID: isEditing ? editingMilestone!.ProjectMilestoneID : 0,
        ProjectInfoID: projectId,
        MilestoneTitle: values.MilestoneTitle,
        WorkStatusID: Number(values.WorkStatusID),
        MilestoneCost: Number(values.MilestoneCost),
        StartDate: values.StartDate || '',
        EndDate: values.EndDate || '',
        Summary: values.Summary || '',
      };

      const res = await apiCall(`${API_BASE}/SaveProjectMilestone`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

      message.success(isEditing ? 'Milestone updated successfully' : 'Milestone created successfully');
      form.resetFields();
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to save milestone');
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
              Milestone Title<span className="text-red-500 ml-0.5">*</span>
            </span>
          }
          name="MilestoneTitle"
          rules={[{ required: true, message: 'Please enter milestone title' }]}
        >
          <Input placeholder="Enter milestone title" className="rounded-md" />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            label={
              <span className="text-slate-600 font-medium text-sm">
                Work Status<span className="text-red-500 ml-0.5">*</span>
              </span>
            }
            name="WorkStatusID"
            rules={[{ required: true, message: 'Please select work status' }]}
          >
            <Select
              placeholder="Select work status"
              options={statusOptions}
              className="rounded-md"
              loading={statusLoading}
              getPopupContainer={getPopupParent}
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-slate-600 font-medium text-sm">
                Milestone Cost<span className="text-red-500 ml-0.5">*</span>
              </span>
            }
            name="MilestoneCost"
            rules={[{ required: true, message: 'Please enter milestone cost' }]}
          >
            <InputNumber
              placeholder="Enter milestone cost"
              className="rounded-md w-full"
              style={{ width: '100%' }}
              min={0}
              precision={2}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            label={
              <span className="text-slate-600 font-medium text-sm">
                Start Date<span className="text-red-500 ml-0.5">*</span>
              </span>
            }
            name="StartDate"
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <AntdNepaliDatePicker
              placeholder="YYYY/MM/DD"
              className="rounded-md w-full"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-slate-600 font-medium text-sm">
                End Date<span className="text-red-500 ml-0.5">*</span>
              </span>
            }
            name="EndDate"
            dependencies={['StartDate']}
            rules={[
              { required: true, message: 'Please select end date' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || !getFieldValue('StartDate') || new Date(value) >= new Date(getFieldValue('StartDate'))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('End date must be after start date'));
                },
              }),
            ]}
          >
            <AntdNepaliDatePicker
              placeholder="YYYY/MM/DD"
              className="rounded-md w-full"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>

        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">Summary</span>
          }
          name="Summary"
        >
          <Input.TextArea
            placeholder="Enter milestone summary"
            className="rounded-md"
            rows={3}
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
          {isEditing ? 'Update Milestone' : 'Create Milestone'}
        </Button>
      </div>
    </Form>
  );

  return modal ? (
    <Modal
      open={open}
      onCancel={onClose}
      title={isEditing ? 'Edit Milestone' : 'Create New Milestone'}
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
