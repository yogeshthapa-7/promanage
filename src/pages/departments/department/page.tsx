'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  // Upload, 
  // Download, 
  Copy, 
  FileSpreadsheet, 
  Printer,
  Pencil,
  Trash2,
  FileInputIcon
} from 'lucide-react';
import { Modal, message, Select, Input } from 'antd';
import { InputNumber } from 'antd';
import Pagination from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Loaders';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { apiCall } from '@/lib/api';
import { fetchDepartments, fetchDepartmentSelectList, type Department, type DepartmentSelectOption } from '@/lib/departments-data';
import MainBranchPage from '../MainBranch/page';
import BranchPage from '../Branch/page';
// import DepartmentFormModal from './DepartmentFormModal';

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

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'department' | 'mainbranch' | 'branch'>('department');

  // Filter Form States
  const [filterDeptId, setFilterDeptId] = useState<string | undefined>(undefined);
  const [filterDeptCode, setFilterDeptCode] = useState('');
  const [filterMainDept, setFilterMainDept] = useState<string | undefined>(undefined);
  const [deptNameOptions, setDeptNameOptions] = useState<DepartmentSelectOption[]>([]);
  const [deptNameLoading, setDeptNameLoading] = useState(false);

  const debouncedDeptCode = useDebounce(filterDeptCode, 300);
  const debouncedMainDept = useDebounce(filterMainDept, 300);


   useEffect(() => {
    if (activeTab !== 'department') return;

    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    fetchDepartments({
      search: '',
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      departmentId: filterDeptId,
      code: debouncedDeptCode,
      mainDept: debouncedMainDept,
      signal: controller.signal,
    })
       .then((result) => {
         if (!cancelled) {
           setDepartments(result.departments);
           setTotalFiltered(result.filtered || result.departments.length);
           setLoading(false);
         }
       })
       .catch((err) => {
         if (err.name === 'AbortError') return;
         if (!cancelled) {
           setDepartments([]);
           setTotalFiltered(0);
           setLoading(false);
         }
       });
     return () => {
       cancelled = true;
       controller.abort();
     };
    }, [currentPage, pageSize, filterDeptId, debouncedDeptCode, debouncedMainDept, refreshKey, activeTab]);

  useEffect(() => {
    const controller = new AbortController();
    setDeptNameLoading(true);
    fetchDepartmentSelectList(controller.signal)
      .then((options) => setDeptNameOptions(options))
      .finally(() => {
        if (!controller.signal.aborted) setDeptNameLoading(false);
      });
    return () => controller.abort();
  }, []);

  const refreshDepartments = () => setRefreshKey((prev) => prev + 1);

  const handleClear = () => {
    setFilterDeptId(undefined);
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
           const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
           await apiCall(
             `${API_BASE}/DeleteDepartment?id=${dept.id}`,
             { method: 'GET' }
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
    <div className="fade-in space-y-6 max-w-screen-2xl mx-auto w-full pb-10 text-slate-800 font-sans">
      
      {/* 2. Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <Button type="text" onClick={() => setActiveTab('department')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'department' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-500'}`}>विभाग</Button>
        <Button type="text" onClick={() => setActiveTab('mainbranch')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'mainbranch' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-500'}`}>मुख्य शाखा</Button>
        <Button type="text" onClick={() => setActiveTab('branch')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'branch' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-500'}`}>शाखा</Button>
      </div>

      {activeTab === 'department' && (
        <>
      {/* 1. Department Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            विभागहरू
          </h2>
          <p className="text-base text-slate-500 mt-1">
            विभागीय अभिलेखहरू तथा अभिभावक‑सन्तान संगठन संरचना व्यवस्थापन गर्नुहोस्।
          </p>
        </div>
        <Button type="primary" onClick={handleAddNew} icon={<Plus className="w-4 h-4" />}>
          Add New Department
        </Button>
      </div>

      {/* 2. Filters & Actions Row */}
      <div className="space-y-4">
        {/* Single Row: Inputs + Inline Search & Clear */}
        <div className="flex flex-wrap items-end gap-3">
           <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                Department Name / विभागको नाम
              </label>
              <Select
                placeholder="Search by department name..."
                value={filterDeptId}
                onChange={(value) => setFilterDeptId(value)}
                options={deptNameOptions}
                className="w-full"
                allowClear
                loading={deptNameLoading}
                showSearch
                filterOption={(input, option) =>
                  ((option?.label ?? '') as string).toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>

<div className="flex-1 min-w-[200px]">
  <label className="block text-sm font-semibold text-slate-500 mb-1.5">
    Department Code / विभाग कोड
  </label>
  {/* <div className="relative flex items-center h-11 w-full rounded-xl border border-slate-200 bg-white px-3 shadow-2xs transition-all duration-200 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-400/20 hover:border-slate-300"> */}
    <Input
      type="text"
      placeholder="Search by department code..."
      value={filterDeptCode}
      onChange={(e) => setFilterDeptCode(e.target.value)}
      className="w-full rounded-2xl border-none bg-white py-2.5 px-4 text-sm text-slate-700 shadow-xs focus:ring-2 focus:ring-violet-400 outline-none transition placeholder:text-slate-300"
    />
  {/* </div> */}
</div>

           <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                Parent Department / प्रमुख विभाग
              </label>
              <Input
                type="text"
                placeholder="Search by parent department..."
                value={filterMainDept}
                onChange={(e) => setFilterMainDept(e.target.value)}
                className="w-full rounded-2xl border-none bg-white py-2.5 px-4 text-sm text-slate-700 shadow-xs focus:ring-2 focus:ring-violet-400 outline-none transition placeholder:text-slate-300"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button type="primary" onClick={refreshDepartments}>Search</Button>
              <Button onClick={handleClear}>Clear</Button>
            </div>
         </div>

        {/* Excel Upload/Download Row
        <div className="flex items-center gap-3">
          <button className="bg-white hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-full shadow-xs border border-slate-100 flex items-center gap-2 text-sm transition cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Upload Excel
          </button>
          <button className="bg-white hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-full shadow-xs border border-slate-100 flex items-center gap-2 text-sm transition cursor-pointer">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Download Excel
          </button>
        </div> */}
      </div>

      {/* 3. Table Controls Bar (Entries + Export utilities) */}
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

      {/* 4. ONLY Table is in a White Container Card */}
      <Card hover>
        {loading ? (
          <TableSkeleton columns={4} rows={6} message="Loading departments..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-sm font-bold tracking-wider uppercase">
                  <th className="py-4 px-6 text-center w-16">S.N.</th>
                  <th className="py-4 px-6">Department Name / विभागको नाम</th>
                  <th className="py-4 px-6">Parent Department / प्रमुख विभाग</th>
                  <th className="py-4 px-6 text-center w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      No department records found.
                    </td>
                  </tr>
                ) : (
                  departments.map((dept, index) => (
                    <tr key={dept.id ?? `dept-${index}`} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6 text-center text-slate-400 font-medium">
                        {dept.sn}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {dept.name}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-600">
                        {dept.parentDepartmentName || ' '}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" onClick={() => handleEdit(dept)} icon={<Pencil className="w-3 h-3" />}>Edit</Button>
                          <Button size="sm" danger onClick={() => handleDelete(dept)} icon={<Trash2 className="w-3 h-3" />}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
        </>
      )}

      {activeTab === 'mainbranch' && (
        <>
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
          <MainBranchPage activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
      {activeTab === 'branch' && (
        <>
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
          <BranchPage activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}

      {/* Modal
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
      /> */}
    </div>
  );
}