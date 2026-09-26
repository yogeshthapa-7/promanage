import { useState, useRef } from 'react';
import { Plus, Building2, LayoutGrid, List } from 'lucide-react';
import { Modal, message, Button } from 'antd';
import Pagination from '@/components/ui/Pagination';
import { CardGridSkeleton, TableSkeleton } from '@/components/ui/Loaders';
import Card from '@/components/ui/Card';
import AppTable from '@/components/ui/AppTable';
import SearchInput from '@/components/ui/SearchInput';
import { fetchOrganizations, deleteOrganization } from '@/services/organizationservice';
import { type Organization } from '@/types/organizations-types';
import CreateOrganizationModal from './Create';
import { usePaginatedList, type PaginatedListParams } from '@/hooks/usePaginatedList';
import { useQueryClient } from '@tanstack/react-query';

function fetchOrganizationsPage(params: PaginatedListParams): Promise<{ items: Organization[]; total: number }> {
  return fetchOrganizations({
    search: (params.search as string) || '',
    start: params.start as number,
    length: params.length as number,
    signal: params.signal,
  }).then((result) => ({
    items: result.organizations,
    total: result.filtered,
  }));
}

export default function OrganizationPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: organizations,
    total: totalFiltered,
    loading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<Organization>({
    fetcher: (params) => fetchOrganizationsPage({ 
      ...params, 
      search: searchQuery  
    }),
    initialPageSize: 20,
    extraDeps: [searchQuery],
  });
  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleAddNew = () => {
    setEditingOrg(null);
    setShowCreateModal(true);
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setShowCreateModal(true);
  };

  const handleDelete = async (org: Organization) => {
    Modal.confirm({
      title: 'Delete Organization',
      content: `Are you sure you want to delete "${org.title}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const result = await deleteOrganization(org.id);
          if (!result.success) throw new Error(result.message || 'Failed to delete organization');
          message.success(`Organization "${org.title}" deleted successfully`);
          queryClient.invalidateQueries({ queryKey: ['organizations'] });
          refetch();
        } catch (err) {
          if (err instanceof Error) {
            message.error(err.message || 'Failed to delete organization');
          }
        }
      },
    });
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setEditingOrg(null);
    setCurrentPage(1);
    queryClient.invalidateQueries({ queryKey: ['organizations'] });
    refetch();
    message.success('Organization saved successfully');
  };

  const organizationColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (value: string) => <span className="font-semibold text-slate-800">{value || 'Untitled'}</span>,
    },
    {
      title: 'Parent Organization',
      dataIndex: 'parentOrganizationName',
      key: 'parentOrganizationName',
      render: (value: string) => <span className="text-slate-600">{value || '—'}</span>,
    },
    {
      title: 'Parent ID',
      dataIndex: 'parentOrganizationId',
      key: 'parentOrganizationId',
      render: (value: number | string) => <span className="text-slate-600">{value || '—'}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      width: 140,
      render: (_: unknown, record: Organization) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="small" onClick={() => handleEdit(record)}>Edit</Button>
          <Button size="small" danger onClick={() => handleDelete(record)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Organizations</h1>
          <p className="mt-1 text-base text-slate-500">
            Manage organizations, view details, and update or remove entries.
          </p>
        </div>
        <Button type="primary" onClick={handleAddNew} icon={<Plus className="h-4 w-4" />}>
          Add Organization
        </Button>
      </div>
      <hr className="border-slate-200 my-6" />

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5 md:items-end">
        <div className="md:col-span-2">
          <div className="mb-1 text-sm font-medium text-slate-500">Title</div>
          <div className="flex gap-2">
            <SearchInput
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                if (debounceTimerRef.current) {
                  clearTimeout(debounceTimerRef.current);
                }
                debounceTimerRef.current = setTimeout(() => {
                  setCurrentPage(1);
                }, 400);
              }}
              placeholder="Search by title..."
              containerClassName="flex-1"
            />
            <Button type="primary" onClick={handleSearch}>Search</Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-base text-slate-500">
            {totalFiltered} total records
          </span>
          <div className="flex items-center bg-white/70 border border-border rounded-xl p-0.5 shadow-xs">
            <Button
              type="text"
              onClick={() => setViewMode('list')}
              icon={<List className="w-4 h-4" />}
            />
            <Button
              type="text"
              onClick={() => setViewMode('grid')}
              icon={<LayoutGrid className="w-4 h-4" />}
            />
          </div>
        </div>

        {loading ? (
          viewMode === 'grid' ? (
            <CardGridSkeleton count={8} />
          ) : (
            <TableSkeleton columns={4} rows={6} message="Loading organizations..." />
          )
        ) : organizations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-base text-slate-400">No organizations found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {organizations.map((org) => (
              <Card
                key={org.id}
                hover
                className="group overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors break-words">
                        {org.title || 'Untitled'}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="text-slate-400 shrink-0">Organization ID</span>
                    <span className="font-semibold text-slate-700 truncate">{org.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm gap-2 text-right">
                    <span className="text-slate-400 shrink-0">Parent Org</span>
                    <span className="font-semibold text-slate-700 break-words">
                      {org.parentOrganizationName || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="text-slate-400 shrink-0">Parent ID</span>
                    <span className="font-semibold text-slate-700 truncate">{org.parentOrganizationId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <Button type="primary" size="small" onClick={() => handleEdit(org)} icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  }>Edit</Button>
                  <Button size="small" danger onClick={() => handleDelete(org)} icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  }>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <AppTable
            columns={organizationColumns}
            dataSource={organizations}
            rowKey={(record) => record.id}
          />
        )}

        {!loading && organizations.length > 0 && (
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
        )}
      </div>

      <CreateOrganizationModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingOrg(null);
        }}
        onSuccess={handleCreateSuccess}
        editingOrganization={editingOrg}
      />
    </div>
  );
}
