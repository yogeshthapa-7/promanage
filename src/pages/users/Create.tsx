'use client';

import { useState, useEffect, useRef } from 'react';
import { Form, Input, Select, Row, Col, Button, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import type { User, UserGroup, OrganizationSelect } from '@/lib/users-data';
import { fetchUserGroups, fetchOrganizations, saveUser, checkUserExists } from '@/lib/users-data';
import Drawer from '@/components/drawer';
import ProgressBar from '@/components/ui/ProgressBar';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser?: User | null;
}

export default function UserFormModal({
  open,
  onClose,
  onSuccess,
  editingUser,
}: UserFormModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationSelect[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [userGroupOpen, setUserGroupOpen] = useState(false);
  const [organizationOpen, setOrganizationOpen] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const isEdit = !!editingUser;
  const queryClient = useQueryClient();
  const userNameCheckIdRef = useRef(0);

  const getPopupParent = (triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement;

  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[a-z]/.test(password)) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 10;
    return Math.min(score, 100);
  };

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
      });
    } else if (!open) {
      form.resetFields();
    }
  }, [open, editingUser, form, organizations]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const selectedGroup = userGroups.find(g => g.UserGroupName === values.userGroup);
      const selectedOrg = organizations.find(o => o.Title === values.organization);

      const payload = {
        UserId: isEdit ? Number(editingUser?.id) : 0,
        UserName: values.userName,
        FullName: values.fullName,
        Password: values.password || '',
        CPassword: values.password || '',
        OrganizationID: selectedOrg ? selectedOrg.OrganizationID : 0,
        Theme: 'Facebook',
        UserGroupCode: selectedGroup ? selectedGroup.UserGroupCode : '',
        UserGroupId: 0,
      };

      const result = await saveUser(payload);
      if (!result.success) {
        throw new Error(result.message);
      }

      message.success(isEdit ? 'प्रयोगकर्ता सफलतापूर्वक अपडेट गरियो' : 'प्रयोगकर्ता सफलतापूर्वक सिर्जना गरियो');
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['users', 'search'] });
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

  const drawerTitle = isEdit ? 'प्रयोगकर्ता सम्पादन' : 'प्रयोगकर्ता फारम';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={drawerTitle}
      width={640}
    >
      <Form
        form={form}
        layout="vertical"
        size="middle"
        requiredMark={true}
        onValuesChange={(changedValues) => {
          if ('password' in changedValues) {
            setPasswordStrength(calculatePasswordStrength(changedValues.password || ''));
          }
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
          <Form.Item
            label="प्रयोगकर्ता नाम"
            name="userName"
            rules={[
              { required: true, message: 'कृपया प्रयोगकर्ता नाम प्रविष्ट गर्नुहोस्' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || value.trim() === '') {
                    return Promise.resolve();
                  }
                  const checkId = ++userNameCheckIdRef.current;
                  return checkUserExists(value, isEdit ? Number(editingUser?.id) : undefined)
                    .then(exists => {
                      if (checkId !== userNameCheckIdRef.current) {
                        return Promise.resolve();
                      }
                      if (exists) {
                        return Promise.reject(new Error('यो प्रयोगकर्ता नाम पहिले नै अवस्थित छ'));
                      }
                      return Promise.resolve();
                    })
                    .catch(() => Promise.resolve());
                },
              }),
            ]}
          >
            <Input placeholder="e.g. alex.rivera or alex@email.com" className="rounded-lg" />
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
                  getPopupContainer={getPopupParent}
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
                  getPopupContainer={getPopupParent}
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
                        { min: 8, message: 'पासवर्ड कम्तिमा ८ अंकको हुनुपर्छ' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value) return Promise.resolve();
                            const hasUpper = /[A-Z]/.test(value);
                            const hasLower = /[a-z]/.test(value);
                            const hasNumber = /[0-9]/.test(value);
                            const hasSpecial = /[^A-Za-z0-9]/.test(value);
                            if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
                              return Promise.reject(new Error('अपरकेस, लोअरकेस, अंक र विशेष क्यारेक्टर समावेश गर्नुहोस्'));
                            }
                            return Promise.resolve();
                          },
                        }),
                      ]
                }
              >
                <Input.Password placeholder={isEdit ? 'पासवर्ड परिवर्तन गर्न चयन गर्नुहोस्' : '८+ अंकको पासवर्ड'} className="rounded-lg" />
              </Form.Item>
              {!isEdit && passwordStrength > 0 && (
                <div className="mb-2">
                  <ProgressBar value={passwordStrength} color={passwordStrength >= 70 ? '#10B981' : passwordStrength >= 40 ? '#F59E0B' : '#EF4444'} />
                </div>
              )}
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

      <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border/50">
        <Button
          type="text"
          onClick={onClose}
          className="text-slate-500 hover:!text-slate-600 font-medium h-auto py-1.5 px-3 text-sm"
        >
          रद्द गर्नुहोस्
        </Button>
        <Button
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          className="bg-[#7C3AED] hover:!bg-[#6366F1] border-none px-5 py-1.5 h-auto text-sm rounded-md font-medium text-white shadow-sm"
        >
          {isEdit ? 'अपडेट गर्नुहोस्' : 'सुरक्षित गर्नुहोस्'}
        </Button>
      </div>
    </Drawer>
  );
}

