'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Modal, Form, Input, Select, DatePicker, Upload, Button, Row, Col, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Employee } from '@/lib/employees-data';

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

  const [fetchingData, setFetchingData] = useState(false);

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedMainBranchId, setSelectedMainBranchId] = useState<number | null>(null);

  const isEdit = !!editingEmployee;

  // Initialize and load data sequence
  useEffect(() => {
    if (!open) return;

    let isMounted = true;

    const initializeModal = async () => {
      setFetchingData(true);
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const [resOrg, resDept, resMB, resBranch] = await Promise.all([
          fetch('https://datacollection.kathmandu.gov.np:8080/OrganizationOffice/SelectList', { headers }),
          fetch('https://datacollection.kathmandu.gov.np:8080/Department/SelectList', { headers }),
          fetch('https://datacollection.kathmandu.gov.np:8080/MainBranch/SelectList', { headers }),
          fetch('https://datacollection.kathmandu.gov.np:8080/Branch/SelectList', { headers }),
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
          // Helper to safely parse numbers and return undefined if 0/null/empty so input stays blank
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
            DOB: editingEmployee.DOB ? dayjs(editingEmployee.DOB, ['YYYY/M/D', 'YYYY-MM-DD']) : null,
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

  // Option lists with label protection
  const orgOfficeOptions = orgOffices.map((item) => ({
    value: Number(item.OrganizationOfficeID),
    label: item.OrganizationOfficeName,
  }));

  const departmentOptions = departments.map((item) => ({
    value: Number(item.DepartmentInfoID),
    label: item.DepartmentName,
  }));

  // Preserve named fallback for Department if not in main list
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

  // Filter Main Branches with Edit Mode fallback
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

  // Filter Branches with Edit Mode fallback
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

      const token = localStorage.getItem('token');
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
        DOB: values.DOB ? values.DOB.format('YYYY-MM-DD') : '',
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

      const res = await fetch('https://datacollection.kathmandu.gov.np:8080/SaveEmployeeInfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

      let savedEmployee: Employee | undefined;
      try {
        savedEmployee = await res.json();
      } catch {
        // Fallback for non-JSON responses
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

  return (
    <Modal
      open={open}
      destroyOnClose
      title={
        <div className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3">
          Employee Setup Form
        </div>
      }
      onCancel={() => {
        setFileList([]);
        setSelectedDepartmentId(null);
        setSelectedMainBranchId(null);
        onClose();
      }}
      centered
      width={760}
      footer={
        <div className="flex justify-end items-center gap-3 pt-2">
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            className="bg-emerald-500 hover:!bg-emerald-600 border-none px-5 rounded-md font-medium h-9 text-white"
          >
            सुरक्षित गर्नुहोस्
          </Button>
          <Button
            type="text"
            onClick={onClose}
            className="text-sky-500 hover:!text-sky-600 font-medium h-9 px-4"
          >
            Cancel
          </Button>
        </div>
      }
      styles={{
        body: { paddingTop: 12, paddingBottom: 8, background: '#fff' },
        header: { background: '#fff', paddingBottom: 0 },
        content: { background: '#fff' },
      }}
    >
      <Form
        key={editingEmployee ? editingEmployee.EmployeeInfoID : 'new'}
        form={form}
        layout="vertical"
        size="middle"
        requiredMark={false}
        autoComplete="off"
        className="employee-setup-form"
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
                <Select placeholder="चयन गर्नुहोस्" options={GENDER_OPTIONS} className="rounded-md" />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">डी ओ बी<span className="text-red-500 ml-0.5">*</span></span>}
                name="DOB"
                rules={[{ required: true, message: 'कृपया जन्म मिति चयन गर्नुहोस्' }]}
              >
                <DatePicker className="w-full rounded-md" />
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
                  <Button icon={<UploadOutlined />} className="rounded-md border-slate-300 text-xs h-8">
                    फोटो अपलोड गर्नुहोस्
                  </Button>
                </Upload>
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">कर्मचारी स्थिति<span className="text-red-500 ml-0.5">*</span></span>}
                name="EmployeeStatus"
                rules={[{ required: true, message: 'कृपया स्थिति चयन गर्नुहोस्' }]}
              >
                <Select placeholder="चयन गर्नुहोस्" options={STATUS_OPTIONS} className="rounded-md" />
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
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">मुख्य शाखा<span className="text-red-500 ml-0.5">*</span></span>}
                name="MainBranchID"
                rules={[{ required: true, message: 'कृपया मुख्य शाखा चयन गर्नुहोस्' }]}
              >
                <Select
                  placeholder="मुख्य शाखा चयन गर्नुहोस्"
                  options={filteredMainBranchOptions}
                  className="rounded-md"
                  loading={fetchingData}
                  onChange={handleMainBranchChange}
                  allowClear
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
                        { min: 6, message: 'पासवर्ड कम्तिमा ६ अंकको हुनुपर्छ' },
                      ]
                }
              >
                <Input.Password className="rounded-md" autoComplete="new-password" />
              </Form.Item>

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
    </Modal>
  );
}