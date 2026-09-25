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
