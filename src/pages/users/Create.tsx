'use client';

import { useState, useEffect, useRef } from 'react';
import { Form, Input, Select, Row, Col, Button, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import type { User, UserGroup, OrganizationSelect } from '@/lib/users-data';
import {
  fetchUserGroups,
  fetchOrganizations,
  saveUser,
  checkUserExists,
} from '@/lib/users-data';
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
  const [passwordStrength, setPasswordStrength] = useState(0);

  const isEdit = !!editingUser;
  const queryClient = useQueryClient();

  // Used to prevent an older username check response
  // from affecting the latest username value.
  const userNameCheckIdRef = useRef(0);
  const usernameExistsMessage = 'Username Exists Already';

  const isUsernameExistsError = (message?: string) =>
    message?.trim().toLowerCase() === usernameExistsMessage.toLowerCase();

  const getPopupParent = (triggerNode: HTMLElement) =>
    triggerNode.parentNode as HTMLElement;

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

  /**
   * Load dropdown data whenever the drawer opens.
   */
  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      if (!open) return;

      setOptionsLoading(true);

      try {
        const [groups, orgs] = await Promise.all([
          fetchUserGroups(),
          fetchOrganizations(),
        ]);

        if (cancelled) return;

        setUserGroups(groups);
        setOrganizations(orgs);
      } catch (error) {
        if (!cancelled) {
          message.error('समूह तथा संगठनको विवरण लोड गर्न असफल भयो');
        }
      } finally {
        if (!cancelled) {
          setOptionsLoading(false);
        }
      }
    };

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, [open]);

  /**
   * Populate edit form.
   */
  useEffect(() => {
    if (open && editingUser) {
      const org = organizations.find(
        (o) => o.OrganizationID === editingUser.organizationId
      );

      form.setFieldsValue({
        userName: editingUser.email,
        fullName: editingUser.name,
        userGroup: editingUser.role,
        organization: org ? org.Title : editingUser.department,
      });
    }

    if (open && !editingUser) {
      form.resetFields();

      // Keep the existing default group.
      form.setFieldsValue({
        userGroup: 'Employee',
      });
    }

    if (!open) {
      form.resetFields();
      setPasswordStrength(0);

      // Invalidate any username validation that may still be pending.
      userNameCheckIdRef.current += 1;
    }
  }, [open, editingUser, form, organizations]);

  /**
   * Submit user.
   */
