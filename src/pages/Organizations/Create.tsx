'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Select, Button, message } from 'antd';
import Drawer from '@/components/drawer';
import { apiCall } from '@/lib/api';

export interface Organization {
  id?: number;
  title: string;
  parentOrganizationId?: number | string | null;
  parentOrganizationName?: string;
}

interface OrganizationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingOrganization?: Organization | null;
}

interface ParentOrgOption {
  OrganizationID: number;
  Title: string;
}

export default function CreateOrganizationModal({
  open,
  onClose,
  onSuccess,
  editingOrganization,
}: OrganizationModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [parentOrgs, setParentOrgs] = useState<ParentOrgOption[]>([]);
  const [parentOrgsLoading, setParentOrgsLoading] = useState(false);
  const isEdit = !!editingOrganization;

  const getPopupParent = (triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement;

  const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

  useEffect(() => {
    if (open) {
      fetchParentOrganizations();
    }
  }, [open]);

  const fetchParentOrganizations = async () => {
    setParentOrgsLoading(true);
    try {
      const res = await apiCall(`${API_BASE}/Organization/SelectList`);
      if (!res.ok) throw new Error(`Failed to fetch parent organizations: ${res.statusText}`);
      const data: ParentOrgOption[] = await res.json();
      setParentOrgs(data);
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    } finally {
      setParentOrgsLoading(false);
    }
  };

  const parentOrgOptions = parentOrgs.map((org) => ({
    value: String(org.OrganizationID),
    label: org.Title,
  }));

  useEffect(() => {
    if (open && editingOrganization) {
      form.setFieldsValue({
        title: editingOrganization.title,
        parentOrganization: editingOrganization.parentOrganizationId
          ? String(editingOrganization.parentOrganizationId)
          : undefined,
      });
    } else if (open && !editingOrganization) {
  form.resetFields();
    }
  }, [open, editingOrganization, form]);

  const handleSubmit = async () => {
     try {
       const values = await form.validateFields();
       setLoading(true);

       const orgId = isEdit ? Number(editingOrganization?.id) : 0;

       const body = {
         OrganizationID: orgId,
         Title: values.title,
         ParentOrganizationID: values.parentOrganization ? Number(values.parentOrganization) : 0,
       };

        const API_URL = `${API_BASE}/SaveOrganization`;
        const res = await apiCall(API_URL, {
         method: 'POST',
         body: JSON.stringify(body),
       });

      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

      message.success(
        isEdit ? 'संगठन सफलतापूर्वक अपडेट गरियो' : 'संगठन सफलतापूर्वक सिर्जना गरियो'
      );
      form.resetFields();
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(
          err.message ||
            (isEdit ? 'संगठन अपडेट गर्न असफल भयो' : 'संगठन सिर्जना गर्न असफल भयो')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Organization सम्पादन' : 'Organization फारम'}
      width={520}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <div className="flex flex-col gap-4">
          <Form.Item
            label={
              <span className="text-slate-600 font-medium text-sm">
                Title<span className="text-red-500 ml-0.5">*</span>
              </span>
            }
            name="title"
            rules={[{ required: true, message: 'कृपया शीर्षक प्रविष्ट गर्नुहोस्' }]}
          >
            <Input
              placeholder="Enter organization title"
              className="rounded-md border-slate-300 hover:border-blue-400 focus:border-blue-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-slate-600 font-medium text-sm">
                Parent Organization <span className="text-red-500 ml-0.5">*</span>
              </span>
            }
            name="parentOrganization"
            rules={[{ required: true, message: 'कृपया Parent Organization चयन गर्नुहोस्' }]}
          >
            <Select
              placeholder={parentOrgsLoading ? 'Loading...' : 'Select parent organization'}
              options={parentOrgOptions}
              className="rounded-md"
              allowClear
              loading={parentOrgsLoading}
              getPopupContainer={getPopupParent}
            />
          </Form.Item>
        </div>
      </Form>

      <div className="flex justify-end items-center pt-4 mt-4 border-t border-slate-100">
        <Button
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          className="bg-[#10b981] hover:!bg-[#059669] border-none px-5 py-1.5 h-auto text-sm rounded-md font-medium text-white shadow-sm"
        >
          {isEdit ? 'अपडेट गर्नुहोस्' : 'सुरक्षित गर्नुहोस्'}
        </Button>
      </div>
    </Drawer>
  );
}
