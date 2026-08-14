'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import Drawer from '@/components/drawer';
import { apiCall } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

interface CreateClientDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingClient?: Client | null;
}

export default function CreateClientDrawer({ open, onClose, onSuccess, editingClient }: CreateClientDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      if (editingClient) {
        form.setFieldsValue({
          clientName: editingClient.clientName,
          clientCode: editingClient.clientCode,
          contactPerson: editingClient.contactPerson,
          contactNo: editingClient.contactNo,
          email: editingClient.email,
          address: editingClient.address,
          logo: editingClient.logo,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, form, editingClient]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const isEdit = !!editingClient;
      const body = {
        ClientInfoID: isEdit ? editingClient?.id : 0,
        ClientName: values.clientName,
        ClientCode: values.clientCode,
        ContactPerson: values.contactPerson,
        ContactNo: values.contactNo,
        Email: values.email,
        Address: values.address,
        ClientStatus: isEdit ? editingClient?.clientStatus : 0,
        Logo: values.logo || '',
      };

      const res = await apiCall(`${API_BASE}/SaveClientInfo`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

      message.success(isEdit ? 'Client updated successfully' : 'Client created successfully');
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onClose();
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to save client');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
      <Drawer
        open={open}
        onClose={onClose}
        title={editingClient ? 'Edit Client' : 'New Client'}
        subtitle={editingClient ? 'Update client details.' : 'Add a new client to the system.'}
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
                Client Name <span className="text-rose-500">*</span>
              </span>
            }
            name="clientName"
            rules={[{ required: true, message: 'Please enter client name' }]}
          >
            <Input
              placeholder="Enter client name"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Client Code <span className="text-rose-500">*</span>
              </span>
            }
            name="clientCode"
            rules={[{ required: true, message: 'Please enter client code' }]}
          >
            <Input
              placeholder="Enter client code"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Contact Person <span className="text-rose-500">*</span>
              </span>
            }
            name="contactPerson"
            rules={[{ required: true, message: 'Please enter contact person' }]}
          >
            <Input
              placeholder="Enter contact person"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Contact No <span className="text-rose-500">*</span>
              </span>
            }
            name="contactNo"
            rules={[{ required: true, message: 'Please enter contact number' }]}
          >
            <Input
              placeholder="Enter contact number"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Email <span className="text-rose-500">*</span>
              </span>
            }
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              placeholder="Enter email"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Address <span className="text-rose-500">*</span>
              </span>
            }
            name="address"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <Input
              placeholder="Enter address"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-foreground">
                Logo URL
              </span>
            }
            name="logo"
          >
            <Input
              placeholder="Enter logo URL"
              className="rounded-lg border-border bg-slate-50/50 focus:bg-white focus:border-purple-500"
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
          {editingClient ? 'Update Client' : 'Create Client'}
        </Button>
      </div>
    </Drawer>
  );
}
