'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Select } from 'antd';
import Drawer from '@/components/drawer';
import { apiCall } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { fetchFiscalYearSelectList, type FiscalYearSelectOption } from '@/lib/fiscal-year-data';
import DocumentUploadField from '@/components/DocumentUploadField';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

interface Policy {
  id: number;
  name: string;
  fiscal_year?: string;
  document_url?: string;
}

interface CreatePolicyDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingPolicy?: Policy | null;
}

export default function CreatePolicyDrawer({ open, onClose, onSuccess, editingPolicy }: CreatePolicyDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fiscalYearOptions, setFiscalYearOptions] = useState<FiscalYearSelectOption[]>([]);
  const [uploading, setUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && !editingPolicy) {
      fetchFiscalYearSelectList().then((options) => {
        setFiscalYearOptions(options);
        if (options.length > 0) {
          form.setFieldsValue({ fiscal_year: options[0].value });
        }
      });
    }
  }, [open, editingPolicy, form]);

  useEffect(() => {
    if (open) {
      if (editingPolicy) {
        form.setFieldsValue({ 
          name: editingPolicy.name,
          fiscal_year: editingPolicy.fiscal_year,
          document_url: editingPolicy.document_url,
        });
        setDocumentUrl(editingPolicy.document_url || '');
      } else {
        form.resetFields();
        setDocumentUrl('');
      }
    }
  }, [open, form, editingPolicy]);

   const handleSubmit = async () => {
      try {
        const values = await form.validateFields();
        setLoading(true);

        const isEdit = !!editingPolicy;
        let documentPath = documentUrl || '';
        if (documentPath.startsWith(API_BASE + '/')) {
          documentPath = documentPath.replace(API_BASE + '/', '');
        }

        const body = {
          PolicyProgramID: isEdit ? editingPolicy?.id : 0,
          PolicyProgramName: values.name,
          FiscalYear: values.fiscal_year || '',
          DocumentUrl: documentPath,
        };

       const res = await apiCall(`${API_BASE}/SavePolicyProgram`, {
         method: 'POST',
         body: JSON.stringify(body),
       });

       if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

        message.success(isEdit ? 'Policy updated successfully' : 'Policy created successfully');
        form.resetFields();
        setDocumentUrl('');
        queryClient.invalidateQueries({ queryKey: ['policies'], exact: false });
       onClose();
       onSuccess();
     } catch (err) {
       if (err instanceof Error) {
         message.error(err.message || 'Failed to save policy');
       }
     } finally {
       setLoading(false);
     }
   };

  return (
      <Drawer
        open={open}
        onClose={onClose}
        title={editingPolicy ? 'Edit Policy' : 'New Policy'}
        subtitle={editingPolicy ? 'Update policy details.' : 'Create a new policy program.'}
        width={480}
      >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <div className="flex flex-col gap-4">
          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Policy Name <span className="text-rose-500">*</span>
              </span>
            }
            name="name"
            rules={[{ required: true, message: 'Please enter policy name' }]}
          >
            <Input
              placeholder="Enter policy name"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
            />
          </Form.Item>
          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Fiscal Year
              </span>
            }
            name="fiscal_year"
          >
            <Select
              placeholder="Select fiscal year"
              options={fiscalYearOptions}
              allowClear
              getPopupContainer={(triggerNode) => triggerNode.parentElement}
            />
          </Form.Item>
          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Document
              </span>
            }
          >
            <DocumentUploadField
              value={documentUrl}
              onChange={setDocumentUrl}
              uploading={uploading}
              onUploadingChange={setUploading}
              accept="application/pdf"
            />
          </Form.Item>
        </div>
      </Form>

      <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border/50">
        <Button
          type="text"
          onClick={onClose}
          className="text-slate-500 hover:!text-slate-600 font-medium h-auto py-1.5 px-3 text-sm"
        >
          Cancel
        </Button>
        <Button
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          className="bg-[#7C3AED] hover:!bg-[#6366F1] border-none px-5 py-1.5 h-auto text-sm rounded-md font-medium text-white shadow-sm"
        >
          {editingPolicy ? 'Update Policy' : 'Create Policy'}
        </Button>
      </div>
    </Drawer>
  );
}
