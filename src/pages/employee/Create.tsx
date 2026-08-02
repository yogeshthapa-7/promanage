'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Modal, Form, Input, Select, DatePicker, Upload, Button, Row, Col, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Employee } from '@/lib/employees-data';
import { API_URL } from '@/lib/employees-data';

interface EmployeeSetupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (employee?: Employee) => void;
  editingEmployee?: Employee | null;
}

const GENDER_OPTIONS = [
  { value: 1, label: 'पुरुष (Male)' },
  { value: 2, label: 'महिला (Female)' },
  { value: 3, label: 'अन्य (Other)' },
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
  const [orgOfficesLoading, setOrgOfficesLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [mainBranchesLoading, setMainBranchesLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedMainBranchId, setSelectedMainBranchId] = useState<number | null>(null);
  const isEdit = !!editingEmployee;

  useEffect(() => {
    if (open) {
      fetchOrgOffices();
      fetchDepartments();
      fetchMainBranches();
      fetchBranches();
      setSelectedDepartmentId(null);
      setSelectedMainBranchId(null);
    }
  }, [open]);

  const fetchOrgOffices = async () => {
    setOrgOfficesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://datacollection.kathmandu.gov.np:8080/OrganizationOffice/SelectList', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch organization offices: ${res.statusText}`);
      const data: OrgOfficeItem[] = await res.json();
      setOrgOffices(data);
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    } finally {
      setOrgOfficesLoading(false);
    }
  };

  const fetchDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://datacollection.kathmandu.gov.np:8080/Department/SelectList', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch departments: ${res.statusText}`);
      const data: DepartmentItem[] = await res.json();
      setDepartments(data);
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const fetchMainBranches = async () => {
    setMainBranchesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://datacollection.kathmandu.gov.np:8080/MainBranch/SelectList', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch main branches: ${res.statusText}`);
      const data: MainBranchItem[] = await res.json();
      setMainBranches(data);
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    } finally {
      setMainBranchesLoading(false);
    }
  };

  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://datacollection.kathmandu.gov.np:8080/Branch/SelectList', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch branches: ${res.statusText}`);
      const data: BranchItem[] = await res.json();
      setBranches(data);
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    } finally {
      setBranchesLoading(false);
    }
  };

  const orgOfficeOptions = orgOffices.map((item) => ({
    value: item.OrganizationOfficeID,
    label: item.OrganizationOfficeName,
  }));

  const departmentOptions = departments.map((item) => ({
    value: item.DepartmentInfoID,
    label: item.DepartmentName,
  }));

  const filteredMainBranchOptions = mainBranches
    .filter((item) => !selectedDepartmentId || item.DepartmentID === selectedDepartmentId)
    .map((item) => ({
      value: item.MainBranchID,
      label: item.MainBranchName,
    }));

  const filteredBranchOptions = branches
    .filter((item) => !selectedMainBranchId || item.MainBranchID === selectedMainBranchId)
    .map((item) => ({
      value: item.BranchID,
      label: item.BranchName,
    }));

  useEffect(() => {
    if (open && editingEmployee) {
      setSelectedDepartmentId(editingEmployee.DepartmentID || null);
      setSelectedMainBranchId(editingEmployee.MainBranchID || null);
      form.setFieldsValue({
        Fullname: editingEmployee.Fullname,
        Address: editingEmployee.Address,
        Phone: editingEmployee.Phone,
        Email: editingEmployee.Email,
        Gender: editingEmployee.Gender,
        DOB: editingEmployee.DOB ? dayjs(editingEmployee.DOB) : null,
        DepartmentID: editingEmployee.DepartmentID,
        MainBranchID: editingEmployee.MainBranchID,
        BranchID: editingEmployee.BranchID,
        OrganizationOfficeID: editingEmployee.OrganizationOfficeID,
        EmployeeStatus: editingEmployee.EmpStatus,
        Username: '',
        Password: '',
      });
    } else if (!open) {
      form.resetFields();
      setSelectedDepartmentId(null);
      setSelectedMainBranchId(null);
    }
  }, [open, editingEmployee, form]);

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

      const body = {
        EmployeeInfoID: employeeId,
        Fullname: values.Fullname,
        Address: values.Address || '',
        Phone: values.Phone || '',
        Email: values.Email || '',
        Gender: values.Gender || 1,
        DOB: values.DOB ? values.DOB.format('YYYY-MM-DD') : '',
        OrganizationOfficeID: values.OrganizationOfficeID || 1,
        DepartmentID: values.DepartmentID || 0,
        DepartmentName: '',
        BranchID: values.BranchID || 0,
        MainBranchID: values.MainBranchID || 0,
        Username: values.Username || '',
        Password: values.Password || '',
        ConfirmPassword: values.confirmPassword || '',
        Photo: '',
        EmpStatus: values.EmployeeStatus || 1,
      };

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
        // response is not JSON, fall back to refetching
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
      title={
        <div className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3">
          {isEdit ? 'कर्मचारी सम्पादन' : 'कर्मचारी सेटअप फारम'}
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
        form={form}
        layout="vertical"
        size="middle"
        requiredMark={false}
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
                label={<span className="text-slate-700 font-semibold text-[13px]">Organization Office<span className="text-red-500 ml-0.5">*</span></span>}
                name="OrganizationOfficeID"
                rules={[{ required: true, message: 'Please select organization office' }]}
              >
                <Select placeholder="Select Office" options={orgOfficeOptions} className="rounded-md" loading={orgOfficesLoading} />
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
                  loading={departmentsLoading}
                  onChange={handleDepartmentChange}
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
                  loading={mainBranchesLoading}
                  onChange={handleMainBranchChange}
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
                  loading={branchesLoading}
                />
              </Form.Item>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2 flex-1">
              <Form.Item
                label={<span className="text-slate-700 font-semibold text-[13px]">प्रयोगकर्ता नाम<span className="text-red-500 ml-0.5">*</span></span>}
                name="Username"
                rules={[{ required: true, message: 'कृपया प्रयोगकर्ता नाम प्रविष्ट गर्नुहोस्' }]}
              >
                <Input className="rounded-md" />
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
                <Input.Password className="rounded-md" />
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
                  <Input.Password className="rounded-md" />
                </Form.Item>
              )}
            </div>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
