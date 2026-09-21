'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Select } from 'antd';
import Drawer from '@/components/drawer';
import { apiCall } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { fetchFiscalYearSelectList, type FiscalYearSelectOption } from '@/lib/fiscal-year-data';
import DocumentUploadField from '@/components/DocumentUploadField';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

interface Expense {
  id: number;
  title: string;
  code: string;
  fiscal_year?: string;
  fiscal_year_id?: number;
  document_url?: string;
}

interface CreateExpenseDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (savedData?: { id?: number; document_url?: string; isNew?: boolean }) => void;
  editingExpense?: Expense | null;
}

export default function CreateExpenseDrawer({ open, onClose, onSuccess, editingExpense }: CreateExpenseDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fiscalYearOptions, setFiscalYearOptions] = useState<FiscalYearSelectOption[]>([]);
  const [uploading, setUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    fetchFiscalYearSelectList().then((options) => {
      setFiscalYearOptions(options);
      if (editingExpense) {
        form.setFieldsValue({
          title: editingExpense.title,
          code: editingExpense.code,
          fiscal_year: editingExpense.fiscal_year_id !== undefined ? String(editingExpense.fiscal_year_id) : editingExpense.fiscal_year,
          document_url: editingExpense.document_url,
        });
        setDocumentUrl(editingExpense.document_url || '');
      } else {
        form.resetFields();
        form.setFieldsValue({ fiscal_year: options[0]?.value });
        setDocumentUrl('');
      }
    });
  }, [open, editingExpense, form]);

   const handleSubmit = async () => {
      try {
        const values = await form.validateFields();
        setLoading(true);

        const isEdit = !!editingExpense;
        let documentPath = documentUrl || '';
        if (documentPath.startsWith(API_BASE + '/')) {
          documentPath = documentPath.replace(API_BASE + '/', '');
        }

        const body = {
          ExpenseInfoID: isEdit ? editingExpense?.id : 0,
          ExpenseTitle: values.title,
          ExpenseCode: values.code,
          FiscalYearID: values.fiscal_year ? Number(values.fiscal_year) : 0,
          FileUpload: documentPath,
        };

        const res = await apiCall(`${API_BASE}/SaveExpenseInfo`, {
          method: 'POST',
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

        let savedData: any = {};
        try {
          savedData = await res.json();
        } catch {
          // ignore parse error
        }

        message.success(isEdit ? 'Expense updated successfully' : 'Expense created successfully');
        form.resetFields();
        setDocumentUrl('');
        queryClient.invalidateQueries({ queryKey: ['expenses'], exact: false });

        const savedId =
          savedData?.Data?.id ??
          savedData?.id ??
          savedData?.ExpenseInfoID ??
          editingExpense?.id;

        onSuccess?.({
          id: savedId,
          document_url: documentUrl,
          isNew: !isEdit,
        });

        onClose();
     } catch (err) {
       if (err instanceof Error) {
         message.error(err.message || 'Failed to save expense');
       }
     } finally {
       setLoading(false);
     }
   };

  return (
      <Drawer
        open={open}
        onClose={onClose}
        title={editingExpense ? 'Edit Expense' : 'New Expense'}
        subtitle={editingExpense ? 'Update expense details.' : 'Record a new expense entry.'}
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
                Expense Title <span className="text-rose-500">*</span>
              </span>
            }
            name="title"
            rules={[{ required: true, message: 'Please enter expense title' }]}
          >
            <Input
              placeholder="Enter expense title"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Expense Code <span className="text-rose-500">*</span>
              </span>
            }
            name="code"
            rules={[{ required: true, message: 'Please enter expense code' }]}
          >
            <Input
              placeholder="Enter expense code"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Fiscal Year <span className="text-rose-500">*</span>
              </span>
            }
            name="fiscal_year"
            rules = {[
              {
                required: true, 
                message: 'Please select fiscal year'
              }
            ]}
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
               accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp"
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
          {editingExpense ? 'Update Expense' : 'Create Expense'}
        </Button>
      </div>
    </Drawer>
  );
}
