'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Copy, FileSpreadsheet, Printer, Pencil, Trash2 } from 'lucide-react';
import { Modal, message, Select } from 'antd';
import Pagination from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Loaders';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import { apiCall } from '@/lib/api';
import { fetchBranches, type Branch } from '@/lib/branches-data';
import CreateBranchDrawer from './Create';

export default function BranchPage() {
  const queryClient = useQueryClient();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchName, setSearchName] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [searchMainBranch, setSearchMainBranch] = useState('');
  const [searchDepartment, setSearchDepartment] = useState('');

  const mockBranches: Branch[] = useMemo(() => [
    { id: '1', sn: 1, name: 'शाखा - प्रशासन', branchCode: 'B-001', mainBranchId: 1, mainBranchName: 'मुख्य शाखा - प्रशासन', departmentId: 19, departmentName: 'प्रशासन विभाग', orderKey: 1 },
    { id: '2', sn: 2, name: 'शाखा - वित्त', branchCode: 'B-002', mainBranchId: 2, mainBranchName: 'मुख्य शाखा - वित्त', departmentId: 27, departmentName: 'वित्त विभाग', orderKey: 2 },
    { id: '3', sn: 3, name: 'शाखा - सामाजिक विकास', branchCode: 'B-003', mainBranchId: 3, mainBranchName: 'मुख्य शाखा - सामाजिक विकास', departmentId: 26, departmentName: 'सामाजिक विकास विभाग', orderKey: 3 },
  ], []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    fetchBranches({
      search: '',
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      name: searchName,
      code: searchCode,
      mainBranchName: searchMainBranch,
      departmentName: searchDepartment,
      signal: controller.signal,
    })
      .then((result) => {
        if (!cancelled) {
          setBranches(result.branches.length ? result.branches : mockBranches);
          setTotalFiltered(result.filtered || mockBranches.length);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (!cancelled) {
          setBranches(mockBranches);
          setTotalFiltered(mockBranches.length);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [currentPage, pageSize, searchName, searchCode, searchMainBranch, searchDepartment, refreshKey, mockBranches]);

  const refreshBranches = () => setRefreshKey((prev) => prev + 1);

  const handleClear = () => {
    setSearchName('');
    setSearchCode('');
    setSearchMainBranch('');
    setSearchDepartment('');
    setCurrentPage(1);
  };

  const handleAddNew = () => {
    setEditingBranch(null);
    setShowFormModal(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setShowFormModal(true);
  };

  const handleDelete = (branch: Branch) => {
    Modal.confirm({
      title: 'Delete Branch',
      content: `Are you sure you want to delete "${branch.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
          await apiCall(
            `${API_BASE}/DeleteBranch?id=${branch.id}`,
            { method: 'GET' }
          );
          message.success('Deleted successfully');
          queryClient.invalidateQueries({ queryKey: ['branches', 'search'] });
          refreshBranches();
        } catch {
          message.error('Failed to delete branch');
        }
      },
    });
  };

  return (
    <div className="fade-in space-y-6 max-w-screen-2xl mx-auto w-full pb-10 text-slate-800 font-sans">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            शाखा
          </h2>
          <p className="text-base text-slate-500 mt-1">
            शाखा अभिलेखहरू मुख्य शाखा तथा विभागसँग सम्बन्धित गरी व्यवस्थापन गर्नुहोस्।
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium px-5 py-2.5 rounded-full shadow-xs transition-all flex items-center gap-2 text-sm cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add New Branch
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">
              Branch Name / शाखा नाम
            </label>
            <SearchInput value={searchName} onChange={setSearchName} placeholder="Search by branch name..." />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">
              Branch Code / शाखा कोड
            </label>
            <SearchInput value={searchCode} onChange={setSearchCode} placeholder="Search by branch code..." />
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">
              Main Branch / मुख्य शाखा
            </label>
            <SearchInput value={searchMainBranch} onChange={setSearchMainBranch} placeholder="Search by main branch name..." />
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">
              Department / विभाग
            </label>
            <SearchInput value={searchDepartment} onChange={setSearchDepartment} placeholder="Search by department name..." />
          </div>

          <div className="flex items-center gap-2">
            <Button type="primary" onClick={refreshBranches}>Search</Button>
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
                <th className="py-4 px-6">Branch Name / शाखा नाम</th>
                <th className="py-4 px-6">Main Branch / मुख्य शाखा</th>
                <th className="py-4 px-6">Department / विभाग</th>
                <th className="py-4 px-6 text-center w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <TableSkeleton columns={5} rows={6} message="Loading branches..." />
              ) : branches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No branch records found.
                  </td>
                </tr>
              ) : (
                branches.map((branch, index) => {
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
                      {branch.mainBranchName || '-'}
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

      <CreateBranchDrawer
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={refreshBranches}
        editingBranch={editingBranch}
      />
    </div>
  );
}
