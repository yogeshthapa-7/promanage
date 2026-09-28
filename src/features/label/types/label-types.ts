export interface Label {
  SN: number;
  id: number;
  name: string;
  code: string;
}

export interface CreateLabelDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingLabel?: Label | null;
}








