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






