import { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, message } from 'antd';
import AntdNepaliDatePicker from '@/shared/components/AntdNepaliDatePicker';
import Drawer from '@/shared/components/drawer';
import { fetchSelectList, SELECT_LIST_URLS, mapToSelectOptions } from '@/features/projects/services/project.service';
import { saveMilestone } from '@/features/projects/services/milestone.service';

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
  }, [open, form, editingMilestone]);

  const fetchStatusOptions = async () => {
    setStatusLoading(true);
    try {
      const items = await fetchSelectList(SELECT_LIST_URLS.status);
      setStatusOptions(mapToSelectOptions(items));
    } catch {
      message.error('Failed to load status options');
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

      await saveMilestone(body);

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
              returnEnglishDate
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
              returnEnglishDate
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
  ) : (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Milestone' : 'Create New Milestone'}
      subtitle={isEditing ? 'Edit milestone details' : 'Create a new milestone'}
      width={640}
    >
      {formContent}
    </Drawer>
  );
}







