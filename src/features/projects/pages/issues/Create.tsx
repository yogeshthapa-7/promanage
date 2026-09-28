import { useEffect, useState, useRef } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { useAuth } from '@/context/AuthContext';
import { fetchEmployees } from '@/features/employee/services/employee.service';
import { fetchSelectList, SELECT_LIST_URLS, mapToSelectOptions } from '@/features/projects/services/project.service';
import { saveIssue } from '@/features/projects/services/issue.service';
import AntdNepaliDatePicker from '@/shared/components/AntdNepaliDatePicker';
import Drawer from '@/shared/components/drawer';
import DocumentUploadField from '@/shared/components/DocumentUploadField';
import type { IssueCreateProps } from '@/features/projects/types/projects-types';

const STATUS_API = SELECT_LIST_URLS.status;
const LABEL_INFO_API = SELECT_LIST_URLS.labelInfo;

export default function IssueCreate({
  open,
  onClose,
  onSuccess,
  project,
  editingIssue,
  modal = false,
}: IssueCreateProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [labelOptions, setLabelOptions] = useState<{ value: string; label: string }[]>([]);
  const [labelLoading, setLabelLoading] = useState(false);
  const [createdDate, setCreatedDate] = useState('');
  const [raisedByOptions, setRaisedByOptions] = useState<{ value: string; label: string }[]>([]);
  const [raisedByLoading, setRaisedByLoading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const statusAbortControllerRef = useRef<AbortController | null>(null);
  const labelAbortControllerRef = useRef<AbortController | null>(null);
  const raisedByAbortControllerRef = useRef<AbortController | null>(null);
  const { user } = useAuth();

  const projectId = project?.ProjectInfoID ?? null;
  const isEditing = !!editingIssue;

  const getPopupParent = (triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement;

  const fetchStatusOptions = async () => {
    if (statusAbortControllerRef.current) {
      statusAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    statusAbortControllerRef.current = controller;

    setStatusLoading(true);
    try {
      const items = await fetchSelectList(STATUS_API, controller.signal);
      setStatusOptions(mapToSelectOptions(items));
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        message.error('Failed to load status options');
      }
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchLabelOptions = async () => {
    if (labelAbortControllerRef.current) {
      labelAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    labelAbortControllerRef.current = controller;

    setLabelLoading(true);
    try {
      const items = await fetchSelectList(LABEL_INFO_API, controller.signal);
      setLabelOptions(mapToSelectOptions(items));
    } catch {
      setLabelOptions([{ value: '0', label: 'Default' }]);
    } finally {
      setLabelLoading(false);
    }
  };

  const fetchRaisedByOptions = async () => {
    if (raisedByAbortControllerRef.current) {
      raisedByAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    raisedByAbortControllerRef.current = controller;

    setRaisedByLoading(true);
    try {
      const result = await fetchEmployees({
        search: '',
        start: 0,
        length: 100,
        signal: controller.signal,
      });
      const options = result.employees.map((emp) => ({
        value: emp.Fullname,
        label: emp.Fullname,
      }));
      setRaisedByOptions(options);
    } catch {
      setRaisedByOptions([]);
    } finally {
      setRaisedByLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      form.resetFields();
      setCreatedDate('');
      setDocumentUrl('');
      fetchStatusOptions();
      fetchLabelOptions();
      fetchRaisedByOptions();

      if (editingIssue) {
        form.setFieldsValue({
          IssuesTitle: editingIssue.IssuesTitle,
          Comments: editingIssue.Comments,
          WorkStatusID: String(editingIssue.WorkStatusID),
          LabelInfoID: String(editingIssue.LabelInfoID),
          RaisedBy: editingIssue.RaisedBy,
        });
        setCreatedDate(editingIssue.CreatedDate || '');
        setDocumentUrl(editingIssue.Attachments || '');
      }
    }
    return () => {
      statusAbortControllerRef.current?.abort();
      labelAbortControllerRef.current?.abort();
      raisedByAbortControllerRef.current?.abort();
    };
  }, [open, form, editingIssue]);

  const handleSubmit = async () => {
    if (!projectId) {
      message.error('Missing project information');
      return;
    }
    try {
      const values = await form.validateFields();
      setLoading(true);

      const statusOption = statusOptions.find((opt) => opt.value === String(values.WorkStatusID));
      const labelOption = labelOptions.find((opt) => opt.value === String(values.LabelInfoID));

      const body = {
        IssuesID: isEditing ? editingIssue!.IssuesID : 0,
        IssuesTitle: values.IssuesTitle,
        Comments: values.Comments || '',
        WorkStatusID: Number(values.WorkStatusID),
        ProjectInfoID: projectId,
        LabelInfoID: Number(values.LabelInfoID),
        Attachments: documentUrl || '',
        ProjectInfoName: project.ProjectName || '',
        WorkStatusName: statusOption?.label || '',
        LabelInfoName: labelOption?.label || '',
        LabelColor: '',
        CreatedDate: createdDate || '',
        RaisedBy: values.RaisedBy || user?.name || user?.userName || '',
        WorkStatusColor: '',
        CanChangeStatus: true,
        CanEdit: true,
        CanDelete: true,
      };

      await saveIssue(body);

      message.success(isEditing ? 'Issue updated successfully' : 'Issue created successfully');
      form.resetFields();
      setCreatedDate('');
      setDocumentUrl('');
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to save issue');
      }
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
    >
      <div className="grid grid-cols-1 gap-4">
        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">
              Issue Title<span className="text-red-500 ml-0.5">*</span>
            </span>
          }
          name="IssuesTitle"
          rules={[{ required: true, message: 'Please enter issue title' }]}
        >
          <Input placeholder="Enter issue title" className="rounded-md" />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            label={
              <span className="text-slate-600 font-medium text-sm">
                Status<span className="text-red-500 ml-0.5">*</span>
              </span>
            }
            name="WorkStatusID"
            rules={[{ required: true, message: 'Please select status' }]}
            initialValue={statusOptions.length > 0 ? Number(statusOptions[0]?.value) : undefined}
          >
            <Select
              placeholder="Select status"
              options={statusOptions}
              className="rounded-md"
              loading={statusLoading}
              getPopupContainer={getPopupParent}
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-slate-600 font-medium text-sm">
                Label<span className="text-red-500 ml-0.5">*</span>
              </span>
            }
            name="LabelInfoID"
            rules={[{ required: true, message: 'Please select label' }]}
            initialValue={labelOptions.length > 0 ? Number(labelOptions[0]?.value) : undefined}
          >
            <Select
              placeholder="Select label"
              options={labelOptions}
              className="rounded-md"
              loading={labelLoading}
              getPopupContainer={getPopupParent}
            />
          </Form.Item>
        </div>

        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">
              Raised By<span className="text-red-500 ml-0.5">*</span>
            </span>
          }
          name="RaisedBy"
          rules={[{ required: true, message: 'Please select who raised this issue' }]}
          initialValue={raisedByOptions.length > 0 ? raisedByOptions[0]?.value : undefined}
        >
          <Select
            placeholder="Select raised by"
            options={raisedByOptions}
            className="rounded-md"
            loading={raisedByLoading}
            showSearch
            optionFilterProp="label"
            notFoundContent={raisedByLoading ? 'Loading...' : 'No employees found'}
            getPopupContainer={getPopupParent}
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">Created Date</span>
          }
        >
          <AntdNepaliDatePicker
            value={createdDate}
            onChange={setCreatedDate}
            placeholder="YYYY/MM/DD"
            className="rounded-md w-full"
            returnEnglishDate
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">Comments</span>
          }
          name="Comments"
        >
          <Input.TextArea placeholder="Enter issue comments" className="rounded-md" rows={3} />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-slate-600 font-medium text-sm">Attachments</span>
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

      <div className="flex justify-end items-center pt-4 mt-2 border-t border-slate-100">
        <Button onClick={onClose} className="mr-3 rounded-md">
          Cancel
        </Button>
        <Button
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          className="rounded-md"
        >
          {isEditing ? 'Update Issue' : 'Create Issue'}
        </Button>
      </div>
    </Form>
  );

  return modal ? (
    <Modal
      open={open}
      onCancel={onClose}
      title={isEditing ? 'Edit Issue' : 'Create New Issue'}
      width={640}
      footer={null}
      destroyOnClose
      zIndex={10000}
    >
      {formContent}
    </Modal>
  ) : (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Issue' : 'Create New Issue'}
      subtitle={isEditing ? 'Edit issue details' : 'Create a new issue'}
      width={640}
    >
      {formContent}
    </Drawer>
  );
}







