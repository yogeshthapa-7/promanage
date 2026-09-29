export interface Department {
  id: string;
  sn: number;
  name: string;
  departmentCode: string;
  parentDepartmentId: number;
  parentDepartmentName: string;
  orderKey: number;
  status: number;
}

export interface DepartmentSelectOption {
  value: string;
  label: string;
}

export interface CreateDepartmentDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface ApiDepartmentResponse {
  data: ApiDepartmentRow[];
  recordsTotal: number;
  recordsFiltered: number;
}

export interface ApiDepartmentRow {
  SN: number;
  DepartmentID: number;
  DepartmentCode: string;
  DepartmentName: string;
  OrderKey: number;
  ParentDepartmentID: number;
  ParentDepartmentName: string;
  Status: number;
}

export interface ApiSelectItem {
  DepartmentID?: number | string;
  DepartmentInfoID?: number | string;
  DepartmentName?: string;
  name?: string;
  id?: number | string;
  ID?: number | string;
  Value?: number | string;
  Text?: string;
  text?: string;
}

export interface FetchDepartmentsParams {
  search: string;
  start: number;
  length: number;
  name?: string;
  code?: string;
  mainDept?: string;
  departmentId?: string;
  signal?: AbortSignal;
}

export interface FetchDepartmentsResult {
  departments: Department[];
  total: number;
  filtered: number;
}






