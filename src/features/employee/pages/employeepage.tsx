import { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, Copy, Printer } from 'lucide-react';
import { Modal, message, Button } from 'antd';
// import Pagination from '@/shared/components/ui/Pagination';
import { TableSkeleton } from '@/shared/components/ui/Loaders';
import AppTable from '@/shared/components/ui/AppTable';
import SearchInput from '@/shared/components/ui/SearchInput';
import { fetchEmployees, deleteEmployee } from '@/features/employee/services/employee.service';
import { type Employee } from '@/features/employee/types/employees-types';
import EmployeeSetupModal from './Create';
import { exportCsv } from '@/shared/utils/csv';
import { usePaginatedList, type PaginatedListParams } from '@/shared/hooks/usePaginatedList';
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

  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedFullname = useDebounce(fullnameFilter, 300);
  const debouncedAddress = useDebounce(addressFilter, 300);
  const debouncedPhone = useDebounce(phoneFilter, 300);

  const queryClient = useQueryClient();

  const {
    data: employees = [],
    total: totalFiltered,
    loading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<Employee>({
    fetcher: async (params: PaginatedListParams) => 
      fetchEmployees({
        search: debouncedSearch,
        start: params.start as number,
        length: params. length as number,
        fullname: debouncedFullname,
        address: debouncedAddress,
        phone: debouncedPhone,
        signal: params.signal,
      }).then((result) => ({
        items: result.employees,
        total: result.filtered,
      })),
      extraDeps: [debouncedSearch, debouncedFullname, debouncedAddress, debouncedPhone],
  });

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
          const result = await deleteEmployee(employee.EmployeeInfoID);
          if (!result.success) throw new Error(result.message || 'Failed to delete employee');
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
    exportCsv(
      'employees.csv',
      [
        { header: 'S.N.', value: (e: Employee) => e.SN },
        { header: 'Full Name', value: (e: Employee) => e.Fullname },
        { header: 'Address', value: (e: Employee) => e.Address },
        { header: 'Phone', value: (e: Employee) => e.Phone },
        { header: 'Email', value: (e: Employee) => e.Email },
        { header: 'Department Name', value: (e: Employee) => e.DepartmentName },
        { header: 'Branch Name', value: (e: Employee) => e.BranchName },
      ],
      employees
    );
    message.success('CSV exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const employeeColumns = [
    {
      title: 'S.N.',
      dataIndex: 'SN',
      key: 'SN',
      width: 80,
      render: (value: number) => <span className="tabular-nums">{value}</span>,
    },
    {
      title: 'Full Name',
      dataIndex: 'Fullname',
      key: 'Fullname',
      render: (value: string) => <span className="font-semibold text-slate-800">{value}</span>,
    },
    {
      title: 'Address',
      dataIndex: 'Address',
      key: 'Address',
    },
    {
      title: 'Phone',
      dataIndex: 'Phone',
      key: 'Phone',
    },
    {
      title: 'Email',
      dataIndex: 'Email',
      key: 'Email',
    },
    {
      title: 'Department Name',
      dataIndex: 'DepartmentName',
      key: 'DepartmentName',
    },
    {
      title: 'Branch Name',
      dataIndex: 'BranchName',
      key: 'BranchName',
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      width: 140,
      render: (_: unknown, record: Employee) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="small" onClick={() => handleEditEmployee(record)} icon={<Edit2 className="h-3.5 w-3.5" />}>Edit</Button>
          <Button size="small" danger onClick={() => handleDeleteEmployee(record)} icon={<Trash2 className="h-3.5 w-3.5" />}>Delete</Button>
        </div>
      ),
    },
  ];

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
            <Button size="small" onClick={handleCSVExport}>CSV</Button>
            <Button size="small" icon={<Printer className="h-3.5 w-3.5" />} onClick={handlePrint}>Print</Button>
          </div>
        </div>
        <div className="mb-2 text-base text-slate-500 no-print">
           Showing {employees.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {(currentPage - 1) * pageSize + employees.length} of {totalFiltered} entries
        </div>
        {loading ? (
          <TableSkeleton columns={7} rows={6} message="Loading employees..." />
        ) : (
          <AppTable
            columns={employeeColumns}
            dataSource={employees}
            rowKey={(record) => record.EmployeeInfoID}
            cardClassName="no-print"
            total={totalFiltered}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            
          />
        )}

         
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







