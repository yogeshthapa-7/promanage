'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Upload, 
  Download, 
  Copy, 
  FileSpreadsheet, 
  Printer,
  Pencil,
  Trash2
} from 'lucide-react';
import { Modal, message, Select } from 'antd';
import Pagination from '@/components/ui/Pagination';
import { fetchDepartments, type Department } from '@/lib/departments-data';
import DepartmentFormModal from './DepartmentFormModal';

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter Form States
  const [filterDeptName, setFilterDeptName] = useState('');
  const [filterDeptCode, setFilterDeptCode] = useState('');
  const [filterMainDept, setFilterMainDept] = useState<string | undefined>(undefined);

  const mainDepartmentOptions = [
    { value: '1', label: 'प्रशासन विभाग' },
    { value: '2', label: 'वित्तीय विभाग' },
    { value: '3', label: 'सार्वजनिक निर्माण विभाग' },
    { value: '4', label: 'योजना तथा अनुगमन विभाग' },
    { value: '5', label: 'कानुन शाखा' },
  ];

  const mockDepartments: Department[] = useMemo(() => [
    { id: '1', sn: 1, name: 'प्रशासन विभाग', subTaskCount: 3 },
    { id: '2', sn: 2, name: 'राजस्व विभाग', subTaskCount: 2 },
    { id: '3', sn: 3, name: 'सार्वजनिक निर्माण विभाग', subTaskCount: 4 },
    { id: '4', sn: 4, name: 'योजना तथा अनुगमन विभाग', subTaskCount: 3 },
    { id: '5', sn: 5, name: 'कानुन शाखा', subTaskCount: 2 },
  ], []);

  useEffect(() => {
    setLoading(true);
    fetchDepartments({
      search: '',
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      name: filterDeptName,
      code: filterDeptCode,
      mainDept: filterMainDept,
    })
      .then((result) => {
        setDepartments(result.departments.length ? result.departments : mockDepartments);
        setTotalFiltered(result.filtered || mockDepartments.length);
        setLoading(false);
      })
      .catch(() => {
        setDepartments(mockDepartments);
        setTotalFiltered(mockDepartments.length);
        setLoading(false);
      });
  }, [currentPage, pageSize, filterDeptName, filterDeptCode, filterMainDept, refreshKey, mockDepartments]);

  const refreshDepartments = () => setRefreshKey((prev) => prev + 1);

  const handleClear = () => {
    setFilterDeptName('');
    setFilterDeptCode('');
    setFilterMainDept(undefined);
    setCurrentPage(1);
  };

  const handleAddNew = () => {
    setEditingDept(null);
    setShowFormModal(true);
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setShowFormModal(true);
  };

  const handleDelete = (dept: Department) => {
    Modal.confirm({
      title: 'Delete Department',
      content: `Are you sure you want to delete "${dept.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          await fetch(
            `https://datacollection.kathmandu.gov.np:8080/DeleteDepartment?id=${dept.id}`,
            {
              method: 'GET',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );
          message.success('Deleted successfully');
          refreshDepartments();
        } catch {
          message.error('Failed to delete department');
        }
      },
    });
  };

  return (
    /* Direct Page Canvas - Background wave/gradient style */
    <div className="p-6 md:p-10 space-y-6 min-h-screen text-slate-800 font-sans">
      
      {/* 1. Header (Floating directly on background) */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Departments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage department records, sub-tasks, and organization structure.
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium px-5 py-2.5 rounded-full shadow-xs transition-all flex items-center gap-2 text-sm cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* 2. Filters & Actions Row (Floating directly on background) */}
      <div className="space-y-4">
        {/* Single Row: Inputs + Inline Search & Clear */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Full Name / विभागको नाम
            </label>
            <input
              type="text"
              placeholder="Search by department name..."
              value={filterDeptName}
              onChange={(e) => setFilterDeptName(e.target.value)}
              className="w-full rounded-2xl border-none bg-white py-2.5 px-4 text-sm text-slate-700 shadow-xs focus:ring-2 focus:ring-violet-400 outline-none transition placeholder:text-slate-300"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Code / विभाग कोड
            </label>
            <input
              type="text"
              placeholder="Search by department code..."
              value={filterDeptCode}
              onChange={(e) => setFilterDeptCode(e.target.value)}
              className="w-full rounded-2xl border-none bg-white py-2.5 px-4 text-sm text-slate-700 shadow-xs focus:ring-2 focus:ring-violet-400 outline-none transition placeholder:text-slate-300"
            />
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Parent Department / प्रमुख विभाग
            </label>
            <Select
              placeholder="Search by parent department..."
              value={filterMainDept}
              onChange={(val) => setFilterMainDept(val)}
              options={mainDepartmentOptions}
              allowClear
              className="w-full custom-rounded-select"
              style={{ height: '42px' }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshDepartments}
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

        {/* Excel Upload/Download Row */}
        <div className="flex items-center gap-3">
          <button className="bg-white hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-full shadow-xs border border-slate-100 flex items-center gap-2 text-xs transition cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Upload Excel
          </button>
          <button className="bg-white hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-full shadow-xs border border-slate-100 flex items-center gap-2 text-xs transition cursor-pointer">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Download Excel
          </button>
        </div>
      </div>

      {/* 3. Table Controls Bar (Entries + Export utilities) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
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
          <button className="bg-white hover:bg-slate-50 text-slate-600 font-medium px-3.5 py-1.5 rounded-xl text-xs shadow-xs border border-slate-100 flex items-center gap-1.5 transition">
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
          <button className="bg-white hover:bg-slate-50 text-slate-600 font-medium px-3.5 py-1.5 rounded-xl text-xs shadow-xs border border-slate-100 flex items-center gap-1.5 transition">
            <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
          </button>
          <button className="bg-white hover:bg-slate-50 text-slate-600 font-medium px-3.5 py-1.5 rounded-xl text-xs shadow-xs border border-slate-100 flex items-center gap-1.5 transition">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-500 font-medium -mt-2">
        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalFiltered)} of {totalFiltered} entries
      </div>

      {/* 4. ONLY Table is in a White Container Card */}
      <div className="bg-white rounded-t-3xl rounded-b-xl shadow-xs border border-slate-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold tracking-wider uppercase">
                <th className="py-4 px-6 text-center w-16">S.N.</th>
                <th className="py-4 px-6">Department Name / विभागको नाम</th>
                <th className="py-4 px-6 text-center">Sub Tasks</th>
                <th className="py-4 px-6 text-center w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Loading departments...
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No department records found.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 text-center text-slate-400 font-medium">
                      {dept.sn}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {dept.name}
                    </td>
                    <td className="py-4 px-6 text-center font-medium text-slate-600">
                      {dept.subTaskCount}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(dept)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-3.5 py-1.5 rounded-full flex items-center gap-1 text-[11px] font-semibold transition cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(dept)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-500 px-3.5 py-1.5 rounded-full flex items-center gap-1 text-[11px] font-semibold transition cursor-pointer"
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

      {/* 5. Pagination */}
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

      {/* Modal */}
      <DepartmentFormModal
        open={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingDept(null);
        }}
        onSuccess={() => {
          setShowFormModal(false);
          setEditingDept(null);
          setCurrentPage(1);
          refreshDepartments();
          message.success('Department saved successfully');
        }}
        editingDepartment={editingDept}
      />
    </div>
  );
}