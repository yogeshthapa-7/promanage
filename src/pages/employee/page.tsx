'use client';

import { useState, useEffect, useRef } from 'react';
import { UserPlus, Edit2, Trash2, Copy, Download, Printer, Upload } from 'lucide-react';
import { Modal, message } from 'antd';
import { Button, Select } from 'antd';
import Pagination from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Loaders';
import Card from '@/components/ui/Card';
import SearchInput from '@/components/ui/SearchInput';
import { fetchEmployees, type Employee } from '@/lib/employees-data';
import EmployeeSetupModal from './Create';
import * as XLSX from 'xlsx';
import { apiCall } from '@/lib/api';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
import { usePaginatedList, type PaginatedListParams } from '@/hooks/usePaginatedList';
import { useQueryClient } from '@tanstack/react-query';

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

export default function EmployeePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [fullnameFilter, setFullnameFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedFullname = useDebounce(fullnameFilter, 300);
  const debouncedAddress = useDebounce(addressFilter, 300);
  const debouncedPhone = useDebounce(phoneFilter, 300);

  const {
    data: employees,
    total: totalFiltered,
    loading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<Employee>({
    fetcher: async (params: PaginatedListParams) => {
      const isLocalFilterActive = debouncedFullname !== '' || debouncedAddress !== '' || debouncedPhone !== '';
      const fetchStart = isLocalFilterActive ? 0 : (params.start as number);
      const fetchLength = isLocalFilterActive ? 10000 : (params.length as number);
      
      const result = await fetchEmployees({
        search: debouncedSearch,
        start: fetchStart,
        length: fetchLength,
        fullname: '', // Disable server-side filtering for these as backend doesn't support it
        address: '',
        phone: '',
        signal: params.signal,
      });

      let items = result.employees;
      let total = result.filtered;

      if (isLocalFilterActive) {
        items = items.filter((emp) => {
          const matchFullname =
            debouncedFullname === '' ||
            (emp.Fullname || '').toLowerCase().includes(debouncedFullname.trim().toLowerCase());
          const matchAddress =
            debouncedAddress === '' ||
            (emp.Address || '').toLowerCase().includes(debouncedAddress.trim().toLowerCase());
          const matchPhone =
            debouncedPhone === '' ||
            (emp.Phone || '').toLowerCase().includes(debouncedPhone.trim().toLowerCase());
          return matchFullname && matchAddress && matchPhone;
        });
        total = items.length;
        
        const pageStart = params.start as number;
        const pageLength = params.length as number;
        items = items.slice(pageStart, pageStart + pageLength);
      }

      return {
        items,
        total,
      };
    },
    initialPageSize: 20,
    extraDeps: [debouncedSearch, debouncedFullname, debouncedAddress, debouncedPhone],
  });

  const isFilterActive = debouncedFullname !== '' || debouncedAddress !== '' || debouncedPhone !== '' || debouncedSearch !== '';

  const filteredEmployees = employees;

  const queryClient = useQueryClient();

  const handleEditEmployee = (employee: Employee) => {
    setEditEmployee(employee);
    setShowEmployeeModal(true);
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    Modal.confirm({
      title: 'Remove Employee',
      content: (
        <span>
          Are you sure you want to remove <strong>{employee.Fullname}</strong> from the system?
        </span>
      ),
      okText: 'Remove',
      okType: 'danger',
      onOk: async () => {
        try {
          const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
          const deleteUrl = `${API_BASE}/DeleteEmployeeInfo?id=${employee.EmployeeInfoID}`;
          const res = await apiCall(deleteUrl, { method: 'GET' });
          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
          message.success('Employee removed successfully');
          queryClient.invalidateQueries({ queryKey: ['employees', 'search'] });
          refetch();
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Failed to delete employee');
        }
      },
    });
  };

  const handleEmployeeSaveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['employees', 'search'] });
    refetch();
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSearchQuery('');
    setFullnameFilter('');
    setAddressFilter('');
    setPhoneFilter('');
    setCurrentPage(1);
  };

  const handleCopy = () => {
    const headers = ['S.N.', 'Full Name', 'Address', 'Phone', 'Email', 'Department Name', 'Branch Name'];
    const rows = employees.map((emp) => [
      emp.SN,
      emp.Fullname,
      emp.Address,
      emp.Phone,
      emp.Email,
      // emp.DOB,
      emp.DepartmentName,
      emp.BranchName,
    ]);
    const text = [headers, ...rows].map((row) => row.join('\t')).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      message.success('Table data copied to clipboard');
    }).catch(() => {
      message.error('Failed to copy');
    });
  };

  const handleCSVExport = () => {
    const headers = ['S.N.', 'Full Name', 'Address', 'Phone', 'Email', 'Department Name', 'Branch Name'];
    const rows = employees.map((emp) => [
      emp.SN,
      emp.Fullname,
      emp.Address,
      emp.Phone,
      emp.Email,
      // emp.DOB,
      emp.DepartmentName,
      emp.BranchName,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.csv';
    a.click();
    URL.revokeObjectURL(url);
    message.success('CSV exported successfully');
  };

  const handleExcelExport = () => {
    const data = employees.map((emp) => ({
      'S.N.': emp.SN,
      'Full Name': emp.Fullname,
      Address: emp.Address,
      Phone: emp.Phone,
      Email: emp.Email,
      // DOB: emp.DOB,
      'Department Name': emp.DepartmentName,
      'Branch Name': emp.BranchName,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 8 },   // S.N.
      { wch: 24 },  // Full Name
      { wch: 28 },  // Address
      { wch: 16 },  // Phone
      { wch: 28 },  // Email
      { wch: 24 },  // Department Name
      { wch: 24 },  // Branch Name
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
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'employees.xlsx');
    message.success('Excel exported successfully');
  };

  const triggerExcelUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExtension = (file.name.split('.').pop() || 'xlsx').toLowerCase();
      const documentDetails = {
        DocumentType: 1,
        FileName: file.name,
        FileExtension: `.${fileExtension}`,
      };

      const uploadFormData = new FormData();
      uploadFormData.append('data', JSON.stringify(documentDetails));
      uploadFormData.append('file', file);
      uploadFormData.append('UserId', '0');

      const uploadRes = await apiCall(`${API_BASE}/FileUpload/UploadFile?UserId=0`, {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadRes.ok) throw new Error(`File upload failed: ${uploadRes.statusText}`);

      const uploadJson = await uploadRes.json();
      if (!uploadJson?.Success) {
        throw new Error(uploadJson?.Message || 'File upload failed');
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

          const newEmployees: Employee[] = jsonData.map((row, index) => ({
            EmployeeInfoID: Date.now() + index,
            SN: (row['S.N.'] as number) || index + 1,
            Fullname: (row['Full Name'] as string) || (row.Fullname as string) || '',
            Address: (row.Address as string) || '',
            Phone: (row.Phone as string) || '',
            Email: (row.Email as string) || '',
            // DOB: (row.DOB as string) || '',
            DepartmentID: (row.DepartmentID as number) || 0,
            DepartmentName: (row['Department Name'] as string) || (row.DepartmentName as string) || '',
            BranchID: (row.BranchID as number) || 0,
            BranchName: (row['Branch Name'] as string) || (row.BranchName as string) || '',
            MainBranchID: (row.MainBranchID as number) || 0,
            MainBranchName: (row.MainBranchName as string) || '',
            Gender: (row.Gender as number) || 1,
            EmpStatus: (row.EmpStatus as number) || 1,
            Status: (row.Status as number) || 1,
            OrganizationOfficeID: (row.OrganizationOfficeID as number) || 1,
            Photo: (row.Photo as string) || '',
          }));

          setEmployees((prev) => [...newEmployees, ...prev]);
          message.success(`${newEmployees.length} employees imported successfully`);
        } catch {
          message.error('Failed to import file. Please check the format.');
        }
      };
      reader.readAsBinaryString(file);
    } catch {
      message.error('Failed to upload file. Please try again.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-area fade-in text-slate-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Employees</h1>
          <p className="mt-1 text-base text-slate-500">
            Manage employee records, their departments, and contact information.
          </p>
        </div>

        <Button type="primary" onClick={() => { setEditEmployee(null); setShowEmployeeModal(true); }} icon={<UserPlus className="h-4 w-4" strokeWidth={2.5} />} className="no-print">
          Add Employee
        </Button>
      </div>
      <hr className="border-slate-200 my-6 no-print" />

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end no-print">
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">Full Name</div>
          <SearchInput value={fullnameFilter} onChange={setFullnameFilter} placeholder="Search by full name..." />
        </div>
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">Address</div>
          <SearchInput value={addressFilter} onChange={setAddressFilter} placeholder="Search by address..." />
        </div>
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">Phone</div>
          <SearchInput value={phoneFilter} onChange={setPhoneFilter} placeholder="Search by phone..." />
        </div>
        <div className="flex gap-2">
          <Button type="primary" onClick={handleSearch}>Search</Button>
          <Button onClick={handleClear}>Clear</Button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 no-print">
        <Button icon={<Upload className="h-4 w-4" />} onClick={triggerExcelUpload}>Upload Excel</Button>
        <Button icon={<Download className="h-4 w-4" />} onClick={handleExcelExport}>Download Excel</Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4 no-print">
          {/* <div className="flex items-center gap-3">
            <span className="text-base text-slate-500">Show</span>
            <Select
              value={pageSize}
              onChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
              className="w-20"
              options={[
                { value: 20, label: '20' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
              ]}
            />
            <span className="text-base text-slate-500">entries</span>
          </div> */}
          <div className="flex items-center gap-2">
            <Button size="small" icon={<Copy className="h-3.5 w-3.5" />} onClick={handleCopy}>Copy</Button>
            <Button size="small" icon={<Download className="h-3.5 w-3.5" />} onClick={handleCSVExport}>CSV</Button>
            <Button size="small" icon={<Printer className="h-3.5 w-3.5" />} onClick={handlePrint}>Print</Button>
          </div>
        </div>
        <div className="mb-2 text-base text-slate-500 no-print">
          Showing {filteredEmployees.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {(currentPage - 1) * pageSize + filteredEmployees.length} of {totalFiltered} entries
        </div>
        <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-1.5">
            <thead>
              <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                <th className="rounded-l-xl bg-slate-50 px-4 py-3">S.N.</th>
                <th className="bg-slate-50 px-4 py-3">Full Name</th>
                <th className="bg-slate-50 px-4 py-3">Address</th>
                <th className="bg-slate-50 px-4 py-3">Phone</th>
                <th className="bg-slate-50 px-4 py-3">Email</th>
                {/* <th className="bg-slate-50 px-4 py-3">DOB</th> */}
                <th className="bg-slate-50 px-4 py-3">Department Name</th>
                <th className="bg-slate-50 px-4 py-3">Branch Name</th>
                <th className="rounded-r-xl bg-slate-50 px-4 py-3 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton columns={9} rows={6} message="Loading employees..." />
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-base text-slate-400">
                    No employees found
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const handleRowMouseEnter = (e: React.MouseEvent<HTMLTableRowElement>) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.transition = 'transform 0.25s cubic-bezier(0.4,0,0.2,1)';
                  };
                  const handleRowMouseLeave = (e: React.MouseEvent<HTMLTableRowElement>) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  };

                  return (
                  <tr
                    key={emp.EmployeeInfoID}
                    className="text-sm text-slate-700"
                    onMouseEnter={handleRowMouseEnter}
                    onMouseLeave={handleRowMouseLeave}
                  >
                    <td className="rounded-l-xl bg-white px-4 py-3 border-b border-slate-100">
                      {emp.SN}
                    </td>
                    <td className="bg-white px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">
                      {emp.Fullname}
                    </td>
                    <td className="bg-white px-4 py-3 border-b border-slate-100">
                      {emp.Address}
                    </td>
                    <td className="bg-white px-4 py-3 border-b border-slate-100">
                      {emp.Phone}
                    </td>
                    <td className="bg-white px-4 py-3 border-b border-slate-100">
                      {emp.Email}
                    </td>
                    {/* <td className="bg-white px-4 py-3 border-b border-slate-100">
                      {emp.DOB}
                    </td> */}
                    <td className="bg-white px-4 py-3 border-b border-slate-100">
                      {emp.DepartmentName}
                    </td>
                    <td className="bg-white px-4 py-3 border-b border-slate-100">
                      {emp.BranchName}
                    </td>
                    <td className="rounded-r-xl bg-white px-4 py-3 text-right border-b border-slate-100 no-print">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="small" onClick={() => handleEditEmployee(emp)} icon={<Edit2 className="h-3.5 w-3.5" />}>Edit</Button>
                        <Button size="small" danger onClick={() => handleDeleteEmployee(emp)} icon={<Trash2 className="h-3.5 w-3.5" />}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                );})
              )}
            </tbody>
          </table>
        </div>
        </Card>

        <Pagination
          total={totalFiltered}
          className="no-print"
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[20, 50, 100]}
        />
      </div>

      <EmployeeSetupModal
        open={showEmployeeModal}
        onClose={() => {
          setShowEmployeeModal(false);
          setEditEmployee(null);
        }}
        editingEmployee={editEmployee}
        onSuccess={handleEmployeeSaveSuccess}
      />
    </div>
  );
}
