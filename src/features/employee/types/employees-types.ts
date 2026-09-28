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






