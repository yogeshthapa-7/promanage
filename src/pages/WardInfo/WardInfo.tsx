'use client';

import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { Modal, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import { CardGridSkeleton } from '@/components/ui/Loaders';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { fetchWards, type Ward } from '@/lib/ward-data';
import { apiCall } from '@/lib/api';
import CreateWardDrawer from './Create';
import { usePaginatedList, type PaginatedListParams } from '@/hooks/usePaginatedList';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

function fetchWardsPage(params: PaginatedListParams): Promise<{ items: Ward[]; total: number }> {
  return fetchWards({
    search: (params.search as string) || '',
    start: params.start as number,
    length: params.length as number,
    signal: params.signal,
  }).then((result) => ({
    items: result.wards,
    total: result.filtered,
  }));
}

export default function WardInfoPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSearchQuery = searchQuery.trim();

  const {
    data: wards,
    total: totalFiltered,
    loading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<Ward>({
    fetcher: fetchWardsPage,
    initialPageSize: 20,
    extraDeps: [debouncedSearchQuery],
    extraParams: {
      search: debouncedSearchQuery,
    },
  });

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleAddNew = () => {
    setEditingWard(null);
    setShowFormModal(true);
  };

  const handleEdit = (ward: Ward) => {
    setEditingWard(ward);
    setShowFormModal(true);
  };

  const handleDelete = async (ward: Ward) => {
    Modal.confirm({
      title: 'Delete Ward',
      content: `Are you sure you want to delete "${ward.wardNumber || 'this ward'}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await apiCall(`${API_BASE}/DeleteWardInfo`, {
            method: 'POST',
            body: JSON.stringify({ id: ward.id }),
          });

          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

          message.success('Ward deleted successfully');
          queryClient.invalidateQueries({ queryKey: ['wards'] });
          refetch();
        } catch (err) {
          if (err instanceof Error) {
            message.error(err.message || 'Failed to delete ward');
          }
        }
      },
    });
  };

  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Ward Info</h1>
          <p className="mt-1 text-base text-slate-500">
            Manage ward information, boundaries, and administrative details.
          </p>
        </div>
        <Button type="primary" onClick={handleAddNew} icon={<Plus className="h-4 w-4" />}>
          Add Ward
        </Button>
      </div>
      <hr className="border-slate-200 my-6" />

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
        <div className="md:col-span-2">
          <div className="mb-1 text-sm font-medium text-slate-500">Ward Number</div>
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
              placeholder="Search by ward number..."
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
        </div>

        {loading ? (
          <CardGridSkeleton count={8} />
        ) : wards.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-base text-slate-400">No wards found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wards.map((ward) => (
              <Card
                key={ward.id}
                hover
                className="group overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors truncate">
                      Ward {ward.wardNumber || 'Untitled'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{ward.wardCode}</p>
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 shrink-0 ml-2">
                    #{ward.SN}
                  </span>
                </div>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="text-slate-400 shrink-0">Ward Number</span>
                    <span className="font-semibold text-slate-700 truncate">{ward.wardNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="text-slate-400 shrink-0">Ward Code</span>
                    <span className="font-semibold text-slate-700 truncate">{ward.wardCode}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="primary"
                    size="sm"
                    onClick={() => handleEdit(ward)}
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
                    onClick={() => handleDelete(ward)}
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
        )}

        {!loading && wards.length > 0 && (
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

      <CreateWardDrawer
        open={showFormModal}
        onClose={() => { setShowFormModal(false); setEditingWard(null); }}
        onSuccess={refetch}
        editingWard={editingWard}
      />
    </div>
  );
}
