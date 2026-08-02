'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Form, Input, Select, InputNumber, Row, Col, Button, message } from 'antd';
import { X, Save } from 'lucide-react';
import type { ApiProject } from '@/lib/projects-data';

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProject?: ApiProject | null;
}

const PROJECT_HEAD_OPTIONS = [
  { value: 'head_1', label: 'राम बहादुर श्रेष्ठ' },
  { value: 'head_2', label: 'सीता केसी' },
];

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'उच्च' },
  { value: 'medium', label: 'मध्यम' },
  { value: 'low', label: 'निम्न' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'सक्रिय (Active)' },
  { value: 'pending', label: 'निर्माणाधीन (Pending)' },
  { value: 'completed', label: 'सम्पन्न (Completed)' },
];

const CLIENT_OPTIONS = [
  { value: 'client_1', label: 'ग्राहक १' },
  { value: 'client_2', label: 'ग्राहक २' },
];

const PROJECT_TYPE_OPTIONS = [
  { value: 'infrastructure', label: 'पूर्वाधार (Infrastructure)' },
  { value: 'software', label: 'सफ्टवेयर विकास (Software)' },
];

const DEPARTMENT_OPTIONS = [
  { value: 'administration', label: 'प्रशासन विभाग' },
  { value: 'finance', label: 'आर्थिक विभाग' },
];

const EXPENSE_INFO_OPTIONS = [
  { value: 'capital', label: 'पुँजीगत खर्च' },
  { value: 'operational', label: 'सञ्चालन खर्च' },
];

