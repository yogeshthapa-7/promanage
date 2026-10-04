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
  fiscalYearOptions?: import('@/features/fiscal-year/types/fiscal-year-types').FiscalYearSelectOption[];
}

export interface ApiExpenseResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiExpenseRow[];
}

export interface ApiExpenseRow {
  SN: number;
  ExpenseInfoID: number;
  ExpenseTitle: string;
  ExpenseCode: string;
  FiscalYear?: string;
  FiscalYearID?: number;
  FiscalYearName?: string;
  FileUpload?: string;
  DocumentUrl?: string;
}

export interface FetchExpensesParams {
  search: string;
  fiscalYear: string;
  expenseCode: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

export interface FetchExpensesResult {
  expenses: Expense[];
  total: number;
  filtered: number;
}






