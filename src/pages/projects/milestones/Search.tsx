'use client';

import { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { apiCall } from '@/lib/api';
import AntdNepaliDatePicker from '@/components/AntdNepaliDatePicker';

interface MilestoneSearchProps {
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

export default function MilestoneSearch({ open, onClose, onSearch, onClear, project, modal = true }: MilestoneSearchProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const projectId = project?.ProjectInfoID ?? null;

  const getPopupParent = (triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement;

  useEffect(() => {
    if (open) {
      form.resetFields();
      setStartDate('');
      setEndDate('');
    }
  }, [open, form]);

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val && endDate && val > endDate) {
      setEndDate('');
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (val && startDate && val < startDate) {
      setStartDate('');
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
      onSearch({
        ...values,
        StartDate: startDate,
        EndDate: endDate,
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

        <div className="flex items-center gap-1">
          <Form.Item
            label={
              <span className="text-slate-600 font-medium text-sm">
                Start Date
              </span>
            }
            className="mb-0"
          >
            <AntdNepaliDatePicker
              value={startDate}
              onChange={handleStartDateChange}
              placeholder="YYYY/MM/DD"
              className="rounded-md"
              style={{ width: 145 }}
              returnEnglishDate
              getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
            />
          </Form.Item>

          <span className="pb-6 text-slate-400 text-sm">to</span>

          <Form.Item
            label={
              <span className="text-slate-600 font-medium text-sm">
                End Date
              </span>
            }
            className="mb-0"
          >
            <AntdNepaliDatePicker
              value={endDate}
              onChange={handleEndDateChange}
              placeholder="YYYY/MM/DD"
              className="rounded-md"
              style={{ width: 145 }}
              returnEnglishDate
              getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
            />
          </Form.Item>
        </div>
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