const handleSubmit = async () => {
  try {
    const values = await form.validateFields();

    setLoading(true);

    const selectedGroup = userGroups.find(
      (g) => g.UserGroupName === values.userGroup
    );

    const selectedOrg = organizations.find(
      (o) => o.Title === values.organization
    );

    const payload = {
      UserId: isEdit ? Number(editingUser?.id) : 0,
      UserName: values.userName?.trim(),
      FullName: values.fullName?.trim(),
      Password: values.password || '',
      CPassword: values.password || '',
      OrganizationID: selectedOrg
        ? selectedOrg.OrganizationID
        : 0,
      Theme: 'Facebook',
      UserGroupCode: selectedGroup
        ? selectedGroup.UserGroupCode
        : '',
      UserGroupId: 0,
    };

    const result = await saveUser(payload);

    // IMPORTANT:
    // HTTP 200 does NOT necessarily mean the operation succeeded.
    // Check the API's Success property.
    if (!result.success) {
      const apiMessage = result.message?.trim() || 'Failed to save user';

      if (isUsernameExistsError(apiMessage)) {
        form.setFields([
          {
            name: 'userName',
            errors: ['Username already exists'],
          },
        ]);

        message.error('User was not saved. That username already exists.');

        return;
      }

      message.error(`User was not saved: ${apiMessage}`);

      return;
    }

    // ONLY show success when API explicitly says Success: true
    message.success(
      isEdit
        ? 'प्रयोगकर्ता सफलतापूर्वक अपडेट गरियो'
        : 'प्रयोगकर्ता सफलतापूर्वक सिर्जना गरियो'
    );

    form.resetFields();
    setPasswordStrength(0);

    queryClient.invalidateQueries({
      queryKey: ['users', 'search'],
    });

    onClose();
    onSuccess();
  } catch (err) {
    console.error('Save user error:', err);

    if (err instanceof Error) {
      message.error(
        err.message ||
          (isEdit
            ? 'प्रयोगकर्ता अपडेट गर्न असफल भयो'
            : 'प्रयोगकर्ता सिर्जना गर्न असफल भयो')
      );
    } else {
      message.error(
        isEdit
          ? 'प्रयोगकर्ता अपडेट गर्न असफल भयो'
          : 'प्रयोगकर्ता सिर्जना गर्न असफल भयो'
      );
    }
  } finally {
    setLoading(false);
  }
};

  const userGroupOptions = userGroups.map((g) => ({
    value: g.UserGroupName,
    label: g.UserGroupName,
  }));

  const organizationOptions = organizations.map((o) => ({
    value: o.Title,
    label: o.Title,
  }));

  const drawerTitle = isEdit
    ? 'प्रयोगकर्ता सम्पादन'
    : 'प्रयोगकर्ता फारम';

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
            setPasswordStrength(
              calculatePasswordStrength(changedValues.password || '')
            );
          }
        }}
      >
        <Row gutter={16}>
          {/* USERNAME */}
          <Col span={12}>
            <Form.Item
              label="प्रयोगकर्ता नाम"
              name="userName"
              validateTrigger="onBlur"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: 'कृपया प्रयोगकर्ता नाम प्रविष्ट गर्नुहोस्',
                },

                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const userName = value?.trim();

                    if (!userName) {
                      return Promise.resolve();
                    }

                    const checkId = ++userNameCheckIdRef.current;

                    return checkUserExists(
                      userName,
                      isEdit ? Number(editingUser?.id) : undefined
                    )
                      .then((exists) => {
                        // Ignore the response if another check
                        // has already been started.
                        if (checkId !== userNameCheckIdRef.current) {
                          return Promise.resolve();
                        }

                        if (exists) {
                          return Promise.reject(
                            new Error(
                              'यो प्रयोगकर्ता नाम पहिले नै अवस्थित छ'
                            )
                          );
                        }

                        return Promise.resolve();
                      })
                      .catch((error) => {
                        // Do not silently convert the actual
                        // "username exists" validation error into success.
                        if (
                          error instanceof Error &&
                          error.message ===
                            'यो प्रयोगकर्ता नाम पहिले नै अवस्थित छ'
                        ) {
                          return Promise.reject(error);
                        }

                        // API/network errors should not falsely say
                        // that the username is already taken.
                        return Promise.resolve();
                      });
                  },
                }),
              ]}
            >
              <Input
                placeholder="e.g. alex.rivera or alex@email.com"
                className="rounded-lg"
              />
            </Form.Item>
          </Col>

          {/* FULL NAME */}
          <Col span={12}>
            <Form.Item
              label="पुरा नाम"
              name="fullName"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: 'कृपया पुरा नाम प्रविष्ट गर्नुहोस्',
                },
              ]}
            >
              <Input
                placeholder="e.g. Alex Rivera"
                className="rounded-lg"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* USER GROUP */}
          <Col span={12}>
            <Form.Item
              label="प्रयोगकर्ता समूह"
              name="userGroup"
              rules={[
                {
                  required: true,
                  message: 'कृपया प्रयोगकर्ता समूह चयन गर्नुहोस्',
                },
              ]}
            >
              <Select
                placeholder="समूह चयन गर्नुहोस्"
                className="rounded-lg"
                options={userGroupOptions}
                loading={optionsLoading}
                showSearch
                optionFilterProp="label"
                getPopupContainer={getPopupParent}
              />
            </Form.Item>
          </Col>

          {/* ORGANIZATION */}
          <Col span={12}>
            <Form.Item
              label="संगठन"
              name="organization"
              rules={[
                {
                  required: true,
                  message: 'कृपया संगठनको नाम प्रविष्ट गर्नुहोस्',
                },
              ]}
            >
              <Select
                placeholder="संगठन चयन गर्नुहोस्"
                className="rounded-lg"
                options={organizationOptions}
                loading={optionsLoading}
                showSearch
                optionFilterProp="label"
                allowClear
                getPopupContainer={getPopupParent}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* PASSWORD */}
          <Col span={12}>
            <Form.Item
              label="पासवर्ड"
              name="password"
              rules={
                isEdit
                  ? []
                  : [
                      {
                        required: true,
                        message: 'कृपया पासवर्ड प्रविष्ट गर्नुहोस्',
                      },
                      {
                        min: 8,
                        message: 'पासवर्ड कम्तिमा ८ अंकको हुनुपर्छ',
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value) {
                            return Promise.resolve();
                          }

                          const hasUpper = /[A-Z]/.test(value);
                          const hasLower = /[a-z]/.test(value);
                          const hasNumber = /[0-9]/.test(value);
                          const hasSpecial = /[^A-Za-z0-9]/.test(value);

                          if (
                            !hasUpper ||
                            !hasLower ||
                            !hasNumber ||
                            !hasSpecial
                          ) {
                            return Promise.reject(
                              new Error(
                                'अपरकेस, लोअरकेस, अंक र विशेष क्यारेक्टर समावेश गर्नुहोस्'
                              )
                            );
                          }

                          return Promise.resolve();
                        },
                      }),
                    ]
              }
            >
              <Input.Password
                placeholder={
                  isEdit
                    ? 'पासवर्ड परिवर्तन गर्न चयन गर्नुहोस्'
                    : '८+ अंकको पासवर्ड'
                }
                className="rounded-lg"
              />
            </Form.Item>

            {!isEdit && passwordStrength > 0 && (
              <div className="mb-2">
                <ProgressBar
                  value={passwordStrength}
                  color={
                    passwordStrength >= 70
                      ? '#10B981'
                      : passwordStrength >= 40
                        ? '#F59E0B'
                        : '#EF4444'
                  }
                />
              </div>
            )}
          </Col>

          {/* CONFIRM PASSWORD */}
          <Col span={12}>
            {!isEdit && (
              <Form.Item
                label="पासवर्ड सुनिश्चित"
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  {
                    required: true,
                    message: 'कृपया पासवर्ड पुनः प्रविष्ट गर्नुहोस्',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (
                        !value ||
                        getFieldValue('password') === value
                      ) {
                        return Promise.resolve();
                      }

                      return Promise.reject(
                        new Error('पासवर्डहरू मिलेन')
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="पासवर्ड पुनः पुष्टि गर्नुहोस्"
                  className="rounded-lg"
                />
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
