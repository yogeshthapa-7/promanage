'use client';

import { useState, useEffect, memo, useCallback, useRef } from 'react';
import { Form, Input, Select, InputNumber, Row, Col, Button, message } from 'antd';
import { Save } from 'lucide-react';
import Drawer from '@/components/drawer';
import AntdNepaliDatePicker from '@/components/AntdNepaliDatePicker';
import type { ApiProject } from '@/lib/projects-data';
import { apiCall } from '@/lib/api';

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
  ward: `${API_BASE}/WardInfo/SelectList`,
};

const mapToSelectOptions = (items: SelectListItem[]): { value: string; label: string }[] => {
  return items.map((item) => ({
    value: String(item.id),
    label: item.name,
  }));
};

const extractIdAndName = (obj: Record<string, unknown>): SelectListItem | null => {
  // Handle standard Value/Name format
  if (obj.Value !== undefined && obj.Name !== undefined) {
    return { id: Number(obj.Value), name: String(obj.Name) };
  }

  const idSuffixes = ['id', 'ID', 'Id', 'InfoID', 'Code', 'code', 'Key'];
  const nameSuffixes = ['name', 'Name', 'title', 'Title', 'fullname', 'Fullname', 'label', 'Label', 'Number', 'number'];

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
  {value: 1, label: 'Urgent'},
  { value: 2, label: 'High' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'Low' },
];

