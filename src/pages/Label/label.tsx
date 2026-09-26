import { useState, useRef } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { App } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import AppTable from '@/components/ui/AppTable';
import { CardGridSkeleton, TableSkeleton } from '@/components/ui/Loaders';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { fetchLabels, deleteLabel } from '@/services/labelservice';
import { type Label } from '@/types/label-types';
import CreateLabelDrawer from './Create';
import { usePaginatedList, type PaginatedListParams } from '@/hooks/usePaginatedList';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

function fetchLabelsPage(params: PaginatedListParams): Promise<{ items: Label[]; total: number }> {
  return fetchLabels({
    search: (params.search as string) || '',
    start: params.start as number,
    length: params.length as number,
    signal: params.signal,
  }).then((result) => ({
    items: result.labels,
    total: result.filtered,
  }));
}

export default function LabelPage() {
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: labels,
    total: totalFiltered,
    loading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<Label>({
    fetcher: (params) => fetchLabelsPage({ 
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
    setEditingLabel(null);
    setShowFormModal(true);
  };

  const handleEdit = (label: Label) => {
    setEditingLabel(label);
    setShowFormModal(true);
  };

  const handleDelete = async (label: Label) => {
    modal.confirm({
      title: 'Delete Label',
      content: `Are you sure you want to delete "${label.name || 'this label'}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const result = await deleteLabel(label.id);
          if (!result.success) throw new Error(result.message || 'Failed to delete label');
          message.success('Label deleted successfully');
          queryClient.invalidateQueries({ queryKey: ['labels'] });
          refetch();
        } catch (err) {
          if (err instanceof Error) {
            message.error(err.message || 'Failed to delete label');
          }
        }
      },
    });
  };

  const handleCreateSuccess = () => {
    setShowFormModal(false);
    setEditingLabel(null);
    setCurrentPage(1);
    queryClient.invalidateQueries({ queryKey: ['labels'] });
    refetch();
    message.success('Label saved successfully');
  };

  const labelColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (value: string) => <span className="font-semibold text-slate-800">{value || '—'}</span>,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (value: string) => <span className="text-slate-600">{value || '—'}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      width: 140,
      render: (_: unknown, record: Label) => (
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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Label Info</h1>
          <p className="mt-1 text-base text-slate-500">
            Manage labels and tags used across projects and tasks.
          </p>
        </div>
        <Button type="primary" onClick={handleAddNew} icon={<Plus className="h-4 w-4" />}>
          Add Label
        </Button>
      </div>
      <hr className="border-slate-200 my-6" />

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:items-end">
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">Label Name</div>
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
              placeholder="Search by label name..."
              containerClassName="flex-1 w-full sm:w-[300px]"
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
            <TableSkeleton columns={3} rows={6} message="Loading labels..." />
          )
        ) : labels.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-base text-slate-400">No labels found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {labels.map((label) => (
              <Card
                key={label.id}
                hover
                className="group overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors truncate">
                      {label.name || 'Untitled'}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2.5 mb-5">
                  {label.code && (
                    <div className="flex items-center justify-between text-sm gap-2">
                      <span className="text-slate-400 shrink-0">Code</span>
                      <span className="font-semibold text-slate-700">{label.code}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="primary"
                    size="sm"
                    onClick={() => handleEdit(label)}
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    danger
                    onClick={() => handleDelete(label)}
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    }
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <AppTable
            columns={labelColumns}
            dataSource={labels}
            rowKey={(record) => record.id}
          />
        )}

        {!loading && labels.length > 0 && (
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

      <CreateLabelDrawer
        open={showFormModal}
        onClose={() => { setShowFormModal(false); setEditingLabel(null); }}
        onSuccess={refetch}
        editingLabel={editingLabel}
      />
    </div>
  );
}

