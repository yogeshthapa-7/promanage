import { useState, useEffect } from 'react';
import {
  UserPlus,
} from 'lucide-react';
import { Button, Input, Select } from 'antd';
import Pagination from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Loaders';
import AppTable from '@/components/ui/AppTable';
import SearchInput from '@/components/ui/SearchInput';
import { useQueryClient } from '@tanstack/react-query';
import { deleteUser, fetchUsers, ROLE_STYLE, fetchUserGroups } from '@/services/userservice';
import type { User } from '@/types/users-types';
import UserFormModal from './Create';
import { message, Modal } from 'antd';
import { usePaginatedList, type PaginatedListParams } from '@/hooks/usePaginatedList';

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
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userGroups, setUserGroups] = useState<{ UserGroupId: number; UserGroupName: string }[]>([]);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const queryClient = useQueryClient();

  const {
    data: users,
    total: totalFiltered,
    loading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<User>({
    fetcher: (params: PaginatedListParams) =>
      fetchUsers({
        search: debouncedSearch,
        start: params.start as number,
        length: params.length as number,
        theme: titleFilter,
        role: roleFilter,
        signal: params.signal,
      }).then((result) => ({
        items: result.users,
        total: result.filtered,
      })),
    initialPageSize: 20,
    extraDeps: [debouncedSearch, titleFilter, roleFilter],
  });

  const themeOptions = Array.from(
    new Set(users.map((u) => u.theme).filter((t): t is string => !!t))
  ).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    fetchUserGroups().then((groups) => {
      setUserGroups(groups);
    });
  }, []);

  const paginatedUsers = titleFilter
    ? users.filter((u) => u.theme === titleFilter)
    : users;

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
          queryClient.invalidateQueries({ queryKey: ['users', 'search'] });
          refetch();
          message.success('User deleted successfully');
        } else {
          message.error(result.message || 'Failed to delete user');
        }
      },
    });
  };

  const userColumns = [
    {
      title: 'Username',
      dataIndex: 'email',
      key: 'email',
      render: (value: string) => <div className="text-slate-700 font-medium">{value}</div>,
    },
    {
      title: 'Full name',
      dataIndex: 'name',
      key: 'name',
      render: (value: string) => <span className="font-semibold text-slate-800">{value}</span>,
    },
    {
      title: 'User Group',
      dataIndex: 'role',
      key: 'role',
      render: (value: string) => <span className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium border ${ROLE_STYLE[value]}`}>{value}</span>,
    },
    {
      title: 'Theme',
      dataIndex: 'theme',
      key: 'theme',
      render: (value: string) => <span className="text-slate-600 font-medium">{value}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      width: 140,
      render: (_: unknown, record: User) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="small" onClick={() => handleEditUser(record)}>Edit</Button>
          <Button size="small" danger onClick={() => handleDeleteUser(record)}>Delete</Button>
        </div>
      ),
    },
  ];

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
          <Select
            value={titleFilter || undefined}
            onChange={(value) => setTitleFilter(value || '')}
            placeholder="All Themes"
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            options={[
              { value: '', label: 'All Themes' },
              ...themeOptions.map((theme) => ({
                value: theme,
                label: theme,
              })),
            ]}
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
            {titleFilter ? paginatedUsers.length : totalFiltered} total records
          </span>
        </div>
        {loading ? (
          <TableSkeleton columns={5} rows={6} message="Loading users..." />
        ) : (
          <AppTable
            columns={userColumns}
            dataSource={paginatedUsers}
            rowKey={(record) => record.id}
            cardClassName="no-print"
          />
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
        onSuccess={refetch}
      />
    </div>
  );
}

