export interface Employee {
  EmployeeInfoID: number;
  SN: number;
  Fullname: string;
  Address: string;
  Phone: string;
  Email: string;
  DOB: string;
  DepartmentID: number;
  DepartmentName: string;
  BranchID: number;
  BranchName: string;
  MainBranchID: number;
  MainBranchName: string;
  Gender: number;
  EmpStatus: number;
  Status: number;
  OrganizationOfficeID: number;
  Photo: string;
}

export interface EmployeeSetupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (employee?: Employee) => void;
  editingEmployee?: Employee | null;
}

export interface OrgOfficeItem {
  OrganizationOfficeID: number;
  OrganizationOfficeName: string;
}

export interface DepartmentItem {
  DepartmentInfoID: number;
  DepartmentName: string;
}

export interface MainBranchItem {
  MainBranchID: number;
  MainBranchName: string;
  DepartmentID: number;
}

export interface BranchItem {
  BranchID: number;
  BranchName: string;
  MainBranchID: number;
  DepartmentID: number;
}

export interface ApiEmployeeResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: Employee[];
}

export interface FetchEmployeesParams {
  search: string;
  start: number;
  length: number;
  fullname?: string;
  address?: string;
  phone?: string;
  signal?: AbortSignal;
}

export interface FetchEmployeesResult {
  employees: Employee[];
  total: number;
  filtered: number;
}





