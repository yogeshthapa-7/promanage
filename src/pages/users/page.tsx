'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
} from 'lucide-react';
import { Modal, Form, Input, Select, message } from 'antd';
import Pagination from '@/components/ui/Pagination';
import { fetchUsers, ROLE_STYLE } from '@/lib/users-data';
import type { User } from '@/lib/users-data';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editForm] = Form.useForm();
  const [inviteForm] = Form.useForm();

  useEffect(() => {
    setLoading(true);
    fetchUsers({ search: searchQuery, start: (currentPage - 1) * pageSize, length: pageSize })
      .then((result) => {
        setUsers(result.users);
        setTotalFiltered(result.filtered);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [searchQuery, currentPage, pageSize]);


  const filteredUsers = users;

  const handleEditUser = (user: User) => {
    setEditUser(user);
    editForm.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title,
      department: user.department,
      status: user.status,
    });
  };

  const handleDeleteUser = (user: User) => {
    Modal.confirm({
      title: 'Remove User',
      content: `Are you sure you want to remove ${user.name} from the workspace?`,
      okText: 'Remove',
      okType: 'danger',
      onOk: () => {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
      },
    });
  };

  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage workspace members, their roles, permissions, and access status.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 shadow-sm"
        >
          <UserPlus className="h-4 w-4" strokeWidth={2.5} />
          Add User
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
        <div className="md:col-span-2">
          <div className="mb-1 text-xs font-medium text-slate-500">Search Category Group</div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search user or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <button
              onClick={() => setSearchQuery(searchQuery)}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-slate-500">entries</span>
          </div>
          <span className="text-sm text-slate-500">
            {totalFiltered} total records
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl bg-white border border-slate-200">
          <table className="w-full border-separate border-spacing-y-1.5">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="rounded-l-xl bg-slate-50 px-5 py-3">Username</th>
                <th className="bg-slate-50 px-4 py-3">Full name</th>
                <th className="bg-slate-50 px-4 py-3">User Group</th>
                <th className="bg-slate-50 px-4 py-3">Content</th>
                <th className="rounded-r-xl bg-slate-50 px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    onEditUser={handleEditUser}
                    onDeleteUser={handleDeleteUser}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          total={totalFiltered}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[20, 50, 100]}
        />
      </div>

      <Modal
        open={editUser !== null}
        title="Edit User"
        okText="Save Changes"
        cancelText="Cancel"
        onOk={() => {
          editForm.validateFields().then((values) => {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === editUser?.id ? { ...u, ...values } : u
              )
            );
            setEditUser(null);
            message.success('User updated successfully');
          });
        }}
        onCancel={() => setEditUser(null)}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="title" label="Job Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="department" label="Department" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'Admin', label: 'Admin' },
                { value: 'Manager', label: 'Manager' },
                { value: 'Developer', label: 'Developer' },
                { value: 'Designer', label: 'Designer' },
                { value: 'Member', label: 'Member' },
              ]}
            />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Suspended', label: 'Suspended' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={showInviteModal}
        title="Add New User"
        okText="Create User"
        cancelText="Cancel"
        onOk={() => {
          inviteForm.validateFields().then((values) => {
            const newUser: User = {
              id: Date.now().toString(),
              name: values.name,
              email: values.email,
              role: values.role || 'Member',
              title: values.title || 'Team Member',
              department: values.department || 'General',
              avatar: `https://i.pravatar.cc/64?img=${Math.floor(Math.random() * 50)}`,
              status: 'Active',
              lastActive: 'Just now',
              projectsCount: 0,
            };
            setUsers((prev) => [newUser, ...prev]);
            setShowInviteModal(false);
            inviteForm.resetFields();
            message.success('User created successfully');
          });
        }}
        onCancel={() => setShowInviteModal(false)}
      >
        <Form form={inviteForm} layout="vertical">
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter full name' }]}>
            <Input placeholder="e.g. Alex Rivera" />
          </Form.Item>
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
            <Input placeholder="alex.rivera@company.com" />
          </Form.Item>
          <Form.Item name="title" label="Job Title">
            <Input placeholder="e.g. Senior Developer" />
          </Form.Item>
          <Form.Item name="department" label="Department">
            <Input placeholder="e.g. Engineering" />
          </Form.Item>
          <Form.Item name="role" label="Role" initialValue="Member">
            <Select
              options={[
                { value: 'Admin', label: 'Admin' },
                { value: 'Manager', label: 'Manager' },
                { value: 'Developer', label: 'Developer' },
                { value: 'Designer', label: 'Designer' },
                { value: 'Member', label: 'Member' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function UserRow({
  user,
  onEditUser,
  onDeleteUser,
}: {
  user: User;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}) {
  return (
    <tr className="text-sm text-slate-700">
      <td className="rounded-l-xl bg-white px-4 py-3 border-b border-slate-100">
        <div className="text-slate-700 font-medium">{user.email}</div>
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">
        {user.name}
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${ROLE_STYLE[user.role]}`}
        >
          {user.role}
        </span>
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
        {user.title}
      </td>
      <td className="rounded-r-xl bg-white px-4 py-3 text-right border-b border-slate-100">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEditUser(user)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 transition"
          >
            Edit
          </button>
          <button
            onClick={() => onDeleteUser(user)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function FilterSelect({
  label,
  value,
  onSelect,
  options,
}: {
  label: string;
  value: string;
  onSelect: (val: string) => void;
  options: string[];
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-slate-500">{label}</div>
      <select
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
