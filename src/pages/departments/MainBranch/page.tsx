'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Copy, FileSpreadsheet, Printer, Pencil, Trash2 } from 'lucide-react';
import { Modal, message, Select, Input } from 'antd';
import Pagination from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Loaders';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  fetchMainBranches,
  fetchMainBranchSelectList,
  type MainBranch,
  type MainBranchSelectOption,
} from '@/lib/main-branches-data';
import {
  fetchDepartmentSelectList,
  type DepartmentSelectOption,
} from '@/lib/departments-data';
import CreateMainBranchDrawer from './Create';
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

function fetchMainBranchesPage(params: PaginatedListParams): Promise<{ items: MainBranch[]; total: number }> {
  return fetchMainBranches({
    search: '',
    start: params.start as number,
    length: params.length as number,
    mainBranchId: params.mainBranchId as number | undefined,
    code: params.code as string | undefined,
    departmentId: params.departmentId as number | undefined,
    signal: params.signal,
  }).then((result) => ({
    items: result.mainBranches,
    total: result.filtered || result.mainBranches.length,
  }));
}

export default function MainBranchPage() {
  const queryClient = useQueryClient();
  const [editingBranch, setEditingBranch] = useState<MainBranch | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const [filterMainBranchId, setFilterMainBranchId] = useState<string | undefined>(undefined);
  const [filterDepartmentId, setFilterDepartmentId] = useState<string | undefined>(undefined);
  const [filterCode, setFilterCode] = useState('');

  const [mainBranchOptions, setMainBranchOptions] = useState<MainBranchSelectOption[]>([]);
  const [mainBranchLoading, setMainBranchLoading] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentSelectOption[]>([]);
  const [departmentLoading, setDepartmentLoading] = useState(false);

  const debouncedCode = useDebounce(filterCode, 300);

  /* eslint-disable react-hooks/set-state-in-effect -- select list loading state */
  useEffect(() => {
    const controller = new AbortController();
    setMainBranchLoading(true);
    fetchMainBranchSelectList(controller.signal)
      .then((options) => setMainBranchOptions(options))
      .finally(() => {
        if (!controller.signal.aborted) setMainBranchLoading(false);
      });
    return () => controller.abort();
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- select list loading state */
  useEffect(() => {
    const controller = new AbortController();
    setDepartmentLoading(true);
    fetchDepartmentSelectList(controller.signal)
      .then((options) => setDepartmentOptions(options))
      .finally(() => {
        if (!controller.signal.aborted) setDepartmentLoading(false);
      });
    return () => controller.abort();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const {
    data: mainBranches,
    total: totalFiltered,
    loading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<MainBranch>({
    fetcher: fetchMainBranchesPage,
    initialPageSize: 20,
    extraDeps: [filterMainBranchId, filterDepartmentId, debouncedCode],
  });

  const refreshMainBranches = () => refetch();

  const handleClear = () => {
    setFilterMainBranchId(undefined);
    setFilterDepartmentId(undefined);
    setFilterCode('');
    setCurrentPage(1);
  };

  const handleAddNew = () => {
    setEditingBranch(null);
    setShowFormModal(true);
  };

  const handleEdit = (branch: MainBranch) => {
    setEditingBranch(branch);
    setShowFormModal(true);
  };

  const handleDelete = (branch: MainBranch) => {
    Modal.confirm({
      title: 'Delete Main Branch',
      content: `Are you sure you want to delete "${branch.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
          await apiCall(
            `${API_BASE}/DeleteMainBranch?id=${branch.id}`,
            { method: 'GET' }
          );
          message.success('Deleted successfully');
          queryClient.invalidateQueries({ queryKey: ['mainBranches', 'search'] });
          refetch();
        } catch {
          message.error('Failed to delete main branch');
        }
      },
    });
  };

  return (
    <div className="fade-in space-y-6 max-w-screen-2xl mx-auto w-full pb-10 text-slate-800 font-sans">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            मुख्य शाखा
          </h2>
          <p className="text-base text-slate-500 mt-1">
            मुख्य शाखा अभिलेखहरू विभागसँग सम्बन्धित गरी व्यवस्थापन गर्नुहोस्।
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium px-5 py-2.5 rounded-full shadow-xs transition-all flex items-center gap-2 text-sm cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add New Main Branch
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">
              Main Branch Name / मुख्य शाखा नाम
            </label>
            <Select
              placeholder="Search by main branch name..."
              value={filterMainBranchId}
              onChange={(value) => setFilterMainBranchId(value)}
              options={mainBranchOptions}
              className="w-full"
              allowClear
              loading={mainBranchLoading}
              showSearch
              filterOption={(input, option) =>
                ((option?.label ?? '') as string).toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">
              Department / विभाग
            </label>
            <Select
              placeholder="Search by department..."
              value={filterDepartmentId}
              onChange={(value) => setFilterDepartmentId(value)}
              options={departmentOptions}
              className="w-full"
              allowClear
              loading={departmentLoading}
              showSearch
              filterOption={(input, option) =>
                ((option?.label ?? '') as string).toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">
              Main Branch Code / मुख्य शाखा कोड
            </label>
            <Input
              type="text"
              placeholder="Search by main branch code..."
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              className="w-full rounded-2xl border-none bg-white py-2.5 px-4 text-sm text-slate-700 shadow-xs focus:ring-2 focus:ring-violet-400 outline-none transition placeholder:text-slate-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button type="primary" onClick={refreshMainBranches}>Search</Button>
            <Button onClick={handleClear}>Clear</Button>
          </div>
        </div>
      </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-base text-slate-500 font-medium">
            <span>Show</span>
            <Select
              value={pageSize}
              onChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
              className="w-20"
              options={[
                { value: 10, label: '10' },
                { value: 20, label: '20' },
                { value: 50, label: '50' },
              ]}
            />
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" icon={<Copy className="w-3.5 h-3.5" />}>Copy</Button>
            <Button size="sm" icon={<FileSpreadsheet className="w-3.5 h-3.5" />}>CSV</Button>
            <Button size="sm" icon={<Printer className="w-3.5 h-3.5" />}>Print</Button>
          </div>
        </div>

      <div className="text-base text-slate-500 font-medium -mt-2">
        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalFiltered)} of {totalFiltered} entries
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-sm font-bold tracking-wider uppercase">
                <th className="py-4 px-6 text-center w-16">S.N.</th>
                <th className="py-4 px-6">Main Branch Name / मुख्य शाखा नाम</th>
                <th className="py-4 px-6">Department / विभाग</th>
                <th className="py-4 px-6 text-center w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <TableSkeleton columns={4} rows={6} message="Loading main branches..." />
              ) : mainBranches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No main branch records found.
                  </td>
                </tr>
              ) : (
                mainBranches.map((branch, index) => {
                  const handleRowMouseEnter = (e: React.MouseEvent<HTMLTableRowElement>) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.transition = 'transform 0.25s cubic-bezier(0.4,0,0.2,1)';
                  };
                  const handleRowMouseLeave = (e: React.MouseEvent<HTMLTableRowElement>) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  };

                  return (
                  <tr
                    key={branch.id ?? `branch-${index}`}
                    className="hover:bg-slate-50/50 transition"
                    onMouseEnter={handleRowMouseEnter}
                    onMouseLeave={handleRowMouseLeave}
                  >
                    <td className="py-4 px-6 text-center text-slate-400 font-medium">
                      {branch.sn}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {branch.name}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-600">
                      {branch.departmentName || '-'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button size="sm" onClick={() => handleEdit(branch)} icon={<Pencil className="w-3 h-3" />}>Edit</Button>
                        <Button size="sm" danger onClick={() => handleDelete(branch)} icon={<Trash2 className="w-3 h-3" />}>Delete</Button>
                      </div>
                    </td>
                    </tr>
                  );})
                )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-end pt-2">
        <Pagination
          total={totalFiltered}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 20, 50]}
        />
      </div>

      <CreateMainBranchDrawer
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={refreshMainBranches}
        editingBranch={editingBranch}
      />
    </div>
  );
}
