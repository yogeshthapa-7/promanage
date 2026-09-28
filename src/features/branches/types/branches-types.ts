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





