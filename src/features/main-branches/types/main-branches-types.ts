export interface MainBranch {
  id: string;
  sn: number;
  name: string;
  mainBranchCode: string;
  departmentId: number;
  departmentName: string;
  orderKey: number;
}

export interface MainBranchSelectOption {
  value: string;
  label: string;
}

export interface CreateMainBranchDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingBranch?: { id: string; name: string; mainBranchCode: string; departmentId: number } | null;
  disabledDepartment?: boolean;
  defaultDepartmentId?: string | number;
}

//localbodyleve:
 export interface MainBranchPageProps {
  disabledDepartment?: boolean;
  defaultDepartmentId?: string | number;
} 

export interface ApiMainBranchResponse {
  data: ApiMainBranchRow[];
  recordsTotal: number;
  recordsFiltered: number;
}

export interface ApiMainBranchRow {
  SN: number;
  MainBranchID: number;
  MainBranchCode: string;
  MainBranchName: string;
  DepartmentID: number;
  DepartmentName: string;
  OrderKey: number;
}

export interface ApiSelectItem {
  MainBranchID?: number | string;
  MainBranchName?: string;
  DepartmentID?: number | string;
  DepartmentName?: string;
  id?: number | string;
  name?: string;
  Value?: number | string;
  Text?: string;
}

export interface FetchMainBranchesParams {
  search: string;
  start: number;
  length: number;
  name?: string;
  code?: string;
  mainBranchId?: number;
  departmentId?: number;
  departmentName?: string;
  orderKey?: number;
  signal?: AbortSignal;
}

export interface FetchMainBranchesResult {
  mainBranches: MainBranch[];
  total: number;
  filtered: number;
}






