'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Row, Col, message } from 'antd';
import type { User, UserGroup, OrganizationSelect } from '@/lib/users-data';
import { fetchUserGroups, fetchOrganizations, saveUser } from '@/lib/users-data';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser?: User | null;
  existingUsers: User[];
}

export default function UserFormModal({
  open,
  onClose,
  onSuccess,
  editingUser,
  existingUsers,
}: UserFormModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationSelect[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [userGroupOpen, setUserGroupOpen] = useState(false);
  const [organizationOpen, setOrganizationOpen] = useState(false);
  const isEdit = !!editingUser;

  useEffect(() => {
    if (open) {
      setOptionsLoading(true);
      Promise.all([fetchUserGroups(), fetchOrganizations()]).then(([groups, orgs]) => {
        setUserGroups(groups);
        setOrganizations(orgs);
        setOptionsLoading(false);
      });
    } else {
      setUserGroupOpen(false);
      setOrganizationOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && editingUser) {
      const org = organizations.find(o => o.OrganizationID === editingUser.organizationId);
      form.setFieldsValue({
        userName: editingUser.email,
        fullName: editingUser.name,
        userGroup: editingUser.role,
        organization: org ? org.Title : editingUser.department,
        theme: editingUser.theme || 'Facebook',
      });
    } else if (!open) {
      form.resetFields();
    }
  }, [open, editingUser, form, organizations]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const duplicateUser = existingUsers.find(
        (u) => u.email.toLowerCase() === values.userName.toLowerCase(),
      );
      if (duplicateUser && !isEdit) {
        message.error('This username already exists');
        setLoading(false);
        return;
      }

      const duplicateName = existingUsers.find(
        (u) => u.name.toLowerCase() === values.fullName.toLowerCase(),
      );
      if (duplicateName && !isEdit) {
        message.error('This full name already exists');
        setLoading(false);
        return;
      }

      const selectedGroup = userGroups.find(g => g.UserGroupName === values.userGroup);
      const selectedOrg = organizations.find(o => o.Title === values.organization);

      const payload = {
        UserId: isEdit ? Number(editingUser?.id) : 0,
        UserName: values.userName,
        FullName: values.fullName,
        Password: values.password || '',
        CPassword: values.password || '',
        OrganizationID: selectedOrg ? selectedOrg.OrganizationID : 0,
        Theme: values.theme || 'Facebook',
        UserGroupCode: selectedGroup ? selectedGroup.UserGroupCode : '',
        UserGroupId: 0,
      };

      const result = await saveUser(payload);
      if (!result.success) {
        throw new Error(result.message);
      }

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

  const userGroupOptions = userGroups.map(g => ({ value: g.UserGroupName, label: g.UserGroupName }));
  const organizationOptions = organizations.map(o => ({ value: o.Title, label: o.Title }));


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
      afterClose={() => {
        setUserGroupOpen(false);
        setOrganizationOpen(false);
      }}
      styles={{
        body: { paddingTop: 20, background: '#fff' },
        header: { paddingBottom: 0, background: '#fff' },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        size="middle"
        requiredMark="required"
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
                 options={userGroupOptions}
                 loading={optionsLoading}
                 showSearch
                 optionFilterProp="label"
                 open={userGroupOpen && open}
                 onDropdownVisibleChange={(visible) => setUserGroupOpen(visible)}
               />
             </Form.Item>
           </Col>
           <Col span={12}>
             <Form.Item
               label="संगठन"
               name="organization"
               rules={[{ required: true, message: 'कृपया संगठनको नाम प्रविष्ट गर्नुहोस्' }]}
             >
               <Select
                 placeholder="संगठन चयन गर्नुहोस्"
                 className="rounded-lg"
                 options={organizationOptions}
                 loading={optionsLoading}
                 showSearch
                 optionFilterProp="label"
                 allowClear
                 open={organizationOpen && open}
                 onDropdownVisibleChange={(visible) => setOrganizationOpen(visible)}
               />
             </Form.Item>
           </Col>
         </Row>

         <Row gutter={16}>
           <Col span={12}>
             <Form.Item
               label="Theme"
               name="theme"
               rules={[{ required: true, message: 'कृपया theme चयन गर्नुहोस्' }]}
               initialValue="Facebook"
             >
               <Select
                 placeholder="Select theme"
                 className="rounded-lg"
                 options={[
                   { value: 'Facebook', label: 'Facebook' },
                   { value: 'Apple', label: 'Apple' },
                   { value: 'Google', label: 'Google' },
                   { value: 'Transparent', label: 'Transparent' },
                 ]}
               />
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
