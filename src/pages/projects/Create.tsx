'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Form, Input, Select, InputNumber, Row, Col, Button, message } from 'antd';
import { X, Save } from 'lucide-react';
import NepaliDatePicker from '@/components/NepaliDatePicker';
import type { ApiProject } from '@/lib/projects-data';

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProject?: ApiProject | null;
}

interface SelectListItem {
  id: number | string;
  name: string;
}

const getApiBaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BASE_API_URL) {
    return String(import.meta.env.VITE_BASE_API_URL);
  }
  return '';
};

const API_BASE = getApiBaseUrl().replace(/\/$/, '');

const SELECT_LIST_ENDPOINTS = {
  projectHead: `${API_BASE}/EmployeeInfo/SelectList`,
  status: `${API_BASE}/WorkStatus/SelectList`,
  policyProgram: `${API_BASE}/PolicyProgram/SelectList`,
  budget: `${API_BASE}/BudgetInfo/SelectList`,
  client: `${API_BASE}/ClientInfo/SelectList`,
  projectType: `${API_BASE}/ProjectInfo/ProjectTypeList`,
  department: `${API_BASE}/Department/SelectList`,
  expenseInfo: `${API_BASE}/ExpenseInfo/SelectList`,
};

const mapToSelectOptions = (items: SelectListItem[]): { value: string; label: string }[] => {
  return items.map((item) => ({
    value: String(item.id),
    label: item.name,
  }));
};

const extractIdAndName = (obj: Record<string, unknown>): SelectListItem | null => {
  if (obj.Value !== undefined && obj.Name !== undefined) {
    return { id: Number(obj.Value), name: String(obj.Name) };
  }

  const idSuffixes = ['id', 'ID', 'Id', 'InfoID', 'Code', 'code', 'Key'];
  const nameSuffixes = ['name', 'Name', 'title', 'Title', 'fullname', 'Fullname', 'label', 'Label'];

  let id: number | string | undefined;
  let name: string | undefined;

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (id === undefined && key.length > 1 && idSuffixes.some((s) => key.endsWith(s))) {
      id = value as number | string;
    }
    if (name === undefined && key.length > 1 && nameSuffixes.some((s) => key.endsWith(s))) {
      name = String(value);
    }
    if (id !== undefined && name !== undefined) break;
  }

  if (id !== undefined && name !== undefined) {
    return { id: id as number | string, name };
  }

  return null;
};

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'उच्च' },
  { value: 'medium', label: 'मध्यम' },
  { value: 'low', label: 'निम्न' },
];

