export interface Branch {
  id: string;
  sn: number;
  name: string;
  branchCode: string;
  mainBranchId: number;
  mainBranchName: string;
  departmentId: number;
  departmentName: string;
  orderKey: number;
}

export interface BranchSelectOption {
  value: string;
  label: string;
}

//localbodylevel:
 export interface BranchPageProps {
  disabledMainBranch?: boolean;
  defaultMainBranchId?: string | number;
  disabledDepartment?: boolean;
  defaultDepartmentId?: string | number;
} 

export interface CreateBranchDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingBranch?: { id: string; name: string; branchCode: string; mainBranchId: number; departmentId: number } | null;
  disabledMainBranch?: boolean;
  defaultMainBranchId?: string | number;
  disabledDepartment?: boolean;
  defaultDepartmentId?: string | number;
}

export interface ApiBranchResponse {
  data: ApiBranchRow[];
  recordsTotal: number;
  recordsFiltered: number;
}

export interface ApiBranchRow {
  SN: number;
  BranchID: number;
  BranchCode: string;
  BranchName: string;
  MainBranchID: number;
  MainBranchName: string;
  DepartmentID: number;
  DepartmentName: string;
  OrderKey: number;
}

export interface ApiSelectItem {
  BranchID?: number | string;
  BranchName?: string;
  name?: string;
  id?: number | string;
  Value?: number | string;
  Text?: string;
}

export interface FetchBranchesParams {
  search: string;
  start: number;
  length: number;
  name?: string;
  code?: string;
  mainBranchId?: number | string;
  mainBranchName?: string;
  departmentId?: number | string;
  departmentName?: string;
  orderKey?: number;
  signal?: AbortSignal;
}

export interface FetchBranchesResult {
  branches: Branch[];
  total: number;
  filtered: number;
}





