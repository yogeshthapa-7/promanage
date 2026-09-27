import { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, message, Select } from 'antd';
import { fetchSelectList, SELECT_LIST_URLS, mapToSelectOptions } from '@/features/projects/services/project.service';

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

    const fetchStatusOptions = async () => {
      try {
        const items = await fetchSelectList(SELECT_LIST_URLS.status);
        setStatusOptions(mapToSelectOptions(items));
      } catch {
        console.error('Failed to fetch status options');
      }
    };

    fetchStatusOptions();
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







