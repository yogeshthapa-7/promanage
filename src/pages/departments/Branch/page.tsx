'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Copy, FileSpreadsheet, Printer, Pencil, Trash2 } from 'lucide-react';
import { Modal, message } from 'antd';
import Pagination from '@/components/ui/Pagination';
import { apiCall } from '@/lib/api';
import { fetchBranches, type Branch } from '@/lib/branches-data';

export default function BranchPage() {
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
          await apiCall(
            `https://datacollection.kathmandu.gov.np:8080/DeleteBranch?id=${branch.id}`,
            { method: 'GET' }
          );
          message.success('Deleted successfully');
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
            Manage branch records and organization structure.
          </p>
        </div>
        {/* <button
          onClick={handleAddNew}
          className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium px-5 py-2.5 rounded-full shadow-xs transition-all flex items-center gap-2 text-sm cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Branch
        </button> */}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">
              Branch Name / शाखा नाम
            </label>
            <input
              type="text"
              placeholder="Search by branch name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full rounded-2xl border-none bg-white py-2.5 px-4 text-sm text-slate-700 shadow-xs focus:ring-2 focus:ring-violet-400 outline-none transition placeholder:text-slate-300"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">
              Code / शाखा कोड
            </label>
            <input
              type="text"
              placeholder="Search by branch code..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full rounded-2xl border-none bg-white py-2.5 px-4 text-sm text-slate-700 shadow-xs focus:ring-2 focus:ring-violet-400 outline-none transition placeholder:text-slate-300"
            />
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">
              Main Branch / मुख्य शाखा
            </label>
            <input
              type="text"
              placeholder="Search by main branch name..."
              value={searchMainBranch}
              onChange={(e) => setSearchMainBranch(e.target.value)}
              className="w-full rounded-2xl border-none bg-white py-2.5 px-4 text-sm text-slate-700 shadow-xs focus:ring-2 focus:ring-violet-400 outline-none transition placeholder:text-slate-300"
            />
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">
              Department / विभाग
            </label>
            <input
              type="text"
              placeholder="Search by department name..."
              value={searchDepartment}
              onChange={(e) => setSearchDepartment(e.target.value)}
              className="w-full rounded-2xl border-none bg-white py-2.5 px-4 text-sm text-slate-700 shadow-xs focus:ring-2 focus:ring-violet-400 outline-none transition placeholder:text-slate-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshBranches}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium py-2.5 px-7 rounded-full shadow-xs transition-all text-sm cursor-pointer active:scale-95"
            >
              Search
            </button>
            <button
              onClick={handleClear}
              className="bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-6 rounded-full shadow-xs transition-all text-sm cursor-pointer border border-slate-100 active:scale-95"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 text-base text-slate-500 font-medium">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-xl border-none bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-xs focus:ring-2 focus:ring-violet-400 outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="bg-white hover:bg-slate-50 text-slate-600 font-medium px-3.5 py-1.5 rounded-xl text-sm shadow-xs border border-slate-100 flex items-center gap-1.5 transition">
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
          <button className="bg-white hover:bg-slate-50 text-slate-600 font-medium px-3.5 py-1.5 rounded-xl text-sm shadow-xs border border-slate-100 flex items-center gap-1.5 transition">
            <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
          </button>
          <button className="bg-white hover:bg-slate-50 text-slate-600 font-medium px-3.5 py-1.5 rounded-xl text-sm shadow-xs border border-slate-100 flex items-center gap-1.5 transition">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      <div className="text-base text-slate-500 font-medium -mt-2">
        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalFiltered)} of {totalFiltered} entries
      </div>

      <div className="bg-white rounded-t-3xl rounded-b-xl shadow-xs border border-slate-100/80 overflow-hidden">
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
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading branches...
                  </td>
                </tr>
              ) : branches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No branch records found.
                  </td>
                </tr>
              ) : (
                branches.map((branch, index) => (
                  <tr key={branch.id ?? `branch-${index}`} className="hover:bg-slate-50/50 transition">
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
                        <button
                          onClick={() => handleEdit(branch)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-3.5 py-1.5 rounded-full flex items-center gap-1 text-sm font-semibold transition cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(branch)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-500 px-3.5 py-1.5 rounded-full flex items-center gap-1 text-sm font-semibold transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
}
