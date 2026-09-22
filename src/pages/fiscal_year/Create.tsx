'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Checkbox } from 'antd';
import Drawer from '@/components/drawer';
import { apiCall } from '@/services/api';
import AntdNepaliDatePicker from '@/components/AntdNepaliDatePicker';
import { type FiscalYearItem } from '@/data/fiscal-year-data';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '')
//.replace(/\/$/, '').replace(/\/api$/, '')

interface CreateFiscalYearDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingYear?: FiscalYearItem | null;
}

export default function CreateFiscalYearDrawer({ open, onClose, onSuccess, editingYear }: CreateFiscalYearDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingYear) {
        form.setFieldsValue({
          name: editingYear.name,
          code: editingYear.code,
          startDate: editingYear.startDate,
          endDate: editingYear.endDate,
          isRunning: editingYear.isRunning ?? 0,
          yearOrder: Number(editingYear.yearOrder ?? 0),
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, form, editingYear]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const isEdit = !!editingYear;
      const body: Record<string, unknown> = {
        // FiscalYearID : 0,
        FiscalYearName: values.name,
        FiscalYearCode: values.code || '',
        StartDate: values.startDate || '',
        EndDate: values.endDate || '',
        IsRunning: values.isRunning ? 1 : 0,
        IsActive:0,
        YearOrder: Number(values.yearOrder ?? 0),
        ...(isEdit ? { FiscalYearID: editingYear!.id } : {FiscalYearID: 0}),
      };
      

      const res = await apiCall(`${API_BASE}SaveFiscalYear`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`Failed: ${res.statusText}`);
      }

      const result = await res.json();

      if (result.Success === false) {
        message.error(result.Message || 'Failed to save fiscal year');
        return;
      }

      message.success(
        result.Message ||
        (isEdit
          ? 'Fiscal year updated successfully'
          : 'Fiscal year created successfully')
      );

      form.resetFields();
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to save fiscal year');
      } else {
        message.error('Failed to save fiscal year');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editingYear ? 'Edit Fiscal Year' : 'Add Fiscal Year'}
      subtitle={editingYear ? 'Update fiscal year details.' : 'Create a new fiscal year.'}
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
                Fiscal Year <span className="text-rose-500">*</span>
              </span>
            }
            name="name"
            rules={[{ required: true, message: 'Please enter fiscal year' }]}
          >
            <Input
              placeholder="e.g. 2083/84"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Fiscal Year Code
              </span>
            }
            name="code"
          >
            <Input
              placeholder="e.g. FY2083"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Fiscal Year Order <span className="text-rose-500">*</span>
              </span>
            }
            name="yearOrder"
            rules={[{ required: true, message: 'Please enter fiscal year order' }]}
          >
            <Input
              type="number"
              placeholder="e.g. 1"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Start Date <span className="text-rose-500">*</span>
              </span>
            }
            name="startDate"
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <AntdNepaliDatePicker
              placeholder="YYYY/MM/DD"
              className="w-full rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
              returnEnglishDate
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                End Date <span className="text-rose-500">*</span>
              </span>
            }
            name="endDate"
            rules={[{ required: true, message: 'Please select end date' }]}
          >
            <AntdNepaliDatePicker
              placeholder="YYYY/MM/DD"
              className="w-full rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
              returnEnglishDate
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Set as Current Running Year
              </span>
            }
            name="isRunning"
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox>Set as Current Running Year</Checkbox>
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
          {editingYear ? 'Update Fiscal Year' : 'Save Fiscal Year'}
        </Button>
      </div>
    </Drawer>
  );
}
