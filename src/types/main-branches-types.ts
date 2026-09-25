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
