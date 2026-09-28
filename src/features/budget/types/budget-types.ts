export interface Budget {
  SN: number;
  id: number;
  name: string;
  fiscal_year?: string;
  fiscal_year_id?: number;
  document_url?: string;
  document_name?: string;
}

export interface CreateBudgetDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (savedData?: { id?: number; document_url?: string; isNew?: boolean }) => void;
  editingBudget?: Budget | null;
}

export interface ViewBudgetDrawerProps {
  open: boolean;
  onClose: () => void;
  budget: Budget | null;
  fiscalYearOptions?: FiscalYearSelectOption[];
}






