'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { UserPlus, Edit2, Trash2, Copy, Download, Printer, Upload } from 'lucide-react';
import { Modal, message, Button } from 'antd';
import Pagination from '@/components/ui/Pagination';
import { fetchEmployees, type Employee } from '@/lib/employees-data';
import EmployeeSetupModal from './Create';
import * as XLSX from 'xlsx';

export default function EmployeePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [fullnameFilter, setFullnameFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setLoading(true);
    fetchEmployees({
      search: searchQuery,
      start: 0,
      length: 10000,
    })
      .then((result) => {
        setEmployees(result.employees);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch employees:', err);
        setLoading(false);
      });
  }, [searchQuery, refreshKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filteredEmployees = useMemo(() => {
    let result = employees;
    if (fullnameFilter.trim()) {
      const q = fullnameFilter.toLowerCase();
      result = result.filter((e) => e.Fullname.toLowerCase().includes(q));
    }
    if (addressFilter.trim()) {
      const q = addressFilter.toLowerCase();
      result = result.filter((e) => e.Address.toLowerCase().includes(q));
    }
    if (phoneFilter.trim()) {
      const q = phoneFilter;
      result = result.filter((e) => e.Phone.includes(q));
    }
    return result;
  }, [employees, fullnameFilter, addressFilter, phoneFilter]);

  const totalFiltered = filteredEmployees.length;
  const start = (currentPage - 1) * pageSize;
  const paginatedEmployees = filteredEmployees.slice(start, start + pageSize);

  const handleEditEmployee = (employee: Employee) => {
    setEditEmployee(employee);
    setShowEmployeeModal(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setDeleteTarget(employee);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const deleteUrl = `https://datacollection.kathmandu.gov.np:8080/DeleteEmployeeInfo?id=${deleteTarget.EmployeeInfoID}`;
      const res = await fetch(deleteUrl, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

      setEmployees((prev) => prev.filter((e) => e.EmployeeInfoID !== deleteTarget.EmployeeInfoID));
      message.success('Employee removed successfully');
      setDeleteTarget(null);
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to delete employee');
      }
    } finally {
      setDeleteLoading(false);
    }
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
    const headers = ['S.N.', 'Full Name', 'Address', 'Phone', 'Email', 'DOB', 'Department Name', 'Branch Name'];
    const rows = filteredEmployees.map((emp) => [
      emp.SN,
      emp.Fullname,
      emp.Address,
      emp.Phone,
      emp.Email,
      emp.DOB,
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
    const headers = ['S.N.', 'Full Name', 'Address', 'Phone', 'Email', 'DOB', 'Department Name', 'Branch Name'];
    const rows = filteredEmployees.map((emp) => [
      emp.SN,
      emp.Fullname,
      emp.Address,
      emp.Phone,
      emp.Email,
      emp.DOB,
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
    const data = filteredEmployees.map((emp) => ({
      'S.N.': emp.SN,
      'Full Name': emp.Fullname,
      Address: emp.Address,
      Phone: emp.Phone,
      Email: emp.Email,
      DOB: emp.DOB,
      'Department Name': emp.DepartmentName,
      'Branch Name': emp.BranchName,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'employees.xlsx');
    message.success('Excel exported successfully');
  };

  const triggerExcelUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
          DOB: (row.DOB as string) || '',
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Employees</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage employee records, their departments, and contact information.
          </p>
        </div>

        <button
          onClick={() => {
            setEditEmployee(null);
            setShowEmployeeModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 shadow-sm"
        >
          <UserPlus className="h-4 w-4" strokeWidth={2.5} />
          Add Employee
        </button>
      </div>
      <hr className="border-slate-200 my-6" />

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
        <div>
          <div className="mb-1 text-xs font-medium text-slate-500">Full Name</div>
          <input
            placeholder="Search by full name..."
            value={fullnameFilter}
            onChange={(e) => setFullnameFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-slate-500">Address</div>
          <input
            placeholder="Search by address..."
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-slate-500">Phone</div>
          <input
            placeholder="Search by phone..."
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Search
          </button>
          <button
            onClick={handleClear}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={triggerExcelUpload}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Upload className="h-4 w-4" />
          Upload Excel
        </button>
        <button
          onClick={handleExcelExport}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Download Excel
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-slate-500">entries</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
            <button
              onClick={handleCSVExport}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl bg-white border border-slate-200">
          <table className="w-full border-separate border-spacing-y-1.5">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="rounded-l-xl bg-slate-50 px-4 py-3">S.N.</th>
                <th className="bg-slate-50 px-4 py-3">Full Name</th>
                <th className="bg-slate-50 px-4 py-3">Address</th>
                <th className="bg-slate-50 px-4 py-3">Phone</th>
                <th className="bg-slate-50 px-4 py-3">Email</th>
                <th className="bg-slate-50 px-4 py-3">DOB</th>
                <th className="bg-slate-50 px-4 py-3">Department Name</th>
                <th className="bg-slate-50 px-4 py-3">Branch Name</th>
                <th className="rounded-r-xl bg-slate-50 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-400">
                    Loading employees...
                  </td>
                </tr>
              ) : paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-400">
                    No employees found
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => (
                  <tr key={emp.EmployeeInfoID} className="text-sm text-slate-700">
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
                    <td className="bg-white px-4 py-3 border-b border-slate-100">
                      {emp.DOB}
                    </td>
                    <td className="bg-white px-4 py-3 border-b border-slate-100">
                      {emp.DepartmentName}
                    </td>
                    <td className="bg-white px-4 py-3 border-b border-slate-100">
                      {emp.BranchName}
                    </td>
                    <td className="rounded-r-xl bg-white px-4 py-3 text-right border-b border-slate-100">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditEmployee(emp)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 transition"
                        >
                          <Edit2 className="h-3.5 w-3.5 inline mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5 inline mr-1" />
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
      </div>

      <EmployeeSetupModal
        open={showEmployeeModal}
        onClose={() => {
          setShowEmployeeModal(false);
          setEditEmployee(null);
        }}
        editingEmployee={editEmployee}
        onSuccess={async (savedEmployee) => {
          if (savedEmployee?.EmployeeInfoID) {
            setEmployees((prev) => {
              if (prev.some((e) => e.EmployeeInfoID === savedEmployee.EmployeeInfoID)) {
                return prev;
              }
              return [...prev, savedEmployee];
            });
          } else {
            setRefreshKey((k) => k + 1);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setRefreshKey((k) => k + 1);
          }
          setCurrentPage(1);
        }}
      />

      <Modal
        open={deleteTarget !== null}
        title="Remove Employee"
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteLoading(false);
        }}
        centered
        footer={
          <div className="flex justify-end items-center gap-3">
            <Button
              onClick={() => {
                setDeleteTarget(null);
                setDeleteLoading(false);
              }}
              className="px-4 h-9 rounded-md text-sm font-medium"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              danger
              loading={deleteLoading}
              onClick={confirmDelete}
              className="px-4 h-9 rounded-md text-sm font-medium"
            >
              Remove
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to remove <strong>{deleteTarget?.Fullname}</strong> from the system?
        </p>
      </Modal>
    </div>
  );
}