const DrawerContent = memo(
  ({ open, onClose, onSuccess, editingProject }: ProjectFormModalProps) => {
    const [form] = Form.useForm();
    const abortControllerRef = useRef<AbortController | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const [projectHeadEmpPhoto, setProjectHeadEmpPhoto] = useState<string>('');
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [optionsError, setOptionsError] = useState<string | null>(null);

    const [projectHeadOptions, setProjectHeadOptions] = useState<{ value: string; label: string }[]>([]);
    const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([]);
    const [policyProgramOptions, setPolicyProgramOptions] = useState<{ value: string; label: string }[]>([]);
    const [budgetOptions, setBudgetOptions] = useState<{ value: string; label: string }[]>([]);
    const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([]);
    const [editingClientName, setEditingClientName] = useState<string>('');

    useEffect(() => {
      if (open && editingProject?.ClientInfoID && clientOptions.length > 0) {
        const clientId = String(editingProject.ClientInfoID);
        const exists = clientOptions.some(o => o.value === clientId);
        if (!exists) {
          let cancelled = false;
          const fetchAndAddClient = async () => {
            try {
              const res = await apiCall(`${API_BASE}/ClientInfo/SelectList`);
              if (!res.ok) return;
              const data = await res.json();
              const list: Record<string, unknown>[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? (data.data as Record<string, unknown>[]) : [];
              const client = list.find((item: any) => String(item.Value || item.ClientInfoID) === clientId);
              if (!cancelled && client) {
                setClientOptions(prev => [...prev, { 
                  value: String(client.Value || client.ClientInfoID), 
                  label: String(client.Name || '') 
                }]);
              }
            } catch (err) {
              console.error('Failed to fetch client:', err);
            }
          };
          fetchAndAddClient();
          return () => { cancelled = true; };
        }
      }
    }, [open, editingProject?.ClientInfoID, clientOptions]);

    const [projectTypeOptions, setProjectTypeOptions] = useState<{ value: string; label: string }[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<{ value: string; label: string }[]>([]);
    const [expenseInfoOptions, setExpenseInfoOptions] = useState<{ value: string; label: string }[]>([]);
    const [wardOptions, setWardOptions] = useState<{ value: string; label: string }[]>([]);

    const isEdit = !!editingProject;

    const fetchOptions = useCallback(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setOptionsLoading(true);
      setOptionsError(null);
      try {
        const results = await Promise.allSettled([
          apiCall(SELECT_LIST_ENDPOINTS.projectHead),
          apiCall(SELECT_LIST_ENDPOINTS.status),
          apiCall(SELECT_LIST_ENDPOINTS.policyProgram),
          apiCall(SELECT_LIST_ENDPOINTS.budget),
          apiCall(SELECT_LIST_ENDPOINTS.client),
          apiCall(SELECT_LIST_ENDPOINTS.projectType),
          apiCall(SELECT_LIST_ENDPOINTS.department),
          apiCall(SELECT_LIST_ENDPOINTS.expenseInfo),
          apiCall(SELECT_LIST_ENDPOINTS.ward),
        ]);

        const parseJson = async (_label: string, result: PromiseSettledResult<Response>) => {
          if (result.status !== 'fulfilled' || !result.value.ok) {
            return [];
          }
          const data = await result.value.json();
          const list: Record<string, unknown>[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? (data.data as Record<string, unknown>[]) : [];
          return list.map(extractIdAndName).filter((item): item is SelectListItem => item !== null);
        };

        const [projectHeadResult, statusResult, policyProgramResult, budgetResult, clientResult, projectTypeResult, departmentResult, expenseInfoResult, wardResult] = results;
        const [projectHeadData, statusData, policyProgramData, budgetData, clientData, projectTypeData, departmentData, expenseInfoData, wardData] =
          await Promise.all([
            parseJson('projectHead', projectHeadResult),
            parseJson('status', statusResult),
            parseJson('policyProgram', policyProgramResult),
            parseJson('budget', budgetResult),
            parseJson('client', clientResult),
            parseJson('projectType', projectTypeResult),
            parseJson('department', departmentResult),
            parseJson('expenseInfo', expenseInfoResult),
            parseJson('ward', wardResult),
          ]);

        setProjectHeadOptions(mapToSelectOptions(projectHeadData));
        setStatusOptions(mapToSelectOptions(statusData));
        setPolicyProgramOptions(mapToSelectOptions(policyProgramData));
        setBudgetOptions(mapToSelectOptions(budgetData));
        setClientOptions(mapToSelectOptions(clientData));
        setProjectTypeOptions(mapToSelectOptions(projectTypeData));
        setDepartmentOptions(mapToSelectOptions(departmentData));
        setExpenseInfoOptions(mapToSelectOptions(expenseInfoData));
        setWardOptions(mapToSelectOptions(wardData));
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
      }
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, [open, fetchOptions]);

    useEffect(() => {
      if (open && editingProject) {
        const projectHeadId = projectHeadOptions.find(o => o.label === editingProject.ProjectHeadEmpName)?.value;
        const statusId = statusOptions.find(o => o.label === editingProject.WorkStatusName)?.value;
        const clientId = clientOptions.find(o => o.value === String(editingProject.ClientInfoID) || 
      o.label === (editingProject as any).ClientName)?.value;
        const projectTypeId = projectTypeOptions.find(o => o.label === editingProject.ProjectTypeName)?.value;
        const priorityValue = editingProject.PriorityName ? ({ urgent: 1, high: 2, medium: 3, low: 4 }[editingProject.PriorityName.toLowerCase()] ?? 3) : 3;

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
          ClientName: clientId || (editingProject as any).ClientName || '',
          projectType: projectTypeId || editingProject.ProjectTypeName,
          department: String(editingProject.DepartmentID),
          expenseInfo: String(editingProject.ExpenseInfoID),
          bankGuaranteeIssueDate: editingProject.BankGuranteeIssueDate,
          bankGuaranteeExpiryDate: editingProject.BankGuranteeExpiryDate,
          projectHeadEmpPhoto: editingProject.ProjectHeadEmpPhoto,
        });
        setProjectHeadEmpPhoto(editingProject.ProjectHeadEmpPhoto || '');
        setSelectedFileName('');
      } else if (open && !editingProject) {
        form.resetFields();
        setProjectHeadEmpPhoto('');
        setSelectedFileName('');
      }
    }, [open, editingProject, form, projectHeadOptions, statusOptions, clientOptions, projectTypeOptions]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
       const file = e.target.files?.[0];
      if (file) {
        setSelectedFileName(file.name);
        const uploadFormData = new FormData();
        uploadFormData.append('Image', file);
        uploadFormData.append('UserId', '0');

        try {
          const uploadRes = await apiCall(`${API_BASE}/UploadFile`, {
            method: 'POST',
            body: uploadFormData,
          });

         if (!uploadRes.ok) throw new Error(`File upload failed: ${uploadRes.statusText}`);

          const uploadJson = await uploadRes.json();
          const basePath = uploadJson?.Data?.BasePath || '';
          const photoUrl = basePath ? `${API_BASE}/${basePath.replace(/^\/+/, '')}` : '';
          setProjectHeadEmpPhoto(photoUrl);
          form.setFieldValue('projectHeadEmpPhoto', photoUrl);
        } catch (err) {
          if (err instanceof Error) {
            message.error(err.message || 'Image upload failed');
          }
        }
      }
    };

    const handleSubmit = async () => {
       try {
         const values = await form.validateFields();
         setLoading(true);

         const projectId = isEdit && editingProject ? Number(editingProject.ProjectInfoID) : 0;

         const formPhoto = form.getFieldValue('projectHeadEmpPhoto');
         const photoUrl = formPhoto || projectHeadEmpPhoto || '';

         const body = {
           ProjectInfoID: projectId,
           ProjectName: values.projectName,
           ProjectDuration: values.projectDuration,
           StartDate: values.startDate || '',
           Description: values.description,
           TotalBudget: values.totalBudget,
           Priority: values.priority1 ? Number(values.priority1) : 2,
           WorkStatusID: isNaN(Number(values.statusName)) ? (editingProject?.WorkStatusID || 0) : Number(values.statusName),
           PolicyProgramIDs: values.policyAndProgram,
           PolicyProgramIDArray: values.policyAndProgram ? [values.policyAndProgram] : [],
           BudgetInfoIDs: values.budget,
           BudgetInfoIDArray: values.budget ? [values.budget] : [],
           ClientInfoID: isNaN(Number(values.ClientName)) ? (editingProject?.ClientInfoID || 0) : Number(values.ClientName),
           DepartmentID: values.department ? Number(values.department) : 0,
            ExpenseInfoID: Number(values.expenseInfo),
            WardID: values.ward ? Number(values.ward) : 0,
           ProjectType: isNaN(Number(values.projectType)) ? (editingProject?.ProjectType || 0) : Number(values.projectType),
           ProjectHeadEmpID: isNaN(Number(values.projectHeadName)) ? (editingProject?.ProjectHeadEmpID || 0) : Number(values.projectHeadName),
           BankGuranteeIssueDate: values.bankGuaranteeIssueDate || '',
           BankGuranteeExpiryDate: values.bankGuaranteeExpiryDate || '',
           IsPolicyRelated: 0,
           ProjectHeadEmpPhoto: photoUrl,
         };

         const API_URL = `${API_BASE}/SaveProjectInfo`;
         const res = await apiCall(API_URL, {
           method: 'POST',
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
      <div className="space-y-4">
        {optionsError && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
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
          <fieldset className="border border-slate-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-slate-700 px-2">Basic Information</legend>
            <Row gutter={12}>
              <Col span={24}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
                      परियोजनाको नाम
                      <span className="text-red-500 ml-0.5">*</span>
                    </span>
                  }
                  name="projectName"
                  rules={[{ required: true, message: 'कृपया परियोजनाको नाम प्रविष्ट गर्नुहोस्' }]}
                >
                  <Input className="rounded-md border-slate-300 h-9 text-sm" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
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
                    className="rounded-md h-9 text-sm"
                    loading={optionsLoading}
                    getPopupContainer={getPopupParent}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
                      शुरू मिति
                      <span className="text-red-500 ml-0.5">*</span>
                    </span>
                  }
                  name="startDate"
                  rules={[{ required: true, message: 'कृपया शुरू मिति प्रविष्ट गर्नुहोस्' }]}
                >
                  <AntdNepaliDatePicker placeholder="YYYY/MM/DD" className="text-sm" returnEnglishDate />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
                      परियोजना अवधि
                      <span className="text-red-500 ml-0.5">*</span>
                    </span>
                  }
                  name="projectDuration"
                  initialValue={0}
                  rules={[{ required: true, message: 'कृपया अवधि प्रविष्ट गर्नुहोस्' }]}
                >
                  <InputNumber className="w-full rounded-md border-slate-300 h-9 text-sm" min={0} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={24}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
                      विवरण
                      <span className="text-red-500 ml-0.5">*</span>
                    </span>
                  }
                  name="description"
                  rules={[{ required: true, message: 'कृपया विवरण प्रविष्ट गर्नुहोस्' }]}
                >
                  <Input.TextArea rows={3} className="rounded-md border-slate-300 text-sm" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
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
                    className="rounded-md h-9 text-sm"
                    getPopupContainer={getPopupParent}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
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
                    className="rounded-md h-9 text-sm"
                    loading={optionsLoading}
                    getPopupContainer={getPopupParent}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
                      वडा
                      {/* <span className="text-red-500 ml-0.5">*</span> */}
                    </span>
                  }
                  name="ward"
                  // rules={[{ required: true, message: 'कृपया वडा चयन गर्नुहोस्' }]}
                >
                  <Select
                    placeholder="कृपया वडा चयन गर्नुहोस्"
                    options={wardOptions}
                    className="rounded-md h-9 text-sm"
                    loading={optionsLoading}
                    getPopupContainer={getPopupParent}
                  />
                </Form.Item>
              </Col>
            </Row>
          </fieldset>

          <fieldset className="border border-slate-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-slate-700 px-2">Financial Information</legend>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
                      कुल बजेट
                      <span className="text-red-500 ml-0.5">*</span>
                    </span>
                  }
                  name="totalBudget"
                  initialValue={0}
                  rules={[{ required: true, message: 'कृपया कुल बजेट प्रविष्ट गर्नुहोस्' }]}
                >
                  <InputNumber className="w-full rounded-md border-slate-300 h-9 text-sm" min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
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
                    className="rounded-md h-9 text-sm"
                    loading={optionsLoading}
                    getPopupContainer={getPopupParent}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
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
                    className="rounded-md h-9 text-sm"
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
                    <span className="text-sm font-semibold text-slate-700">
                      ग्राहकको नाम
                      <span className="text-red-500 ml-0.5">*</span>
                    </span>
                  }
                  name="ClientName"
                  rules={[{ required: true, message: 'कृपया ग्राहकको नाम चयन गर्नुहोस्' }]}
                >
                  <Select
                    placeholder="कृपया ग्राहकको नाम चयन गर्नुहोस्"
                    options={clientOptions}
                    className="rounded-md h-9 text-sm"
                    loading={optionsLoading}
                    getPopupContainer={getPopupParent}
                  />
                </Form.Item>
              </Col>
            </Row>
          </fieldset>

          <fieldset className="border border-slate-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-slate-700 px-2">Project Details</legend>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
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
                    className="rounded-md h-9 text-sm"
                    loading={optionsLoading}
                    getPopupContainer={getPopupParent}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
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
                    className="rounded-md h-9 text-sm"
                    loading={optionsLoading}
                    getPopupContainer={getPopupParent}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
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
                    className="rounded-md h-9 text-sm"
                    loading={optionsLoading}
                    getPopupContainer={getPopupParent}
                  />
                </Form.Item>
              </Col>
            </Row>
          </fieldset>

          <fieldset className="border border-slate-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-slate-700 px-2">Bank Guarantee Information</legend>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
                      Bank Guarantee Issue Date
                      <span className="text-red-500 ml-0.5">*</span>
                    </span>
                  }
                  name="bankGuaranteeIssueDate"
                  rules={[{ required: true, message: 'कृपया मिति प्रविष्ट गर्नुहोस्' }]}
                >
                  <AntdNepaliDatePicker placeholder="YYYY/MM/DD" className="text-sm" returnEnglishDate />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
                      Bank Guarantee Expiry Date
                      <span className="text-red-500 ml-0.5">*</span>
                    </span>
                  }
                  name="bankGuaranteeExpiryDate"
                  rules={[{ required: true, message: 'कृपया मिति प्रविष्ट गर्नुहोस्' }]}
                >
                  <AntdNepaliDatePicker placeholder="YYYY/MM/DD" className="text-sm" returnEnglishDate />
                </Form.Item>
              </Col>
            </Row>
          </fieldset>

          <fieldset className="border border-slate-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-slate-700 px-2">Document</legend>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
                      File Upload
                      <span className="text-red-500 ml-0.5">*</span>
                    </span>
                  }
                  name="projectHeadEmpPhoto"
                  initialValue=""
                >
                  <input type="hidden" />
                </Form.Item>
                <div className="flex items-center gap-2">
                  <div className="bg-[#e5e7eb] text-slate-700 px-3 py-1.5 rounded-md text-sm min-w-[120px] truncate border border-slate-300">
                    {selectedFileName || 'Upload here'}
                  </div>
                  <label className="bg-[#6b7280] hover:bg-[#4b5563] text-white px-4 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors shadow-sm">
                    Browse
                    <input type="file" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </Col>
            </Row>
          </fieldset>
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
            className="bg-[#7C3AED] hover:!bg-[#6366F1] border-none px-5 py-1.5 h-auto text-sm rounded-md font-medium text-white flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            {isEdit ? 'अपडेट गर्नुहोस्' : 'सुरक्षित गर्नुहोस्'}
          </Button>
        </div>
      </div>
    );
  }
);

DrawerContent.displayName = 'DrawerContent';

export default function ProjectFormModal({
  open,
  onClose,
  onSuccess,
  editingProject,
}: ProjectFormModalProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editingProject ? 'Edit Project' : 'New Project'}
      subtitle={editingProject ? 'Update project details.' : 'Fill in the details to create a new project.'}
      width={640}
    >
      <DrawerContent
        open={open}
        onClose={onClose}
        onSuccess={onSuccess}
        editingProject={editingProject}
      />
    </Drawer>
  );
}
