'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Select, Upload, Button, Row, Col, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Employee } from '@/lib/employees-data';
import { apiCall } from '@/lib/api';
import Drawer from '@/components/drawer';
import AntdNepaliDatePicker from '@/components/AntdNepaliDatePicker';
import ProgressBar from '@/components/ui/ProgressBar';

interface EmployeeSetupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (employee?: Employee) => void;
  editingEmployee?: Employee | null;
}

const GENDER_OPTIONS = [
  { value: 1, label: 'Male' },
  { value: 2, label: 'Female' },
  { value: 3, label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 1, label: 'सक्रिय (Active)' },
  { value: 2, label: 'निलम्बित (Suspend)' },
  { value: 3, label: 'पेन्डिङ (Pending)' },
];

interface OrgOfficeItem {
  OrganizationOfficeID: number;
  OrganizationOfficeName: string;
}

interface DepartmentItem {
  DepartmentInfoID: number;
  DepartmentName: string;
}

interface MainBranchItem {
  MainBranchID: number;
  MainBranchName: string;
  DepartmentID: number;
}

interface BranchItem {
  BranchID: number;
  BranchName: string;
  MainBranchID: number;
  DepartmentID: number;
}

export default function EmployeeSetupModal({
  open,
  onClose,
  onSuccess,
  editingEmployee,
}: EmployeeSetupModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const [orgOffices, setOrgOffices] = useState<OrgOfficeItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [mainBranches, setMainBranches] = useState<MainBranchItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [fetchingData, setFetchingData] = useState(false);

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedMainBranchId, setSelectedMainBranchId] = useState<number | null>(null);

  const getPopupParent = (triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement;

  const isEdit = !!editingEmployee;

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

   const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

   // Initialize and load data sequence
   useEffect(() => {
     if (!open) return;

     let isMounted = true;

     const initializeModal = async () => {
       setFetchingData(true);
       try {
        const [resOrg, resDept, resMB, resBranch] = await Promise.all([
          apiCall(`${API_BASE}/OrganizationOffice/SelectList`),
          apiCall(`${API_BASE}/Department/SelectList`),
          apiCall(`${API_BASE}/MainBranch/SelectList`),
          apiCall(`${API_BASE}/Branch/SelectList`),
        ]);

        const orgData = resOrg.ok ? await resOrg.json() : [];
        const deptData = resDept.ok ? await resDept.json() : [];
        const mbData = resMB.ok ? await resMB.json() : [];
        const branchData = resBranch.ok ? await resBranch.json() : [];

        if (!isMounted) return;

        setOrgOffices(orgData);
        setDepartments(deptData);
        setMainBranches(mbData);
        setBranches(branchData);

        if (editingEmployee) {
          const parseValidId = (val: string | number | null | undefined) => {
            if (!val) return undefined;
            const num = Number(val);
            return isNaN(num) || num === 0 ? undefined : num;
          };

          const deptId = parseValidId(editingEmployee.DepartmentID);
          const mainBranchId = parseValidId(editingEmployee.MainBranchID);
          const branchId = parseValidId(editingEmployee.BranchID);
          const orgOfficeId = parseValidId(editingEmployee.OrganizationOfficeID);

          setSelectedDepartmentId(deptId ?? null);
          setSelectedMainBranchId(mainBranchId ?? null);

          form.setFieldsValue({
            Fullname: editingEmployee.Fullname || '',
            Address: editingEmployee.Address || '',
            Phone: editingEmployee.Phone || '',
            Email: editingEmployee.Email || '',
            Gender: parseValidId(editingEmployee.Gender) ?? 1,
            DOB: editingEmployee.DOB || undefined,
            OrganizationOfficeID: orgOfficeId,
            DepartmentID: deptId,
            MainBranchID: mainBranchId,
            BranchID: branchId,
            EmployeeStatus: parseValidId(editingEmployee.EmpStatus) ?? 1,
            Username: '',
            Password: '',
            confirmPassword: '',
          });
        } else {
          form.resetFields();
          setSelectedDepartmentId(null);
          setSelectedMainBranchId(null);
        }
      } catch (err) {
        if (err instanceof Error) message.error(err.message);
      } finally {
        if (isMounted) setFetchingData(false);
      }
    };

    initializeModal();

    return () => {
      isMounted = false;
    };
  }, [open, editingEmployee, form]);

  const orgOfficeOptions = orgOffices.map((item) => ({
    value: Number(item.OrganizationOfficeID),
    label: item.OrganizationOfficeName,
  }));

  const departmentOptions = departments.map((item) => ({
    value: Number(item.DepartmentInfoID),
    label: item.DepartmentName,
  }));

  if (
    editingEmployee?.DepartmentID &&
    Number(editingEmployee.DepartmentID) !== 0 &&
    !departmentOptions.some((opt) => opt.value === Number(editingEmployee.DepartmentID))
  ) {
    departmentOptions.push({
      value: Number(editingEmployee.DepartmentID),
      label: editingEmployee.DepartmentName || `Department ${editingEmployee.DepartmentID}`,
    });
  }

  const filteredMainBranchOptions = mainBranches
    .filter((item) => {
      if (!selectedDepartmentId) return true;
      if (Number(item.DepartmentID) === Number(selectedDepartmentId)) return true;
      if (editingEmployee && Number(item.MainBranchID) === Number(editingEmployee.MainBranchID)) {
        return true;
      }
      return false;
    })
    .map((item) => ({
      value: Number(item.MainBranchID),
      label: item.MainBranchName,
    }));

  if (
    editingEmployee?.MainBranchID &&
    Number(editingEmployee.MainBranchID) !== 0 &&
    !filteredMainBranchOptions.some((opt) => opt.value === Number(editingEmployee.MainBranchID))
  ) {
    filteredMainBranchOptions.push({
      value: Number(editingEmployee.MainBranchID),
      label: editingEmployee.MainBranchName || `Main Branch ${editingEmployee.MainBranchID}`,
    });
  }

  const filteredBranchOptions = branches
    .filter((item) => {
      if (!selectedMainBranchId) return true;
      if (Number(item.MainBranchID) === Number(selectedMainBranchId)) return true;
      if (editingEmployee && Number(item.BranchID) === Number(editingEmployee.BranchID)) {
        return true;
      }
      return false;
    })
    .map((item) => ({
      value: Number(item.BranchID),
      label: item.BranchName,
    }));

  if (
    editingEmployee?.BranchID &&
    Number(editingEmployee.BranchID) !== 0 &&
    !filteredBranchOptions.some((opt) => opt.value === Number(editingEmployee.BranchID))
  ) {
    filteredBranchOptions.push({
      value: Number(editingEmployee.BranchID),
      label: editingEmployee.BranchName || `Branch ${editingEmployee.BranchID}`,
    });
  }

  const handleDepartmentChange = (value: number) => {
    setSelectedDepartmentId(value);
    setSelectedMainBranchId(null);
    form.setFieldsValue({
      DepartmentID: value,
      MainBranchID: undefined,
      BranchID: undefined,
    });
  };

  const handleMainBranchChange = (value: number) => {
    setSelectedMainBranchId(value);
    form.setFieldsValue({
      MainBranchID: value,
      BranchID: undefined,
    });
  };

  const handleSubmit = async () => {
       try {
         const values = await form.validateFields();
         setLoading(true);

         const employeeId = isEdit ? Number(editingEmployee?.EmployeeInfoID) : 0;

         const selectedDept = departments.find((d) => Number(d.DepartmentInfoID) === Number(values.DepartmentID));
         const selectedMainBranch = mainBranches.find((mb) => Number(mb.MainBranchID) === Number(values.MainBranchID));
         const selectedBranch = branches.find((b) => Number(b.BranchID) === Number(values.BranchID));

         const body: Record<string, unknown> = {
           EmployeeInfoID: employeeId,
           Fullname: values.Fullname,
           Address: values.Address || '',
           Phone: values.Phone || '',
           Email: values.Email || '',
           Gender: values.Gender || 1,
            DOB: values.DOB ? values.DOB.replace(/\//g, '-') : '',
           OrganizationOfficeID: values.OrganizationOfficeID || 1,
           DepartmentID: values.DepartmentID || 0,
           DepartmentName: selectedDept ? selectedDept.DepartmentName : '',
           BranchID: values.BranchID || 0,
           BranchName: selectedBranch ? selectedBranch.BranchName : '',
           MainBranchID: values.MainBranchID || 0,
           MainBranchName: selectedMainBranch ? selectedMainBranch.MainBranchName : '',
           Photo: '',
           EmpStatus: values.EmployeeStatus || 1,
         };

         if (isEdit) {
           if (values.Username) body.Username = values.Username;
           if (values.Password) body.Password = values.Password;
         } else {
           body.Username = values.Username || '';
           body.Password = values.Password || '';
           body.ConfirmPassword = values.confirmPassword || '';
         }

           const res = await apiCall(`${API_BASE}/SaveEmployeeInfo`, {
            method: 'POST',
            body: JSON.stringify(body),
          });

        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

        const json = await res.json();
        const successFlag = json.Success ?? json.success;
        const messageText = json.Message ?? json.message;
        if (successFlag === false) {
          throw new Error(messageText || 'Failed. Check the payload or permissions.');
        }

        let savedEmployee: Employee | undefined;
        try {
          savedEmployee = json.Data ?? json.data ?? json;
        } catch {
          // fallback
        }

        message.success(
          isEdit ? 'कर्मचारी विवरण सफलतापूर्वक अपडेट गरियो' : 'कर्मचारी विवरण सफलतापूर्वक सुरक्षित गरियो'
        );
       form.resetFields();
       setFileList([]);
       setSelectedDepartmentId(null);
       setSelectedMainBranchId(null);
       onClose();
       onSuccess(savedEmployee);
     } catch (err) {
       if (err instanceof Error) {
         message.error(
           err.message ||
             (isEdit
               ? 'कर्मचारी विवरण अपडेट गर्न असफल भयो'
               : 'कर्मचारी विवरण सुरक्षित गर्न असफल भयो')
         );
       }
     } finally {
       setLoading(false);
     }
  };

  const resetAndClose = () => {
    setFileList([]);
    setSelectedDepartmentId(null);
    setSelectedMainBranchId(null);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={resetAndClose}
      title="Employee Setup Form"
      width={760}
    >
      <Form
        key={editingEmployee ? editingEmployee.EmployeeInfoID : 'new'}
        form={form}
        layout="vertical"
        size="middle"
        requiredMark={false}
        autoComplete="off"
        className="employee-setup-form"
        onValuesChange={(changedValues) => {
          if ('Password' in changedValues) {
            setPasswordStrength(calculatePasswordStrength(changedValues.Password || ''));
          }
        }}
      >
        <Row gutter={12}>
          <Col span={12}>
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">पुरा नाम<span className="text-red-500 ml-0.5">*</span></span>}
                name="Fullname"
                rules={[{ required: true, message: 'कृपया पुरा नाम प्रविष्ट गर्नुहोस्' }]}
              >
                <Input className="rounded-md" />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">ठेगाना<span className="text-red-500 ml-0.5">*</span></span>}
                name="Address"
                rules={[{ required: true, message: 'कृपया ठेगाना प्रविष्ट गर्नुहोस्' }]}
              >
                <Input className="rounded-md" />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">फोन<span className="text-red-500 ml-0.5">*</span></span>}
                name="Phone"
                rules={[{ required: true, message: 'कृपया फोन नं प्रविष्ट गर्नुहोस्' }]}
              >
                <Input className="rounded-md" />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">इमेल<span className="text-red-500 ml-0.5">*</span></span>}
                name="Email"
                rules={[
                  { required: true, message: 'कृपया इमेल प्रविष्ट गर्नुहोस्' },
                  { type: 'email', message: 'मान्य इमेल प्रविष्ट गर्नुहोस्' },
                ]}
              >
                <Input className="rounded-md" />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">लिङ्ग<span className="text-red-500 ml-0.5">*</span></span>}
                name="Gender"
                rules={[{ required: true, message: 'कृपया लिङ्ग चयन गर्नुहोस्' }]}
              >
                <Select placeholder="चयन गर्नुहोस्" options={GENDER_OPTIONS} className="rounded-md" getPopupContainer={getPopupParent} />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">डी ओ बी<span className="text-red-500 ml-0.5">*</span></span>}
                name="DOB"
                rules={[{ required: true, message: 'कृपया जन्म मिति चयन गर्नुहोस्' }]}
              >
                 <AntdNepaliDatePicker placeholder="YYYY/MM/DD" className="w-full" returnEnglishDate />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">फोटो<span className="text-red-500 ml-0.5">*</span></span>}
                name="Photo"
              >
                <Upload
                  fileList={fileList}
                  beforeUpload={() => false}
                  onChange={({ fileList }) => setFileList(fileList)}
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />} className="rounded-md border-slate-300 text-sm h-8">
                    फोटो अपलोड गर्नुहोस्
                  </Button>
                </Upload>
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">कर्मचारी स्थिति<span className="text-red-500 ml-0.5">*</span></span>}
                name="EmployeeStatus"
                rules={[{ required: true, message: 'कृपया स्थिति चयन गर्नुहोस्' }]}
              >
                <Select placeholder="चयन गर्नुहोस्" options={STATUS_OPTIONS} className="rounded-md" getPopupContainer={getPopupParent} />
              </Form.Item>
            </div>
          </Col>

          <Col span={12} className="flex flex-col gap-3">
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">Organization Offce<span className="text-red-500 ml-0.5">*</span></span>}
                name="OrganizationOfficeID"
                rules={[{ required: true, message: 'Please select organization office' }]}
              >
                <Select
                  placeholder="Select Office"
                  options={orgOfficeOptions}
                  className="rounded-md"
                  loading={fetchingData}
                  allowClear
                  getPopupContainer={getPopupParent}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">विभागको नाम<span className="text-red-500 ml-0.5">*</span></span>}
                name="DepartmentID"
                rules={[{ required: true, message: 'कृपया विभाग चयन गर्नुहोस्' }]}
              >
                <Select
                  placeholder="विभाग चयन गर्नुहोस्"
                  options={departmentOptions}
                  className="rounded-md"
                  loading={fetchingData}
                  onChange={handleDepartmentChange}
                  allowClear
                  getPopupContainer={getPopupParent}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">मुख्य शाखा<span className="text-red-500 ml-0.5">*</span></span>}
                name="MainBranchID"
                rules={[{ required: true, message: 'कृपयामहाशाखा चयन गर्नुहोस्' }]}
              >
                <Select
                  placeholder="मुख्य शाखा चयन गर्नुहोस्"
                  options={filteredMainBranchOptions}
                  className="rounded-md"
                  loading={fetchingData}
                  onChange={handleMainBranchChange}
                  allowClear
                  getPopupContainer={getPopupParent}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">शाखा<span className="text-red-500 ml-0.5">*</span></span>}
                name="BranchID"
                rules={[{ required: true, message: 'कृपया शाखा चयन गर्नुहोस्' }]}
              >
                <Select
                  placeholder="शाखा चयन गर्नुहोस्"
                  options={filteredBranchOptions}
                  className="rounded-md"
                  loading={fetchingData}
                  allowClear
                  getPopupContainer={getPopupParent}
                />
              </Form.Item>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2 flex-1">
              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">प्रयोगकर्ता नाम<span className="text-red-500 ml-0.5">*</span></span>}
                name="Username"
                rules={isEdit ? [] : [{ required: true, message: 'कृपया प्रयोगकर्ता नाम प्रविष्ट गर्नुहोस्' }]}
              >
                <Input className="rounded-md" autoComplete="off" />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">पासवर्ड<span className="text-red-500 ml-0.5">*</span></span>}
                name="Password"
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
                <Input.Password className="rounded-md" autoComplete="new-password" />
              </Form.Item>
              {!isEdit && passwordStrength > 0 && (
                <div className="mb-2">
                  <ProgressBar value={passwordStrength} color={passwordStrength >= 70 ? '#10B981' : passwordStrength >= 40 ? '#F59E0B' : '#EF4444'} />
                </div>
              )}

              {!isEdit && (
                <Form.Item
                  label={<span className="text-slate-700 font-semibold text-[13px]">पासवर्ड सुनिश्चित गर्नुहोस्<span className="text-red-500 ml-0.5">*</span></span>}
                  name="confirmPassword"
                  dependencies={['Password']}
                  rules={[
                    { required: true, message: 'कृपया पासवर्ड पुनः प्रविष्ट गर्नुहोस्' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('Password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('पासवर्ड मिलेन'));
                      },
                    }),
                  ]}
                >
                  <Input.Password className="rounded-md" autoComplete="new-password" />
                </Form.Item>
              )}
            </div>
          </Col>
        </Row>
      </Form>

      <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border/50">
        <Button
          type="text"
          onClick={resetAndClose}
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
          सुरक्षित गर्नुहोस्
        </Button>
      </div>
    </Drawer>
  );
}