const ModalContent = memo(
  ({ open, onClose, onSuccess, editingProject }: ProjectFormModalProps) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [optionsError, setOptionsError] = useState<string | null>(null);

    const [projectHeadOptions, setProjectHeadOptions] = useState<{ value: string; label: string }[]>([]);
    const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([]);
    const [policyProgramOptions, setPolicyProgramOptions] = useState<{ value: string; label: string }[]>([]);
    const [budgetOptions, setBudgetOptions] = useState<{ value: string; label: string }[]>([]);
    const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([]);
    const [projectTypeOptions, setProjectTypeOptions] = useState<{ value: string; label: string }[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<{ value: string; label: string }[]>([]);
    const [expenseInfoOptions, setExpenseInfoOptions] = useState<{ value: string; label: string }[]>([]);

    const isEdit = !!editingProject;

    const fetchOptions = useCallback(async () => {
      setOptionsLoading(true);
      setOptionsError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const results = await Promise.allSettled([
          fetch(SELECT_LIST_ENDPOINTS.projectHead, { headers }),
          fetch(SELECT_LIST_ENDPOINTS.status, { headers }),
          fetch(SELECT_LIST_ENDPOINTS.policyProgram, { headers }),
          fetch(SELECT_LIST_ENDPOINTS.budget, { headers }),
          fetch(SELECT_LIST_ENDPOINTS.client, { headers }),
          fetch(SELECT_LIST_ENDPOINTS.projectType, { headers }),
          fetch(SELECT_LIST_ENDPOINTS.department, { headers }),
          fetch(SELECT_LIST_ENDPOINTS.expenseInfo, { headers }),
        ]);

        const parseJson = async (_label: string, result: PromiseSettledResult<Response>) => {
          if (result.status !== 'fulfilled' || !result.value.ok) {
            return [];
          }
          const data = await result.value.json();
          const list: Record<string, unknown>[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? (data.data as Record<string, unknown>[]) : [];
          return list.map(extractIdAndName).filter((item): item is SelectListItem => item !== null);
        };

        const [projectHeadResult, statusResult, policyProgramResult, budgetResult, clientResult, projectTypeResult, departmentResult, expenseInfoResult] = results;
        const [projectHeadData, statusData, policyProgramData, budgetData, clientData, projectTypeData, departmentData, expenseInfoData] =
          await Promise.all([
            parseJson('projectHead', projectHeadResult),
            parseJson('status', statusResult),
            parseJson('policyProgram', policyProgramResult),
            parseJson('budget', budgetResult),
            parseJson('client', clientResult),
            parseJson('projectType', projectTypeResult),
            parseJson('department', departmentResult),
            parseJson('expenseInfo', expenseInfoResult),
          ]);

        setProjectHeadOptions(mapToSelectOptions(projectHeadData));
        setStatusOptions(mapToSelectOptions(statusData));
        setPolicyProgramOptions(mapToSelectOptions(policyProgramData));
        setBudgetOptions(mapToSelectOptions(budgetData));
        setClientOptions(mapToSelectOptions(clientData));
        setProjectTypeOptions(mapToSelectOptions(projectTypeData));
        setDepartmentOptions(mapToSelectOptions(departmentData));
        setExpenseInfoOptions(mapToSelectOptions(expenseInfoData));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load options';
        setOptionsError(msg);
      } finally {
        setOptionsLoading(false);
      }
    }, []);

    useEffect(() => {
      if (open) {
        fetchOptions();
        setSelectedFileName('');
      }
    }, [open, fetchOptions]);

    useEffect(() => {
      if (open && editingProject) {
        const projectHeadId = projectHeadOptions.find(o => o.label === editingProject.ProjectHeadEmpName)?.value;
        const statusId = statusOptions.find(o => o.label === editingProject.WorkStatusName)?.value;
        const clientId = clientOptions.find(o => o.label === editingProject.ProjectHeadEmpName)?.value;
        const projectTypeId = projectTypeOptions.find(o => o.label === editingProject.ProjectTypeName)?.value;
        const priorityValue = editingProject.PriorityName ? editingProject.PriorityName.toLowerCase() : 'medium';

        form.setFieldsValue({
          projectName: editingProject.ProjectName,
          projectHeadName: projectHeadId || editingProject.ProjectHeadEmpName,
          startDate: editingProject.StartDate,
          projectDuration: editingProject.ProjectDuration,
          description: editingProject.Description,
          priority1: priorityValue,
          totalBudget: editingProject.TotalBudget,
          statusName: statusId || editingProject.WorkStatusName,
          policyAndProgram: editingProject.PolicyProgramIDs,
          budget: editingProject.BudgetInfoIDs,
          clientName: clientId || editingProject.ProjectHeadEmpName,
          projectType: projectTypeId || editingProject.ProjectTypeName,
          department: String(editingProject.DepartmentID),
          expenseInfo: String(editingProject.ExpenseInfoID),
          bankGuaranteeIssueDate: editingProject.BankGuranteeIssueDate,
          bankGuaranteeExpiryDate: editingProject.BankGuranteeExpiryDate,
        });
      } else if (open && !editingProject) {
        form.resetFields();
      }
    }, [open, editingProject, form, projectHeadOptions, statusOptions, clientOptions, projectTypeOptions]);

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

        const priorityMap: Record<string, number> = {
          high: 3,
          medium: 2,
          low: 1,
        };

        const body = {
          ProjectInfoID: projectId,
          ProjectName: values.projectName,
          ProjectDuration: values.projectDuration,
          StartDate: values.startDate?.replace(/\//g, '-'),
          Description: values.description,
          TotalBudget: values.totalBudget,
          Priority: priorityMap[values.priority1] || 2,
          WorkStatusID: Number(values.statusName),
          PolicyProgramIDs: values.policyAndProgram,
          PolicyProgramIDArray: values.policyAndProgram ? [values.policyAndProgram] : [],
          BudgetInfoIDs: values.budget,
          BudgetInfoIDArray: values.budget ? [values.budget] : [],
          ClientInfoID: Number(values.clientName),
          DepartmentID: values.department ? Number(values.department) : 0,
          ExpenseInfoID: Number(values.expenseInfo),
          ProjectType: Number(values.projectType),
          ProjectHeadEmpID: Number(values.projectHeadName),
          BankGuranteeIssueDate: values.bankGuaranteeIssueDate?.replace(/\//g, '-'),
          BankGuranteeExpiryDate: values.bankGuaranteeExpiryDate?.replace(/\//g, '-'),
          IsPolicyRelated: values.policyAndProgram ? 1 : 0,
        };

        const API_URL = `${API_BASE}/SaveProjectInfo`;
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

        message.success(isEdit ? 'परियोजना सफलतापूर्वक अपडेट गरियो' : 'परियोजना सफलतापूर्वक सिर्जना गरियो');
        form.resetFields();
        setSelectedFileName('');
        onSuccess();
        onClose();
      } catch (err) {
        if (err instanceof Error) {
          message.error(err.message || 'परियोजना प्रविष्टि असफल भयो');
        }
      } finally {
        setLoading(false);
      }
    };

    const getPopupParent = (triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement;

    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
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
            {optionsError && (
              <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
                <strong>डाटा लोड गर्न असफल:</strong> {optionsError}
              </div>
            )}
            <Form
              form={form}
              layout="vertical"
              size="small"
              requiredMark={false}
              validateTrigger={['onBlur']}
            >
              <Row gutter={12}>
                <Col span={24}>
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        परियोजनाको नाम
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
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
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        परियोजना प्रमुख नाम
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
                    name="projectHeadName"
                    rules={[{ required: true, message: 'कृपया छनौट गर्नुहोस्' }]}
                  >
                    <Select
                      placeholder=""
                      options={projectHeadOptions}
                      className="rounded-md h-9 text-xs"
                      loading={optionsLoading}
                      getPopupContainer={getPopupParent}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        शुरू मिति
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
                    name="startDate"
                    rules={[{ required: true, message: 'कृपया शुरू मिति प्रविष्ट गर्नुहोस्' }]}
                  >
                    <NepaliDatePicker placeholder="YYYY/MM/DD" className="text-xs" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        परियोजना अवधि
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
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
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        विवरण
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
                    name="description"
                    rules={[{ required: true, message: 'कृपया विवरण प्रविष्ट गर्नुहोस्' }]}
                  >
                    <Input.TextArea rows={3} className="rounded-md border-slate-300 text-xs" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        प्राथमिकता 1
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
                    name="priority1"
                    rules={[{ required: true, message: 'कृपया प्राथमिकता छनौट गर्नुहोस्' }]}
                  >
                    <Select
                      placeholder="--select--"
                      options={PRIORITY_OPTIONS}
                      className="rounded-md h-9 text-xs"
                      getPopupContainer={getPopupParent}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        कुल बजेट
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
                    name="totalBudget"
                    initialValue={0}
                    rules={[{ required: true, message: 'कृपया कुल बजेट प्रविष्ट गर्नुहोस्' }]}
                  >
                    <InputNumber className="w-full rounded-md border-slate-300 h-9 text-xs" min={0} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        स्थिति नाम
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
                    name="statusName"
                    rules={[{ required: true, message: 'कृपया स्थिति नाम चयन गर्नुहोस्' }]}
                  >
                    <Select
                      placeholder="कृपया स्थिति नाम चयन गर्नुहोस्"
                      options={statusOptions}
                      className="rounded-md h-9 text-xs"
                      loading={optionsLoading}
                      getPopupContainer={getPopupParent}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        नीति तथा कार्यक्रम
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
                    name="policyAndProgram"
                    rules={[{ required: true, message: 'कृपया विवरण प्रविष्ट गर्नुहोस्' }]}
                  >
                    <Select
                      placeholder="कृपया छनौट गर्नुहोस्"
                      options={policyProgramOptions}
                      className="rounded-md h-9 text-xs"
                      loading={optionsLoading}
                      getPopupContainer={getPopupParent}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        बजेट
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
                    name="budget"
                    rules={[{ required: true, message: 'कृपया बजेट प्रविष्ट गर्नुहोस्' }]}
                  >
                    <Select
                      placeholder="कृपया बजेट छनौट गर्नुहोस्"
                      options={budgetOptions}
                      className="rounded-md h-9 text-xs"
                      loading={optionsLoading}
                      getPopupContainer={getPopupParent}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        ग्राहकको नाम
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
                    name="clientName"
                    rules={[{ required: true, message: 'कृपया ग्राहकको नाम चयन गर्नुहोस्' }]}
                  >
                    <Select
                      placeholder="कृपया ग्राहकको नाम चयन गर्नुहोस्"
                      options={clientOptions}
                      className="rounded-md h-9 text-xs"
                      loading={optionsLoading}
                      getPopupContainer={getPopupParent}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        परियोजना प्रकार
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
                    name="projectType"
                    rules={[{ required: true, message: 'कृपया परियोजना प्रकार चयन गर्नुहोस्' }]}
                  >
                    <Select
                      placeholder="कृपया परियोजना प्रकार चयन गर्नुहोस्"
                      options={projectTypeOptions}
                      className="rounded-md h-9 text-xs"
                      loading={optionsLoading}
                      getPopupContainer={getPopupParent}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        विभाग
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
                    name="department"
                    initialValue=""
                    rules={[{ required: true, message: 'कृपया विभाग चयन गर्नुहोस्' }]}
                  >
                    <Select
                      placeholder="प्रशासन विभाग"
                      allowClear
                      options={departmentOptions}
                      className="rounded-md h-9 text-xs"
                      loading={optionsLoading}
                      getPopupContainer={getPopupParent}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        खर्च जानकारी
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
                    name="expenseInfo"
                    rules={[{ required: true, message: 'कृपया खर्च चयन गर्नुहोस्' }]}
                  >
                    <Select
                      placeholder="कृपया खर्च चयन गर्नुहोस्"
                      options={expenseInfoOptions}
                      className="rounded-md h-9 text-xs"
                      loading={optionsLoading}
                      getPopupContainer={getPopupParent}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        Bank Guarantee Issue Date
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
                    name="bankGuaranteeIssueDate"
                    rules={[{ required: true, message: 'कृपया मिति प्रविष्ट गर्नुहोस्' }]}
                  >
                    <NepaliDatePicker placeholder="YYYY/MM/DD" className="text-xs" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        Bank Guarantee Expiry Date
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
                    name="bankGuaranteeExpiryDate"
                    rules={[{ required: true, message: 'कृपया मिति प्रविष्ट गर्नुहोस्' }]}
                  >
                    <NepaliDatePicker placeholder="YYYY/MM/DD" className="text-xs" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-slate-700">
                        File Upload
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    }
                    name="fileUpload"
                    // rules={[{ required: true, message: 'कृपया फाइल अपलोड गर्नुहोस्' }]}
                  >
                    <div className="flex items-center gap-2">
                      <div className="bg-[#e5e7eb] text-slate-700 px-3 py-1.5 rounded-md text-xs min-w-[120px] truncate border border-slate-300">
                        {selectedFileName || 'Upload here'}
                      </div>
                      <label className="bg-[#6b7280] hover:bg-[#4b5563] text-white px-4 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors shadow-sm">
                        Browse
                        <input type="file" className="hidden" onChange={handleFileChange} />
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
    );
  }
);

ModalContent.displayName = 'ModalContent';

export default function ProjectFormModal({
  open,
  onClose,
  onSuccess,
  editingProject,
}: ProjectFormModalProps) {
  if (!open) return null;

  if (typeof document !== 'undefined') {
    return createPortal(
      <ModalContent
        open={open}
        onClose={onClose}
        onSuccess={onSuccess}
        editingProject={editingProject}
      />,
      document.body
    );
  }
  return null;
}