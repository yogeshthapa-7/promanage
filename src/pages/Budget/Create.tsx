import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Select } from 'antd';
import Drawer from '@/components/drawer';
import { apiCall } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';
import { fetchFiscalYearSelectList, type FiscalYearSelectOption } from '@/data/fiscal-year-data';
import DocumentUploadField from '@/components/DocumentUploadField';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

interface Budget {
  id: number;
  name: string;
  fiscal_year?: string;
  fiscal_year_id?: number;
  document_url?: string;
}

interface CreateBudgetDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (savedData?: { id?: number; document_url?: string; isNew?: boolean }) => void;
  editingBudget?: Budget | null;
}

export default function CreateBudgetDrawer({ open, onClose, onSuccess, editingBudget }: CreateBudgetDrawerProps) {
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
      if (editingBudget) {
        form.setFieldsValue({
          name: editingBudget.name,
          fiscal_year: editingBudget.fiscal_year_id !== undefined ? String(editingBudget.fiscal_year_id) : editingBudget.fiscal_year,
          document_url: editingBudget.document_url,
        });
        setDocumentUrl(editingBudget.document_url || '');
      } else {
        form.resetFields();
        form.setFieldsValue({ fiscal_year: options[0]?.value });
        setDocumentUrl('');
      }
    });
  }, [open, editingBudget, form]);

   const handleSubmit = async () => {
      try {
        const values = await form.validateFields();
        setLoading(true);

        const isEdit = !!editingBudget;
        let documentPath = documentUrl || '';
        if (documentPath.startsWith(API_BASE + '/')) {
          documentPath = documentPath.replace(API_BASE + '/', '');
        }

        const body = {
          BudgetInfoID: isEdit ? editingBudget?.id : 0,
          BudgetInfoName: values.name,
          FiscalYearID: values.fiscal_year ? Number(values.fiscal_year) : 0,
          FileUpload: documentPath,
        };

        const res = await apiCall(`${API_BASE}/SaveBudgetInfo`, {
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

        message.success(isEdit ? 'Budget updated successfully' : 'Budget created successfully');
        form.resetFields();
        setDocumentUrl('');
        queryClient.invalidateQueries({ queryKey: ['budgets'], exact: false });

        const savedId =
          savedData?.Data?.id ??
          savedData?.id ??
          savedData?.BudgetInfoID ??
          editingBudget?.id;

        onSuccess?.({
          id: savedId,
          document_url: documentUrl,
          isNew: !isEdit,
        });

        onClose();
     } catch (err) {
       if (err instanceof Error) {
         message.error(err.message || 'Failed to save budget');
       }
     } finally {
       setLoading(false);
     }
   };

  return (
      <Drawer
        open={open}
        onClose={onClose}
        title={editingBudget ? 'Edit Budget' : 'New Budget'}
        subtitle={editingBudget ? 'Update budget details.' : 'Create a new budget allocation.'}
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
                Budget Name <span className="text-rose-500">*</span>
              </span>
            }
            name="name"
            rules={[{ required: true, message: 'Please enter budget name' }]}
          >
            <Input
              placeholder="Enter budget name"
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
              { required: true, message: 'Please select fiscal year' }
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
          {editingBudget ? 'Update Budget' : 'Create Budget'}
        </Button>
      </div>
    </Drawer>
  );
}
