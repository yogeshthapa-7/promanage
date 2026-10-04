export interface Policy {
  SN: number;
  id: number;
  name: string;
  fiscal_year?: string;
  fiscal_year_id?: number;
  document_url?: string;
  document_name?: string;
}

export interface CreatePolicyDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (savedData?: { id?: number; document_url?: string; isNew?: boolean }) => void;
  editingPolicy?: Policy | null;
}

export interface ViewPolicyDrawerProps {
  open: boolean;
  onClose: () => void;
  policy: Policy | null;
  fiscalYearOptions?: import('@/features/fiscal-year/types/fiscal-year-types').FiscalYearSelectOption[];
}

export interface ApiPolicyResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiPolicyRow[];
}

export interface ApiPolicyRow {
  SN: number;
  PolicyProgramID: number;
  PolicyProgramName: string;
  FiscalYear?: string;
  FiscalYearID?: number;
  FiscalYearName?: string;
  FileUpload?: string;
  DocumentUrl?: string;
}

export interface FetchPoliciesParams {
  search: string;
  fiscalYear: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

export interface FetchPoliciesResult {
  policies: Policy[];
  total: number;
  filtered: number;
}






