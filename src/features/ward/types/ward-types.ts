export interface Ward {
  SN: number;
  id: number;
  wardNumber: string;
  wardCode: string;
}

export interface CreateWardDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingWard?: Ward | null;
}






