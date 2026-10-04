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
  fiscalYearOptions?: import('@/features/fiscal-year/types/fiscal-year-types').FiscalYearSelectOption[];
}

export interface ApiBudgetResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiBudgetRow[];
}

export interface ApiBudgetRow {
  SN: number;
  BudgetInfoID: number;
  BudgetInfoName: string;
  FiscalYear?: string;
  FiscalYearID?: number;
  FiscalYearName?: string;
  FileUpload?: string;
  DocumentUrl?: string;
}

export interface FetchBudgetsParams {
  search: string;
  fiscalYear: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

export interface FetchBudgetsResult {
  budgets: Budget[];
  total: number;
  filtered: number;
}






