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

export interface ApiFiscalYearResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiFiscalYearRow[];
}

export interface ApiFiscalYearRow {
  FiscalYearID: number;
  FiscalYearName: string;
  FiscalYearCode: string;
  StartDate: string;
  EndDate: string;
  Status: number;
  IsCurrent: number;
  IsRunning: number;
  YearOrder?: number;
}

export interface ApiSelectItem {
  FiscalYearID?: number | string;
  FiscalYearName?: string;
  FiscalYear?: string;
  name?: string;
  id?: number | string;
  Value?: number | string;
  Text?: string;
}

export interface FetchFiscalYearsParams {
  search: string;
  status: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

export interface FetchFiscalYearsResult {
  fiscalYears: FiscalYearItem[];
  total: number;
  filtered: number;
}






