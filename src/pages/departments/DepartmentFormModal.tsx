'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export interface DepartmentFormValues {
  name: string;
}

interface DepartmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingDepartment?: {
    id: string;
    name: string;
    sn: number;
    subTaskCount: number;
  } | null;
}

export default function DepartmentFormModal({
  open,
  onClose,
  onSuccess,
  editingDepartment,
}: DepartmentFormModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!editingDepartment;

  useEffect(() => {
    if (open && editingDepartment) {
      form.setFieldsValue({
        name: editingDepartment.name,
      });
    } else if (!open) {
      form.resetFields();
    }
  }, [open, editingDepartment, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // In a real app, this would call an API to save the department
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      message.success(
        isEdit 
          ? 'Department updated successfully' 
          : 'Department created successfully'
      );
      form.resetFields();
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(
          err.message ||
            (isEdit ? 'Failed to update department' : 'Failed to create department')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <div className="text-base font-semibold text-slate-700 pb-3 border-b border-slate-100">
          {isEdit ? 'Edit Department' : 'New Department'}
        </div>
      }
      onCancel={onClose}
      centered
      width={520}
      footer={
        <div className="flex justify-end items-center pt-2">
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-none px-5 py-1.5 h-auto text-sm rounded-md font-medium text-white shadow-sm"
          >
            {isEdit ? 'Update' : 'Create'}
          </Button>
          <Button
            type="text"
            onClick={onClose}
            className="text-slate-500 hover:!text-slate-600 font-medium h-auto py-1.5 px-3"
          >
            Cancel
          </Button>
        </div>
      }
      styles={{
        body: { paddingTop: 20, paddingBottom: 12, background: '#fff' },
        header: { background: '#fff', paddingBottom: 0 },
        content: { padding: '20px 24px', borderRadius: '8px' },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">
              Department Name<span className="text-red-500 ml-0.5">*</span>
            </span>
          }
          name="name"
          rules={[{ required: true, message: 'Please enter department name' }]}
        >
          <Input
            placeholder="Enter department name"
            className="rounded-md border-slate-300 hover:border-blue-400 focus:border-blue-500"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}