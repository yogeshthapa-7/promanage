import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, FileSpreadsheet, Printer, Pencil, Trash2, Download } from 'lucide-react';
import { Modal, message, Select, Input } from 'antd';
import Pagination from '@/components/ui/Pagination';
import AppTable from '@/components/ui/AppTable';
import { TableSkeleton } from '@/components/ui/Loaders';
import Button from '@/components/ui/Button';
import { apiCall } from '@/services/apiservice';
import { fetchBranches, fetchBranchSelectList } from '@/services/branchservice';
import type { Branch, BranchSelectOption } from '@/types/branches-types';
import {
  fetchMainBranchSelectList,
} from '@/services/mainbranchservice';
import type { MainBranchSelectOption } from '@/types/main-branches-types';
import {
  fetchDepartmentSelectList,
} from '@/services/departmentservice';
import type { DepartmentSelectOption } from '@/types/departments-types';
import CreateBranchDrawer from './Create';
import { usePaginatedList, type PaginatedListParams } from '@/hooks/usePaginatedList';
import { exportCsv } from '@/utils/csv';
import * as XLSX from 'xlsx';

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

const mockBranches: Branch[] = [
  { id: '1', sn: 1, name: 'शाखा - प्रशासन', branchCode: 'B-001', mainBranchId: 1, mainBranchName: 'मुख्य शाखा - प्रशासन', departmentId: 19, departmentName: 'प्रशासन विभाग', orderKey: 1 },
  { id: '2', sn: 2, name: 'शाखा - वित्त', branchCode: 'B-002', mainBranchId: 2, mainBranchName: 'मुख्य शाखा - वित्त', departmentId: 27, departmentName: 'वित्त विभाग', orderKey: 2 },
  { id: '3', sn: 3, name: 'शाखा - सामाजिक विकास', branchCode: 'B-003', mainBranchId: 3, mainBranchName: 'मुख्य शाखा - सामाजिक विकास', departmentId: 26, departmentName: 'सामाजिक विकास विभाग', orderKey: 3 },
];

function fetchBranchesPage(params: PaginatedListParams): Promise<{ items: Branch[]; total: number }> {
  return fetchBranches({
    search: '',
    start: params.start as number,
    length: params.length as number,
    name: params.name as string | undefined,
    code: params.code as string | undefined,
    mainBranchId: params.mainBranchId as number | undefined,
    mainBranchName: params.mainBranchName as string | undefined,
    departmentId: params.departmentId as number | undefined,
    departmentName: params.departmentName as string | undefined,
    signal: params.signal,
  }).then((result) => ({
    items: result.branches,
    total: result.filtered,
  })).catch(() => ({
    items: mockBranches,
    total: mockBranches.length,
  }));
}

//localbodylevel:
 interface BranchPageProps {
  disabledMainBranch?: boolean;
  defaultMainBranchId?: string | number;
  disabledDepartment?: boolean;
  defaultDepartmentId?: string | number;
} 

