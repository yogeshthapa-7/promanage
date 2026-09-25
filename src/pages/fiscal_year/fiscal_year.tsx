import { useState, useEffect, useRef } from 'react';
import { Plus, LayoutList, LayoutGrid, Pencil, Trash2 } from 'lucide-react';
import { Modal, message, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQueryClient } from '@tanstack/react-query';
import { apiCall } from '@/services/apiservice';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AppTable from '@/components/ui/AppTable';
import { TableSkeleton } from '@/components/ui/Loaders';
import Pagination from '@/components/ui/Pagination';
import CreateFiscalYearDrawer from './Create';
import { fetchFiscalYears, fetchFiscalYearSelectList } from '@/services/fiscalyearservice';
import { type FiscalYearItem, type FiscalYearSelectOption } from '@/types/fiscal-year-types';
import { usePaginatedList, type PaginatedListParams } from '@/hooks/usePaginatedList';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function fetchFiscalYearsPage(params: PaginatedListParams): Promise<{ items: FiscalYearItem[]; total: number }> {
  return fetchFiscalYears({
    search: (params.search as string) || '',
    status: 'Active',
    start: params.start as number,
    length: params.length as number,
    signal: params.signal,
  }).then((result) => ({
    items: result.fiscalYears,
    total: result.filtered,
  }));
}

export default function FiscalYearPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string | undefined>(undefined);
  const [fiscalYearOptions, setFiscalYearOptions] = useState<FiscalYearSelectOption[]>([]);
  const [fiscalYearLoading, setFiscalYearLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<FiscalYearItem | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSearchQuery = searchQuery.trim();

  useEffect(() => {
    const controller = new AbortController();
    setFiscalYearLoading(true);
    fetchFiscalYearSelectList(controller.signal)
      .then((options) => setFiscalYearOptions(options))
      .finally(() => {
        if (!controller.signal.aborted) setFiscalYearLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setCurrentPage(1);
    }, 400);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [debouncedSearchQuery]);

  const {
    data: fiscalYears,
    total: totalFiltered,
    loading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<FiscalYearItem>({
    fetcher: fetchFiscalYearsPage,
    initialPageSize: 20,
    extraDeps: [debouncedSearchQuery],
    extraParams: {
      search: debouncedSearchQuery,
    },
  });

  const handleAddNew = () => {
    setEditingYear(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (year: FiscalYearItem) => {
    setEditingYear(year);
    setIsDrawerOpen(true);
  };

  const handleDelete = (year: FiscalYearItem) => {
    Modal.confirm({
      title: 'Delete Fiscal Year',
      content: `Are you sure you want to delete fiscal year "${year.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const API_BASE = (import.meta.env.VITE_BASE_API_URL || '');
          // .replace(/\/$/, '').replace(/\/api$/, '')
          const res = await apiCall(`${API_BASE}/DeleteFiscalYear?id=${year.id}`, {
            method: 'GET',
          });

          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

          message.success(`Fiscal year "${year.name}" deleted successfully`);
          queryClient.invalidateQueries({ queryKey: ['fiscalYears'] });
          refetch();
        } catch (err) {
          if (err instanceof Error) {
            message.error(err.message || 'Failed to delete fiscal year');
          }
        }
      },
    });
  };

  const handleDrawerSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['fiscalYears'], exact: false });
    refetch();
  };

  const columns: ColumnsType<FiscalYearItem> = [
    {
      title: 'Fiscal Year',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <div className="font-semibold text-slate-900">{text}</div>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDateBs',
      key: 'startDateBs',
    },
    {
      title: 'End Date',
      dataIndex: 'endDateBs',
      key: 'endDateBs',
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_: any, record: FiscalYearItem) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="primary"
            size="small"
            onClick={() => handleEdit(record)}
            icon={<Pencil className="w-4 h-4" />}
          >
            Edit
          </Button>
          <Button
            size="small"
            danger
            onClick={() => handleDelete(record)}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Fiscal Year</h1>
          <p className="mt-1 text-base text-slate-500">
            Manage fiscal years used throughout the system.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="primary" onClick={handleAddNew} icon={<Plus className="h-4 w-4" />}>
            Add Fiscal Year
          </Button>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <hr className="border-slate-200 my-6" />

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">Fiscal Year</div>
          <Select
            value={selectedFiscalYearId}
            onChange={(value) => {
              setSelectedFiscalYearId(value);
              const selected = fiscalYearOptions.find((opt) => opt.value === value);
              setSearchQuery(selected?.label || '');
            }}
            options={fiscalYearOptions}
            loading={fiscalYearLoading}
            placeholder="Select fiscal year"
            allowClear
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-2 text-base text-slate-500 font-medium">
        {totalFiltered} total records
      </div>

      {loading ? (
        <Card className="mt-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-base text-slate-400">
            Loading fiscal years...
          </div>
        </Card>
      ) : totalFiltered === 0 ? (
        <Card className="mt-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-base text-slate-400">
            No fiscal years found.
          </div>
        </Card>
      ) : viewMode === 'list' ? (
        <AppTable columns={columns} dataSource={fiscalYears} rowKey="id" cardClassName="mt-4" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
          {fiscalYears.map((year) => (
            <Card key={year.id} hover className="group overflow-hidden flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors truncate">
                    {year.name}
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5 mb-5 flex-1">
                <div className="flex items-center justify-between text-sm gap-2">
                  <span className="text-slate-400 shrink-0">Code</span>
                  <span className="font-semibold text-slate-700 truncate">{year.code}</span>
                </div>
                <div className="flex items-center justify-between text-sm gap-2">
                  <span className="text-slate-400 shrink-0">Start Date</span>
                  <span className="font-semibold text-slate-700 truncate">{year.startDateBs}</span>
                </div>
                <div className="flex items-center justify-between text-sm gap-2">
                  <span className="text-slate-400 shrink-0">End Date</span>
                  <span className="font-semibold text-slate-700 truncate">{year.endDateBs}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="primary"
                  size="sm"
                  onClick={() => handleEdit(year)}
                  icon={<Pencil className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  danger
                  onClick={() => handleDelete(year)}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalFiltered > 0 && (
        <div className="flex justify-end pt-2">
          <Pagination
            total={totalFiltered}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(Number(size));
              setCurrentPage(1);
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </div>
      )}

      <CreateFiscalYearDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
        editingYear={editingYear}
      />
    </div>
  );
}

