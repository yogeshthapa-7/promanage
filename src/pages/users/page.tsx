'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  UserPlus,
} from 'lucide-react';
import { Button, Input, Select } from 'antd';
import Pagination from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Loaders';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { fetchUsers, ROLE_STYLE, fetchUserGroups, deleteUser } from '@/lib/users-data';
import type { User } from '@/lib/users-data';
import UserFormModal from './Create';
import { message, Modal } from 'antd';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userGroups, setUserGroups] = useState<{ UserGroupId: number; UserGroupName: string }[]>([]);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchData = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    fetchUsers({
      search: debouncedSearch,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      theme: titleFilter,
      role: roleFilter,
      signal,
    })
      .then((result) => {
        setUsers(result.users);
        setTotalFiltered(result.filtered);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setLoading(false);
        message.error('Failed to load users');
      });
  }, [debouncedSearch, currentPage, pageSize, titleFilter, roleFilter]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  useEffect(() => {
    fetchUserGroups().then((groups) => {
      setUserGroups(groups);
    });
  }, []);

  const paginatedUsers = users;

  const handleEditUser = (user: User) => {
    setEditUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = (user: User) => {
    Modal.confirm({
      title: 'Remove User',
      content: `Are you sure you want to remove ${user.name} from the workspace?`,
      okText: 'Remove',
      okType: 'danger',
      onOk: async () => {
        const userId = Number(user.id);
        const result = await deleteUser(userId);
        if (result.success) {
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          setTotalFiltered((prev) => prev - 1);
        } else {
          message.error(result.message || 'Failed to delete user');
        }
      },
    });
  };

  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Users</h1>
          <p className="mt-1 text-base text-slate-500">
            Manage workspace members, their roles, permissions, and access status.
          </p>
        </div>

        <Button type="primary" onClick={() => setShowUserModal(true)} icon={<UserPlus className="h-4 w-4" strokeWidth={2.5} />}>
          Add User
        </Button>
      </div>
      <hr className="border-slate-200 my-6" />

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">Username / Email</div>
          <Input
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">Theme</div>
          <Input
            placeholder="Search by theme..."
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            allowClear
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">User Group</div>
          <Select
            value={roleFilter}
            onChange={(value) => setRoleFilter(value)}
            placeholder="All Groups"
            allowClear
            className="w-full"
            options={[
              { value: '', label: 'All Groups' },
              ...userGroups.map((group) => ({
                value: group.UserGroupName,
                label: group.UserGroupName,
              })),
            ]}
          />
        </div>
        <div className="flex gap-2">
          <Button type="primary" onClick={() => setCurrentPage(1)}>
            Search
          </Button>
          <Button onClick={() => {
            setSearchQuery('');
            setTitleFilter('');
            setRoleFilter('');
            setCurrentPage(1);
          }}>
            Clear
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-base text-slate-500">Show</span>
            <Select
              value={pageSize}
              onChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
              className="w-20"
              options={[
                { value: 20, label: '20' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
              ]}
            />
            <span className="text-base text-slate-500">entries</span>
          </div>
          <span className="text-base text-slate-500">
            {totalFiltered} total records
          </span>
        </div>
        {loading ? (
          <TableSkeleton columns={5} rows={6} message="Loading users..." />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-1.5">
                <thead>
                  <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                    <th className="rounded-l-xl bg-slate-50 px-5 py-3">Username</th>
                    <th className="bg-slate-50 px-4 py-3">Full name</th>
                    <th className="bg-slate-50 px-4 py-3">User Group</th>
                    <th className="bg-slate-50 px-4 py-3">Theme</th>
                    <th className="rounded-r-xl bg-slate-50 px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-base text-slate-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => (
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
          </Card>
        )}

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

      <UserFormModal
        open={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setEditUser(null);
        }}
        editingUser={editUser}
        existingUsers={users}
        onSuccess={fetchData}
      />
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
  const handleRowMouseEnter = (e: React.MouseEvent<HTMLTableRowElement>) => {
    e.currentTarget.style.transform = 'scale(1.02)';
    e.currentTarget.style.transition = 'transform 0.25s cubic-bezier(0.4,0,0.2,1)';
  };
  const handleRowMouseLeave = (e: React.MouseEvent<HTMLTableRowElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  };

  return (
    <tr
      className="text-sm text-slate-700"
      onMouseEnter={handleRowMouseEnter}
      onMouseLeave={handleRowMouseLeave}
    >
      <td className="rounded-l-xl bg-white px-4 py-3 border-b border-slate-100">
        <div className="text-slate-700 font-medium">{user.email}</div>
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">
        {user.name}
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium border ${ROLE_STYLE[user.role]}`}>
          {user.role}
        </span>
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
        {user.theme}
      </td>
      <td className="rounded-r-xl bg-white px-4 py-3 text-right border-b border-slate-100">
        <div className="flex items-center justify-end gap-2">
          <Button size="small" onClick={() => onEditUser(user)}>
            Edit
          </Button>
          <Button size="small" danger onClick={() => onDeleteUser(user)}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
