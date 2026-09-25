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
