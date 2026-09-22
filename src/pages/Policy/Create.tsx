import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Select } from 'antd';
import Drawer from '@/components/drawer';
import { apiCall } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';
import { fetchFiscalYearSelectList, type FiscalYearSelectOption } from '@/data/fiscal-year-data';
import DocumentUploadField from '@/components/DocumentUploadField';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

interface Policy {
  id: number;
  name: string;
  fiscal_year?: string;
  fiscal_year_id?: number;
  document_url?: string;
}

interface CreatePolicyDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (savedData?: { id?: number; document_url?: string; isNew?: boolean }) => void;
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
    if (!open) return;
    fetchFiscalYearSelectList().then((options) => {
      setFiscalYearOptions(options);
      if (editingPolicy) {
        form.setFieldsValue({
          name: editingPolicy.name,
          fiscal_year: editingPolicy.fiscal_year_id !== undefined ? String(editingPolicy.fiscal_year_id) : editingPolicy.fiscal_year,
          document_url: editingPolicy.document_url,
        });
        setDocumentUrl(editingPolicy.document_url || '');
      } else {
        form.resetFields();
        form.setFieldsValue({ fiscal_year: options[0]?.value });
        setDocumentUrl('');
      }
    });
  }, [open, editingPolicy, form]);

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
          FiscalYearID: values.fiscal_year ? Number(values.fiscal_year) : 0,
          FileUpload: documentPath,
        };

        const res = await apiCall(`${API_BASE}/SavePolicyProgram`, {
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

        message.success(isEdit ? 'Policy updated successfully' : 'Policy created successfully');
        form.resetFields();
        setDocumentUrl('');
        queryClient.invalidateQueries({ queryKey: ['policies'], exact: false });

        const savedId =
          savedData?.Data?.id ??
          savedData?.id ??
          savedData?.PolicyProgramID ??
          editingPolicy?.id;

        onSuccess?.({
          id: savedId,
          document_url: documentUrl,
          isNew: !isEdit,
        });

        onClose();
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
                Fiscal Year <span className="text-rose-500">*</span>
              </span>
            }
            name="fiscal_year"
            rules = {[
              {required: true, message: 'please select fiscal year'}
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
          {editingPolicy ? 'Update Policy' : 'Create Policy'}
        </Button>
      </div>
    </Drawer>
  );
}