export default function BranchPage( { disabledMainBranch, defaultMainBranchId, disabledDepartment, defaultDepartmentId }: BranchPageProps ) {
  const queryClient = useQueryClient();
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const [branchNameId, setBranchNameId] = useState<string | undefined>(undefined);
  const [searchCode, setSearchCode] = useState('');
  const [mainBranchId, setMainBranchId] = useState<string | undefined>(defaultMainBranchId !== undefined ? String(defaultMainBranchId) : undefined);
  const [departmentId, setDepartmentId] = useState<string | undefined>(defaultDepartmentId !== undefined ? String(defaultDepartmentId) : undefined);

  const [branchOptions, setBranchOptions] = useState<BranchSelectOption[]>([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [mainBranchOptions, setMainBranchOptions] = useState<MainBranchSelectOption[]>([]);
  const [mainBranchLoading, setMainBranchLoading] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentSelectOption[]>([]);
  const [departmentLoading, setDepartmentLoading] = useState(false);

  const debouncedSearchCode = useDebounce(searchCode, 300);

  /* eslint-disable react-hooks/set-state-in-effect -- select list loading state */
  useEffect(() => {
    const controller = new AbortController();
    setBranchLoading(true);
    fetchBranchSelectList(controller.signal)
      .then((options) => setBranchOptions(options))
      .finally(() => {
        if (!controller.signal.aborted) setBranchLoading(false);
      });
    return () => controller.abort();
  }, []);

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

  /* eslint-enable react-hooks/set-state-in-effect */

  const {
    data: branches,
    total: totalFiltered,
    loading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<Branch>({
    fetcher: fetchBranchesPage,
    initialPageSize: 20,
    extraDeps: [debouncedSearchCode, branchNameId, mainBranchId, departmentId],
    extraParams: {
      code: debouncedSearchCode,
      name: branchNameId ? branchOptions.find(o => o.value === branchNameId)?.label : undefined,
      mainBranchId: mainBranchId ? Number(mainBranchId) : undefined,
      mainBranchName: mainBranchId ? mainBranchOptions.find(o => o.value === mainBranchId)?.label : undefined,
      departmentId: departmentId ? Number(departmentId) : undefined,
    },
  });

  const refreshBranches = () => refetch();

  const handleClear = () => {
    setBranchNameId(undefined);
    setSearchCode('');
    setMainBranchId(disabledMainBranch ? (defaultMainBranchId !== undefined ? String(defaultMainBranchId) : undefined) : undefined);
    setDepartmentId(disabledDepartment ? (defaultDepartmentId !== undefined ? String(defaultDepartmentId) : undefined) : undefined);
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
          refetch();
        } catch {
          message.error('Failed to delete branch');
        }
      },
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCsvExport = () => {
    exportCsv(
      'branches.csv',
      [
        { header: 'S.N.', value: (b: Branch) => b.sn },
        { header: 'Branch Name', value: (b: Branch) => b.name },
        { header: 'Branch Code', value: (b: Branch) => b.branchCode },
        { header: 'Main Branch', value: (b: Branch) => b.mainBranchName },
        { header: 'Department', value: (b: Branch) => b.departmentName },
      ],
      branches
    );
    message.success('CSV exported successfully');
  };

  const handleExcelExport = () => {
    const data = branches.map((b) => ({
      'S.N.': b.sn,
      'Branch Name': b.name,
      'Branch Code': b.branchCode,
      'Main Branch': b.mainBranchName,
      'Department': b.departmentName,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 8 },
      { wch: 32 },
      { wch: 16 },
      { wch: 28 },
      { wch: 28 },
    ];
    const range = XLSX.utils.decode_range(ws['!ref'] as string);
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        const cell = ws[ref];
        if (!cell) continue;
        cell.s = {
          alignment: { vertical: 'center', horizontal: 'left', indent: 1, wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'D0D5DD' } },
            bottom: { style: 'thin', color: { rgb: 'D0D5DD' } },
            left: { style: 'thin', color: { rgb: 'D0D5DD' } },
            right: { style: 'thin', color: { rgb: 'D0D5DD' } },
          },
        };
      }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Branches');
    XLSX.writeFile(wb, 'branches.xlsx');
    message.success('Excel exported successfully');
  };

  const columns = [
    {
      title: 'S.N.',
      dataIndex: 'sn',
      key: 'sn',
      width: 64,
      align: 'center',
      className: 'text-slate-400 font-medium',
    },
    {
      title: 'Branch Name / शाखा नाम',
      dataIndex: 'name',
      key: 'name',
      className: 'font-bold text-slate-800',
    },
    {
      title: 'Main Branch / महाशाखा',
      dataIndex: 'mainBranchName',
      key: 'mainBranchName',
      className: 'font-medium text-slate-600',
      render: (text: string) => text || '-',
    },
    {
      title: 'Department / विभाग',
      dataIndex: 'departmentName',
      key: 'departmentName',
      className: 'font-medium text-slate-600',
      render: (text: string) => text || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      align: 'center',
      className: 'no-print',
      render: (_: any, branch: Branch) => (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" onClick={() => handleEdit(branch)} icon={<Pencil className="w-3 h-3" />}>Edit</Button>
          <Button size="sm" danger onClick={() => handleDelete(branch)} icon={<Trash2 className="w-3 h-3" />}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="print-area fade-in space-y-6 max-w-screen-2xl mx-auto w-full pb-10 text-slate-800 font-sans">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            शाखा
          </h2>
          <p className="text-base text-slate-500 mt-1 no-print">
            शाखा अभिलेखहरूमहाशाखा तथा विभागसँग सम्बन्धित गरी व्यवस्थापन गर्नुहोस्।
          </p>
        </div>
        <Button type="primary" onClick={handleAddNew} icon={<Plus className="w-4 h-4" />} className="no-print">
          Add New Branch
        </Button>
      </div>

      <div className="space-y-4 no-print">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">
              Branch Name / शाखा नाम
            </label>
            <Select
              placeholder="Select branch..."
              value={branchNameId}
              onChange={(value) => setBranchNameId(value)}
              options={branchOptions}
              className="w-full"
              allowClear
              loading={branchLoading}
              showSearch
              filterOption={(input, option) =>
                ((option?.label ?? '') as string).toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">
              Branch Code / शाखा कोड
            </label>
            <Input value={searchCode} onChange={(e) => setSearchCode(e.target.value)} placeholder="Search by branch code..." />
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">
              Main Branch /महाशाखा
            </label>
            <Select
              placeholder="Select main branch..."
              value={mainBranchId}
              onChange={(value) => setMainBranchId(value)}
              options={mainBranchOptions}
              className="w-full"
              allowClear={!disabledMainBranch}
              loading={mainBranchLoading}
              showSearch
              filterOption={(input, option) =>
                ((option?.label ?? '') as string).toLowerCase().includes(input.toLowerCase())
              }
              disabled={disabledMainBranch}
            />
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">
              Department / विभाग
            </label>
            <Select
              placeholder="Select department..."
              value={departmentId}
              onChange={(value) => setDepartmentId(value)}
              options={departmentOptions}
              className="w-full"
              allowClear={!disabledDepartment}
              loading={departmentLoading}
              showSearch
              filterOption={(input, option) =>
                ((option?.label ?? '') as string).toLowerCase().includes(input.toLowerCase())
              }
              disabled={disabledDepartment}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button type="primary" onClick={refreshBranches}>Search</Button>
            <Button onClick={handleClear}>Clear</Button>
          </div>
        </div>
      </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 no-print">
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
            <Button size="sm" icon={<FileSpreadsheet className="w-3.5 h-3.5" />} onClick={handleCsvExport}>CSV</Button>
            <Button size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={handleExcelExport}>Excel</Button>
            <Button size="sm" icon={<Printer className="w-3.5 h-3.5" />} onClick={handlePrint}>Print</Button>
          </div>
        </div>

      <div className="text-base text-slate-500 font-medium mt-3 no-print">
        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalFiltered)} of {totalFiltered} entries
      </div>

       <AppTable
         columns={columns}
         dataSource={branches}
         loading={loading}
         rowKey={(branch, index) => branch.id ?? `branch-${index}`}
       />


      <div className="flex justify-end pt-2 no-print">
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
        //localbodylevel:
        disabledMainBranch={disabledMainBranch}
        defaultMainBranchId={defaultMainBranchId}
        disabledDepartment={disabledDepartment}
        defaultDepartmentId={defaultDepartmentId}
      />
    </div>
  );
}

