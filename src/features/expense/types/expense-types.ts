export interface Expense {
  SN: number;
  id: number;
  title: string;
  code: string;
  fiscal_year?: string;
  fiscal_year_id?: number;
  document_url?: string;
  document_name?: string;
}

export interface CreateExpenseDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (savedData?: { id?: number; document_url?: string; isNew?: boolean }) => void;
  editingExpense?: Expense | null;
}

export interface ViewExpenseDrawerProps {
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
  fiscalYearOptions?: FiscalYearSelectOption[];
}