export default function ProjectFormModal({
  open,
  onClose,
  onSuccess,
  editingProject,
}: ProjectFormModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const isEdit = !!editingProject;

  useEffect(() => {
    if (open) {
      if (editingProject) {
        form.setFieldsValue({
          projectName: editingProject.ProjectName,
          projectHeadName: editingProject.ProjectHeadEmpName,
          startDate: editingProject.StartDate,
          projectDuration: editingProject.ProjectDuration,
          description: editingProject.Description,
          priority1: editingProject.PriorityName,
          totalBudget: editingProject.TotalBudget,
          statusName: editingProject.WorkStatusName,
          policyAndProgram: editingProject.PolicyProgramIDs,
          budget: editingProject.BudgetInfoIDs,
          clientName: editingProject.ProjectHeadEmpName,
          projectType: editingProject.ProjectTypeName,
          department: String(editingProject.DepartmentID),
          expenseInfo: String(editingProject.ExpenseInfoID),
          bankGuaranteeIssueDate: editingProject.BankGuranteeIssueDate,
          bankGuaranteeExpiryDate: editingProject.BankGuranteeExpiryDate,
        });
      } else {
        form.resetFields();
      }
      setSelectedFileName('');
    }
  }, [open, editingProject, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      form.setFieldValue('fileUpload', file);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const token = localStorage.getItem('token');
      const projectId = isEdit ? Number(editingProject?.ProjectInfoID) : 0;

      const body = {
        model: {
          draw: 1,
          start: 0,
          length: 1,
          search: { value: '', regex: '' },
        },
        param: {
          ProjectId: projectId,
          ProjectName: values.projectName,
          ProjectHeadName: values.projectHeadName,
          StartDate: values.startDate,
          ProjectDuration: values.projectDuration,
          Description: values.description,
          Priority1: values.priority1,
          TotalBudget: values.totalBudget,
          StatusName: values.statusName,
          PolicyAndProgram: values.policyAndProgram,
          Budget: values.budget,
          ClientName: values.clientName,
          ProjectType: values.projectType,
          Department: values.department,
          ExpenseInfo: values.expenseInfo,
          BankGuaranteeIssueDate: values.bankGuaranteeIssueDate,
          BankGuaranteeExpiryDate: values.bankGuaranteeExpiryDate,
        },
      };

      const API_URL = `${(import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '')}/ProjectInfo/ServerSearch`;
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

      message.success(
        isEdit ? 'परियोजना सफलतापूर्वक अपडेट गरियो' : 'परियोजना सफलतापूर्वक सिर्जना गरियो'
      );
      form.resetFields();
      setSelectedFileName('');
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        message.error(
          err.message ||
            (isEdit ? 'परियोजना अपडेट गर्न असफल भयो' : 'परियोजना सिर्जना गर्न असफल भयो')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const modalContent = useMemo(() => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl border border-border/80 my-8 flex flex-col max-h-[85vh]">
        <div className="flex items-start justify-between px-5 pt-5 pb-3 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {isEdit ? 'Edit Project' : 'New Project'}
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isEdit ? 'Update project details.' : 'Fill in the details to create a new project.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Form
            form={form}
            layout="vertical"
            size="small"
            requiredMark={false}
          >
            <Row gutter={12}>
              <Col span={24}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">परियोजनाको नाम<span className="text-red-500 ml-0.5">*</span></span>}
                  name="projectName"
                  rules={[{ required: true, message: 'कृपया परियोजनाको नाम प्रविष्ट गर्नुहोस्' }]}
                >
                  <Input className="rounded-md border-slate-300 h-9 text-xs" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={8}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">परियोजना प्रमुख नाम<span className="text-red-500 ml-0.5">*</span></span>}
                  name="projectHeadName"
                  rules={[{ required: true, message: 'कृपया छनौट गर्नुहोस्' }]}
                >
                  <Select placeholder="" options={PROJECT_HEAD_OPTIONS} className="rounded-md h-9 text-xs" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">शुरू मिति<span className="text-red-500 ml-0.5">*</span></span>}
                  name="startDate"
                  rules={[{ required: true, message: 'कृपया शुरू मिति प्रविष्ट गर्नुहोस्' }]}
                >
                  <Input className="rounded-md border-slate-300 h-9 text-xs" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">परियोजना अवधि<span className="text-red-500 ml-0.5">*</span></span>}
                  name="projectDuration"
                  initialValue={0}
                  rules={[{ required: true, message: 'कृपया अवधि प्रविष्ट गर्नुहोस्' }]}
                >
                  <InputNumber className="w-full rounded-md border-slate-300 h-9 text-xs" min={0} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={24}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">विवरण<span className="text-red-500 ml-0.5">*</span></span>}
                  name="description"
                  rules={[{ required: true, message: 'कृपया विवरण प्रविष्ट गर्नुहोस्' }]}
                >
                  <Input className="rounded-md border-slate-300 h-9 text-xs" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={8}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">प्राथमिकता 1<span className="text-red-500 ml-0.5">*</span></span>}
                  name="priority1"
                  rules={[{ required: true, message: 'कृपया प्राथमिकता छनौट गर्नुहोस्' }]}
                >
                  <Select placeholder="--select--" options={PRIORITY_OPTIONS} className="rounded-md h-9 text-xs" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">कुल बजेट<span className="text-red-500 ml-0.5">*</span></span>}
                  name="totalBudget"
                  initialValue={0}
                  rules={[{ required: true, message: 'कृपया कुल बजेट प्रविष्ट गर्नुहोस्' }]}
                >
                  <InputNumber className="w-full rounded-md border-slate-300 h-9 text-xs" min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">स्थिति नाम<span className="text-red-500 ml-0.5">*</span></span>}
                  name="statusName"
                  rules={[{ required: true, message: 'कृपया स्थिति नाम चयन गर्नुहोस्' }]}
                >
                  <Select placeholder="कृपया स्थिति नाम चयन गर्नुहोस्" options={STATUS_OPTIONS} className="rounded-md h-9 text-xs" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={8}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">नीति तथा कार्यक्रम<span className="text-red-500 ml-0.5">*</span></span>}
                  name="policyAndProgram"
                  rules={[{ required: true, message: 'कृपया विवरण प्रविष्ट गर्नुहोस्' }]}
                >
                  <Input className="rounded-md border-slate-300 h-9 text-xs" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">Budget<span className="text-red-500 ml-0.5">*</span></span>}
                  name="budget"
                  rules={[{ required: true, message: 'कृपया Budget प्रविष्ट गर्नुहोस्' }]}
                >
                  <Input className="rounded-md border-slate-300 h-9 text-xs" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">ग्राहकको नाम<span className="text-red-500 ml-0.5">*</span></span>}
                  name="clientName"
                  rules={[{ required: true, message: 'कृपया ग्राहकको नाम चयन गर्नुहोस्' }]}
                >
                  <Select placeholder="कृपया ग्राहकको नाम चयन गर्नुहोस्" options={CLIENT_OPTIONS} className="rounded-md h-9 text-xs" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={8}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">परियोजना प्रकार<span className="text-red-500 ml-0.5">*</span></span>}
                  name="projectType"
                  rules={[{ required: true, message: 'कृपया परियोजना प्रकार चयन गर्नुहोस्' }]}
                >
                  <Select placeholder="कृपया परियोजना प्रकार चयन गर्नुहोस्" options={PROJECT_TYPE_OPTIONS} className="rounded-md h-9 text-xs" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">Department<span className="text-red-500 ml-0.5">*</span></span>}
                  name="department"
                  initialValue="administration"
                  rules={[{ required: true, message: 'कृपया Department चयन गर्नुहोस्' }]}
                >
                  <Select placeholder="प्रशासन विभाग" allowClear options={DEPARTMENT_OPTIONS} className="rounded-md h-9 text-xs" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">ExpenseInfo<span className="text-red-500 ml-0.5">*</span></span>}
                  name="expenseInfo"
                  rules={[{ required: true, message: 'कृपया Expense चयन गर्नुहोस्' }]}
                >
                  <Select placeholder="कृपया Expense चयन गर्नुहोस्" options={EXPENSE_INFO_OPTIONS} className="rounded-md h-9 text-xs" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={8}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">Bank Gurantee Issue Date<span className="text-red-500 ml-0.5">*</span></span>}
                  name="bankGuaranteeIssueDate"
                  rules={[{ required: true, message: 'कृपया मिति प्रविष्ट गर्नुहोस्' }]}
                >
                  <Input className="rounded-md border-slate-300 h-9 text-xs" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">Bank Gurantee Expiry Date<span className="text-red-500 ml-0.5">*</span></span>}
                  name="bankGuaranteeExpiryDate"
                  rules={[{ required: true, message: 'कृपया मिति प्रविष्ट गर्नुहोस्' }]}
                >
                  <Input className="rounded-md border-slate-300 h-9 text-xs" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-700">File Upload<span className="text-red-500 ml-0.5">*</span></span>}
                  name="fileUpload"
                  rules={[{ required: true, message: 'कृपया फाइल अपलोड गर्नुहोस्' }]}
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-[#e5e7eb] text-slate-700 px-3 py-1.5 rounded-md text-xs min-w-[120px] truncate border border-slate-300">
                      {selectedFileName || 'Upload here'}
                    </div>
                    <label className="bg-[#6b7280] hover:bg-[#4b5563] text-white px-4 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors shadow-sm">
                      Browse
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/60 shrink-0">
          <Button
            type="text"
            onClick={onClose}
            className="text-slate-500 hover:!text-slate-600 font-medium h-auto py-1.5 px-3 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            className="bg-[#7C3AED] hover:!bg-[#6366F1] border-none px-5 py-1.5 h-auto text-xs rounded-md font-medium text-white flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            {isEdit ? 'अपडेट गर्नुहोस्' : 'सुरक्षित गर्नुहोस्'}
          </Button>
        </div>
      </div>
    </div>
  ), [editingProject, form, loading, selectedFileName, isEdit, onClose, onSuccess]);

  if (!open) return null;

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return null;
}
