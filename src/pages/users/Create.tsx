'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Row, Col, message } from 'antd';
import type { User } from '@/lib/users-data';
import { API_URL } from '@/lib/users-data';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser?: User | null;
}

const ROLE_OPTIONS = [
  { value: 'Employee', label: 'Employee' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Developer', label: 'Developer' },
  { value: 'Designer', label: 'Designer' },
  { value: 'Member', label: 'Member' },
  { value: 'Task Mgmt', label: 'Task Mgmt' },
  { value: 'Super Admin', label: 'Super Admin' },
  { value: 'Report Analysis', label: 'Report Analysis' },
  { value: 'DC Admin', label: 'DC Admin' },
];

export default function UserFormModal({
  open,
  onClose,
  onSuccess,
  editingUser,
}: UserFormModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!editingUser;

  useEffect(() => {
    if (open && editingUser) {
      form.setFieldsValue({
        userName: editingUser.email,
        fullName: editingUser.name,
        userGroup: editingUser.role,
        organization: editingUser.department,
      });
    } else if (!open) {
      form.resetFields();
    }
  }, [open, editingUser, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const token = localStorage.getItem('token');
      const userId = isEdit ? Number(editingUser?.id) : 0;

      const body = {
        model: {
          draw: 1,
          start: 0,
          length: 1,
          search: { value: '', regex: '' },
        },
        param: {
          UserId: userId,
          UserName: values.userName,
          FullName: values.fullName,
          Password: isEdit ? (values.password || '') : values.password,
          UserGroupId: 0,
          UserGroupName: values.userGroup,
          Theme: values.organization || '',
        },
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

      message.success(isEdit ? 'प्रयोगकर्ता सफलतापूर्वक अपडेट गरियो' : 'प्रयोगकर्ता सफलतापूर्वक सिर्जना गरियो');
      form.resetFields();
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || (isEdit ? 'प्रयोगकर्ता अपडेट गर्न असफल भयो' : 'प्रयोगकर्ता सिर्जना गर्न असफल भयो'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <div className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-4">
          {isEdit ? 'प्रयोगकर्ता सम्पादन' : 'प्रयोगकर्ता फारम'}
        </div>
      }
      okText={isEdit ? 'अपडेट गर्नुहोस्' : 'सुरक्षित गर्नुहोस्'}
      cancelText="रद्द गर्नुहोस्"
      confirmLoading={loading}
      onOk={handleSubmit}
      onCancel={onClose}
      centered
      width={640}
      className="user-form-modal"
      styles={{
        body: { paddingTop: 20, background: '#fff' },
        header: { paddingBottom: 0, background: '#fff' },
        content: { background: '#fff' },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        size="middle"
        requiredMark="optional"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="प्रयोगकर्ता नाम"
              name="userName"
              rules={[{ required: true, message: 'कृपया प्रयोगकर्ता नाम प्रविष्ट गर्नुहोस्' }]}
            >
              <Input placeholder="e.g. alex.rivera" className="rounded-lg" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="पुरा नाम"
              name="fullName"
              rules={[{ required: true, message: 'कृपया पुरा नाम प्रविष्ट गर्नुहोस्' }]}
            >
              <Input placeholder="e.g. Alex Rivera" className="rounded-lg" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="प्रयोगकर्ता समूह"
              name="userGroup"
              rules={[{ required: true, message: 'कृपया प्रयोगकर्ता समूह चयन गर्नुहोस्' }]}
              initialValue="Employee"
            >
              <Select
                placeholder="समूह चयन गर्नुहोस्"
                className="rounded-lg"
                options={ROLE_OPTIONS}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="संगठन"
              name="organization"
              rules={[{ required: true, message: 'कृपया संगठनको नाम प्रविष्ट गर्नुहोस्' }]}
            >
              <Input placeholder="e.g. Everest Tech Pvt. Ltd." className="rounded-lg" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="पासवर्ड"
              name="password"
              rules={
                isEdit
                  ? []
                  : [
                      { required: true, message: 'कृपया पासवर्ड प्रविष्ट गर्नुहोस्' },
                      { min: 6, message: 'पासवर्ड कम्तिमा ६ अंकको हुनुपर्छ' },
                    ]
              }
            >
              <Input.Password placeholder={isEdit ? 'पासवर्ड परिवर्तन गर्न चयन गर्नुहोस्' : '६+ अंकको पासवर्ड'} className="rounded-lg" />
            </Form.Item>
          </Col>
          <Col span={12}>
            {!isEdit && (
              <Form.Item
                label="पासवर्ड सुनिश्चित"
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'कृपया पासवर्ड पुनः प्रविष्ट गर्नुहोस्' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('पासवर्डहरू मिलेन'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="पासवर्ड पुनः प्रविष्ट गर्नुहोस्" className="rounded-lg" />
              </Form.Item>
            )}
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
