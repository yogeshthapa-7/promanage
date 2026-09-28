export interface FiscalYearSelectOption {
  value: string;
  label: string;
}

export interface FiscalYearItem {
  id: number;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  startDateBs: string;
  endDateBs: string;
  yearOrder?: number;
  isActive?: number;
  isRunning?: number;
}

export interface CreateFiscalYearDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingYear?: FiscalYearItem | null;
}






